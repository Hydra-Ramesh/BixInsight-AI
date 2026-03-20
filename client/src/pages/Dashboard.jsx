import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import FileUpload from '../components/FileUpload'
import { BarChart3, FileSpreadsheet, Brain, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import './Dashboard.css'

const API = 'https://bixinsight-ai.onrender.com/api'

export default function Dashboard() {
    const { user } = useAuth()
    const { analysisProgress } = useSocket()
    const navigate = useNavigate()
    const [recentAnalyses, setRecentAnalyses] = useState([])
    const [uploading, setUploading] = useState(false)
    const [activeAnalysis, setActiveAnalysis] = useState(null)
    const [stats, setStats] = useState({ total: 0, completed: 0, rows: 0 })

    useEffect(() => {
        fetchRecent()
    }, [])

    // Watch for analysis completion
    useEffect(() => {
        if (activeAnalysis && analysisProgress[activeAnalysis]?.status === 'completed') {
            navigate(`/analysis/${activeAnalysis}`)
        }
    }, [analysisProgress, activeAnalysis, navigate])

    const fetchRecent = async () => {
        try {
            const res = await axios.get(`${API}/analysis/history?limit=5`)
            setRecentAnalyses(res.data.analyses)
            const total = res.data.pagination.total
            const completed = res.data.analyses.filter(a => a.status === 'completed').length
            const rows = res.data.analyses.reduce((sum, a) => sum + (a.rowCount || 0), 0)
            setStats({ total, completed, rows })
        } catch (err) {
            console.error('Failed to fetch analyses')
        }
    }

    const handleUpload = async (file) => {
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await axios.post(`${API}/analysis/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setActiveAnalysis(res.data.analysisId)
        } catch (err) {
            alert(err.response?.data?.message || 'Upload failed')
            setUploading(false)
        }
    }

    const greeting = () => {
        const h = new Date().getHours()
        if (h < 12) return 'Good Morning'
        if (h < 17) return 'Good Afternoon'
        return 'Good Evening'
    }

    const progressStatus = activeAnalysis && analysisProgress[activeAnalysis]

    return (
        <div className="main-content">
            <div className="page-header">
                <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
                <p className="page-subtitle">Upload your business data and let AI do the heavy lifting</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-4 dashboard-stats">
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)' }}>
                        <FileSpreadsheet size={22} />
                    </div>
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Analyses</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: 'var(--accent-green)' }}>
                        <BarChart3 size={22} />
                    </div>
                    <div className="stat-value">{stats.completed}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(244,114,182,0.15)', color: 'var(--accent-pink)' }}>
                        <Brain size={22} />
                    </div>
                    <div className="stat-value">{stats.rows.toLocaleString()}</div>
                    <div className="stat-label">Rows Analyzed</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--accent-orange)' }}>
                        <TrendingUp size={22} />
                    </div>
                    <div className="stat-value">AI</div>
                    <div className="stat-label">Powered Insights</div>
                </div>
            </div>

            {/* Upload Section */}
            <div className="upload-section">
                <FileUpload onUpload={handleUpload} uploading={uploading} />

                {progressStatus && (
                    <div className="analysis-progress glass-card">
                        <div className="progress-content">
                            <div className="progress-spinner">
                                <div className="spinner" />
                            </div>
                            <div className="progress-info">
                                <h3 className="progress-title">
                                    {progressStatus.status === 'cleaning' && '🧹 Cleaning Data...'}
                                    {progressStatus.status === 'analyzing' && '🧠 Analyzing Patterns...'}
                                    {progressStatus.status === 'visualizing' && '📊 Generating Visualizations...'}
                                    {progressStatus.status === 'completed' && '✅ Analysis Complete!'}
                                    {progressStatus.status === 'failed' && '❌ Analysis Failed'}
                                </h3>
                                <p className="progress-message">{progressStatus.message}</p>
                            </div>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{
                                width: progressStatus.status === 'cleaning' ? '33%' :
                                    progressStatus.status === 'analyzing' ? '66%' :
                                        progressStatus.status === 'visualizing' ? '85%' :
                                            progressStatus.status === 'completed' ? '100%' : '10%'
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Analyses */}
            <div className="recent-section">
                <div className="section-header">
                    <h2 className="section-title">Recent Analyses</h2>
                    {recentAnalyses.length > 0 && (
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/history')}>
                            View All <ArrowRight size={14} />
                        </button>
                    )}
                </div>

                {recentAnalyses.length === 0 ? (
                    <div className="glass-card empty-state">
                        <FileSpreadsheet size={60} />
                        <h3>No analyses yet</h3>
                        <p>Upload a CSV file above to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-3">
                        {recentAnalyses.map((analysis, i) => (
                            <div
                                key={analysis._id}
                                className="glass-card analysis-card"
                                onClick={() => analysis.status === 'completed' && navigate(`/analysis/${analysis._id}`)}
                                style={{ animationDelay: `${i * 0.1}s`, cursor: analysis.status === 'completed' ? 'pointer' : 'default' }}
                            >
                                <div className="analysis-card-header">
                                    <FileSpreadsheet size={20} className="file-icon" />
                                    <span className={`badge badge-${analysis.status === 'completed' ? 'success' : analysis.status === 'failed' ? 'danger' : 'warning'}`}>
                                        {analysis.status}
                                    </span>
                                </div>
                                <h3 className="analysis-card-name">{analysis.fileName}</h3>
                                <div className="analysis-card-meta">
                                    <span><Clock size={14} /> {new Date(analysis.createdAt).toLocaleDateString()}</span>
                                    {analysis.rowCount > 0 && <span>{analysis.rowCount.toLocaleString()} rows</span>}
                                </div>
                                {analysis.summary && (
                                    <p className="analysis-card-summary">{analysis.summary.substring(0, 100)}...</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
