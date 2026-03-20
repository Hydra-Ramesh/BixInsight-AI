import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import './Auth.css'

export default function Login() {
    const { login } = useAuth()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(form.email, form.password)
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.')
        }
        setLoading(false)
    }

    return (
        <div className="auth-page">
            <div className="animated-bg" />
            <div className="auth-container">
                <div className="auth-card glass-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <Sparkles size={28} />
                        </div>
                        <h1 className="auth-title">Welcome Back</h1>
                        <p className="auth-subtitle">Sign in to your BixInsight AI account</p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-icon-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    id="login-email"
                                    type="email"
                                    className="form-input with-icon"
                                    placeholder="you@company.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-icon-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="login-password"
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input with-icon"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading} id="login-submit">
                            {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                        <Link to="/forgot-password" className="auth-link" style={{ fontSize: '0.85rem' }}>Forgot Password?</Link>
                    </div>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/register" className="auth-link">Create Account</Link>
                    </div>
                </div>

                <div className="auth-features">
                    <div className="feature-item" style={{ animationDelay: '0.1s' }}>
                        <div className="feature-dot" style={{ background: 'var(--accent-primary)' }} />
                        <span>AI-Powered Data Analysis</span>
                    </div>
                    <div className="feature-item" style={{ animationDelay: '0.2s' }}>
                        <div className="feature-dot" style={{ background: 'var(--accent-pink)' }} />
                        <span>Interactive Dashboards</span>
                    </div>
                    <div className="feature-item" style={{ animationDelay: '0.3s' }}>
                        <div className="feature-dot" style={{ background: 'var(--accent-green)' }} />
                        <span>Instant Business Insights</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
