import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface BlogImageViewerProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const BlogImageViewer: React.FC<BlogImageViewerProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [viewerMounted, setViewerMounted] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) {
      setViewerMounted(false);
      return;
    }

    const t = setTimeout(() => setViewerMounted(true), 10);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') navigateImage('prev');
      if (e.key === 'ArrowRight') navigateImage('next');
    };
    window.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const navigateImage = (direction: 'prev' | 'next') => {
    const total = images.length;
    setCurrentIndex(prev => 
      direction === 'prev' 
        ? (prev - 1 + total) % total 
        : (prev + 1) % total
    );
  };

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
    if (isLeftSwipe) navigateImage('next');
    if (isRightSwipe) navigateImage('prev');
  };

  if (!isOpen || images.length === 0) return null;

  return ReactDOM.createPortal(
    <div 
      className={`fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center ${viewerMounted ? 'opacity-100' : 'opacity-0'}`} 
      style={{ height: '100dvh', transition: 'opacity 220ms ease' }} 
      onClick={onClose}
    >
      {/* Top header */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-md">
            <i className="ri-image-line text-white text-lg"></i>
          </div>
          <div>
            <div className="text-sm font-semibold">Hình ảnh bài viết</div>
            <div className="text-xs opacity-80">{currentIndex + 1} / {images.length}</div>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60"
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
            src={images[currentIndex]}
            alt={`Ảnh ${currentIndex + 1}`}
            className="max-w-full max-h-[80dvh] object-contain rounded-2xl shadow-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.04)' }}
          />
        </div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-30"
          >
            <i className="ri-arrow-left-s-line text-2xl"></i>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-30"
          >
            <i className="ri-arrow-right-s-line text-2xl"></i>
          </button>
        </>
      )}

      {/* Bottom thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-3 px-4">
          <div className="bg-black/40 rounded-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {images.map((url, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-14 h-14 rounded-md overflow-hidden flex-shrink-0 ${idx === currentIndex ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default BlogImageViewer;