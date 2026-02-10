import React, { useState, useEffect, useRef } from 'react';
import { fetchAllFireworks, addFirework, updateFirework, deleteFirework } from '../../../services/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FireworkLocation } from '../../../types';
import { GOONG_MAPTILES_KEY } from '../../../constants';
import { getFireworkStatus } from '../../../utils/fireworkUtils';

declare global {
  interface Window {
    goongjs: any;
  }
}

// Location Picker Map Component (reusable)
const LocationPickerMap: React.FC<{
  location: { lat: number; lng: number };
  onLocationChange: (location: { lat: number; lng: number }) => void;
}> = ({ location, onLocationChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    function initMap() {
      const goongjs = window.goongjs;
      goongjs.accessToken = GOONG_MAPTILES_KEY;

      const map = new goongjs.Map({
        container: mapContainerRef.current!,
        style: 'https://tiles.goong.io/assets/goong_map_web.json',
        center: [location.lng, location.lat],
        zoom: 15,
        attributionControl: false,
      });

      map.on('load', () => {
        setMapLoaded(true);

        const el = document.createElement('div');
        el.innerHTML = `
          <style>
            .fw-marker-pin {
              width: 40px; height: 40px;
              border-radius: 50% 50% 50% 0;
              background: linear-gradient(135deg, #FF6B35 0%, #D62828 100%);
              transform: rotate(-45deg);
              box-shadow: 0 4px 20px rgba(255, 107, 53, 0.5), 0 0 0 4px rgba(255,255,255,0.9);
              display: flex; align-items: center; justify-content: center;
              cursor: grab;
            }
            .fw-marker-pin:hover { transform: rotate(-45deg) scale(1.1); }
            .fw-marker-icon { transform: rotate(45deg); color: white; font-size: 18px; }
          </style>
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
            <div class="fw-marker-pin">
              <i class="ri-sparkling-2-fill fw-marker-icon"></i>
            </div>
          </div>
        `;

        const marker = new goongjs.Marker({ element: el, anchor: 'bottom', draggable: true })
          .setLngLat([location.lng, location.lat])
          .addTo(map);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onLocationChange({ lat: lngLat.lat, lng: lngLat.lng });
        });

        markerRef.current = marker;
      });

      map.on('click', (e: any) => {
        const { lng, lat } = e.lngLat;
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
          onLocationChange({ lat, lng });
        }
      });

      mapRef.current = map;
    }

    if (window.goongjs) {
      initMap();
    } else {
      const check = setInterval(() => {
        if (window.goongjs) { clearInterval(check); initMap(); }
      }, 100);
      return () => clearInterval(check);
    }

    return () => {
      markerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && mapLoaded) {
      markerRef.current.setLngLat([location.lng, location.lat]);
      mapRef.current?.flyTo({ center: [location.lng, location.lat], zoom: 15 });
    }
  }, [location.lat, location.lng, mapLoaded]);

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200">
      <div ref={mapContainerRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <i className="ri-loader-4-line animate-spin text-2xl text-orange-500"></i>
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs text-body-text">
        <i className="ri-drag-move-line mr-1"></i>
        Kéo thả ghim hoặc click trên bản đồ để chọn vị trí
      </div>
    </div>
  );
};

// ==================== Main Component ====================

const FireworkManagement: React.FC = () => {
  const [fireworks, setFireworks] = useState<FireworkLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Form states
  const defaultForm = {
    name: '',
    address: '',
    district: '',
    date: '2026-02-17',
    time: '00:00',
    duration: 15,
    type: 'high' as 'high' | 'low',
    description: '',
    location: { lat: 21.0285, lng: 105.8542 },
  };
  const [newFirework, setNewFirework] = useState(defaultForm);
  const [editFirework, setEditFirework] = useState<typeof defaultForm & { id?: string }>(defaultForm);

  // Image states
  const [newFireworkImages, setNewFireworkImages] = useState<string[]>([]);
  const [newFireworkImageFiles, setNewFireworkImageFiles] = useState<File[]>([]);
  const [editFireworkImages, setEditFireworkImages] = useState<string[]>([]);
  const [editFireworkImageFiles, setEditFireworkImageFiles] = useState<File[]>([]);

  // Confirm delete
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadFireworks = async () => {
    setLoading(true);
    const data = await fetchAllFireworks();
    setFireworks(data);
    setLoading(false);
  };

  useEffect(() => { loadFireworks(); }, []);

  // Wards/Communes list (for filter)
  const districts = [...new Set(fireworks.map(f => f.district).filter(Boolean))].sort();

  // Upload images to Firebase Storage
  const uploadImages = async (files: File[], fireworkId?: string): Promise<string[]> => {
    if (!files.length) return [];
    const storage = getStorage();
    const imageUrls: string[] = [];
    console.log('Starting upload for', files.length, 'files to path: fireworks/' + (fireworkId || 'temp'));

    for (const file of files) {
      try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `fireworks/${fireworkId || 'temp'}/${fileName}`);
        console.log('Uploading file:', fileName);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        console.log('Got download URL:', url);
        imageUrls.push(url);
      } catch (error) {
        console.error('Image upload error:', error);
      }
    }
    console.log('Upload complete. Total URLs:', imageUrls.length);
    return imageUrls;
  };

  // Handle new image selection
  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewFireworkImageFiles(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setNewFireworkImages(prev => [...prev, ...previews]);
  };

  // Handle edit image selection
  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEditFireworkImageFiles(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setEditFireworkImages(prev => [...prev, ...previews]);
  };

  // Remove image from preview
  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newFireworkImages[index]);
    setNewFireworkImages(prev => prev.filter((_, i) => i !== index));
    setNewFireworkImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Remove image from edit preview
  const removeEditImage = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setEditFireworkImages(prev => prev.filter((_, i) => i !== index));
    } else {
      URL.revokeObjectURL(editFireworkImages[index]);
      setEditFireworkImages(prev => prev.filter((_, i) => i !== index));
      setEditFireworkImageFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Filter & search
  const filtered = fireworks.filter(f => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!f.name.toLowerCase().includes(term) && !f.address.toLowerCase().includes(term) && !f.district.toLowerCase().includes(term)) return false;
    }
    if (filterDistrict !== 'all' && f.district !== filterDistrict) return false;
    if (filterType !== 'all' && f.type !== filterType) return false;
    return true;
  });

  // Add firework
  const handleAdd = async () => {
    if (!newFirework.name || !newFirework.district) return;
    setAddLoading(true);
    
    // Create firework document first (without images)
    const id = await addFirework({
      name: newFirework.name,
      location: newFirework.location,
      address: newFirework.address,
      district: newFirework.district,
      date: newFirework.date,
      time: newFirework.time,
      duration: newFirework.duration,
      type: newFirework.type,
      description: newFirework.description,
      images: [], // Empty initially
      status: 'upcoming',
    });
    console.log('Firework created with ID:', id);

    // Upload images with the correct firework ID if any
    if (id && newFireworkImageFiles.length > 0) {
      console.log('Uploading', newFireworkImageFiles.length, 'images...');
      const imageUrls = await uploadImages(newFireworkImageFiles, id);
      console.log('Image URLs:', imageUrls);
      if (imageUrls.length > 0) {
        // Update the document with image URLs
        console.log('Updating firework with images...');
        const updateSuccess = await updateFirework(id, { images: imageUrls });
        console.log('Update success:', updateSuccess);
      } else {
        console.warn('No image URLs returned from upload');
      }
    } else {
      console.log('No images to upload. Files:', newFireworkImageFiles.length);
    }

    if (id) {
      setShowAddModal(false);
      setNewFirework(defaultForm);
      setNewFireworkImages([]);
      setNewFireworkImageFiles([]);
      await loadFireworks();
    }
    setAddLoading(false);
  };

  // Edit firework
  const openEdit = (fw: FireworkLocation) => {
    setEditFirework({
      id: fw.id,
      name: fw.name,
      address: fw.address,
      district: fw.district,
      date: fw.date,
      time: fw.time,
      duration: fw.duration,
      type: fw.type,
      description: fw.description || '',
      location: fw.location,
    });
    setEditFireworkImages(fw.images || []);
    setEditFireworkImageFiles([]);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editFirework.id || !editFirework.name) return;
    setEditLoading(true);

    // Upload new images if any
    let newImageUrls: string[] = [];
    if (editFireworkImageFiles.length > 0) {
      newImageUrls = await uploadImages(editFireworkImageFiles, editFirework.id);
    }

    // Combine existing and new images
    const allImages = editFireworkImages.concat(newImageUrls);

    const { id, ...data } = editFirework;
    const success = await updateFirework(id!, { ...data, images: allImages });
    if (success) {
      setShowEditModal(false);
      setEditFireworkImages([]);
      setEditFireworkImageFiles([]);
      await loadFireworks();
    }
    setEditLoading(false);
  };

  // Delete firework
  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    await deleteFirework(id);
    setDeleteConfirm(null);
    setDeleteLoading(false);
    await loadFireworks();
  };

  // Status badge
  const statusBadge = (date: string, time: string) => {
    const status = getFireworkStatus(date, time);
    const map: Record<string, { bg: string; text: string; label: string }> = {
      upcoming: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sắp diễn ra' },
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đang diễn ra' },
      ended: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Đã kết thúc' },
    };
    const s = map[status] || map.upcoming;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  // Type badge
  const typeBadge = (type: string) => {
    if (type === 'high') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 inline-flex items-center gap-1"><i className="ri-rocket-2-fill"></i> Tầm cao</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 inline-flex items-center gap-1"><i className="ri-sparkling-fill"></i> Tầm thấp</span>;
  };

  // Form component (shared between add/edit)
  const renderForm = (
    form: typeof defaultForm,
    setForm: (f: any) => void,
    images: string[] = [],
    onImageSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onRemoveImage?: (index: number) => void,
  ) => (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-heading mb-1">Tên điểm bắn <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
          placeholder="VD: Hồ Hoàn Kiếm"
        />
      </div>

      {/* District */}
      <div>
        <label className="block text-sm font-medium text-heading mb-1">Phường/Xã <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.district}
          onChange={(e) => setForm((prev: any) => ({ ...prev, district: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
          placeholder="VD: Hoàn Kiếm"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-heading mb-1">Địa chỉ</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm((prev: any) => ({ ...prev, address: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
          placeholder="VD: Hoàn Kiếm"
        />
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Ngày bắn</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev: any) => ({ ...prev, date: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Giờ bắn</label>
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm((prev: any) => ({ ...prev, time: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
          />
        </div>
      </div>

      {/* Duration + Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Thời lượng (phút)</label>
          <input
            type="number"
            value={form.duration}
            onChange={(e) => setForm((prev: any) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            min={1} max={120}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Loại pháo hoa</label>
          <select
            value={form.type}
            onChange={(e) => setForm((prev: any) => ({ ...prev, type: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
          >
            <option value="high">▲ Tầm cao</option>
            <option value="low">▼ Tầm thấp</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-heading mb-1">Mô tả</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev: any) => ({ ...prev, description: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
          rows={3}
          placeholder="Ghi chú về chương trình pháo hoa..."
        />
      </div>

      {/* Images */}
      {onImageSelect && onRemoveImage && (
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Hình ảnh</label>
          <div className="mb-3">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={onImageSelect}
              className="hidden"
              id="image-input"
            />
            <label
              htmlFor="image-input"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 hover:bg-orange-100 cursor-pointer transition"
            >
              <i className="ri-image-add-line text-orange-500"></i>
              <span className="text-sm font-medium text-orange-700">Thêm hình ảnh</span>
            </label>
          </div>

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={img} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemoveImage(idx)}
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <i className="ri-close-line text-lg"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Location Picker */}
      <div>
        <label className="block text-sm font-medium text-heading mb-1">Vị trí trên bản đồ</label>
        
        {/* Lat/Lng Input */}
        <div className="mb-3">
          <label className="block text-xs text-body-text mb-1">Tọa độ (Vĩ độ, Kinh độ)</label>
          <input
            type="text"
            value={`${form.location.lat.toFixed(6)}, ${form.location.lng.toFixed(6)}`}
            onChange={(e) => {
              const parts = e.target.value.split(',').map(p => p.trim());
              if (parts.length === 2) {
                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);
                if (!isNaN(lat) && !isNaN(lng)) {
                  setForm((prev: any) => ({ ...prev, location: { lat, lng } }));
                }
              }
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
            placeholder="21.0285, 105.8542"
          />
          <p className="text-xs text-body-text mt-1">VD: 21.0285, 105.8542</p>
        </div>
        
        <LocationPickerMap
          location={form.location}
          onLocationChange={(loc) => setForm((prev: any) => ({ ...prev, location: loc }))}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading flex items-center gap-2">
            <span className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <i className="ri-sparkling-2-fill text-white text-xl"></i>
            </span>
            Quản lý Pháo hoa
          </h1>
          <p className="text-body-text text-sm mt-1">{fireworks.length} điểm bắn pháo hoa</p>
        </div>
        <button
          onClick={() => { setNewFirework(defaultForm); setShowAddModal(true); }}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 w-fit"
        >
          <i className="ri-add-line"></i>
          Thêm điểm bắn
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-body-text"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, địa chỉ, phường/xã..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
            />
          </div>
          {/* Ward/Commune filter */}
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-orange-400 outline-none"
          >
            <option value="all">Tất cả phường/xã</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-orange-400 outline-none"
          >
            <option value="all">Tất cả loại</option>
            <option value="high">▲ Tầm cao</option>
            <option value="low">▼ Tầm thấp</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-100">
          <div className="text-2xl font-bold text-heading">{fireworks.length}</div>
          <div className="text-xs text-body-text">Tổng điểm bắn</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-100">
          <div className="text-2xl font-bold text-orange-600">{fireworks.filter(f => f.type === 'high').length}</div>
          <div className="text-xs text-body-text flex items-center gap-1"><i className="ri-rocket-2-fill"></i> Tầm cao</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-100">
          <div className="text-2xl font-bold text-yellow-600">{fireworks.filter(f => f.type === 'low').length}</div>
          <div className="text-xs text-body-text flex items-center gap-1"><i className="ri-sparkling-fill"></i> Tầm thấp</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-100">
          <div className="text-2xl font-bold text-green-600">{fireworks.filter(f => getFireworkStatus(f.date, f.time) === 'upcoming').length}</div>
          <div className="text-xs text-body-text">Sắp diễn ra</div>
        </div>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <i className="ri-loader-4-line animate-spin text-3xl text-orange-500"></i>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-body-text">
          <i className="ri-sparkling-2-line text-5xl mb-3 block opacity-30"></i>
          <p>Chưa có điểm bắn pháo hoa nào</p>
        </div>
      ) : isMobile ? (
        // Mobile cards
        <div className="space-y-3">
          {filtered.map(fw => (
            <div key={fw.id} className="bg-white/90 backdrop-blur rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-heading truncate whitespace-nowrap">{fw.name}</h3>
                  <p className="text-xs text-body-text truncate whitespace-nowrap">{fw.district} — {fw.address}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(fw)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100">
                    <i className="ri-edit-line text-sm"></i>
                  </button>
                  <button onClick={() => setDeleteConfirm(fw.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100">
                    <i className="ri-delete-bin-line text-sm"></i>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {typeBadge(fw.type)}
                {statusBadge(fw.date, fw.time)}
              </div>
              <div className="text-xs text-body-text flex items-center gap-3">
                <span><i className="ri-calendar-line mr-1"></i>{fw.date}</span>
                <span><i className="ri-time-line mr-1"></i>{fw.time}</span>
                <span><i className="ri-timer-line mr-1"></i>{fw.duration} phút</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop table
        <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-body-text uppercase">Tên điểm bắn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-body-text uppercase">Phường/Xã</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-body-text uppercase">Loại</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-body-text uppercase">Ngày</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-body-text uppercase">Giờ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-body-text uppercase">Thời lượng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-body-text uppercase">Trạng thái</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-body-text uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(fw => (
                <tr key={fw.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-heading text-sm whitespace-nowrap">{fw.name}</div>
                    <div className="text-xs text-body-text truncate whitespace-nowrap">{fw.address}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-body-text">{fw.district}</td>
                  <td className="px-4 py-3">{typeBadge(fw.type)}</td>
                  <td className="px-4 py-3 text-sm text-body-text">{fw.date}</td>
                  <td className="px-4 py-3 text-sm text-body-text">{fw.time}</td>
                  <td className="px-4 py-3 text-sm text-body-text">{fw.duration} phút</td>
                  <td className="px-4 py-3">{statusBadge(fw.date, fw.time)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(fw)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100" title="Sửa">
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button onClick={() => setDeleteConfirm(fw.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100" title="Xoá">
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                <i className="ri-sparkling-2-fill text-orange-500"></i>
                Thêm điểm bắn pháo hoa
              </h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <div className="p-6">
              {renderForm(newFirework, setNewFirework, newFireworkImages, handleNewImageSelect, removeNewImage)}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-body-text hover:bg-gray-50">
                Huỷ
              </button>
              <button
                onClick={handleAdd}
                disabled={addLoading || !newFirework.name || !newFirework.district}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {addLoading && <i className="ri-loader-4-line animate-spin"></i>}
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                <i className="ri-edit-line text-blue-500"></i>
                Sửa điểm bắn pháo hoa
              </h2>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <div className="p-6">
              {renderForm(editFirework, setEditFirework, editFireworkImages, handleEditImageSelect, removeEditImage)}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-body-text hover:bg-gray-50">
                Huỷ
              </button>
              <button
                onClick={handleEdit}
                disabled={editLoading || !editFirework.name}
                className="px-5 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {editLoading && <i className="ri-loader-4-line animate-spin"></i>}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-delete-bin-line text-red-500 text-2xl"></i>
              </div>
              <h3 className="font-bold text-heading text-lg">Xoá điểm bắn?</h3>
              <p className="text-body-text text-sm mt-1">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-body-text hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading && <i className="ri-loader-4-line animate-spin"></i>}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FireworkManagement;
