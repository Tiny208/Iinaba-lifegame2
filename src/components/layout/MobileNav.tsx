import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Inbox, Target, BookOpen, Feather, Plus } from 'lucide-react';
import { useInbox } from '@/hooks/useInbox';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  onOpenQuickCapture: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenQuickCapture }) => {
  const { unprocessedCount } = useInbox();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Inbox', path: '/inbox', icon: Inbox, count: unprocessedCount },
    { name: 'Focus', path: '/focus', icon: Target },
    { name: 'Library', path: '/library', icon: BookOpen },
    { name: 'Reflect', path: '/reflect', icon: Feather },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] dark:bg-[#21201D] border-t border-[#E5E1D8] dark:border-[#2E2C28] pb-safe px-2 py-1">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center py-1.5 px-3 rounded text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-[#242424] dark:text-[#EAE7DF] font-semibold'
                    : 'text-[#858176] dark:text-[#8C877D]'
                )
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.name}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#9B8963]" />
              )}
            </NavLink>
          );
        })}

        {/* Quick capture button in mobile nav */}
        <button
          onClick={onOpenQuickCapture}
          className="flex flex-col items-center py-1 px-3 text-[10px] font-medium text-[#9B8963]"
          aria-label="Quick Capture"
        >
          <div className="w-5 h-5 rounded-full bg-[#9B8963] text-white flex items-center justify-center mb-0.5">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>Capture</span>
        </button>
      </div>
    </nav>
  );
};
