import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface UseAutoRefreshOptions {
  /** Interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number
  /** Whether auto-refresh is enabled (default: true) */
  enabled?: boolean
  /** Array of query keys to refresh */
  queryKeys?: string[][]
  /** Callback when refresh occurs */
  onRefresh?: () => void
}

/**
 * Custom hook for auto-refreshing React Query data
 * @param options Configuration options for auto-refresh
 * @returns Object with refresh controls
 */
export function useAutoRefresh({
  interval = 30000, // 30 seconds default
  enabled = true,
  queryKeys = [['drivers'], ['warnings'], ['holiday-requests']],
  onRefresh
}: UseAutoRefreshOptions = {}) {
  const queryClient = useQueryClient()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshRef = useRef<Date>(new Date())

  const refresh = () => {
    queryKeys.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey })
    })
    lastRefreshRef.current = new Date()
    onRefresh?.()
  }

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(() => {
      // Only refresh if the tab/window is visible to avoid unnecessary API calls
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }, interval)
  }

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }

    // Handle visibility change to pause/resume when tab is hidden/visible
    const handleVisibilityChange = () => {
      if (enabled) {
        if (document.visibilityState === 'visible') {
          startAutoRefresh()
        } else {
          stopAutoRefresh()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopAutoRefresh()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, interval, queryKeys.map(key => key.join('.')).join(',')])

  return {
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    lastRefresh: lastRefreshRef.current,
    isEnabled: enabled && intervalRef.current !== null
  }
}

/**
 * Hook specifically for dashboard auto-refresh with optimized settings
 * @param enabled Whether auto-refresh is enabled
 * @returns Object with refresh controls and status
 */
export function useDashboardAutoRefresh(enabled: boolean = true) {
  const lastRefresh = useRef<Date>(new Date())

  const autoRefresh = useAutoRefresh({
    interval: 30000, // 30 seconds
    enabled,
    queryKeys: [['drivers'], ['warnings'], ['holiday-requests']],
    onRefresh: () => {
      lastRefresh.current = new Date()
    }
  })

  const getTimeAgo = () => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastRefresh.current.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  return {
    ...autoRefresh,
    lastRefresh: lastRefresh.current,
    getTimeAgo,
    formattedLastRefresh: lastRefresh.current.toLocaleTimeString()
  }
}
