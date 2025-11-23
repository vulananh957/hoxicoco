/* ===================================
   HOXICOCO - ADMIN LOGIC
   Logic quản trị (Gọi API quyền cao)
   =================================== */

// TODO: Implement Firebase Admin SDK calls

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
  console.log('📊 Loading dashboard stats...');
  
  try {
    // TODO: Gọi Cloud Function để lấy thống kê
    // const stats = await firebase.functions().httpsCallable('getAdminStats')();
    
    console.log('✅ Stats loaded');
  } catch (error) {
    console.error('❌ Error loading stats:', error);
  }
}

/**
 * Duyệt báo cáo
 */
async function approveReport(reportId) {
  console.log('✓ Approving report:', reportId);
  
  try {
    // TODO: Gọi Cloud Function với quyền admin
    // await firebase.functions().httpsCallable('approveReport')({ reportId });
    
    alert('Đã duyệt báo cáo!');
    // TODO: Reload table
  } catch (error) {
    console.error('❌ Error approving report:', error);
    alert('Có lỗi xảy ra!');
  }
}

/**
 * Từ chối báo cáo
 */
async function rejectReport(reportId) {
  console.log('× Rejecting report:', reportId);
  
  try {
    // TODO: Gọi Cloud Function với quyền admin
    // await firebase.functions().httpsCallable('rejectReport')({ reportId });
    
    alert('Đã từ chối báo cáo!');
    // TODO: Reload table
  } catch (error) {
    console.error('❌ Error rejecting report:', error);
    alert('Có lỗi xảy ra!');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // TODO: Kiểm tra xác thực admin
  // TODO: Load dashboard data
  
  loadDashboardStats();
  
  // Approve/Reject buttons
  document.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const reportId = e.target.closest('tr').querySelector('td').textContent;
      approveReport(reportId);
    });
  });
  
  document.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const reportId = e.target.closest('tr').querySelector('td').textContent;
      rejectReport(reportId);
    });
  });
});

export { loadDashboardStats, approveReport, rejectReport };
