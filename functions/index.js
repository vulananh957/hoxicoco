/* ===================================
   HOXICOCO - CLOUD FUNCTIONS
   Entry point cho Firebase Cloud Functions
   =================================== */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Khởi tạo Firebase Admin
admin.initializeApp();

// Import các module
const { getToilets, addToilet } = require('./modules/toilet-api');
const { submitReport, approveReport, rejectReport } = require('./modules/reporting');
const { analyzeToiletImage, moderateImage } = require('./modules/ai-vision');

// ========== TOILET APIs ==========
exports.getToilets = functions.https.onCall(getToilets);
exports.addToilet = functions.https.onCall(addToilet);

// ========== REPORT APIs ==========
exports.submitReport = functions.https.onCall(submitReport);
exports.approveReport = functions.https.onCall(approveReport);
exports.rejectReport = functions.https.onCall(rejectReport);

// ========== AI APIs ==========
exports.analyzeImage = functions.https.onCall(async (data, context) => {
  const { imageUrl } = data;
  
  // Kiểm tra ảnh có phù hợp
  const moderation = await moderateImage(imageUrl);
  if (!moderation.isSafe) {
    throw new Error('Image contains inappropriate content');
  }
  
  // Phân tích ảnh
  const analysis = await analyzeToiletImage(imageUrl);
  return { success: true, analysis };
});

console.log('✅ Cloud Functions loaded');
