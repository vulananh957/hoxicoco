import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { onAuthChange } from './services/firebase';
import { isAdmin } from './constants';

// Components
import AuthGuard from './components/AuthGuard';

// Client App
import ClientLayout from './apps/Client/ClientLayout';
import LoginPage from './apps/Client/pages/LoginPage';
import PrivacyLegal from './apps/Client/pages/PrivacyLegal';

// Admin App
import AdminLayout from './apps/Admin/pages/AdminLayout';
import AdminDashboard from './apps/Admin/pages/AdminDashboard';
import ToiletManagement from './apps/Admin/pages/ToiletManagement';
import PendingApproval from './apps/Admin/pages/PendingApproval';
import ReportCenter from './apps/Admin/pages/ReportCenter';
import UserManagement from './apps/Admin/pages/UserManagement';
import Posts from './apps/Admin/pages/Posts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-main to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="ri-drop-line text-white text-3xl"></i>
          </div>
          <p className="text-body-text">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route: Privacy & Legal */}
        <Route path="/privacy-legal" element={<PrivacyLegal />} />

        {/* Public Route: Login */}
        <Route path="/login" element={
          user ? (
            // Đã login, redirect dựa vào role
            isAdmin(user.email) ? <Navigate to="/admin" replace /> : <Navigate to="/" replace />
          ) : (
            <LoginPage />
          )
        } />

        {/* Admin Routes (Bảo vệ nghiêm ngặt) */}
        <Route
          path="/admin/*"
          element={
            <AuthGuard user={user} loading={loading} role="admin">
              <AdminLayout user={user!} />
            </AuthGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="toilets" element={<ToiletManagement />} />
          <Route path="posts" element={<Posts />} />
          <Route path="pending" element={<PendingApproval />} />
          <Route path="reports" element={<ReportCenter />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        {/* Client Routes (User thường) */}
        <Route path="/*" element={<ClientLayout />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
