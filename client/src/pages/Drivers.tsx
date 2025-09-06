import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import ImportDriverModal from '@/components/drivers/ImportDriverModal'
import ImportPerformanceModal from '@/components/drivers/ImportPerformanceModal'
import SearchAndFilter from '@/components/common/SearchAndFilter'
import ExportButton from '@/components/common/ExportButton'
import MobilePagination from '@/components/common/MobilePagination'
import { useSearch } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { DRIVER_EXPORT_COLUMNS } from '@/utils/export'
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Upload, 
  Users, 
  Truck, 
  Home, 
  UserCheck,
  Calendar,
  Briefcase,
  Shield,
  Zap
} from 'lucide-react'

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

export default function Drivers() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useSearch()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [employmentFilter, setEmploymentFilter] = useState<string>('all')
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPerformanceImportModal, setShowPerformanceImportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const queryClient = useQueryClient()

  // Fetch drivers from API
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async (): Promise<Driver[]> => {
      const response = await fetch('http://localhost:3001/api/drivers')
      if (!response.ok) {
        throw new Error('Failed to fetch drivers')
      }
      return response.json()
    }
  })

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      driver.license_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (driver.driver_id && driver.driver_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (driver.phone && driver.phone.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (driver.current_address && driver.current_address.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter
    const matchesEmployment = employmentFilter === 'all' || driver.employment_type === employmentFilter
    
    return matchesSearch && matchesStatus && matchesEmployment
  })

  // Pagination for filtered results
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    currentItems: paginatedDrivers,
    totalItems
  } = usePagination({
    data: filteredDrivers,
    initialItemsPerPage: 10,
    mobileItemsPerPage: 5
  })

  const handleEditDriver = (driver: Driver) => {
    navigate(`/drivers/${driver.id}/edit`)
  }

  const handleViewDriver = (driver: Driver) => {
    navigate(`/drivers/${driver.id}`)
  }

  const handleDeleteDriver = async (driver: Driver) => {
    if (!window.confirm(t('drivers.confirmDeleteDriver', { name: driver.name }))) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/drivers/${driver.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete driver')
      }

      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    } catch (error) {
      console.error('Error deleting driver:', error)
      alert(t('drivers.deleteError'))
    }
  }

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
                  Drivers
                </span>
                <div className="text-xs text-slate-500 font-medium">Fleet Management</div>
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
            <p className="text-lg font-medium text-slate-700">{t('drivers.loadingDrivers')}</p>
            <p className="text-sm text-slate-500">{t('drivers.pleaseWait')}</p>
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
                {t('drivers.title')}
              </span>
              <div className="text-xs text-slate-500 font-medium">{t('drivers.fleetManagement', { count: filteredDrivers.length })}</div>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="border-2 border-slate-300 hover:border-indigo-300 hover:bg-indigo-50"
          >
            <Home className="mr-2 h-4 w-4" />
            {t('navigation.home')}
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-2 mb-6">
              <Users className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">{t('drivers.driverManagement')}</span>
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">{t('common.active')}</Badge>
            </div>
            
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {t('drivers.fleetManagementTitle')}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t('drivers.fleetManagementDescription')}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50">
            <div className="flex flex-col sm:flex-row gap-3">
              <ExportButton
                data={filteredDrivers}
                columns={DRIVER_EXPORT_COLUMNS}
                filename="drivers"
                disabled={isLoading || filteredDrivers.length === 0}
                className="border-slate-300 hover:border-blue-300 hover:bg-blue-50 w-full sm:w-auto"
              />
              <Button 
                variant="outline" 
                onClick={() => setShowImportModal(true)}
                className="border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                {t('drivers.importDrivers')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPerformanceImportModal(true)}
                className="border-slate-300 hover:border-purple-300 hover:bg-purple-50 w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Performance
              </Button>
            </div>
            <Button 
              onClick={() => navigate('/drivers/add')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('drivers.addDriver')}
            </Button>
          </div>

          {/* Enhanced Search and Filters */}
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={t('drivers.searchPlaceholder')}
            showFilters={showFilters}
            onToggleFilters={setShowFilters}
            filters={{
              status: {
                value: statusFilter,
                onChange: setStatusFilter,
                label: t('common.status'),
                options: [
                  { value: 'all', label: t('drivers.allStatus') },
                  { value: 'Active', label: t('drivers.active') },
                  { value: 'Inactive', label: t('drivers.inactive') },
                  { value: 'On Holiday', label: t('drivers.onHoliday') }
                ]
              },
              employment: {
                value: employmentFilter,
                onChange: setEmploymentFilter,
                label: t('drivers.employmentType'),
                options: [
                  { value: 'all', label: t('drivers.allTypes') },
                  { value: 'Fulltime', label: t('drivers.fulltime') },
                  { value: 'Minijob', label: t('drivers.minijob') }
                ]
              }
            }}
            onReset={() => {
              setStatusFilter('all')
              setEmploymentFilter('all')
            }}
          />

          {/* Enhanced Drivers Table */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">{t('drivers.allDrivers')}</CardTitle>
                    <p className="text-slate-600 text-sm mt-1">
                      {t('drivers.showingDrivers', { 
                        showing: paginatedDrivers.length, 
                        total: filteredDrivers.length,
                        count: filteredDrivers.length 
                      })}
                    </p>
                  </div>
                </div>
                {filteredDrivers.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border">
                    <Zap className="h-4 w-4" />
                    <span>Fleet Status: Active</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-4">
                {paginatedDrivers.map((driver) => (
                  <Card key={driver.id} className="p-4 border border-slate-200 hover:shadow-md transition-all">
                    <div className="space-y-4">
                      {/* Driver Header */}
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-14 w-14 ring-2 ring-slate-200">
                          <AvatarImage 
                            src={driver.profile_picture ? `http://localhost:3001${driver.profile_picture}` : undefined}
                            alt={`${driver.name}'s profile`} 
                          />
                          <AvatarFallback className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-semibold text-lg">
                            {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 text-lg">{driver.name}</h3>
                          <p className="text-sm text-slate-600">{driver.email}</p>
                          {driver.phone && (
                            <p className="text-xs text-slate-500">{driver.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Driver ID */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <Briefcase className="h-4 w-4 text-indigo-600" />
                        </div>
                        <span className="font-mono text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                          {driver.driver_id || `DRV-${new Date().getFullYear()}-${driver.id.toString().padStart(4, '0')}`}
                        </span>
                      </div>

                      {/* Status and Employment */}
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          variant={
                            driver.status === 'Active' ? 'default' :
                            driver.status === 'On Holiday' ? 'secondary' : 'destructive'
                          }
                          className={`shadow-sm ${
                            driver.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' :
                            driver.status === 'On Holiday' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {driver.status}
                        </Badge>
                        <Badge 
                          variant={driver.employment_type === 'Fulltime' ? 'default' : 'secondary'}
                          className={`shadow-sm ${
                            driver.employment_type === 'Fulltime' 
                              ? 'bg-blue-100 text-blue-800 border-blue-200' 
                              : 'bg-orange-100 text-orange-800 border-orange-200'
                          }`}
                        >
                          {driver.employment_type === 'Fulltime' ? 'Full-time' : 'Mini-job'}
                        </Badge>
                      </div>

                      {/* Vacation Days and Join Date */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className="font-medium text-slate-700">Vacation Days</span>
                          </div>
                          <span className="font-semibold text-slate-900">
                            {(driver.annual_vacation_days || 25) - (driver.used_vacation_days || 0)} / {driver.annual_vacation_days || 25}
                          </span>
                          <p className="text-xs text-slate-500">remaining</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <UserCheck className="h-4 w-4 text-slate-500" />
                            <span className="font-medium text-slate-700">Join Date</span>
                          </div>
                          <p className="font-semibold text-slate-900">
                            {new Date(driver.join_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDriver(driver)}
                          className="border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 flex-1"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditDriver(driver)}
                          className="border-slate-300 hover:border-blue-300 hover:bg-blue-50 flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteDriver(driver)}
                          className="border-slate-300 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 flex-1"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">{t('drivers.driverID')}</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">{t('drivers.driverDetails')}</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">{t('drivers.employment')}</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">{t('drivers.vacationDays')}</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">{t('common.status')}</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">{t('drivers.joinDate')}</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDrivers.map((driver, index) => (
                      <tr key={driver.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-all ${index % 2 === 0 ? 'bg-slate-25' : ''}`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                              <Briefcase className="h-4 w-4 text-indigo-600" />
                            </div>
                            <span className="font-mono text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                              {driver.driver_id || `DRV-${new Date().getFullYear()}-${driver.id.toString().padStart(4, '0')}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12 ring-2 ring-slate-200">
                              <AvatarImage 
                                src={driver.profile_picture ? `http://localhost:3001${driver.profile_picture}` : undefined}
                                alt={`${driver.name}'s profile`} 
                              />
                              <AvatarFallback className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-semibold">
                                {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-slate-900">{driver.name}</p>
                              <p className="text-sm text-slate-600">{driver.email}</p>
                              {driver.phone && (
                                <p className="text-xs text-slate-500">{driver.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={driver.employment_type === 'Fulltime' ? 'default' : 'secondary'}
                            className={`shadow-sm ${
                              driver.employment_type === 'Fulltime' 
                                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                : 'bg-orange-100 text-orange-800 border-orange-200'
                            }`}
                          >
                            {driver.employment_type === 'Fulltime' ? t('drivers.fulltime') : t('drivers.minijob')}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-500" />
                              <span className="font-semibold text-slate-900">
                                {(driver.annual_vacation_days || 25) - (driver.used_vacation_days || 0)} / {driver.annual_vacation_days || 25}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{t('drivers.daysRemaining')}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={
                              driver.status === 'Active' ? 'default' :
                              driver.status === 'On Holiday' ? 'secondary' : 'destructive'
                            }
                            className={`shadow-sm ${
                              driver.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' :
                              driver.status === 'On Holiday' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            }`}
                          >
                            {driver.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-medium text-slate-700">
                            {new Date(driver.join_date).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditDriver(driver)}
                              className="border-slate-300 hover:border-blue-300 hover:bg-blue-50"
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDriver(driver)}
                              className="border-slate-300 hover:border-indigo-300 hover:bg-indigo-50"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              {t('common.view')}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteDriver(driver)}
                              className="border-slate-300 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              {t('common.delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                
              {filteredDrivers.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-medium text-slate-700 mb-2">{t('drivers.noDriversFound')}</p>
                  <p className="text-slate-500">{t('drivers.adjustSearchCriteria')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {filteredDrivers.length > 0 && (
            <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
              <CardContent className="pt-6">
                <MobilePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  onItemsPerPageChange={setItemsPerPage}
                  showItemsPerPage={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Footer Security Notice */}
          <div className="mt-12 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
            <div className="flex items-center justify-center gap-2 text-sm text-indigo-700">
              <Shield className="h-4 w-4" />
              <span>
                {t('drivers.securityNotice')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ImportDriverModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
      <ImportPerformanceModal
        isOpen={showPerformanceImportModal}
        onClose={() => setShowPerformanceImportModal(false)}
      />
    </div>
  )
}
