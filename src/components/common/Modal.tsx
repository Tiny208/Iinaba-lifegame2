import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dimmed quiet backdrop */}
      <div
        className="fixed inset-0 bg-[#171614]/40 dark:bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            'relative w-full rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] p-6 shadow-lifted transition-all text-[#242424] dark:text-[#EAE7DF]',
            maxWidths[maxWidth]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || subtitle) && (
            <div className="flex items-start justify-between pb-4 border-b border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 mb-5">
              <div>
                {title && <h3 className="font-serif text-xl font-medium tracking-tight text-[#242424] dark:text-[#EAE7DF]">{title}</h3>}
                {subtitle && <p className="text-xs text-[#858176] dark:text-[#8C877D] mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="text-[#858176] hover:text-[#242424] dark:text-[#8C877D] dark:hover:text-[#EAE7DF] transition-colors p-1"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};
