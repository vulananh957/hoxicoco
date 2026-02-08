import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

// Components
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import MapComponent from './components/Map/MapComponent';
import BottomSheet from './components/UI/BottomSheet';
import ReportModal from './components/UI/ReportModal';
import Toast from './components/UI/Toast';
import AddToiletForm from './components/Forms/AddToiletForm';
import Community from './components/Community/Community';

// Services & Types
import { subscribeToToilets, signInWithGoogle, logOut, onAuthChange, addReport, ReportType, checkIsAdmin } from '../../services/firebase';
import { getDetailedRoute } from '../../services/goongService';
import { Toilet, FilterState, GeoPoint, NavigationState } from '../../types';
import { DEFAULT_VIEWPORT, isAdmin } from '../../constants';

const ClientLayout: React.FC = () => {
  const navigate = useNavigate();
  
  // Core States
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [mapCenter, setMapCenter] = useState<GeoPoint | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'add' | 'community'>('map');
  
  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    gender: 'all',
    accessibility: false,
    freeOnly: false,
    hasPaper: false,
    hasBidet: false,
    hasSink: false,
  });
  const [radius, setRadius] = useState<number | null>(null); // Default: no radius filter (show all)

  // Navigation State - Turn-by-turn
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isActive: false,
    route: null,
    currentStepIndex: 0,
    distanceToNextStep: 0,
    remainingDistance: 0,
    remainingDuration: 0
  });
  
  // Realtime location tracking ref
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<GeoPoint | null>(null);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // UI States
  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [hideBottomNav, setHideBottomNav] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      // Nếu admin login, hiện prompt hỏi có muốn vào admin không
      if (user) {
        // Quick check default admin list first
        if (isAdmin(user.email)) {
          setIsAdminUser(true);
          setShowAdminPrompt(true);
        } else {
          // Then check Firestore for dynamically added admins
          const isAdminCheck = await checkIsAdmin(user.email);
          if (isAdminCheck) {
            setIsAdminUser(true);
            setShowAdminPrompt(true);
          } else {
            setIsAdminUser(false);
          }
        }
      } else {
        setIsAdminUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Check for post parameter and switch to community tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    if (postId) {
      setActiveTab('community');
    }
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setMapCenter(loc);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          // Use default Hanoi location as fallback
          const fallback = { lat: DEFAULT_VIEWPORT.lat, lng: DEFAULT_VIEWPORT.lng };
          setUserLocation(fallback);
          setMapCenter(fallback);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Fetch toilets when location changes - with realtime updates
  useEffect(() => {
    // Subscribe to realtime updates
    const unsubscribe = subscribeToToilets((data) => {
      setToilets(data);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Calculate distance between two points
  const calculateDistance = (loc1: GeoPoint, loc2: GeoPoint): number => {
    const R = 6371e3; // meters
    const φ1 = (loc1.lat * Math.PI) / 180;
    const φ2 = (loc2.lat * Math.PI) / 180;
    const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Start realtime location tracking for navigation
  const startLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) return; // Already tracking
    
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          lastLocationRef.current = newLocation;
          setUserLocation(newLocation);
        },
        (err) => {
          console.warn('Geolocation watch error:', err);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 0 // Always get fresh position
        }
      );
    }
  }, []);

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Update navigation state when user location changes during navigation
  useEffect(() => {
    if (!navigationState.isActive || !navigationState.route || !userLocation) return;

    const { route, currentStepIndex } = navigationState;
    const currentStep = route.steps[currentStepIndex];
    
    if (!currentStep) return;

    // Calculate distance to next step's end point
    const distanceToStepEnd = calculateDistance(userLocation, currentStep.endLocation);
    
    // Threshold to consider step completed (20 meters)
    const STEP_COMPLETION_THRESHOLD = 20;
    
    // Check if user has reached the end of current step
    if (distanceToStepEnd < STEP_COMPLETION_THRESHOLD && currentStepIndex < route.steps.length - 1) {
      // Move to next step
      const nextIndex = currentStepIndex + 1;
      const nextStep = route.steps[nextIndex];
      
      // Calculate remaining distance and duration
      let remainingDist = 0;
      let remainingDur = 0;
      for (let i = nextIndex; i < route.steps.length; i++) {
        remainingDist += route.steps[i].distance;
        remainingDur += route.steps[i].duration;
      }
      
      setNavigationState(prev => ({
        ...prev,
        currentStepIndex: nextIndex,
        distanceToNextStep: nextStep.distance,
        remainingDistance: remainingDist,
        remainingDuration: remainingDur
      }));
      
      // Show toast for next turn
      if (nextStep.turnType !== 'straight' && nextStep.turnType !== 'depart') {
        setToast({ message: nextStep.instruction, type: 'info' });
      }
    } else {
      // Update distance to next step end
      setNavigationState(prev => ({
        ...prev,
        distanceToNextStep: distanceToStepEnd
      }));
    }
    
    // Check if arrived at destination
    if (currentStep.turnType === 'arrive' || 
        (selectedToilet && calculateDistance(userLocation, selectedToilet.location) < 30)) {
      setToast({ message: '🎉 Bạn đã đến nơi!', type: 'success' });
      // Don't auto-cancel, let user do it
    }
    
  }, [userLocation, navigationState.isActive, navigationState.route, navigationState.currentStepIndex, selectedToilet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

  // Filter & sort toilets
  const filteredToilets = React.useMemo(() => {
    const refLocation = userLocation || { lat: DEFAULT_VIEWPORT.lat, lng: DEFAULT_VIEWPORT.lng };

    // Filter by status - show active, danger, maintenance (not pending - waiting for approval)
    const visibleToilets = toilets.filter(t => t.status !== 'pending');

    const result = visibleToilets
      .map((t) => ({
        ...t,
        distance: calculateDistance(refLocation, t.location),
      }))
      .filter((t) => {
        // Distance filter - chỉ áp dụng khi radius !== null
        if (radius !== null && t.distance > radius) {
          return false;
        }
        
        // Gender filter
        if (filters.gender !== 'all' && t.gender !== filters.gender) return false;
        // Accessibility filter
        if (filters.accessibility && !t.accessibility) return false;
        // Free only filter
        if (filters.freeOnly && t.price_type !== 'free') return false;
        // Amenities
        if (filters.hasPaper && !t.amenities.includes('paper')) return false;
        if (filters.hasBidet && !t.amenities.includes('bidet')) return false;
        if (filters.hasSink && !t.amenities.includes('sink')) return false;

        return true;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    return result;
  }, [toilets, filters, radius, userLocation]);

  // Handle directions - Start turn-by-turn navigation
  const handleDirections = useCallback(async () => {
    if (!selectedToilet || !userLocation) return;

    const route = await getDetailedRoute(userLocation, selectedToilet.location);
    if (route) {
      // Start realtime tracking
      startLocationTracking();
      
      // Initialize navigation state
      setNavigationState({
        isActive: true,
        route,
        currentStepIndex: 0,
        distanceToNextStep: route.steps[0]?.distance || 0,
        remainingDistance: route.totalDistance,
        remainingDuration: route.totalDuration
      });
      
      setToast({ message: 'Bắt đầu dẫn đường!', type: 'info' });
    } else {
      setToast({ message: 'Không thể tìm được đường đi', type: 'error' });
    }
  }, [selectedToilet, userLocation, startLocationTracking]);

  // Cancel navigation
  const handleCancelNavigation = useCallback(() => {
    stopLocationTracking();
    setNavigationState({
      isActive: false,
      route: null,
      currentStepIndex: 0,
      distanceToNextStep: 0,
      remainingDistance: 0,
      remainingDuration: 0
    });
  }, [stopLocationTracking]);

  // Handle report
  const handleReport = async (issueType: ReportType, description: string) => {
    if (!selectedToilet || !currentUser) return;
    
    const success = await addReport(
      selectedToilet.id,
      currentUser.uid,
      currentUser.displayName || 'Người dùng',
      currentUser.email || '',
      issueType,
      description
    );
    
    if (success) {
      setToast({ message: 'Báo cáo đã được gửi!', type: 'success' });
      setShowReportModal(false);
    } else {
      setToast({ message: 'Có lỗi xảy ra, vui lòng thử lại!', type: 'error' });
    }
  };

  // Handle toilet select
  const handleToiletSelect = (toilet: Toilet) => {
    setSelectedToilet(toilet);
    // Cancel any active navigation when selecting new toilet
    handleCancelNavigation();
  };

  // Handle search location select
  const handleLocationSelect = (location: GeoPoint) => {
    setMapCenter(location);
  };

  // Handle sign in/out
  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await logOut();
    setToast({ message: 'Đã đăng xuất!', type: 'info' });
  };

  // Handle add toilet success
  const handleAddSuccess = () => {
    setActiveTab('map');
    setToast({ message: 'Đóng góp thành công! Chờ Admin duyệt.', type: 'success' });
    // Refresh toilets
    // Realtime subscription will pick up the new toilet; no explicit fetch needed.
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-bg-main">
      {/* Header with Filters */}
      <Header
        userLocation={userLocation}
        filters={filters}
        radius={radius}
        onFilterChange={setFilters}
        onRadiusChange={setRadius}
        onLocationSelect={handleLocationSelect}
        toilets={filteredToilets}
        onToiletSelect={handleToiletSelect}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Map View */}
      {activeTab === 'map' && (
        <MapComponent
          userLocation={userLocation}
          center={mapCenter}
          toilets={filteredToilets}
          onToiletSelect={handleToiletSelect}
          routeGeometry={navigationState.route?.geometry || null}
          navigationState={navigationState}
        />
      )}

      {/* Add Toilet View */}
      {activeTab === 'add' && (
        <div className="pt-36 pb-32 px-4 h-full overflow-y-auto">
          {currentUser ? (
            <AddToiletForm
              userLocation={userLocation}
              userId={currentUser.uid}
              userName={currentUser.displayName || undefined}
              userEmail={currentUser.email || undefined}
              onSuccess={handleAddSuccess}
              onCancel={() => setActiveTab('map')}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <i className="ri-user-line text-primary text-3xl"></i>
              </div>
              <h2 className="text-xl font-bold text-heading mb-2">Đăng nhập để đóng góp</h2>
              <p className="text-body-text mb-6">Bạn cần đăng nhập để thêm địa điểm mới</p>
              <button
                onClick={handleSignIn}
                className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
              >
                <i className="ri-google-fill"></i>
                Đăng nhập với Google
              </button>
            </div>
          )}
        </div>
      )}

      {/* Community View */}
      {activeTab === 'community' && (
        <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col bg-bg-main">
          <div className="h-32 shrink-0"></div> {/* Header spacer - increased */}
          <div className="flex-1 overflow-y-auto">
            <Community />
          </div>
          <div className="h-32 shrink-0"></div> {/* Bottom nav spacer - increased */}
        </div>
      )}

      {/* Bottom Sheet */}
      {selectedToilet && activeTab === 'map' && (
        <BottomSheet
          toilet={selectedToilet}
          onClose={() => {
            setSelectedToilet(null);
            handleCancelNavigation();
          }}
          onDirections={handleDirections}
          onReport={() => {
            if (!currentUser) {
              setToast({ message: 'Vui lòng đăng nhập để báo cáo!', type: 'error' });
              return;
            }
            setShowReportModal(true);
          }}
          navigationState={navigationState}
          onCancelNavigation={handleCancelNavigation}
          userId={currentUser?.uid || null}
          userName={currentUser?.displayName || null}
          userEmail={currentUser?.email || null}
          onReviewOpen={() => setHideBottomNav(true)}
          onReviewClose={() => setHideBottomNav(false)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && selectedToilet && (
        <ReportModal
          toiletName={selectedToilet.name}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReport}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Admin Prompt Modal */}
      {showAdminPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-shield-keyhole-line text-primary text-3xl"></i>
              </div>
              <h3 className="text-lg font-bold text-heading">Xin chào Admin!</h3>
              <p className="text-body-text text-sm mt-2">Bạn muốn vào trang quản trị hay tiếp tục dùng app?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAdminPrompt(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-body-text font-medium hover:bg-gray-50"
              >
                Dùng App
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-light"
              >
                Vào Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Admin Button - chỉ hiện cho admin khi đã đóng prompt */}
      {isAdminUser && !showAdminPrompt && (
        <button
          onClick={() => navigate('/admin')}
          className="fixed bottom-24 right-4 z-50 w-12 h-12 bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform"
          title="Quay về Admin"
        >
          <i className="ri-shield-keyhole-line text-xl"></i>
        </button>
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} hidden={hideBottomNav} />
    </div>
  );
};

export default ClientLayout;
