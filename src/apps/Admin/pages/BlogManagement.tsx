import React, { useEffect, useState } from 'react';
import * as FB from '../../../services/firebase';
import { auth } from '../../../services/firebase';

const BlogManagement: React.FC = () => {
  const [posts, setPosts] = useState<FB.Post[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const unsubscribe = FB.subscribeToPosts((data: FB.Post[]) => setPosts(data));
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Xác nhận xóa bài viết "${title}"?`)) return;
    const success = await FB.deletePost(id);
    if (!success) {
      alert('Xóa bài viết thất bại!');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Quản lý Bài viết</h1>
          <p className="text-body-text mt-1">Tạo và quản lý các bài viết cho cộng đồng</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-light transition-colors shadow-lg shadow-primary/30"
        >
          <i className="ri-add-line text-lg"></i>
          Tạo bài viết mới
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <i className="ri-article-line text-primary text-xl"></i>
          </div>
          <div>
            <p className="text-2xl font-bold text-heading">{posts.length}</p>
            <p className="text-sm text-body-text">Tổng bài viết</p>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-heading">Danh sách bài viết</h2>
        </div>
        
        {posts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-article-line text-gray-400 text-2xl"></i>
            </div>
            <p className="text-body-text mb-2">Chưa có bài viết nào</p>
            <p className="text-sm text-gray-500">Bấm "Tạo bài viết mới" để bắt đầu</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-heading mb-2 truncate">
                      {post.title}
                    </h3>
                    <div 
                      className="text-sm text-body-text mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{ 
                        __html: post.content.length > 200 
                          ? post.content.substring(0, 200) + '...' 
                          : post.content 
                      }} 
                    />
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <i className="ri-user-line"></i>
                        {post.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="ri-time-line"></i>
                        {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="ri-heart-line"></i>
                        {post.likesCount || 0} lượt thích
                      </span>
                    </div>
                  </div>
                  
                  {post.image && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      className="px-3 py-1.5 text-xs font-medium text-status-danger bg-status-danger/10 rounded-lg hover:bg-status-danger/20 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

// Create Post Modal Component
interface CreatePostModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 files
    const selectedFiles = files.slice(0, 5);
    setMediaFiles(selectedFiles);

    // Create previews
    const previews: string[] = [];
    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push(reader.result as string);
        if (previews.length === selectedFiles.length) {
          setMediaPreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung!');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert('Không tìm thấy thông tin admin!');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get all image files as array to match new addPost signature  
      const imageFiles = mediaFiles.filter(file => file.type.startsWith('image/'));
      
      const postId = await FB.addPost(
        title.trim(),
        content.trim(),
        user.uid,
        user.displayName || user.email || 'Admin',
        imageFiles
      );
      
      if (postId) {
        onSuccess();
      } else {
        alert('Tạo bài viết thất bại!');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-heading">Tạo bài viết mới</h2>
            <p className="text-sm text-body-text mt-1">Chia sẻ thông tin hữu ích với cộng đồng</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[calc(90vh-88px)]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-heading mb-2">
                Tiêu đề <span className="text-status-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-heading mb-2">
                Nội dung <span className="text-status-danger">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Viết nội dung bài viết... (Hỗ trợ HTML cơ bản)"
                rows={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm resize-none"
                required
              />
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-heading mb-2">
                Hình ảnh/Media
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="media-upload"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleMediaSelect}
                  className="hidden"
                />
                <label
                  htmlFor="media-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <i className="ri-upload-2-line text-primary text-xl"></i>
                  </div>
                  <p className="text-sm font-medium text-heading mb-1">Tải lên tệp media</p>
                  <p className="text-xs text-gray-500">Hình ảnh, video, tài liệu (tối đa 5 tệp)</p>
                </label>
              </div>

              {/* Media Previews */}
              {mediaPreviews.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-heading">Tệp đã chọn:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {mediaPreviews.map((preview, index) => {
                      const file = mediaFiles[index];
                      const isImage = file?.type.startsWith('image/');
                      const isVideo = file?.type.startsWith('video/');
                      
                      return (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            {isImage ? (
                              <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            ) : isVideo ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="ri-video-line text-2xl text-gray-400"></i>
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="ri-file-line text-2xl text-gray-400"></i>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-status-danger text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                          <p className="text-xs text-gray-500 mt-1 truncate">{file?.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-light transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <i className="ri-loader-4-line animate-spin"></i>}
              {isSubmitting ? 'Đang tạo...' : 'Tạo bài viết'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogManagement;
