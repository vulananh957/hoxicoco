import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Review } from '../../../../types';
import { fetchReviews, addReview, addReport, ReportType } from '../../../../services/firebase';

// File size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB per image
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB per video
const MAX_TOTAL_FILES = 3; // Maximum 3 files

interface ReviewSectionProps {
  toiletId: string;
  toiletName: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  onClose: () => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  toiletId,
  toiletName,
  userId,
  userName,
  userEmail,
  onClose
}) => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'add' | 'report'>('reviews');
  
  // Form state for adding review
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Report form state
  const [reportType, setReportType] = useState<ReportType>('dirty');
  const [reportDescription, setReportDescription] = useState('');
  const [customReportType, setCustomReportType] = useState('');

  // Media viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerMedia, setViewerMedia] = useState<{ urls: string[]; currentIndex: number }>({ urls: [], currentIndex: 0 });

  // Open media viewer
  const openMediaViewer = (urls: string[], startIndex: number) => {
    setViewerMedia({ urls, currentIndex: startIndex });
    setViewerOpen(true);
  };

  // mounted state for animation
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
    if (isLeftSwipe) navigateViewer('next');
    if (isRightSwipe) navigateViewer('prev');
  };

  // Navigate media viewer
  const navigateViewer = (direction: 'prev' | 'next') => {
    setViewerMedia(prev => {
      const newIndex = direction === 'prev' 
        ? (prev.currentIndex - 1 + prev.urls.length) % prev.urls.length
        : (prev.currentIndex + 1) % prev.urls.length;
      return { ...prev, currentIndex: newIndex };
    });
  };

  // Keyboard navigation and mount animation
  useEffect(() => {
    if (!viewerOpen) {
      setViewerMounted(false);
      return;
    }

    // small delay to trigger CSS transition
    const t = setTimeout(() => setViewerMounted(true), 10);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerOpen(false);
      if (e.key === 'ArrowLeft') navigateViewer('prev');
      if (e.key === 'ArrowRight') navigateViewer('next');
    };

    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      setViewerMounted(false);
    };
  }, [viewerOpen]);

  // Check if URL is video
  const isVideoUrl = (url: string) => {
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('video');
  };

  useEffect(() => {
    loadReviews();
  }, [toiletId]);

  const loadReviews = async () => {
    setIsLoading(true);
    const data = await fetchReviews(toiletId);
    setReviews(data);
    setIsLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!userId || !userName) {
      alert(t('review.loginRequired'));
      return;
    }
    
    if (!comment.trim()) {
      alert(t('review.enterComment'));
      return;
    }

    setIsSubmitting(true);
    const success = await addReview(toiletId, userId, userName, rating, comment.trim(), mediaFiles.length > 0 ? mediaFiles : undefined);
    setIsSubmitting(false);

    if (success) {
      setComment('');
      setRating(5);
      setMediaFiles([]);
      setMediaPreviews([]);
      setActiveTab('reviews');
      loadReviews();
    } else {
      alert(t('common.error'));
    }
  };

  const handleSubmitReport = async () => {
    if (!userId) {
      alert(t('report.loginRequired'));
      return;
    }

    // Validate custom report type
    if (reportType === 'other' && !customReportType.trim()) {
      alert(t('report.describeIssue'));
      return;
    }

    setIsSubmitting(true);
    const description = reportType === 'other' 
      ? `[${t('report.otherIssue')}: ${customReportType.trim()}] ${reportDescription.trim()}`
      : reportDescription.trim();
    
    const success = await addReport(
      toiletId, 
      userId, 
      userName || t('common.user'), 
      userEmail || '', 
      reportType, 
      description
    );
    setIsSubmitting(false);

    if (success) {
      alert(t('report.success'));
      setReportDescription('');
      setCustomReportType('');
      onClose();
    } else {
      alert(t('common.error'));
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const reportTypes: { value: ReportType; label: string; icon: string; isUrgent?: boolean }[] = [
    { value: 'dirty', label: t('report.types.dirty'), icon: 'ri-delete-bin-line' },
    { value: 'broken', label: t('report.types.broken'), icon: 'ri-tools-line' },
    { value: 'no_paper', label: t('report.types.noPaper'), icon: 'ri-file-paper-2-line' },
    { value: 'camera', label: t('report.types.camera'), icon: 'ri-camera-off-line', isUrgent: true },
    { value: 'harassment', label: t('report.types.harassment'), icon: 'ri-alarm-warning-line', isUrgent: true },
    { value: 'other', label: t('report.types.other'), icon: 'ri-more-line' }
  ];

  // Handle media file selection
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check total files limit
    if (mediaFiles.length + files.length > MAX_TOTAL_FILES) {
      alert(t('review.maxFiles', { count: MAX_TOTAL_FILES }));
      return;
    }

    const validFiles: File[] = [];
    const previews: { url: string; type: 'image' | 'video' }[] = [...mediaPreviews];

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        alert(`${file.name}: ${t('review.onlyImageVideo')}`);
        continue;
      }

      // Check file size
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        alert(`${file.name}: ${t('review.imageTooLarge')}`);
        continue;
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        alert(`${file.name}: ${t('review.videoTooLarge')}`);
        continue;
      }

      validFiles.push(file);
      previews.push({
        url: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video'
      });
    }

    setMediaFiles([...mediaFiles, ...validFiles]);
    setMediaPreviews(previews);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove media file
  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index].url);
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      ></div>

      {/* Bottom Sheet Modal */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white shadow-2xl max-h-[75vh] overflow-hidden flex flex-col"
        style={{ animation: 'slideUp 0.3s ease-out' }}>
      
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <i className="ri-close-line text-xl text-gray-700"></i>
            </button>
            <div>
              <h2 className="font-bold text-heading text-lg">{t('toilet.reviews')}</h2>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{toiletName}</p>
            </div>
          </div>
          
          {/* Rating summary */}
          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full">
            <i className="ri-star-fill text-yellow-400"></i>
            <span className="font-bold text-heading">{avgRating}</span>
            <span className="text-xs text-gray-500">({reviews.length})</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-[68px] bg-white border-b border-gray-100 flex z-10">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500'
            }`}
          >
            <i className="ri-chat-3-line mr-1"></i>
            {t('review.comments')} ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'add'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500'
            }`}
          >
            <i className="ri-add-line mr-1"></i>
            {t('toilet.writeReview')}
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'report'
                ? 'text-status-danger border-b-2 border-status-danger'
                : 'text-gray-500'
            }`}
          >
            <i className="ri-alarm-warning-line mr-1"></i>
            {t('report.badReport')}
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <i className="ri-loader-4-line text-4xl text-primary animate-spin mb-3"></i>
                  <p className="text-gray-500">{t('common.loading')}</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i className="ri-chat-3-line text-4xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500 text-center">{t('toilet.noReviews')}</p>
                  <p className="text-sm text-gray-400 text-center mt-1">{t('toilet.beFirst')}</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-medium"
                  >
                    {t('toilet.writeReview')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">
                              {review.user_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-heading text-sm">{review.user_name}</p>
                            <p className="text-xs text-gray-400">{formatDate(review.timestamp)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <i 
                              key={i} 
                              className={`text-sm ${i < review.rating ? 'ri-star-fill text-yellow-400' : 'ri-star-line text-gray-300'}`}
                            ></i>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                      
                      {/* Review Media */}
                      {review.media && review.media.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                          {review.media.map((url, idx) => {
                            const isVideo = isVideoUrl(url);
                            return (
                              <div 
                                key={idx}
                                className="relative w-20 h-20 flex-shrink-0 cursor-pointer group"
                                onClick={() => openMediaViewer(review.media!, idx)}
                              >
                                {isVideo ? (
                                  <>
                                    <video
                                      src={url}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                    <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center group-hover:bg-black/50 transition-colors">
                                      <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                                        <i className="ri-play-fill text-gray-800 text-lg"></i>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <img
                                    src={url}
                                    alt=""
                                    className="w-full h-full object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                                  />
                                )}
                                {review.media!.length > 1 && idx === 0 && (
                                  <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                    +{review.media!.length}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Review Tab */}
          {activeTab === 'add' && (
            <div className="p-4">
              {!userId ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i className="ri-user-line text-4xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500 text-center">{t('review.loginToReview')}</p>
                  <p className="text-sm text-gray-400 text-center mt-1">
                    {t('review.clickAvatar')}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Rating selector */}
                  <div>
                    <label className="block text-sm font-medium text-heading mb-3">
                      {t('review.yourRating')}
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="p-1"
                        >
                          <i className={`text-4xl transition-colors ${
                          star <= rating 
                            ? 'ri-star-fill text-yellow-400' 
                            : 'ri-star-line text-gray-300 hover:text-yellow-200'
                        }`}></i>
                      </button>
                    ))}
                  </div>
                  <p className="text-center mt-2 text-sm text-gray-500">
                    {rating === 1 && t('review.rating1')}
                    {rating === 2 && t('review.rating2')}
                    {rating === 3 && t('review.rating3')}
                    {rating === 4 && t('review.rating4')}
                    {rating === 5 && t('review.rating5')}
                  </p>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">
                    {t('review.yourComment')}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('review.sharePlaceholder')}
                    className="w-full h-32 p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">
                    {t('review.mediaOptional')}
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    <i className="ri-information-line mr-1"></i>
                    {t('review.mediaLimit')}
                  </p>
                  
                  {/* Preview */}
                  <div className="flex gap-2 flex-wrap mb-3">
                    {mediaPreviews.map((preview, idx) => (
                      <div key={idx} className="relative w-20 h-20">
                        {preview.type === 'video' ? (
                          <video
                            src={preview.url}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <img
                            src={preview.url}
                            alt=""
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                        <div className="absolute top-1 left-1 bg-black/50 text-white text-[8px] px-1 rounded">
                          {formatFileSize(mediaFiles[idx]?.size || 0)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedia(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-status-danger text-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <i className="ri-close-line text-sm"></i>
                        </button>
                        {preview.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                              <i className="ri-play-fill text-white"></i>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Add button */}
                    {mediaFiles.length < MAX_TOTAL_FILES && (
                      <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <i className="ri-camera-line text-xl text-gray-400"></i>
                        <span className="text-[10px] text-gray-400 mt-1">{t('review.add')}</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={handleMediaSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || !comment.trim()}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      {t('review.sending')}
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line"></i>
                      {t('review.submitReview')}
                    </>
                  )}
                </button>
              </div>
            )}
            </div>
          )}

          {/* Report Tab */}
          {activeTab === 'report' && (
            <div className="p-4">
              {!userId ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i className="ri-user-line text-4xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500 text-center">{t('report.loginToReport')}</p>
                  <p className="text-sm text-gray-400 text-center mt-1">
                    {t('review.clickAvatar')}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-3">
                    <i className="ri-information-line text-yellow-600 text-xl flex-shrink-0 mt-0.5"></i>
                    <p className="text-sm text-yellow-800">
                      {t('report.warning')}
                    </p>
                  </div>

                  {/* Report type */}
                  <div>
                    <label className="block text-sm font-medium text-heading mb-3">
                      {t('report.issueType')}
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {reportTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setReportType(type.value)}
                          className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-colors text-left ${
                            reportType === type.value
                              ? type.isUrgent 
                                ? 'border-status-danger bg-status-danger/10'
                                : 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <i className={`${type.icon} text-xl ${
                            reportType === type.value
                              ? type.isUrgent ? 'text-status-danger' : 'text-primary'
                              : 'text-gray-500'
                          }`}></i>
                          <span className={`font-medium ${
                            type.isUrgent ? 'text-status-danger' : 'text-heading'
                          }`}>
                            {type.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom report type input */}
                  {reportType === 'other' && (
                    <div>
                      <label className="block text-sm font-medium text-heading mb-2">
                        {t('report.describeIssueLabel')} <span className="text-status-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={customReportType}
                        onChange={(e) => setCustomReportType(e.target.value)}
                        placeholder={t('report.describePlaceholder')}
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">
                      {t('report.detailOptional')}
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder={t('report.detailPlaceholder')}
                      className="w-full h-24 p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    onClick={handleSubmitReport}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-status-danger text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        {t('review.sending')}
                      </>
                    ) : (
                      <>
                        <i className="ri-alarm-warning-line"></i>
                        {t('report.submitReport')}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Media Viewer Modal - Full screen messenger style */}
        {viewerOpen && viewerMedia.urls.length > 0 && ReactDOM.createPortal(
          <div className={`fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center ${viewerMounted ? 'opacity-100' : 'opacity-0'}`} style={{ height: '100dvh', transition: 'opacity 220ms ease' }} onClick={() => setViewerOpen(false)}>
            {/* Top overlay header (minimal) */}
            <div className="absolute top-0 left-0 right-0 z-30 p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-md">
                  <i className="ri-image-line text-white text-lg"></i>
                </div>
                <div>
                  <div className="text-sm font-semibold">{t('review.reviewImages')}</div>
                  <div className="text-xs opacity-80">{viewerMedia.currentIndex + 1} / {viewerMedia.urls.length}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setViewerOpen(false); }} className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white">
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            {/* Main media area - occupy remaining space */}
            <div 
              className="flex-1 flex items-center justify-center z-20 px-4 py-16" 
              onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative flex items-center justify-center">
              {isVideoUrl(viewerMedia.urls[viewerMedia.currentIndex]) ? (
                <video
                  src={viewerMedia.urls[viewerMedia.currentIndex]}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80dvh] object-contain rounded-2xl shadow-2xl"
                  style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                />
              ) : (
                <img
                  src={viewerMedia.urls[viewerMedia.currentIndex]}
                  alt=""
                  className="max-w-full max-h-[80dvh] object-contain rounded-2xl shadow-2xl"
                  style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                />
              )}

              {/* caption / badge */}
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                <i className="ri-image-line"></i>
                <span>{toiletName}</span>
              </div>
              <div className="absolute top-4 right-4 text-white/90 text-sm">{viewerMedia.currentIndex + 1}/{viewerMedia.urls.length}</div>
            </div>
          </div>

            {/* Navigation arrows */}
            {viewerMedia.urls.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateViewer('prev'); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-30"
                >
                  <i className="ri-arrow-left-s-line text-2xl"></i>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateViewer('next'); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-30"
                >
                  <i className="ri-arrow-right-s-line text-2xl"></i>
                </button>
              </>
            )}

          {/* Bottom thumbnails (only shown when multiple) */}
          {viewerMedia.urls.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-3 px-4">
              <div className="bg-black/40 rounded-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {viewerMedia.urls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setViewerMedia(prev => ({ ...prev, currentIndex: idx })); }}
                    className={`w-14 h-14 rounded-md overflow-hidden ${idx === viewerMedia.currentIndex ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'}`}
                  >
                    {isVideoUrl(url) ? (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white">
                        <i className="ri-play-fill text-lg"></i>
                      </div>
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
      </div>
    </>
  );
};

export default ReviewSection;
