/* ===================================
   HOXICOCO - TOILET API MODULE (Backend)
   CRUD dữ liệu nhà vệ sinh
   =================================== */

const admin = require('firebase-admin');
const { verifyUser } = require('./auth');

/**
 * Lấy danh sách nhà vệ sinh (Public)
 */
async function getToilets(data, context) {
  try {
    const { lat, lng, radius = 5000 } = data;
    
    // TODO: Query Firestore với geolocation
    const toiletsSnapshot = await admin.firestore()
      .collection('toilets')
      .where('status', '==', 'approved')
      .limit(50)
      .get();
    
    const toilets = [];
    toiletsSnapshot.forEach(doc => {
      toilets.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, toilets };
  } catch (error) {
    console.error('Error fetching toilets:', error);
    throw new Error('Failed to fetch toilets');
  }
}

/**
 * Thêm nhà vệ sinh mới
 */
async function addToilet(data, context) {
  try {
    const user = await verifyUser(context);
    
    const toiletData = {
      ...data,
      createdBy: user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending', // Chờ admin duyệt
      cleanScore: 0
    };
    
    const toiletRef = await admin.firestore()
      .collection('toilets')
      .add(toiletData);
    
    return { success: true, toiletId: toiletRef.id };
  } catch (error) {
    console.error('Error adding toilet:', error);
    throw new Error('Failed to add toilet');
  }
}

module.exports = { getToilets, addToilet };
