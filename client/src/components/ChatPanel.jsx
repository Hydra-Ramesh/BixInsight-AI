import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts'
import './ChatPanel.css'

const API = 'https://bixinsight-ai.onrender.com/api'

const CHART_COLORS = [
    '#6366f1', '#8b5cf6', '#a78bfa', '#c084fc',
    '#f472b6', '#fb7185', '#f97316', '#fbbf24',
    '#34d399', '#2dd4bf', '#22d3ee', '#60a5fa'
]

export default function ChatPanel({ analysisId, chatHistory: initialHistory }) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Load existing chat history
    useEffect(() => {
        if (initialHistory?.length) {
            setMessages(initialHistory.map(m => ({
                role: m.role,
                content: m.content,
                time: m.timestamp ? new Date(m.timestamp) : new Date()
            })))
        }
    }, [initialHistory])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen])

    const sendMessage = async () => {
        const question = input.trim()
        if (!question || loading) return

        const userMsg = { role: 'user', content: question, time: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await axios.post(`${API}/analysis/${analysisId}/chat`, { question })
            const aiMsg = { role: 'assistant', content: res.data.answer, time: new Date() }
            setMessages(prev => [...prev, aiMsg])
        } catch (err) {
            const errorMsg = {
                role: 'assistant',
                content: err.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
                time: new Date()
            }
            setMessages(prev => [...prev, errorMsg])
        }

        setLoading(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion)
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    const suggestions = [
        "Show me a bar chart of top 5 categories by sales",
        "Which column has the most missing values?",
        "Plot a line chart of order dates vs quantity",
        "Summarize the main insights"
    ]

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const renderInlineChart = (jsonStr) => {
        try {
            const chart = JSON.parse(jsonStr.trim())
            const data = chart.data || []
            if (data.length === 0) return <p style={{ color: 'var(--accent-red)' }}>[Chart data is empty]</p>

            const tooltipStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }

            switch (chart.chartType) {
                case 'bar':
                    return (
                        <div className="chat-chart-wrapper" style={{ height: 280, width: '100%', marginTop: 12, marginBottom: 12, background: 'rgba(15, 23, 42, 0.4)', padding: 10, borderRadius: 8 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                    <XAxis dataKey={chart.xKey} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    {chart.yKeys?.map((key, i) => (
                                        <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[2, 2, 0, 0]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )
                case 'line':
                    return (
                        <div className="chat-chart-wrapper" style={{ height: 280, width: '100%', marginTop: 12, marginBottom: 12, background: 'rgba(15, 23, 42, 0.4)', padding: 10, borderRadius: 8 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                    <XAxis dataKey={chart.xKey} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    {chart.yKeys?.map((key, i) => (
                                        <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )
                case 'pie':
                    return (
                        <div className="chat-chart-wrapper" style={{ height: 280, width: '100%', marginTop: 12, marginBottom: 12, background: 'rgba(15, 23, 42, 0.4)', padding: 10, borderRadius: 8 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data} dataKey={chart.yKeys?.[0] || 'value'} nameKey={chart.xKey || 'name'} cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                                        {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: 10 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )
                default:
                    return <p style={{ color: 'var(--accent-orange)' }}>[Unsupported chart visualization: {chart.chartType}]</p>
            }
        } catch (e) {
            console.error("Chat Chart parsing error:", e)
            return <p style={{ color: 'var(--accent-red)' }}>[Error rendering chart from AI]</p>
        }
    }

    const renderMessageContent = (content) => {
        if (!content.includes('[[CHART_DATA:')) {
            // Render basic text with line breaks
            return content.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)
        }

        const parts = content.split('[[CHART_DATA:')
        const beforeText = parts[0]
        const rest = parts[1]

        const endIdx = rest.indexOf(']]')
        if (endIdx === -1) return content.split('\n').map((line, i) => <span key={i}>{line}<br /></span>) // Fallback

        const jsonStr = rest.substring(0, endIdx)
        const afterText = rest.substring(endIdx + 2)

        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {beforeText.trim() && <div style={{ marginBottom: 8 }}>{beforeText.trim().split('\n').map((line, i) => <span key={`b-${i}`}>{line}<br /></span>)}</div>}
                {renderInlineChart(jsonStr)}
                {afterText.trim() && <div style={{ marginTop: 8 }}>{afterText.trim().split('\n').map((line, i) => <span key={`a-${i}`}>{line}<br /></span>)}</div>}
            </div>
        )
    }

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                className={`chat-toggle-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title={isOpen ? 'Close chat' : 'Ask AI about your data'}
            >
                {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="chat-panel">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-header-left">
                            <div className="chat-header-icon">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h3>BixInsight AI Chat</h3>
                                <p>Ask anything about your data</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages">
                        {messages.length === 0 ? (
                            <div className="chat-welcome">
                                <div className="chat-welcome-icon">
                                    <Sparkles size={24} />
                                </div>
                                <h4>Ask me anything!</h4>
                                <p>I can analyze your data, explain trends, and generate custom charts dynamically from your dataset.</p>
                                <div className="chat-suggestions">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            className="chat-suggestion-btn"
                                            onClick={() => handleSuggestionClick(s)}
                                        >
                                            💡 {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, i) => (
                                    <div key={i} className={`chat-message ${msg.role}`}>
                                        <div className="message-bubble">
                                            {renderMessageContent(msg.content)}
                                        </div>
                                        <span className="message-time">{formatTime(msg.time)}</span>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="typing-indicator">
                                        <div className="typing-dot" />
                                        <div className="typing-dot" />
                                        <div className="typing-dot" />
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input */}
                    <div className="chat-input-area">
                        <textarea
                            ref={inputRef}
                            className="chat-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type to ask or generate a chart..."
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            className="chat-send-btn"
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            title="Send message"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
