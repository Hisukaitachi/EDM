import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

import AdminDashboard from './pages/AdminDashboard';
import AdminInventory from './pages/AdminInventory';
import AdminStockRequests from './pages/AdminStockRequests';
import AdminStaffManagement from './pages/AdminStaffManagement';
import AdminReports from './pages/AdminReports';

import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/requests" element={<AdminStockRequests />} />
          <Route path="/admin/staff" element={<AdminStaffManagement />} />
          <Route path="/admin/reports" element={<AdminReports />} />

          {/* Staff Placeholder */}
          <Route path="/staff/dashboard" element={<div>Staff Dashboard Coming Soon...</div>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;