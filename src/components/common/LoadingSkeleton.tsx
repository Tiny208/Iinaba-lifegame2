import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-[#EAE6DD]/70 dark:bg-[#2A2824] rounded-[3px]',
            className
          )}
        />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="p-4 border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-3/4" />
      {rows > 2 && <Skeleton className="h-4 w-1/2" />}
    </div>
  );
};
