import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FileSpreadsheet, Clock, Trash2, ChevronLeft, ChevronRight, Search, BarChart3, AlertCircle } from 'lucide-react'
import './History.css'

const API = 'https://bixinsight-ai.onrender.com/api'

export default function History() {
    const navigate = useNavigate()
    const [analyses, setAnalyses] = useState([])
    const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchHistory(1)
    }, [])

    const fetchHistory = async (page) => {
        setLoading(true)
        try {
            const res = await axios.get(`${API}/analysis/history?page=${page}&limit=12`)
            setAnalyses(res.data.analyses)
            setPagination(res.data.pagination)
        } catch (err) {
            console.error('Failed to fetch history')
        }
        setLoading(false)
    }

    const deleteAnalysis = async (id, e) => {
        e.stopPropagation()
        if (!confirm('Delete this analysis? This action cannot be undone.')) return
        try {
            await axios.delete(`${API}/analysis/${id}`)
            setAnalyses(prev => prev.filter(a => a._id !== id))
            setPagination(prev => ({ ...prev, total: prev.total - 1 }))
        } catch (err) {
            alert('Failed to delete analysis')
        }
    }

    const filtered = analyses.filter(a =>
        a.fileName.toLowerCase().includes(search.toLowerCase())
    )

    const statusIcon = (status) => {
        switch (status) {
            case 'completed': return <BarChart3 size={16} className="status-icon completed" />
            case 'failed': return <AlertCircle size={16} className="status-icon failed" />
            default: return <Clock size={16} className="status-icon pending" />
        }
    }

    return (
        <div className="main-content">
            <div className="page-header">
                <h1 className="page-title">Analysis History</h1>
                <p className="page-subtitle">{pagination.total} total analyses</p>
            </div>

            {/* Search */}
            <div className="history-toolbar">
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        className="form-input search-input"
                        placeholder="Search by filename..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        id="history-search"
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <div className="spinner" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card empty-state">
                    <FileSpreadsheet size={60} />
                    <h3>No analyses found</h3>
                    <p>Upload a CSV file from the dashboard to get started</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/dashboard')}>
                        Go to Dashboard
                    </button>
                </div>
            ) : (
                <>
                    <div className="history-grid">
                        {filtered.map((analysis, i) => (
                            <div
                                key={analysis._id}
                                className="glass-card history-card"
                                onClick={() => analysis.status === 'completed' && navigate(`/analysis/${analysis._id}`)}
                                style={{ animationDelay: `${i * 0.05}s`, cursor: analysis.status === 'completed' ? 'pointer' : 'default' }}
                            >
                                <div className="history-card-top">
                                    <div className="history-file-icon">
                                        <FileSpreadsheet size={24} />
                                    </div>
                                    <div className="history-card-actions">
                                        <button className="btn-icon delete-btn" onClick={(e) => deleteAnalysis(analysis._id, e)} title="Delete">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="history-card-name">{analysis.fileName}</h3>

                                <div className="history-card-info">
                                    <div className="info-row">
                                        {statusIcon(analysis.status)}
                                        <span className={`status-text ${analysis.status}`}>{analysis.status}</span>
                                    </div>
                                    <div className="info-row">
                                        <Clock size={14} />
                                        <span>{new Date(analysis.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    {analysis.rowCount > 0 && (
                                        <div className="info-row">
                                            <span>{analysis.rowCount.toLocaleString()} rows · {analysis.columnCount} cols</span>
                                        </div>
                                    )}
                                </div>

                                {analysis.summary && (
                                    <p className="history-card-summary">{analysis.summary.substring(0, 120)}...</p>
                                )}

                                <div className="history-card-size">
                                    {(analysis.fileSize / 1024).toFixed(1)} KB
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={pagination.current <= 1}
                                onClick={() => fetchHistory(pagination.current - 1)}
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <span className="pagination-info">
                                Page {pagination.current} of {pagination.pages}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={pagination.current >= pagination.pages}
                                onClick={() => fetchHistory(pagination.current + 1)}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
