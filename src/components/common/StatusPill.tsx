import React from 'react';
import { cn } from '@/lib/utils';
import { TaskPriority, TaskStatus, NoteType, ProjectStatus } from '@/types/database';

interface StatusPillProps {
  type: 'status' | 'priority' | 'noteType' | 'projectStatus';
  value: TaskStatus | TaskPriority | NoteType | ProjectStatus | string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ type, value, className }) => {
  const getStyles = () => {
    switch (type) {
      case 'status':
        if (value === 'completed') {
          return 'bg-[#7B8D7A]/15 text-[#5F705E] dark:bg-[#7B8D7A]/20 dark:text-[#A8BCA7]';
        }
        if (value === 'in_progress') {
          return 'bg-[#9B8963]/15 text-[#857451] dark:bg-[#9B8963]/25 dark:text-[#D1C2A3]';
        }
        return 'bg-[#EAE6DD] text-[#858176] dark:bg-[#2A2824] dark:text-[#8C877D]';

      case 'priority':
        if (value === 'high') {
          return 'border border-red-300/80 text-red-700 bg-red-50/50 dark:border-red-800/60 dark:text-red-400 dark:bg-red-950/20';
        }
        if (value === 'medium') {
          return 'border border-[#9B8963]/40 text-[#857451] bg-[#F5F3ED] dark:border-[#B3A27D]/30 dark:text-[#D1C2A3] dark:bg-[#2A2824]/50';
        }
        return 'border border-[#E5E1D8] text-[#858176] dark:border-[#2E2C28] dark:text-[#8C877D]';

      case 'noteType':
        const noteStyles: Record<string, string> = {
          knowledge: 'bg-[#63809B]/15 text-[#4E6880] dark:bg-[#63809B]/25 dark:text-[#9FB7CE]',
          idea: 'bg-[#9B8963]/15 text-[#857451] dark:bg-[#9B8963]/25 dark:text-[#D1C2A3]',
          reference: 'bg-[#7B8D7A]/15 text-[#5F705E] dark:bg-[#7B8D7A]/20 dark:text-[#A8BCA7]',
          principle: 'bg-[#9B6382]/15 text-[#844E6C] dark:bg-[#9B6382]/25 dark:text-[#D29EBC]',
        };
        return noteStyles[value] || 'bg-[#EAE6DD] text-[#858176]';

      case 'projectStatus':
        if (value === 'completed') {
          return 'bg-[#7B8D7A]/15 text-[#5F705E] dark:bg-[#7B8D7A]/20 dark:text-[#A8BCA7]';
        }
        if (value === 'paused') {
          return 'bg-[#EAE6DD] text-[#858176] dark:bg-[#2A2824] dark:text-[#8C877D]';
        }
        return 'bg-[#9B8963]/15 text-[#857451] dark:bg-[#9B8963]/25 dark:text-[#D1C2A3]';

      default:
        return 'bg-[#EAE6DD] text-[#858176]';
    }
  };

  const formatLabel = (val: string) => {
    return val.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-medium tracking-wide uppercase',
        getStyles(),
        className
      )}
    >
      {formatLabel(String(value))}
    </span>
  );
};
