import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import SearchAndFilter from '@/components/common/SearchAndFilter'
import ExportButton from '@/components/common/ExportButton'
import MobilePagination from '@/components/common/MobilePagination'
import { useSearch } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { useNotifications } from '@/contexts/NotificationContext'
import { WARNING_EXPORT_COLUMNS } from '@/utils/export'
import { 
  Plus, 
  AlertTriangle, 
  FileText, 
  Eye, 
  Trash2, 
  Truck,
  Home,
  Shield,
  Users,
  Zap,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface Driver {
  id: number
  name: string
  email: string
}

interface Warning {
  id: number
  driver_id: number
  driver_name: string
  driver_email: string
  type: string
  description: string
  severity: 'Low' | 'Medium' | 'High'
  status: 'Active' | 'Under Review' | 'Resolved'
  location?: string
  date: string
  expiration_date?: string
  pdf_attachment?: string
  created_at: string
  updated_at: string
}

export default function Warnings() {
  const navigate = useNavigate()
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useSearch()
  const { createNotification } = useNotifications()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null)
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('all')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    driver_id: '',
    category_id: '',
    type: '',
    description: '',
    severity: 'Low' as const,
    status: 'Active' as const,
    location: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    expiration_date: ''
  })

  // Fetch warnings
  const { data: warnings = [], isLoading } = useQuery({
    queryKey: ['warnings'],
    queryFn: async () => {
      const response = await fetch('/api/warnings')
      if (!response.ok) throw new Error('Failed to fetch warnings')
      return response.json()
    }
  })

  // Fetch drivers for dropdown
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const response = await fetch('/api/drivers')
      if (!response.ok) throw new Error('Failed to fetch drivers')
      return response.json()
    }
  })

  // Fetch warning categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['warning-categories'],
    queryFn: async () => {
      const response = await fetch('/api/warning-categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      return response.json()
    }
  })

  // Add warning mutation
  const addWarningMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/warnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to add warning')
      return response.json()
    },
    onSuccess: async (newWarning) => {
      queryClient.invalidateQueries({ queryKey: ['warnings'] })
      
      // Find the driver name for the notification
      const driver = drivers?.find((d: Driver) => d.id === parseInt(formData.driver_id))
      
      // Create notification
      await createNotification({
        type: 'warning_created',
        title: 'New Warning Issued',
        message: `A ${formData.severity.toLowerCase()} severity warning has been issued for ${driver?.name || 'driver'}: ${formData.type}`,
        icon: 'AlertTriangle',
        severity: (formData.severity as string) === 'High' ? 'error' : (formData.severity as string) === 'Medium' ? 'warning' : 'info',
        driver_id: parseInt(formData.driver_id),
        action_url: `/warnings`,
        action_label: 'View Warning',
        metadata: {
          warning_id: newWarning.id,
          warning_type: formData.type,
          warning_severity: formData.severity
        }
      })
      
      setIsAddModalOpen(false)
      setFormData({
        driver_id: '',
        category_id: '',
        type: '',
        description: '',
        severity: 'Low',
        status: 'Active',
        location: '',
        date: new Date().toISOString().split('T')[0],
        expiration_date: ''
      })
      toast.success('Warning added successfully')
    },
    onError: () => {
      toast.error('Failed to add warning')
    }
  })

  // Delete warning mutation
  const deleteWarningMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/warnings/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete warning')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warnings'] })
      toast.success('Warning deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete warning')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addWarningMutation.mutate(formData)
  }

  const handleViewWarning = (warning: Warning) => {
    setSelectedWarning(warning)
    setIsViewModalOpen(true)
  }

  const handleDeleteWarning = (id: number) => {
    deleteWarningMutation.mutate(id)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-red-100 text-red-800 border-red-200'
      case 'Under Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Filter warnings based on search and filters
  const filteredWarnings = warnings.filter((warning: Warning) => {
    const matchesSearch = debouncedSearchTerm === '' || 
      warning.driver_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      warning.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      warning.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      warning.location?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

    const matchesSeverity = selectedSeverityFilter === 'all' || warning.severity === selectedSeverityFilter
    const matchesStatus = selectedStatusFilter === 'all' || warning.status === selectedStatusFilter
    const matchesType = selectedTypeFilter === 'all' || warning.type === selectedTypeFilter

    return matchesSearch && matchesSeverity && matchesStatus && matchesType
  })

  // Pagination for filtered warnings
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    currentItems: paginatedWarnings,
    totalItems
  } = usePagination<Warning>({
    data: filteredWarnings,
    initialItemsPerPage: 10,
    mobileItemsPerPage: 5
  })

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' }
  ]

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Under Review', label: 'Under Review' },
    { value: 'Resolved', label: 'Resolved' }
  ]

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'Speed Violation', label: 'Speed Violation' },
    { value: 'Aggressive Driving', label: 'Aggressive Driving' },
    { value: 'Late Delivery', label: 'Late Delivery' },
    { value: 'Vehicle Damage', label: 'Vehicle Damage' },
    { value: 'Customer Complaint', label: 'Customer Complaint' },
    { value: 'Safety Violation', label: 'Safety Violation' },
    { value: 'Other', label: 'Other' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        {/* Modern Header */}
        <nav className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Warnings
                </span>
                <div className="text-xs text-slate-500 font-medium">Safety Management</div>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="border-2 border-slate-300 hover:border-indigo-300 hover:bg-indigo-50"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-slate-700">Loading warnings...</p>
            <p className="text-sm text-slate-500">Please wait while we fetch safety data</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Modern Header */}
      <nav className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Warnings
              </span>
              <div className="text-xs text-slate-500 font-medium">Safety Management ({totalItems} warnings)</div>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="border-2 border-slate-300 hover:border-indigo-300 hover:bg-indigo-50"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Safety Management</span>
              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Alert</Badge>
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              Driver Warnings
            </h1>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Manage and track driver warnings, violations, and safety incidents with comprehensive monitoring.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-xl p-4 shadow-lg shadow-slate-200/50">
            <div className="flex gap-3">
              <ExportButton
                data={filteredWarnings}
                columns={WARNING_EXPORT_COLUMNS}
                filename="driver-warnings"
                variant="outline"
                size="sm"
                className="border-slate-300 hover:border-blue-300 hover:bg-blue-50"
              />
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg shadow-orange-500/25">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Warning
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md sm:max-w-lg w-full mx-4">
              <DialogHeader>
                <DialogTitle>Add New Warning</DialogTitle>
                <DialogDescription>
                  Create a new warning for a driver. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="driver_id">Driver</Label>
                    <Select value={formData.driver_id} onValueChange={(value) => setFormData({...formData, driver_id: value})}>
                      <SelectTrigger id="driver_id">
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
                  <div>
                    <Label htmlFor="category_id">Category</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                      <SelectTrigger id="category_id">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Warning Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Speed Violation">Speed Violation</SelectItem>
                        <SelectItem value="Aggressive Driving">Aggressive Driving</SelectItem>
                        <SelectItem value="Late Delivery">Late Delivery</SelectItem>
                        <SelectItem value="Vehicle Damage">Vehicle Damage</SelectItem>
                        <SelectItem value="Customer Complaint">Customer Complaint</SelectItem>
                        <SelectItem value="Safety Violation">Safety Violation</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the warning incident..."
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value as any})}>
                      <SelectTrigger id="severity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <Label htmlFor="expiration_date">Expiration Date (Optional)</Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={addWarningMutation.isPending} className="flex-1">
                    {addWarningMutation.isPending ? 'Adding...' : 'Add Warning'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="mt-8 mb-8">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-700">Total Warnings</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-slate-100 to-gray-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-4 w-4 text-slate-600" />
              </div>
            </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-slate-900 mb-1">{warnings.length}</div>
            <p className="text-xs text-slate-600">All time records</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-700">Active Warnings</CardTitle>
            <div className="w-8 h-8 bg-gradient-to-r from-red-100 to-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {warnings.filter((w: Warning) => w.status === 'Active').length}
            </div>
            <p className="text-xs text-slate-600">Require attention</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-700">High Severity</CardTitle>
            <div className="w-8 h-8 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {warnings.filter((w: Warning) => w.severity === 'High').length}
            </div>
            <p className="text-xs text-slate-600">Critical issues</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-700">Resolved</CardTitle>
            <div className="w-8 h-8 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {warnings.filter((w: Warning) => w.status === 'Resolved').length}
            </div>
            <p className="text-xs text-slate-600">Successfully closed</p>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Search and Filter Section */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filters={{
          severity: {
            label: 'Severity',
            value: selectedSeverityFilter,
            onChange: setSelectedSeverityFilter,
            options: severityOptions
          },
          status: {
            label: 'Status',
            value: selectedStatusFilter,
            onChange: setSelectedStatusFilter,
            options: statusOptions
          },
          type: {
            label: 'Type',
            value: selectedTypeFilter,
            onChange: setSelectedTypeFilter,
            options: typeOptions
          }
        }}
        placeholder="Search warnings by driver, type, description, or location..."
      />

      {/* Enhanced Warnings List */}
      <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Driver Warnings</CardTitle>
                <p className="text-slate-600 text-sm mt-1">
                  {totalItems} warning{totalItems !== 1 ? 's' : ''} in the system
                </p>
              </div>
            </div>
            {totalItems > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border">
                <Zap className="h-4 w-4" />
                <span>Safety Monitoring: Active</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {totalItems === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-lg font-medium text-slate-700 mb-2">No warnings found</p>
              <p className="text-slate-500">Your fleet is performing safely or try adjusting your filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedWarnings.map((warning: Warning, index: number) => (
                <div key={warning.id} className={`border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-300 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-slate-100 to-gray-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-base">{warning.driver_name}</h3>
                          <p className="text-xs text-slate-600">{warning.driver_email}</p>
                        </div>
                        <div className="flex gap-2 ml-auto">
                          <Badge 
                            className={`shadow-sm text-xs ${getSeverityColor(warning.severity)}`}
                          >
                            {warning.severity}
                          </Badge>
                          <Badge 
                            className={`shadow-sm text-xs ${getStatusColor(warning.status)}`}
                          >
                            {warning.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-600">
                            <span className="font-semibold text-slate-900">Type:</span> {warning.type}
                          </p>
                          <p className="text-xs text-slate-600">
                            <span className="font-semibold text-slate-900">Description:</span> {warning.description}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {warning.location && (
                            <p className="text-xs text-slate-600">
                              <span className="font-semibold text-slate-900">Location:</span> {warning.location}
                            </p>
                          )}
                          <p className="text-xs text-slate-600">
                            <span className="font-semibold text-slate-900">Date:</span> {new Date(warning.date).toLocaleDateString()}
                          </p>
                          {warning.expiration_date && (
                            <p className="text-xs text-slate-600">
                              <span className="font-semibold text-slate-900">Expires:</span> {new Date(warning.expiration_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewWarning(warning)}
                        className="border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 text-xs px-2 py-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteWarning(warning.id)}
                        disabled={deleteWarningMutation.isPending}
                        className="border-slate-300 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs px-2 py-1"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {totalItems > 0 && (
            <div className="mt-6 flex justify-center">
              <MobilePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                showItemsPerPage={true}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Security Notice */}
      <div className="mt-8 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
        <div className="flex items-center justify-center gap-2 text-sm text-orange-700">
          <Shield className="h-4 w-4" />
          <span>
            All warning data is securely encrypted and complies with safety management regulations.
          </span>
        </div>
      </div>

      {/* View Warning Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Warning Details</DialogTitle>
            <DialogDescription>
              View detailed information about this warning record.
            </DialogDescription>
          </DialogHeader>
          {selectedWarning && (
            <div className="space-y-4">
              <div>
                <Label>Driver</Label>
                <p className="text-sm font-medium">{selectedWarning.driver_name}</p>
                <p className="text-sm text-gray-600">{selectedWarning.driver_email}</p>
              </div>
              <div>
                <Label>Warning Type</Label>
                <p className="text-sm">{selectedWarning.type}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm">{selectedWarning.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Severity</Label>
                  <Badge className={getSeverityColor(selectedWarning.severity)}>
                    {selectedWarning.severity}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedWarning.status)}>
                    {selectedWarning.status}
                  </Badge>
                </div>
              </div>
              {selectedWarning.location && (
                <div>
                  <Label>Location</Label>
                  <p className="text-sm">{selectedWarning.location}</p>
                </div>
              )}
              <div>
                <Label>Date</Label>
                <p className="text-sm">{new Date(selectedWarning.date).toLocaleDateString()}</p>
              </div>
              {selectedWarning.expiration_date && (
                <div>
                  <Label>Expiration Date</Label>
                  <p className="text-sm">{new Date(selectedWarning.expiration_date).toLocaleDateString()}</p>
                </div>
              )}
              {selectedWarning.pdf_attachment && (
                <div>
                  <Label>Attachment</Label>
                  <Button size="sm" variant="outline" className="mt-1">
                    <FileText className="h-4 w-4 mr-2" />
                    View PDF
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <Label>Created</Label>
                  <p>{new Date(selectedWarning.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Updated</Label>
                  <p>{new Date(selectedWarning.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  </div>
  )
}
