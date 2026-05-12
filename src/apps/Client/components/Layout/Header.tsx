import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FilterState, SearchResult, GeoPoint, Toilet } from '../../../../types';
import { searchPlaces, getPlaceDetail } from '../../../../services/goongService';
import { User } from 'firebase/auth';
import UserMenu from '../UI/UserMenu';

interface HeaderProps {
  userLocation: GeoPoint | null;
  filters: FilterState;
  radius: number | null;
  onFilterChange: (newFilters: FilterState) => void;
  onRadiusChange: (newRadius: number | null) => void;
  onLocationSelect: (location: GeoPoint) => void;
  toilets?: Toilet[];
  onToiletSelect?: (toilet: Toilet) => void;
  currentUser?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  userLocation,
  filters, 
  radius, 
  onFilterChange, 
  onRadiusChange,
  onLocationSelect,
  toilets,
  onToiletSelect,
  currentUser,
  onSignIn,
  onSignOut
}) => {
  const { t } = useTranslation();
  
  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  
  // User menu state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownHeight, setDropdownHeight] = useState<number>(0);

  useEffect(() => {
    // Measure dropdown height whenever results change
    const el = dropdownRef.current;
    if (el) {
      // Read height on next tick to ensure styles applied
      requestAnimationFrame(() => setDropdownHeight(el.offsetHeight || 0));
    } else {
      setDropdownHeight(0);
    }
  }, [results]);

  // Xử lý tìm kiếm (Debounce)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    // Immediate local matches for snappy UX
    if (val.length > 0) {
      const q = val.trim().toLowerCase();
      const localMatches = (toilets || [])
        .filter(t => {
          if (!t.name) return false;
          const name = t.name.toLowerCase();
          const addr = (t.address || '').toLowerCase();
          return name.includes(q) || addr.includes(q);
        })
        .map(t => ({
          place_id: `local_${t.id}`,
          description: t.address || t.name,
          structured_formatting: {
            main_text: t.name,
            secondary_text: t.address || ''
          }
        } as SearchResult));

      // Show local matches immediately
      setResults(localMatches);
    } else {
      setResults([]);
    }

    // Remote predictions (debounced) only when query long enough
    if (val.length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const predictions = await searchPlaces(val, userLocation || undefined);

        const q = val.trim().toLowerCase();
        const localMatches = (toilets || [])
          .filter(t => {
            if (!t.name) return false;
            const name = t.name.toLowerCase();
            const addr = (t.address || '').toLowerCase();
            return name.includes(q) || addr.includes(q);
          })
          .map(t => ({
            place_id: `local_${t.id}`,
            description: t.address || t.name,
            structured_formatting: {
              main_text: t.name,
              secondary_text: t.address || ''
            }
          } as SearchResult));

        const filteredPredictions = predictions.filter(p => {
          const main = (p.structured_formatting.main_text || '').toLowerCase();
          return !localMatches.some(l => (l.structured_formatting.main_text || '').toLowerCase() === main);
        });

        const combined: SearchResult[] = [...localMatches, ...filteredPredictions];
        setResults(combined);
        setIsSearching(false);
      }, 250); // reduced debounce for snappier results
    }
  };

  const handleSelectPlace = async (place: SearchResult) => {
    setQuery(place.structured_formatting.main_text);
    setResults([]);
    // If this is a local DB toilet, its place_id is prefixed with 'local_<id>'
    if (place.place_id && place.place_id.startsWith('local_')) {
      const id = place.place_id.replace('local_', '');
      const match = (toilets || []).find(t => t.id === id) || null;
      if (match) {
        onToiletSelect?.(match);
        onLocationSelect(match.location);
        return;
      }
    }

    const location = await getPlaceDetail(place.place_id);
    if (location) {
      // If selected place matches a known toilet by name, notify parent
      const main = (place.structured_formatting.main_text || '').toLowerCase();
      const matchByName = (toilets || []).find(t => t.name && t.name.toLowerCase() === main) || null;
      if (matchByName) {
        onToiletSelect?.(matchByName);
      }
      onLocationSelect(location);
    }
  };

  // Toggle helpers
  const toggleFilter = (key: keyof FilterState) => {
    onFilterChange({ ...filters, [key]: !filters[key] });
  };

  const setGender = (gender: FilterState['gender']) => {
    onFilterChange({ ...filters, gender });
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleGoogleSignIn = () => {
    setShowLoginModal(false);
    onSignIn?.();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 flex flex-col gap-3 pointer-events-none">
      {/* 1. Search Bar */}
      <div className="relative pointer-events-auto">
        <div className="glass rounded-xl shadow-md p-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <i className="ri-search-line text-xl"></i>
          </div>
          <input 
            type="text" 
            value={query}
            onChange={handleSearchChange}
            placeholder={t('header.searchPlaceholder')} 
            className="bg-transparent border-none outline-none flex-1 text-heading placeholder-gray-500 text-sm font-medium"
          />
          {isSearching && (
            <div className="w-8 h-8 flex items-center justify-center text-primary">
              <i className="ri-loader-4-line animate-spin text-xl"></i>
            </div>
          )}
          {query && !isSearching && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <i className="ri-close-circle-fill"></i>
            </button>
          )}
          
          {/* User Avatar / Login Button */}
          {currentUser ? (
            <button 
              onClick={() => setShowUserMenu(true)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary hover:opacity-80 transition-opacity"
            >
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold">
                  {currentUser.displayName?.charAt(0) || 'U'}
                </div>
              )}
            </button>
          ) : (
            <button 
              onClick={handleLoginClick}
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-light transition-colors"
              title={t('common.login')}
            >
              <i className="ri-user-line text-xl"></i>
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {results.length > 0 && (
          <div ref={dropdownRef} className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto border border-gray-100">
            {results.map((place) => (
              <div 
                key={place.place_id}
                onClick={() => handleSelectPlace(place)}
                className="p-3 border-b border-gray-100 flex items-center gap-3 hover:bg-primary/5 active:bg-primary/10 transition-colors cursor-pointer"
              >
                <i className="ri-map-pin-2-fill text-primary"></i>
                <div className="flex-1 text-left">
                  <p className="text-heading text-sm font-medium line-clamp-1">{place.structured_formatting.main_text}</p>
                  <p className="text-gray-500 text-xs line-clamp-1">{place.structured_formatting.secondary_text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Smart Filters (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2 items-center" style={dropdownHeight ? { marginTop: dropdownHeight + 8 } : undefined}>
        
        {/* Radius Filter - click lại để bỏ chọn */}
        <div className="glass flex items-center p-1 rounded-full mr-2">
            {[500, 1000, 1500, 2000].map((r) => (
                <button
                    key={r}
                    onClick={() => onRadiusChange(radius === r ? null : r)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        radius === r ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-primary'
                    }`}
                >
                    {r >= 1000 ? `${r/1000}km` : `${r}m`}
                </button>
            ))}
        </div>

        {/* Gender Filter - Cycle: all -> separated -> unisex */}
        <button 
          onClick={() => {
            const cycle: FilterState['gender'][] = ['all', 'separated', 'unisex'];
            const currentIndex = cycle.indexOf(filters.gender);
            const nextIndex = (currentIndex + 1) % cycle.length;
            setGender(cycle[nextIndex]);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap active:scale-95 transition-all ${filters.gender !== 'all' ? 'bg-primary shadow-lg shadow-primary/40' : 'glass'}`}
        >
          <i className={`${filters.gender === 'separated' ? 'ri-group-line' : 'ri-user-3-line'} text-lg ${filters.gender !== 'all' ? 'text-white' : 'text-primary'}`}></i>
          <span className={`text-xs font-semibold ${filters.gender !== 'all' ? 'text-white' : 'text-body-text'}`}>
             {filters.gender === 'all' ? t('filters.genderAll') : filters.gender === 'separated' ? t('filters.genderSeparated') : t('filters.genderUnisex')}
          </span>
        </button>

        {/* Free Only */}
        <button 
          onClick={() => toggleFilter('freeOnly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap active:scale-95 transition-all ${filters.freeOnly ? 'bg-primary shadow-lg shadow-primary/40' : 'glass'}`}
        >
          <i className={`ri-money-dollar-circle-line text-lg ${filters.freeOnly ? 'text-white' : 'text-status-success'}`}></i>
          <span className={`text-xs font-semibold ${filters.freeOnly ? 'text-white' : 'text-body-text'}`}>{t('filters.freeOnly')}</span>
        </button>

        {/* Accessibility */}
        <button 
          onClick={() => toggleFilter('accessibility')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap active:scale-95 transition-all ${filters.accessibility ? 'bg-primary shadow-lg shadow-primary/40' : 'glass'}`}
        >
          <i className={`ri-wheelchair-line text-lg ${filters.accessibility ? 'text-white' : 'text-primary'}`}></i>
          <span className={`text-xs font-semibold ${filters.accessibility ? 'text-white' : 'text-body-text'}`}>{t('filters.accessibility')}</span>
        </button>

        {/* Amenities: Paper */}
        <button 
          onClick={() => toggleFilter('hasPaper')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap active:scale-95 transition-all ${filters.hasPaper ? 'bg-primary shadow-lg shadow-primary/40' : 'glass'}`}
        >
          <i className={`ri-file-paper-2-line text-lg ${filters.hasPaper ? 'text-white' : 'text-primary'}`}></i>
          <span className={`text-xs font-semibold ${filters.hasPaper ? 'text-white' : 'text-body-text'}`}>{t('filters.paper')}</span>
        </button>

         {/* Amenities: Bidet */}
         <button 
          onClick={() => toggleFilter('hasBidet')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap active:scale-95 transition-all ${filters.hasBidet ? 'bg-primary shadow-lg shadow-primary/40' : 'glass'}`}
        >
          <i className={`ri-drop-line text-lg ${filters.hasBidet ? 'text-white' : 'text-primary'}`}></i>
          <span className={`text-xs font-semibold ${filters.hasBidet ? 'text-white' : 'text-body-text'}`}>{t('filters.bidet')}</span>
        </button>

      </div>

      {/* Login Modal */}
      {showLoginModal && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary to-primary-light p-6 text-center">
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
              
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="ri-user-smile-line text-4xl text-primary"></i>
              </div>
              <h2 className="text-xl font-bold text-white">{t('auth.welcome')}</h2>
              <p className="text-white/80 text-sm mt-1">{t('auth.loginToUse')}</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-body-text">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className="ri-star-line text-primary"></i>
                  </div>
                  <span className="text-sm">{t('auth.benefits.review')}</span>
                </div>
                <div className="flex items-center gap-3 text-body-text">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className="ri-add-circle-line text-primary"></i>
                  </div>
                  <span className="text-sm">{t('auth.benefits.contribute')}</span>
                </div>
                <div className="flex items-center gap-3 text-body-text">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className="ri-alarm-warning-line text-primary"></i>
                  </div>
                  <span className="text-sm">{t('auth.benefits.report')}</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-gray-200 rounded-xl font-semibold text-heading hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{t('auth.loginWithGoogle')}</span>
              </button>

              {/* Terms */}
              <p className="text-xs text-center text-body-text/50 mt-4">
                {t('auth.terms')}<br/>
                <span className="text-primary">{t('auth.termsLink')}</span> {t('auth.termsOfUs')}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* User Menu - Full screen slide-in */}
      <UserMenu
        isOpen={showUserMenu}
        onClose={() => setShowUserMenu(false)}
        currentUser={currentUser || null}
        onSignOut={() => onSignOut?.()}
      />
    </div>
  );
};

export default Header;