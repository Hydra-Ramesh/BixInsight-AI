<p align="center">
  <h1 align="center">📘 BixInsight AI — Complete Documentation</h1>
  <p align="center"><em>AI-Powered Business Intelligence Platform</em></p>
  <p align="center">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
    <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js" />
    <img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb" />
    <img src="https://img.shields.io/badge/Groq-LLM-FF6600" />
    <img src="https://img.shields.io/badge/LangGraph-Agent_Pipeline-blue" />
  </p>
</p>

---

# Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Design & Architecture](#2-system-design--architecture)
   - [High-Level Architecture](#21-high-level-architecture)
   - [Service Breakdown](#22-service-breakdown)
   - [Data Flow](#23-data-flow)
   - [AI Agent Pipeline (LangGraph)](#24-ai-agent-pipeline-langgraph)
   - [Database Schema](#25-database-schema)
   - [Real-Time Communication](#26-real-time-communication)
3. [Features](#3-features)
4. [Tech Stack](#4-tech-stack)
5. [Project Structure](#5-project-structure)
6. [API Reference](#6-api-reference)
   - [Auth Endpoints](#61-authentication-endpoints)
   - [Analysis Endpoints](#62-analysis-endpoints)
   - [Python Service Endpoints](#63-python-service-endpoints)
7. [Setup & Installation](#7-setup--installation)
8. [Environment Variables](#8-environment-variables)
9. [Deployment Guide](#9-deployment-guide)
10. [Contribution Guide](#10-contribution-guide)
11. [License](#11-license)

---

# 1. Project Overview

**BixInsight AI** is a full-stack, AI-powered Business Intelligence platform that transforms raw CSV data into interactive dashboards with AI-generated insights. Users upload their business data and receive:

- **Automated data cleaning** — AI agents detect and fix data quality issues
- **Statistical analysis** — Correlation, trend, and distribution analysis
- **Interactive visualizations** — 7 chart types rendered via Recharts
- **LLM-generated business insights** — Groq's Llama 3.1 provides actionable insights
- **Conversational data chat** — Ask questions about your data in natural language
- **Shareable dashboards** — Generate public links for collaboration
- **PowerPoint export** — Download analysis as presentation slides

---

# 2. System Design & Architecture

## 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                        │
│                     https://bix-insight-ai.vercel.app               │
│                                                                     │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ │
│  │  Login/  │ │ Dashboard │ │ Analysis │ │ History │ │ Profile  │ │
│  │ Register │ │  + Upload │ │   View   │ │  Page   │ │   Page   │ │
│  └──────────┘ └───────────┘ └──────────┘ └─────────┘ └──────────┘ │
│                          │                                          │
│           Socket.IO (Real-time) │ REST API (Axios)                 │
└──────────────────────────┼──────┼───────────────────────────────────┘
                           │      │
                           ▼      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js + Express)                       │
│                  https://bixinsight-ai.onrender.com                 │
│                                                                     │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────────┐ │
│  │  Auth Routes │  │ Analysis Routes│  │   Services              │ │
│  │  /api/auth/* │  │ /api/analysis/*│  │  ┌──────────────────┐   │ │
│  │              │  │                │  │  │  Python Bridge    │   │ │
│  │ • register   │  │ • upload       │  │  │  (HTTP → FastAPI) │   │ │
│  │ • login      │  │ • history      │  │  └──────────────────┘   │ │
│  │ • forgot-pwd │  │ • get/:id      │  │  ┌──────────────────┐   │ │
│  │ • verify-otp │  │ • chat         │  │  │  Email Service   │   │ │
│  │ • reset-pwd  │  │ • share        │  │  │  (Resend API)    │   │ │
│  │ • profile    │  │ • transform    │  │  └──────────────────┘   │ │
│  │ • avatar     │  │ • export/pptx  │  │                         │ │
│  └──────────────┘  └────────────────┘  └─────────────────────────┘ │
│                          │                                          │
│              JWT Auth Middleware │ MongoDB (Mongoose)               │
└──────────────────────────┼──────┼───────────────────────────────────┘
                           │      │
              ┌────────────┘      └──────────────┐
              ▼                                  ▼
┌──────────────────────────────┐   ┌──────────────────────────┐
│    PYTHON SERVICE (FastAPI)  │   │     MongoDB Atlas         │
│    Port 8000                 │   │                          │
│                              │   │  Collections:            │
│  ┌────────────────────────┐  │   │  ├── users               │
│  │  LangGraph Pipeline    │  │   │  └── analyses            │
│  │  ┌──────┐ ┌──────────┐ │  │   │                          │
│  │  │Clean │→│ Analyze  │ │  │   └──────────────────────────┘
│  │  │Agent │ │  Agent   │ │  │
│  │  └──────┘ └──────────┘ │  │
│  │              │         │  │
│  │        ┌─────▼──────┐  │  │
│  │        │Visualize   │  │  │
│  │        │  Agent     │  │  │
│  │        └────────────┘  │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────┐ ┌──────────┐ │
│  │ Chat Agent │ │ ChromaDB │ │
│  │  (RAG)     │ │(VectorDB)│ │
│  └────────────┘ └──────────┘ │
│                              │
│  ┌────────────┐ ┌──────────┐ │
│  │ Data       │ │ PPTX     │ │
│  │ Transform  │ │ Export   │ │
│  └────────────┘ └──────────┘ │
└──────────────────────────────┘
```

## 2.2 Service Breakdown

| Service | Technology | Port | Deployment | Purpose |
|---------|-----------|------|------------|---------|
| **Client** | React 19 + Vite 8 | 5173 | Vercel | User interface, interactive charts, real-time updates |
| **Server** | Node.js + Express | 5000 | Render | REST API, authentication, file handling, WebSocket hub |
| **Python Service** | FastAPI + Uvicorn | 8000 | Render | AI analysis pipeline, LLM orchestration, data processing |
| **Database** | MongoDB Atlas | — | Atlas Cloud | User data, analysis results, chat history |
| **Vector DB** | ChromaDB | — | Co-located | RAG context storage for conversational AI |

## 2.3 Data Flow

### CSV Upload → Dashboard Flow

```
User uploads CSV
       │
       ▼
[Client] FileUpload component (react-dropzone)
       │ POST /api/analysis/upload (multipart/form-data)
       ▼
[Server] Multer saves to /uploads, creates Analysis record (status: "uploading")
       │ Returns analysisId immediately to client
       │ Processes asynchronously:
       ▼
[Server] PythonBridge.analyzeCSV() → POST /analyze to FastAPI
       │
       ▼
[Python] LangGraph Pipeline executes 3 nodes sequentially:
       │
       ├─ 1. CLEAN NODE  ─→ cleaning_agent.clean_data()
       │     • Removes empty rows/columns, duplicates
       │     • Standardizes column names
       │     • Type conversion (numeric, datetime)
       │     • Missing value imputation (median/mode/ffill)
       │     • Outlier detection (IQR method)
       │     • LLM summarizes cleaning actions
       │
       ├─ 2. ANALYZE NODE ─→ analysis_agent.analyze_data()
       │     • Statistical summaries (mean, median, std, skew)
       │     • Correlation analysis (Pearson matrix, |r| > 0.5)
       │     • Trend detection (first-half vs second-half comparison)
       │     • Category distributions
       │     • LLM generates 5-7 business insights
       │     • LLM creates executive summary
       │
       └─ 3. VISUALIZE NODE ─→ visualization_agent.generate_visualizations()
             • Generates 6 chart types from data
             • Creates both Recharts JSON + Matplotlib base64 images
             • LLM ranks & recommends most insightful charts
             • Builds dynamic filters (select, range, date)
             • Prepares cleaned data sample (50 rows)
       │
       ▼
[Server] Saves results to MongoDB Analysis document
       │ Emits Socket.IO event: analysis:progress → "completed"
       ▼
[Client] Receives real-time update, navigates to AnalysisView
       │ Renders interactive Recharts dashboard
       ▼
User sees: Charts + Insights + Filters + Data Table + Chat
```

## 2.4 AI Agent Pipeline (LangGraph)

The core intelligence uses **LangGraph** to orchestrate a stateful, multi-step pipeline:

```
                    ┌─────────────────────────┐
                    │     AnalysisState        │
                    │                         │
                    │  df: DataFrame          │
                    │  cleaning_report: str   │
                    │  summary: str           │
                    │  insights: list         │
                    │  charts: list           │
                    │  filters: list          │
                    │  columns_meta: list     │
                    │  stats_summary: dict    │
                    │  correlations: list     │
                    │  trends: list           │
                    │  cleaned_data_sample    │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼───────────┐
                    │     CLEAN NODE        │
                    │  cleaning_agent.py    │
                    │                       │
                    │  Pandas operations:   │
                    │  • dropna(how='all')  │
                    │  • drop_duplicates()  │
                    │  • to_numeric()       │
                    │  • to_datetime()      │
                    │  • fillna(median)     │
                    │  • IQR outlier detect │
                    │                       │
                    │  LLM: Summarize       │
                    │  cleaning actions     │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │    ANALYZE NODE       │
                    │  analysis_agent.py    │
                    │                       │
                    │  NumPy/Pandas:        │
                    │  • describe() stats   │
                    │  • .corr() matrix     │
                    │  • Trend detection    │
                    │  • value_counts()     │
                    │                       │
                    │  LLM: Generate 5-7    │
                    │  business insights    │
                    │  + executive summary  │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │   VISUALIZE NODE      │
                    │ visualization_agent.py│
                    │                       │
                    │  Chart Generation:    │
                    │  • Bar (metrics)      │
                    │  • Line (time series) │
                    │  • Pie (categories)   │
                    │  • Scatter (corr)     │
                    │  • Area (grouped)     │
                    │  • Heatmap (corr mat) │
                    │                       │
                    │  Matplotlib + Seaborn │
                    │  → base64 PNG images  │
                    │                       │
                    │  LLM: Rank & recommend│
                    │  most valuable charts │
                    └───────────┬───────────┘
                                │
                                ▼
                           END (return)
```

**LLM Model Used:** `llama-3.1-8b-instant` via Groq API (ultra-fast inference)

## 2.5 Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String (required, 2-50 chars),
  email: String (required, unique, lowercase),
  password: String (bcrypt hashed, salt rounds: 12),
  avatar: String (path to uploaded image),
  company: String,
  resetOtp: String (6-digit OTP, nullable),
  resetOtpExpiry: Date (10 min TTL, nullable),
  createdAt: Date,
  updatedAt: Date
}
```

### Analyses Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  fileName: String,
  fileSize: Number,
  status: Enum ["uploading", "cleaning", "analyzing", "visualizing", "completed", "failed"],
  rowCount: Number,
  columnCount: Number,
  columns: [{
    name: String,
    dtype: String,
    nullCount: Number,
    uniqueCount: Number,
    sample: [Mixed]
  }],
  summary: String,
  cleaningReport: String,
  charts: [{
    chartType: Enum ["bar", "line", "pie", "area", "scatter", "radar", "composed"],
    title: String,
    description: String,
    xKey: String,
    yKeys: [String],
    data: [Mixed],
    colors: [String],
    imageBase64: String
  }],
  insights: [{
    category: Enum ["trend", "anomaly", "correlation", "summary", "recommendation"],
    title: String,
    description: String,
    importance: Enum ["high", "medium", "low"],
    metric: String,
    value: String
  }],
  filters: [{
    column: String,
    type: Enum ["select", "range", "date", "search"],
    options: [Mixed]
  }],
  cleanedDataSample: [[Mixed]],
  chatHistory: [{
    role: Enum ["user", "assistant"],
    content: String,
    timestamp: Date
  }],
  shareToken: String (unique, sparse index),
  error: String,
  createdAt: Date,
  updatedAt: Date
}
// Compound index: { userId: 1, createdAt: -1 }
```

## 2.6 Real-Time Communication

**Socket.IO** provides bidirectional real-time events:

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `authenticate` | Client → Server | `userId` | Map user to socket for targeted events |
| `analysis:progress` | Server → Client | `{ analysisId, status, message }` | Live pipeline progress updates |
| `disconnect` | Auto | — | Cleanup user-socket mapping |

**Statuses emitted during analysis:**
`uploading` → `cleaning` → `analyzing` → `visualizing` → `completed` (or `failed`)

---

# 3. Features

## 🔐 Authentication & User Management
- **JWT-based authentication** (7-day token expiry)
- **User registration** with email, name, company, and password
- **Secure login** with bcrypt password hashing (12 salt rounds)
- **Forgot password** flow with 6-digit OTP via email (10-min expiry)
- **OTP verification** + short-lived reset token (5-min expiry)
- **Profile management** — update name, company, avatar
- **Avatar upload** — image files (JPG, PNG, GIF, WebP), 5MB limit
- **Email notifications** — welcome email, login alerts, OTP delivery (via Resend API)

## 📤 Data Upload & Processing
- **Drag & drop CSV upload** via react-dropzone
- **50MB file size limit** with CSV validation
- **Multi-encoding support** — UTF-8, Latin-1, CP1252, ISO-8859-1
- **Minimum 2 columns** required for analysis
- **Automatic file cleanup** after processing

## 🧹 AI-Powered Data Cleaning
- Removal of completely empty rows and columns
- Duplicate row detection and removal
- Column name standardization (lowercase, snake_case)
- Intelligent type conversion (numeric, datetime)
- Currency symbol stripping for numeric detection
- Missing value imputation:
  - Numeric → median fill
  - Categorical → mode fill
  - DateTime → forward/backward fill
- Columns with >60% missing values are dropped
- Outlier detection using IQR method (3×IQR threshold)
- LLM-generated cleaning summary

## 📊 Interactive Visualizations (7 Chart Types)
| Chart Type | Use Case | Library |
|-----------|----------|---------|
| **Bar** | Key metrics overview, top-N rankings | Recharts + Matplotlib |
| **Line** | Time series trends | Recharts + Matplotlib |
| **Pie** | Category distributions | Recharts + Matplotlib |
| **Area** | Grouped numeric by category | Recharts + Matplotlib |
| **Scatter** | Correlation visualization | Recharts + Seaborn |
| **Radar** | Multi-dimensional comparison | Recharts |
| **Composed** | Mixed chart overlays | Recharts |

- **Dual rendering**: Interactive Recharts (frontend) + static Matplotlib/Seaborn (PPTX export)
- **AI-ranked charts**: LLM selects and recommends the most insightful visualizations
- **Premium dark theme** color palette with 12 curated colors

## 🧠 AI Business Insights
- **5-7 categorized insights** per analysis:
  - 📈 **Trends** — growth/decline detection with % change
  - 🔴 **Anomalies** — unusual patterns in data
  - 🔗 **Correlations** — significant relationships (|r| > 0.5)
  - 📋 **Summaries** — key statistical findings
  - 💡 **Recommendations** — actionable business advice
- Each insight has **importance level** (high/medium/low), metric, and value
- **Executive summary** — 3-4 sentence dataset overview
- Fallback statistical insights if LLM is unavailable

## 💬 Conversational Data Chat (RAG)
- Ask natural language questions about your uploaded data
- **Context-aware** — uses analysis summary, columns, sample data, insights
- **RAG pipeline** — ChromaDB vector store retrieves relevant context
- **Chat history** — maintains conversation continuity (last 10 messages)
- **Dynamic chart generation** — user can request charts via chat
- Supported chat-generated chart types: bar, line, pie, area, scatter

## 🔍 Dynamic Filters
- **Select filters** for categorical columns (≤50 unique values)
- **Range sliders** for numeric columns (min-max)
- **Date pickers** for datetime columns

## 🔗 Sharing & Collaboration
- **Generate shareable links** with unique UUID tokens
- **Public read-only view** — no authentication required
- **Revoke links** — disable shared access anytime
- Shows creator name and company on shared dashboards

## 🛠️ Interactive Data Cleaning (ETL)
Post-analysis data transformation operations:
- `drop_column` — Remove a column
- `fill_mean` — Fill missing numeric values with mean
- `fill_zero` — Fill missing numeric values with zero
- `drop_na` — Drop rows with missing values in a column

## 📥 Export
- **PowerPoint (PPTX)** — Full analysis as a presentation:
  - Title slide with file metadata
  - Executive summary slide
  - Chart slides with base64 images + AI recommendations
  - Key insights slide (top 5)
  - 16:9 widescreen format

## 📜 Analysis History
- Paginated history of all analyses
- Displays: file name, size, status, row/column counts, date
- Quick navigation to any past analysis
- Delete old analyses

---

# 4. Tech Stack

## Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.2 | UI framework |
| Vite | 8.0 | Build tool & dev server |
| React Router DOM | 7.13 | Client-side routing |
| Recharts | 3.8 | Interactive chart library |
| Axios | 1.13 | HTTP client |
| Socket.IO Client | 4.8 | Real-time WebSocket |
| Lucide React | 0.577 | Icon library |
| React Dropzone | 15.0 | Drag & drop file upload |
| jsPDF | 4.2 | PDF generation |
| html2canvas | 1.4 | DOM-to-image capture |

## Backend (Node.js)
| Package | Version | Purpose |
|---------|---------|---------|
| Express | 4.19 | Web framework |
| Mongoose | 8.4 | MongoDB ODM |
| Socket.IO | 4.7 | WebSocket server |
| JSON Web Token | 9.0 | Authentication |
| bcryptjs | 2.4 | Password hashing |
| Multer | 1.4 | File upload middleware |
| Axios | 1.7 | HTTP client (→ Python) |
| Resend | 6.9 | Transactional email |
| form-data | 4.0 | Multipart form building |

## Python AI Service
| Package | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.111 | API framework |
| Uvicorn | 0.30 | ASGI server |
| Pandas | 2.2 | Data manipulation |
| NumPy | 1.26 | Numerical computing |
| LangChain | 0.2 | LLM framework |
| LangChain-Groq | 0.1 | Groq LLM provider |
| LangGraph | 0.1 | Agent orchestration |
| ChromaDB | 0.5 | Vector database |
| Matplotlib | 3.9 | Static chart generation |
| Seaborn | 0.13 | Statistical visualizations |
| scikit-learn | 1.5 | ML utilities |
| python-pptx | 1.0 | PowerPoint generation |

---

# 5. Project Structure

```
BixInsight AI/
├── package.json                    # Root: workspace scripts
│
├── client/                         # ───── FRONTEND ─────
│   ├── index.html                  # Entry HTML
│   ├── vite.config.js              # Vite configuration
│   ├── vercel.json                 # Vercel deployment (SPA rewrites)
│   ├── package.json                # Frontend dependencies
│   └── src/
│       ├── main.jsx                # App bootstrap (providers)
│       ├── App.jsx                 # Route definitions
│       ├── index.css               # Global styles (dark theme)
│       ├── context/
│       │   ├── AuthContext.jsx      # JWT auth state management
│       │   ├── SocketContext.jsx    # Socket.IO connection manager
│       │   └── ThemeContext.jsx     # Theme state (dark/light)
│       ├── components/
│       │   ├── Navbar.jsx / .css    # Navigation bar
│       │   ├── FileUpload.jsx / .css # Drag-drop CSV uploader
│       │   └── ChatPanel.jsx / .css  # AI chat interface
│       └── pages/
│           ├── Login.jsx            # Login page
│           ├── Register.jsx         # Registration page
│           ├── ForgotPassword.jsx   # Password reset (OTP flow)
│           ├── Dashboard.jsx / .css  # Main dashboard + upload
│           ├── AnalysisView.jsx / .css # Full analysis dashboard
│           ├── SharedView.jsx       # Public shared analysis
│           ├── History.jsx / .css    # Analysis history list
│           ├── Profile.jsx / .css    # User profile
│           └── Auth.css             # Shared auth styles
│
├── server/                         # ───── BACKEND ─────
│   ├── index.js                    # Express + Socket.IO entry
│   ├── package.json                # Backend dependencies
│   ├── .env                        # Environment variables
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── middleware/
│   │   └── auth.js                 # JWT verification middleware
│   ├── models/
│   │   ├── User.js                 # User schema + bcrypt hooks
│   │   └── Analysis.js             # Analysis schema (charts, insights)
│   ├── routes/
│   │   ├── auth.js                 # Auth endpoints (13 routes)
│   │   └── analysis.js             # Analysis endpoints (8 routes)
│   ├── services/
│   │   ├── pythonBridge.js          # HTTP client → Python service
│   │   └── emailService.js         # Resend email templates
│   └── uploads/                    # Temp file storage
│
└── python-service/                 # ───── AI ENGINE ─────
    ├── main.py                     # FastAPI entry + endpoints
    ├── requirements.txt            # Python dependencies
    ├── .env                        # GROQ_API_KEY
    ├── data_transform.py           # ETL operations
    ├── export_pptx.py              # PowerPoint generator
    ├── agents/
    │   ├── __init__.py
    │   ├── graph.py                # LangGraph pipeline definition
    │   ├── cleaning_agent.py       # Data cleaning agent
    │   ├── analysis_agent.py       # Statistical analysis agent
    │   ├── visualization_agent.py  # Chart generation agent
    │   └── chat_agent.py           # RAG chat agent
    ├── utils/
    │   ├── __init__.py
    │   └── vector_store.py         # ChromaDB wrapper
    └── chroma_db/                  # Vector DB persistent storage
```

---

# 6. API Reference

## 6.1 Authentication Endpoints

Base URL: `/api/auth`

| Method | Endpoint | Auth | Body | Response | Description |
|--------|----------|------|------|----------|-------------|
| POST | `/register` | No | `{ name, email, password, company }` | `{ token, user }` | Create new account |
| POST | `/login` | No | `{ email, password }` | `{ token, user }` | Sign in |
| GET | `/me` | Yes | — | `{ user }` | Get current user |
| POST | `/forgot-password` | No | `{ email }` | `{ message }` | Send OTP email |
| POST | `/verify-otp` | No | `{ email, otp }` | `{ resetToken }` | Verify 6-digit OTP |
| POST | `/reset-password` | No | `{ resetToken, newPassword }` | `{ message }` | Reset password |
| PUT | `/profile` | Yes | `{ name?, company? }` | `{ user, message }` | Update profile |
| PUT | `/profile/avatar` | Yes | `FormData: avatar` | `{ user, message }` | Upload avatar (5MB max) |

## 6.2 Analysis Endpoints

Base URL: `/api/analysis`

| Method | Endpoint | Auth | Body | Response | Description |
|--------|----------|------|------|----------|-------------|
| POST | `/upload` | Yes | `FormData: file` | `{ analysisId, message }` | Upload CSV & start analysis |
| GET | `/history` | Yes | Query: `page, limit` | `{ analyses[], pagination }` | Paginated history |
| GET | `/:id` | Yes | — | Full analysis object | Get specific analysis |
| DELETE | `/:id` | Yes | — | `{ message }` | Delete analysis |
| POST | `/:id/chat` | Yes | `{ question }` | `{ answer, sources }` | Chat with data |
| POST | `/:id/share` | Yes | `{ enable: bool }` | `{ shareToken }` or `{ message }` | Toggle sharing |
| GET | `/shared/:token` | No | — | Full analysis object | View shared analysis |
| POST | `/:id/transform` | Yes | `{ operation, column }` | Updated analysis | Apply ETL operation |
| GET | `/:id/export/pptx` | Yes | — | Binary PPTX file | Download PowerPoint |

## 6.3 Python Service Endpoints

Base URL: `http://localhost:8000`

| Method | Endpoint | Body | Response | Description |
|--------|----------|------|----------|-------------|
| GET | `/health` | — | `{ status, service, version }` | Health check |
| POST | `/analyze` | `FormData: file` | Full analysis result | Run AI pipeline on CSV |
| POST | `/chat` | `{ question, context, chat_history }` | `{ answer, sources }` | RAG-powered chat |
| POST | `/transform` | `{ data, operation, column }` | `{ status, columns, rowCount, sampleData }` | ETL transform |
| POST | `/export/pptx` | `{ analysis }` | Binary PPTX | Generate PowerPoint |

---

# 7. Setup & Installation

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.11+
- **MongoDB** (local or Atlas URI)
- **Groq API Key** — get one at [console.groq.com](https://console.groq.com)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Hydra-Ramesh/BixInsight-AI.git
cd BixInsight-AI
```

### Step 2: Install All Dependencies

```bash
# One command to install everything:
npm run install:all

# Or install individually:
cd server && npm install
cd ../client && npm install
cd ../python-service && pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

**`server/.env`**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bixinsight
JWT_SECRET=your-super-secret-jwt-key
PYTHON_SERVICE_URL=http://localhost:8000
RESEND_API_KEY=re_your_resend_key          # Optional: for email
EMAIL_FROM=BixInsight AI <onboarding@resend.dev>
```

**`python-service/.env`**
```env
GROQ_API_KEY=gsk_your_groq_api_key
```

### Step 4: Start All Services (3 Terminals)

```bash
# Terminal 1 — Backend API
cd server && npm run dev

# Terminal 2 — AI Engine
cd python-service && python main.py

# Terminal 3 — Frontend
cd client && npm run dev
```

### Step 5: Open the App

Visit **http://localhost:5173** in your browser.

---

# 8. Environment Variables

| Variable | Service | Required | Default | Description |
|----------|---------|----------|---------|-------------|
| `PORT` | Server | No | `5000` | Express server port |
| `MONGODB_URI` | Server | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | Server | **Yes** | — | JWT signing secret |
| `PYTHON_SERVICE_URL` | Server | No | `http://localhost:8000` | Python service URL |
| `RESEND_API_KEY` | Server | No | — | Resend email API key |
| `EMAIL_FROM` | Server | No | `BixInsight AI <onboarding@resend.dev>` | Email sender address |
| `GROQ_API_KEY` | Python | **Yes** | — | Groq LLM API key |
| `CHROMA_DB_PATH` | Python | No | `./chroma_db` | ChromaDB storage path |

---

# 9. Deployment Guide

## Frontend → Vercel

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set framework: **Vite**
3. Root directory: `client`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add `vercel.json` (already included):
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```

## Backend → Render

1. Create a **Web Service** on [Render](https://render.com)
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add all server environment variables

## Python Service → Render

1. Create another **Web Service**
2. Root directory: `python-service`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Set `GROQ_API_KEY` environment variable
6. Set Python version: `3.11` (via `.python-version` file)

## Update CORS Origins

After deployment, update the allowed origins in:
- `server/index.js` — Socket.IO and Express CORS
- `python-service/main.py` — FastAPI CORS middleware

---

# 10. Contribution Guide

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. Create a **feature branch**: `git checkout -b feature/your-feature-name`
4. Make your changes
5. **Commit** with descriptive messages: `git commit -m "feat: add data export to CSV"`
6. **Push** to your fork: `git push origin feature/your-feature-name`
7. Open a **Pull Request** against the `main` branch

## Branch Naming Convention

| Prefix | Usage | Example |
|--------|-------|---------|
| `feature/` | New features | `feature/csv-export` |
| `fix/` | Bug fixes | `fix/chart-rendering-issue` |
| `docs/` | Documentation | `docs/api-reference` |
| `refactor/` | Code refactoring | `refactor/cleanup-analysis-agent` |
| `test/` | Adding tests | `test/auth-endpoints` |

## Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

**Examples:**
```
feat(chat): add dynamic chart generation from chat
fix(upload): handle large CSV files with special characters
docs(readme): update deployment instructions
refactor(agents): optimize visualization agent performance
```

## Code Style Guidelines

### JavaScript / React
- Use **functional components** with hooks
- Use **async/await** for asynchronous operations
- Use **descriptive variable names** (camelCase)
- Add JSDoc comments for utility functions
- Keep components focused — one responsibility per component
- Use context providers for shared state (Auth, Socket, Theme)

### Python
- Follow **PEP 8** style guide
- Use **type hints** for function parameters
- Add **docstrings** to all functions and classes
- Use **f-strings** for string formatting
- Keep agent functions pure — input state, output state
- Handle LLM errors gracefully with fallback logic

### CSS
- Use **CSS custom properties** (variables) for theming
- Follow **BEM-like** naming: `.component-name`, `.component-name__element`
- Dark theme as default
- Use `backdrop-filter` for glassmorphism effects

## Adding a New AI Agent

1. Create `python-service/agents/your_agent.py`
2. Define your agent function: `def your_function(state: dict) -> dict`
3. Add a node wrapper in `graph.py`:
   ```python
   def your_node(state: AnalysisState) -> AnalysisState:
       state["status"] = "your_step"
       return your_function(state)
   ```
4. Register the node in `create_analysis_graph()`:
   ```python
   workflow.add_node("your_step", your_node)
   workflow.add_edge("previous_step", "your_step")
   ```
5. Add any new state fields to `AnalysisState` TypedDict

## Adding a New API Endpoint

1. Add the route in the appropriate file under `server/routes/`
2. Use the `auth` middleware for protected routes
3. Update the `PythonBridge` class if calling the Python service
4. Add corresponding FastAPI endpoint in `python-service/main.py`
5. Update this documentation

## Adding a New Frontend Page

1. Create `client/src/pages/YourPage.jsx` and `.css`
2. Add the route in `client/src/App.jsx`
3. Wrap with `<PrivateRoute>` or `<PublicRoute>` as needed
4. Add navigation link in `Navbar.jsx`

## Testing

### Manual Testing Checklist
- [ ] User registration and login flow
- [ ] CSV upload (small and large files)
- [ ] Real-time status updates via WebSocket
- [ ] All chart types render correctly
- [ ] AI insights are generated
- [ ] Chat responses are relevant
- [ ] Share link generation and access
- [ ] Data transform operations
- [ ] PPTX export downloads correctly
- [ ] Forgot password OTP flow
- [ ] Profile and avatar updates
- [ ] Responsive design on mobile

### Running the Dev Environment
```bash
# Start all 3 services for local testing
npm run server   # Terminal 1
npm run python   # Terminal 2
npm run client   # Terminal 3
```

## Reporting Issues

When reporting bugs, please include:
1. **Steps to reproduce** the issue
2. **Expected behavior** vs **actual behavior**
3. **Browser/OS** information
4. **Console logs** (browser + server)
5. **Screenshots** if applicable
6. **CSV file** that triggered the issue (if data-related)

---

# 11. License

This project is private. All rights reserved.

---

<p align="center">
  <strong>Built with ❤️ by the BixInsight AI Team</strong><br>
  <em>AI-Powered Business Intelligence for Everyone</em>
</p>
