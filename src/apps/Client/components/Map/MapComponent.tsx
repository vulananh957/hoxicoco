import React, { useEffect, useRef, useCallback } from 'react';
import { GOONG_MAPTILES_KEY, DEFAULT_VIEWPORT } from '../../../../constants';
import { Toilet, GeoPoint, NavigationState, FireworkLocation } from '../../../../types';

// Declare global goongjs variable loaded via script tag
declare global {
  interface Window {
    goongjs: any;
  }
}

interface MapComponentProps {
  userLocation: GeoPoint | null;
  center?: GeoPoint | null; // New prop for controlling map view
  toilets: Toilet[];
  onToiletSelect: (toilet: Toilet) => void;
  routeGeometry: string | null; // Encoded polyline string from Goong
  navigationState?: NavigationState; // Turn-by-turn navigation state
  // Festival Mode
  festivalMode?: boolean;
  fireworks?: FireworkLocation[];
  onFireworkSelect?: (firework: FireworkLocation) => void;
}

// Cluster interface
interface Cluster {
  lat: number;
  lng: number;
  toilets: Toilet[];
  fireworks?: FireworkLocation[];
  count: number;
}

// Firework cluster interface
interface FireworkCluster {
  lat: number;
  lng: number;
  fireworks: FireworkLocation[];
  count: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  userLocation: _userLocation, 
  center,
  toilets, 
  onToiletSelect,
  routeGeometry,
  navigationState,
  festivalMode,
  fireworks,
  onFireworkSelect
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // Use any type as we are using global lib
  const markersRef = useRef<any[]>([]);
  const fireworkMarkersRef = useRef<any[]>([]); // Separate ref for firework markers
  const userMarkerRef = useRef<any>(null); // Custom user location marker with heading
  const userArrowRef = useRef<HTMLDivElement | null>(null); // Reference to arrow element for rotation
  const compassEnabledRef = useRef<boolean>(false); // Track if compass is enabled
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [goongReady, setGoongReady] = React.useState(!!window.goongjs);
  const [currentZoom, setCurrentZoom] = React.useState(DEFAULT_VIEWPORT.zoom);
  const [userHeading, setUserHeading] = React.useState<number>(0); // Device heading in degrees
  const [isNavigationMode, setIsNavigationMode] = React.useState(false);
  const [compassPermissionNeeded, setCompassPermissionNeeded] = React.useState(false);

  // Cluster threshold - zoom level dưới mức này sẽ cluster
  const CLUSTER_ZOOM_THRESHOLD = 13;

  // Helper function to adjust color brightness
  const adjustColor = useCallback((color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }, []);

  // Simple clustering function
  const createClusters = useCallback((toiletList: Toilet[], zoom: number): Cluster[] => {
    if (zoom >= CLUSTER_ZOOM_THRESHOLD) {
      // No clustering at high zoom - each toilet is its own "cluster"
      return toiletList.map(t => ({
        lat: t.location.lat,
        lng: t.location.lng,
        toilets: [t],
        count: 1
      }));
    }

    // Cluster radius based on zoom (smaller zoom = larger radius)
    const clusterRadius = Math.pow(2, 14 - zoom) * 0.005; // degrees
    
    const clusters: Cluster[] = [];
    const assigned = new Set<string>();

    toiletList.forEach(toilet => {
      if (assigned.has(toilet.id)) return;

      // Find all toilets within radius
      const nearby = toiletList.filter(t => {
        if (assigned.has(t.id)) return false;
        const dlat = Math.abs(t.location.lat - toilet.location.lat);
        const dlng = Math.abs(t.location.lng - toilet.location.lng);
        return dlat < clusterRadius && dlng < clusterRadius;
      });

      // Mark as assigned
      nearby.forEach(t => assigned.add(t.id));

      // Calculate cluster center
      const avgLat = nearby.reduce((sum, t) => sum + t.location.lat, 0) / nearby.length;
      const avgLng = nearby.reduce((sum, t) => sum + t.location.lng, 0) / nearby.length;

      clusters.push({
        lat: avgLat,
        lng: avgLng,
        toilets: nearby,
        count: nearby.length
      });
    });

    return clusters;
  }, [CLUSTER_ZOOM_THRESHOLD]);

  // Clustering function for fireworks
  const createFireworkClusters = useCallback((fireworkList: FireworkLocation[], zoom: number): FireworkCluster[] => {
    if (zoom >= CLUSTER_ZOOM_THRESHOLD) {
      // No clustering at high zoom - each firework is its own "cluster"
      return fireworkList.map(fw => ({
        lat: fw.location.lat,
        lng: fw.location.lng,
        fireworks: [fw],
        count: 1
      }));
    }

    // Cluster radius based on zoom (smaller zoom = larger radius)
    const clusterRadius = Math.pow(2, 14 - zoom) * 0.005; // degrees
    
    const clusters: FireworkCluster[] = [];
    const assigned = new Set<string>();

    fireworkList.forEach(firework => {
      if (assigned.has(firework.id)) return;

      // Find all fireworks within radius
      const nearby = fireworkList.filter(fw => {
        if (assigned.has(fw.id)) return false;
        const dlat = Math.abs(fw.location.lat - firework.location.lat);
        const dlng = Math.abs(fw.location.lng - firework.location.lng);
        return dlat < clusterRadius && dlng < clusterRadius;
      });

      // Mark as assigned
      nearby.forEach(fw => assigned.add(fw.id));

      // Calculate cluster center
      const avgLat = nearby.reduce((sum, fw) => sum + fw.location.lat, 0) / nearby.length;
      const avgLng = nearby.reduce((sum, fw) => sum + fw.location.lng, 0) / nearby.length;

      clusters.push({
        lat: avgLat,
        lng: avgLng,
        fireworks: nearby,
        count: nearby.length
      });
    });

    return clusters;
  }, [CLUSTER_ZOOM_THRESHOLD]);

  // Wait for Goong JS to load
  useEffect(() => {
    if (window.goongjs) {
      setGoongReady(true);
      return;
    }

    const checkGoong = setInterval(() => {
      if (window.goongjs) {
        setGoongReady(true);
        clearInterval(checkGoong);
      }
    }, 100);

    return () => clearInterval(checkGoong);
  }, []);

  // Device Orientation (Compass) handler - simplified
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    let heading = 0;
    
    // iOS uses webkitCompassHeading (0-360, 0 = North)
    if ('webkitCompassHeading' in event && (event as any).webkitCompassHeading !== null) {
      heading = (event as any).webkitCompassHeading;
    } 
    // Android/others use alpha (0-360, but 0 = device pointing direction when page loaded)
    // We need absolute orientation, so use absolute if available
    else if (event.absolute && event.alpha !== null) {
      heading = 360 - event.alpha; // Convert to compass heading
    }
    else if (event.alpha !== null) {
      heading = 360 - event.alpha;
    }
    
    setUserHeading(heading);
  }, []);

  // Enable compass listener
  const enableCompass = useCallback(() => {
    if (compassEnabledRef.current) return;
    
    window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    compassEnabledRef.current = true;
  }, [handleOrientation]);

  // Request iOS permission (must be called from user gesture)
  const requestCompassPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          enableCompass();
          setCompassPermissionNeeded(false);
          return true;
        }
      } catch (e) {
        console.warn('DeviceOrientation permission denied:', e);
      }
      return false;
    } else {
      // Android or older iOS - no permission needed
      enableCompass();
      return true;
    }
  }, [enableCompass]);

  // Check if we need iOS permission
  useEffect(() => {
    if (navigationState?.isActive) {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        // iOS 13+ needs permission from user gesture
        setCompassPermissionNeeded(true);
      } else {
        // Android - enable directly
        enableCompass();
      }
    }
    
    return () => {
      if (!navigationState?.isActive) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true);
        window.removeEventListener('deviceorientation', handleOrientation, true);
        compassEnabledRef.current = false;
      }
    };
  }, [navigationState?.isActive, enableCompass, handleOrientation]);

  // Toggle navigation mode
  useEffect(() => {
    setIsNavigationMode(navigationState?.isActive || false);
  }, [navigationState?.isActive]);

  // Rotate arrow when heading changes - SIMPLE direct rotation
  useEffect(() => {
    if (!userArrowRef.current) return;
    
    // Just rotate the arrow by heading degrees
    // Heading 0 = North = arrow points up
    // Heading 90 = East = arrow points right
    userArrowRef.current.style.transform = `rotate(${userHeading}deg)`;
  }, [userHeading]);

  // Update user marker and follow user during navigation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.goongjs || !_userLocation) return;

    const goongjs = window.goongjs;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
      userArrowRef.current = null;
    }

    // Create custom user marker with direction arrow
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    
    // When navigating, show directional arrow; otherwise show simple dot
    if (isNavigationMode) {
      el.innerHTML = `
        <style>
          .user-nav-marker {
            width: 48px;
            height: 48px;
            position: relative;
          }
          .user-nav-arrow {
            width: 48px;
            height: 48px;
            position: absolute;
            top: 0;
            left: 0;
            transition: transform 0.15s linear;
            will-change: transform;
          }
          .user-nav-arrow svg {
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          }
          .user-nav-pulse {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(0, 180, 216, 0.2);
            animation: navPulse 2s ease-out infinite;
          }
          @keyframes navPulse {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          }
        </style>
        <div class="user-nav-marker">
          <div class="user-nav-pulse"></div>
          <div class="user-nav-arrow" style="transform: rotate(${userHeading}deg);">
            <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#00B4D8"/>
                  <stop offset="100%" style="stop-color:#0077B6"/>
                </linearGradient>
              </defs>
              <path d="M24 4 L36 38 L24 30 L12 38 Z" fill="url(#arrowGrad)" stroke="white" stroke-width="2"/>
              <circle cx="24" cy="24" r="4" fill="white"/>
            </svg>
          </div>
        </div>
      `;
      
      // Store reference to arrow element for rotation
      setTimeout(() => {
        userArrowRef.current = el.querySelector('.user-nav-arrow') as HTMLDivElement;
      }, 0);
    } else {
      // Simple blue dot when not navigating
      el.innerHTML = `
        <style>
          .user-dot-marker {
            width: 20px;
            height: 20px;
            background: #00B4D8;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          }
          .user-dot-pulse {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0, 180, 216, 0.3);
            animation: dotPulse 2s ease-out infinite;
            z-index: -1;
          }
          @keyframes dotPulse {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
          }
        </style>
        <div style="position: relative;">
          <div class="user-dot-pulse"></div>
          <div class="user-dot-marker"></div>
        </div>
      `;
    }

    userMarkerRef.current = new goongjs.Marker({ 
      element: el, 
      anchor: 'center',
      rotationAlignment: 'viewport'
    })
      .setLngLat([_userLocation.lng, _userLocation.lat])
      .addTo(map);

    // Follow user during navigation
    if (isNavigationMode) {
      map.easeTo({
        center: [_userLocation.lng, _userLocation.lat],
        duration: 300
      });
    }

  }, [_userLocation, isNavigationMode, mapLoaded]);

  // Decode Google Polyline Algorithm string to GeoJSON coordinates [lng, lat]
  const decodePolyline = (encoded: string): number[][] => {
    let points: number[][] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      // Goong/Google encodes as (Lat, Lng), but GeoJSON requires (Lng, Lat)
      points.push([lng * 1e-5, lat * 1e-5]);
    }
    return points;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;
    if (!goongReady) return;
    
    // Check if library is loaded
    if (!window.goongjs) {
      console.error("Goong JS not loaded");
      return;
    }

    try {
      const goongjs = window.goongjs;
      
      // Goong JS specific: Set the access token directly
      goongjs.accessToken = GOONG_MAPTILES_KEY;

      const map = new goongjs.Map({
        container: mapContainerRef.current,
        style: 'https://tiles.goong.io/assets/goong_map_web.json',
        center: [DEFAULT_VIEWPORT.lng, DEFAULT_VIEWPORT.lat],
        zoom: DEFAULT_VIEWPORT.zoom,
        attributionControl: false,
        logoPosition: 'bottom-left',
        antialias: true,
      });

      map.on('load', () => {
        setMapLoaded(true); // Mark map as ready
        setCurrentZoom(map.getZoom());
        
        // Listen to zoom changes
        map.on('zoomend', () => {
          setCurrentZoom(map.getZoom());
        });
        
        // Try to add geolocate control after map is fully loaded
        try {
          const geolocate = new goongjs.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: false, // Disable - we manage user marker ourselves
            showUserHeading: false,
            showAccuracyCircle: false,
            showUserLocation: false // Disable default user location dot
          });
          map.addControl(geolocate, 'top-right');
          
          // Trigger geolocation
          setTimeout(() => {
            try {
              geolocate.trigger();
            } catch(e) {
              console.warn("Geolocate trigger failed", e);
            }
          }, 500);
        } catch(e) {
          console.warn("GeolocateControl not supported", e);
        }

        // Add Route Layer Source (Empty initially)
        if (!map.getSource('route')) {
          map.addSource('route', {
            'type': 'geojson',
            'data': {
              'type': 'Feature',
              'properties': {},
              'geometry': {
                'type': 'LineString',
                'coordinates': []
              }
            }
          });
        }

        // Add Route Layer Style
        if (!map.getLayer('route')) {
          map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
              'line-join': 'round',
              'line-cap': 'round'
            },
            'paint': {
              'line-color': '#00B4D8', // Primary color (Cyan)
              'line-width': 6,
              'line-opacity': 0.8
            }
          });
        }
      });

      mapRef.current = map;

    } catch (err) {
      console.error("Error initializing map:", err);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [goongReady]);

  // Handle programmatic camera movement (Search Result)
  useEffect(() => {
    if (center && mapRef.current) {
        mapRef.current.flyTo({
            center: [center.lng, center.lat],
            zoom: 16,
            speed: 1.5,
            essential: true
        });
    }
  }, [center]);

  // Render Toilet Markers with Clustering
  useEffect(() => {
    if (!mapRef.current || !window.goongjs || !mapLoaded) {
      return;
    }
    
    const goongjs = window.goongjs;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Hide toilet markers when in Festival Mode
    if (festivalMode) {
      return;
    }

    // Create clusters based on current zoom
    const clusters = createClusters(toilets, currentZoom);

    clusters.forEach((cluster, idx) => {
      const el = document.createElement('div');
      
      if (cluster.count === 1) {
        // Single toilet marker
        const toilet = cluster.toilets[0];
        el.className = 'toilet-marker';
        
        let primaryColor = '#00B4D8';
        let shadowColor = 'rgba(0, 180, 216, 0.4)';
        
        if (toilet.status === 'danger') {
          primaryColor = '#ef4444';
          shadowColor = 'rgba(239, 68, 68, 0.4)';
        } else if (toilet.status === 'maintenance' || toilet.status === 'pending') {
          primaryColor = '#f59e0b';
          shadowColor = 'rgba(245, 158, 11, 0.4)';
        }

        const isFree = toilet.price_type === 'free';
        const hasGoodRating = toilet.clean_score >= 4;

        el.innerHTML = `
          <style>
            .marker-single-${idx} {
              position: relative;
              cursor: pointer;
              filter: drop-shadow(0 2px 6px ${shadowColor});
            }
            .marker-single-${idx}:hover {
              filter: drop-shadow(0 3px 8px ${shadowColor});
            }
            .marker-body-${idx} {
              width: 32px;
              height: 32px;
              background: linear-gradient(145deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%);
              border-radius: 50% 50% 50% 4px;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid white;
            }
            .toilet-svg-${idx} {
              transform: rotate(45deg);
              width: 16px;
              height: 16px;
              fill: white;
            }
            .marker-badge-${idx} {
              position: absolute;
              top: -3px;
              right: -3px;
              width: 14px;
              height: 14px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              line-height: 1;
              border: 1.5px solid white;
            }
            .badge-free { background: #10b981; color: white; }
            .badge-star { background: #f59e0b; color: white; }
            .badge-money { background: #10b981; color: white; font-weight: 700; display:flex; align-items:center; justify-content:center; }
          </style>
          <div class="marker-single-${idx}">
            <div class="marker-body-${idx}">
              <svg class="toilet-svg-${idx}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V8H4V6Z"/>
                <path d="M3 9H21V12C21 14.2091 19.2091 16 17 16H16.5L17 20C17 20.5523 16.5523 21 16 21H8C7.44772 21 7 20.5523 7 20L7.5 16H7C4.79086 16 3 14.2091 3 12V9Z"/>
              </svg>
            </div>
            ${hasGoodRating && !isFree ? `<div class="marker-badge-${idx} badge-star"><i class="ri-star-fill"></i></div>` : ''}
            ${!isFree && !hasGoodRating ? `<div class="marker-badge-${idx} badge-money">$</div>` : ''}
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onToiletSelect(toilet);
          mapRef.current?.flyTo({
            center: [toilet.location.lng, toilet.location.lat],
            zoom: 16,
            speed: 1.2,
          });
        });

      } else {
        // Cluster marker - hiển thị số lượng
        el.className = 'toilet-cluster';
        
        // Size based on count
        const size = Math.min(50, 32 + cluster.count * 2);
        
        el.innerHTML = `
          <style>
            .cluster-${idx} {
              width: ${size}px;
              height: ${size}px;
              background: linear-gradient(145deg, #00B4D8 0%, #0077B6 100%);
              border-radius: 50%;
              border: 3px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              box-shadow: 0 3px 10px rgba(0, 180, 216, 0.4);
              transition: transform 0.2s;
            }
            .cluster-${idx}:hover {
              transform: scale(1.1);
            }
            .cluster-count-${idx} {
              color: white;
              font-weight: bold;
              font-size: ${Math.min(18, 12 + cluster.count)}px;
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
          </style>
          <div class="cluster-${idx}">
            <span class="cluster-count-${idx}">${cluster.count}</span>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          // Zoom vào cluster
          mapRef.current?.flyTo({
            center: [cluster.lng, cluster.lat],
            zoom: Math.min(currentZoom + 2, 16),
            speed: 1.2,
          });
        });
      }

      const marker = new goongjs.Marker({ element: el, anchor: 'center' })
        .setLngLat([cluster.lng, cluster.lat])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [toilets, onToiletSelect, mapLoaded, currentZoom, createClusters, adjustColor, festivalMode]);

  // ==================== FIREWORK MARKERS ====================
  useEffect(() => {
    if (!mapRef.current || !window.goongjs || !mapLoaded) return;

    const goongjs = window.goongjs;

    // Clear existing firework markers
    fireworkMarkersRef.current.forEach(marker => marker.remove());
    fireworkMarkersRef.current = [];

    // Only show firework markers when festival mode is on
    if (!festivalMode || !fireworks || fireworks.length === 0) return;

    // Create clusters based on current zoom
    const clusters = createFireworkClusters(fireworks, currentZoom);

    clusters.forEach((cluster, idx) => {
      const el = document.createElement('div');
      
      if (cluster.count === 1) {
        // Single firework marker with sparkles
        const fw = cluster.fireworks[0];
        el.className = 'firework-marker';

        const isHigh = fw.type === 'high';
        const primaryColor = isHigh ? '#FF6B35' : '#FFD700';
        const secondaryColor = isHigh ? '#D62828' : '#FF8C00';
        const glowColor = isHigh ? 'rgba(255, 107, 53, 0.5)' : 'rgba(255, 215, 0, 0.5)';

        el.innerHTML = `
          <style>
            .fw-pin-${idx} {
              position: relative;
              cursor: pointer;
              filter: drop-shadow(0 3px 8px ${glowColor});
              transition: transform 0.2s, filter 0.2s;
            }
            .fw-pin-${idx}:hover {
              transform: scale(1.15);
              filter: drop-shadow(0 4px 12px ${glowColor});
            }
            .fw-body-${idx} {
              width: 36px;
              height: 36px;
              background: linear-gradient(145deg, ${primaryColor} 0%, ${secondaryColor} 100%);
              border-radius: 50% 50% 50% 4px;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2.5px solid white;
              position: relative;
            }
            .fw-icon-${idx} {
              transform: rotate(45deg);
              width: 18px;
              height: 18px;
              fill: white;
            }
            .fw-sparkle-${idx} {
              position: absolute;
              width: 46px;
              height: 46px;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              pointer-events: none;
            }
            .fw-sparkle-${idx} .spark {
              position: absolute;
              width: 3px;
              height: 3px;
              background: ${primaryColor};
              border-radius: 50%;
              animation: fwSparkle-${idx} 1.5s ease-in-out infinite;
            }
            .fw-sparkle-${idx} .spark:nth-child(1) { top: 0; left: 50%; animation-delay: 0s; }
            .fw-sparkle-${idx} .spark:nth-child(2) { top: 15%; right: 0; animation-delay: 0.3s; }
            .fw-sparkle-${idx} .spark:nth-child(3) { bottom: 15%; right: 0; animation-delay: 0.6s; }
            .fw-sparkle-${idx} .spark:nth-child(4) { bottom: 0; left: 50%; animation-delay: 0.9s; }
            .fw-sparkle-${idx} .spark:nth-child(5) { bottom: 15%; left: 0; animation-delay: 0.4s; }
            .fw-sparkle-${idx} .spark:nth-child(6) { top: 15%; left: 0; animation-delay: 0.7s; }
            @keyframes fwSparkle-${idx} {
              0%, 100% { opacity: 0; transform: scale(0); }
              50% { opacity: 1; transform: scale(1.5); }
            }
            .fw-type-${idx} {
              position: absolute;
              top: -6px;
              right: -6px;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              border: 1.5px solid white;
              background: ${isHigh ? '#D62828' : '#FF8C00'};
              color: white;
              font-weight: 700;
            }
          </style>
          <div class="fw-pin-${idx}">
            <div class="fw-sparkle-${idx}">
              <div class="spark"></div><div class="spark"></div><div class="spark"></div>
              <div class="spark"></div><div class="spark"></div><div class="spark"></div>
            </div>
            <div class="fw-body-${idx}">
              <svg class="fw-icon-${idx}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="fill: #FFD700;">
                <path d="M12 2L9.5 9H2L8 13.5L5.5 21L12 16L18.5 21L16 13.5L22 9H14.5L12 2Z"/>
              </svg>
            </div>
            <div class="fw-type-${idx}">${isHigh ? '↑' : '↓'}</div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onFireworkSelect?.(fw);
          mapRef.current?.flyTo({
            center: [fw.location.lng, fw.location.lat],
            zoom: 15,
            speed: 1.2,
          });
        });
      } else {
        // Firework cluster marker - hiển thị số lượng
        el.className = 'firework-cluster';
        
        // Size based on count
        const size = Math.min(55, 32 + cluster.count * 2);
        
        el.innerHTML = `
          <style>
            .fw-cluster-${idx} {
              width: ${size}px;
              height: ${size}px;
              background: linear-gradient(145deg, #FF9D1C 0%, #FF6B35 100%);
              border-radius: 50%;
              border: 3px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              box-shadow: 0 3px 10px rgba(255, 107, 53, 0.5);
              transition: transform 0.2s;
            }
            .fw-cluster-${idx}:hover {
              transform: scale(1.1);
            }
            .fw-cluster-count-${idx} {
              color: white;
              font-weight: bold;
              font-size: ${Math.min(18, 12 + cluster.count)}px;
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
          </style>
          <div class="fw-cluster-${idx}">
            <span class="fw-cluster-count-${idx}">${cluster.count}</span>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          // Zoom into cluster
          mapRef.current?.flyTo({
            center: [cluster.lng, cluster.lat],
            zoom: Math.min(currentZoom + 2, 16),
            speed: 1.2,
          });
        });
      }

      const marker = new goongjs.Marker({ element: el, anchor: 'center' })
        .setLngLat([cluster.lng, cluster.lat])
        .addTo(mapRef.current!);

      fireworkMarkersRef.current.push(marker);
    });
  }, [fireworks, festivalMode, mapLoaded, currentZoom, createFireworkClusters, onFireworkSelect]);

  // Update Route Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.goongjs) return;
    
    // Check if source exists
    if (!map.getSource('route')) return;
    
    const goongjs = window.goongjs;

    if (routeGeometry) {
      try {
        const coordinates = decodePolyline(routeGeometry);
        
        const source = map.getSource('route');
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          });
        }

        // Fit bounds to route
        if (coordinates.length > 0) {
          const bounds = new goongjs.LngLatBounds();
          coordinates.forEach(coord => bounds.extend(coord as [number, number]));
          map.fitBounds(bounds, { padding: 50 });
        }
      } catch (e) {
        console.error("Error decoding polyline:", e);
      }
    } else {
      // Clear route
      const source = map.getSource('route');
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] }
        });
      }
    }

  }, [routeGeometry, mapLoaded]);

  return (
    <div ref={mapContainerRef} className="w-full h-full">
      {/* iOS Compass Permission Button */}
      {compassPermissionNeeded && isNavigationMode && (
        <button
          onClick={requestCompassPermission}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium"
          style={{ animation: 'pulse 2s infinite' }}
        >
          <i className="ri-compass-3-line"></i>
          Bật la bàn
        </button>
      )}
    </div>
  );
};

export default MapComponent;