import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { NeonRunner } from '../Games/components/NeonRunner';
import { soundManager } from '../Games/utils/SoundManager';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSignOut: () => void;
  onNavigateToAbout?: () => void;
}

type Language = 'vi' | 'en' | 'zh' | 'ru' | 'ja';

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

const UserMenu: React.FC<UserMenuProps> = ({ isOpen, onClose, currentUser, onSignOut, onNavigateToAbout }) => {
  const { t, i18n } = useTranslation();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showGame, setShowGame] = useState(false);

  // Current language from i18n
  const currentLang = (i18n.language || 'vi') as Language;

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
    setShowLangPicker(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('appInfo.title'),
          text: t('appInfo.description'),
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      alert(t('common.linkCopied'));
    }
  };

  if (!isOpen) return null;

  const menuContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      {/* Menu Panel - Slide from right, smaller on desktop */}
      <div 
        className="relative h-full w-full max-w-sm md:max-w-xs md:m-4 md:h-auto md:max-h-[90vh] md:rounded-2xl bg-white shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary-light p-4 md:p-5 text-white relative md:rounded-t-2xl">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-3 mt-2">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-xl font-bold">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-base truncate">{currentUser.displayName || t('common.user')}</h2>
                <p className="text-white/80 text-xs truncate">{currentUser.email}</p>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <h2 className="font-bold text-base">{t('common.guest')}</h2>
              <p className="text-white/80 text-xs">{t('menu.loginPrompt')}</p>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="p-3 md:p-4 space-y-1">
          {/* Language Section */}
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 px-2">{t('menu.language')}</h3>
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-lg">
                  {LANGUAGES.find(l => l.code === currentLang)?.flag}
                </div>
                <span className="font-medium text-heading text-sm">
                  {LANGUAGES.find(l => l.code === currentLang)?.name}
                </span>
              </div>
              <i className={`ri-arrow-${showLangPicker ? 'up' : 'down'}-s-line text-gray-400 text-lg`}></i>
            </button>

            {showLangPicker && (
              <div className="mt-1.5 ml-3 space-y-0.5">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors text-sm ${
                      currentLang === lang.code 
                        ? 'bg-primary/10 text-primary font-semibold' 
                        : 'text-heading hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.name}</span>
                    {currentLang === lang.code && (
                      <i className="ri-check-line ml-auto text-primary"></i>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Entertainment Section */}
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 px-2">{t('menu.entertainment')}</h3>
            <button
              onClick={() => setShowGame(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white">
                  <i className="ri-gamepad-line text-base"></i>
                </div>
                <div className="text-left">
                  <span className="font-medium text-heading block text-sm">Toilet Run</span>
                  <span className="text-[10px] text-gray-500">Play now!</span>
                </div>
              </div>
              <i className="ri-arrow-right-s-line text-gray-400 text-lg"></i>
            </button>
          </div>

          {/* Utility Section */}
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 px-2">{t('menu.utilities')}</h3>
            
            <button
              onClick={() => {
                onNavigateToAbout?.();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <i className="ri-shield-check-line text-base text-primary"></i>
              </div>
              <span className="font-medium text-heading text-sm">{t('menu.privacy')}</span>
            </button>

            <button
              onClick={handleShare}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <i className="ri-share-line text-base text-green-600"></i>
              </div>
              <span className="font-medium text-heading text-sm">{t('menu.share')}</span>
            </button>

            <button
              onClick={() => window.open('mailto:al.squared.la@gmail.com', '_blank')}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="ri-customer-service-2-line text-base text-purple-600"></i>
              </div>
              <span className="font-medium text-heading text-sm">{t('menu.support')}</span>
            </button>
          </div>

          {/* Account Section */}
          {currentUser && (
            <div className="mb-3">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 px-2">{t('menu.account')}</h3>
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-red-50 transition-colors text-red-500"
              >
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="ri-logout-box-r-line text-base"></i>
                </div>
                <span className="font-medium text-sm">{t('common.logout')}</span>
              </button>
            </div>
          )}

          {/* Social Media Links */}
          <div className="pt-3 border-t border-gray-100 mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-3 text-center">{t('menu.followUs')}</p>
            <div className="flex justify-center gap-3.5">
              <a 
                href="https://www.facebook.com/profile.php?id=61587522062791" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all duration-200 hover:scale-110 text-blue-600"
              >
                <i className="ri-facebook-fill text-lg"></i>
              </a>
              <a 
                href="https://www.tiktok.com/@hoxicoco.official" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all duration-200 hover:scale-110 text-white"
              >
                <i className="ri-tiktok-fill text-lg"></i>
              </a>
              <a 
                href="https://www.instagram.com/hoxicoco.team/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 flex items-center justify-center transition-all duration-200 hover:scale-110 text-white"
              >
                <i className="ri-instagram-fill text-lg"></i>
              </a>
            </div>
          </div>

          {/* App Info */}
          <div className="pt-2 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400">Hoxicoco v1.0.0</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{t('appInfo.madeBy')}</p>
          </div>
        </div>
      </div>

      {/* Game Modal */}
      {showGame && (
        <div 
          className="fixed inset-0 z-[10000] bg-gray-900 flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-[10001]">
            <button 
              onClick={() => {
                soundManager.stopMusic(); // Stop all music/sounds
                setShowGame(false);
              }}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <i className="ri-close-line text-xl text-white"></i>
            </button>
          </div>
          
          {/* Game Component */}
          <NeonRunner />
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(menuContent, document.body);
};

export default UserMenu;
