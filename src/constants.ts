// Goong API Keys
export const GOONG_MAPTILES_KEY = '6TkRmHiSnQEE3IGjPAytQCUUyUNPa601YmMPn4Qu';
export const GOONG_API_KEY = '2ogKs9Ji7SSrHwXdtdkzOJoBlibkgnFHav3e30RZ';

// Default Admin Email List (always admin, cannot be removed)
export const DEFAULT_ADMIN_EMAILS = [
  'al.squared.la@gmail.com',
];

// Synchronous check for initial routing (uses default list only)
// For full check including Firestore, use checkIsAdmin from firebase.ts
export const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return DEFAULT_ADMIN_EMAILS.includes(email.toLowerCase());
};

// Map Configuration
export const DEFAULT_VIEWPORT = {
  lat: 21.0285, // Hanoi default
  lng: 105.8542,
  zoom: 14
};

import { Toilet } from './types';

export const TOILET_FILTERS = [
  { id: 'gender', icon: 'ri-group-line', label: 'Phân loại' },
  { id: 'access', icon: 'ri-wheelchair-line', label: 'Hỗ trợ NKT' },
  { id: 'free', icon: 'ri-money-dollar-circle-line', label: 'Miễn phí' },
  { id: 'amenities', icon: 'ri-drop-line', label: 'Tiện nghi' },
] as const;

export const MOCK_TOILETS: Toilet[] = [
  {
    id: '1',
    name: 'WC Công cộng Hồ Gươm',
    location: { lat: 21.0288, lng: 105.8525 },
    address: 'Đinh Tiên Hoàng, Hoàn Kiếm',
    type: 'public',
    price_type: 'paid',
    price_amount: 5000,
    gender: 'unisex',
    accessibility: true,
    amenities: ['paper', 'mirror'],
    status: 'active',
    clean_score: 4.2,
    images: ['https://picsum.photos/400/300']
  },
  {
    id: '2',
    name: 'Vincom Bà Triệu (Tầng 3)',
    location: { lat: 21.0125, lng: 105.8488 },
    address: '191 Bà Triệu',
    type: 'commercial',
    price_type: 'free',
    gender: 'unisex',
    accessibility: true,
    amenities: ['paper', 'bidet', 'soap', 'mirror'],
    status: 'active',
    clean_score: 4.8,
    images: ['https://picsum.photos/400/301']
  },
  {
    id: '3',
    name: 'WC Lưu động Lễ hội',
    location: { lat: 21.0295, lng: 105.8500 },
    address: 'Quảng trường Đông Kinh Nghĩa Thục',
    type: 'event',
    price_type: 'free',
    gender: 'unisex',
    accessibility: false,
    amenities: [],
    status: 'maintenance',
    clean_score: 2.5,
    images: ['https://picsum.photos/400/302']
  }
];