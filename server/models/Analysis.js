const mongoose = require('mongoose');

const chartSchema = new mongoose.Schema({
    chartType: {
        type: String,
        enum: ['bar', 'line', 'pie', 'area', 'scatter', 'radar', 'composed'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    xKey: { type: String },
    yKeys: [{ type: String }],
    data: [mongoose.Schema.Types.Mixed],
    colors: [{ type: String }],
    imageBase64: { type: String, default: '' }
}, { _id: true });

const insightSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['trend', 'anomaly', 'correlation', 'summary', 'recommendation'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    importance: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    metric: { type: String, default: '' },
    value: { type: String, default: '' }
}, { _id: true });

const analysisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['uploading', 'cleaning', 'analyzing', 'visualizing', 'completed', 'failed'],
        default: 'uploading'
    },
    rowCount: { type: Number, default: 0 },
    columnCount: { type: Number, default: 0 },
    columns: [{
        name: String,
        dtype: String,
        nullCount: Number,
        uniqueCount: Number,
        sample: [mongoose.Schema.Types.Mixed]
    }],
    summary: {
        type: String,
        default: ''
    },
    cleaningReport: {
        type: String,
        default: ''
    },
    charts: [chartSchema],
    insights: [insightSchema],
    filters: [{
        column: String,
        type: { type: String, enum: ['select', 'range', 'date', 'search'] },
        options: [mongoose.Schema.Types.Mixed]
    }],
    cleanedDataSample: [[mongoose.Schema.Types.Mixed]],
    chatHistory: [{
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    error: { type: String, default: '' },
    shareToken: { type: String, unique: true, sparse: true }
}, {
    timestamps: true
});

// Index for fast user queries
analysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
