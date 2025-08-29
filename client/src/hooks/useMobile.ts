import { useState, useEffect } from 'react'

interface MobileDetection {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function useMobile(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: 'lg'
  })

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Tailwind breakpoints: sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024

      let screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'lg'
      if (width < 640) screenSize = 'sm'
      else if (width < 768) screenSize = 'md'
      else if (width < 1024) screenSize = 'lg'
      else if (width < 1280) screenSize = 'xl'
      else screenSize = '2xl'

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenSize
      })
    }

    // Initial check
    checkDevice()

    // Listen for resize events
    window.addEventListener('resize', checkDevice)
    
    // Listen for orientation changes (mobile devices)
    window.addEventListener('orientationchange', () => {
      // Small delay to allow orientation change to complete
      setTimeout(checkDevice, 100)
    })

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  return detection
}

// Additional hook for mobile-specific gestures and interactions
export function useMobileGestures() {
  const [isSwipeSupported] = useState(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  const addSwipeListener = (
    element: HTMLElement | null,
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    threshold: number = 50
  ) => {
    if (!element || !isSwipeSupported) return () => {}

    let startX = 0
    let startY = 0
    let endX = 0
    let endY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX
      endY = e.changedTouches[0].clientY
      
      const deltaX = endX - startX
      const deltaY = endY - startY
      
      // Check if horizontal swipe is more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }

  return {
    isSwipeSupported,
    addSwipeListener
  }
}

// Hook for managing safe area insets (useful for mobile devices with notches)
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  })

  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement)
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea)
    
    return () => window.removeEventListener('resize', updateSafeArea)
  }, [])

  return safeArea
}
