import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, X, User } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  currentImage?: string | null
  driverId?: number
  driverName?: string
  onImageUploaded?: (imageUrl: string) => void
  onImageRemoved?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function ImageUpload({
  currentImage,
  driverId,
  driverName,
  onImageUploaded,
  onImageRemoved,
  className = '',
  size = 'md'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please select a JPEG, PNG, or WebP image.')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Please select an image under 5MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // If we have a driver ID, upload immediately
    if (driverId) {
      await uploadImage(file)
    }
  }

  const uploadImage = async (file: File) => {
    if (!driverId) {
      toast.error('Driver ID is required for upload')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('profile_picture', file)

      const response = await fetch(`/api/drivers/${driverId}/profile-picture`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      
      setPreviewUrl(data.profile_picture)
      onImageUploaded?.(data.profile_picture)
      toast.success('Profile picture updated successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
      // Reset preview on error
      setPreviewUrl(currentImage || null)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = async () => {
    if (!driverId) {
      toast.error('Driver ID is required')
      return
    }

    setIsUploading(true)

    try {
      const response = await fetch(`/api/drivers/${driverId}/profile-picture`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove image')
      }

      setPreviewUrl(null)
      onImageRemoved?.()
      toast.success('Profile picture removed successfully')
    } catch (error) {
      console.error('Remove error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove image')
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-gray-200 hover:border-gray-300 transition-colors`}>
          <AvatarImage 
            src={previewUrl || undefined} 
            alt={driverName || 'Profile'} 
            className="object-cover"
          />
          <AvatarFallback className="bg-gray-100">
            {driverName ? getInitials(driverName) : <User className="h-1/2 w-1/2 text-gray-400" />}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload overlay */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer"
          onClick={triggerFileSelect}
        >
          <Upload className="h-1/3 w-1/3 text-white" />
        </div>

        {/* Remove button */}
        {previewUrl && (
          <button
            onClick={removeImage}
            disabled={isUploading}
            title="Remove profile picture"
            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors disabled:opacity-50"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Loading indicator */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-1/3 w-1/3 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload button for when no driver ID is provided */}
      {!driverId && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileSelect}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {previewUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center">
        Click to upload or drag & drop<br />
        JPEG, PNG, WebP (max 5MB)
      </p>
    </div>
  )
}
