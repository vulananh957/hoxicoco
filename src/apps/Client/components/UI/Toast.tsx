import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-status-success text-white';
      case 'error':
        return 'bg-status-danger text-white';
      case 'info':
        return 'bg-primary text-white';
      default:
        return 'bg-gray-800 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'ri-checkbox-circle-fill';
      case 'error':
        return 'ri-error-warning-fill';
      case 'info':
        return 'ri-information-fill';
      default:
        return 'ri-notification-fill';
    }
  };

  return (
    <div 
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      style={{ animation: 'slideDown 0.3s ease-out' }}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${getStyles()}`}>
        <i className={`text-xl ${getIcon()}`}></i>
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast;
