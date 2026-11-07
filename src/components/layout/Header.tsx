import React from 'react';
import { Search, Plus, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { format } from 'date-fns';

interface HeaderProps {
  onOpenQuickCapture: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickCapture, onOpenSearch }) => {
  const todayFormatted = format(new Date(), 'EEEE, MMMM d');

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FFFFFF] dark:bg-[#21201D] border-b border-[#E5E1D8] dark:border-[#2E2C28] sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-[#242424] dark:bg-[#EAE7DF] flex items-center justify-center text-[#F5F3ED] dark:text-[#171614] font-serif font-bold text-xs">
          稲
        </div>
        <div>
          <span className="font-serif font-medium text-sm text-[#242424] dark:text-[#EAE7DF]">INABA</span>
          <span className="text-[10px] text-[#858176] ml-2">{todayFormatted}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSearch}
          className="p-1.5 text-[#858176] hover:text-[#242424] dark:text-[#8C877D] dark:hover:text-[#EAE7DF]"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenQuickCapture}
          className="p-1.5 text-[#9B8963] hover:text-[#877653]"
          aria-label="Quick Capture"
        >
          <Plus className="w-4 h-4" />
        </button>
        <NavLink
          to="/settings"
          className="p-1.5 text-[#858176] hover:text-[#242424] dark:text-[#8C877D] dark:hover:text-[#EAE7DF]"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </NavLink>
      </div>
    </header>
  );
};
