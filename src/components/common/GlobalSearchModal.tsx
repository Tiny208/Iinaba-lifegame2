import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, CheckSquare, Folder, Bookmark, BookOpen, Inbox, Feather, Calendar } from 'lucide-react';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { cn } from '@/lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm, results, isLoading } = useGlobalSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (item: SearchResult) => {
    onClose();
    navigate(item.url);
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-[#7B8D7A]" />;
      case 'project':
        return <Folder className="w-4 h-4 text-[#9B8963]" />;
      case 'area':
        return <Bookmark className="w-4 h-4 text-[#63809B]" />;
      case 'note':
        return <BookOpen className="w-4 h-4 text-[#9B6382]" />;
      case 'inbox':
        return <Inbox className="w-4 h-4 text-[#858176]" />;
      case 'reflection':
        return <Feather className="w-4 h-4 text-[#9B8963]" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-[#63809B]" />;
      default:
        return <Search className="w-4 h-4 text-[#858176]" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-[#171614]/40 dark:bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-start justify-center p-4 pt-20">
        <div
          className="relative w-full max-w-xl rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-lifted overflow-hidden text-[#242424] dark:text-[#EAE7DF]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3 border-b border-[#E5E1D8] dark:border-[#2E2C28]">
            <Search className="w-4 h-4 text-[#858176] mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks, projects, notes, areas, reflections..."
              className="w-full text-sm bg-transparent text-[#242424] dark:text-[#EAE7DF] placeholder-[#858176]/70 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-[#858176] hover:text-[#242424] p-1 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-block ml-2 text-[10px] text-[#858176] bg-[#F5F3ED] dark:bg-[#2A2824] px-1.5 py-0.5 rounded border border-[#E5E1D8] dark:border-[#2E2C28]">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-2">
            {isLoading && (
              <div className="py-6 text-center text-xs text-[#858176]">Searching library and tasks...</div>
            )}

            {!isLoading && searchTerm.trim().length >= 2 && results.length === 0 && (
              <div className="py-8 text-center text-xs text-[#858176]">
                No records matching &ldquo;{searchTerm}&rdquo;
              </div>
            )}

            {!isLoading && searchTerm.trim().length < 2 && (
              <div className="py-6 text-center text-xs text-[#858176]">
                Type at least 2 characters to search across your second brain...
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <div className="space-y-0.5">
                {results.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'flex items-start gap-3 p-2.5 rounded-[3px] cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-[#F5F3ED] dark:bg-[#2A2824]'
                          : 'hover:bg-[#F5F3ED]/60 dark:hover:bg-[#2A2824]/60'
                      )}
                    >
                      <div className="mt-0.5">{getResultIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-[#242424] dark:text-[#EAE7DF] truncate">
                            {item.title}
                          </span>
                          {item.metadata && (
                            <span className="text-[10px] uppercase tracking-wider text-[#858176] flex-shrink-0">
                              {item.metadata}
                            </span>
                          )}
                        </div>
                        {item.snippet && (
                          <p className="text-xs text-[#858176] dark:text-[#8C877D] truncate mt-0.5">
                            {item.snippet}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Guide */}
          <div className="px-4 py-2 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 flex items-center justify-between text-[11px] text-[#858176]">
            <span>Navigate with ↑ and ↓</span>
            <span>Press Enter to open</span>
          </div>
        </div>
      </div>
    </div>
  );
};
