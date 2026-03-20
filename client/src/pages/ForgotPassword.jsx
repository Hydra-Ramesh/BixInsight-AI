import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Sparkles, Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'
import './Auth.css'

const API = 'https://bixinsight-ai.onrender.com/api'

export default function ForgotPassword() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1) // 1: email, 2: OTP, 3: new password, 4: success
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [resetToken, setResetToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleRequestOtp = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await axios.post(`${API}/auth/forgot-password`, { email })
            setMessage(res.data.message)
            setStep(2)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP')
        }
        setLoading(false)
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await axios.post(`${API}/auth/verify-otp`, { email, otp })
            setResetToken(res.data.resetToken)
            setStep(3)
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP')
        }
        setLoading(false)
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        setError('')
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        setLoading(true)
        try {
            await axios.post(`${API}/auth/reset-password`, { resetToken, newPassword })
            setStep(4)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password')
        }
        setLoading(false)
    }

    const stepTitles = {
        1: { title: 'Forgot Password', subtitle: 'Enter your email to receive a reset code' },
        2: { title: 'Enter OTP', subtitle: 'Check your email for the 6-digit code' },
        3: { title: 'New Password', subtitle: 'Choose a strong new password' },
        4: { title: 'Password Reset!', subtitle: 'Your password has been changed successfully' }
    }

    const { title, subtitle } = stepTitles[step]

    return (
        <div className="auth-page">
            <div className="animated-bg" />
            <div className="auth-container">
                <div className="auth-card glass-card">
                    <div className="auth-header">
                        <div className="auth-logo" style={step === 4 ? { background: 'linear-gradient(135deg, #34d399, #22d3ee)' } : {}}>
                            {step === 4 ? <CheckCircle size={28} /> : <KeyRound size={28} />}
                        </div>
                        <h1 className="auth-title">{title}</h1>
                        <p className="auth-subtitle">{subtitle}</p>
                    </div>

                    {/* Step indicators */}
                    {step < 4 && (
                        <div className="otp-steps">
                            {[1, 2, 3].map(s => (
                                <div key={s} className={`otp-step ${s === step ? 'active' : s < step ? 'done' : ''}`}>
                                    <div className="otp-step-dot">{s < step ? '✓' : s}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <div className="alert alert-error">{error}</div>}
                    {message && step === 2 && <div className="alert alert-success">{message}</div>}

                    {/* Step 1: Enter email */}
                    {step === 1 && (
                        <form onSubmit={handleRequestOtp} className="auth-form">
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div className="input-icon-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        className="form-input with-icon"
                                        placeholder="you@company.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                                {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                                    <>Send OTP <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Step 2: Enter OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} className="auth-form">
                            <div className="form-group">
                                <label className="form-label">6-Digit OTP Code</label>
                                <div className="input-icon-wrapper">
                                    <KeyRound size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input with-icon otp-input"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        required
                                        style={{ letterSpacing: '6px', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading || otp.length !== 6}>
                                {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                                    <>Verify OTP <ArrowRight size={18} /></>
                                )}
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { setStep(1); setError(''); setOtp(''); }}>
                                <ArrowLeft size={16} /> Back
                            </button>
                        </form>
                    )}

                    {/* Step 3: New password */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="auth-form">
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div className="input-icon-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        className="form-input with-icon"
                                        placeholder="Min. 6 characters"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <div className="input-icon-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        className="form-input with-icon"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                                {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
                                    <>Reset Password <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div style={{ textAlign: 'center' }}>
                            <div className="alert alert-success" style={{ justifyContent: 'center', marginBottom: 20 }}>
                                Password reset successfully!
                            </div>
                            <button className="btn btn-primary btn-lg auth-submit" onClick={() => navigate('/login')}>
                                Go to Login <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    <div className="auth-footer">
                        Remember your password? <Link to="/login" className="auth-link">Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
