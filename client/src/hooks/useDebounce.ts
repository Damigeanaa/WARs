import { useState, useEffect } from 'react'

/**
 * Custom hook for debounced search input
 * @param initialValue - Initial search value
 * @param delay - Delay in milliseconds for debouncing (default: 300ms)
 * @returns Object with debouncedValue and setSearchTerm function
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook specifically for search functionality with debouncing
 * @param delay - Delay in milliseconds for debouncing (default: 300ms)
 * @returns Object with search term, debounced search term, and setter
 */
export function useSearch(delay: number = 300) {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, delay)

  const clearSearch = () => setSearchTerm('')

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    clearSearch
  }
}
