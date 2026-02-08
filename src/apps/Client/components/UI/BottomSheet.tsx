import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Toilet, NavigationState, TurnType } from '../../../../types';
import ReviewSection from './ReviewSection';

interface BottomSheetProps {
  toilet: Toilet | null;
  onClose: () => void;
  onDirections: () => void;
  onReport?: () => void;
  navigationState?: NavigationState;
  onCancelNavigation?: () => void;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  onReviewOpen?: () => void;
  onReviewClose?: () => void;
}

// Helper: Icon cho từng loại rẽ
const getTurnIcon = (turnType: TurnType): string => {
  switch (turnType) {
    case 'depart': return 'ri-navigation-line';
    case 'arrive': return 'ri-flag-2-fill';
    case 'turn-left': return 'ri-corner-up-left-line';
    case 'turn-right': return 'ri-corner-up-right-line';
    case 'slight-left': return 'ri-arrow-left-up-line';
    case 'slight-right': return 'ri-arrow-right-up-line';
    case 'sharp-left': return 'ri-corner-down-left-line';
    case 'sharp-right': return 'ri-corner-down-right-line';
    case 'uturn': return 'ri-arrow-go-back-line';
    case 'straight': return 'ri-arrow-up-line';
    case 'roundabout': return 'ri-refresh-line';
    case 'merge': return 'ri-git-merge-line';
    case 'fork': return 'ri-git-branch-line';
    default: return 'ri-arrow-up-line';
  }
};

// Helper: Format distance
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

// Helper: Format duration
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)} giây`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}p`;
};

// Helper: Translate instruction based on TurnType
const translateInstruction = (instruction: string, turnType: TurnType, t: any): string => {
  // Map of Vietnamese keywords to translation keys
  const translationMap: Record<string, string> = {
    'Xuất phát': 'navigation.directions.depart',
    'Bạn đã đến': 'navigation.directions.arrive',
    'Rẽ trái': 'navigation.directions.turnLeft',
    'Rẽ phải': 'navigation.directions.turnRight',
    'Chếch trái nhẹ': 'navigation.directions.slightLeft',
    'Chếch phải nhẹ': 'navigation.directions.slightRight',
    'Rẽ gấp trái': 'navigation.directions.sharpLeft',
    'Rẽ gấp phải': 'navigation.directions.sharpRight',
    'Quay đầu': 'navigation.directions.uturn',
    'Đi thẳng': 'navigation.directions.straight',
    'Vào vòng xuyến': 'navigation.directions.roundabout',
    'Nhập làn': 'navigation.directions.merge',
    'Tách làn': 'navigation.directions.fork',
    'Tiếp tục': 'navigation.directions.continue',
  };

  // Try to find and replace Vietnamese instruction with translated one
  for (const [viText, key] of Object.entries(translationMap)) {
    if (instruction.includes(viText)) {
      const translated = t(key);
      return instruction.replace(viText, translated).replace(' vào ', ` ${t('navigation.directions.into')} `);
    }
  }

  return instruction;
};

// Helper: Get toilet type label and color
const getToiletTypeInfo = (type: string) => {
  switch (type) {
    case 'public':
      return { 
        label: 'Công cộng', 
        bgColor: 'bg-blue-100', 
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200'
      };
    case 'commercial':
      return { 
        label: 'Thương mại', 
        bgColor: 'bg-purple-100', 
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200'
      };
    case 'event':
      return { 
        label: 'Lưu động', 
        bgColor: 'bg-orange-100', 
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200'
      };
    default:
      return { 
        label: 'Khác', 
        bgColor: 'bg-gray-100', 
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200'
      };
  }
};

const BottomSheet: React.FC<BottomSheetProps> = ({ 
  toilet, 
  onClose, 
  onDirections, 
  onReport, 
  navigationState,
  onCancelNavigation,
  userId,
  userName,
  userEmail,
  onReviewOpen,
  onReviewClose
}) => {
  const { t } = useTranslation();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  
  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [viewerMounted, setViewerMounted] = useState(false);

  // Swipe gesture state for image viewer
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) navigateImageViewer('next');
    if (isRightSwipe) navigateImageViewer('prev');
  };

  // Handle opening reviews
  const handleOpenReviews = () => {
    setShowReviews(true);
    onReviewOpen?.();
  };

  // Handle closing reviews
  const handleCloseReviews = () => {
    setShowReviews(false);
    onReviewClose?.();
  };

  // Open image viewer
  const openImageViewer = (index: number) => {
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  // Navigate image viewer
  const navigateImageViewer = (direction: 'prev' | 'next') => {
    if (!toilet) return;
    const total = toilet.images.length;
    setImageViewerIndex(prev => 
      direction === 'prev' 
        ? (prev - 1 + total) % total 
        : (prev + 1) % total
    );
  };

  // Keyboard navigation and mount animation for image viewer
  useEffect(() => {
    if (!imageViewerOpen) {
      setViewerMounted(false);
      return;
    }

    const t = setTimeout(() => setViewerMounted(true), 10);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImageViewerOpen(false);
      if (e.key === 'ArrowLeft') navigateImageViewer('prev');
      if (e.key === 'ArrowRight') navigateImageViewer('next');
    };

    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      setViewerMounted(false);
    };
  }, [imageViewerOpen]);
  
  if (!toilet) return null;

  const isNavigating = navigationState?.isActive && navigationState.route;
  const currentStep = isNavigating ? navigationState.route!.steps[navigationState.currentStepIndex] : null;
  const nextStep = isNavigating && navigationState.currentStepIndex < navigationState.route!.steps.length - 1
    ? navigationState.route!.steps[navigationState.currentStepIndex + 1]
    : null;

  // Khi đang dẫn đường và minimize, hiện thanh navigation compact
  const showMinimized = isNavigating && isMinimized;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-status-success';
      case 'danger': return 'text-status-danger';
      case 'maintenance': return 'text-status-warn';
      default: return 'text-status-warn';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return t('toilet.statusActive');
      case 'danger': return t('toilet.statusDanger');
      case 'maintenance': return t('toilet.statusMaintenance');
      default: return t('toilet.statusPending');
    }
  };

  const handleDirectionsClick = () => {
    onDirections();
    // Auto minimize khi bắt đầu dẫn đường
    setTimeout(() => setIsMinimized(true), 500);
  };

  const handleCancelNavigation = () => {
    setIsMinimized(false);
    if (onCancelNavigation) {
      onCancelNavigation();
    }
  };

  // ===== TURN-BY-TURN NAVIGATION UI (Minimized) =====
  if (showMinimized && currentStep) {
    return (
      <div 
        className="fixed bottom-20 left-4 right-4 z-40"
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        {/* Next Turn Alert (if upcoming turn is close) */}
        {nextStep && navigationState.distanceToNextStep < 100 && nextStep.turnType !== 'straight' && (
          <div className="bg-accent text-white rounded-xl p-3 mb-2 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <i className={`${getTurnIcon(nextStep.turnType)} text-xl`}></i>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Sắp rẽ trong {formatDistance(navigationState.distanceToNextStep)}</p>
              <p className="text-xs opacity-90">{nextStep.instruction}</p>
            </div>
          </div>
        )}

        {/* Main Navigation Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Current Step - Large Display */}
          <div className="bg-gradient-to-r from-primary to-primary-light p-4 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <i className={`${getTurnIcon(currentStep.turnType)} text-3xl`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg truncate">{currentStep.instruction}</p>
                <p className="text-sm opacity-90">
                  {currentStep.streetName || 'Tiếp tục đi theo đường'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatDistance(navigationState.distanceToNextStep)}</p>
              </div>
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="p-3 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-gray-600">
                <i className="ri-route-line"></i>
                <span className="text-sm font-medium">{formatDistance(navigationState.remainingDistance)}</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1 text-gray-600">
                <i className="ri-time-line"></i>
                <span className="text-sm font-medium">{formatDuration(navigationState.remainingDuration)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(false)}
                className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center"
              >
                <i className="ri-arrow-up-s-line text-lg text-gray-600"></i>
              </button>
              <button
                onClick={handleCancelNavigation}
                className="w-9 h-9 bg-status-danger/10 rounded-full flex items-center justify-center"
              >
                <i className="ri-close-line text-lg text-status-danger"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] transform transition-all duration-300 ease-out pb-24 pt-2"
         style={{ animation: 'slideUp 0.3s ease-out' }}
    >
      {/* Drag Handle */}
      <div className="w-full flex justify-center py-2 cursor-pointer" onClick={() => isNavigating ? setIsMinimized(true) : onClose()}>
        <div className="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"></div>
      </div>

      {/* Close button khi không có navigation */}
      {!isNavigating && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <i className="ri-close-line text-lg text-gray-600"></i>
        </button>
      )}

      {/* Content */}
      <div className="px-5 mt-2">
        {/* ===== TURN-BY-TURN NAVIGATION FULL VIEW ===== */}
        {isNavigating && currentStep ? (
          <>
            {/* Current Step Header - Compact */}
            <div className="bg-gradient-to-r from-primary to-primary-light rounded-xl p-3 text-white mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className={`${getTurnIcon(currentStep.turnType)} text-2xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate">{translateInstruction(currentStep.instruction, currentStep.turnType, t)}</p>
                  {currentStep.streetName && (
                    <p className="text-xs opacity-90 truncate">{currentStep.streetName}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-3 pt-2 border-t border-white/20">
                <div className="text-center">
                  <p className="text-lg font-bold">{formatDistance(navigationState.distanceToNextStep)}</p>
                  <p className="text-[10px] opacity-75">{t('navigation.toTurn')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{formatDistance(navigationState.remainingDistance)}</p>
                  <p className="text-[10px] opacity-75">{t('navigation.remaining')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{formatDuration(navigationState.remainingDuration)}</p>
                  <p className="text-[10px] opacity-75">{t('navigation.time')}</p>
                </div>
              </div>
            </div>

            {/* Destination - Compact */}
            <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-status-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-flag-2-fill text-status-success text-sm"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-heading text-sm truncate">{toilet.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{toilet.address}</p>
              </div>
            </div>

            {/* Upcoming Steps List - Compact */}
            <div className="mb-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('navigation.upcomingSteps')}</p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {navigationState.route!.steps.slice(navigationState.currentStepIndex + 1, navigationState.currentStepIndex + 3).map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className={`${getTurnIcon(step.turnType)} text-gray-600 text-xs`}></i>
                    </div>
                    <p className="text-xs text-gray-700 flex-1 truncate">{translateInstruction(step.instruction, step.turnType, t)}</p>
                    <span className="text-[10px] text-gray-500">{formatDistance(step.distance)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions - Compact */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setIsMinimized(true)}
                className="bg-primary hover:bg-primary-light text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-primary/30 transition-colors text-sm"
              >
                <i className="ri-map-2-line text-lg"></i>
                {t('nav.map')}
              </button>
              <button 
                onClick={handleCancelNavigation}
                className="bg-white border-2 border-status-danger text-status-danger hover:bg-status-danger/5 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors text-sm"
              >
                <i className="ri-close-line text-lg"></i>
                {t('navigation.cancel')}
              </button>
            </div>
          </>
        ) : (
          /* ===== NORMAL TOILET INFO VIEW ===== */
          <>
            <div className="flex justify-between items-start mb-1">
              <div className="flex-1 pr-8">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold text-heading truncate min-w-0">{toilet.name}</h2>
                  {/* Type Tag */}
                  {toilet.type && (
                    <span className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${getToiletTypeInfo(toilet.type).textColor} ${getToiletTypeInfo(toilet.type).bgColor}`}>
                      <i className="ri-building-4-line"></i> {getToiletTypeInfo(toilet.type).label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <i className="ri-map-pin-line"></i>
                  {toilet.address}
                </p>
              </div>
              <div className="flex flex-col items-end">
                 <span className="bg-primary/10 text-primary font-bold px-2 py-1 rounded-lg text-xs">
                    {toilet.distance ? `${(toilet.distance / 1000).toFixed(1)} km` : '...'}
                 </span>
                 <div className="flex text-yellow-400 text-xs mt-1">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className={i < Math.round(toilet.clean_score) ? "ri-star-fill" : "ri-star-line"}></i>
                    ))}
                 </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-2 mt-1 mb-4 flex-wrap">
              <span className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded border ${getStatusColor(toilet.status)} border-current bg-white`}>
                <i className="ri-checkbox-circle-line"></i> {getStatusText(toilet.status)}
              </span>
              <span className="text-xs font-bold text-body-text flex items-center gap-1 px-2 py-1 rounded bg-bg-main">
                <i className="ri-money-dollar-circle-line"></i> {toilet.price_type === 'free' ? t('toilet.free') : `${toilet.price_amount?.toLocaleString()}đ`}
              </span>
              <span className="text-xs font-bold text-body-text flex items-center gap-1 px-2 py-1 rounded bg-bg-main">
                 {toilet.gender === 'separated' ? <i className="ri-group-line"></i> : <i className="ri-user-3-line"></i>}
                 {toilet.gender === 'separated' ? t('filters.genderSeparated') : t('filters.genderUnisex')}
              </span>
              {toilet.accessibility && (
                <span className="text-xs font-bold text-primary flex items-center gap-1 px-2 py-1 rounded bg-primary/10">
                  <i className="ri-wheelchair-line"></i> NKT
                </span>
              )}
            </div>

            {/* Amenities */}
            {toilet.amenities.length > 0 && (
              <div className="flex gap-3 mb-4 flex-wrap">
                {toilet.amenities.includes('paper') && (
                  <div className="flex flex-col items-center text-gray-500">
                    <i className="ri-file-paper-2-line text-lg"></i>
                    <span className="text-[10px]">{t('filters.paper')}</span>
                  </div>
                )}
                {toilet.amenities.includes('bidet') && (
                  <div className="flex flex-col items-center text-gray-500">
                    <i className="ri-drop-line text-lg"></i>
                    <span className="text-[10px]">{t('filters.bidet')}</span>
                  </div>
                )}
                {toilet.amenities.includes('sink') && (
                  <div className="flex flex-col items-center text-gray-500">
                    <i className="ri-hand-heart-line text-lg"></i>
                    <span className="text-[10px]">{t('filters.sink')}</span>
                  </div>
                )}
                {toilet.amenities.includes('soap') && (
                  <div className="flex flex-col items-center text-gray-500">
                    <i className="ri-hand-sanitizer-line text-lg"></i>
                    <span className="text-[10px]">{t('toilet.soap')}</span>
                  </div>
                )}
                {toilet.amenities.includes('mirror') && (
                  <div className="flex flex-col items-center text-gray-500">
                    <i className="ri-shape-line text-lg"></i>
                    <span className="text-[10px]">{t('toilet.mirror')}</span>
                  </div>
                )}
                {toilet.amenities.includes('dryer') && (
                  <div className="flex flex-col items-center text-gray-500">
                    <i className="ri-windy-line text-lg"></i>
                    <span className="text-[10px]">{t('toilet.dryer')}</span>
                  </div>
                )}
                {toilet.amenities.includes('baby') && (
                  <div className="flex flex-col items-center text-gray-500">
                    <i className="ri-user-heart-line text-lg"></i>
                    <span className="text-[10px]">{t('toilet.baby')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Image Preview */}
            {toilet.images.length > 0 && (
              <div className="mb-4 -mx-5 px-5 overflow-x-auto no-scrollbar">
                <div className="flex gap-2">
                  {toilet.images.map((img, idx) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={`${toilet.name} ${idx + 1}`}
                      className="w-24 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openImageViewer(idx)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button 
                onClick={handleDirectionsClick}
                className="bg-primary hover:bg-primary-light text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-primary/30 transition-colors"
              >
                <i className="ri-direction-line text-xl"></i>
                {t('toilet.directions')}
              </button>
              <button 
                onClick={handleOpenReviews}
                className="bg-white border-2 border-primary text-primary hover:bg-primary/5 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"
              >
                <i className="ri-star-line text-xl"></i>
                {t('toilet.reviews')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Review Section Modal */}
      {showReviews && (
        <ReviewSection
          toiletId={toilet.id}
          toiletName={toilet.name}
          userId={userId || null}
          userName={userName || null}
          userEmail={userEmail || null}
          onClose={handleCloseReviews}
        />
      )}

      {/* Image Viewer Modal - Full screen */}
      {imageViewerOpen && toilet.images.length > 0 && ReactDOM.createPortal(
        <div 
          className={`fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center ${viewerMounted ? 'opacity-100' : 'opacity-0'}`} 
          style={{ height: '100dvh', transition: 'opacity 220ms ease' }} 
          onClick={() => setImageViewerOpen(false)}
        >
          {/* Top overlay header */}
          <div className="absolute top-0 left-0 right-0 z-30 p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-md">
                <i className="ri-image-line text-white text-lg"></i>
              </div>
              <div>
                <div className="text-sm font-semibold">{t('toilet.images')}</div>
                <div className="text-xs opacity-80">{imageViewerIndex + 1} / {toilet.images.length}</div>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setImageViewerOpen(false); }} 
              className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Main image area */}
          <div 
            className="flex-1 flex items-center justify-center z-20 px-4 py-16" 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative flex items-center justify-center">
              <img
                src={toilet.images[imageViewerIndex]}
                alt={`${toilet.name} ${imageViewerIndex + 1}`}
                className="max-w-full max-h-[80dvh] object-contain rounded-2xl shadow-2xl"
                style={{ border: '1px solid rgba(255,255,255,0.04)' }}
              />
              {/* Caption */}
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                <i className="ri-map-pin-line"></i>
                <span>{toilet.name}</span>
              </div>
              <div className="absolute top-4 right-4 text-white/90 text-sm">{imageViewerIndex + 1}/{toilet.images.length}</div>
            </div>
          </div>

          {/* Navigation arrows */}
          {toilet.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImageViewer('prev'); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-30"
              >
                <i className="ri-arrow-left-s-line text-2xl"></i>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImageViewer('next'); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-30"
              >
                <i className="ri-arrow-right-s-line text-2xl"></i>
              </button>
            </>
          )}

          {/* Bottom thumbnails */}
          {toilet.images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-3 px-4">
              <div className="bg-black/40 rounded-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {toilet.images.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setImageViewerIndex(idx); }}
                    className={`w-14 h-14 rounded-md overflow-hidden ${idx === imageViewerIndex ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default BottomSheet;