import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { fetchPendingToilets, approveToilet, rejectToilet, PendingToiletData } from '../../../services/firebase';

const PendingApproval: React.FC = () => {
  const [pending, setPending] = useState<PendingToiletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PendingToiletData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerUrls, setImageViewerUrls] = useState<string[]>([]);
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
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) navigateImageViewer('next');
    if (isRightSwipe) navigateImageViewer('prev');
  };

  const openImageViewer = (urls: string[], index: number) => {
    setImageViewerUrls(urls);
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  const navigateImageViewer = (direction: 'prev' | 'next') => {
    const total = imageViewerUrls.length;
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
    };
  }, [imageViewerOpen, imageViewerUrls.length]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadPending = async () => {
    setLoading(true);
    const data = await fetchPendingToilets();
    setPending(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    const success = await approveToilet(id);
    if (success) {
      setPending(prev => prev.filter(item => item.id !== id));
      setSelectedItem(null);
      setShowDetail(false);
    }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm('Bạn có chắc muốn từ chối địa điểm này? Dữ liệu sẽ bị xóa vĩnh viễn.')) {
      return;
    }
    setActionLoading(id);
    const success = await rejectToilet(id);
    if (success) {
      setPending(prev => prev.filter(item => item.id !== id));
      setSelectedItem(null);
      setShowDetail(false);
    }
    setActionLoading(null);
  };

  const handleItemClick = (item: PendingToiletData) => {
    setSelectedItem(item);
    if (isMobile) {
      setShowDetail(true);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'paper': return 'ri-file-paper-2-line';
      case 'bidet': return 'ri-drop-line';
      case 'sink': return 'ri-hand-heart-line';
      case 'soap': return 'ri-hand-sanitizer-line';
      case 'mirror': return 'ri-shape-line';
      default: return 'ri-checkbox-circle-line';
    }
  };

  const getAmenityLabel = (amenity: string) => {
    switch (amenity) {
      case 'paper': return 'Giấy';
      case 'bidet': return 'Vòi xịt';
      case 'sink': return 'Bồn rửa tay';
      case 'soap': return 'Xà phòng';
      case 'mirror': return 'Gương';
      default: return amenity;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'public': return 'Công cộng';
      case 'commercial': return 'Thương mại';
      case 'event': return 'Sự kiện';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="ri-loader-4-line animate-spin text-4xl text-primary"></i>
          <p className="mt-2 text-body-text/70">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const DetailModal = () => {
    if (!selectedItem) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:hidden">
        <div className="w-full bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <h2 className="font-bold text-heading">Chi tiết địa điểm</h2>
            <button 
              onClick={() => setShowDetail(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <i className="ri-close-line text-xl text-body-text"></i>
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-heading">{selectedItem.name}</h3>
              <p className="text-sm text-body-text/70 mt-1">{selectedItem.address}</p>
            </div>

            {selectedItem.images.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-heading mb-2">Hình ảnh</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedItem.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt="" 
                      className="w-32 h-24 object-cover rounded-xl flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                      onClick={() => openImageViewer(selectedItem.images, idx)}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedItem.amenities.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-heading mb-2">Tiện nghi</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.amenities.map((amenity) => (
                    <span key={amenity} className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs flex items-center gap-1.5">
                      <i className={getAmenityIcon(amenity)}></i>
                      {getAmenityLabel(amenity)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-primary"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-heading text-sm">{selectedItem.submittedBy.name}</p>
                <p className="text-xs text-body-text/70 truncate">{selectedItem.submittedBy.email || formatDate(selectedItem.submittedAt)}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleReject(selectedItem.id)}
                disabled={actionLoading === selectedItem.id}
                className="flex-1 py-3 bg-status-danger/10 text-status-danger rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading === selectedItem.id ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <><i className="ri-close-line"></i> Từ chối</>
                )}
              </button>
              <button
                onClick={() => handleApprove(selectedItem.id)}
                disabled={actionLoading === selectedItem.id}
                className="flex-1 py-3 bg-status-success text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading === selectedItem.id ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <><i className="ri-check-line"></i> Phê duyệt</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-heading">Địa điểm chờ duyệt</h1>
        <p className="text-body-text/70 mt-1 text-xs sm:text-base">Xem xét và phê duyệt các địa điểm do người dùng đóng góp</p>
      </div>

      <div className="glass-admin rounded-xl px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 w-fit">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-status-warn/20 rounded-xl flex items-center justify-center">
          <i className="ri-time-line text-xl sm:text-2xl text-status-warn"></i>
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold text-heading">{pending.length}</p>
          <p className="text-xs sm:text-sm text-body-text/70">Đang chờ duyệt</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="glass-admin rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-status-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-checkbox-circle-line text-3xl sm:text-4xl text-status-success"></i>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-heading mb-2">Tuyệt vời!</h3>
          <p className="text-body-text/70 text-sm">Không có địa điểm nào đang chờ duyệt.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            {pending.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={'glass-admin rounded-xl sm:rounded-2xl p-4 sm:p-5 cursor-pointer transition-all hover:shadow-xl ' + (
                  selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''
                )}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.images[0] ? (
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="ri-image-line text-xl sm:text-2xl text-gray-400"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-heading text-sm sm:text-base truncate">{item.name}</h3>
                    <p className="text-xs sm:text-sm text-body-text/70 flex items-center gap-1 mt-0.5 sm:mt-1">
                      <i className="ri-map-pin-line flex-shrink-0"></i>
                      <span className="truncate">{item.address}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] sm:text-xs rounded-lg font-medium">
                        {getTypeLabel(item.type)}
                      </span>
                      <span className="text-[10px] sm:text-xs text-body-text/50 hidden sm:inline">{formatDate(item.submittedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-[10px] sm:text-xs text-primary"></i>
                    </div>
                    <span className="text-xs sm:text-sm text-body-text truncate max-w-[100px] sm:max-w-none">{item.submittedBy.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReject(item.id); }}
                      disabled={actionLoading === item.id}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-status-danger/10 text-status-danger rounded-lg text-xs font-medium hover:bg-status-danger/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === item.id ? <i className="ri-loader-4-line animate-spin"></i> : 'Từ chối'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApprove(item.id); }}
                      disabled={actionLoading === item.id}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-status-success text-white rounded-lg text-xs font-medium hover:bg-status-success/90 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === item.id ? <i className="ri-loader-4-line animate-spin"></i> : 'Duyệt'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Detail Panel */}
          <div className="glass-admin rounded-2xl p-6 h-fit sticky top-8 hidden lg:block">
            {selectedItem ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-heading">{selectedItem.name}</h2>
                  <p className="text-body-text/70 mt-1">{selectedItem.address}</p>
                </div>

                {selectedItem.images.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-heading mb-3">Hình ảnh</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedItem.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt="" 
                          className="w-full h-32 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity" 
                          onClick={() => openImageViewer(selectedItem.images, idx)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.amenities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-heading mb-3">Tiện nghi</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.amenities.map((amenity) => (
                        <span key={amenity} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm flex items-center gap-2">
                          <i className={getAmenityIcon(amenity)}></i>
                          {getAmenityLabel(amenity)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-heading mb-3">Vị trí</h3>
                  <div className="bg-gray-100 rounded-xl p-4 text-sm text-body-text">
                    <p>Lat: {selectedItem.location.lat}</p>
                    <p>Lng: {selectedItem.location.lng}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-heading mb-3">Người gửi</h3>
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-primary"></i>
                    </div>
                    <div>
                      <p className="font-medium text-heading">{selectedItem.submittedBy.name}</p>
                      <p className="text-sm text-body-text/70">{selectedItem.submittedBy.email || formatDate(selectedItem.submittedAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/20">
                  <button
                    onClick={() => handleReject(selectedItem.id)}
                    disabled={actionLoading === selectedItem.id}
                    className="flex-1 py-3 bg-status-danger/10 text-status-danger rounded-xl font-medium hover:bg-status-danger/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === selectedItem.id ? (
                      <i className="ri-loader-4-line animate-spin"></i>
                    ) : (
                      <><i className="ri-close-line text-xl"></i> Từ chối</>
                    )}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedItem.id)}
                    disabled={actionLoading === selectedItem.id}
                    className="flex-1 py-3 bg-status-success text-white rounded-xl font-medium hover:bg-status-success/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === selectedItem.id ? (
                      <i className="ri-loader-4-line animate-spin"></i>
                    ) : (
                      <><i className="ri-check-line text-xl"></i> Phê duyệt</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-cursor-line text-2xl text-gray-400"></i>
                </div>
                <p className="text-body-text/70">Chọn một địa điểm để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isMobile && showDetail && <DetailModal />}

      {/* Image Viewer Modal - Full screen */}
      {imageViewerOpen && imageViewerUrls.length > 0 && ReactDOM.createPortal(
        <div 
          className={`fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center ${viewerMounted ? 'opacity-100' : 'opacity-0'}`} 
          style={{ height: '100dvh', transition: 'opacity 220ms ease' }} 
          onClick={() => setImageViewerOpen(false)}
        >
          {/* Top header */}
          <div className="absolute top-0 left-0 right-0 z-30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-md">
                <i className="ri-image-line text-white text-lg"></i>
              </div>
              <div>
                <div className="text-sm font-semibold">Hình ảnh địa điểm</div>
                <div className="text-xs opacity-80">{imageViewerIndex + 1} / {imageViewerUrls.length}</div>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setImageViewerOpen(false); }} 
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
                src={imageViewerUrls[imageViewerIndex]}
                alt=""
                className="max-w-full max-h-[80dvh] object-contain rounded-2xl shadow-2xl"
                style={{ border: '1px solid rgba(255,255,255,0.04)' }}
              />
              <div className="absolute top-4 right-4 text-white/90 text-sm bg-black/40 px-2 py-1 rounded-lg">{imageViewerIndex + 1}/{imageViewerUrls.length}</div>
            </div>
          </div>

          {/* Navigation arrows */}
          {imageViewerUrls.length > 1 && (
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
          {imageViewerUrls.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-3 px-4">
              <div className="bg-black/40 rounded-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {imageViewerUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setImageViewerIndex(idx); }}
                    className={`w-14 h-14 rounded-md overflow-hidden flex-shrink-0 ${idx === imageViewerIndex ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'}`}
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

export default PendingApproval;
