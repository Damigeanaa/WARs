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
import Holidays from '@/pages/Holidays'
import HolidayRequestPage from '@/pages/HolidayRequestPage'
import AuditLogsPage from '@/pages/AuditLogsPage'
import SchedulePlannerPage from '@/pages/SchedulePlannerPage'
import ScheduleSettingsPage from '@/pages/ScheduleSettingsPage'
import TimesheetIntegrationPage from '@/pages/TimesheetIntegrationPage'
import ProjectSettingsPage from '@/pages/ProjectSettingsPage'

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
        <Route path="/schedule-planner" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <SchedulePlannerPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/schedule-settings" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <ScheduleSettingsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/timesheet-integration" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <TimesheetIntegrationPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/project-settings" element={
          <ProtectedRoute adminOnly={true}>
            <Layout>
              <ProjectSettingsPage />
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
