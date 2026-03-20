import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts'
import { Lightbulb, Table, BarChart3, TrendingUp, AlertTriangle, Star, Zap, Brain, Sparkles } from 'lucide-react'
import './AnalysisView.css'

const API = 'https://bixinsight-ai.onrender.com/api'

const CHART_COLORS = [
    '#6366f1', '#8b5cf6', '#a78bfa', '#c084fc',
    '#f472b6', '#fb7185', '#f97316', '#fbbf24',
    '#34d399', '#2dd4bf', '#22d3ee', '#60a5fa'
]

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="custom-tooltip">
            <p className="tooltip-label">{label}</p>
            {payload.map((item, i) => (
                <p key={i} style={{ color: item.color }} className="tooltip-value">
                    {item.name}: {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </p>
            ))}
        </div>
    )
}

export default function SharedView() {
    const { token } = useParams()
    const [analysis, setAnalysis] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('charts')

    useEffect(() => {
        const fetchShared = async () => {
            try {
                const res = await axios.get(`${API}/analysis/shared/${token}`)
                setAnalysis(res.data)
            } catch (err) {
                setError('Invalid or expired share link.')
            }
            setLoading(false)
        }
        fetchShared()
    }, [token])

    if (loading) {
        return (
            <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="spinner" />
            </div>
        )
    }

    if (error || !analysis) {
        return (
            <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="glass-card empty-state">
                    <h3>{error || 'Analysis not found'}</h3>
                    <Link to="/login" className="btn btn-primary" style={{ marginTop: 24 }}>Go to Login</Link>
                </div>
            </div>
        )
    }

    const insightIcon = (cat) => {
        switch (cat) {
            case 'trend': return <TrendingUp size={18} />
            case 'anomaly': return <AlertTriangle size={18} />
            case 'correlation': return <Zap size={18} />
            case 'recommendation': return <Star size={18} />
            default: return <Lightbulb size={18} />
        }
    }

    const insightColor = (imp) => {
        switch (imp) {
            case 'high': return 'var(--accent-pink)'
            case 'low': return 'var(--accent-cyan)'
            default: return 'var(--accent-primary)'
        }
    }

    const renderChart = (chart, index) => {
        const data = chart.data
        const colors = chart.colors?.length ? chart.colors : CHART_COLORS

        switch (chart.chartType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey={chart.xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-15} textAnchor="end" />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            {chart.yKeys.map((key, i) => (
                                <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey={chart.xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-15} textAnchor="end" />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {chart.yKeys.map((key, i) => (
                                <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={130} innerRadius={60} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#64748b' }}>
                                {data.map((_, i) => (
                                    <Cell key={i} fill={colors[i % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <defs>
                                {chart.yKeys.map((key, i) => (
                                    <linearGradient key={key} id={`area-gradient-${index}-${i}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey={chart.xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-15} textAnchor="end" />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {chart.yKeys.map((key, i) => (
                                <Area key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} fill={`url(#area-gradient-${index}-${i})`} strokeWidth={2} />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )

            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey={chart.xKey} name={chart.xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis dataKey={chart.yKeys[0]} name={chart.yKeys[0]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Scatter data={data} fill={colors[0]}>
                                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                )

            default:
                return <p>Unsupported chart type: {chart.chartType}</p>
        }
    }

    return (
        <div className="shared-view-wrapper">
            {/* Top Bar Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text-primary)' }}>
                    <div className="brand-icon">
                        <Sparkles size={24} />
                    </div>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>BixInsight<span style={{ background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span></span>
                </Link>
            </div>

            <div className="main-content analysis-page" style={{ paddingLeft: 16, maxWidth: 1200, margin: '0 auto' }}>
                {/* Header */}
                <div className="analysis-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
                    <div>
                        <h1 className="page-title">{analysis.fileName}</h1>
                        <p className="page-subtitle">
                            Shared by: <strong>{analysis.userId?.name || 'A BixInsight User'}</strong> {analysis.userId?.company && `(${analysis.userId.company})`}
                        </p>
                        <p className="page-subtitle" style={{ marginTop: 4 }}>
                            {analysis.rowCount?.toLocaleString()} rows · {analysis.columnCount} columns · {new Date(analysis.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div id="dashboard-content" style={{ padding: '2px' }}>
                    {/* Summary */}
                    {analysis.summary && (
                        <div className="glass-card summary-card">
                            <div className="summary-icon">
                                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.5.5 2.8 1.3 3.8L4 15l3.5-1.5c.8.5 1.8.7 2.8.5l.2-.1" />
                                    <path d="M14.5 2A5.5 5.5 0 0 1 20 7.5c0 1.5-.5 2.8-1.3 3.8L20 15l-3.5-1.5c-.8.5-1.8.7-2.8.5l-.2-.1" />
                                    <path d="M12 2v10" />
                                    <path d="M8 22h8" />
                                    <path d="M12 18v4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="summary-title">AI Summary</h3>
                                <p className="summary-text">{analysis.summary}</p>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="view-tabs" style={{ justifyContent: 'center' }}>
                        <button className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`} onClick={() => setActiveTab('charts')}>
                            <BarChart3 size={16} /> Charts
                        </button>
                        <button className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
                            <Lightbulb size={16} /> Insights ({analysis.insights?.length || 0})
                        </button>
                    </div>

                    <div className="analysis-body" style={{ gridTemplateColumns: '1fr' }}>
                        {/* Main Content */}
                        <div className="analysis-main">
                            {/* Charts Tab */}
                            {activeTab === 'charts' && (
                                <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    {analysis.charts?.map((chart, i) => (
                                        <div key={i} className="glass-card chart-card" style={{ animationDelay: `${i * 0.1}s` }}>
                                            <div className="chart-card-header">
                                                <div>
                                                    <h3 className="chart-title">{chart.title}</h3>
                                                    <p className="chart-description">{chart.description}</p>
                                                    {chart.recommendation && (
                                                        <div className="chart-recommendation" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 12, padding: '8px 12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 6, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                                            <Brain size={14} style={{ color: 'var(--accent-primary)', marginTop: 2, flexShrink: 0 }} />
                                                            <div>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Why this chart?</span>
                                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, marginTop: 2, lineHeight: 1.4 }}>{chart.recommendation}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="chart-body">
                                                {renderChart(chart, i)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Insights Tab */}
                            {activeTab === 'insights' && (
                                <div className="insights-grid">
                                    {analysis.insights?.map((insight, i) => (
                                        <div key={i} className="glass-card insight-card" style={{ animationDelay: `${i * 0.08}s` }}>
                                            <div className="insight-header">
                                                <div className="insight-icon" style={{ color: insightColor(insight.importance), background: `${insightColor(insight.importance)}15` }}>
                                                    {insightIcon(insight.category)}
                                                </div>
                                                <span className={`badge badge-${insight.importance === 'high' ? 'danger' : insight.importance === 'low' ? 'info' : 'warning'}`}>
                                                    {insight.importance}
                                                </span>
                                            </div>
                                            <h3 className="insight-title">{insight.title}</h3>
                                            <p className="insight-description">{insight.description}</p>
                                            {insight.metric && (
                                                <div className="insight-metric">
                                                    <span className="metric-label">{insight.metric}</span>
                                                    {insight.value && <span className="metric-value">{insight.value}</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
