import React from 'react';
import { Home, Mic, History, User } from 'lucide-react';

export type TabType = 'home' | 'practice' | 'review' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'practice' as TabType, label: 'Practice', icon: Mic },
    { id: 'review' as TabType, label: 'Review', icon: History },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full flex justify-around items-center h-[72px] px-4 bg-[#f7fafc] border-t border-[#bbc9c7]/30 z-40 shadow-[0_-4px_12px_rgba(49,151,149,0.08)] max-w-2xl mx-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center transition-all duration-200 py-1 px-3 rounded-full ${
              isActive
                ? 'bg-[#4fd1c5] text-[#005750] shadow-sm font-semibold'
                : 'text-[#616363] hover:text-[#006a63] active:scale-95'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-xs mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
