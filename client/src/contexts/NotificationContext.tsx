import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface NotificationContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void
  createNotification: (notification: CreateNotificationRequest) => Promise<void>
  refreshNotifications: () => void
}

interface CreateNotificationRequest {
  type: string
  title: string
  message: string
  icon?: string
  severity?: 'info' | 'warning' | 'error' | 'success'
  driver_id?: number
  action_url?: string
  action_label?: string
  metadata?: any
  expires_at?: string
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: string
    timestamp: number
  }>>([])
  const queryClient = useQueryClient()

  // Auto-remove toasts after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setToasts(current => 
        current.filter(toast => Date.now() - toast.timestamp < 5000)
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(current => [...current, {
      id,
      message,
      type,
      timestamp: Date.now()
    }])
  }

  const createNotification = async (notification: CreateNotificationRequest) => {
    try {
      const response = await fetch('http://localhost:3001/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...notification,
          icon: notification.icon || 'Bell',
          severity: notification.severity || 'info'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create notification')
      }

      // Refresh notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] })
      
      showToast('Notification created successfully', 'success')
    } catch (error) {
      console.error('Error creating notification:', error)
      showToast('Failed to create notification', 'error')
    }
  }

  const refreshNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['notification-counts'] })
  }

  const removeToast = (id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id))
  }

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600'
      case 'error':
        return 'bg-red-500 border-red-600'
      case 'warning':
        return 'bg-yellow-500 border-yellow-600'
      default:
        return 'bg-blue-500 border-blue-600'
    }
  }

  return (
    <NotificationContext.Provider value={{
      showToast,
      createNotification,
      refreshNotifications
    }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-4 py-3 rounded-lg shadow-lg text-white border-l-4 
              max-w-sm animate-in slide-in-from-right duration-300
              ${getToastStyles(toast.type)}
            `}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
