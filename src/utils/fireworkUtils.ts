/**
 * Utilities for firework locations
 * Thời gian bắn pháo hoa cố định: từ 0h đến 0h15 ngày 17/2/2026 (15 phút)
 * Sau 1h sẽ là đã kết thúc
 */

/**
 * Tính toán status của điểm bắn pháo hoa dựa vào thời gian hiện tại
 * @param date - Ngày bắn (YYYY-MM-DD)
 * @param time - Giờ bắn (HH:mm)
 * @returns Status: 'upcoming' | 'active' | 'ended'
 */
export const getFireworkStatus = (date: string, time: string): 'upcoming' | 'active' | 'ended' => {
  try {
    const now = new Date();
    
    // Tạo ngày/giờ bắn
    const startTime = new Date(`${date}T${time}:00`);
    
    // Kéo dài 15 phút
    const endTime = new Date(startTime.getTime() + 15 * 60 * 1000);
    
    // Nếu hiện tại < giờ bắn → sắp diễn ra
    if (now < startTime) {
      return 'upcoming';
    }
    
    // Nếu hiện tại >= giờ bắn AND < giờ kết thúc → đang diễn ra
    if (now >= startTime && now < endTime) {
      return 'active';
    }
    
    // Nếu hiện tại >= giờ kết thúc → đã kết thúc
    return 'ended';
  } catch (error) {
    console.error('Error calculating firework status:', error);
    return 'upcoming';
  }
};

/**
 * Lấy màu sắc theo status
 */
export const getStatusColor = (status: 'upcoming' | 'active' | 'ended') => {
  switch (status) {
    case 'upcoming':
      return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sắp diễn ra' };
    case 'active':
      return { bg: 'bg-green-100', text: 'text-green-700', label: 'Đang diễn ra' };
    case 'ended':
      return { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Đã kết thúc' };
    default:
      return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sắp diễn ra' };
  }
};
