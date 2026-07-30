import React from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  title?: string;
  onProfileClick?: () => void;
  onNotificationClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  title,
  onProfileClick,
  onNotificationClick
}) => {
  return (
    <header className="w-full sticky top-0 z-50 bg-[#f7fafc]/95 backdrop-blur-md h-16 flex justify-between items-center px-5 shadow-[0_4px_12px_rgba(49,151,149,0.08)] border-b border-[#bbc9c7]/20">
      <div className="flex items-center gap-3 cursor-pointer" onClick={onProfileClick}>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#4fd1c5] bg-[#4fd1c5]/20 flex items-center justify-center shrink-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
            alt={user.name}
            onError={(e) => {
              // Fallback avatar if image fails to load
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-bold text-[#006a63] text-sm">
            {user.name.slice(0, 1)}
          </span>
        </div>
        <div className="flex flex-col">
          <h1 className="font-bold text-lg md:text-xl text-[#006a63] flex items-center gap-1.5 leading-snug">
            {title ? title : `안녕하세요, ${user.name}님! 👋`}
          </h1>
          {!title && (
            <span className="text-xs text-[#3c4947] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#006a63]" />
              {user.majorOrJob} • CEFR {user.cefrLevel}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-[#4fd1c5]/20 text-[#005750] px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <span>🔥 {user.streakDays}일 연속</span>
        </div>
        <button
          onClick={onNotificationClick}
          className="w-10 h-10 flex items-center justify-center rounded-full text-[#3c4947] hover:bg-[#4fd1c5]/20 active:scale-95 transition-all relative"
          aria-label="알림"
        >
          <Bell className="w-5 h-5 text-[#006a63]" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
        </button>
      </div>
    </header>
  );
};
