import React, { useState } from 'react';
import { ReportType } from '../../../../services/firebase';

interface ReportModalProps {
  toiletName: string;
  onClose: () => void;
  onSubmit: (issueType: ReportType, description: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ toiletName, onClose, onSubmit }) => {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportTypes = [
    { type: 'dirty' as ReportType, label: 'Bẩn', icon: 'ri-bug-line', color: 'text-status-warn' },
    { type: 'broken' as ReportType, label: 'Hỏng thiết bị', icon: 'ri-tools-line', color: 'text-status-warn' },
    { type: 'no_paper' as ReportType, label: 'Hết giấy', icon: 'ri-file-paper-2-line', color: 'text-status-warn' },
    { type: 'camera' as ReportType, label: 'Camera quay lén', icon: 'ri-camera-off-line', color: 'text-status-danger', emergency: true },
    { type: 'harassment' as ReportType, label: 'Có biến thái', icon: 'ri-alarm-warning-line', color: 'text-status-danger', emergency: true }
  ];

  const handleSubmit = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);
    onSubmit(selectedType, description);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8"
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-heading">Báo cáo vấn đề</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Report Types */}
        <div className="space-y-2 mb-6">
          {reportTypes.map((report) => (
            <button
              key={report.type}
              onClick={() => setSelectedType(report.type)}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                selectedType === report.type
                  ? report.emergency 
                    ? 'border-status-danger bg-status-danger/10'
                    : 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <i className={`${report.icon} text-2xl ${report.color}`}></i>
              <span className={`font-medium ${selectedType === report.type ? (report.emergency ? 'text-status-danger' : 'text-primary') : 'text-heading'}`}>
                {report.label}
              </span>
              {report.emergency && (
                <span className="ml-auto text-xs bg-status-danger text-white px-2 py-1 rounded-full">
                  Khẩn cấp
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-heading mb-2">
            Mô tả thêm (tùy chọn)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập chi tiết vấn đề..."
            rows={3}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedType || isSubmitting}
          className="w-full py-4 rounded-xl font-bold bg-status-danger text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i>
              Đang gửi...
            </>
          ) : (
            <>
              <i className="ri-alarm-warning-line text-xl"></i>
              Gửi báo cáo
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportModal;
