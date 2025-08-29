import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Copy,
  TrendingUp,
  File,
  Clock
} from 'lucide-react'

interface WarningTemplate {
  id: number
  name: string
  category_id: number | null
  category_name: string | null
  category_color: string | null
  category_icon: string | null
  type: string
  description: string
  severity: 'Low' | 'Medium' | 'High'
  location_placeholder: string | null
  expiration_days: number | null
  is_active: boolean
  usage_count: number
  created_by: string
  created_at: string
  updated_at: string
}

interface WarningCategory {
  id: number
  name: string
  color: string
  icon: string
}

export default function WarningTemplateManager() {
  const [editingTemplate, setEditingTemplate] = useState<WarningTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category_id: 'none',
    type: '',
    description: '',
    severity: 'Medium' as 'Low' | 'Medium' | 'High',
    location_placeholder: '',
    expiration_days: ''
  })

  const queryClient = useQueryClient()

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['warning-templates'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/warning-templates')
      if (!response.ok) throw new Error('Failed to fetch templates')
      return response.json()
    }
  })

  // Fetch categories for selection
  const { data: categories = [] } = useQuery({
    queryKey: ['warning-categories'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/warning-categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      return response.json()
    }
  })

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        category_id: data.category_id && data.category_id !== 'none' ? parseInt(data.category_id) : null,
        expiration_days: data.expiration_days ? parseInt(data.expiration_days) : null
      }
      const response = await fetch('http://localhost:3001/api/warning-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error('Failed to create template')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warning-templates'] })
      setIsCreating(false)
      resetForm()
    }
  })

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const payload = {
        ...data,
        category_id: data.category_id && data.category_id !== 'none' ? parseInt(data.category_id) : null,
        expiration_days: data.expiration_days ? parseInt(data.expiration_days) : null
      }
      const response = await fetch(`http://localhost:3001/api/warning-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error('Failed to update template')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warning-templates'] })
      setEditingTemplate(null)
      resetForm()
    }
  })

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:3001/api/warning-templates/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete template')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warning-templates'] })
    }
  })

  // Duplicate template mutation
  const duplicateMutation = useMutation({
    mutationFn: async (template: WarningTemplate) => {
      const payload = {
        name: `${template.name} (Copy)`,
        category_id: template.category_id,
        type: template.type,
        description: template.description,
        severity: template.severity,
        location_placeholder: template.location_placeholder,
        expiration_days: template.expiration_days
      }
      const response = await fetch('http://localhost:3001/api/warning-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error('Failed to duplicate template')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warning-templates'] })
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: 'none',
      type: '',
      description: '',
      severity: 'Medium',
      location_placeholder: '',
      expiration_days: ''
    })
  }

  const handleCreate = () => {
    createMutation.mutate(formData)
  }

  const handleUpdate = () => {
    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        data: formData
      })
    }
  }

  const handleEdit = (template: WarningTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      category_id: template.category_id?.toString() || 'none',
      type: template.type,
      description: template.description,
      severity: template.severity,
      location_placeholder: template.location_placeholder || '',
      expiration_days: template.expiration_days?.toString() || ''
    })
    setIsCreating(false)
  }

  const handleCancelEdit = () => {
    setEditingTemplate(null)
    setIsCreating(false)
    resetForm()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (templatesLoading) {
    return <div className="text-center py-8">Loading templates...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Warning Templates</h2>
          <p className="text-gray-600 mt-1">
            Create reusable templates for common warning types
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          disabled={isCreating || editingTemplate !== null}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Template
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingTemplate) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Create New Template' : `Edit ${editingTemplate?.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((category: WarningCategory) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Warning Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., Speed Violation, Late Arrival"
                />
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: 'Low' | 'Medium' | 'High') => 
                    setFormData({ ...formData, severity: value })
                  }
                >
                  <SelectTrigger>
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
                <Label htmlFor="location_placeholder">Location Placeholder</Label>
                <Input
                  id="location_placeholder"
                  value={formData.location_placeholder}
                  onChange={(e) => setFormData({ ...formData, location_placeholder: e.target.value })}
                  placeholder="e.g., Highway name, Route location"
                />
              </div>

              <div>
                <Label htmlFor="expiration_days">Expiration Days</Label>
                <Input
                  id="expiration_days"
                  type="number"
                  value={formData.expiration_days}
                  onChange={(e) => setFormData({ ...formData, expiration_days: e.target.value })}
                  placeholder="e.g., 365, 180, 90"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description Template</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Use [PLACEHOLDER] for variable parts, e.g., 'Exceeded speed limit by [AMOUNT] mph on [LOCATION]'"
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-1">
                Use [PLACEHOLDER] syntax for parts that will be filled in when creating warnings
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={isCreating ? handleCreate : handleUpdate}
                disabled={createMutation.isPending || updateMutation.isPending || !formData.name.trim() || !formData.type.trim() || !formData.description.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? 'Create' : 'Update'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map((template: WarningTemplate) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className={getSeverityColor(template.severity)}>
                      {template.severity}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <File className="w-4 h-4" />
                      {template.type}
                    </span>
                    {template.category_name && (
                      <Badge variant="outline" className="text-xs">
                        {template.category_name}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4" />
                  {template.usage_count}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                {template.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {template.expiration_days ? `${template.expiration_days} days` : 'No expiration'}
                </span>
                <span>by {template.created_by}</span>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => duplicateMutation.mutate(template)}
                  disabled={duplicateMutation.isPending}
                  title="Duplicate template"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                  disabled={editingTemplate !== null || isCreating}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(template.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && !isCreating && (
        <Card>
          <CardContent className="text-center py-8">
            <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-600 mb-4">
              Create your first warning template to speed up warning creation.
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
