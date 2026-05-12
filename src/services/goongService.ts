import { GOONG_API_KEY } from '../constants';
import { SearchResult, GeoPoint, NavigationRoute, NavigationStep, TurnType } from '../types';
import i18n from '../i18n';

interface RouteResponse {
  geometry: string; // encoded polyline
  distance: number; // meters
  duration: number; // seconds
}

// Helper: Parse maneuver type từ Goong API sang TurnType
const parseManeuverType = (modifier?: string, maneuverType?: string): TurnType => {
  if (maneuverType === 'depart') return 'depart';
  if (maneuverType === 'arrive') return 'arrive';
  if (maneuverType === 'roundabout' || maneuverType === 'rotary') return 'roundabout';
  if (maneuverType === 'merge') return 'merge';
  if (maneuverType === 'fork') return 'fork';
  
  if (modifier) {
    const mod = modifier.toLowerCase();
    if (mod.includes('sharp') && mod.includes('left')) return 'sharp-left';
    if (mod.includes('sharp') && mod.includes('right')) return 'sharp-right';
    if (mod.includes('slight') && mod.includes('left')) return 'slight-left';
    if (mod.includes('slight') && mod.includes('right')) return 'slight-right';
    if (mod.includes('left')) return 'turn-left';
    if (mod.includes('right')) return 'turn-right';
    if (mod.includes('uturn') || mod.includes('u-turn')) return 'uturn';
    if (mod.includes('straight')) return 'straight';
  }
  
  return 'straight';
};

// Helper: Tạo hướng dẫn với i18n từ TurnType
const createInstructionWithI18n = (turnType: TurnType, streetName?: string): string => {
  // Get current language from i18n
  const currentLang = i18n.language || 'vi';
  console.log('Current i18n language:', currentLang);
  
  const t = i18n.t.bind(i18n);
  let action = '';
  
  switch (turnType) {
    case 'depart': action = t('navigation.directions.depart'); break;
    case 'arrive': action = t('navigation.directions.arrive'); break;
    case 'turn-left': action = t('navigation.directions.turnLeft'); break;
    case 'turn-right': action = t('navigation.directions.turnRight'); break;
    case 'slight-left': action = t('navigation.directions.slightLeft'); break;
    case 'slight-right': action = t('navigation.directions.slightRight'); break;
    case 'sharp-left': action = t('navigation.directions.sharpLeft'); break;
    case 'sharp-right': action = t('navigation.directions.sharpRight'); break;
    case 'uturn': action = t('navigation.directions.uturn'); break;
    case 'straight': action = t('navigation.directions.straight'); break;
    case 'roundabout': action = t('navigation.directions.roundabout'); break;
    case 'merge': action = t('navigation.directions.merge'); break;
    case 'fork': action = t('navigation.directions.fork'); break;
    default: action = t('navigation.directions.continue');
  }
  
  console.log(`Translating ${turnType} to:`, action);
  
  if (streetName && turnType !== 'arrive') {
    return `${action} ${t('navigation.directions.into')} ${streetName}`;
  }
  return action;
};

// --- Routing API with Turn-by-turn instructions ---
export const getDetailedRoute = async (
  start: GeoPoint, 
  end: GeoPoint
): Promise<NavigationRoute | null> => {
  try {
    // Request với steps=true để lấy chi tiết từng bước
    // Sử dụng vehicle=bike - Goong API hỗ trợ tốt hơn với bike so với walk
    const url = `https://rsapi.goong.io/Direction?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&vehicle=bike&api_key=${GOONG_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('Goong API Error:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs?.[0];
    
    if (!leg || !route.overview_polyline?.points) {
      return null;
    }

    // Parse steps
    const steps: NavigationStep[] = [];
    
    if (leg.steps && leg.steps.length > 0) {
      leg.steps.forEach((step: any, index: number) => {
        const maneuver = step.maneuver || {};
        const turnType = parseManeuverType(maneuver.modifier, maneuver.type);
        
        // Extract street name from instruction or name field
        let streetName = step.name || '';
        if (!streetName && step.instruction) {
          // Try to extract từ instruction (VD: "Turn left onto ABC Street")
          const match = step.instruction.match(/(?:onto|into|on)\s+(.+)/i);
          if (match) streetName = match[1];
        }
        
        // Create instruction with i18n
        const instruction = step.html_instructions 
          ? step.html_instructions.replace(/<[^>]*>/g, '') // Remove HTML tags
          : createInstructionWithI18n(turnType, streetName);
        
        steps.push({
          instruction,
          distance: step.distance?.value || 0,
          duration: step.duration?.value || 0,
          turnType,
          streetName: streetName || undefined,
          startLocation: {
            lat: step.start_location?.lat || maneuver.location?.[1] || start.lat,
            lng: step.start_location?.lng || maneuver.location?.[0] || start.lng
          },
          endLocation: {
            lat: step.end_location?.lat || end.lat,
            lng: step.end_location?.lng || end.lng
          },
          polyline: step.polyline?.points || ''
        });
      });
    } else {
      // Fallback: Tạo 2 steps cơ bản nếu API không trả về steps
      const t = i18n.t.bind(i18n);
      
      steps.push({
        instruction: t('navigation.directions.depart'),
        distance: 0,
        duration: 0,
        turnType: 'depart',
        startLocation: start,
        endLocation: start,
        polyline: ''
      });
      
      steps.push({
        instruction: t('navigation.directions.straight'),
        distance: leg.distance?.value || 0,
        duration: leg.duration?.value || 0,
        turnType: 'straight',
        startLocation: start,
        endLocation: end,
        polyline: route.overview_polyline.points
      });
      
      steps.push({
        instruction: t('navigation.directions.arrive'),
        distance: 0,
        duration: 0,
        turnType: 'arrive',
        startLocation: end,
        endLocation: end,
        polyline: ''
      });
    }

    return {
      totalDistance: leg.distance?.value || 0,
      totalDuration: leg.duration?.value || 0,
      steps,
      geometry: route.overview_polyline.points
    };
    
  } catch (error) {
    console.error("Error fetching detailed route:", error);
    return null;
  }
};

// --- Simple Routing API (legacy, for backward compatibility) ---
export const getRoute = async (start: {lat: number, lng: number}, end: {lat: number, lng: number}): Promise<RouteResponse | null> => {
  try {
    const url = `https://rsapi.goong.io/Direction?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&vehicle=bike&api_key=${GOONG_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        console.warn('Goong API Error:', response.statusText);
        return null;
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      // Check if overview_polyline exists
      if (!route.overview_polyline || !route.overview_polyline.points) {
          return null;
      }

      return {
        geometry: route.overview_polyline.points,
        distance: route.legs?.[0]?.distance?.value || 0,
        duration: route.legs?.[0]?.duration?.value || 0
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
};

// --- Places API (Search) ---

export const searchPlaces = async (query: string, location?: GeoPoint): Promise<SearchResult[]> => {
  if (!query) return [];
  
  try {
    let url = `https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(query)}`;
    
    // Ưu tiên tìm kiếm xung quanh vị trí người dùng nếu có
    if (location) {
      url += `&location=${location.lat},${location.lng}&radius=2000`; // 2km radius bias
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.predictions) {
      return data.predictions as SearchResult[];
    }
    return [];
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
};

export const getPlaceDetail = async (placeId: string): Promise<GeoPoint | null> => {
  try {
    const url = `https://rsapi.goong.io/Place/Detail?place_id=${placeId}&api_key=${GOONG_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result && data.result.geometry) {
      return {
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting place detail:", error);
    return null;
  }
};