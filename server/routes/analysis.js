const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Analysis = require('../models/Analysis');
const pythonBridge = require('../services/pythonBridge');

const router = express.Router();

// Configure multer for CSV uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' ||
            file.originalname.endsWith('.csv') ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

// POST /api/analysis/upload - Upload CSV and trigger analysis
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No CSV file uploaded' });
        }

        // Create analysis record
        const analysis = new Analysis({
            userId: req.userId,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            status: 'uploading'
        });
        await analysis.save();

        // Emit socket event for upload started
        const io = req.app.get('io');
        const userSocket = req.app.get('userSockets')?.get(req.userId.toString());

        const emitProgress = (status, message) => {
            analysis.status = status;
            if (userSocket) {
                io.to(userSocket).emit('analysis:progress', {
                    analysisId: analysis._id,
                    status,
                    message
                });
            }
        };

        // Return immediately with analysis ID
        res.status(201).json({
            analysisId: analysis._id,
            message: 'File uploaded, analysis starting...'
        });

        // Process asynchronously
        try {
            emitProgress('cleaning', 'AI agents are cleaning your data...');

            // Call Python service
            const result = await pythonBridge.analyzeCSV(
                req.file.path,
                req.file.originalname,
                emitProgress
            );

            // Update analysis with results
            analysis.status = 'completed';
            analysis.rowCount = result.row_count || 0;
            analysis.columnCount = result.column_count || 0;
            analysis.columns = result.columns || [];
            analysis.summary = result.summary || '';
            analysis.cleaningReport = result.cleaning_report || '';
            analysis.charts = result.charts || [];
            analysis.insights = result.insights || [];
            analysis.filters = result.filters || [];
            analysis.cleanedDataSample = result.cleaned_data_sample || [];
            await analysis.save();

            emitProgress('completed', 'Analysis complete! Your dashboard is ready.');

        } catch (error) {
            console.error('Analysis error:', error);
            analysis.status = 'failed';
            analysis.error = error.message;
            await analysis.save();
            emitProgress('failed', `Analysis failed: ${error.message}`);
        }

        // Clean up uploaded file
        try {
            fs.unlinkSync(req.file.path);
        } catch (e) { /* ignore cleanup errors */ }

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

// GET /api/analysis/history - Get user's analysis history
router.get('/history', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const analyses = await Analysis.find({ userId: req.userId })
            .select('fileName fileSize status rowCount columnCount summary createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Analysis.countDocuments({ userId: req.userId });

        res.json({
            analyses,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching history' });
    }
});

// GET /api/analysis/:id - Get a specific analysis
router.get('/:id', auth, async (req, res) => {
    try {
        const analysis = await Analysis.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!analysis) {
            return res.status(404).json({ message: 'Analysis not found' });
        }

        res.json(analysis);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching analysis' });
    }
});

// DELETE /api/analysis/:id - Delete an analysis
router.delete('/:id', auth, async (req, res) => {
    try {
        const analysis = await Analysis.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!analysis) {
            return res.status(404).json({ message: 'Analysis not found' });
        }

        res.json({ message: 'Analysis deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting analysis' });
    }
});

// POST /api/analysis/:id/chat - Chat with AI about the data
router.post('/:id/chat', auth, async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ message: 'Question is required' });
        }

        // Get the analysis
        const analysis = await Analysis.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!analysis) {
            return res.status(404).json({ message: 'Analysis not found' });
        }

        if (analysis.status !== 'completed') {
            return res.status(400).json({ message: 'Analysis must be completed before chatting' });
        }

        // Build context from analysis data
        const context = {
            file_name: analysis.fileName,
            summary: analysis.summary || '',
            columns: analysis.columns || [],
            sample_data: analysis.cleanedDataSample?.slice(0, 20) || [],
            cleaning_report: analysis.cleaningReport || '',
            insights: analysis.insights?.map(i => ({
                category: i.category,
                title: i.title,
                description: i.description
            })) || []
        };

        // Get recent chat history for context
        const chatHistory = (analysis.chatHistory || [])
            .slice(-10)
            .map(m => ({ role: m.role, content: m.content }));

        // Call Python service
        const result = await pythonBridge.chatWithData(question, context, chatHistory);

        // Save chat history
        analysis.chatHistory.push(
            { role: 'user', content: question },
            { role: 'assistant', content: result.answer }
        );
        await analysis.save();

        res.json({
            answer: result.answer,
            sources: result.sources || []
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ message: error.message || 'Failed to get AI response' });
    }
});

// POST /api/analysis/:id/share - Generate or revoke a share link
router.post('/:id/share', auth, async (req, res) => {
    try {
        const { enable } = req.body; // true to generate, false to revoke
        const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.userId });

        if (!analysis) return res.status(404).json({ message: 'Analysis not found' });

        if (enable) {
            if (!analysis.shareToken) {
                analysis.shareToken = crypto.randomUUID();
                await analysis.save();
            }
            res.json({ shareToken: analysis.shareToken });
        } else {
            analysis.shareToken = undefined;
            await analysis.save();
            res.json({ message: 'Share link revoked' });
        }
    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/analysis/shared/:token - Public endpoint to view a shared analysis
router.get('/shared/:token', async (req, res) => {
    try {
        const analysis = await Analysis.findOne({ shareToken: req.params.token })
            .populate('userId', 'name company'); // Show who created it

        if (!analysis) return res.status(404).json({ message: 'Link invalid or expired' });

        res.json(analysis);
    } catch (error) {
        console.error('Shared analysis error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/analysis/:id/transform - Interactive Data Cleaning
router.post('/:id/transform', auth, async (req, res) => {
    try {
        const { operation, column } = req.body;
        const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.userId });
        
        if (!analysis) return res.status(404).json({ message: 'Analysis not found' });
        if (!analysis.cleanedDataSample || analysis.cleanedDataSample.length === 0) {
            return res.status(400).json({ message: 'No data available to transform' });
        }

        try {
            const pythonResult = await pythonBridge.transformData(
                analysis.cleanedDataSample, 
                operation, 
                column
            );

            if (pythonResult.status === 'error') {
                throw new Error(pythonResult.message);
            }

            analysis.cleaningReport += `\n[User Triggered] ${operation} applied to column '${column}'. Data refreshed.`;
            analysis.columns = pythonResult.columns;
            analysis.columnCount = pythonResult.columnCount;
            analysis.rowCount = pythonResult.rowCount;
            analysis.cleanedDataSample = pythonResult.sampleData;
            
            await analysis.save();
            res.json(analysis);
        } catch (err) {
            console.error('Error parsing transform result:', err);
            res.status(500).json({ message: 'ETL transformation failed', details: err.message });
        }
    } catch (error) {
        console.error('Transform API error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/analysis/:id/export/pptx - Export Analysis as PowerPoint
router.get('/:id/export/pptx', auth, async (req, res) => {
    try {
        const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.userId });
        if (!analysis) return res.status(404).json({ message: 'Analysis not found' });

        try {
            const pptxBuffer = await pythonBridge.exportPptx(analysis);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
            res.setHeader('Content-Disposition', `attachment; filename="BixInsight_${analysis.fileName.replace('.csv', '')}_Report.pptx"`);
            res.send(pptxBuffer);
        } catch (err) {
            console.error(`Python PPTX Error:`, err);
            return res.status(500).json({ message: 'Failed to generate PowerPoint' });
        }
    } catch (error) {
        console.error('Export PPTX error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
