import React, { useState, useEffect } from 'react';
import { subscribeToComments, addComment, deleteComment, Comment } from '../services/firebase';
import { User } from 'firebase/auth';
import { isAdmin } from '../constants';

interface CommentModalProps {
  postId: string;
  postTitle: string;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  postId,
  postTitle,
  currentUser,
  isOpen,
  onClose
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !postId) return;

    const unsubscribe = subscribeToComments(postId, (commentsData) => {
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [isOpen, postId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      alert('Vui lòng nhập nội dung comment!');
      return;
    }
    
    if (!currentUser) {
      alert('Vui lòng đăng nhập để comment!');
      return;
    }

    setIsSubmitting(true);
    try {
      const userName = currentUser.displayName || currentUser.email || 'Anonymous';
      const userAvatar = currentUser.photoURL;
      const result = await addComment(postId, currentUser.uid, userName, userAvatar, newComment.trim());
      
      if (result) {
        setNewComment('');
      } else {
        alert('Có lỗi khi gửi comment!');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Có lỗi khi gửi comment!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser || !isAdmin(currentUser.email)) return;
    
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    
    try {
      const result = await deleteComment(commentId, postId);
      if (!result) {
        alert('Có lỗi khi xóa bình luận!');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Có lỗi khi xóa bình luận!');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl h-[85vh] sm:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-heading">Bình luận</h2>
            <p className="text-sm text-body-text/70 mt-1 truncate">{postTitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 flex-shrink-0 ml-2"
          >
            <i className="ri-close-line text-xl text-body-text"></i>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-message-3-line text-2xl text-gray-400"></i>
              </div>
              <p className="text-body-text/70">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
                  {comment.userAvatar ? (
                    <img 
                      src={comment.userAvatar} 
                      alt={comment.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <i className="ri-user-line text-primary"></i>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-xl p-3 group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-heading">{comment.userName}</span>
                        <span className="text-xs text-body-text/50">{formatTime(comment.createdAt)}</span>
                      </div>
                      {/* Delete button for admin */}
                      {currentUser && isAdmin(currentUser.email) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-600"
                          title="Xóa bình luận"
                        >
                          <i className="ri-delete-bin-line text-xs"></i>
                        </button>
                      )}
                    </div>
                    <p className="text-body-text text-sm">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        {currentUser ? (
          <form onSubmit={handleSubmitComment} className="p-4 sm:p-6 border-t border-gray-100">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <i className="ri-user-line text-primary"></i>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-heading text-sm"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-3 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[60px]"
                  >
                    {isSubmitting ? (
                      <i className="ri-loader-4-line animate-spin text-sm"></i>
                    ) : (
                      <i className="ri-send-plane-line text-sm"></i>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-4 sm:p-6 border-t border-gray-100 text-center">
            <p className="text-body-text/70">Vui lòng đăng nhập để bình luận</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentModal;