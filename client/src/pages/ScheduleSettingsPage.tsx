/* eslint-disable react/forbid-dom-props */
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { API_ENDPOINTS } from '@/config/api'
import { 
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Truck,
  Route,
  Check,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkingTour {
  id: number
  name: string
  description?: string
  color: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

const defaultColors = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
  '#A855F7', // Purple
]

const defaultTours = [
  "Standard Parcel - Diesel",
  "Cycle A/B",
  "Cycle B/C", 
  "Cycle A",
  "Standard Parcel Medium - Diesel",
  "Standard Parcel - EVAN",
  "Cycle C",
  "EXTRA"
]

export default function ScheduleSettingsPage() {
  const [workingTours, setWorkingTours] = useState<WorkingTour[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTour, setEditingTour] = useState<WorkingTour | null>(null)
  const [newTour, setNewTour] = useState<Partial<WorkingTour>>({
    name: '',
    description: '',
    color: defaultColors[0],
    is_active: true
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkingTours()
  }, [])

  // Hydrate color swatches since inline styles were removed for linting.
  // We manually apply background colors based on data-color attributes.
  useEffect(() => {
    const applyColors = () => {
      const swatches = document.querySelectorAll<HTMLElement>('.tour-color-swatch[data-color]:not([data-color-applied])')
      swatches.forEach(el => {
        const color = el.getAttribute('data-color')
        if (color) {
          el.style.setProperty('--_dynamic-color', color)
          el.setAttribute('data-color-applied', 'true')
        }
      })

      const buttons = document.querySelectorAll<HTMLElement>('button[data-color]:not([data-color-applied])')
      buttons.forEach(el => {
        const color = el.getAttribute('data-color')
        if (color) {
          el.style.setProperty('--_dynamic-color', color)
          el.setAttribute('data-color-applied', 'true')
        }
      })
    }
    applyColors()
  }, [workingTours, editingTour, newTour])

  const fetchWorkingTours = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.workingTours)
      if (response.ok) {
        const data = await response.json()
        // Normalize null descriptions to empty strings for form safety
        setWorkingTours(data.map((t: any) => ({
          ...t,
          description: t.description ?? ''
        })))
      } else {
        // If no tours exist, initialize with defaults
        await initializeDefaultTours()
      }
    } catch (error) {
      console.error('Error fetching working tours:', error)
      // Initialize with defaults if API fails
      await initializeDefaultTours()
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaultTours = async () => {
    const tours = defaultTours.map((name, index) => ({
      id: index + 1,
      name,
      color: defaultColors[index % defaultColors.length],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    setWorkingTours(tours)
    
    // Try to save to backend
    try {
      await fetch(API_ENDPOINTS.workingToursBulk, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tours })
      })
    } catch (error) {
      console.error('Error saving default tours:', error)
    }
  }

  const handleSaveTour = async (tour: Partial<WorkingTour>) => {
    try {
      const method = tour.id ? 'PUT' : 'POST'
      const url = tour.id ? API_ENDPOINTS.workingTourById(tour.id.toString()) : API_ENDPOINTS.workingTours
      
      // Sanitize payload: Zod schema doesn't accept null for description; omit if empty
      const payload: any = {
        name: tour.name?.trim() || '',
        color: tour.color,
        is_active: tour.is_active !== false
      }
      if (tour.description && tour.description.trim().length > 0) {
        payload.description = tour.description.trim()
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        // Try to extract detailed error for better UX
        let message = 'Failed to save working tour'
        try {
          const data = await response.json()
          if (data?.error) {
            message = data.error
          }
          // Validation errors from Zod
          if (data?.details && Array.isArray(data.details)) {
            const first = data.details[0]
            if (first?.message) {
              let detailMsg = first.message
              if (first.path?.[0] === 'description' && first.message.includes('Expected string')) {
                detailMsg = 'Description must be text. Leave it blank instead of null.'
              }
              message += `: ${detailMsg}`
            }
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message)
      }

      const savedTour = await response.json()
      
      if (tour.id) {
  setWorkingTours(prev => prev.map(t => t.id === tour.id ? { ...savedTour, description: savedTour.description ?? '' } : t))
        setEditingTour(null)
      } else {
  setWorkingTours(prev => [...prev, { ...savedTour, description: savedTour.description ?? '' }])
        setNewTour({ name: '', description: '', color: defaultColors[0], is_active: true })
        setShowAddForm(false)
      }

      toast({
        title: 'Success',
        description: `Working tour ${tour.id ? 'updated' : 'created'} successfully`,
      })
    } catch (error) {
      console.error('Error saving tour:', error)
      const message = error instanceof Error ? error.message : 'Failed to save working tour'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      })
    }
  }

  const handleDeleteTour = async (id: number) => {
    if (!confirm('Are you sure you want to delete this working tour?')) return

    try {
      const response = await fetch(API_ENDPOINTS.workingTourById(id.toString()), {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete tour')

      setWorkingTours(prev => prev.filter(t => t.id !== id))
      
      toast({
        title: 'Success',
        description: 'Working tour deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting tour:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete working tour',
        variant: 'destructive'
      })
    }
  }

  const toggleTourStatus = async (id: number, is_active: boolean) => {
    try {
      const response = await fetch(API_ENDPOINTS.workingTourById(id.toString()), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active })
      })

      if (!response.ok) throw new Error('Failed to update tour status')

      setWorkingTours(prev => prev.map(t => 
        t.id === id ? { ...t, is_active } : t
      ))
    } catch (error) {
      console.error('Error updating tour status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update tour status',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-700">Loading Settings</h2>
          <p className="mt-2 text-slate-500">Preparing schedule configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Schedule Settings</h1>
              <p className="text-slate-600">Manage working tours and schedule configurations</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 hover:bg-purple-700 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Working Tour
          </Button>
        </div>
      </div>

      {/* Add New Tour Form */}
      {showAddForm && (
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Working Tour
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false)
                  setNewTour({ name: '', description: '', color: defaultColors[0], is_active: true })
                }}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tour Name *
                  </label>
                  <input
                    type="text"
                    value={newTour.name}
                    onChange={(e) => setNewTour(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Parcel - Diesel"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTour.description}
                    onChange={(e) => setNewTour(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description for this working tour"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color
                  </label>
                  
                  {/* Custom Color Picker */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={newTour.color}
                          onChange={(e) => setNewTour(prev => ({ ...prev, color: e.target.value }))}
                          className="w-16 h-16 rounded-xl border-2 border-slate-300 cursor-pointer shadow-md hover:shadow-lg transition-shadow duration-200"
                          title="Choose custom color"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border-2 border-slate-300 flex items-center justify-center">
                          <Edit className="h-3 w-3 text-slate-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">Custom Color</p>
                        <p className="text-xs text-slate-500">Click to open color picker</p>
                        <div className="mt-1 px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">
                          {newTour.color?.toUpperCase() || '#000000'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Color Options */}
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-2">Quick Colors</p>
                      <div className="grid grid-cols-8 gap-2">
            {defaultColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewTour(prev => ({ ...prev, color }))}
                            className={cn(
                              "w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110",
                              newTour.color === color 
                                ? "border-slate-600 ring-2 ring-slate-300 shadow-lg" 
                                : "border-slate-200 hover:border-slate-400"
                            )}
                            data-color={color}
                            title={`Quick select ${color}`}
                            aria-label={`Quick select color ${color}`}
                          >
                            {newTour.color === color && (
                              <Check className="h-4 w-4 text-white mx-auto drop-shadow-sm" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newTourActive"
                    checked={newTour.is_active}
                    onChange={(e) => setNewTour(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="newTourActive" className="text-sm font-medium text-slate-700">
                    Active (available for scheduling)
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => handleSaveTour(newTour)}
                disabled={!newTour.name?.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Tour
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setNewTour({ name: '', description: '', color: defaultColors[0], is_active: true })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Working Tours List */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Working Tours ({workingTours.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {workingTours.map((tour) => (
              <div key={tour.id} className="p-6 hover:bg-slate-50 transition-colors duration-150">
                {editingTour?.id === tour.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Tour Name
                        </label>
                        <input
                          type="text"
                          value={editingTour.name}
                          onChange={(e) => setEditingTour(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Edit tour name"
                          placeholder="Enter tour name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Color
                        </label>
                        <div className="space-y-2">
                          {/* Custom Color Picker for Edit */}
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editingTour.color}
                              onChange={(e) => setEditingTour(prev => prev ? { ...prev, color: e.target.value } : null)}
                              className="w-10 h-10 rounded-lg border-2 border-slate-300 cursor-pointer"
                              title="Choose custom color"
                            />
                            <div className="text-xs font-mono text-slate-600 px-2 py-1 bg-slate-100 rounded">
                              {editingTour.color?.toUpperCase()}
                            </div>
                          </div>
                          {/* Quick Colors for Edit */}
                          <div className="flex gap-1">
              {defaultColors.slice(0, 8).map((color) => (
                              <button
                                key={color}
                                onClick={() => setEditingTour(prev => prev ? { ...prev, color } : null)}
                                className={cn(
                                  "w-7 h-7 rounded border-2 transition-all hover:scale-110",
                                  editingTour.color === color ? "border-slate-600 ring-1 ring-slate-300" : "border-slate-200"
                                )}
                                data-color={color}
                                title={`Quick select ${color}`}
                                aria-label={`Quick select color ${color}`}
                              >
                                {editingTour.color === color && (
                                  <Check className="h-3 w-3 text-white mx-auto drop-shadow-sm" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editingTour.description || ''}
                        onChange={(e) => setEditingTour(prev => prev ? { ...prev, description: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Edit tour description"
                        placeholder="Enter tour description"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveTour(editingTour)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTour(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-white shadow-lg flex items-center justify-center tour-color-swatch"
                        data-color={tour.color}
                        title={`Tour color: ${tour.color}`}
                      >
                        <Truck className="h-6 w-6 text-white" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{tour.name}</h3>
                          <Badge 
                            variant={tour.is_active ? "default" : "secondary"}
                            className={tour.is_active ? "bg-green-100 text-green-700" : ""}
                          >
                            {tour.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {tour.description && (
                          <p className="text-sm text-slate-600 mt-1">{tour.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleTourStatus(tour.id, !tour.is_active)}
                        className={cn(
                          tour.is_active 
                            ? "text-orange-600 border-orange-600 hover:bg-orange-50" 
                            : "text-green-600 border-green-600 hover:bg-green-50"
                        )}
                      >
                        {tour.is_active ? (
                          <>
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTour(tour)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTour(tour.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {workingTours.length === 0 && (
            <div className="p-12 text-center">
              <Route className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Working Tours</h3>
              <p className="text-slate-600 mb-4">Get started by adding your first working tour.</p>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Working Tour
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
