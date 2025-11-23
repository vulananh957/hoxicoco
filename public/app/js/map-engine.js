/* ===================================
   HOXICOCO - MAP ENGINE
   Logic hiển thị và tương tác với bản đồ
   =================================== */

// TODO: Tích hợp Mapbox hoặc Google Maps API

/**
 * Khởi tạo bản đồ
 */
function initMap() {
  console.log('🗺️ Map Engine: Initializing map...');
  
  // TODO: Khởi tạo map instance
  // TODO: Load các marker nhà vệ sinh từ Firestore
  // TODO: Hiển thị vị trí hiện tại của user
}

/**
 * Tìm kiếm địa điểm
 */
function searchLocation(query) {
  console.log('🔍 Searching for:', query);
  
  // TODO: Gọi API tìm kiếm
  // TODO: Cập nhật map với kết quả
}

/**
 * Lấy vị trí hiện tại
 */
function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Current location:', latitude, longitude);
        
        // TODO: Di chuyển bản đồ đến vị trí hiện tại
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
      }
    );
  } else {
    console.error('❌ Geolocation not supported');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  
  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchLocation(e.target.value);
      }
    });
  }
  
  // Current Location
  const btnCurrentLocation = document.getElementById('btnCurrentLocation');
  if (btnCurrentLocation) {
    btnCurrentLocation.addEventListener('click', getCurrentLocation);
  }
});

export { initMap, searchLocation, getCurrentLocation };
