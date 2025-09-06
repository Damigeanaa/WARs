import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import ImageUpload from '@/components/common/ImageUpload'
import { ArrowLeft, User, Mail, Phone, CreditCard, Calendar, MapPin, Plus, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useProjectSettings } from '@/hooks/useProjectSettings'

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

const createDriver = async (data: DriverFormData) => {
  const response = await fetch('http://localhost:3001/api/drivers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create driver')
  }
  return response.json()
}

export default function AddDriver() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: settings } = useProjectSettings()

  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    status: 'Active',
    employment_type: 'Fulltime',
    annual_vacation_days: 25, // Will be updated based on settings
    join_date: new Date().toISOString().split('T')[0],
    profile_picture: '',
    current_address: ''
  })

  // Update vacation days when settings load or employment type changes
  useEffect(() => {
    if (settings) {
      const vacationDays = formData.employment_type === 'Minijob' 
        ? settings.defaultVacationDaysMinijob || 20
        : settings.defaultVacationDaysFulltime || 30;
      
      setFormData(prev => ({
        ...prev,
        annual_vacation_days: vacationDays
      }));
    }
  }, [settings, formData.employment_type]);

  const createMutation = useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast({
        title: 'Success',
        description: 'Driver added successfully',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEmploymentTypeChange = (value: 'Fulltime' | 'Minijob') => {
    const vacationDays = settings
      ? (value === 'Minijob' ? settings.defaultVacationDaysMinijob || 20 : settings.defaultVacationDaysFulltime || 30)
      : (value === 'Minijob' ? 20 : 30); // Fallback values if settings not loaded

    setFormData({
      ...formData,
      employment_type: value,
      annual_vacation_days: vacationDays
    })
  }

  const handleStatusChange = (value: 'Active' | 'Inactive' | 'On Holiday') => {
    setFormData({ ...formData, status: value })
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
            <h1 className="text-3xl font-bold">Add New Driver</h1>
            <p className="text-muted-foreground">Enter driver information to add them to the system</p>
          </div>
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
                        name="name"
                        placeholder="John Smith"
                        value={formData.name}
                        onChange={handleInputChange}
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
                        name="email"
                        type="email"
                        placeholder="john.smith@company.com"
                        value={formData.email}
                        onChange={handleInputChange}
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
                        name="phone"
                        placeholder="+1 234 567 8900"
                        value={formData.phone}
                        onChange={handleInputChange}
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
                        name="license_number"
                        placeholder="DL123456789"
                        value={formData.license_number}
                        onChange={handleInputChange}
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
                      name="current_address"
                      placeholder="123 Main St, City, State, ZIP"
                      value={formData.current_address}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profile_picture">Profile Picture URL</Label>
                  <Input
                    id="profile_picture"
                    name="profile_picture"
                    type="url"
                    placeholder="https://example.com/profile.jpg"
                    value={formData.profile_picture}
                    onChange={handleInputChange}
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
                    <Select value={formData.status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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
                    <Select value={formData.employment_type} onValueChange={handleEmploymentTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
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
                        name="join_date"
                        type="date"
                        value={formData.join_date}
                        onChange={handleInputChange}
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
                  Upload a profile picture for the driver
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ImageUpload
                  currentImage={formData.profile_picture}
                  driverName={formData.name}
                  size="lg"
                  className="mb-4"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vacation Information</CardTitle>
                <CardDescription>
                  Annual vacation allowance setup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="annual_vacation_days">Annual Vacation Days</Label>
                  <Input
                    id="annual_vacation_days"
                    name="annual_vacation_days"
                    type="number"
                    min="0"
                    max="365"
                    value={formData.annual_vacation_days}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Default: {formData.employment_type === 'Minijob' ? '15' : '25'} days for {formData.employment_type}
                  </p>
                </div>
                
                <Separator />
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    New drivers start with 0 used vacation days
                  </p>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    0% used
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Create driver or cancel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? 'Adding Driver...' : 'Add Driver'}
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
