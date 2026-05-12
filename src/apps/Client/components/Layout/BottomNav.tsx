import React from 'react';
import { useTranslation } from 'react-i18next';

interface BottomNavProps {
  activeTab: 'map' | 'add' | 'community';
  onTabChange: (tab: 'map' | 'add' | 'community') => void;
  hidden?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, hidden = false }) => {
  const { t } = useTranslation();
  
  const navItems = [
    { id: 'map', icon: 'ri-map-pin-2-line', label: t('nav.map') },
    { id: 'add', icon: 'ri-add-circle-fill', label: t('nav.add'), special: true },
    { id: 'community', icon: 'ri-team-line', label: t('nav.community') },
  ];

  return (
    <div 
      className={`fixed bottom-6 left-4 right-4 z-50 transition-all duration-300 ease-in-out ${
        hidden ? 'translate-y-[120px] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="glass rounded-2xl shadow-lg flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isSpecial = item.special;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as any)}
              className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
                isActive ? 'text-primary transform -translate-y-1' : 'text-gray-500'
              }`}
            >
              <i 
                className={`${item.icon} ${isSpecial ? 'text-4xl text-primary' : 'text-2xl'}`}
                style={isSpecial ? { filter: 'drop-shadow(0 4px 6px rgba(0,180,216,0.3))' } : {}}
              ></i>
              {!isSpecial && (
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;