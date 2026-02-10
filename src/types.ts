export type ToiletStatus = 'active' | 'pending' | 'maintenance' | 'danger';
export type PriceType = 'free' | 'paid';
export type GenderType = 'separated' | 'unisex'; // separated = phân chia nam/nữ, unisex = chung

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Toilet {
  id: string;
  name: string;
  location: GeoPoint;
  address: string;
  type: 'public' | 'commercial' | 'event';
  price_type: PriceType;
  price_amount?: number;
  gender: GenderType;
  accessibility: boolean;
  amenities: string[]; // 'paper', 'bidet', 'mirror', etc.
  status: ToiletStatus;
  clean_score: number; // 1.0 - 5.0
  images: string[];
  distance?: number; // Calculated at runtime (meters)
  duration?: number; // Calculated at runtime (minutes)
}

export interface Review {
  id: string;
  toilet_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  media?: string[]; // URLs of images/videos
  timestamp: number;
}

// State quản lý bộ lọc
export interface FilterState {
  gender: GenderType | 'all';
  accessibility: boolean;
  freeOnly: boolean;
  hasPaper: boolean;
  hasBidet: boolean;
  hasSink: boolean;
}

// Kết quả tìm kiếm từ Goong
export interface SearchResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Turn-by-turn Navigation Types
export type TurnType = 
  | 'depart'      // Bắt đầu
  | 'arrive'      // Đến nơi
  | 'turn-left'   // Rẽ trái
  | 'turn-right'  // Rẽ phải
  | 'slight-left' // Chếch trái
  | 'slight-right'// Chếch phải
  | 'sharp-left'  // Rẽ gấp trái
  | 'sharp-right' // Rẽ gấp phải
  | 'uturn'       // Quay đầu
  | 'straight'    // Đi thẳng
  | 'roundabout'  // Vòng xuyến
  | 'merge'       // Nhập làn
  | 'fork';       // Ngã ba

export interface NavigationStep {
  instruction: string;        // Hướng dẫn text (VD: "Rẽ trái vào đường ABC")
  distance: number;           // Khoảng cách của bước này (meters)
  duration: number;           // Thời gian đi bước này (seconds)
  turnType: TurnType;         // Loại rẽ
  streetName?: string;        // Tên đường
  startLocation: GeoPoint;    // Vị trí bắt đầu bước
  endLocation: GeoPoint;      // Vị trí kết thúc bước
  polyline: string;           // Encoded polyline cho bước này
}

export interface NavigationRoute {
  totalDistance: number;      // Tổng khoảng cách (meters)
  totalDuration: number;      // Tổng thời gian (seconds)
  steps: NavigationStep[];    // Các bước chi tiết
  geometry: string;           // Encoded polyline toàn tuyến
}

export interface NavigationState {
  isActive: boolean;          // Đang dẫn đường không
  route: NavigationRoute | null;
  currentStepIndex: number;   // Index bước hiện tại
  distanceToNextStep: number; // Khoảng cách đến điểm rẽ tiếp (meters)
  remainingDistance: number;  // Khoảng cách còn lại (meters)
  remainingDuration: number;  // Thời gian còn lại (seconds)
}

export interface AppState {
  userLocation: GeoPoint | null;
  selectedToilet: Toilet | null;
  toilets: Toilet[];
  filterRadius: number; // meters
  isNavigationActive: boolean;
  isLoading: boolean;
}

// ==================== FESTIVAL / FIREWORK ====================

export interface FireworkLocation {
  id: string;
  name: string;
  location: GeoPoint;
  address: string;
  district: string;        // Quận/Huyện
  date: string;             // VD: "2026-02-09"
  time: string;             // VD: "00:00" (giao thừa)
  duration: number;         // Thời lượng bắn (phút)
  type: 'high' | 'low';    // Tầm cao / Tầm thấp
  description?: string;
  images?: string[];
  status: 'upcoming' | 'active' | 'ended';
  created_at?: number;
}