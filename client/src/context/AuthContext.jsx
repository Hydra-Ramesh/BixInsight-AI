import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)
const API_URL = 'http://localhost:5000/api'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('bixinsight_token'))
    const [loading, setLoading] = useState(true)

    // Configure axios defaults
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
            delete axios.defaults.headers.common['Authorization']
        }
    }, [token])

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            if (!token) {
                setLoading(false)
                return
            }
            try {
                const res = await axios.get(`${API_URL}/auth/me`)
                setUser(res.data.user)
            } catch (err) {
                localStorage.removeItem('bixinsight_token')
                setToken(null)
                setUser(null)
            }
            setLoading(false)
        }
        loadUser()
    }, [token])

    const login = useCallback(async (email, password) => {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password })
        localStorage.setItem('bixinsight_token', res.data.token)
        setToken(res.data.token)
        setUser(res.data.user)
        return res.data
    }, [])

    const register = useCallback(async (name, email, password, company) => {
        const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, company })
        localStorage.setItem('bixinsight_token', res.data.token)
        setToken(res.data.token)
        setUser(res.data.user)
        return res.data
    }, [])

    const logout = useCallback(() => {
        localStorage.removeItem('bixinsight_token')
        setToken(null)
        setUser(null)
    }, [])

    const updateUser = useCallback((userData) => {
        setUser(userData)
    }, [])

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
