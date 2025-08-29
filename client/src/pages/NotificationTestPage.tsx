import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNotifications } from '@/contexts/NotificationContext'

const notificationTypes = [
  { value: 'warning_created', label: 'Warning Created', icon: 'AlertTriangle' },
  { value: 'holiday_request', label: 'Holiday Request', icon: 'Calendar' },
  { value: 'system_update', label: 'System Update', icon: 'Settings' },
  { value: 'driver_achievement', label: 'Driver Achievement', icon: 'Award' },
  { value: 'warning_resolved', label: 'Warning Resolved', icon: 'CheckCircle' },
  { value: 'maintenance_reminder', label: 'Maintenance Reminder', icon: 'Clock' },
]

export default function NotificationTestPage() {
  const { createNotification } = useNotifications()
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    message: '',
    severity: 'info' as 'info' | 'warning' | 'error' | 'success',
    driver_id: '',
    action_url: '',
    action_label: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const typeData = notificationTypes.find(t => t.value === formData.type)
    
    await createNotification({
      type: formData.type,
      title: formData.title,
      message: formData.message,
      icon: typeData?.icon || 'Bell',
      severity: formData.severity,
      driver_id: formData.driver_id ? parseInt(formData.driver_id) : undefined,
      action_url: formData.action_url || undefined,
      action_label: formData.action_label || undefined
    })

    // Reset form
    setFormData({
      type: '',
      title: '',
      message: '',
      severity: 'info',
      driver_id: '',
      action_url: '',
      action_label: ''
    })
  }

  const generateSampleNotifications = async () => {
    const samples = [
      {
        type: 'warning_created',
        title: 'Speed Violation Warning',
        message: 'Driver John Doe has exceeded speed limit on Highway 101',
        severity: 'warning' as const,
        driver_id: 1,
        action_url: '/warnings',
        action_label: 'View Warning'
      },
      {
        type: 'holiday_request',
        title: 'Holiday Request Submitted',
        message: 'Jane Smith has requested time off for Dec 25-26',
        severity: 'info' as const,
        driver_id: 2,
        action_url: '/holidays',
        action_label: 'Review Request'
      },
      {
        type: 'system_update',
        title: 'System Maintenance Scheduled',
        message: 'Scheduled maintenance tonight from 2:00 AM - 4:00 AM',
        severity: 'info' as const,
        action_url: '/dashboard',
        action_label: 'View Details'
      },
      {
        type: 'driver_achievement',
        title: 'Safe Driving Milestone',
        message: 'Mike Johnson completed 1000 hours without incidents!',
        severity: 'success' as const,
        driver_id: 3,
        action_url: '/drivers/3',
        action_label: 'View Profile'
      }
    ]

    for (const sample of samples) {
      const typeData = notificationTypes.find(t => t.value === sample.type)
      await createNotification({
        ...sample,
        icon: typeData?.icon || 'Bell'
      })
      // Small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Test</h1>
        <p className="text-gray-600 mt-2">
          Create test notifications to demonstrate the notification system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification type" />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select 
                  value={formData.severity} 
                  onValueChange={(value: 'info' | 'warning' | 'error' | 'success') => 
                    setFormData({...formData, severity: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="driver_id">Driver ID (optional)</Label>
                <Input
                  id="driver_id"
                  type="number"
                  value={formData.driver_id}
                  onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="action_url">Action URL (optional)</Label>
                <Input
                  id="action_url"
                  value={formData.action_url}
                  onChange={(e) => setFormData({...formData, action_url: e.target.value})}
                  placeholder="/warnings"
                />
              </div>

              <div>
                <Label htmlFor="action_label">Action Label (optional)</Label>
                <Input
                  id="action_label"
                  value={formData.action_label}
                  onChange={(e) => setFormData({...formData, action_label: e.target.value})}
                  placeholder="View Details"
                />
              </div>

              <Button type="submit" className="w-full">
                Create Notification
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Generate Sample Notifications</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create a set of sample notifications to test the system functionality.
              </p>
              <Button onClick={generateSampleNotifications} className="w-full">
                Generate Sample Notifications
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Sample Types</h3>
              <div className="space-y-2">
                {notificationTypes.map((type) => (
                  <div key={type.value} className="flex items-center justify-between text-sm">
                    <span>{type.label}</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {type.value}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
