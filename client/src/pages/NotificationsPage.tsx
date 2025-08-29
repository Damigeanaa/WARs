import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/contexts/NotificationContext'
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Settings, 
  Award, 
  CheckCircle,
  Clock,
  Check,
  Trash2
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
  AlertTriangle,
  Calendar,
  Settings,
  Award,
  CheckCircle,
  Clock
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const { showToast } = useNotifications()
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/notifications?limit=100')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      return response.json()
    }
  })

  // Fetch notification counts
  const { data: counts = { total: 0, unread: 0 } } = useQuery({
    queryKey: ['notification-counts'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/notifications/counts')
      if (!response.ok) throw new Error('Failed to fetch notification counts')
      return response.json()
    }
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
      showToast('All notifications marked as read', 'success')
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
      showToast('Notification deleted', 'success')
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
    
    return <IconComponent className={`w-6 h-6 ${colorClass}`} />
  }

  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (activeTab === 'unread') return !notification.is_read
    if (activeTab === 'read') return notification.is_read
    return true
  })

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading notifications...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">
            {counts.total} total notifications, {counts.unread} unread
          </p>
        </div>
        
        {counts.unread > 0 && (
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All ({counts.total})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({counts.unread})
              </TabsTrigger>
              <TabsTrigger value="read">
                Read ({counts.total - counts.unread})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {activeTab === 'unread' ? 'No unread notifications' : 
                 activeTab === 'read' ? 'No read notifications' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
                    getSeverityStyles(notification.severity)
                  } ${!notification.is_read ? 'bg-opacity-80' : 'bg-opacity-40'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {renderIcon(notification.icon, notification.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {notification.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          {notification.driver_name && (
                            <span>Driver: {notification.driver_name}</span>
                          )}
                        </div>
                        
                        {notification.action_label && (
                          <div className="mt-2">
                            <span className="text-sm text-blue-600 hover:text-blue-800">
                              {notification.action_label} →
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsReadMutation.mutate(notification.id)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotificationMutation.mutate(notification.id)
                        }}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
