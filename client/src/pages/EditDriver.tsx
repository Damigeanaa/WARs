import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ImageUpload from '@/components/common/ImageUpload'
import { ArrowLeft, User, Mail, Phone, CreditCard, Calendar, MapPin, Save, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Driver {
  id: number
  name: string
  email: string
  phone: string
  license_number: string
  status: 'Active' | 'Inactive' | 'On Holiday'
  employment_type: 'Fulltime' | 'Minijob'
  annual_vacation_days: number
  used_vacation_days: number
  join_date: string
  profile_picture?: string
  current_address?: string
}

interface DriverFormData {
  name: string
  email: string
  phone: string
  license_number: string
  status: 'Active' | 'Inactive' | 'On Holiday'
  employment_type: 'Fulltime' | 'Minijob'
  annual_vacation_days: number
  join_date: string
  profile_picture: string
  current_address: string
}

const fetchDriver = async (id: string): Promise<Driver> => {
  const response = await fetch(`http://localhost:3001/api/drivers/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch driver')
  }
  return response.json()
}

const updateDriver = async (id: string, data: DriverFormData): Promise<Driver> => {
  const response = await fetch(`http://localhost:3001/api/drivers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update driver')
  }
  return response.json()
}

export default function EditDriver() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    status: 'Active',
    employment_type: 'Fulltime',
    annual_vacation_days: 25,
    join_date: '',
    profile_picture: '',
    current_address: ''
  })

  const { data: driver, isLoading, error } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => fetchDriver(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: DriverFormData) => updateDriver(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      queryClient.invalidateQueries({ queryKey: ['driver', id] })
      toast({
        title: 'Success',
        description: 'Driver updated successfully',
      })
      navigate('/drivers')
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        license_number: driver.license_number,
        status: driver.status,
        employment_type: driver.employment_type,
        annual_vacation_days: driver.annual_vacation_days,
        join_date: driver.join_date,
        profile_picture: driver.profile_picture || '',
        current_address: driver.current_address || ''
      })
    }
  }, [driver])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleEmploymentTypeChange = (value: 'Fulltime' | 'Minijob') => {
    const vacationDays = value === 'Minijob' ? 15 : 25
    setFormData({
      ...formData,
      employment_type: value,
      annual_vacation_days: vacationDays
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading driver information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !driver) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <X className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Driver Not Found</h2>
            <p className="text-muted-foreground mb-4">The driver you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/drivers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Drivers
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const remainingVacationDays = driver.annual_vacation_days - driver.used_vacation_days

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
            <h1 className="text-3xl font-bold">Edit Driver</h1>
            <p className="text-muted-foreground">Update driver information and employment details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={driver.status === 'Active' ? 'default' : driver.status === 'On Holiday' ? 'secondary' : 'destructive'}>
            {driver.status}
          </Badge>
          <Badge variant={driver.employment_type === 'Fulltime' ? 'default' : 'secondary'}>
            {driver.employment_type}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Basic personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="license_number">Driver License Number</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="license_number"
                        value={formData.license_number}
                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="current_address">Current Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="current_address"
                      placeholder="123 Main St, City, State, ZIP"
                      value={formData.current_address}
                      onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profile_picture">Profile Picture URL</Label>
                  <Input
                    id="profile_picture"
                    type="url"
                    placeholder="https://example.com/profile.jpg"
                    value={formData.profile_picture}
                    onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
                <CardDescription>
                  Employment status and work-related details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'Active' | 'Inactive' | 'On Holiday') =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="On Holiday">On Holiday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employment_type">Employment Type</Label>
                    <Select
                      value={formData.employment_type}
                      onValueChange={handleEmploymentTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fulltime">Fulltime</SelectItem>
                        <SelectItem value="Minijob">Minijob</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="join_date">Join Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="join_date"
                        type="date"
                        value={formData.join_date}
                        onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Picture, Vacation Information & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Upload or update profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ImageUpload
                  currentImage={driver?.profile_picture}
                  driverId={driver?.id}
                  driverName={driver?.name}
                  size="lg"
                  className="mb-4"
                  onImageUploaded={() => {
                    queryClient.invalidateQueries({ queryKey: ['driver', id] })
                  }}
                  onImageRemoved={() => {
                    queryClient.invalidateQueries({ queryKey: ['driver', id] })
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vacation Information</CardTitle>
                <CardDescription>
                  Annual vacation allowance and usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="annual_vacation_days">Annual Vacation Days</Label>
                  <Input
                    id="annual_vacation_days"
                    type="number"
                    min="0"
                    max="365"
                    value={formData.annual_vacation_days}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      annual_vacation_days: parseInt(e.target.value) || 0 
                    })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Default: {formData.employment_type === 'Minijob' ? '15' : '25'} days for {formData.employment_type}
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Used Days</span>
                    <Badge variant="outline">{driver.used_vacation_days}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Remaining Days</span>
                    <Badge variant={remainingVacationDays > 5 ? "default" : "destructive"}>
                      {remainingVacationDays}
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ 
                        // Dynamic progress bar requires inline styles for CSS custom properties
                        '--progress-width': `${Math.min((driver.used_vacation_days / driver.annual_vacation_days) * 100, 100)}%`,
                        width: 'var(--progress-width)'
                      } as React.CSSProperties}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {((driver.used_vacation_days / driver.annual_vacation_days) * 100).toFixed(1)}% used
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Save changes or cancel editing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/drivers')}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
