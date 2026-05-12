import React, { useState, useRef, useEffect } from 'react';
import { GeoPoint, GenderType, PriceType } from '../../../../types';
import { addToilet } from '../../../../services/firebase';
import { GOONG_MAPTILES_KEY } from '../../../../constants';

declare global {
  interface Window {
    goongjs: any;
  }
}

interface AddToiletFormProps {
  userLocation: GeoPoint | null;
  userId: string;
  userName?: string;
  userEmail?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddToiletForm: React.FC<AddToiletFormProps> = ({ 
  userLocation, 
  userId,
  userName,
  userEmail,
  onSuccess, 
  onCancel 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeoPoint | null>(userLocation);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'public' as 'public' | 'commercial' | 'event',
    gender: 'unisex' as GenderType,
    price_type: 'free' as PriceType,
    price_amount: 0,
    accessibility: false,
    amenities: [] as string[]
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Map picker refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Update selected location when userLocation changes
  useEffect(() => {
    if (userLocation && !selectedLocation) {
      setSelectedLocation(userLocation);
    }
  }, [userLocation, selectedLocation]);

  // Initialize map picker
  useEffect(() => {
    if (!showMapPicker || !mapContainerRef.current || mapRef.current) return;
    if (!window.goongjs) return;

    const goongjs = window.goongjs;
    goongjs.accessToken = GOONG_MAPTILES_KEY;

    const center = selectedLocation || userLocation || { lat: 21.0285, lng: 105.8542 };

    const map = new goongjs.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.goong.io/assets/goong_map_web.json',
      center: [center.lng, center.lat],
      zoom: 16,
    });

    map.on('load', () => {
      // Create draggable marker
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(145deg, #00B4D8 0%, #0077B6 100%);
          border-radius: 50% 50% 50% 4px;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
        ">
          <svg style="transform: rotate(45deg); width: 20px; height: 20px; fill: white;" viewBox="0 0 24 24">
            <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V8H4V6Z"/>
            <path d="M3 9H21V12C21 14.2091 19.2091 16 17 16H16.5L17 20C17 20.5523 16.5523 21 16 21H8C7.44772 21 7 20.5523 7 20L7.5 16H7C4.79086 16 3 14.2091 3 12V9Z"/>
          </svg>
        </div>
      `;

      const marker = new goongjs.Marker({ 
        element: el, 
        draggable: true,
        anchor: 'bottom'
      })
        .setLngLat([center.lng, center.lat])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setSelectedLocation({ lat: lngLat.lat, lng: lngLat.lng });
      });

      markerRef.current = marker;
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMapPicker, selectedLocation, userLocation]);

  // Update marker when reopening map
  useEffect(() => {
    if (showMapPicker && markerRef.current && selectedLocation) {
      markerRef.current.setLngLat([selectedLocation.lng, selectedLocation.lat]);
      mapRef.current?.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 16
      });
    }
  }, [showMapPicker, selectedLocation]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) {
      alert('Tối đa 3 ảnh!');
      return;
    }
    
    setImages([...images, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    if (formData.amenities.includes(amenity)) {
      setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocation) {
      alert('Vui lòng chọn vị trí!');
      return;
    }

    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên địa điểm!');
      return;
    }

    setIsSubmitting(true);

    const toiletData = {
      ...formData,
      location: selectedLocation,
      status: 'pending' as const
    };

    const result = await addToilet(toiletData, images, userId, userName, userEmail);
    
    setIsSubmitting(false);

    if (result) {
      onSuccess();
    } else {
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  // Use current location
  const useCurrentLocation = () => {
    if (userLocation) {
      setSelectedLocation(userLocation);
    }
  };

  return (
    <>
      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex flex-col">
          <div className="bg-white p-4 flex items-center justify-between">
            <h3 className="font-bold text-lg">Chọn vị trí</h3>
            <button 
              onClick={() => setShowMapPicker(false)}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
          
          <div className="flex-1 relative">
            <div ref={mapContainerRef} className="w-full h-full" />
            
            {/* Instructions */}
            <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg">
              <p className="text-sm text-center text-gray-600">
                <i className="ri-drag-move-line text-primary mr-1"></i>
                Kéo thả marker để chọn vị trí chính xác
              </p>
            </div>
            
            {/* Current coords */}
            {selectedLocation && (
              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl p-3 shadow-lg">
                <p className="text-xs text-gray-500 text-center">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-white p-4">
            <button
              onClick={() => setShowMapPicker(false)}
              className="w-full py-3 rounded-xl font-bold bg-primary text-white"
            >
              <i className="ri-check-line mr-2"></i>
              Xác nhận vị trí
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Location Selection */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-heading mb-3">
            Vị trí <span className="text-status-danger">*</span>
          </label>
          
          {/* Current selected location */}
          <div className="bg-primary/10 p-3 rounded-lg flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <i className="ri-map-pin-line text-primary text-xl"></i>
            </div>
            <div className="flex-1 min-w-0">
              {selectedLocation ? (
                <>
                  <p className="text-sm font-medium text-heading">Đã chọn vị trí</p>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-status-danger">Chưa chọn vị trí</p>
              )}
            </div>
          </div>
          
          {/* Location buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={useCurrentLocation}
              className="flex-1 py-2.5 rounded-lg border-2 border-gray-200 text-gray-600 text-sm font-medium flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
            >
              <i className="ri-focus-3-line"></i>
              Vị trí hiện tại
            </button>
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="flex-1 py-2.5 rounded-lg border-2 border-primary bg-primary/10 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
            >
              <i className="ri-map-2-line"></i>
              Chọn trên bản đồ
            </button>
          </div>
        </div>

      {/* Name */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-heading mb-2">
          Tên địa điểm <span className="text-status-danger">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="VD: WC Công viên Thống Nhất"
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
        />
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-heading mb-2">Địa chỉ</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="VD: 254 Lê Duẩn, Đống Đa"
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
        />
      </div>

      {/* Type */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-heading mb-3">Loại hình</label>
        <div className="flex gap-2">
          {[
            { value: 'public', label: 'Công cộng', icon: 'ri-government-line' },
            { value: 'commercial', label: 'Quán/Tòa nhà', icon: 'ri-store-line' },
            { value: 'event', label: 'Lưu động', icon: 'ri-caravan-line' }
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData({ ...formData, type: type.value as any })}
              className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                formData.type === type.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              <i className={`${type.icon} text-xl`}></i>
              <span className="text-xs font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-heading mb-3">Phân loại</label>
        <div className="flex gap-2">
          {[
            { value: 'unisex', label: 'Chung', icon: 'ri-user-3-line', desc: 'Không phân chia' },
            { value: 'separated', label: 'Phân chia', icon: 'ri-group-line', desc: 'Nam / Nữ riêng' }
          ].map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setFormData({ ...formData, gender: g.value as GenderType })}
              className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                formData.gender === g.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              <i className={`${g.icon} text-xl`}></i>
              <span className="text-xs font-medium">{g.label}</span>
              <span className="text-[10px] opacity-70">{g.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-heading mb-3">Phí sử dụng</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, price_type: 'free', price_amount: 0 })}
            className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
              formData.price_type === 'free'
                ? 'border-status-success bg-status-success/10 text-status-success'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            <i className="ri-gift-line text-lg"></i>
            <span className="font-medium">Miễn phí</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, price_type: 'paid' })}
            className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
              formData.price_type === 'paid'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            <i className="ri-money-dollar-circle-line text-lg"></i>
            <span className="font-medium">Có phí</span>
          </button>
        </div>
        {formData.price_type === 'paid' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={formData.price_amount}
              onChange={(e) => setFormData({ ...formData, price_amount: parseInt(e.target.value) || 0 })}
              placeholder="5000"
              className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
            <span className="text-gray-500">VNĐ</span>
          </div>
        )}
      </div>

      {/* Accessibility */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <i className="ri-wheelchair-line text-xl text-primary"></i>
            <span className="font-medium text-heading">Hỗ trợ người khuyết tật</span>
          </div>
          <div 
            onClick={() => setFormData({ ...formData, accessibility: !formData.accessibility })}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              formData.accessibility ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              formData.accessibility ? 'translate-x-7' : 'translate-x-1'
            }`}></div>
          </div>
        </label>
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-heading mb-3">Tiện nghi</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'paper', label: 'Giấy vệ sinh', icon: 'ri-file-paper-2-line' },
            { value: 'bidet', label: 'Vòi xịt', icon: 'ri-drop-line' },
            { value: 'sink', label: 'Bồn rửa tay', icon: 'ri-hand-heart-line' },
            { value: 'soap', label: 'Xà phòng', icon: 'ri-hand-sanitizer-line' },
            { value: 'mirror', label: 'Gương', icon: 'ri-shape-line' },
            { value: 'dryer', label: 'Máy sấy tay', icon: 'ri-windy-line' },
            { value: 'baby', label: 'Bàn thay tã', icon: 'ri-user-heart-line' }
          ].map((amenity) => (
            <button
              key={amenity.value}
              type="button"
              onClick={() => toggleAmenity(amenity.value)}
              className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${
                formData.amenities.includes(amenity.value)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              <i className={`${amenity.icon} text-lg`}></i>
              <span className="text-sm font-medium">{amenity.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="block text-sm font-medium text-heading mb-3">
          Hình ảnh (tối đa 3)
        </label>
        <div className="flex gap-2 flex-wrap">
          {imagePreviews.map((preview, idx) => (
            <div key={idx} className="relative w-20 h-20">
              <img src={preview} alt="" className="w-full h-full object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-status-danger text-white rounded-full flex items-center justify-center"
              >
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
              <i className="ri-camera-line text-xl text-gray-400"></i>
              <span className="text-[10px] text-gray-400">Thêm ảnh</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedLocation}
          className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i>
              Đang gửi...
            </>
          ) : (
            <>
              <i className="ri-send-plane-line"></i>
              Gửi đóng góp
            </>
          )}
        </button>
      </div>
    </form>
    </>
  );
};

export default AddToiletForm;
