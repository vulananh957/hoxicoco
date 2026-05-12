import React, { useState } from 'react';

interface ImageCarouselProps {
  images: string[];
  onImageClick?: (imageUrl: string) => void;
  className?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images, 
  onImageClick,
  className = ""
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  if (!images || images.length === 0) return null;

  const changeImage = (newIndex: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    setTimeout(() => setIsTransitioning(false), 50); // Rất ngắn chỉ để tránh double trigger
  };

  const nextImage = () => {
    const newIndex = (currentIndex + 1) % images.length;
    changeImage(newIndex);
  };

  const prevImage = () => {
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    changeImage(newIndex);
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    changeImage(index);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 30; // Giảm từ 50 xuống 30
    const isRightSwipe = distance < -30; // Giảm từ -50 lên -30

    if (isLeftSwipe && images.length > 1) {
      nextImage();
    }
    if (isRightSwipe && images.length > 1) {
      prevImage();
    }
  };

  return (
    <div className={`relative mx-auto ${className}`}>
      {/* Main image container */}
      <div 
        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mx-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={images[currentIndex]} 
          alt={`Image ${currentIndex + 1}`}
          className="w-full h-full object-cover cursor-pointer select-none"
          onClick={() => onImageClick?.(images[currentIndex])}
          draggable={false}
        />
        
        {/* Navigation arrows - only show if more than 1 image */}
        {images.length > 1 && (
          <>
            {/* Previous button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
            >
              <i className="ri-arrow-left-s-line text-lg"></i>
            </button>
            
            {/* Next button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
            >
              <i className="ri-arrow-right-s-line text-lg"></i>
            </button>
            
            {/* Image counter */}
            <div className="absolute top-3 right-3 bg-black/60 text-white text-sm px-2 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Dots indicator - only show if more than 1 image */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-3 mx-auto">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-primary w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Touch/swipe support for mobile */}
      <style>{`
        .relative {
          touch-action: pan-x;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

export default ImageCarousel;