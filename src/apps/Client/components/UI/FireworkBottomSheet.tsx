import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FireworkLocation, NavigationState } from '../../../../types';
import { useTranslation } from 'react-i18next';
import { getFireworkStatus } from '../../../../utils/fireworkUtils';

interface FireworkBottomSheetProps {
  firework: FireworkLocation;
  onClose: () => void;
  onDirections: () => void;
  onCancelNavigation?: () => void;
  navigationState?: NavigationState;
}

const FireworkBottomSheet: React.FC<FireworkBottomSheetProps> = ({ firework, onClose, onDirections, onCancelNavigation, navigationState }) => {
  const { t } = useTranslation();
  const isHigh = firework.type === 'high';
  
  // Calculate status dynamically based on current time
  const dynamicStatus = getFireworkStatus(firework.date, firework.time);

  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [viewerMounted, setViewerMounted] = useState(false);

  // Swipe gesture state
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
    if (distance > minSwipeDistance) navigateImageViewer('next');
    if (distance < -minSwipeDistance) navigateImageViewer('prev');
  };

  const openImageViewer = (index: number) => {
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  const navigateImageViewer = (direction: 'prev' | 'next') => {
    if (!firework.images) return;
    const total = firework.images.length;
    setImageViewerIndex(prev =>
      direction === 'prev' ? (prev - 1 + total) % total : (prev + 1) % total
    );
  };

  useEffect(() => {
    if (!imageViewerOpen) { setViewerMounted(false); return; }
    const timer = setTimeout(() => setViewerMounted(true), 10);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImageViewerOpen(false);
      if (e.key === 'ArrowLeft') navigateImageViewer('prev');
      if (e.key === 'ArrowRight') navigateImageViewer('next');
    };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', onKey); };
  }, [imageViewerOpen]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="bg-white rounded-t-3xl shadow-2xl pb-24">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Gradient header */}
          <div className={`mx-4 rounded-2xl p-4 mb-4 ${
            isHigh 
              ? 'bg-gradient-to-r from-orange-500 to-red-500' 
              : 'bg-gradient-to-r from-yellow-400 to-orange-500'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <i className={`${isHigh ? 'ri-rocket-2-fill' : 'ri-sparkling-fill'} text-white text-lg`}></i>
                  </span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium text-white">
                    {isHigh ? t('festival.highAlt', 'Tầm cao') : t('festival.lowAlt', 'Tầm thấp')}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white leading-tight">{firework.name}</h2>
                <p className="text-white/80 text-sm mt-1">{firework.district}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 shrink-0"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
          </div>

          {/* Info cards */}
          <div className="px-4 space-y-3">
            {/* Time info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <i className="ri-calendar-event-fill text-blue-600"></i>
                  </div>
                  <p className="text-xs text-body-text">{t('festival.date', 'Ngày')}</p>
                  <p className="font-semibold text-heading text-sm">{firework.date}</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <i className="ri-time-fill text-purple-600"></i>
                  </div>
                  <p className="text-xs text-body-text">{t('festival.time', 'Giờ')}</p>
                  <p className="font-semibold text-heading text-sm">{firework.time}</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <i className="ri-timer-fill text-orange-600"></i>
                  </div>
                  <p className="text-xs text-body-text">{t('festival.duration', 'Thời lượng')}</p>
                  <p className="font-semibold text-heading text-sm">{firework.duration} {t('festival.minutes', 'phút')}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            {firework.address && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <i className="ri-map-pin-2-fill text-green-600 text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-body-text">{t('festival.address', 'Địa chỉ')}</p>
                  <p className="text-sm text-heading font-medium">{firework.address}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {firework.description && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <i className="ri-information-fill text-indigo-600 text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-body-text">{t('festival.description', 'Mô tả')}</p>
                  <p className="text-sm text-heading">{firework.description}</p>
                </div>
              </div>
            )}

            {/* Images - horizontal scroll like toilet */}
            {firework.images && firework.images.length > 0 && (
              <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
                <div className="flex gap-2">
                  {firework.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${firework.name} ${idx + 1}`}
                      className="w-24 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openImageViewer(idx)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2">
              {dynamicStatus === 'upcoming' && (
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                  <i className="ri-time-line"></i> {t('festival.upcoming', 'Sắp diễn ra')}
                </span>
              )}
              {dynamicStatus === 'active' && (
                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 animate-pulse">
                  <i className="ri-live-line"></i> {t('festival.active', 'Đang diễn ra')}
                </span>
              )}
              {dynamicStatus === 'ended' && (
                <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium flex items-center gap-1">
                  <i className="ri-check-line"></i> {t('festival.ended', 'Đã kết thúc')}
                </span>
              )}
            </div>

            {/* Directions Button - Goong API */}
            <div className="grid grid-cols-1 gap-3 mt-1">
              {navigationState?.isActive ? (
                <button
                  onClick={onCancelNavigation}
                  className="py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/30"
                >
                  <i className="ri-close-line text-xl"></i>
                  {t('common.cancel', 'Hủy')} {t('festival.directions', 'dẫn đường')}
                </button>
              ) : (
                <button
                  onClick={onDirections}
                  className={`py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg ${
                    isHigh 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/30' 
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/30'
                  }`}
                >
                  <i className="ri-direction-line text-xl"></i>
                  {t('festival.directions', 'Chỉ đường đến đây')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {imageViewerOpen && firework.images && firework.images.length > 0 && ReactDOM.createPortal(
        <div
          className={`fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center ${viewerMounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ height: '100dvh', transition: 'opacity 220ms ease' }}
          onClick={() => setImageViewerOpen(false)}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ${isHigh ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                <i className="ri-image-line text-white text-lg"></i>
              </div>
              <div>
                <div className="text-sm font-semibold">{t('festival.images', 'Hình ảnh')}</div>
                <div className="text-xs opacity-80">{imageViewerIndex + 1} / {firework.images.length}</div>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setImageViewerOpen(false); }}
              className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Main image */}
          <div
            className="flex-1 flex items-center justify-center z-20 px-4 py-16"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative flex items-center justify-center">
              <img
                src={firework.images[imageViewerIndex]}
                alt={`${firework.name} ${imageViewerIndex + 1}`}
                className="max-w-full max-h-[80dvh] object-contain rounded-2xl shadow-2xl"
                style={{ border: '1px solid rgba(255,255,255,0.04)' }}
              />
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                <i className="ri-map-pin-line"></i>
                <span>{firework.name}</span>
              </div>
            </div>
          </div>

          {/* Navigation arrows */}
          {firework.images.length > 1 && (
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
          {firework.images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-3 px-4">
              <div className="bg-black/40 rounded-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {firework.images.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setImageViewerIndex(idx); }}
                    className={`w-14 h-14 rounded-md overflow-hidden ${idx === imageViewerIndex ? 'ring-2 ring-orange-400' : 'opacity-70 hover:opacity-100'}`}
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
    </>
  );
};

export default FireworkBottomSheet;
