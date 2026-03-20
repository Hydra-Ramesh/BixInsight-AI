# BixInsight AI 🧠

> AI-powered Business Intelligence Platform

Upload your business CSV data and get instant, interactive dashboards with AI-generated insights.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Recharts, Socket.IO |
| Backend | Node.js, Express, Socket.IO, JWT, MongoDB |
| AI Engine | Python, LangChain, LangGraph, Groq LLM |
| Data Processing | Pandas, NumPy, Seaborn, Matplotlib |
| Vector DB | ChromaDB |

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB running locally (or Atlas URI)
- Groq API Key ([console.groq.com](https://console.groq.com))

### 1. Install Dependencies
```bash
# Backend
cd server && npm install

# Frontend
cd client && npm install

# Python service
cd python-service && pip install -r requirements.txt
```

### 2. Configure Environment
Edit `server/.env` and `python-service/.env`:
```
GROQ_API_KEY=your_key_here
MONGODB_URI=mongodb://localhost:27017/bixinsight
```

### 3. Start All Services (3 terminals)
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Python AI Service
cd python-service && python main.py

# Terminal 3 - Frontend
cd client && npm run dev
```

### 4. Open
Visit **http://localhost:5173** in your browser.

## Features
- 🔐 JWT Authentication
- 📤 Drag & drop CSV upload
- 🧹 AI-powered data cleaning
- 📊 Interactive charts (Bar, Line, Pie, Area, Scatter)
- 🧠 LLM-generated business insights
- 🔍 Dynamic filters
- 📈 Real-time WebSocket progress
- 📜 Analysis history
