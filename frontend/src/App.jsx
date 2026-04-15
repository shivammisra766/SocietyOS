import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLayout from './components/AdminLayout';
import AdminUsers from './pages/admin/Users';
import AdminGuards from './pages/admin/Guards';
import AdminFlats from './pages/admin/Flats';
import AdminEntries from './pages/admin/EntryLog';
import AdminComplaints from './pages/admin/Complaints';
import AdminNotices from './pages/admin/Notices';
import AdminSettings from './pages/admin/Settings';
import AdminHelp from './pages/admin/Help';

import ResidentDashboard from './pages/resident/Dashboard';
import SecurityDashboard from './pages/security/Dashboard';
import ServiceDashboard from './pages/service/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="security" element={<AdminGuards />} />
            <Route path="flats" element={<AdminFlats />} />
            <Route path="entries" element={<AdminEntries />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="notices" element={<AdminNotices />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="help" element={<AdminHelp />} />
          </Route>

          <Route path="/resident" element={
            <ProtectedRoute roles={['RESIDENT']}>
              <ResidentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/security" element={
            <ProtectedRoute roles={['SECURITY']}>
              <SecurityDashboard />
            </ProtectedRoute>
          } />
          <Route path="/service" element={
            <ProtectedRoute roles={['SERVICE']}>
              <ServiceDashboard />
            </ProtectedRoute>
          } />
          <Route path="/unauthorized" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}