import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { logOut } from '../../../services/firebase';
import { User } from 'firebase/auth';

interface AdminLayoutProps {
  user: User;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ user }) => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await logOut();
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', icon: 'ri-dashboard-3-line', label: 'Tổng quan', end: true },
    { path: '/admin/toilets', icon: 'ri-map-pin-line', label: 'Địa điểm' },
    { path: '/admin/posts', icon: 'ri-file-list-line', label: 'Bài viết' },
    { path: '/admin/pending', icon: 'ri-time-line', label: 'Chờ duyệt' },
    { path: '/admin/reports', icon: 'ri-alarm-warning-line', label: 'Phản ánh' },
    { path: '/admin/users', icon: 'ri-user-line', label: 'Người dùng' },
  ];

  const handleNavClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-bg-main via-white to-primary/10 flex overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside 
          className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="h-full glass-admin m-2 mr-4 rounded-2xl flex flex-col shadow-xl overflow-hidden">
            {/* Logo */}
            <div className={`p-4 border-b border-white/20 ${sidebarCollapsed ? 'px-3' : 'p-4'}`}>
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className={`${sidebarCollapsed ? 'w-10 h-10' : 'w-10 h-10'} bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0`}>
                  <i className="ri-drop-line text-white text-xl"></i>
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <h1 className="text-heading font-bold text-lg truncate">Hoxicoco</h1>
                    <p className="text-xs text-body-text/70">Admin Portal</p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto admin-scrollbar">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) => `
                    flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                      : 'text-body-text hover:bg-primary/10 hover:text-primary'
                    }
                  `}
                >
                  <i className={`${item.icon} text-xl flex-shrink-0`}></i>
                  {!sidebarCollapsed && <span className="font-medium text-sm truncate">{item.label}</span>}
                </NavLink>
              ))}
            </nav>

            {/* User Profile */}
            <div className={`p-2 border-t border-white/20 ${sidebarCollapsed ? 'px-2' : 'p-3'}`}>
              {/* Switch to User View Button */}
              <NavLink
                to="/"
                title={sidebarCollapsed ? 'Xem giao diện User' : undefined}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-2 px-3 py-2.5 mb-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 text-primary hover:from-primary/20 hover:to-accent/20 transition-all`}
              >
                <i className="ri-eye-line text-lg"></i>
                {!sidebarCollapsed && <span className="text-sm font-medium">Xem giao diện User</span>}
              </NavLink>

              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} mb-2`}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-user-line text-primary"></i>
                  </div>
                )}
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-heading truncate">{user.displayName}</p>
                    <p className="text-xs text-body-text/70 truncate">{user.email}</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                title={sidebarCollapsed ? 'Đăng xuất' : undefined}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-2 px-3 py-2 rounded-xl text-status-danger hover:bg-status-danger/10 transition-colors`}
              >
                <i className="ri-logout-box-line text-lg"></i>
                {!sidebarCollapsed && <span className="text-sm font-medium">Đăng xuất</span>}
              </button>
            </div>

            {/* Collapse Toggle - Moved outside overflow container */}
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute right-0 top-[55%] -translate-y-1/2 w-6 h-6 bg-white text-body-text rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:text-primary hover:border-primary transition-colors"
            title={sidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            <i className={`ri-arrow-${sidebarCollapsed ? 'right' : 'left'}-s-line text-sm`}></i>
          </button>
        </aside>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <aside 
          className={`fixed left-0 top-0 h-full z-50 transition-transform duration-300 w-64 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full bg-white/95 backdrop-blur-xl flex flex-col shadow-2xl">
            {/* Logo */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <i className="ri-drop-line text-white text-xl"></i>
                </div>
                <div>
                  <h1 className="text-heading font-bold">Hoxicoco</h1>
                  <p className="text-xs text-body-text/70">Admin Portal</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <i className="ri-close-line text-xl text-body-text"></i>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={handleNavClick}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                      : 'text-body-text hover:bg-primary/10 hover:text-primary'
                    }
                  `}
                >
                  <i className={`${item.icon} text-xl`}></i>
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User Profile */}
            <div className="p-3 border-t border-gray-100">
              {/* Switch to User View Button */}
              <NavLink
                to="/"
                onClick={handleNavClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 text-primary hover:from-primary/20 hover:to-accent/20 transition-all"
              >
                <i className="ri-eye-line text-lg"></i>
                <span className="font-medium">Xem giao diện User</span>
              </NavLink>

              <div className="flex items-center gap-3 mb-3 px-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <i className="ri-user-line text-primary"></i>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-heading truncate">{user.displayName}</p>
                  <p className="text-xs text-body-text/70 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-status-danger hover:bg-status-danger/10 transition-colors"
              >
                <i className="ri-logout-box-line"></i>
                <span className="font-medium">Đăng xuất</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 overflow-hidden ${
        isMobile ? 'ml-0' : (sidebarCollapsed ? 'ml-20' : 'ml-64')
      }`}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary"
            >
              <i className="ri-menu-line text-xl"></i>
            </button>
            <div className="flex-1">
              <h1 className="text-heading font-bold">Hoxicoco Admin</h1>
            </div>
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full" />
            )}
          </div>
        )}

        {/* Page Content */}
        <div className={`h-full overflow-y-auto ${isMobile ? 'p-4 pb-20' : 'p-6'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
