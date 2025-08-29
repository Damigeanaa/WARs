import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Shield,
  TrendingDown,
  FileText,
  Users,
  Truck,
  FileX,
  AlertTriangle
} from 'lucide-react'
import './WarningCategoryManager.css'

interface WarningCategory {
  id: number
  name: string
  description: string
  color: string
  icon: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const iconMap = {
  Shield,
  TrendingDown,
  FileText,
  Users,
  Truck,
  FileX,
  AlertTriangle
}

const availableColors = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Gray', value: '#6B7280' }
]

const availableIcons = [
  'Shield', 'TrendingDown', 'FileText', 'Users', 'Truck', 'FileX', 'AlertTriangle'
]

export default function WarningCategoryManager() {
  const [editingCategory, setEditingCategory] = useState<WarningCategory | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280',
    icon: 'AlertTriangle'
  })

  const queryClient = useQueryClient()

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['warning-categories'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/warning-categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      return response.json()
    }
  })

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('http://localhost:3001/api/warning-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create category')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warning-categories'] })
      setIsCreating(false)
      setFormData({ name: '', description: '', color: '#6B7280', icon: 'AlertTriangle' })
    }
  })

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const response = await fetch(`http://localhost:3001/api/warning-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update category')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warning-categories'] })
      setEditingCategory(null)
    }
  })

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:3001/api/warning-categories/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete category')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warning-categories'] })
    }
  })

  const handleCreate = () => {
    createMutation.mutate(formData)
  }

  const handleUpdate = () => {
    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        data: formData
      })
    }
  }

  const handleEdit = (category: WarningCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon
    })
    setIsCreating(false)
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setIsCreating(false)
    setFormData({ name: '', description: '', color: '#6B7280', icon: 'AlertTriangle' })
  }

  const renderIcon = (iconName: string, colorClass = 'text-gray-600') => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || AlertTriangle
    return <IconComponent className={`w-5 h-5 ${colorClass}`} />
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading categories...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Warning Categories</h2>
        <Button
          onClick={() => setIsCreating(true)}
          disabled={isCreating || editingCategory !== null}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingCategory) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Create New Category' : `Edit ${editingCategory?.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter category description"
                rows={3}
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color.value ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    data-color={color.value}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableIcons.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    className={`p-2 rounded border ${
                      formData.icon === iconName 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setFormData({ ...formData, icon: iconName })}
                  >
                    {renderIcon(iconName)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={isCreating ? handleCreate : handleUpdate}
                disabled={createMutation.isPending || updateMutation.isPending || !formData.name.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? 'Create' : 'Update'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category: WarningCategory) => (
          <Card key={category.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {renderIcon(category.icon)}
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <Badge
                  variant="secondary"
                  className="opacity-20"
                  data-color={category.color}
                >
                  {category.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {category.description || 'No description provided'}
              </p>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(category)}
                  disabled={editingCategory !== null || isCreating}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(category.id)}
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

      {categories.length === 0 && !isCreating && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
            <p className="text-gray-600 mb-4">
              Create your first warning category to start organizing warnings.
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
