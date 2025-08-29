import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Phone, CreditCard, Calendar, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

interface ViewDriverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver: Driver | null
}

export default function ViewDriverModal({ open, onOpenChange, driver }: ViewDriverModalProps) {
  const navigate = useNavigate()
  
  if (!driver) return null

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Driver Details
          </DialogTitle>
          <DialogDescription>
            View comprehensive information about this driver including personal details, employment information, and status.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with profile picture, name and status */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {driver.profile_picture ? (
                <img 
                  src={driver.profile_picture} 
                  alt={`${driver.name}'s profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-medium text-gray-600">
                  {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{driver.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Driver ID: {driver.driver_id || `DRV-${new Date().getFullYear()}-${driver.id.toString().padStart(4, '0')}`}
                  </p>
                </div>
                <Badge className={getStatusColor(driver.status)}>
                  {driver.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{driver.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{driver.phone}</span>
              </div>
              {driver.current_address && (
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 flex items-center justify-center mt-0.5">
                    📍
                  </div>
                  <span className="text-sm">{driver.current_address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* License Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">License Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{driver.license_number}</span>
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Join Date: </span>
                  <span className="text-sm">{new Date(driver.join_date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Employment: </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    driver.employment_type === 'Fulltime' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {driver.employment_type || 'Fulltime'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Vacation Days: </span>
                  <span className="text-sm font-medium">
                    {(driver.annual_vacation_days || 25) - (driver.used_vacation_days || 0)} / {driver.annual_vacation_days || 25} remaining
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          {(driver.created_at || driver.updated_at) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Record Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {driver.created_at && (
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(driver.created_at).toLocaleString()}
                  </div>
                )}
                {driver.updated_at && (
                  <div className="text-xs text-muted-foreground">
                    Last Updated: {new Date(driver.updated_at).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline"
              onClick={() => {
                navigate(`/drivers/${driver.id}`)
                onOpenChange(false)
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Profile
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
