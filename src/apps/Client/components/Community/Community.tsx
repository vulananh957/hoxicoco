import React, { useEffect, useState } from 'react';
import { 
  db, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  onAuthChange,
  toggleLikePost
} from '../../../../services/firebase';
import { User } from 'firebase/auth';
import { isAdmin } from '../../../../constants';
import ImageCarousel from '../../../../components/ImageCarousel';
import BlogImageViewer from '../../../../components/BlogImageViewer';
import CommentModal from '../../../../components/CommentModal';
import { useTranslation } from 'react-i18next';

const Community: React.FC = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      const liked = new Set<string>();
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const post = {
          id: docSnap.id,
          title: data.title || '',
          content: data.content || '',
          image: data.image || '',
          images: Array.isArray(data.images) && data.images.length > 0 ? data.images : (data.image ? [data.image] : []),
          authorName: data.authorName || data.created_by || '',
          createdAt: data.created_at ? (data.created_at as Timestamp).toMillis() : Date.now(),
          likesCount: Array.isArray(data.likes) ? data.likes.length : 0,
          commentsCount: data.commentsCount || 0,
          likes: data.likes || []
        };
        console.log('[Debug] Post data:', { 
          id: docSnap.id, 
          rawImages: data.images, 
          rawImage: data.image, 
          finalImages: post.images,
          imagesLength: post.images?.length 
        });
        items.push(post);
        
        // Check if current user liked this post
        if (currentUser && Array.isArray(data.likes) && data.likes.includes(currentUser.uid)) {
          liked.add(docSnap.id);
        }
      });
      
      setPosts(items);
      setLikedPosts(liked);

      // Xử lý deep linking - scroll đến bài viết cụ thể
      const urlParams = new URLSearchParams(window.location.search);
      const postId = urlParams.get('post');
      if (postId) {
        setTimeout(() => {
          const postElement = document.getElementById(`post-${postId}`);
          if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            postElement.style.border = '2px solid #3b82f6';
            postElement.style.borderRadius = '12px';
            setTimeout(() => {
              postElement.style.border = '';
              postElement.style.borderRadius = '';
            }, 3000);
          }
        }, 500);
      }
    }, (err) => {
      console.error('Posts subscription error:', err);
    });

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    const unsub = onAuthChange((u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  const handleImageClick = (images: string[], clickedImage: string) => {
    const initialIndex = images.findIndex(img => img === clickedImage);
    setViewerImages(images);
    setViewerInitialIndex(Math.max(0, initialIndex));
    setImageViewerOpen(true);
  };

  const handleCommentClick = (post: any) => {
    setSelectedPost(post);
    setCommentModalOpen(true);
  };

  const handleToggleLike = async (postId: string) => {
    if (!currentUser) return alert('Vui lòng đăng nhập để tương tác');
    
    // Prevent double-click
    if (document.querySelector(`[data-post-id="${postId}"] button`)?.getAttribute('disabled')) return;
    
    try {
      // Temporarily disable button
      const button = document.querySelector(`[data-post-id="${postId}"] button`);
      if (button) button.setAttribute('disabled', 'true');
      
      console.log('[Like] Toggling like for post:', postId, 'User:', currentUser.uid);
      const result = await toggleLikePost(postId, currentUser.uid);
      console.log('[Like] Toggle result:', result);
      
      // Update local state immediately for better UX
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (result) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        console.log('[Like] Updated liked posts:', newSet);
        return newSet;
      });
      
      // Re-enable button after a short delay
      setTimeout(() => {
        if (button) button.removeAttribute('disabled');
      }, 1000);
      
    } catch (error) {
      console.error('Like error:', error);
      // Re-enable button on error
      const button = document.querySelector(`[data-post-id="${postId}"] button`);
      if (button) button.removeAttribute('disabled');
    }
  };

  const handleShare = async (post: any) => {
    // Tạo link đến bài viết cụ thể
    const postUrl = `${window.location.origin}?post=${post.id}`;
    
    const shareData = {
      title: `${post.title} - Hoxicoco`,
      text: `Xem bài viết: ${post.title}`,
      url: postUrl
    };

    try {
      if (navigator.share) {
        // Native share API (mobile)
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(postUrl);
        // Hiển thị toast thông báo
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = 'Đã copy link bài viết!';
        document.body.appendChild(toast);
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 2000);
      }
    } catch (error) {
      console.log('Share cancelled or failed:', error);
    }
  };

  return (
    <div className="px-4">
      <div className="max-w-3xl mx-auto py-6">{posts.length === 0 && (
          <div className="py-24">
            <div className="glass-admin rounded-2xl p-8 max-w-xl mx-auto text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-newspaper-line text-primary text-4xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-heading mb-2">Bảng tin</h2>
              <p className="text-body-text mb-6">Hiện chưa có bài viết nào — hãy quay lại sau hoặc theo dõi để nhận cập nhật từ Hoxicoco.</p>
              <div className="flex items-center justify-center gap-3">
                {currentUser && isAdmin(currentUser.email) ? (
                  <button
                    onClick={() => window.location.assign('/admin/posts')}
                    className="px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-light transition-colors flex items-center gap-2"
                  >
                    <i className="ri-add-line"></i>
                    Tạo bài viết
                  </button>
                ) : (
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="px-5 py-3 rounded-xl border-2 border-gray-200 text-body-text font-medium hover:bg-gray-50 transition-colors"
                  >
                    Xem bản đồ
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {posts.map(p => {
            const liked = likedPosts.has(p.id);
            return (
              <div key={p.id} id={`post-${p.id}`} className="glass-admin rounded-2xl p-4" data-post-id={p.id}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-body-text/70">{new Date(p.createdAt).toLocaleString()}</p>
                        {/* Hide author name since it's always admin posting */}
                      </div>
                    </div>

                    {p.title && <h3 className="text-lg font-bold text-heading mb-2">{p.title}</h3>}
                    <p className="text-body-text mb-3">{p.content}</p>

                    {/* Display images - Instagram style carousel */}
                    {p.images && p.images.length > 0 && (
                      <div className="mt-3 mb-4 flex justify-center">
                        <ImageCarousel 
                          images={p.images}
                          onImageClick={(clickedImage) => handleImageClick(p.images, clickedImage)}
                          className="max-w-md w-full"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <button 
                        onClick={() => handleToggleLike(p.id)} 
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                          liked 
                            ? 'bg-rose-50' 
                            : ''
                        }`}
                      >
                        <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-lg transition-all duration-200`} style={{ color: liked ? '#e11d48' : '#f43f5e' }}></i>
                        <span className="font-medium" style={{ color: liked ? '#e11d48' : '#f43f5e' }}>{p.likesCount || 0}</span>
                        <span className="text-sm" style={{ color: liked ? '#e11d48' : '#f43f5e' }}>{t('community.like')}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleCommentClick(p)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      >
                        <i className="ri-message-3-line text-lg" style={{ color: '#3b82f6' }}></i>
                        <span className="font-medium" style={{ color: '#3b82f6' }}>{p.commentsCount || 0}</span>
                        <span className="text-sm" style={{ color: '#3b82f6' }}>{t('community.comment')}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleShare(p)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      >
                        <i className="ri-share-line text-lg" style={{ color: '#10b981' }}></i>
                        <span className="text-sm" style={{ color: '#10b981' }}>{t('community.share')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Blog Image Viewer */}
      <BlogImageViewer
        images={viewerImages}
        initialIndex={viewerInitialIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
      />
      
      {/* Comment Modal */}
      {selectedPost && (
        <CommentModal
          postId={selectedPost.id}
          postTitle={selectedPost.title}
          currentUser={currentUser}
          isOpen={commentModalOpen}
          onClose={() => setCommentModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Community;
