import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login'
      const body = isRegisterMode 
        ? { email: formData.email, password: formData.password, name: formData.name }
        : { email: formData.email, password: formData.password }

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        // Store user info in localStorage (in real app, use proper auth tokens)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        setIsLoading(false)
        onOpenChange(false)
        navigate('/dashboard')
      } else {
        setError(data.error || `${isRegisterMode ? 'Registration' : 'Login'} failed`)
        setIsLoading(false)
      }
    } catch (error) {
      console.error(`${isRegisterMode ? 'Registration' : 'Login'} error:`, error)
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode)
    setError(null)
    setFormData({ email: '', password: '', name: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRegisterMode ? (
              <>
                <UserPlus className="h-5 w-5" />
                Create Account
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Login to Dashboard
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isRegisterMode 
              ? 'Create a new account to access the driver management system'
              : 'Enter your credentials to access the driver management system'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="manager@company.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isRegisterMode ? 'Choose a password (min 6 characters)' : 'Enter your password'}
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={isRegisterMode ? 6 : 1}
                className="w-full pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading 
                ? (isRegisterMode ? 'Creating Account...' : 'Signing in...') 
                : (isRegisterMode ? 'Create Account' : 'Sign In')
              }
            </Button>
            
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary hover:underline"
              >
                {isRegisterMode 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Register"
                }
              </button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Demo: admin@company.com / admin123 or manager@company.com / manager123
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
