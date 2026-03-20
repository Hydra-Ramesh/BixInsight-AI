import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { Camera, User, Building2, ArrowLeft, Save, Calendar } from 'lucide-react'
import './Profile.css'

const API = 'https://bixinsight-ai.onrender.com/api'

export default function Profile() {
    const { user, updateUser } = useAuth()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [form, setForm] = useState({
        name: user?.name || '',
        company: user?.company || ''
    })
    const [loading, setLoading] = useState(false)
    const [avatarLoading, setAvatarLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSave = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setLoading(true)
        try {
            const res = await axios.put(`${API}/auth/profile`, {
                name: form.name,
                company: form.company
            })
            updateUser(res.data.user)
            setMessage('Profile updated successfully!')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile')
        }
        setLoading(false)
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB')
            return
        }

        setAvatarLoading(true)
        setError('')
        setMessage('')
        try {
            const formData = new FormData()
            formData.append('avatar', file)
            const res = await axios.put(`${API}/auth/profile/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            updateUser(res.data.user)
            setMessage('Avatar updated!')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload avatar')
        }
        setAvatarLoading(false)
    }

    const getAvatarUrl = () => {
        if (user?.avatar) return `http://localhost:5000${user.avatar}`
        return null
    }

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : ''

    return (
        <div className="main-content profile-page">
            <div className="analysis-header" style={{ marginBottom: 24 }}>
                <div className="analysis-header-left">
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div>
                        <h1 className="page-title">Profile Settings</h1>
                        <p className="page-subtitle">Manage your account details</p>
                    </div>
                </div>
            </div>

            <div className="glass-card profile-card">
                {/* Avatar Section */}
                <div className="profile-avatar-section">
                    <div className="profile-avatar-wrapper" onClick={handleAvatarClick}>
                        {getAvatarUrl() ? (
                            <img src={getAvatarUrl()} alt="Avatar" className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="avatar-overlay">
                            {avatarLoading ? (
                                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                            ) : (
                                <Camera size={24} />
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="avatar-upload-input"
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <span className="profile-avatar-name">{user?.name}</span>
                    <span className="profile-avatar-email">{user?.email}</span>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}
                {message && <div className="alert alert-success" style={{ marginBottom: 20 }}>{message}</div>}

                {/* Profile Form */}
                <form onSubmit={handleSave} className="profile-form">
                    <div className="profile-form-row">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div className="input-icon-wrapper">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    className="form-input with-icon"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Your name"
                                    required
                                    minLength={2}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Business / Company</label>
                            <div className="input-icon-wrapper">
                                <Building2 size={18} className="input-icon" />
                                <input
                                    type="text"
                                    className="form-input with-icon"
                                    value={form.company}
                                    onChange={e => setForm({ ...form, company: e.target.value })}
                                    placeholder="Company name"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-icon-wrapper">
                            <input
                                type="email"
                                className="form-input"
                                value={user?.email || ''}
                                disabled
                                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Email cannot be changed
                        </span>
                    </div>

                    {memberSince && (
                        <div className="profile-meta">
                            <Calendar size={14} />
                            Member since {memberSince}
                        </div>
                    )}

                    <div className="profile-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                            ) : (
                                <><Save size={16} /> Save Changes</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
