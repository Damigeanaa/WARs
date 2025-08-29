import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  BellRing,
  AlertTriangle, 
  Calendar, 
  Settings, 
  Award, 
  CheckCircle,
  Clock,
  Check,
  X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  icon: string
  severity: 'info' | 'warning' | 'error' | 'success'
  is_read: boolean
  is_global: boolean
  action_url?: string
  action_label?: string
  driver_name?: string
  driver_code?: string
  created_at: string
  updated_at: string
}

const iconMap = {
  Bell,
  BellRing,
  AlertTriangle,
  Calendar,
  Settings,
  Award,
  CheckCircle,
  Clock
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const navigate = useNavigate()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [isOpen])

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/notifications?limit=20')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      return response.json()
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  // Fetch notification counts
  const { data: counts = { total: 0, unread: 0 } } = useQuery({
    queryKey: ['notification-counts'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/notifications/counts')
      if (!response.ok) throw new Error('Failed to fetch notification counts')
      return response.json()
    },
    refetchInterval: 30000
  })

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: 'PATCH'
      })
      if (!response.ok) throw new Error('Failed to mark notification as read')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] })
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (!response.ok) throw new Error('Failed to mark all notifications as read')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] })
    }
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:3001/api/notifications/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete notification')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] })
    }
  })

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-l-red-500 bg-red-50'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'success':
        return 'border-l-green-500 bg-green-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  const renderIcon = (iconName: string, severity: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Bell
    const colorClass = severity === 'error' ? 'text-red-600' :
                      severity === 'warning' ? 'text-yellow-600' :
                      severity === 'success' ? 'text-green-600' :
                      'text-blue-600'
    
    return <IconComponent className={`w-5 h-5 ${colorClass}`} />
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }
    
    if (notification.action_url) {
      // Navigate to the action URL (you can use React Router here)
      window.location.href = notification.action_url
    }
  }

  return (
    <div className="relative">
      <Button 
        ref={buttonRef}
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        {counts.unread > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {counts.unread > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {counts.unread > 99 ? '99+' : counts.unread}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg"
          style={{
            // Dynamic positioning requires inline styles
            top: `${position.top}px`,
            right: `${position.right}px`
          }}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            {counts.unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      getSeverityStyles(notification.severity)
                    } ${!notification.is_read ? 'bg-opacity-80' : 'bg-opacity-40'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {renderIcon(notification.icon, notification.severity)}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            {notification.driver_name && (
                              <span className="text-xs text-gray-500">
                                {notification.driver_name}
                              </span>
                            )}
                          </div>
                          {notification.action_label && (
                            <span className="text-xs text-blue-600 mt-1 inline-block">
                              {notification.action_label} →
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotificationMutation.mutate(notification.id)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Always show View all notifications button */}
          <div className="border-t p-2">
            <Button 
              variant="ghost" 
              className="w-full text-sm text-blue-600"
              onClick={() => {
                setIsOpen(false)
                navigate('/notifications')
              }}
            >
              View all notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
