import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { fetchDashboardStats, fetchAllReports, DashboardStats, AdminReport } from '../../../services/firebase';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalToilets: 0,
    activeToilets: 0,
    pendingToilets: 0,
    dangerToilets: 0,
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    avgCleanScore: 0
  });
  const [recentReports, setRecentReports] = useState<AdminReport[]>([]);

  const loadData = async () => {
    try {
      const [statsData, reportsData] = await Promise.all([
        fetchDashboardStats(),
        fetchAllReports()
      ]);
      setStats(statsData);
      setRecentReports(reportsData.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    init();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toiletTypes = [
    { name: 'Hoạt động', value: stats.activeToilets, color: '#2ECC71' },
    { name: 'Chờ duyệt', value: stats.pendingToilets, color: '#F39C12' },
    { name: 'Cảnh báo', value: stats.dangerToilets, color: '#E74C3C' },
  ].filter(t => t.value > 0);

  const reportStats = [
    { name: 'Chờ xử lý', value: stats.pendingReports, color: '#E74C3C' },
    { name: 'Đã xử lý', value: stats.resolvedReports, color: '#2ECC71' },
  ].filter(r => r.value > 0);

  const kpiCards = [
    {
      title: 'Tổng địa điểm',
      value: stats.totalToilets.toString(),
      change: stats.activeToilets + ' hoạt động',
      changeType: 'info',
      icon: 'ri-map-pin-line',
      iconBg: 'bg-primary',
      iconColor: 'text-white',
      onClick: () => navigate('/admin/toilets')
    },
    {
      title: 'Báo cáo chờ xử lý',
      value: stats.pendingReports.toString(),
      change: stats.pendingReports > 0 ? 'Cần xử lý!' : 'Đã xử lý hết',
      changeType: stats.pendingReports > 0 ? 'negative' : 'positive',
      icon: 'ri-alarm-warning-line',
      iconBg: 'bg-status-danger/20',
      iconColor: 'text-status-danger',
      onClick: () => navigate('/admin/reports')
    },
    {
      title: 'Đánh giá trung bình',
      value: stats.avgCleanScore.toFixed(1),
      change: stats.avgCleanScore >= 4 ? 'Tốt' : stats.avgCleanScore >= 3 ? 'Khá' : 'Cần cải thiện',
      changeType: stats.avgCleanScore >= 3.5 ? 'positive' : 'negative',
      icon: 'ri-star-line',
      iconBg: 'bg-status-warn/20',
      iconColor: 'text-status-warn',
      onClick: () => navigate('/admin/toilets')
    },
    {
      title: 'Chờ duyệt',
      value: stats.pendingToilets.toString(),
      change: stats.pendingToilets > 0 ? 'Địa điểm mới' : 'Không có',
      changeType: 'info',
      icon: 'ri-time-line',
      iconBg: 'bg-status-success/20',
      iconColor: 'text-status-success',
      onClick: () => navigate('/admin/pending')
    },
  ];

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'dirty': return 'Bẩn';
      case 'broken': return 'Hỏng thiết bị';
      case 'no_paper': return 'Hết giấy';
      case 'camera': return 'Camera';
      case 'harassment': return 'Biến thái';
      default: return type;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return minutes + ' phút trước';
    if (hours < 24) return hours + ' giờ trước';
    return days + ' ngày trước';
  };

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
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">Tổng quan</h1>
          <p className="text-body-text/70 mt-1 text-sm sm:text-base">Xin chào! Đây là tình hình hệ thống hôm nay.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/30 text-sm disabled:opacity-50"
          >
            <i className={'ri-refresh-line ' + (refreshing ? 'animate-spin' : '')}></i>
            <span className="hidden sm:inline">{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {kpiCards.map((card, index) => (
          <div 
            key={index} 
            onClick={card.onClick}
            className="glass-admin rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-xl transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className={'w-10 h-10 sm:w-12 sm:h-12 ' + card.iconBg + ' rounded-lg sm:rounded-xl flex items-center justify-center'}>
                <i className={card.icon + ' text-xl sm:text-2xl ' + card.iconColor}></i>
              </div>
              <span className={'text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg ' + (
                card.changeType === 'positive' 
                  ? 'bg-status-success/10 text-status-success' 
                  : card.changeType === 'negative'
                  ? 'bg-status-danger/10 text-status-danger'
                  : 'bg-primary/10 text-primary'
              )}>
                {card.change}
              </span>
            </div>
            <div className="mt-3 sm:mt-4">
              <p className="text-xl sm:text-3xl font-bold text-heading">{card.value}</p>
              <p className="text-xs sm:text-sm text-body-text/70 mt-0.5 sm:mt-1 truncate">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Toilet Status Pie Chart */}
        <div className="glass-admin rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-heading mb-4 sm:mb-6">Trạng thái địa điểm</h2>
          {toiletTypes.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={toiletTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {toiletTypes.map((entry, index) => (
                      <Cell key={'cell-' + index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                {toiletTypes.map((type, index) => (
                  <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                      <span className="text-body-text">{type.name}</span>
                    </div>
                    <span className="font-medium text-heading">{type.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-body-text/50">
              <i className="ri-pie-chart-line text-4xl mb-2"></i>
              <p>Chưa có dữ liệu</p>
            </div>
          )}
        </div>

        {/* Reports Status Chart */}
        <div className="glass-admin rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-heading mb-4 sm:mb-6">Tình trạng báo cáo</h2>
          {reportStats.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={reportStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {reportStats.map((entry, index) => (
                      <Cell key={'cell-' + index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-sm text-body-text/70">
                  Tổng: <span className="font-bold text-heading">{stats.totalReports}</span> báo cáo
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-body-text/50">
              <i className="ri-bar-chart-line text-4xl mb-2"></i>
              <p>Chưa có báo cáo nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="glass-admin rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-bold text-heading">Báo cáo gần đây</h2>
          <button 
            onClick={() => navigate('/admin/reports')}
            className="text-primary text-xs sm:text-sm font-medium hover:underline"
          >
            Xem tất cả
          </button>
        </div>
        {recentReports.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-white/50 transition-colors">
                <div className={'w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ' + (
                  report.isUrgent ? 'bg-status-danger/20' : 
                  report.status === 'new' ? 'bg-primary/20' : 'bg-status-warn/20'
                )}>
                  <i className={'ri-alarm-warning-line text-lg ' + (
                    report.isUrgent ? 'text-status-danger' :
                    report.status === 'new' ? 'text-primary' : 'text-status-warn'
                  )}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-heading text-sm truncate">{report.toiletName}</p>
                  <p className="text-xs text-body-text/70">{getTypeLabel(report.type)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs text-body-text/50 whitespace-nowrap">{formatTime(report.reportedAt)}</span>
                  {report.isUrgent && (
                    <p className="text-[10px] text-status-danger font-medium">KHẨN CẤP</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-body-text/50">
            <i className="ri-checkbox-circle-line text-4xl text-status-success mb-2"></i>
            <p>Không có báo cáo nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
