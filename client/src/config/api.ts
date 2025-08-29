export const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001'

export const API_ENDPOINTS = {
  // Analytics
  analytics: `${API_BASE_URL}/api/analytics/dashboard`,
  
  // Drivers
  drivers: `${API_BASE_URL}/api/drivers`,
  driverById: (id: string) => `${API_BASE_URL}/api/drivers/by-driver-id/${id}`,
  driverByNumericId: (id: string) => `${API_BASE_URL}/api/drivers/${id}`,
  importDrivers: `${API_BASE_URL}/api/import/drivers`,
  
  // Holiday Requests
  holidayRequests: `${API_BASE_URL}/api/holiday-requests`,
  publicHolidayRequests: `${API_BASE_URL}/api/holiday-requests/public`,
  holidayRequestsPublicAll: `${API_BASE_URL}/api/holiday-requests/public/all`,
  holidayRequestStatus: (id: string) => `${API_BASE_URL}/api/holiday-requests/public/${id}/status`,
  
  // Holidays (internal)
  holidays: `${API_BASE_URL}/api/holidays`,
  holidayById: (id: string) => `${API_BASE_URL}/api/holidays/${id}`,
  vacationSummary: (driverId: string) => `${API_BASE_URL}/api/holidays/driver/${driverId}/vacation-summary`,
  
  // Warnings
  warnings: `${API_BASE_URL}/api/warnings`,
  warningCategories: `${API_BASE_URL}/api/warning-categories`,
  warningCategoryById: (id: string) => `${API_BASE_URL}/api/warning-categories/${id}`,
  warningTemplates: `${API_BASE_URL}/api/warning-templates`,
  warningTemplateById: (id: string) => `${API_BASE_URL}/api/warning-templates/${id}`,
  
  // Notifications
  notifications: `${API_BASE_URL}/api/notifications`,
  notificationsCounts: `${API_BASE_URL}/api/notifications/counts`,
  notificationById: (id: string) => `${API_BASE_URL}/api/notifications/${id}`,
  notificationRead: (id: string) => `${API_BASE_URL}/api/notifications/${id}/read`,
  notificationsReadAll: `${API_BASE_URL}/api/notifications/read-all`,
  
  // Auth
  login: `${API_BASE_URL}/api/auth/login`,
  logout: `${API_BASE_URL}/api/auth/logout`,
  
  // Static files
  profilePicture: (path: string) => `${API_BASE_URL}${path}`,
}
