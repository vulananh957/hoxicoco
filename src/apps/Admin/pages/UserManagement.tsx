import React, { useState, useEffect } from 'react';
import { fetchAdmins, addAdmin, removeAdmin, AdminUser } from '../../../services/firebase';
import { DEFAULT_ADMIN_EMAILS } from '../../../constants';

// Tên hiển thị cho admin mặc định
const DEFAULT_ADMIN_NAMES: Record<string, string> = {
  'al.squared.la@gmail.com': 'AL2LA',
};

const UserManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load admins on mount
  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    const data = await fetchAdmins();
    
    // Merge with default admins (show them even if not in Firestore)
    const allAdmins: AdminUser[] = [...data];
    
    DEFAULT_ADMIN_EMAILS.forEach(email => {
      if (!allAdmins.find(a => a.email.toLowerCase() === email.toLowerCase())) {
        allAdmins.unshift({
          id: `default-${email}`,
          email: email,
          name: DEFAULT_ADMIN_NAMES[email.toLowerCase()] || email.split('@')[0],
          addedBy: 'system',
          addedAt: 0
        });
      }
    });
    
    setAdmins(allAdmins);
    setLoading(false);
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await addAdmin(
      newAdminEmail,
      newAdminName,
      'current-admin' // In real app, get from auth context
    );

    if (result.success) {
      setSuccessMsg('Đã thêm admin thành công!');
      setNewAdminEmail('');
      setNewAdminName('');
      setShowAddModal(false);
      loadAdmins();
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setError(result.error || 'Có lỗi xảy ra');
    }

    setSubmitting(false);
  };

  const handleRemoveAdmin = async (admin: AdminUser) => {
    if (DEFAULT_ADMIN_EMAILS.includes(admin.email.toLowerCase())) {
      setError('Không thể xóa admin mặc định của hệ thống');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa quyền admin của ${admin.name}?`)) {
      return;
    }

    const result = await removeAdmin(admin.id, admin.email);
    
    if (result.success) {
      setSuccessMsg('Đã xóa admin thành công!');
      loadAdmins();
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setError(result.error || 'Có lỗi xảy ra');
      setTimeout(() => setError(null), 3000);
    }
  };

  const isDefaultAdmin = (email: string) => {
    return DEFAULT_ADMIN_EMAILS.includes(email.toLowerCase());
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Quản lý Admin</h1>
          <p className="text-body-text/70 mt-1 text-sm sm:text-base">Thêm hoặc xóa quyền admin cho người dùng</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/30 text-sm font-medium"
        >
          <i className="ri-user-add-line text-lg"></i>
          <span>Thêm Admin</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMsg && (
        <div className="bg-status-success/10 border border-status-success/20 text-status-success px-4 py-3 rounded-xl flex items-center gap-3">
          <i className="ri-checkbox-circle-fill text-xl"></i>
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-status-danger/10 border border-status-danger/20 text-status-danger px-4 py-3 rounded-xl flex items-center gap-3">
          <i className="ri-error-warning-fill text-xl"></i>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Admin List */}
      <div className="glass-admin rounded-xl sm:rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <i className="ri-loader-4-line animate-spin text-3xl text-primary"></i>
            <p className="mt-2 text-body-text/70">Đang tải...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center">
            <i className="ri-user-line text-4xl text-body-text/30"></i>
            <p className="mt-2 text-body-text/70">Chưa có admin nào</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20 bg-white/30">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-heading">Admin</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-heading">Loại</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-heading">Ngày thêm</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-heading">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin.id} className="border-b border-white/10 hover:bg-white/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <i className="ri-shield-user-line text-primary text-lg"></i>
                          </div>
                          <div>
                            <p className="font-medium text-heading">{admin.name}</p>
                            <p className="text-sm text-body-text/70">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isDefaultAdmin(admin.email) ? (
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-status-danger/20 text-status-danger">
                            Mặc định
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-primary/20 text-primary">
                            Được thêm
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-body-text/70">
                        {admin.addedAt === 0 ? 'Từ đầu' : new Date(admin.addedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {!isDefaultAdmin(admin.email) && (
                            <button 
                              onClick={() => handleRemoveAdmin(admin)}
                              className="w-8 h-8 rounded-lg bg-status-danger/10 text-status-danger hover:bg-status-danger/20 flex items-center justify-center transition-colors"
                              title="Xóa quyền admin"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-white/10">
              {admins.map(admin => (
                <div key={admin.id} className="p-4 hover:bg-white/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-shield-user-line text-primary text-lg"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-heading truncate">{admin.name}</p>
                        {isDefaultAdmin(admin.email) ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-status-danger/20 text-status-danger flex-shrink-0">
                            Mặc định
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary flex-shrink-0">
                            Được thêm
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-body-text/70 truncate">{admin.email}</p>
                      <p className="text-xs text-body-text/50 mt-1">
                        {admin.addedAt === 0 ? 'Admin mặc định' : `Thêm: ${new Date(admin.addedAt).toLocaleDateString('vi-VN')}`}
                      </p>
                    </div>
                    {!isDefaultAdmin(admin.email) && (
                      <button 
                        onClick={() => handleRemoveAdmin(admin)}
                        className="w-9 h-9 rounded-lg bg-status-danger/10 text-status-danger hover:bg-status-danger/20 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info Card */}
      <div className="glass-admin rounded-xl p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ri-information-line text-primary text-xl"></i>
          </div>
          <div>
            <h3 className="font-medium text-heading">Về quyền Admin</h3>
            <p className="text-sm text-body-text/70 mt-1">
              Admin có thể truy cập trang quản trị, duyệt địa điểm, xử lý báo cáo và thêm admin khác. 
              User thường chỉ cần đăng nhập Google để sử dụng app.
            </p>
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-heading">Thêm Admin mới</h2>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setError(null);
                    setNewAdminEmail('');
                    setNewAdminName('');
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <i className="ri-close-line text-xl text-body-text"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-status-danger/10 border border-status-danger/20 text-status-danger px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Email <span className="text-status-danger">*</span>
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <p className="text-xs text-body-text/50 mt-1">
                  Người dùng với email này sẽ có quyền truy cập Admin Portal
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError(null);
                  setNewAdminEmail('');
                  setNewAdminName('');
                }}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-body-text font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={submitting || !newAdminEmail.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <i className="ri-user-add-line"></i>
                    Thêm Admin
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
