import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, User, Database, Activity, Filter, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface AuditLog {
  id: number
  table_name: string
  record_id: number
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  old_values?: any
  new_values?: any
  user_id?: number
  user_email?: string
  username?: string
  user_full_email?: string
  ip_address?: string
  user_agent?: string
  endpoint?: string
  method?: string
  created_at: string
}

interface AuditResponse {
  audit_logs: AuditLog[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}

export default function AuditLogsPage() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [filters, setFilters] = useState({
    table_name: 'all',
    action: 'all',
    user_id: '',
    start_date: '',
    end_date: ''
  })
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 50

  // Fetch audit logs
  const { data: auditData, isLoading, error, refetch } = useQuery<AuditResponse>({
    queryKey: ['audit-logs', filters, currentPage],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value)
        }
      })
      
      queryParams.append('limit', itemsPerPage.toString())
      queryParams.append('offset', (currentPage * itemsPerPage).toString())
      
      const response = await fetch(`http://localhost:3001/api/audit-logs?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }
      return response.json()
    }
  })

  // Fetch audit statistics
  const { data: stats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/audit-logs/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch audit statistics')
      }
      return response.json()
    }
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(0) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      table_name: 'all',
      action: 'all',
      user_id: '',
      start_date: '',
      end_date: ''
    })
    setCurrentPage(0)
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-200'
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatJson = (obj: any) => {
    if (!obj) return 'N/A'
    return JSON.stringify(obj, null, 2)
  }

  const openDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setIsDetailsOpen(true)
  }

  if (error) {
    toast.error('Failed to load audit logs')
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading audit logs. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-2">Track all system changes and user activities</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Actions</p>
                  <p className="text-2xl font-bold">
                    {stats.action_stats?.reduce((sum: number, stat: any) => sum + stat.count, 0) || 0}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Creates</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.action_stats?.find((s: any) => s.action === 'CREATE')?.count || 0}
                  </p>
                </div>
                <Database className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Updates</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.action_stats?.find((s: any) => s.action === 'UPDATE')?.count || 0}
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Deletes</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.action_stats?.find((s: any) => s.action === 'DELETE')?.count || 0}
                  </p>
                </div>
                <Database className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Table</label>
              <Select value={filters.table_name} onValueChange={(value) => handleFilterChange('table_name', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tables</SelectItem>
                  <SelectItem value="drivers">Drivers</SelectItem>
                  <SelectItem value="warnings">Warnings</SelectItem>
                  <SelectItem value="holidays">Holidays</SelectItem>
                  <SelectItem value="holiday_requests">Holiday Requests</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Action</label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          {auditData && (
            <p className="text-sm text-gray-600">
              Showing {auditData.pagination.offset + 1} - {Math.min(auditData.pagination.offset + auditData.pagination.limit, auditData.pagination.total)} of {auditData.pagination.total} entries
            </p>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading audit logs...</div>
          ) : auditData?.audit_logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No audit logs found</div>
          ) : (
            <div className="space-y-4">
              <div className="h-96 overflow-y-auto space-y-4">
                {auditData?.audit_logs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => openDetails(log)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                        <span className="font-medium">{log.table_name}</span>
                        <span className="text-sm text-gray-600">ID: {log.record_id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {log.user_full_email || log.user_email || 'System'}
                      </div>
                      <div>{log.endpoint}</div>
                      <div>{log.ip_address}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600">
                  Page {currentPage + 1}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!auditData?.pagination.has_more}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Action:</strong> <Badge className={getActionBadgeColor(selectedLog.action)}>{selectedLog.action}</Badge></div>
                    <div><strong>Table:</strong> {selectedLog.table_name}</div>
                    <div><strong>Record ID:</strong> {selectedLog.record_id}</div>
                    <div><strong>Timestamp:</strong> {formatDate(selectedLog.created_at)}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">User Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>User:</strong> {selectedLog.user_full_email || selectedLog.user_email || 'System'}</div>
                    <div><strong>Username:</strong> {selectedLog.username || 'N/A'}</div>
                    <div><strong>IP Address:</strong> {selectedLog.ip_address || 'N/A'}</div>
                    <div><strong>Endpoint:</strong> {selectedLog.endpoint || 'N/A'}</div>
                    <div><strong>Method:</strong> {selectedLog.method || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              {selectedLog.action === 'UPDATE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Old Values</h3>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                      {formatJson(selectedLog.old_values)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">New Values</h3>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                      {formatJson(selectedLog.new_values)}
                    </pre>
                  </div>
                </div>
              )}
              
              {selectedLog.action === 'CREATE' && selectedLog.new_values && (
                <div>
                  <h3 className="font-medium mb-2">Created Data</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                    {formatJson(selectedLog.new_values)}
                  </pre>
                </div>
              )}
              
              {selectedLog.action === 'DELETE' && selectedLog.old_values && (
                <div>
                  <h3 className="font-medium mb-2">Deleted Data</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                    {formatJson(selectedLog.old_values)}
                  </pre>
                </div>
              )}
              
              {selectedLog.user_agent && (
                <div>
                  <h3 className="font-medium mb-2">User Agent</h3>
                  <p className="text-xs bg-gray-100 p-3 rounded break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
