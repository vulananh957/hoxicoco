import { GeoPoint } from "../types";

// Bán kính trái đất (km)
const R = 6371;

/**
 * Tính khoảng cách giữa 2 điểm tọa độ theo công thức Haversine
 * @param start Điểm bắt đầu
 * @param end Điểm kết thúc
 * @returns Khoảng cách (mét)
 */
export const calculateDistance = (start: GeoPoint, end: GeoPoint): number => {
  const dLat = deg2rad(end.lat - start.lat);
  const dLon = deg2rad(end.lng - start.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(start.lat)) * Math.cos(deg2rad(end.lat)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Khoảng cách theo km
  
  return d * 1000; // Trả về mét
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};