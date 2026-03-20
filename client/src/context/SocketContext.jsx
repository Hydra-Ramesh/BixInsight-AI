import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
    const { user } = useAuth()
    const socketRef = useRef(null)
    const [analysisProgress, setAnalysisProgress] = useState({})

    useEffect(() => {
        if (!user) return

        const socket = io('http://localhost:5000', {
            transports: ['websocket', 'polling']
        })

        socket.on('connect', () => {
            console.log('🔌 Socket connected')
            socket.emit('authenticate', user.id)
        })

        socket.on('analysis:progress', (data) => {
            console.log('📊 Analysis progress:', data)
            setAnalysisProgress(prev => ({
                ...prev,
                [data.analysisId]: {
                    status: data.status,
                    message: data.message
                }
            }))
        })

        socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected')
        })

        socketRef.current = socket

        return () => {
            socket.disconnect()
            socketRef.current = null
        }
    }, [user])

    const clearProgress = (analysisId) => {
        setAnalysisProgress(prev => {
            const next = { ...prev }
            delete next[analysisId]
            return next
        })
    }

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, analysisProgress, clearProgress }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => useContext(SocketContext)
