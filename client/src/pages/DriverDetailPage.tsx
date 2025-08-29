import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DriverTimeline from '@/components/driver/DriverTimeline'
import ImageUpload from '@/components/common/ImageUpload'
import { ArrowLeft, User, Mail, Phone, CreditCard, Calendar, MapPin, Edit, Settings } from 'lucide-react'

interface Driver {
  id: number
  driver_id: string
  name: string
  email: string
  phone: string
  license_number: string
  status: 'Active' | 'Inactive' | 'On Holiday'
  join_date: string
  profile_picture?: string
  current_address?: string
  employment_type?: 'Fulltime' | 'Minijob'
  annual_vacation_days?: number
  used_vacation_days?: number
  created_at?: string
  updated_at?: string
}

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: driver, isLoading, error } = useQuery({
    queryKey: ['driver', id],
    queryFn: async (): Promise<Driver> => {
      const response = await fetch(`http://localhost:3001/api/drivers/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch driver')
      }
      return response.json()
    },
    enabled: !!id
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'On Holiday':
        return 'bg-blue-100 text-blue-800'
      case 'Inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !driver) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Driver Not Found</h1>
          <p className="text-gray-600 mb-6">The requested driver could not be found.</p>
          <Button onClick={() => navigate('/drivers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drivers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/drivers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drivers
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Profile</h1>
            <p className="text-gray-600">Detailed view and performance tracking</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate(`/drivers/${driver.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Driver
          </Button>
        </div>
      </div>

      {/* Driver Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={driver.profile_picture ? `http://localhost:3001${driver.profile_picture}` : undefined}
                  alt={`${driver.name}'s profile`} 
                />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xl">
                  {getInitials(driver.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{driver.name}</h2>
                <p className="text-gray-600">{driver.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(driver.status)}>
                    {driver.status}
                  </Badge>
                  <Badge variant="outline">
                    {driver.driver_id || `DRV-${new Date().getFullYear()}-${driver.id.toString().padStart(4, '0')}`}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {(driver.annual_vacation_days || 25) - (driver.used_vacation_days || 0)}
                </div>
                <div className="text-xs text-gray-500">Days Left</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {driver.employment_type === 'Fulltime' ? 'Full' : 'Mini'}
                </div>
                <div className="text-xs text-gray-500">Employment</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Date().getFullYear() - new Date(driver.join_date).getFullYear()}
                </div>
                <div className="text-xs text-gray-500">Years</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${driver.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                  {driver.status === 'Active' ? '✓' : '!'}
                </div>
                <div className="text-xs text-gray-500">Status</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Performance Timeline</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Email: </span>
                    <span className="text-sm font-medium">{driver.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Phone: </span>
                    <span className="text-sm font-medium">{driver.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">License: </span>
                    <span className="text-sm font-medium">{driver.license_number}</span>
                  </div>
                </div>
                {driver.current_address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground">Address: </span>
                      <span className="text-sm font-medium">{driver.current_address}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Join Date: </span>
                    <span className="text-sm font-medium">
                      {new Date(driver.join_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Employment Type: </span>
                  <Badge variant="outline">
                    {driver.employment_type || 'Fulltime'}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Annual Vacation Days: </span>
                  <span className="text-sm font-medium">{driver.annual_vacation_days || 25}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Used Vacation Days: </span>
                  <span className="text-sm font-medium">{driver.used_vacation_days || 0}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Remaining: </span>
                  <span className="text-sm font-medium text-green-600">
                    {(driver.annual_vacation_days || 25) - (driver.used_vacation_days || 0)} days
                  </span>
                </div>
                
                {/* Vacation Progress Bar */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Vacation Usage</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        // Dynamic progress bar width requires inline style
                        width: `${Math.min(((driver.used_vacation_days || 0) / (driver.annual_vacation_days || 25)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(((driver.used_vacation_days || 0) / (driver.annual_vacation_days || 25)) * 100)}% used
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <DriverTimeline driverId={driver.id} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Picture */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ImageUpload
                  currentImage={driver.profile_picture}
                  driverId={driver.id}
                  driverName={driver.name}
                  size="lg"
                  className="mb-4"
                />
              </CardContent>
            </Card>

            {/* Record Information */}
            <Card>
              <CardHeader>
                <CardTitle>Record Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {driver.created_at && (
                  <div>
                    <span className="text-sm text-muted-foreground">Created: </span>
                    <span className="text-sm font-medium">
                      {new Date(driver.created_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {driver.updated_at && (
                  <div>
                    <span className="text-sm text-muted-foreground">Last Updated: </span>
                    <span className="text-sm font-medium">
                      {new Date(driver.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Driver ID: </span>
                  <span className="text-sm font-medium font-mono">
                    {driver.driver_id || `DRV-${new Date().getFullYear()}-${driver.id.toString().padStart(4, '0')}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
