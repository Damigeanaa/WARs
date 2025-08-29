import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import Dashboard from '@/pages/Dashboard'
import ProfilePage from '@/pages/ProfilePage'
import Drivers from '@/pages/Drivers'
import DriverDetailPage from '@/pages/DriverDetailPage'
import EditDriver from '@/pages/EditDriver'
import AddDriver from '@/pages/AddDriver'
import Warnings from '@/pages/Warnings'
import WarningCategoriesPage from '@/pages/WarningCategoriesPage'
import WarningTemplatesPage from '@/pages/WarningTemplatesPage'
import NotificationsPage from '@/pages/NotificationsPage'
import NotificationTestPage from '@/pages/NotificationTestPage'
import MobileOptimizationPage from '@/pages/MobileOptimizationPage'
import Holidays from '@/pages/Holidays'
import HolidayRequestPage from '@/pages/HolidayRequestPage'
import AuditLogsPage from '@/pages/AuditLogsPage'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Admin Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/drivers" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <Drivers />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/drivers/add" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <AddDriver />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/drivers/:id" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <DriverDetailPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/drivers/:id/edit" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <EditDriver />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/warnings" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <Warnings />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/warning-categories" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <WarningCategoriesPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/warning-templates" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <WarningTemplatesPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <NotificationsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/notification-test" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <NotificationTestPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/mobile-optimization" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <MobileOptimizationPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/holiday-requests" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <Holidays />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/holidays" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <Holidays />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/audit-logs" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <AuditLogsPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Public route for holiday requests */}
        <Route path="/holiday-request" element={<HolidayRequestPage />} />
      </Routes>
      <Toaster />
    </div>
  )
}

export default App
