import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Feather,
  BookMarked,
  RotateCcw,
  Compass,
  Check,
  Cloud,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { useReflections } from '@/hooks/useReflections';
import { useNotes } from '@/hooks/useNotes';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { ReflectionType, Note } from '@/types/database';
import { formatDate } from '@/lib/utils';

type ReflectTab = 'journal' | 'weekly_review' | 'principles' | 'circle_of_control';

export const ReflectPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as ReflectTab) || 'journal';

  const setTab = (tab: ReflectTab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E5E1D8] dark:border-[#2E2C28]">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#858176] font-mono">Stoic Practice & Intention</div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#242424] dark:text-[#EAE7DF] mt-1">
            Reflect
          </h2>
          <p className="text-xs text-[#858176] dark:text-[#8C877D] mt-0.5">
            Examine your days without judgment. Direct your attention with clarity.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#21201D] p-1 rounded-[4px] border border-[#E5E1D8] dark:border-[#2E2C28] text-xs font-medium overflow-x-auto">
          {(
            [
              { id: 'journal', label: 'Daily Journal' },
              { id: 'weekly_review', label: 'Weekly Review' },
              { id: 'principles', label: 'Principles' },
              { id: 'circle_of_control', label: 'Circle of Control' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-3 py-1.5 rounded-[3px] transition-colors whitespace-nowrap ${
                currentTab === item.id
                  ? 'bg-[#242424] text-[#F5F3ED] dark:bg-[#EAE7DF] dark:text-[#171614]'
                  : 'text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Views */}
      {currentTab === 'journal' && <DailyJournalView />}
      {currentTab === 'weekly_review' && <WeeklyReviewView />}
      {currentTab === 'principles' && <PrinciplesView />}
      {currentTab === 'circle_of_control' && <CircleOfControlView />}
    </div>
  );
};

// ==============================================================================
// A. DAILY JOURNAL (Free-form, Auto-saved, No forced streaks)
// ==============================================================================
const DailyJournalView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { reflections, isLoading, saveReflection } = useReflections('journal', selectedDate);

  const existingEntry = reflections[0];

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (existingEntry) {
      setTitle(existingEntry.title || '');
      setText(existingEntry.content.text || '');
    } else {
      setTitle('');
      setText('');
    }
    setSaveStatus('saved');
  }, [existingEntry?.id, selectedDate]);

  const triggerAutoSave = (newTitle: string, newText: string) => {
    setSaveStatus('saving');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        await saveReflection.mutateAsync({
          id: existingEntry?.id,
          reflection_type: 'journal',
          title: newTitle.trim() || null,
          content: { text: newText },
          entry_date: selectedDate,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Journal auto-save error:', err);
        setSaveStatus('error');
      }
    }, 1000);
  };

  return (
    <div className="max-w-3xl space-y-4">
      {/* Date & Auto-save Status */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#9B8963]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-mono bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] p-1 rounded text-[#242424] dark:text-[#EAE7DF]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#858176]">
          {saveStatus === 'saving' && (
            <>
              <Cloud className="w-3.5 h-3.5 animate-pulse text-[#9B8963]" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-3.5 h-3.5 text-[#7B8D7A]" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Journal Entry Card */}
      <div className="p-6 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            triggerAutoSave(e.target.value, text);
          }}
          placeholder="Journal title or mood of the day (optional)..."
          className="w-full font-serif text-xl sm:text-2xl font-medium bg-transparent border-0 text-[#242424] dark:text-[#EAE7DF] placeholder-[#858176]/50 focus:outline-none"
        />

        <textarea
          rows={16}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            triggerAutoSave(title, e.target.value);
          }}
          placeholder="Pour out your mind without self-censorship. What happened? What emotions surfaced? What can you learn?"
          className="w-full resize-none p-3 text-sm leading-relaxed bg-[#F5F3ED]/30 dark:bg-[#171614]/30 border border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 rounded-[4px] text-[#242424] dark:text-[#EAE7DF] placeholder-[#858176]/50 focus:outline-none focus:border-[#9B8963]"
        />
      </div>
    </div>
  );
};

// ==============================================================================
// B. WEEKLY REVIEW (3 Stoic Prompts)
// ==============================================================================
const WeeklyReviewView: React.FC = () => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { reflections, isLoading, saveReflection } = useReflections('weekly_review');

  const activeReview = reflections[0];

  const [spentTime, setSpentTime] = useState('');
  const [drainedEnergy, setDrainedEnergy] = useState('');
  const [nextWeekFocus, setNextWeekFocus] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeReview?.content?.weeklyReview) {
      setSpentTime(activeReview.content.weeklyReview.spentTime || '');
      setDrainedEnergy(activeReview.content.weeklyReview.drainedEnergy || '');
      setNextWeekFocus(activeReview.content.weeklyReview.nextWeekFocus || '');
    }
  }, [activeReview?.id]);

  const triggerAutoSave = (s: string, d: string, n: string) => {
    setSaveStatus('saving');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        await saveReflection.mutateAsync({
          id: activeReview?.id,
          reflection_type: 'weekly_review',
          title: `Weekly Review — ${todayStr}`,
          content: {
            weeklyReview: {
              spentTime: s,
              drainedEnergy: d,
              nextWeekFocus: n,
            },
          },
          entry_date: todayStr,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Weekly review auto-save error:', err);
        setSaveStatus('error');
      }
    }, 1000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
        <h3 className="font-serif text-lg font-medium text-[#242424] dark:text-[#EAE7DF]">
          Weekly Examination
        </h3>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#858176]">
          {saveStatus === 'saving' && (
            <>
              <Cloud className="w-3.5 h-3.5 animate-pulse text-[#9B8963]" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-3.5 h-3.5 text-[#7B8D7A]" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Prompt 1 */}
      <div className="p-5 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-2">
        <h4 className="font-serif text-base font-medium text-[#242424] dark:text-[#EAE7DF]">
          1. What did I spend my time on this week?
        </h4>
        <p className="text-xs text-[#858176]">Reflect objectively on where your hours went.</p>
        <textarea
          rows={4}
          value={spentTime}
          onChange={(e) => {
            setSpentTime(e.target.value);
            triggerAutoSave(e.target.value, drainedEnergy, nextWeekFocus);
          }}
          placeholder="Major outputs, conversations, projects, and unexpected diversions..."
          className="w-full p-2.5 text-sm bg-[#F5F3ED]/30 dark:bg-[#171614]/30 border border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 rounded text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
        />
      </div>

      {/* Prompt 2 */}
      <div className="p-5 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-2">
        <h4 className="font-serif text-base font-medium text-[#242424] dark:text-[#EAE7DF]">
          2. What consumed my energy without providing meaningful value?
        </h4>
        <p className="text-xs text-[#858176]">Identify friction, futile worry, or misaligned commitments.</p>
        <textarea
          rows={4}
          value={drainedEnergy}
          onChange={(e) => {
            setDrainedEnergy(e.target.value);
            triggerAutoSave(spentTime, e.target.value, nextWeekFocus);
          }}
          placeholder="Unproductive discussions, excessive checking, things outside your control..."
          className="w-full p-2.5 text-sm bg-[#F5F3ED]/30 dark:bg-[#171614]/30 border border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 rounded text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
        />
      </div>

      {/* Prompt 3 */}
      <div className="p-5 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-2">
        <h4 className="font-serif text-base font-medium text-[#242424] dark:text-[#EAE7DF]">
          3. What do I want to focus on next week?
        </h4>
        <p className="text-xs text-[#858176]">Determine 1 to 3 primary goals that matter.</p>
        <textarea
          rows={4}
          value={nextWeekFocus}
          onChange={(e) => {
            setNextWeekFocus(e.target.value);
            triggerAutoSave(spentTime, drainedEnergy, e.target.value);
          }}
          placeholder="The essential actions that will give meaning to next week..."
          className="w-full p-2.5 text-sm bg-[#F5F3ED]/30 dark:bg-[#171614]/30 border border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 rounded text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
        />
      </div>
    </div>
  );
};

// ==============================================================================
// C. PRINCIPLES VIEW (Personal Compass)
// ==============================================================================
const PrinciplesView: React.FC = () => {
  const { notes, isLoading, createNote, deleteNote } = useNotes({ noteType: 'principle' });
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createNote.mutateAsync({
      title: newTitle.trim(),
      content: newContent.trim(),
      note_type: 'principle',
    });

    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
        <div>
          <h3 className="font-serif text-xl font-medium text-[#242424] dark:text-[#EAE7DF]">Guiding Principles</h3>
          <p className="text-xs text-[#858176]">Rules and axioms you use to navigate life decisions.</p>
        </div>

        {!isAdding && (
          <Button variant="primary" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Principle
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 rounded bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] space-y-3">
          <input
            type="text"
            required
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Principle statement (e.g. Choose discomfort over resentment)..."
            className="w-full p-2 text-sm bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
          />
          <textarea
            rows={2}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Context, application, or reasoning..."
            className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded text-[#242424] dark:text-[#EAE7DF] focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Principle
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <CardSkeleton rows={3} />
      ) : notes.length === 0 ? (
        <EmptyState
          title="No principles written yet"
          description="Formulate your internal constitution one truth at a time."
          action={
            <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
              Draft Principle
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {notes.map((principle) => (
            <div
              key={principle.id}
              className="p-5 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-serif text-base font-semibold text-[#242424] dark:text-[#EAE7DF]">
                  &ldquo;{principle.title}&rdquo;
                </h4>
                <button
                  onClick={() => deleteNote.mutate(principle.id)}
                  className="text-[#858176] hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {principle.content && (
                <p className="text-xs text-[#858176] dark:text-[#8C877D] leading-relaxed">
                  {principle.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==============================================================================
// D. CIRCLE OF CONTROL (Control, Influence, Accept Stoic Matrix)
// ==============================================================================
const CircleOfControlView: React.FC = () => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { reflections, saveReflection } = useReflections('circle_of_control');

  const active = reflections[0];

  const [problem, setProblem] = useState('');
  const [controlItems, setControlItems] = useState<string[]>([]);
  const [influenceItems, setInfluenceItems] = useState<string[]>([]);
  const [acceptItems, setAcceptItems] = useState<string[]>([]);

  const [inputControl, setInputControl] = useState('');
  const [inputInfluence, setInputInfluence] = useState('');
  const [inputAccept, setInputAccept] = useState('');

  useEffect(() => {
    if (active?.content?.circleOfControl) {
      setProblem(active.content.circleOfControl.problem || '');
      setControlItems(active.content.circleOfControl.control || []);
      setInfluenceItems(active.content.circleOfControl.influence || []);
      setAcceptItems(active.content.circleOfControl.accept || []);
    }
  }, [active?.id]);

  const saveState = async (p: string, c: string[], i: string[], a: string[]) => {
    await saveReflection.mutateAsync({
      id: active?.id,
      reflection_type: 'circle_of_control',
      title: p ? `Circle of Control: ${p.substring(0, 40)}` : 'Circle of Control Examination',
      content: {
        circleOfControl: {
          problem: p,
          control: c,
          influence: i,
          accept: a,
        },
      },
      entry_date: todayStr,
    });
  };

  const handleAddControl = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputControl.trim()) {
      e.preventDefault();
      const next = [...controlItems, inputControl.trim()];
      setControlItems(next);
      setInputControl('');
      saveState(problem, next, influenceItems, acceptItems);
    }
  };

  const handleAddInfluence = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputInfluence.trim()) {
      e.preventDefault();
      const next = [...influenceItems, inputInfluence.trim()];
      setInfluenceItems(next);
      setInputInfluence('');
      saveState(problem, controlItems, next, acceptItems);
    }
  };

  const handleAddAccept = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputAccept.trim()) {
      e.preventDefault();
      const next = [...acceptItems, inputAccept.trim()];
      setAcceptItems(next);
      setInputAccept('');
      saveState(problem, controlItems, influenceItems, next);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
        <h3 className="font-serif text-xl font-medium text-[#242424] dark:text-[#EAE7DF]">
          Stoic Circle of Control
        </h3>
        <p className="text-xs text-[#858176]">
          Epictetus: &ldquo;Some things are in our control and others not.&rdquo; Clarify your dilemma.
        </p>
      </div>

      {/* Problem Description */}
      <div className="p-4 rounded bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] space-y-2">
        <label className="block text-xs font-serif font-medium text-[#242424] dark:text-[#EAE7DF]">
          Describe the situation or anxiety causing you concern:
        </label>
        <input
          type="text"
          value={problem}
          onChange={(e) => {
            setProblem(e.target.value);
            saveState(e.target.value, controlItems, influenceItems, acceptItems);
          }}
          placeholder="e.g. Upcoming client renegotiation, project delay, health issue..."
          className="w-full p-2.5 text-sm bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
        />
      </div>

      {/* The 3 Columns: Control, Influence, Accept */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Control */}
        <div className="p-4 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#7B8D7A]/40 shadow-subtle space-y-3">
          <div className="border-b border-[#7B8D7A]/30 pb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#5F705E] dark:text-[#A8BCA7] block">
              100% Up To Me
            </span>
            <h4 className="font-serif text-base font-semibold text-[#242424] dark:text-[#EAE7DF]">Control</h4>
            <p className="text-[11px] text-[#858176]">Your judgments, preparation, habits, reactions, and integrity.</p>
          </div>

          <input
            type="text"
            value={inputControl}
            onChange={(e) => setInputControl(e.target.value)}
            onKeyDown={handleAddControl}
            placeholder="Type & press Enter..."
            className="w-full p-2 text-xs bg-[#F5F3ED]/40 dark:bg-[#171614]/40 border border-[#E5E1D8] dark:border-[#2E2C28] rounded"
          />

          <ul className="space-y-1.5 text-xs">
            {controlItems.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between gap-2 p-2 rounded bg-[#7B8D7A]/10 text-[#242424] dark:text-[#EAE7DF]">
                <span>{item}</span>
                <button
                  onClick={() => {
                    const next = controlItems.filter((_, i) => i !== idx);
                    setControlItems(next);
                    saveState(problem, next, influenceItems, acceptItems);
                  }}
                  className="text-[#858176] hover:text-red-500"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Influence */}
        <div className="p-4 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#9B8963]/40 shadow-subtle space-y-3">
          <div className="border-b border-[#9B8963]/30 pb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#857451] dark:text-[#D1C2A3] block">
              Partial Sway
            </span>
            <h4 className="font-serif text-base font-semibold text-[#242424] dark:text-[#EAE7DF]">Influence</h4>
            <p className="text-[11px] text-[#858176]">Communication, persuasion, effort, and setting expectations.</p>
          </div>

          <input
            type="text"
            value={inputInfluence}
            onChange={(e) => setInputInfluence(e.target.value)}
            onKeyDown={handleAddInfluence}
            placeholder="Type & press Enter..."
            className="w-full p-2 text-xs bg-[#F5F3ED]/40 dark:bg-[#171614]/40 border border-[#E5E1D8] dark:border-[#2E2C28] rounded"
          />

          <ul className="space-y-1.5 text-xs">
            {influenceItems.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between gap-2 p-2 rounded bg-[#9B8963]/10 text-[#242424] dark:text-[#EAE7DF]">
                <span>{item}</span>
                <button
                  onClick={() => {
                    const next = influenceItems.filter((_, i) => i !== idx);
                    setInfluenceItems(next);
                    saveState(problem, controlItems, next, acceptItems);
                  }}
                  className="text-[#858176] hover:text-red-500"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Accept */}
        <div className="p-4 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-3">
          <div className="border-b border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 pb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#858176] block">
              Beyond You
            </span>
            <h4 className="font-serif text-base font-semibold text-[#242424] dark:text-[#EAE7DF]">Accept</h4>
            <p className="text-[11px] text-[#858176]">Others&rsquo; decisions, past events, market conditions, the weather.</p>
          </div>

          <input
            type="text"
            value={inputAccept}
            onChange={(e) => setInputAccept(e.target.value)}
            onKeyDown={handleAddAccept}
            placeholder="Type & press Enter..."
            className="w-full p-2 text-xs bg-[#F5F3ED]/40 dark:bg-[#171614]/40 border border-[#E5E1D8] dark:border-[#2E2C28] rounded"
          />

          <ul className="space-y-1.5 text-xs">
            {acceptItems.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between gap-2 p-2 rounded bg-[#EAE6DD]/50 dark:bg-[#2A2824] text-[#858176]">
                <span>{item}</span>
                <button
                  onClick={() => {
                    const next = acceptItems.filter((_, i) => i !== idx);
                    setAcceptItems(next);
                    saveState(problem, controlItems, influenceItems, next);
                  }}
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
