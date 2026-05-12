import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { fetchAllToilets, updateToiletStatus, deleteToilet, addToiletAdmin, updateToiletAdmin, AdminToilet, NewToiletData, auth, BulkImportResult } from '../../../services/firebase';
import { GOONG_MAPTILES_KEY } from '../../../constants';
import BulkImportModal from '../components/BulkImportModal';

declare global {
  interface Window {
    goongjs: any;
  }
}

// Location Picker Map Component
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
    if (!window.goongjs) {
      const checkGoong = setInterval(() => {
        if (window.goongjs) {
          clearInterval(checkGoong);
          initMap();
        }
      }, 100);
      return () => clearInterval(checkGoong);
    } else {
      initMap();
    }

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
        
        // Create draggable marker - Modern pin design
        const el = document.createElement('div');
        el.className = 'location-marker';
        el.innerHTML = `
          <style>
            .location-marker {
              cursor: grab;
            }
            .location-marker:active {
              cursor: grabbing;
            }
            .marker-pin {
              width: 40px;
              height: 40px;
              border-radius: 50% 50% 50% 0;
              background: linear-gradient(135deg, #00B4D8 0%, #0077B6 100%);
              transform: rotate(-45deg);
              box-shadow: 0 4px 20px rgba(0, 180, 216, 0.5), 0 0 0 4px rgba(255,255,255,0.9);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
            }
            .marker-pin:hover {
              transform: rotate(-45deg) scale(1.1);
              box-shadow: 0 6px 25px rgba(0, 180, 216, 0.6), 0 0 0 5px rgba(255,255,255,1);
            }
            .marker-icon {
              transform: rotate(45deg);
              color: white;
              font-size: 18px;
            }
            .marker-pulse {
              position: absolute;
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: rgba(0, 180, 216, 0.3);
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              animation: pulse 2s ease-out infinite;
              z-index: -1;
            }
            @keyframes pulse {
              0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
              100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
            }
          </style>
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div class="marker-pulse"></div>
            <div class="marker-pin">
              <i class="ri-map-pin-2-fill marker-icon"></i>
            </div>
          </div>
        `;

        const marker = new goongjs.Marker({ 
          element: el, 
          anchor: 'bottom',
          draggable: true 
        })
          .setLngLat([location.lng, location.lat])
          .addTo(map);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onLocationChange({ lat: lngLat.lat, lng: lngLat.lng });
        });

        markerRef.current = marker;
      });

      // Click on map to move marker
      map.on('click', (e: any) => {
        const { lng, lat } = e.lngLat;
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
          onLocationChange({ lat, lng });
        }
      });

      mapRef.current = map;
    }

    return () => {
      markerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker when location prop changes
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
          <i className="ri-loader-4-line animate-spin text-2xl text-primary"></i>
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs text-body-text">
        <i className="ri-drag-move-line mr-1"></i>
        Kéo thả ghim hoặc click trên bản đồ để chọn vị trí
      </div>
    </div>
  );
};

const ToiletManagement: React.FC = () => {
  const [toilets, setToilets] = useState<AdminToilet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedToilet, setSelectedToilet] = useState<AdminToilet | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Add toilet modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newToilet, setNewToilet] = useState<Partial<NewToiletData>>({
    name: '',
    address: '',
    type: 'public',
    price_type: 'free',
    price_amount: 0,
    gender: 'unisex',
    accessibility: false,
    amenities: [],
    location: { lat: 21.0285, lng: 105.8542 }, // Hanoi default
    images: []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Edit toilet modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editToilet, setEditToilet] = useState<Partial<NewToiletData> & { id?: string }>({
    name: '',
    address: '',
    type: 'public',
    price_type: 'free',
    price_amount: 0,
    gender: 'unisex',
    accessibility: false,
    amenities: [],
    location: { lat: 21.0285, lng: 105.8542 },
    images: []
  });
  const [editPreviewImages, setEditPreviewImages] = useState<string[]>([]);
  const [editNewImages, setEditNewImages] = useState<File[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerUrls, setImageViewerUrls] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
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
    if (isLeftSwipe) navigateImageViewer('next');
    if (isRightSwipe) navigateImageViewer('prev');
  };

  const openImageViewer = (urls: string[], index: number) => {
    setImageViewerUrls(urls);
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  const navigateImageViewer = (direction: 'prev' | 'next') => {
    const total = imageViewerUrls.length;
    setImageViewerIndex(prev => 
      direction === 'prev' 
        ? (prev - 1 + total) % total 
        : (prev + 1) % total
    );
  };

  // Keyboard navigation and mount animation for image viewer
  useEffect(() => {
    if (!imageViewerOpen) {
      setViewerMounted(false);
      return;
    }

    const t = setTimeout(() => setViewerMounted(true), 10);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImageViewerOpen(false);
      if (e.key === 'ArrowLeft') navigateImageViewer('prev');
      if (e.key === 'ArrowRight') navigateImageViewer('next');
    };
    window.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [imageViewerOpen, imageViewerUrls.length]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadToilets = async () => {
    setLoading(true);
    const data = await fetchAllToilets();
    setToilets(data);
    setLoading(false);
  };

  useEffect(() => {
    loadToilets();
  }, []);

  // Try to get user's current location when opening add modal
  useEffect(() => {
    if (showAddModal && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewToilet(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        () => {
          // If denied, use default (Hanoi)
        },
        { enableHighAccuracy: true }
      );
    }
  }, [showAddModal]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'public': return 'Công cộng';
      case 'commercial': return 'Thương mại';
      case 'event': return 'Sự kiện';
      default: return type;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'public': return 'bg-primary/20 text-primary';
      case 'commercial': return 'bg-purple-100 text-purple-600';
      case 'event': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'bg-status-success/20', text: 'text-status-success', label: 'Hoạt động' };
      case 'maintenance': return { bg: 'bg-status-warn/20', text: 'text-status-warn', label: 'Bảo trì' };
      case 'danger': return { bg: 'bg-status-danger/20', text: 'text-status-danger', label: 'Cảnh báo' };
      case 'pending': return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Chờ duyệt' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
    }
  };

  const handleViewDetail = (toilet: AdminToilet) => {
    setSelectedToilet(toilet);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (toiletId: string, newStatus: string) => {
    setActionLoading(toiletId);
    const success = await updateToiletStatus(toiletId, newStatus);
    if (success) {
      setToilets(prev => prev.map(t => t.id === toiletId ? { ...t, status: newStatus as AdminToilet['status'] } : t));
    }
    setActionLoading(null);
    setShowDetailModal(false);
  };

  const handleDelete = async (toiletId: string, toiletName: string) => {
    if (!confirm('Bạn có chắc muốn xóa "' + toiletName + '"? Hành động này không thể hoàn tác.')) {
      return;
    }
    setActionLoading(toiletId);
    const success = await deleteToilet(toiletId);
    if (success) {
      setToilets(prev => prev.filter(t => t.id !== toiletId));
    }
    setActionLoading(null);
    setShowDetailModal(false);
  };

  // Add toilet handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    const existingFiles = newToilet.images || [];
    const allFiles = [...existingFiles, ...newFiles].slice(0, 5);
    
    setNewToilet(prev => ({ ...prev, images: allFiles }));
    const previews = allFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const removeImage = (index: number) => {
    const newFiles = [...(newToilet.images || [])];
    newFiles.splice(index, 1);
    setNewToilet(prev => ({ ...prev, images: newFiles }));
    
    const newPreviews = [...previewImages];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

  const toggleAmenity = (amenity: string) => {
    const current = newToilet.amenities || [];
    if (current.includes(amenity)) {
      setNewToilet(prev => ({ ...prev, amenities: current.filter(a => a !== amenity) }));
    } else {
      setNewToilet(prev => ({ ...prev, amenities: [...current, amenity] }));
    }
  };

  const resetAddForm = () => {
    setNewToilet({
      name: '',
      address: '',
      type: 'public',
      price_type: 'free',
      price_amount: 0,
      gender: 'unisex',
      accessibility: false,
      amenities: [],
      location: { lat: 21.0285, lng: 105.8542 },
      images: []
    });
    previewImages.forEach(url => URL.revokeObjectURL(url));
    setPreviewImages([]);
  };

  // Edit form handlers
  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    setEditNewImages(prev => [...prev, ...newFiles].slice(0, 5));
  };

  const removeEditImage = (index: number, isNewImage: boolean) => {
    if (isNewImage) {
      const newFiles = [...editNewImages];
      newFiles.splice(index, 1);
      setEditNewImages(newFiles);
    } else {
      const newPreviews = [...editPreviewImages];
      newPreviews.splice(index, 1);
      setEditPreviewImages(newPreviews);
    }
  };

  const toggleEditAmenity = (amenity: string) => {
    const current = editToilet.amenities || [];
    if (current.includes(amenity)) {
      setEditToilet(prev => ({ ...prev, amenities: current.filter(a => a !== amenity) }));
    } else {
      setEditToilet(prev => ({ ...prev, amenities: [...current, amenity] }));
    }
  };

  const openEditModal = (toilet: AdminToilet) => {
    setEditToilet({
      id: toilet.id,
      name: toilet.name,
      address: toilet.address,
      type: toilet.type,
      price_type: 'free', // Note: not stored in AdminToilet
      price_amount: 0,
      gender: 'unisex', // Note: not stored in AdminToilet
      accessibility: false,
      amenities: toilet.amenities || [],
      location: toilet.location,
      images: []
    });
    setEditPreviewImages(toilet.images || []);
    setEditNewImages([]);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editToilet.id || !editToilet.name?.trim()) {
      alert('Vui lòng nhập tên địa điểm');
      return;
    }

    setEditLoading(true);
    try {
      const result = await updateToiletAdmin(
        editToilet.id,
        editToilet,
        editNewImages.length > 0 ? editNewImages : undefined,
        editPreviewImages.length > 0 ? editPreviewImages : undefined
      );

      if (result.success) {
        alert('Cập nhật thành công');
        setShowEditModal(false);
        setShowDetailModal(false);
        await loadToilets();
      } else {
        alert('Cập nhật thất bại: ' + (result.error || 'Không xác định'));
      }
    } catch (error) {
      alert('Lỗi: ' + (error instanceof Error ? error.message : 'Không xác định'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleBulkImportSuccess = async (result: BulkImportResult) => {
    await loadToilets();
    
    let message = `Nhập thành công ${result.successCount}/${result.totalProcessed} nhà vệ sinh`;
    if (result.failureCount > 0) {
      message += `\n\nThất bại: ${result.failureCount}`;
      if (result.failedRows.length > 0) {
        message += `\nLỗi chi tiết: ${result.failedRows.slice(0, 3).map(r => `Hàng ${r.rowIndex} (${r.name}): ${r.error}`).join('\n')}`;
        if (result.failedRows.length > 3) {
          message += `\n... và ${result.failedRows.length - 3} hàng khác`;
        }
      }
    }
    
    alert(message);
  };

  const handleAddToilet = async () => {
    if (!newToilet.name?.trim() || !newToilet.address?.trim()) {
      alert('Vui lòng nhập tên và địa chỉ địa điểm');
      return;
    }

    setAddLoading(true);
    try {
      const result = await addToiletAdmin(newToilet as NewToiletData, auth.currentUser?.email || 'admin');
      
      if (result.success) {
        await loadToilets();
        setShowAddModal(false);
        resetAddForm();
        alert('Thêm địa điểm thành công!');
      } else {
        alert(result.error || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (error) {
      console.error('Error in handleAddToilet:', error);
      alert('Có lỗi xảy ra: ' + (error instanceof Error ? error.message : 'Không xác định'));
    }
    setAddLoading(false);
  };

  const handleLocationChange = (location: { lat: number; lng: number }) => {
    setNewToilet(prev => ({ ...prev, location }));
  };

  const filteredToilets = toilets.filter(toilet => {
    const matchSearch = toilet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       toilet.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || toilet.type === filterType;
    const matchStatus = filterStatus === 'all' || toilet.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  // Export filtered toilets to CSV (Excel-friendly)
  // Export filtered toilets to native XLSX using SheetJS (dynamic import)
  const exportToXLSX = async () => {
    if (!filteredToilets || filteredToilets.length === 0) {
      alert('Không có địa điểm để xuất');
      return;
    }

    // Prepare data with proper types (numbers, dates)
    const data = filteredToilets.map(t => ({
      ID: t.id,
      Name: t.name,
      Address: t.address,
      Type: t.type,
      Status: t.status,
      Amenities: Array.isArray(t.amenities) ? t.amenities.join('; ') : '',
      CleanScore: typeof t.clean_score === 'number' ? Number(t.clean_score.toFixed(1)) : undefined,
      Reports: t.reportsCount ?? 0,
      Reviews: t.reviewsCount ?? 0,
      CreatedAt: t.createdAt ? new Date(t.createdAt) : undefined,
      Latitude: t.location?.lat ?? undefined,
      Longitude: t.location?.lng ?? undefined,
    }));

    try {
      const XLSX = await import('xlsx');

      const ws = XLSX.utils.json_to_sheet(data, { dateNF: 'yyyy-mm-dd HH:MM:ss' });

      // Set column widths for readability
      ws['!cols'] = [
        { wpx: 120 }, // ID
        { wpx: 240 }, // Name
        { wpx: 320 }, // Address
        { wpx: 100 }, // Type
        { wpx: 100 }, // Status
        { wpx: 220 }, // Amenities
        { wpx: 80 },  // CleanScore
        { wpx: 80 },  // Reports
        { wpx: 80 },  // Reviews
        { wpx: 160 }, // CreatedAt
        { wpx: 100 }, // Latitude
        { wpx: 100 }, // Longitude
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Toilets');

      const now = new Date();
      const name = `toilets_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.xlsx`;

      // Trigger download in browser
      XLSX.writeFile(wb, name);
    } catch (err) {
      console.error('XLSX export failed, falling back to CSV', err);
      // Fallback: export CSV (keep previous behavior)
      // (Call existing CSV export if present)
      // Recreate CSV quickly here if needed
      const headers = [
        'ID', 'Name', 'Address', 'Type', 'Status', 'Amenities', 'Clean Score', 'Reports', 'Reviews', 'Created At', 'Latitude', 'Longitude'
      ];
      const escapeCell = (value: any) => {
        if (value === null || value === undefined) return '""';
        const s = String(value);
        return `"${s.replace(/"/g, '""')}"`;
      };
      const rows = filteredToilets.map(t => {
        const amenities = Array.isArray(t.amenities) ? t.amenities.join('; ') : '';
        const lat = t.location?.lat ?? '';
        const lng = t.location?.lng ?? '';
        const created = t.createdAt ? new Date(t.createdAt).toLocaleString() : '';
        return [
          t.id,
          t.name,
          t.address,
          t.type,
          t.status,
          amenities,
          (typeof t.clean_score === 'number') ? t.clean_score.toFixed(1) : '',
          (t.reportsCount ?? 0),
          (t.reviewsCount ?? 0),
          created,
          lat,
          lng,
        ].map(escapeCell).join(',');
      });
      const BOM = '\uFEFF';
      const csvContent = BOM + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toilets_fallback.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const stats = {
    total: toilets.length,
    active: toilets.filter(t => t.status === 'active').length,
    maintenance: toilets.filter(t => t.status === 'maintenance').length,
    danger: toilets.filter(t => t.status === 'danger').length,
  };

  const amenitiesList = [
    { key: 'paper', label: 'Giấy vệ sinh', icon: 'ri-file-paper-2-line' },
    { key: 'bidet', label: 'Vòi xịt', icon: 'ri-drop-line' },
    { key: 'sink', label: 'Bồn rửa tay', icon: 'ri-hand-heart-line' },
    { key: 'soap', label: 'Xà phòng', icon: 'ri-hand-sanitizer-line' },
    { key: 'mirror', label: 'Gương', icon: 'ri-shape-line' },
    { key: 'dryer', label: 'Máy sấy tay', icon: 'ri-windy-line' },
    { key: 'baby', label: 'Bàn thay tã', icon: 'ri-user-heart-line' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="ri-loader-4-line animate-spin text-4xl text-primary"></i>
          <p className="mt-2 text-body-text/70">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      <style>{`.export-button{transition:box-shadow 150ms ease,border-color 150ms ease}.export-button:hover{box-shadow:0 8px 20px rgba(16,185,129,0.10), 0 0 0 6px rgba(16,185,129,0.04); border-color:#16a34a;}`}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-heading">Quản lý địa điểm</h1>
          <p className="text-body-text/70 mt-1 text-xs sm:text-base">Danh sách tất cả nhà vệ sinh trong hệ thống</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToXLSX}
            className="export-button px-3 py-2 border-2 border-gray-200 text-body-text rounded-xl hover:bg-green-50 hover:border-green-600 transition-colors duration-150 flex items-center justify-center gap-2 text-sm font-medium"
            title="Xuất file CSV danh sách địa điểm"
          >
            <i className="ri-file-excel-2-line text-green-600"></i>
            <span>Xuất Excel</span>
          </button>
          <button 
            onClick={() => setShowBulkImportModal(true)}
            className="px-3 py-2 border-2 border-primary text-primary rounded-xl hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <i className="ri-upload-cloud-2-line"></i>
            <span>Nhập hàng loạt</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/30 text-sm"
          >
            <i className="ri-add-line"></i>
            <span>Thêm địa điểm</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-admin rounded-xl sm:rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 sm:min-w-[280px]">
            <div className="relative">
              <i className="ri-search-line absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-body-text/50"></i>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white/50 border border-white/50 rounded-xl focus:outline-none focus:border-primary text-heading placeholder:text-body-text/50 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 border border-white/50 rounded-xl focus:outline-none focus:border-primary text-heading cursor-pointer text-sm"
            >
              <option value="all">Tất cả loại</option>
              <option value="public">Công cộng</option>
              <option value="commercial">Thương mại</option>
              <option value="event">Sự kiện</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 border border-white/50 rounded-xl focus:outline-none focus:border-primary text-heading cursor-pointer text-sm"
            >
              <option value="all">Tất cả TT</option>
              <option value="active">Hoạt động</option>
              <option value="maintenance">Bảo trì</option>
              <option value="danger">Cảnh báo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white/50 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-heading">{stats.total}</p>
          <p className="text-xs sm:text-sm text-body-text/70">Tổng số</p>
        </div>
        <div className="bg-status-success/10 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-status-success">{stats.active}</p>
          <p className="text-xs sm:text-sm text-body-text/70">Hoạt động</p>
        </div>
        <div className="bg-status-warn/10 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-status-warn">{stats.maintenance}</p>
          <p className="text-xs sm:text-sm text-body-text/70">Bảo trì</p>
        </div>
        <div className="bg-status-danger/10 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-status-danger">{stats.danger}</p>
          <p className="text-xs sm:text-sm text-body-text/70">Cảnh báo</p>
        </div>
      </div>

      {/* Empty State */}
      {filteredToilets.length === 0 ? (
        <div className="glass-admin rounded-xl p-8 text-center">
          <i className="ri-map-pin-line text-4xl text-body-text/30 mb-2"></i>
          <p className="text-body-text/70">Không tìm thấy địa điểm nào</p>
        </div>
      ) : isMobile ? (
        /* Mobile: Card List */
        <div className="space-y-3">
          {filteredToilets.map((toilet) => {
            const status = getStatusBadge(toilet.status);
            return (
              <div key={toilet.id} className="glass-admin rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="ri-map-pin-line text-primary"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-heading text-sm truncate">{toilet.name}</h3>
                    <p className="text-xs text-body-text/70 truncate mt-0.5">{toilet.address}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={'px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ' + getTypeBadge(toilet.type)}>
                        {getTypeLabel(toilet.type)}
                      </span>
                      <span className={'px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ' + status.bg + ' ' + status.text}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <i className="ri-star-fill text-status-warn"></i>
                      <span className="font-medium text-heading">{toilet.clean_score.toFixed(1)}</span>
                    </div>
                    <div className={'flex items-center gap-1 ' + (toilet.reportsCount > 5 ? 'text-status-danger' : 'text-body-text/70')}>
                      <i className="ri-alarm-warning-line"></i>
                      <span>{toilet.reportsCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleViewDetail(toilet)}
                      className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
                    >
                      <i className="ri-eye-line text-sm"></i>
                    </button>
                    <button 
                      onClick={() => handleDelete(toilet.id, toilet.name)}
                      disabled={actionLoading === toilet.id}
                      className="w-7 h-7 rounded-lg bg-status-danger/10 text-status-danger flex items-center justify-center disabled:opacity-50"
                    >
                      {actionLoading === toilet.id ? (
                        <i className="ri-loader-4-line animate-spin text-sm"></i>
                      ) : (
                        <i className="ri-delete-bin-line text-sm"></i>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop: Table */
        <div className="glass-admin rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-heading">Tên địa điểm</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-heading">Địa chỉ</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-heading w-28">Loại</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-heading w-28">Trạng thái</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-heading w-24">Đánh giá</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-heading w-20">Báo cáo</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-heading w-32">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredToilets.map((toilet) => {
                  const status = getStatusBadge(toilet.status);
                  return (
                    <tr key={toilet.id} className="border-b border-white/10 hover:bg-white/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i className="ri-map-pin-line text-primary"></i>
                          </div>
                          <span className="font-medium text-heading">{toilet.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-body-text">{toilet.address}</td>
                      <td className="px-6 py-4">
                        <span className={'inline-block px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ' + getTypeBadge(toilet.type)}>
                          {getTypeLabel(toilet.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={'inline-block px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ' + status.bg + ' ' + status.text}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <i className="ri-star-fill text-status-warn"></i>
                          <span className="font-medium text-heading">{toilet.clean_score.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={'font-medium ' + (toilet.reportsCount > 5 ? 'text-status-danger' : 'text-heading')}>
                          {toilet.reportsCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleViewDetail(toilet)}
                            className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                          <button 
                            onClick={() => handleDelete(toilet.id, toilet.name)}
                            disabled={actionLoading === toilet.id}
                            className="w-8 h-8 rounded-lg bg-status-danger/10 text-status-danger hover:bg-status-danger/20 flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            {actionLoading === toilet.id ? (
                              <i className="ri-loader-4-line animate-spin"></i>
                            ) : (
                              <i className="ri-delete-bin-line"></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/20">
            <p className="text-sm text-body-text/70">
              Hiển thị {filteredToilets.length} / {toilets.length} địa điểm
            </p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedToilet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-heading">Chi tiết địa điểm</h2>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <i className="ri-close-line text-xl text-body-text"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedToilet.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedToilet.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt="" 
                      className="w-24 h-24 object-cover rounded-xl flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                      onClick={() => openImageViewer(selectedToilet.images, idx)}
                    />
                  ))}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-heading">{selectedToilet.name}</h3>
                <p className="text-sm text-body-text/70 mt-1">{selectedToilet.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-body-text/50 mb-1">Loại</p>
                  <p className="font-medium text-heading">{getTypeLabel(selectedToilet.type)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-body-text/50 mb-1">Trạng thái</p>
                  <p className={'font-medium ' + getStatusBadge(selectedToilet.status).text}>
                    {getStatusBadge(selectedToilet.status).label}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-body-text/50 mb-1">Đánh giá</p>
                  <p className="font-medium text-heading flex items-center gap-1">
                    <i className="ri-star-fill text-status-warn"></i>
                    {selectedToilet.clean_score.toFixed(1)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-body-text/50 mb-1">Số báo cáo</p>
                  <p className={'font-medium ' + (selectedToilet.reportsCount > 5 ? 'text-status-danger' : 'text-heading')}>
                    {selectedToilet.reportsCount}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-heading mb-2">Thay đổi trạng thái:</p>
                <div className="flex flex-wrap gap-2">
                  {['active', 'maintenance', 'danger'].map(status => {
                    const badge = getStatusBadge(status);
                    const isActive = selectedToilet.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => !isActive && handleUpdateStatus(selectedToilet.id, status)}
                        disabled={isActive || actionLoading === selectedToilet.id}
                        className={'px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ' + 
                          (isActive ? badge.bg + ' ' + badge.text + ' ring-2 ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                      >
                        {badge.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-body-text font-medium hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => openEditModal(selectedToilet)}
                disabled={actionLoading === selectedToilet.id}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === selectedToilet.id ? (
                  <><i className="ri-loader-4-line animate-spin"></i> Đang cập nhật...</>
                ) : (
                  <><i className="ri-edit-line"></i> Chỉnh sửa</>
                )}
              </button>
              <button
                onClick={() => handleDelete(selectedToilet.id, selectedToilet.name)}
                disabled={actionLoading === selectedToilet.id}
                className="flex-1 py-3 rounded-xl bg-status-danger text-white font-medium hover:bg-status-danger/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === selectedToilet.id ? (
                  <><i className="ri-loader-4-line animate-spin"></i> Đang xóa...</>
                ) : (
                  <><i className="ri-delete-bin-line"></i> Xóa</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Toilet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-heading">Thêm địa điểm mới</h2>
                <button 
                  onClick={() => { setShowAddModal(false); resetAddForm(); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <i className="ri-close-line text-xl text-body-text"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Images Upload */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Hình ảnh (tối đa 5)</label>
                <div className="flex gap-3 flex-wrap">
                  {previewImages.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-status-danger text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  ))}
                  {previewImages.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                    >
                      <i className="ri-add-line text-2xl"></i>
                      <span className="text-[10px]">Thêm ảnh</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Tên địa điểm *</label>
                <input
                  type="text"
                  value={newToilet.name}
                  onChange={(e) => setNewToilet(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Nhà vệ sinh Công viên Lê Văn Tám"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-heading"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Địa chỉ *</label>
                <input
                  type="text"
                  value={newToilet.address}
                  onChange={(e) => setNewToilet(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="VD: 1 Võ Văn Tần, Phường 6, Quận 3, TP.HCM"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-heading"
                />
              </div>

              {/* Location Picker Map */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  <i className="ri-map-pin-line mr-1"></i>
                  Vị trí trên bản đồ *
                </label>
                <LocationPickerMap
                  location={newToilet.location || { lat: 21.0285, lng: 105.8542 }}
                  onLocationChange={handleLocationChange}
                />
                <div className="mt-2 flex gap-4 text-xs text-body-text/70">
                  <span>Lat: {newToilet.location?.lat.toFixed(6)}</span>
                  <span>Lng: {newToilet.location?.lng.toFixed(6)}</span>
                </div>
              </div>

              {/* Type & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">Loại địa điểm</label>
                  <select
                    value={newToilet.type}
                    onChange={(e) => setNewToilet(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-heading cursor-pointer"
                  >
                    <option value="public">Công cộng</option>
                    <option value="commercial">Thương mại</option>
                    <option value="event">Sự kiện</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">Loại giá</label>
                  <select
                    value={newToilet.price_type}
                    onChange={(e) => setNewToilet(prev => ({ ...prev, price_type: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-heading cursor-pointer"
                  >
                    <option value="free">Miễn phí</option>
                    <option value="paid">Có phí</option>
                  </select>
                </div>
              </div>

              {newToilet.price_type === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">Giá (VND)</label>
                  <input
                    type="number"
                    value={newToilet.price_amount}
                    onChange={(e) => setNewToilet(prev => ({ ...prev, price_amount: parseInt(e.target.value) || 0 }))}
                    placeholder="VD: 5000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-heading"
                  />
                </div>
              )}

              {/* Gender & Accessibility */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">Phân loại</label>
                  <select
                    value={newToilet.gender}
                    onChange={(e) => setNewToilet(prev => ({ ...prev, gender: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-heading cursor-pointer"
                  >
                    <option value="unisex">Chung (Không phân chia)</option>
                    <option value="separated">Phân chia Nam/Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">Tiếp cận</label>
                  <button
                    onClick={() => setNewToilet(prev => ({ ...prev, accessibility: !prev.accessibility }))}
                    className={'w-full px-4 py-3 border rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ' +
                      (newToilet.accessibility 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-gray-200 text-body-text/70 hover:border-gray-300')}
                  >
                    <i className="ri-wheelchair-line"></i>
                    {newToilet.accessibility ? 'Có hỗ trợ' : 'Không hỗ trợ'}
                  </button>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Tiện nghi</label>
                <div className="flex flex-wrap gap-2">
                  {amenitiesList.map(({ key, label, icon }) => {
                    const isSelected = newToilet.amenities?.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleAmenity(key)}
                        className={'px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ' +
                          (isSelected 
                            ? 'bg-primary/10 text-primary border border-primary' 
                            : 'bg-gray-100 text-body-text/70 border border-transparent hover:bg-gray-200')}
                      >
                        <i className={icon}></i>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setShowAddModal(false); resetAddForm(); }}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-body-text font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddToilet}
                disabled={addLoading || !newToilet.name?.trim() || !newToilet.address?.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addLoading ? (
                  <><i className="ri-loader-4-line animate-spin"></i> Đang thêm...</>
                ) : (
                  <><i className="ri-add-line"></i> Thêm địa điểm</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Toilet Modal */}
      {showEditModal && editToilet.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-heading">Chỉnh sửa địa điểm</h2>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <i className="ri-close-line text-xl text-body-text"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Images Upload */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Hình ảnh (tối đa 5)</label>
                <div className="flex gap-3 flex-wrap">
                  {editPreviewImages.map((url, idx) => (
                    <div key={`existing-${idx}`} className="relative w-20 h-20">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button
                        onClick={() => removeEditImage(idx, false)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-status-danger text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  ))}
                  {editNewImages.map((_, idx) => (
                    <div key={`new-${idx}`} className="relative w-20 h-20">
                      <img src={URL.createObjectURL(editNewImages[idx])} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button
                        onClick={() => removeEditImage(idx, true)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-status-danger text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  ))}
                  {(editPreviewImages.length + editNewImages.length) < 5 && (
                    <button
                      onClick={() => editFileInputRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                    >
                      <i className="ri-add-line text-2xl"></i>
                      <span className="text-[10px]">Thêm ảnh</span>
                    </button>
                  )}
                </div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEditImageSelect}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Tên địa điểm *</label>
                <input
                  type="text"
                  value={editToilet.name || ''}
                  onChange={(e) => setEditToilet(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-heading"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Địa chỉ *</label>
                <input
                  type="text"
                  value={editToilet.address || ''}
                  onChange={(e) => setEditToilet(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-heading"
                />
              </div>

              {/* Location Picker Map */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  <i className="ri-map-pin-line mr-1"></i>
                  Vị trí trên bản đồ *
                </label>
                <LocationPickerMap
                  location={editToilet.location || { lat: 21.0285, lng: 105.8542 }}
                  onLocationChange={(loc) => setEditToilet(prev => ({ ...prev, location: loc }))}
                />
                <div className="mt-2 flex gap-4 text-xs text-body-text/70">
                  <span>Lat: {editToilet.location?.lat.toFixed(6)}</span>
                  <span>Lng: {editToilet.location?.lng.toFixed(6)}</span>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Loại địa điểm</label>
                <select
                  value={editToilet.type}
                  onChange={(e) => setEditToilet(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-heading cursor-pointer"
                >
                  <option value="public">Công cộng</option>
                  <option value="commercial">Thương mại</option>
                  <option value="event">Sự kiện</option>
                </select>
              </div>

              {/* Accessibility */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Khác</label>
                <button
                  onClick={() => setEditToilet(prev => ({ ...prev, accessibility: !prev.accessibility }))}
                  className={'w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors flex items-center justify-center gap-2 ' +
                    (editToilet.accessibility 
                      ? 'bg-primary/10 text-primary border-primary' 
                      : 'bg-gray-100 text-body-text/70 border-gray-200 hover:bg-gray-200')}
                >
                  <i className="ri-wheelchair-line"></i>
                  {editToilet.accessibility ? 'Có hỗ trợ người khuyết tật' : 'Không hỗ trợ người khuyết tật'}
                </button>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Tiện nghi</label>
                <div className="flex flex-wrap gap-2">
                  {amenitiesList.map(({ key, label, icon }) => {
                    const isSelected = editToilet.amenities?.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleEditAmenity(key)}
                        className={'px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ' +
                          (isSelected 
                            ? 'bg-primary/10 text-primary border border-primary' 
                            : 'bg-gray-100 text-body-text/70 border border-transparent hover:bg-gray-200')}
                      >
                        <i className={icon}></i>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-body-text font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editLoading || !editToilet.name?.trim() || !editToilet.address?.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editLoading ? (
                  <><i className="ri-loader-4-line animate-spin"></i> Đang lưu...</>
                ) : (
                  <><i className="ri-check-line"></i> Lưu thay đổi</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal - Full screen */}
      {imageViewerOpen && imageViewerUrls.length > 0 && ReactDOM.createPortal(
        <div 
          className={`fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center ${viewerMounted ? 'opacity-100' : 'opacity-0'}`} 
          style={{ height: '100dvh', transition: 'opacity 220ms ease' }} 
          onClick={() => setImageViewerOpen(false)}
        >
          {/* Top header */}
          <div className="absolute top-0 left-0 right-0 z-30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-md">
                <i className="ri-image-line text-white text-lg"></i>
              </div>
              <div>
                <div className="text-sm font-semibold">Hình ảnh địa điểm</div>
                <div className="text-xs opacity-80">{imageViewerIndex + 1} / {imageViewerUrls.length}</div>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setImageViewerOpen(false); }} 
              className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Main image area */}
          <div 
            className="flex-1 flex items-center justify-center z-20 px-4 py-16" 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative flex items-center justify-center">
              <img
                src={imageViewerUrls[imageViewerIndex]}
                alt=""
                className="max-w-full max-h-[80dvh] object-contain rounded-2xl shadow-2xl"
                style={{ border: '1px solid rgba(255,255,255,0.04)' }}
              />
              <div className="absolute top-4 right-4 text-white/90 text-sm bg-black/40 px-2 py-1 rounded-lg">{imageViewerIndex + 1}/{imageViewerUrls.length}</div>
            </div>
          </div>

          {/* Navigation arrows */}
          {imageViewerUrls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImageViewer('prev'); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-30"
              >
                <i className="ri-arrow-left-s-line text-2xl"></i>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImageViewer('next'); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-30"
              >
                <i className="ri-arrow-right-s-line text-2xl"></i>
              </button>
            </>
          )}

          {/* Bottom thumbnails */}
          {imageViewerUrls.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-3 px-4">
              <div className="bg-black/40 rounded-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {imageViewerUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setImageViewerIndex(idx); }}
                    className={`w-14 h-14 rounded-md overflow-hidden flex-shrink-0 ${idx === imageViewerIndex ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal 
        isOpen={showBulkImportModal} 
        onClose={() => setShowBulkImportModal(false)}
        onSuccess={handleBulkImportSuccess}
      />
    </div>
  );
};

export default ToiletManagement;
