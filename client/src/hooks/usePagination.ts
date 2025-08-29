import { useState } from 'react'
import { useMobile } from './useMobile'

interface UsePaginationProps<T> {
  data: T[]
  initialItemsPerPage?: number
  mobileItemsPerPage?: number
}

interface UsePaginationReturn<T> {
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  setItemsPerPage: (items: number) => void
  totalPages: number
  currentItems: T[]
  totalItems: number
  startIndex: number
  endIndex: number
}

export function usePagination<T>({
  data,
  initialItemsPerPage = 10,
  mobileItemsPerPage = 5
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const { isMobile } = useMobile()
  
  // Use mobile-specific default if on mobile
  const defaultItemsPerPage = isMobile ? mobileItemsPerPage : initialItemsPerPage
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)

  // Recalculate when data changes
  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Reset to page 1 if current page becomes invalid
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  // Calculate current items to display
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const currentItems = data.slice(startIndex, endIndex)

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll to top of content on mobile
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    // Recalculate current page to maintain roughly the same position
    const newPage = Math.ceil((startIndex + 1) / newItemsPerPage)
    setCurrentPage(Math.max(1, newPage))
  }

  return {
    currentPage,
    setCurrentPage: handlePageChange,
    itemsPerPage,
    setItemsPerPage: handleItemsPerPageChange,
    totalPages,
    currentItems,
    totalItems,
    startIndex,
    endIndex
  }
}
