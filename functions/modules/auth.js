/* ===================================
   HOXICOCO - AUTH MODULE (Backend)
   Xác thực người dùng
   =================================== */

const admin = require('firebase-admin');

/**
 * Xác thực và lấy thông tin user
 */
async function verifyUser(context) {
  if (!context.auth) {
    throw new Error('Unauthorized: User not authenticated');
  }
  
  const userId = context.auth.uid;
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new Error('User not found');
  }
  
  return {
    uid: userId,
    data: userDoc.data()
  };
}

/**
 * Kiểm tra quyền admin
 */
async function verifyAdmin(context) {
  const user = await verifyUser(context);
  
  if (user.data.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return user;
}

module.exports = { verifyUser, verifyAdmin };
