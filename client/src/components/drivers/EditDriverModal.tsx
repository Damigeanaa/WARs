import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Driver {
  id: number
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
}

interface EditDriverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver: Driver | null
  onDriverUpdated: () => void
}

export default function EditDriverModal({ open, onOpenChange, driver, onDriverUpdated }: EditDriverModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    status: 'Active' as 'Active' | 'Inactive' | 'On Holiday',
    join_date: '',
    profile_picture: '',
    current_address: '',
    employment_type: 'Fulltime' as 'Fulltime' | 'Minijob',
    annual_vacation_days: 25
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        license_number: driver.license_number,
        status: driver.status,
        join_date: driver.join_date,
        profile_picture: driver.profile_picture || '',
        current_address: driver.current_address || '',
        employment_type: driver.employment_type || 'Fulltime',
        annual_vacation_days: driver.annual_vacation_days || 25
      })
    }
  }, [driver])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!driver) return
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`http://localhost:3001/api/drivers/${driver.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update driver')
      }

      onDriverUpdated()
      onOpenChange(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        license_number: '',
        status: 'Active',
        join_date: '',
        profile_picture: '',
        current_address: '',
        employment_type: 'Fulltime',
        annual_vacation_days: 25
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Driver</DialogTitle>
          <DialogDescription>
            Update the driver's information. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* License Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">License Information</h3>
            <div className="space-y-2">
              <Label htmlFor="license">Driver ID / License Number</Label>
              <Input
                id="license"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Employment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'Active' | 'Inactive' | 'On Holiday') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
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
                  onValueChange={(value: 'Fulltime' | 'Minijob') => {
                    const vacationDays = value === 'Minijob' ? 15 : 25
                    setFormData({ 
                      ...formData, 
                      employment_type: value,
                      annual_vacation_days: vacationDays
                    })
                  }}
                >
                  <SelectTrigger id="employment_type">
                    <SelectValue />
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
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Additional Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join_date">Join Date</Label>
                <Input
                  id="join_date"
                  type="date"
                  value={formData.join_date}
                  onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_picture">Profile Picture URL (Optional)</Label>
                <Input
                  id="profile_picture"
                  type="url"
                  placeholder="https://example.com/profile.jpg"
                  value={formData.profile_picture}
                  onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_address">Current Address (Optional)</Label>
                <Input
                  id="current_address"
                  placeholder="123 Main St, City, State, ZIP"
                  value={formData.current_address}
                  onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Driver'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
