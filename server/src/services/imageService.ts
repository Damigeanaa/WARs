import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/profile-pictures')

async function ensureUploadDir() {
  try {
    await fs.access(uploadsDir)
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true })
  }
}

// Initialize upload directory
ensureUploadDir()

// Configure multer for memory storage
const storage = multer.memoryStorage()

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'))
    }
  }
})

export interface ProcessImageOptions {
  width?: number
  height?: number
  quality?: number
}

export async function processAndSaveImage(
  buffer: Buffer,
  filename: string,
  options: ProcessImageOptions = {}
): Promise<string> {
  const {
    width = 200,
    height = 200,
    quality = 85
  } = options

  try {
    // Process image with Sharp
    const processedBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality })
      .toBuffer()

    // Generate unique filename
    const timestamp = Date.now()
    const ext = '.jpg'
    const uniqueFilename = `${filename}_${timestamp}${ext}`
    const filePath = path.join(uploadsDir, uniqueFilename)

    // Save processed image
    await fs.writeFile(filePath, processedBuffer)

    // Return relative path for database storage
    return `/uploads/profile-pictures/${uniqueFilename}`
  } catch (error) {
    console.error('Error processing image:', error)
    throw new Error('Failed to process image')
  }
}

export async function deleteProfilePicture(imagePath: string): Promise<void> {
  try {
    if (imagePath && imagePath.startsWith('/uploads/profile-pictures/')) {
      const fullPath = path.join(__dirname, '../..', imagePath)
      await fs.unlink(fullPath)
    }
  } catch (error) {
    // Ignore errors when deleting (file might not exist)
    console.warn('Could not delete profile picture:', error)
  }
}

export function generateProfilePictureUrl(imagePath: string | null): string | null {
  if (!imagePath) return null
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath
  
  // Return the path for serving by express static middleware
  return imagePath
}
