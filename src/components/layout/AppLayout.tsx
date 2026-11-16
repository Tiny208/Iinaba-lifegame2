import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { QuickCaptureModal } from '../common/QuickCaptureModal';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, LogIn } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isConfigured = isSupabaseConfigured();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Cmd/Ctrl + K => Global Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }

      // 2. Cmd/Ctrl + Shift + C => Quick Capture
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      }

      // 3. Press 'q' or 'Q' when not in input / textarea => Quick Capture
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen bg-[#F5F3ED] dark:bg-[#171614] text-[#242424] dark:text-[#EAE7DF] flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <Sidebar
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Mobile Top Header */}
      <Header
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-full min-h-0 overflow-y-auto">
        {!isConfigured && (
          <div className="bg-[#9B8963]/10 border-b border-[#9B8963]/30 px-4 py-2 text-xs text-[#857451] dark:text-[#D1C2A3] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#9B8963] flex-shrink-0" />
              <span>
                Supabase credentials not configured. Connect your Supabase project in Settings to enable real-time cloud sync.
              </span>
            </div>
            <Link
              to="/settings"
              className="font-medium underline hover:text-[#242424] dark:hover:text-[#FFFFFF] ml-2"
            >
              Configure Now
            </Link>
          </div>
        )}

        {!user && !loading && isConfigured && (
          <div className="bg-[#9B8963]/15 border-b border-[#9B8963]/30 px-4 py-2 text-xs text-[#857451] dark:text-[#D1C2A3] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#9B8963] flex-shrink-0" />
              <span>
                Bạn chưa đăng nhập. Vui lòng đăng nhập để tạo và lưu trữ sự kiện, công việc và ghi chú.
              </span>
            </div>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1 font-medium px-2.5 py-0.5 rounded bg-[#9B8963] text-white hover:bg-[#857451] transition-colors ml-2 flex-shrink-0 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              Đăng nhập ngay
            </Link>
          </div>
        )}

        <div className="flex-1 p-3 sm:p-4 md:py-3 md:px-6 max-w-6xl mx-auto w-full flex flex-col min-h-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenQuickCapture={() => setIsQuickCaptureOpen(true)} />

      {/* Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};
