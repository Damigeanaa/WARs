import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Plus, Search, Calendar, Check, X, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Driver {
  id: number
  name: string
  email: string
  employment_type?: 'Fulltime' | 'Minijob'
  annual_vacation_days?: number
  used_vacation_days?: number
}

interface Holiday {
  id: number
  driver_id: string
  driver_name: string
  email: string
  phone?: string
  department?: string
  start_date: string
  end_date: string
  requested_days: number
  reason?: string
  emergency_contact?: string
  emergency_phone?: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  approved_by?: string
  approved_at?: string
  created_at: string
}

export default function Holidays() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all')
  const queryClient = useQueryClient()

  // Form state
  const [formData, setFormData] = useState({
    driver_id: '',
    start_date: '',
    end_date: '',
    days: 1,
    type: 'Annual Leave' as 'Annual Leave' | 'Sick Leave' | 'Personal Leave' | 'Emergency Leave',
    reason: '',
    request_date: new Date().toISOString().split('T')[0]
  })

  // Fetch holidays
  const { data: holidays = [], isLoading, error } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/holiday-requests/public/all')
      if (!response.ok) {
        throw new Error('Failed to fetch holidays')
      }
      return response.json()
    }
  })

  // Fetch drivers for the form
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/drivers')
      if (!response.ok) {
        throw new Error('Failed to fetch drivers')
      }
      return response.json()
    }
  })

  // Create holiday mutation
  const createHolidayMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Calculate days between dates
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)
      const timeDiff = endDate.getTime() - startDate.getTime()
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1

      const requestData = {
        driver_id: parseInt(data.driver_id),
        start_date: data.start_date,
        end_date: data.end_date,
        days: days,
        type: data.type,
        reason: data.reason,
        request_date: data.request_date
      }

      const response = await fetch('http://localhost:3001/api/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create holiday request')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      setIsAddModalOpen(false)
      setFormData({
        driver_id: '',
        start_date: '',
        end_date: '',
        days: 1,
        type: 'Annual Leave',
        reason: '',
        request_date: new Date().toISOString().split('T')[0]
      })
      toast.success('Holiday request created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Approve holiday mutation
  const approveHolidayMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:3001/api/holiday-requests/public/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          approvedBy: 'Admin',
          notes: 'Approved via management interface'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to approve holiday request')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      toast.success('Holiday request approved!')
    },
    onError: (error: Error) => {
      console.error('Approval error:', error)
      toast.error(error.message)
    }
  })

  // Reject holiday mutation
  const rejectHolidayMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:3001/api/holiday-requests/public/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          approvedBy: 'Admin',
          notes: 'Rejected via management interface'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to reject holiday request')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      toast.success('Holiday request rejected!')
    },
    onError: (error: Error) => {
      console.error('Rejection error:', error)
      toast.error(error.message)
    }
  })

  // Delete holiday mutation
  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:3001/api/holiday-requests/public/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete holiday request')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      toast.success('Holiday request deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Filter holidays
  const filteredHolidays = holidays.filter((holiday: Holiday) => {
    const matchesSearch = holiday.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         holiday.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         holiday.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatusFilter === 'all' || holiday.status === selectedStatusFilter
    // Since holiday requests don't have type field, we'll treat all as 'Holiday Request'
    const matchesType = selectedTypeFilter === 'all' || selectedTypeFilter === 'Holiday Request'
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.driver_id || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields')
      return
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('End date cannot be before start date')
      return
    }

    createHolidayMutation.mutate(formData)
  }

  // Handle view holiday
  const handleViewHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday)
    setIsViewModalOpen(true)
  }

  // Fetch vacation summary for selected driver
  const { data: vacationSummary } = useQuery({
    queryKey: ['vacation-summary', selectedHoliday?.driver_id],
    queryFn: async () => {
      if (!selectedHoliday?.driver_id) return null
      const response = await fetch(`http://localhost:3001/api/holidays/driver/${selectedHoliday.driver_id}/vacation-summary`)
      if (!response.ok) {
        throw new Error('Failed to fetch vacation summary')
      }
      return response.json()
    },
    enabled: !!selectedHoliday?.driver_id && isViewModalOpen
  })
  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      const timeDiff = endDate.getTime() - startDate.getTime()
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
      setFormData(prev => ({ ...prev, days: days > 0 ? days : 1 }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading holiday requests...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading holiday requests. Please try again.</div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Holiday Management</h1>
          <p className="text-muted-foreground">
            Manage driver holiday requests and approvals
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Holiday Request</DialogTitle>
              <DialogDescription>
                Submit a new holiday request for a driver. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="driver">Driver</Label>
                <Select value={formData.driver_id} onValueChange={(value) => setFormData(prev => ({ ...prev, driver_id: value }))}>
                  <SelectTrigger id="driver">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver: Driver) => (
                      <SelectItem key={driver.id} value={driver.id.toString()}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, start_date: e.target.value }))
                      setTimeout(calculateDays, 10)
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, end_date: e.target.value }))
                      setTimeout(calculateDays, 10)
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="days">Days</Label>
                <Input
                  id="days"
                  type="number"
                  value={formData.days}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                    <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Optional reason for holiday request"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createHolidayMutation.isPending}>
                  {createHolidayMutation.isPending ? 'Creating...' : 'Create Request'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{holidays.length}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {holidays.filter((h: Holiday) => h.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {holidays.filter((h: Holiday) => h.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready for time off</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Taken</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {holidays.filter((h: Holiday) => h.status === 'approved').reduce((sum: number, h: Holiday) => sum + h.requested_days, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Approved days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Remaining</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {holidays.length}
            </div>
            <p className="text-xs text-muted-foreground">Total submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search holiday requests..."
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Holiday Request">Holiday Request</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Holiday Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holiday Requests ({filteredHolidays.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Driver</th>
                  <th className="text-left py-3 px-4 font-medium">Department</th>
                  <th className="text-left py-3 px-4 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 font-medium">Dates</th>
                  <th className="text-left py-3 px-4 font-medium">Days</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Reason</th>
                  <th className="text-left py-3 px-4 font-medium">Submitted</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHolidays.map((holiday: Holiday) => (
                  <tr key={holiday.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{holiday.driver_name}</p>
                        <p className="text-xs text-gray-500">{holiday.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {holiday.department || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="font-medium">Holiday Request</p>
                        <p className="text-xs text-gray-500">Driver ID: {holiday.driver_id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(holiday.start_date).toLocaleDateString()} - 
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(holiday.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{holiday.requested_days}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Holiday Request
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(holiday.status)}`}>
                        {holiday.status.charAt(0).toUpperCase() + holiday.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-sm truncate">{holiday.reason}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">{new Date(holiday.submitted_at).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {holiday.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => approveHolidayMutation.mutate(holiday.id)}
                              disabled={approveHolidayMutation.isPending}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => rejectHolidayMutation.mutate(holiday.id)}
                              disabled={rejectHolidayMutation.isPending}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewHoliday(holiday)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50 disabled:opacity-50"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this holiday request? This action cannot be undone.')) {
                              deleteHolidayMutation.mutate(holiday.id)
                            }
                          }}
                          disabled={deleteHolidayMutation.isPending}
                          title="Delete holiday request"
                        >
                          <Trash2 className="h-3 w-3" />
                          {deleteHolidayMutation.isPending && 'Deleting...'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Holiday Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Holiday Request Details</DialogTitle>
            <DialogDescription>
              View detailed information about this holiday request including driver details, dates, and approval status.
            </DialogDescription>
          </DialogHeader>
          {selectedHoliday && (
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Driver Information</h3>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Name:</span>{' '}
                          <span className="text-gray-900">{selectedHoliday.driver_name}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Driver ID:</span>{' '}
                          <span className="text-gray-900">{selectedHoliday.driver_id}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Email:</span>{' '}
                          <span className="text-gray-900">{selectedHoliday.email}</span>
                        </p>
                        {selectedHoliday.phone && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">Phone:</span>{' '}
                            <span className="text-gray-900">{selectedHoliday.phone}</span>
                          </p>
                        )}
                        {selectedHoliday.department && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">Department:</span>{' '}
                            <span className="text-gray-900">{selectedHoliday.department}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                      <div className="space-y-1">
                        {selectedHoliday.emergency_contact && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">Contact:</span>{' '}
                            <span className="text-gray-900">{selectedHoliday.emergency_contact}</span>
                          </p>
                        )}
                        {selectedHoliday.emergency_phone && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">Phone:</span>{' '}
                            <span className="text-gray-900">{selectedHoliday.emergency_phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Holiday Details</h3>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Type:</span>{' '}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Holiday Request
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Status:</span>{' '}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedHoliday.status)}`}>
                            {selectedHoliday.status.charAt(0).toUpperCase() + selectedHoliday.status.slice(1)}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Days:</span>{' '}
                          <span className="text-gray-900 font-medium">{selectedHoliday.requested_days}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Dates</h3>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Start Date:</span>{' '}
                          <span className="text-gray-900">{new Date(selectedHoliday.start_date).toLocaleDateString()}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">End Date:</span>{' '}
                          <span className="text-gray-900">{new Date(selectedHoliday.end_date).toLocaleDateString()}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Submitted:</span>{' '}
                          <span className="text-gray-900">{new Date(selectedHoliday.submitted_at).toLocaleDateString()}</span>
                        </p>
                        {selectedHoliday.approved_at && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">Approved Date:</span>{' '}
                            <span className="text-gray-900">{new Date(selectedHoliday.approved_at).toLocaleDateString()}</span>
                          </p>
                        )}
                        {selectedHoliday.approved_by && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">Approved By:</span>{' '}
                            <span className="text-gray-900">{selectedHoliday.approved_by}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedHoliday.reason && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900">Reason</h3>
                        <div className="bg-gray-50 rounded-md p-3">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedHoliday.reason}</p>
                        </div>
                      </div>
                    )}

                    {selectedHoliday.notes && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
                        <div className="bg-gray-50 rounded-md p-3">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedHoliday.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {vacationSummary && vacationSummary.holiday_history && vacationSummary.holiday_history.length > 0 && (
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Vacation History ({vacationSummary.year})</h3>
                      <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                        <div className="space-y-2">
                          {vacationSummary.holiday_history.map((vacation: any) => (
                            <div key={vacation.id} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">
                              <div>
                                <p className="text-sm font-medium">
                                  {new Date(vacation.start_date).toLocaleDateString()} - {new Date(vacation.end_date).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-600">{vacation.type}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{vacation.days_taken} days</p>
                                <p className="text-xs text-gray-600">
                                  {vacation.approved_at ? new Date(vacation.approved_at).toLocaleDateString() : 'Pending'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedHoliday.status === 'pending' && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => {
                          rejectHolidayMutation.mutate(selectedHoliday.id)
                          setIsViewModalOpen(false)
                        }}
                        disabled={rejectHolidayMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          approveHolidayMutation.mutate(selectedHoliday.id)
                          setIsViewModalOpen(false)
                        }}
                        disabled={approveHolidayMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
