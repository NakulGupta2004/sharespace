import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  sendMessage: (receiverId: string, listingId: string, content: string) => void
  sendTeamMessage: (teamId: string, content: string) => void
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  joinTeam: (teamId: string) => void
  leaveTeam: (teamId: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('sharespace_token')
      if (token) {
        const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
          auth: {
            token
          }
        })

        newSocket.on('connect', () => {
          console.log('Connected to server')
          setIsConnected(true)
        })

        newSocket.on('disconnect', () => {
          console.log('Disconnected from server')
          setIsConnected(false)
        })

        newSocket.on('new_message', (data) => {
          console.log('New message received:', data)
          // Handle incoming messages
          // You can emit a custom event or use a callback here
        })

        newSocket.on('new_team_message', (data) => {
          console.log('New team message received:', data)
          // Handle incoming team messages
        })

        newSocket.on('team_message_sent', (data) => {
          console.log('Team message sent confirmation:', data)
        })

        newSocket.on('team_message_error', (data) => {
          console.log('Team message error:', data)
        })

        newSocket.on('message_sent', (data) => {
          console.log('Message sent confirmation:', data)
        })

        newSocket.on('message_error', (data) => {
          console.error('Message error:', data)
        })

        newSocket.on('user_typing', (data) => {
          console.log('User typing:', data)
        })

        newSocket.on('user_stopped_typing', (data) => {
          console.log('User stopped typing:', data)
        })

        newSocket.on('messageEdited', (data) => {
          console.log('Message edited:', data)
        })

        newSocket.on('messageDeleted', (data) => {
          console.log('Message deleted:', data)
        })

        newSocket.on('chatCleared', (data) => {
          console.log('Chat cleared:', data)
        })

        newSocket.on('invite_accepted', (data) => {
          console.log('Invite accepted:', data)
        })

        newSocket.on('invite_rejected', (data) => {
          console.log('Invite rejected:', data)
        })

        newSocket.on('team_member_joined', (data) => {
          console.log('Team member joined:', data)
        })

        setSocket(newSocket)

        return () => {
          newSocket.close()
        }
      }
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [user])

  const sendMessage = (receiverId: string, listingId: string, content: string) => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        receiverId,
        listingId,
        content
      })
    }
  }

  const joinRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomId)
    }
  }

  const leaveRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_room', roomId)
    }
  }

  const sendTeamMessage = (teamId: string, content: string) => {
    if (socket && isConnected) {
      socket.emit('send_team_message', {
        teamId,
        content
      })
    }
  }

  const joinTeam = (teamId: string) => {
    if (socket && isConnected) {
      socket.emit('join_team', teamId)
    }
  }

  const leaveTeam = (teamId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_team', teamId)
    }
  }

  const value = {
    socket,
    isConnected,
    sendMessage,
    sendTeamMessage,
    joinRoom,
    leaveRoom,
    joinTeam,
    leaveTeam
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}