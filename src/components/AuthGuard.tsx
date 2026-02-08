import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';
import { isAdmin } from '../constants';
import { checkIsAdmin } from '../services/firebase';

interface AuthGuardProps {
  user: User | null;
  loading: boolean;
  role: 'admin' | 'user';
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ user, loading, role, children }) => {
  const location = useLocation();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (user && role === 'admin') {
        // Quick check with default list first
        if (isAdmin(user.email)) {
          setIsUserAdmin(true);
          setCheckingAdmin(false);
          return;
        }
        // Then check Firestore
        const result = await checkIsAdmin(user.email);
        setIsUserAdmin(result);
      }
      setCheckingAdmin(false);
    };

    if (!loading) {
      verifyAdmin();
    }
  }, [user, loading, role]);

  // Đang loading auth state hoặc checking admin
  if (loading || (role === 'admin' && checkingAdmin)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-main to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="ri-drop-line text-white text-3xl"></i>
          </div>
          <p className="text-body-text">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // Kiểm tra quyền admin
  if (role === 'admin') {
    // Chưa đăng nhập -> Chuyển về /login
    if (!user) {
      return <Navigate to="/login" state={{ from: location, requireAdmin: true }} replace />;
    }

    // Đã đăng nhập nhưng không phải admin -> Đá về trang chủ
    if (!isUserAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  // Quyền user thường - không cần kiểm tra gì thêm

  return <>{children}</>;
};

export default AuthGuard;
