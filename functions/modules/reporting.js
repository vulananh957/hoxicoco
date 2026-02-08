/* ===================================
   HOXICOCO - REPORTING MODULE (Backend)
   Xử lý báo cáo vi phạm
   =================================== */

const admin = require('firebase-admin');
const { verifyUser, verifyAdmin } = require('./auth');

/**
 * Gửi báo cáo từ người dùng
 */
async function submitReport(data, context) {
  try {
    const user = await verifyUser(context);
    
    const reportData = {
      toiletId: data.toiletId,
      userId: user.uid,
      rating: data.rating,
      photos: data.photos || [],
      notes: data.notes || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending' // Chờ admin duyệt
    };
    
    const reportRef = await admin.firestore()
      .collection('reports')
      .add(reportData);
    
    return { success: true, reportId: reportRef.id };
  } catch (error) {
    console.error('Error submitting report:', error);
    throw new Error('Failed to submit report');
  }
}

/**
 * Duyệt báo cáo (Chỉ Admin)
 */
async function approveReport(data, context) {
  try {
    await verifyAdmin(context);
    
    const { reportId } = data;
    const reportRef = admin.firestore().collection('reports').doc(reportId);
    
    await reportRef.update({
      status: 'approved',
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: context.auth.uid
    });
    
    // TODO: Cập nhật CleanScore của toilet
    
    return { success: true, message: 'Report approved' };
  } catch (error) {
    console.error('Error approving report:', error);
    throw new Error('Failed to approve report');
  }
}

/**
 * Từ chối báo cáo (Chỉ Admin)
 */
async function rejectReport(data, context) {
  try {
    await verifyAdmin(context);
    
    const { reportId, reason } = data;
    const reportRef = admin.firestore().collection('reports').doc(reportId);
    
    await reportRef.update({
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectedBy: context.auth.uid,
      rejectionReason: reason || 'No reason provided'
    });
    
    return { success: true, message: 'Report rejected' };
  } catch (error) {
    console.error('Error rejecting report:', error);
    throw new Error('Failed to reject report');
  }
}

module.exports = { submitReport, approveReport, rejectReport };
