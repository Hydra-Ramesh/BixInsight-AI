const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class PythonBridge {
    constructor() {
        this.baseURL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 300000 // 5 minutes for large file analysis
        });
    }

    async analyzeCSV(filePath, fileName, socketCallback) {
        try {
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath), fileName);

            if (socketCallback) socketCallback('cleaning', 'Starting data cleaning...');

            const response = await this.client.post('/analyze', form, {
                headers: {
                    ...form.getHeaders()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            return response.data;
        } catch (error) {
            console.error('Python service error:', error.message);
            throw new Error(
                error.response?.data?.detail ||
                'Failed to connect to AI analysis service. Make sure the Python service is running.'
            );
        }
    }

    async chatWithData(question, context, chatHistory) {
        try {
            const response = await this.client.post('/chat', {
                question,
                context,
                chat_history: chatHistory || []
            }, {
                timeout: 60000 // 1 minute for chat
            });
            return response.data;
        } catch (error) {
            console.error('Python chat service error:', error.message);
            throw new Error(
                error.response?.data?.detail ||
                'Failed to get AI response. Make sure the Python service is running.'
            );
        }
    }

    async transformData(data, operation, column) {
        try {
            const response = await this.client.post('/transform', {
                data,
                operation,
                column
            });
            return response.data;
        } catch (error) {
            console.error('Python transform error:', error.message);
            throw new Error(
                error.response?.data?.detail ||
                'Failed to transform data. Make sure the Python service is running.'
            );
        }
    }

    async exportPptx(analysis) {
        try {
            const response = await this.client.post('/export/pptx', {
                analysis
            }, {
                responseType: 'arraybuffer' // Request binary data
            });
            return Buffer.from(response.data);
        } catch (error) {
            console.error('Python export pptx error:', error.message);
            throw new Error(
                error.response?.data?.detail ||
                'Failed to generate PowerPoint via Python.'
            );
        }
    }

    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            return { status: 'offline' };
        }
    }
}

module.exports = new PythonBridge();
