/* ===================================
   HOXICOCO - USER REPORT
   Logic gửi báo cáo từ người dùng
   =================================== */

/**
 * Hiển thị form báo cáo
 */
function showReportForm() {
  console.log('📝 Opening report form...');
  
  // TODO: Load view/report-form.html
  // TODO: Hiển thị modal
}

/**
 * Gửi báo cáo lên server
 * QUAN TRỌNG: Chỉ gửi dữ liệu thô, KHÔNG tính toán logic
 */
async function submitReport(reportData) {
  console.log('📤 Submitting report:', reportData);
  
  try {
    // TODO: Gọi Firebase Cloud Function
    // const result = await firebase.functions().httpsCallable('submitReport')(reportData);
    
    console.log('✅ Report submitted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error submitting report:', error);
    return { success: false, error };
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const btnReport = document.getElementById('btnReport');
  if (btnReport) {
    btnReport.addEventListener('click', showReportForm);
  }
});

export { showReportForm, submitReport };
