import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[#9B8963] disabled:opacity-50 disabled:pointer-events-none rounded-[4px]';

    const variants = {
      primary: 'bg-[#242424] text-[#F5F3ED] hover:bg-[#383838] dark:bg-[#EAE7DF] dark:text-[#171614] dark:hover:bg-[#FFFFFF]',
      secondary: 'bg-[#EAE6DD] text-[#242424] hover:bg-[#DDD8CD] dark:bg-[#2A2824] dark:text-[#EAE7DF] dark:hover:bg-[#34322D]',
      outline: 'border border-[#E5E1D8] text-[#242424] hover:bg-[#F5F3ED] dark:border-[#2E2C28] dark:text-[#EAE7DF] dark:hover:bg-[#21201D]',
      ghost: 'text-[#858176] hover:text-[#242424] hover:bg-[#F5F3ED]/80 dark:text-[#8C877D] dark:hover:text-[#EAE7DF] dark:hover:bg-[#21201D]/80',
      danger: 'border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-900/50 dark:text-red-400 dark:bg-red-950/20',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1 gap-1.5',
      md: 'text-sm px-3.5 py-1.5 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
