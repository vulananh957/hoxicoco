import React, { useState, useRef } from 'react';
import { parseCSV, downloadCSVTemplate } from '../../../utils/csvUtils';
import { addMultipleToiletsAdmin, NewToiletData, BulkImportResult } from '../../../services/firebase';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: BulkImportResult) => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'result';

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<any>(null);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewData, setPreviewData] = useState<NewToiletData[]>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Vui lòng chọn file CSV');
      return;
    }

    setCsvFile(file);

    // Parse file
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const result = parseCSV(csv);
      setParseResult(result);

      if (result.success && result.data) {
        setPreviewData(result.data);
        setStep('preview');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!previewData.length) return;

    setStep('importing');

    const result = await addMultipleToiletsAdmin(previewData);
    setImportResult(result);
    setStep('result');
  };

  const handleReset = () => {
    setCsvFile(null);
    setParseResult(null);
    setImportResult(null);
    setPreviewData([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSuccess = () => {
    if (importResult) {
      onSuccess(importResult);
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 flex items-center justify-between text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="ri-upload-cloud-2-line text-2xl"></i>
            Nhập hàng loạt nhà vệ sinh
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-primary p-4 rounded">
                <p className="text-sm text-gray-700">
                  <i className="ri-information-line text-primary mr-2"></i>
                  Tải lên file CSV để nhập nhiều nhà vệ sinh cùng một lúc. Tối đa hỗ trợ hàng ngàn bản ghi.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                <i className="ri-file-csv-line text-4xl text-gray-400 mb-3 inline-block"></i>
                <p className="text-lg font-medium text-gray-700">Nhấp để chọn file CSV</p>
                <p className="text-sm text-gray-500 mt-2">hoặc kéo và thả file vào đây</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {csvFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <i className="ri-check-circle-line text-green-600 text-xl"></i>
                  <span className="text-green-800 font-medium">{csvFile.name}</span>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  <i className="ri-book-line"></i>
                  Hướng dẫn định dạng file CSV
                </h4>
                
                {/* Required Fields */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Cột bắt buộc</p>
                  <div className="space-y-1.5 text-xs text-gray-700 ml-3">
                    <div>
                      <span className="font-medium text-gray-800">name</span>
                      <p className="text-gray-600">Tên nhà vệ sinh. VD: WC Công viên Thống Nhất</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">coordinates</span>
                      <p className="text-gray-600">Tọa độ (vĩ độ, kinh độ). VD: 21.031780309611218, 105.85214015945157</p>
                    </div>
                  </div>
                </div>

                {/* Optional Fields */}
                <div className="space-y-2 pt-2 border-t border-gray-300">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Cột tùy chọn</p>
                  <div className="space-y-1.5 text-xs text-gray-700 ml-3">
                    <div>
                      <span className="font-medium text-gray-800">address</span>
                      <p className="text-gray-600">Địa chỉ. VD: 254 Lê Duẩn, Đống Đa</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">type</span>
                      <p className="text-gray-600">Loại: public, commercial, event (mặc định: public)</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">gender</span>
                      <p className="text-gray-600">Phân loại: unisex, separated (mặc định: unisex)</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">price_type</span>
                      <p className="text-gray-600">Phí: free, paid (mặc định: free)</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">price_amount</span>
                      <p className="text-gray-600">Giá tiền (VNĐ). VD: 5000</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">accessibility</span>
                      <p className="text-gray-600">Hỗ trợ khuyết tật: true/false hoặc 1/0</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">amenities</span>
                      <p className="text-gray-600">Tiện nghi (phân cách bằng dấu phẩy): paper, bidet, sink, soap, mirror, dryer, baby</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">image_url1, image_url2, image_url3</span>
                      <p className="text-gray-600">URL hình ảnh (tối đa 3 ảnh). VD: https://example.com/photo.jpg</p>
                    </div>
                  </div>
                </div>

                {/* Image URL Guidelines */}
                <div className="space-y-2 pt-2 border-t border-gray-300">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Hướng dẫn hình ảnh</p>
                  <div className="space-y-1.5 text-xs text-gray-700 ml-3">
                    <div>
                      <span className="font-medium text-gray-800">✓ Định dạng hỗ trợ:</span>
                      <p className="text-gray-600">JPG, PNG, GIF, WebP hoặc URL từ Firebase, Cloudinary, Imgur</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">✓ Bắt buộc có hình ảnh:</span>
                      <p className="text-gray-600">Tối thiểu phải có 1 hình (image_url1)</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">✓ Cách điền:</span>
                      <p className="text-gray-600">Điền full URL vào cột image_url1, image_url2, image_url3. Để trống nếu không có</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">✓ Lưu ý:</span>
                      <p className="text-gray-600">Hình ảnh sẽ được tải về từ URL và upload lên Firebase Storage tự động</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => downloadCSVTemplate()}
                className="w-full py-2 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-download-line"></i>
                Tải template CSV
              </button>
            </div>
          )}

          {step === 'preview' && parseResult && (
            <div className="space-y-4">
              {parseResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <p className="font-medium mb-2">⚠️ Cảnh báo:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {parseResult.warnings.slice(0, 3).map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                  {parseResult.warnings.length > 3 && (
                    <p className="mt-2 text-xs">... và {parseResult.warnings.length - 3} cảnh báo khác</p>
                  )}
                </div>
              )}

              {parseResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  <p className="font-medium mb-2">❌ Lỗi:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {parseResult.errors.slice(0, 3).map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                  {parseResult.errors.length > 3 && (
                    <p className="mt-2 text-xs">... và {parseResult.errors.length - 3} lỗi khác</p>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">
                  ✓ Sẵn sàng nhập <strong>{previewData.length}</strong> nhà vệ sinh
                </p>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">#</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Tên</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Địa chỉ</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Loại</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Phí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((toilet, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium truncate">{toilet.name}</td>
                        <td className="px-4 py-2 text-gray-600 truncate text-xs">{toilet.address}</td>
                        <td className="px-4 py-2 text-xs">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                            {toilet.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {toilet.price_type === 'free' ? (
                            <span className="text-green-600 font-medium">Miễn phí</span>
                          ) : (
                            <span className="text-primary font-medium">{toilet.price_amount}K</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewData.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  ... và {previewData.length - 5} nhà vệ sinh khác
                </p>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-8">
              <div className="inline-block">
                <i className="ri-loader-4-line animate-spin text-4xl text-primary mb-4"></i>
              </div>
              <p className="text-lg font-medium text-gray-800">Đang nhập dữ liệu...</p>
              <p className="text-sm text-gray-500 mt-2">Vui lòng không đóng cửa sổ này</p>
              <div className="mt-4 bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Nhập <strong>{previewData.length}</strong> nhà vệ sinh
                </p>
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 ${
                importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`font-bold text-lg ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.success ? '✓ Nhập thành công!' : '⚠️ Nhập có lỗi'}
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Tổng:</span> {importResult.totalProcessed} nhà vệ sinh
                  </p>
                  <p className="text-green-700">
                    <i className="ri-check-line mr-1"></i>
                    <span className="font-medium">Thành công:</span> {importResult.successCount}
                  </p>
                  {importResult.failureCount > 0 && (
                    <p className="text-red-700">
                      <i className="ri-close-line mr-1"></i>
                      <span className="font-medium">Thất bại:</span> {importResult.failureCount}
                    </p>
                  )}
                </div>
              </div>

              {importResult.failedRows.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="font-medium text-red-800 mb-2">Lỗi chi tiết:</p>
                  <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                    {importResult.failedRows.map((row: { rowIndex: number; name?: string; error: string }, idx: number) => (
                      <p key={idx} className="text-red-700">
                        <span className="font-medium">Hàng {row.rowIndex}:</span> {row.name} - {row.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 flex gap-3">
          {step === 'upload' && (
            <>
              <button
                onClick={handleClose}
                className="flex-1 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!csvFile}
                className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <i className="ri-file-csv-line"></i>
                Chọn file CSV
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="flex-1 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-upload-line"></i>
                Nhập dữ liệu
              </button>
            </>
          )}

          {step === 'result' && (
            <>
              <button
                onClick={handleReset}
                className="flex-1 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Nhập thêm
              </button>
              <button
                onClick={handleSuccess}
                className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Hoàn tất
              </button>
            </>
          )}

          {step === 'importing' && (
            <button
              disabled
              className="flex-1 py-2 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
            >
              Đang xử lý...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
