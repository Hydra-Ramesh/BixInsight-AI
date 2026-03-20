import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Mail, Lock, User, Building2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import './Auth.css'

export default function Register() {
    const { register } = useAuth()
    const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        setLoading(true)
        try {
            await register(form.name, form.email, form.password, form.company)
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.')
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
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">Start analyzing your business data with AI</p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div className="input-icon-wrapper">
                                <User size={18} className="input-icon" />
                                <input
                                    id="register-name"
                                    type="text"
                                    className="form-input with-icon"
                                    placeholder="John Doe"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-icon-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    id="register-email"
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
                            <label className="form-label">Company (Optional)</label>
                            <div className="input-icon-wrapper">
                                <Building2 size={18} className="input-icon" />
                                <input
                                    id="register-company"
                                    type="text"
                                    className="form-input with-icon"
                                    placeholder="Acme Corp"
                                    value={form.company}
                                    onChange={e => setForm({ ...form, company: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-icon-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="register-password"
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input with-icon"
                                    placeholder="Min. 6 characters"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    minLength={6}
                                />
                                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading} id="register-submit">
                            {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                                <>Create Account <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
