import React, { useState, useEffect } from 'react';
import { fetchAllReports, updateReportStatus, AdminReport, AdminReportStatus, ReportType } from '../../../services/firebase';

const ReportCenter: React.FC = () => {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterType, setFilterType] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const data = await fetchAllReports();
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const statusColumns: { key: AdminReportStatus; label: string; color: string }[] = [
    { key: 'new', label: 'Mới', color: 'bg-status-danger' },
    { key: 'received', label: 'Đã tiếp nhận', color: 'bg-status-warn' },
    { key: 'processing', label: 'Đang xử lý', color: 'bg-primary' },
    { key: 'resolved', label: 'Đã xong', color: 'bg-status-success' },
  ];

  const getTypeInfo = (type: ReportType) => {
    switch (type) {
      case 'dirty': return { label: 'Bẩn', icon: 'ri-bug-line', color: 'text-status-warn' };
      case 'broken': return { label: 'Hỏng thiết bị', icon: 'ri-tools-line', color: 'text-status-warn' };
      case 'no_paper': return { label: 'Hết giấy', icon: 'ri-file-paper-2-line', color: 'text-status-warn' };
      case 'camera': return { label: 'Camera quay lén', icon: 'ri-camera-off-line', color: 'text-status-danger' };
      case 'harassment': return { label: 'Biến thái', icon: 'ri-alarm-warning-line', color: 'text-status-danger' };
      default: return { label: type, icon: 'ri-question-line', color: 'text-gray-500' };
    }
  };

  const updateStatus = async (reportId: string, newStatus: AdminReportStatus) => {
    setActionLoading(reportId);
    const success = await updateReportStatus(reportId, newStatus);
    if (success) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    }
    setActionLoading(null);
    setShowDetailModal(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return hours + ':' + minutes + ' ' + day + '/' + month + '/' + year;
  };

  const handleViewDetail = (report: AdminReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const filteredReports = reports.filter(r => 
    filterType === 'all' || r.type === filterType
  );

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    const statusOrder: Record<AdminReportStatus, number> = { new: 0, received: 1, processing: 2, resolved: 3 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return b.reportedAt - a.reportedAt;
  });

  const getReportsByStatus = (status: AdminReportStatus) =>
    filteredReports.filter(r => r.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="ri-loader-4-line animate-spin text-4xl text-primary"></i>
          <p className="mt-2 text-body-text/70">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-heading">Trung tâm phản ánh</h1>
          <p className="text-body-text/70 mt-1 text-xs sm:text-base">Quản lý và xử lý các báo cáo từ người dùng</p>
        </div>
        {!isMobile && (
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' + (
                  viewMode === 'kanban' ? 'bg-white shadow-sm text-heading' : 'text-body-text/70'
                )}
              >
                <i className="ri-layout-column-line mr-2"></i>Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' + (
                  viewMode === 'list' ? 'bg-white shadow-sm text-heading' : 'text-body-text/70'
                )}
              >
                <i className="ri-list-check mr-2"></i>Danh sách
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {statusColumns.map(col => {
          const count = getReportsByStatus(col.key).length;
          const urgentCount = getReportsByStatus(col.key).filter(r => r.isUrgent).length;
          return (
            <div key={col.key} className="glass-admin rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className={'w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ' + col.color}></div>
                {urgentCount > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-status-danger/20 text-status-danger text-[10px] sm:text-xs rounded-full font-medium">
                    {urgentCount} khẩn
                  </span>
                )}
              </div>
              <p className="text-xl sm:text-2xl font-bold text-heading">{count}</p>
              <p className="text-xs sm:text-sm text-body-text/70 truncate">{col.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 sm:gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white/50 border border-white/50 rounded-xl focus:outline-none focus:border-primary text-heading cursor-pointer text-sm"
        >
          <option value="all">Tất cả loại</option>
          <option value="dirty">Bẩn</option>
          <option value="broken">Hỏng thiết bị</option>
          <option value="no_paper">Hết giấy</option>
          <option value="camera">Camera quay lén</option>
          <option value="harassment">Biến thái</option>
        </select>
      </div>

      {/* Empty State */}
      {sortedReports.length === 0 ? (
        <div className="glass-admin rounded-xl p-8 text-center">
          <i className="ri-checkbox-circle-line text-4xl text-status-success mb-2"></i>
          <p className="text-body-text/70">Không có báo cáo nào</p>
        </div>
      ) : isMobile ? (
        /* Mobile: List view */
        <div className="space-y-3">
          {sortedReports.map(report => {
            const typeInfo = getTypeInfo(report.type);
            const statusCol = statusColumns.find(s => s.key === report.status);
            return (
              <div
                key={report.id}
                onClick={() => handleViewDetail(report)}
                className={'glass-admin rounded-xl p-4 cursor-pointer ' + (
                  report.isUrgent ? 'ring-2 ring-status-danger' : ''
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    {report.isUrgent && (
                      <div className="flex items-center gap-1 text-status-danger text-xs font-medium mb-1">
                        <i className="ri-alarm-warning-fill"></i>
                        KHẨN CẤP
                      </div>
                    )}
                    <h4 className="font-semibold text-heading text-sm truncate">{report.toiletName}</h4>
                    <p className="text-xs text-body-text/60 truncate">{report.toiletAddress}</p>
                  </div>
                  <span className={'px-2 py-1 rounded-lg text-[10px] font-medium text-white whitespace-nowrap ' + statusCol?.color}>
                    {statusCol?.label}
                  </span>
                </div>
                <div className={'flex items-center gap-1.5 text-xs mb-2 ' + typeInfo.color}>
                  <i className={typeInfo.icon}></i>
                  <span className="font-medium">{typeInfo.label}</span>
                </div>
                <p className="text-xs text-body-text/70 line-clamp-2 mb-3">{report.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/20">
                  <span className="text-[10px] text-body-text/50">{formatDate(report.reportedAt)}</span>
                  {report.status !== 'resolved' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextStatus: AdminReportStatus = report.status === 'new' ? 'received' : report.status === 'received' ? 'processing' : 'resolved';
                        updateStatus(report.id, nextStatus);
                      }}
                      disabled={actionLoading === report.id}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      {actionLoading === report.id ? (
                        <i className="ri-loader-4-line animate-spin"></i>
                      ) : (
                        report.status === 'new' ? 'Tiếp nhận' : report.status === 'received' ? 'Xử lý' : 'Hoàn tất'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Desktop Kanban View */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-4 gap-6">
              {statusColumns.map(col => (
                <div key={col.key} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={'w-3 h-3 rounded-full ' + col.color}></div>
                    <h3 className="font-semibold text-heading">{col.label}</h3>
                    <span className="px-2 py-0.5 bg-white/50 rounded-lg text-xs font-medium text-body-text">
                      {getReportsByStatus(col.key).length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {getReportsByStatus(col.key).map(report => {
                      const typeInfo = getTypeInfo(report.type);
                      return (
                        <div
                          key={report.id}
                          onClick={() => handleViewDetail(report)}
                          className={'glass-admin rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer ' + (
                            report.isUrgent ? 'ring-2 ring-status-danger' : ''
                          )}
                        >
                          {report.isUrgent && (
                            <div className="flex items-center gap-1 text-status-danger text-xs font-medium mb-2">
                              <i className="ri-alarm-warning-fill"></i>
                              KHẨN CẤP
                            </div>
                          )}
                          <div className={'flex items-center gap-2 mb-2 ' + typeInfo.color}>
                            <i className={typeInfo.icon}></i>
                            <span className="text-sm font-medium">{typeInfo.label}</span>
                          </div>
                          <h4 className="font-medium text-heading text-sm">{report.toiletName}</h4>
                          <p className="text-xs text-body-text/70 mt-1 line-clamp-2">{report.description}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                            <span className="text-xs text-body-text/50">{formatDate(report.reportedAt)}</span>
                            {col.key !== 'resolved' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextStatus: AdminReportStatus = col.key === 'new' ? 'received' : col.key === 'received' ? 'processing' : 'resolved';
                                  updateStatus(report.id, nextStatus);
                                }}
                                disabled={actionLoading === report.id}
                                className="text-xs text-primary font-medium hover:underline disabled:opacity-50"
                              >
                                {actionLoading === report.id ? '...' : col.key === 'new' ? 'Tiếp nhận' : col.key === 'received' ? 'Xử lý' : 'Hoàn tất'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {getReportsByStatus(col.key).length === 0 && (
                      <div className="bg-white/30 rounded-xl p-6 text-center border-2 border-dashed border-white/30">
                        <p className="text-sm text-body-text/50">Không có báo cáo</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Desktop List View */}
          {viewMode === 'list' && (
            <div className="glass-admin rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left px-4 py-4 text-sm font-semibold text-heading whitespace-nowrap">Địa điểm</th>
                      <th className="text-left px-4 py-4 text-sm font-semibold text-heading whitespace-nowrap">Loại</th>
                      <th className="text-left px-4 py-4 text-sm font-semibold text-heading whitespace-nowrap">Mô tả</th>
                      <th className="text-left px-4 py-4 text-sm font-semibold text-heading whitespace-nowrap">Trạng thái</th>
                      <th className="text-left px-4 py-4 text-sm font-semibold text-heading whitespace-nowrap">Thời gian</th>
                      <th className="text-right px-4 py-4 text-sm font-semibold text-heading whitespace-nowrap">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedReports.map(report => {
                      const typeInfo = getTypeInfo(report.type);
                      const statusCol = statusColumns.find(s => s.key === report.status);
                      return (
                        <tr 
                          key={report.id} 
                          onClick={() => handleViewDetail(report)}
                          className="border-b border-white/10 hover:bg-white/30 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {report.isUrgent && (
                                <div className="w-2 h-2 bg-status-danger rounded-full animate-pulse flex-shrink-0"></div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-heading whitespace-nowrap">{report.toiletName}</p>
                                <p className="text-xs text-body-text/70 whitespace-nowrap">{report.toiletAddress}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={'flex items-center gap-2 ' + typeInfo.color}>
                              <i className={typeInfo.icon}></i>
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-body-text max-w-xs truncate">{report.description}</p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={'px-3 py-1 rounded-lg text-xs font-medium text-white ' + statusCol?.color}>
                              {statusCol?.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-body-text/70 whitespace-nowrap">
                            {formatDate(report.reportedAt)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleViewDetail(report); }}
                                className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
                              >
                                <i className="ri-eye-line"></i>
                              </button>
                              {report.status !== 'resolved' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextStatus: AdminReportStatus = report.status === 'new' ? 'received' : report.status === 'received' ? 'processing' : 'resolved';
                                    updateStatus(report.id, nextStatus);
                                  }}
                                  disabled={actionLoading === report.id}
                                  className="w-8 h-8 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20 flex items-center justify-center transition-colors disabled:opacity-50"
                                >
                                  {actionLoading === report.id ? (
                                    <i className="ri-loader-4-line animate-spin"></i>
                                  ) : (
                                    <i className="ri-arrow-right-line"></i>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-heading">Chi tiết báo cáo</h2>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <i className="ri-close-line text-xl text-body-text"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedReport.isUrgent && (
                <div className="flex items-center gap-2 p-3 bg-status-danger/10 rounded-xl text-status-danger">
                  <i className="ri-alarm-warning-fill text-xl"></i>
                  <span className="font-medium">BÁO CÁO KHẨN CẤP</span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-heading">{selectedReport.toiletName}</h3>
                <p className="text-sm text-body-text/70 mt-1">{selectedReport.toiletAddress}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-body-text/50 mb-1">Loại báo cáo</p>
                  <p className={'font-medium flex items-center gap-2 ' + getTypeInfo(selectedReport.type).color}>
                    <i className={getTypeInfo(selectedReport.type).icon}></i>
                    {getTypeInfo(selectedReport.type).label}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-body-text/50 mb-1">Trạng thái</p>
                  <span className={'px-3 py-1 rounded-lg text-xs font-medium text-white ' + statusColumns.find(s => s.key === selectedReport.status)?.color}>
                    {statusColumns.find(s => s.key === selectedReport.status)?.label}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-body-text/50 mb-1">Mô tả chi tiết</p>
                <p className="text-sm text-heading bg-gray-50 rounded-xl p-3">{selectedReport.description || 'Không có mô tả'}</p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <i className="ri-user-line text-primary"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-heading text-sm">{selectedReport.reportedBy.name}</p>
                  <p className="text-xs text-body-text/70">{formatDate(selectedReport.reportedAt)}</p>
                </div>
              </div>

              {/* Status Actions */}
              {selectedReport.status !== 'resolved' && (
                <div>
                  <p className="text-sm font-medium text-heading mb-2">Cập nhật trạng thái:</p>
                  <div className="flex flex-wrap gap-2">
                    {statusColumns.filter(s => s.key !== selectedReport.status).map(status => (
                      <button
                        key={status.key}
                        onClick={() => updateStatus(selectedReport.id, status.key)}
                        disabled={actionLoading === selectedReport.id}
                        className={'px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ' + status.color + ' text-white'}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-3 rounded-xl border-2 border-gray-200 text-body-text font-medium hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCenter;
