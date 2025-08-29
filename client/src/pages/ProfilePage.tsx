import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { useToast } from '../components/ui/use-toast'
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Settings, 
  Bell, 
  Lock, 
  Save,
  Edit3,
  Camera,
  Activity,
  Users,
  FileText
} from 'lucide-react'

interface UserStats {
  totalDrivers: number
  totalWarnings: number
  pendingHolidays: number
  systemUptime: string
}

interface ProfileFormData {
  username: string
  email: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<UserStats>({
    totalDrivers: 0,
    totalWarnings: 0,
    pendingHolidays: 0,
    systemUptime: '0 days'
  })
  const [formData, setFormData] = useState<ProfileFormData>({
    username: user?.name || '',
    email: user?.email || ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.name || '',
        email: user.email || ''
      })
    }
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    try {
      // Fetch system statistics
      const [driversRes, warningsRes, holidaysRes] = await Promise.all([
        fetch('http://localhost:3001/api/drivers'),
        fetch('http://localhost:3001/api/warnings'),
        fetch('http://localhost:3001/api/holiday-requests/public/all')
      ])

      const drivers = await driversRes.json()
      const warnings = await warningsRes.json()
      const holidays = await holidaysRes.json()

      setStats({
        totalDrivers: drivers.length || 0,
        totalWarnings: warnings.length || 0,
        pendingHolidays: holidays.filter((h: any) => h.status === 'pending').length || 0,
        systemUptime: '12 days' // Mock uptime
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.'
      })

      setIsEditing(false)
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      username: user?.name || '',
      email: user?.email || ''
    })
    setIsEditing(false)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Admin Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings and view system overview
            </p>
          </div>
          <Badge variant="secondary" className="w-fit">
            <Shield className="h-3 w-3 mr-1" />
            Administrator
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {user.name?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0 border-2 border-white bg-white shadow-md hover:bg-gray-50"
                      >
                        <Camera className="h-3 w-3" />
                      </Button>
                    </div>
                    <div>
                      <CardTitle className="text-xl">{user.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant={isEditing ? "outline" : "default"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isLoading}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username
                    </Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="bg-white"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{user.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-white"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{user.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Role</Label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Member Since</Label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>January 2024</span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      <Save className="h-4 w-4 mr-1" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>
                  Frequently used administrative functions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="h-16 flex-col space-y-1">
                    <Settings className="h-5 w-5" />
                    <span className="text-xs">System Settings</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col space-y-1">
                    <Bell className="h-5 w-5" />
                    <span className="text-xs">Notifications</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col space-y-1">
                    <Lock className="h-5 w-5" />
                    <span className="text-xs">Security</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col space-y-1">
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* System Stats */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <CardHeader>
                <CardTitle className="text-lg text-white">System Overview</CardTitle>
                <CardDescription className="text-blue-100">
                  Current system statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Total Drivers</span>
                  </div>
                  <span className="font-semibold">{stats.totalDrivers}</span>
                </div>
                <Separator className="bg-blue-400/30" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Total Warnings</span>
                  </div>
                  <span className="font-semibold">{stats.totalWarnings}</span>
                </div>
                <Separator className="bg-blue-400/30" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Pending Holidays</span>
                  </div>
                  <span className="font-semibold">{stats.pendingHolidays}</span>
                </div>
                <Separator className="bg-blue-400/30" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">System Uptime</span>
                  </div>
                  <span className="font-semibold">{stats.systemUptime}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  Your latest administrative actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Updated driver profile</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span>Reviewed holiday request</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                    <span>Issued safety warning</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                    <span>Generated monthly report</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}