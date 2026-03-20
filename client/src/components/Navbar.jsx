import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { LayoutDashboard, History, LogOut, Sparkles, Sun, Moon } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getAvatarUrl = () => {
        if (user?.avatar) return `https://bixinsight-ai.onrender.com${user.avatar}`
        return null
    }

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/dashboard" className="navbar-brand">
                    <div className="brand-icon">
                        <Sparkles size={22} />
                    </div>
                    <span className="brand-text">BixInsight<span className="brand-ai">AI</span></span>
                </Link>

                <div className="navbar-links">
                    <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
                        <History size={18} />
                        <span>History</span>
                    </Link>
                </div>

                <div className="navbar-right">
                    <Link to="/profile" className="user-info" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                        {getAvatarUrl() ? (
                            <img src={getAvatarUrl()} alt="Avatar" className="user-avatar" style={{ objectFit: 'cover' }} />
                        ) : (
                            <div className="user-avatar">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="user-details">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                    </Link>
                    <button onClick={toggleTheme} className="btn-icon theme-toggle-btn" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button onClick={handleLogout} className="btn-icon logout-btn" title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    )
}
