import React, { useEffect, useRef, useState } from 'react';
import { addPost, subscribeToPosts } from '../../../services/firebase';
import { auth } from '../../../services/firebase';
import ImageCarousel from '../../../components/ImageCarousel';
import BlogImageViewer from '../../../components/BlogImageViewer';
import CommentModal from '../../../components/CommentModal';
import { useTranslation } from 'react-i18next';

const Posts: React.FC = () => {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = subscribeToPosts((data: any[]) => {
      setPosts(data);
    });
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

  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(u => URL.revokeObjectURL(u));
    };
  }, [files]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const arr = Array.from(e.target.files).slice(0, 5);
    setFiles(arr);
  };

  const removePreview = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newFiles = [...files];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setFiles(newFiles);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setFiles([]);
    setPreviewUrls([]);
  };

  const handleAddPost = async () => {
    console.log('[handleAddPost] Starting with:', { title, content, filesCount: files.length });
    
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề!');
      return;
    }
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung!');
      return;
    }

    setAdding(true);
    try {
      const currentUser = auth.currentUser;
      console.log('[handleAddPost] Current user:', currentUser?.uid, currentUser?.email);
      
      if (!currentUser) {
        alert('Bạn cần đăng nhập để thực hiện thao tác này!');
        setAdding(false);
        return;
      }

      const createdBy = currentUser.uid;
      const authorName = currentUser.displayName || currentUser.email || 'Admin';
      const imageFiles = files && files.length > 0 ? files : [];
      
      console.log('[handleAddPost] Calling addPost with:', { title, content, createdBy, authorName, imageCount: imageFiles.length });
      const result = await addPost(title, content, createdBy, authorName, imageFiles);
      
      console.log('[handleAddPost] addPost result:', result);
      if (result) {
        console.log('[handleAddPost] Post created successfully:', result);
        alert('Đăng bài thành công!');
        resetForm();
        setShowAddModal(false);
      } else {
        console.error('[handleAddPost] addPost returned null/false');
        alert('Lỗi khi thêm bài viết - vui lòng kiểm tra console và thử lại!');
      }
    } catch (error) {
      console.error('[handleAddPost] Caught error:', error);
      alert('Có lỗi xảy ra: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bài viết</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="py-2 px-4 rounded-xl bg-primary text-white flex items-center gap-2"
        >
          <i className="ri-add-line"></i>
          Thêm bài viết
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map(p => (
          <div key={p.id} className="glass-admin rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-body-text/70 mb-2">{new Date(p.createdAt).toLocaleString()}</p>
                <h3 className="text-heading font-bold mb-2">{p.title}</h3>
                <p className="text-body-text mb-3">{p.content}</p>

                {p.images && p.images.length > 0 && (
                  <div className="mt-3 flex justify-center">
                    <ImageCarousel 
                      images={p.images}
                      onImageClick={(clickedImage) => handleImageClick(p.images, clickedImage)}
                      className="max-w-md w-full"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm text-body-text flex items-center gap-1">
                    <i className="ri-heart-line text-red-500"></i>
                    {p.likesCount || 0} {t('community.likes')}
                  </span>
                  <button 
                    onClick={() => handleCommentClick(p)}
                    className="text-sm text-body-text flex items-center gap-1 hover:text-blue-500 transition-colors"
                  >
                    <i className="ri-message-3-line text-blue-500"></i>
                    {p.commentsCount || 0} {t('community.comments')}
                  </button>
                  <span className="text-sm text-body-text">
                    {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-heading">Tạo bài viết mới</h2>
                <button 
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <i className="ri-close-line text-xl text-body-text"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Tiêu đề *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Thông báo mới về dịch vụ"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-heading"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-heading mb-2">Ảnh / Media (tối đa 5)</label>
                <div className="flex gap-3 flex-wrap">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative w-28 h-28 group">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                      
                      {/* Close button */}
                      <button
                        onClick={() => removePreview(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-status-danger text-white rounded-full flex items-center justify-center text-xs opacity-100 z-10"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                      
                      {/* Reorder buttons - only show when there are multiple images */}
                      {previewUrls.length > 1 && (
                        <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {idx > 0 && (
                            <button
                              onClick={() => moveImage(idx, idx - 1)}
                              className="w-6 h-6 bg-primary text-white rounded text-xs flex items-center justify-center hover:bg-primary-dark transition-colors"
                              title="Di chuyển trái"
                            >
                              <i className="ri-arrow-left-s-line"></i>
                            </button>
                          )}
                          {idx < previewUrls.length - 1 && (
                            <button
                              onClick={() => moveImage(idx, idx + 1)}
                              className="w-6 h-6 bg-primary text-white rounded text-xs flex items-center justify-center hover:bg-primary-dark transition-colors"
                              title="Di chuyển phải"
                            >
                              <i className="ri-arrow-right-s-line"></i>
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Order indicator */}
                      <div className="absolute top-1 left-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {idx + 1}
                      </div>
                    </div>
                  ))}

                  {previewUrls.length < 5 && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                    >
                      <i className="ri-add-line text-2xl"></i>
                      <span className="text-[10px]">Thêm</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} multiple className="hidden" />
              </div>

              <div>
                <label className="block text-sm font-medium text-heading mb-2">Nội dung</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Viết gì đó..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-heading h-32"
                />
              </div>

            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-body-text font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddPost}
                disabled={adding || !title.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {adding ? (<><i className="ri-loader-4-line animate-spin"></i> Đang đăng...</>) : (<><i className="ri-add-line"></i> Đăng bài</>)}
              </button>
            </div>
          </div>
        </div>
      )}
      
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
          currentUser={auth.currentUser}
          isOpen={commentModalOpen}
          onClose={() => setCommentModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Posts;
