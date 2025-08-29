import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Phone, Mail, CreditCard, Calendar } from 'lucide-react'

interface AddDriverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDriverAdded: () => void
}

export default function AddDriverModal({ open, onOpenChange, onDriverAdded }: AddDriverModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    status: 'Active',
    join_date: new Date().toISOString().split('T')[0],
    profile_picture: '',
    current_address: '',
    employment_type: 'Fulltime',
    annual_vacation_days: 25
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:3001/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add driver')
      }

      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        phone: '',
        license_number: '',
        status: 'Active',
        join_date: new Date().toISOString().split('T')[0],
        profile_picture: '',
        current_address: '',
        employment_type: 'Fulltime',
        annual_vacation_days: 25
      })
      onOpenChange(false)
      onDriverAdded()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add driver')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'annual_vacation_days' ? parseInt(value) || 0 : value
    }))
  }

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value
    }))
  }

  const handleEmploymentTypeChange = (value: string) => {
    const vacationDays = value === 'Minijob' ? 15 : 25
    setFormData(prev => ({
      ...prev,
      employment_type: value,
      annual_vacation_days: vacationDays
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Driver
          </DialogTitle>
          <DialogDescription>
            Enter the driver's information to add them to the system
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Personal Information</h3>
            <div className="space-y-4">
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
            </div>
          </div>

          {/* License Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">License Information</h3>
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

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Employment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger id="status">
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
                  <SelectTrigger id="employment_type">
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fulltime">Fulltime</SelectItem>
                    <SelectItem value="Minijob">Minijob</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Vacation Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Vacation Information</h3>
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
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Additional Information</h3>
            <div className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="profile_picture">Profile Picture URL (Optional)</Label>
                <Input
                  id="profile_picture"
                  name="profile_picture"
                  type="url"
                  placeholder="https://example.com/profile.jpg"
                  value={formData.profile_picture}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_address">Current Address (Optional)</Label>
                <Input
                  id="current_address"
                  name="current_address"
                  placeholder="123 Main St, City, State, ZIP"
                  value={formData.current_address}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Adding Driver...' : 'Add Driver'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
