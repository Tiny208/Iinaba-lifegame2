import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Inbox,
  Target,
  BookOpen,
  Feather,
  Plus,
  Search,
  Settings,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { useInbox } from '@/hooks/useInbox';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onOpenQuickCapture: () => void;
  onOpenSearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenQuickCapture, onOpenSearch }) => {
  const { unprocessedCount } = useInbox();
  const { theme, setTheme, isDark } = useTheme();
  const { user, profile } = useAuth();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Inbox', path: '/inbox', icon: Inbox, count: unprocessedCount },
    { name: 'Focus', path: '/focus', icon: Target },
    { name: 'Library', path: '/library', icon: BookOpen },
    { name: 'Reflect', path: '/reflect', icon: Feather },
  ];

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#E5E1D8] dark:border-[#2E2C28] bg-[#FFFFFF] dark:bg-[#21201D] h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-[#242424] dark:bg-[#EAE7DF] flex items-center justify-center text-[#F5F3ED] dark:text-[#171614] font-serif font-bold text-sm tracking-wider">
            稲
          </div>
          <div>
            <h1 className="font-serif text-lg font-medium tracking-tight text-[#242424] dark:text-[#EAE7DF] leading-tight">
              INABA
            </h1>
            <p className="text-[10px] tracking-widest text-[#858176] dark:text-[#8C877D] uppercase font-mono">
              Second Brain
            </p>
          </div>
        </div>
      </div>

      {/* Action Triggers: Quick Capture & Search */}
      <div className="px-4 py-3 space-y-2 border-b border-[#E5E1D8]/40 dark:border-[#2E2C28]/40">
        <button
          onClick={onOpenQuickCapture}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium bg-[#F5F3ED] hover:bg-[#EAE6DD] dark:bg-[#2A2824] dark:hover:bg-[#34322D] text-[#242424] dark:text-[#EAE7DF] rounded-[4px] border border-[#E5E1D8] dark:border-[#2E2C28] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-[#9B8963]" />
            Quick Capture
          </span>
          <kbd className="text-[10px] text-[#858176] font-mono">Q</kbd>
        </button>

        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#858176] hover:text-[#242424] dark:text-[#8C877D] dark:hover:text-[#EAE7DF] hover:bg-[#F5F3ED]/60 dark:hover:bg-[#2A2824]/60 rounded-[4px] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            Search
          </span>
          <kbd className="text-[10px] text-[#858176] font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Primary Navigation Destinations */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-[#858176] dark:text-[#8C877D] uppercase tracking-wider font-mono">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2 rounded-[4px] text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#F5F3ED] text-[#242424] font-semibold dark:bg-[#2A2824] dark:text-[#EAE7DF]'
                    : 'text-[#858176] hover:text-[#242424] hover:bg-[#F5F3ED]/50 dark:text-[#8C877D] dark:hover:text-[#EAE7DF] dark:hover:bg-[#2A2824]/50'
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="px-1.5 py-0.2 text-[11px] font-mono font-medium rounded-full bg-[#9B8963]/15 text-[#857451] dark:bg-[#9B8963]/25 dark:text-[#D1C2A3]">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Controls: Theme & Settings */}
      <div className="p-3 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 space-y-2">
        <div className="flex items-center justify-between">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 text-xs font-medium text-[#858176] hover:text-[#242424] dark:text-[#8C877D] dark:hover:text-[#EAE7DF] transition-colors',
                isActive && 'text-[#242424] dark:text-[#EAE7DF] font-semibold'
              )
            }
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>

          <button
            onClick={cycleTheme}
            className="p-1.5 text-[#858176] hover:text-[#242424] dark:text-[#8C877D] dark:hover:text-[#EAE7DF] rounded transition-colors"
            title={`Theme: ${theme}`}
          >
            {theme === 'light' && <Sun className="w-4 h-4" />}
            {theme === 'dark' && <Moon className="w-4 h-4" />}
            {theme === 'system' && <Laptop className="w-4 h-4" />}
          </button>
        </div>

        {/* User state badge */}
        {!user && (
          <NavLink
            to="/auth"
            className="block text-center py-1 px-2 text-[11px] font-medium bg-[#242424] text-[#F5F3ED] dark:bg-[#EAE7DF] dark:text-[#171614] rounded hover:opacity-90 transition-opacity"
          >
            Sign In / Initial Setup
          </NavLink>
        )}
      </div>
    </aside>
  );
};
