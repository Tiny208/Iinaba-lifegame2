import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { QuickCaptureModal } from '../common/QuickCaptureModal';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';

export const AppLayout: React.FC = () => {
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
    <div className="min-h-screen bg-[#F5F3ED] dark:bg-[#171614] text-[#242424] dark:text-[#EAE7DF] flex flex-col md:flex-row">
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
      <main className="flex-1 min-w-0 pb-20 md:pb-8 flex flex-col">
        {!isConfigured && (
          <div className="bg-[#9B8963]/10 border-b border-[#9B8963]/30 px-4 py-2.5 text-xs text-[#857451] dark:text-[#D1C2A3] flex items-center justify-between">
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

        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full">
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
