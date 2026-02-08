import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithGoogle } from '../../../services/firebase';
import { isAdmin } from '../../../constants';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const requireAdmin = (location.state as any)?.requireAdmin;
  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    const user = await signInWithGoogle();
    
    if (user) {
      // Nếu yêu cầu admin và là admin -> vào admin
      if (requireAdmin && isAdmin(user.email)) {
        navigate('/admin', { replace: true });
      } 
      // Nếu yêu cầu admin nhưng không phải admin -> về trang chủ
      else if (requireAdmin && !isAdmin(user.email)) {
        setError('Tài khoản của bạn không có quyền truy cập Admin.');
        setIsLoading(false);
        return;
      }
      // Trường hợp bình thường -> về nơi đã chuyển đến
      else {
        navigate(from, { replace: true });
      }
    } else {
      setError('Đăng nhập thất bại. Vui lòng thử lại.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-heading via-primary/20 to-bg-main flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Login Card */}
        <div className="glass-admin rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
              {requireAdmin ? (
                <i className="ri-shield-keyhole-line text-white text-4xl"></i>
              ) : (
                <i className="ri-drop-line text-white text-4xl"></i>
              )}
            </div>
            <h1 className="text-2xl font-bold text-heading">
              {requireAdmin ? 'Admin Portal' : 'Hoxicoco'}
            </h1>
            <p className="text-body-text/70 mt-2">
              {requireAdmin ? 'Hệ thống quản lý Hoxicoco' : 'Tìm nhà vệ sinh gần bạn'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-status-danger/10 border border-status-danger/20 rounded-xl flex items-start gap-3">
              <i className="ri-error-warning-line text-status-danger text-xl mt-0.5"></i>
              <p className="text-sm text-status-danger">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-heading py-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <i className="ri-loader-4-line animate-spin text-xl"></i>
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Đăng nhập với Google</span>
              </>
            )}
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-body-text/50 mt-6">
            {requireAdmin ? 'Chỉ dành cho quản trị viên được ủy quyền' : 'Đăng nhập để đóng góp địa điểm'}
          </p>
        </div>

        {/* Back to App Link */}
        <div className="text-center mt-6">
          <a href="/" className="text-white/70 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors">
            <i className="ri-arrow-left-line"></i>
            {requireAdmin ? 'Quay lại ứng dụng' : 'Bỏ qua đăng nhập'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
