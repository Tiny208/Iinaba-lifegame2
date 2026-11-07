import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-10 text-center border border-dashed border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] bg-[#FFFFFF]/40 dark:bg-[#21201D]/40',
        className
      )}
    >
      {icon && <div className="text-[#858176] dark:text-[#8C877D] mb-3">{icon}</div>}
      <h4 className="font-serif text-lg font-medium text-[#242424] dark:text-[#EAE7DF]">{title}</h4>
      {description && (
        <p className="text-sm text-[#858176] dark:text-[#8C877D] max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
