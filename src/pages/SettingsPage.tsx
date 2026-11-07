import React, { useState } from 'react';
import {
  Settings,
  Database,
  Download,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User,
  Shield,
  Key,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase, isSupabaseConfigured, saveCustomSupabaseConfig, clearCustomSupabaseConfig } from '@/lib/supabase';
import { Button } from '@/components/common/Button';

export const SettingsPage: React.FC = () => {
  const { user, profile, signOut, isConfigured } = useAuth();
  const { theme, setTheme } = useTheme();

  const [supabaseUrl, setSupabaseUrl] = useState(
    () => localStorage.getItem('inaba_supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(
    () => localStorage.getItem('inaba_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) return;
    saveCustomSupabaseConfig(supabaseUrl, supabaseAnonKey);
    setSaveSuccess(true);
  };

  const handleClearConfig = () => {
    clearCustomSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
  };

  // One-click comprehensive JSON data export
  const handleExportBackup = async () => {
    if (!user) return;
    setIsExporting(true);

    try {
      const [
        { data: tasks },
        { data: projects },
        { data: areas },
        { data: notes },
        { data: inbox },
        { data: reflections },
        { data: events },
        { data: noteLinks },
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('areas').select('*').eq('user_id', user.id),
        supabase.from('notes').select('*').eq('user_id', user.id),
        supabase.from('inbox_items').select('*').eq('user_id', user.id),
        supabase.from('reflections').select('*').eq('user_id', user.id),
        supabase.from('calendar_events').select('*').eq('user_id', user.id),
        supabase.from('note_links').select('*').eq('user_id', user.id),
      ]);

      const backupData = {
        exported_at: new Date().toISOString(),
        version: '1.0.0',
        user_id: user.id,
        user_email: user.email,
        counts: {
          tasks: tasks?.length || 0,
          projects: projects?.length || 0,
          areas: areas?.length || 0,
          notes: notes?.length || 0,
          inbox_items: inbox?.length || 0,
          reflections: reflections?.length || 0,
          calendar_events: events?.length || 0,
        },
        data: {
          tasks,
          projects,
          areas,
          notes,
          inbox_items: inbox,
          reflections,
          calendar_events: events,
          note_links: noteLinks,
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inaba-second-brain-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export backup data.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Editorial Header */}
      <div className="pb-4 border-b border-[#E5E1D8] dark:border-[#2E2C28]">
        <div className="text-xs uppercase tracking-widest text-[#858176] font-mono">System & Profile</div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-[#242424] dark:text-[#EAE7DF] mt-1">
          Settings
        </h2>
        <p className="text-xs text-[#858176] dark:text-[#8C877D] mt-0.5">
          Configure connection, backup your knowledge base, and manage preferences.
        </p>
      </div>

      {/* 1. Account & Profile */}
      <section className="p-6 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-[#9B8963]" />
          <h3 className="font-serif text-lg font-medium text-[#242424] dark:text-[#EAE7DF]">Account</h3>
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <div className="text-sm font-medium text-[#242424] dark:text-[#EAE7DF]">
                {profile?.full_name || 'Inaba User'}
              </div>
              <div className="text-xs text-[#858176] font-mono mt-0.5">{user.email}</div>
            </div>

            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#858176]">Not signed in.</span>
            <a href="/auth">
              <Button variant="primary" size="sm">
                Sign In / Setup Account
              </Button>
            </a>
          </div>
        )}
      </section>

      {/* 2. Supabase Connection Configuration */}
      <section className="p-6 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#9B8963]" />
            <h3 className="font-serif text-lg font-medium text-[#242424] dark:text-[#EAE7DF]">
              Database & Cloud Connection
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            {isConfigured ? (
              <span className="inline-flex items-center gap-1 text-[#5F705E] dark:text-[#A8BCA7] bg-[#7B8D7A]/15 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#857451] dark:text-[#D1C2A3] bg-[#9B8963]/15 px-2 py-0.5 rounded">
                <AlertCircle className="w-3.5 h-3.5" />
                Unconfigured
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-[#858176] leading-relaxed">
          Provide your Supabase project credentials. These can also be configured via <code className="font-mono bg-[#F5F3ED] dark:bg-[#2A2824] px-1 py-0.5 rounded">.env</code>.
          Never expose your <strong className="text-red-600">SUPABASE_SERVICE_ROLE_KEY</strong> here.
        </p>

        <form onSubmit={handleSaveConfig} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">
              Project URL (VITE_SUPABASE_URL)
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full p-2 text-xs font-mono bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">
              Anon Key (VITE_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full p-2 text-xs font-mono bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearConfig}
              className="text-xs text-[#858176]"
            >
              Reset to Defaults
            </Button>

            <Button type="submit" variant="primary" size="sm">
              Save Connection Credentials
            </Button>
          </div>
        </form>

        {/* Database Migration Instructions */}
        <div className="p-3.5 rounded bg-[#F5F3ED] dark:bg-[#2A2824] border border-[#E5E1D8]/60 dark:border-[#2E2C28] text-xs space-y-1.5 mt-2">
          <span className="font-semibold text-[11px] text-[#242424] dark:text-[#EAE7DF] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#9B8963]" />
            Database Migrations:
          </span>
          <p className="text-[#858176] leading-relaxed">
            Run the SQL script located at <code className="font-mono bg-white dark:bg-[#21201D] px-1 py-0.5 rounded">supabase/migrations/20261107000000_inaba_init.sql</code> inside your Supabase Project SQL Editor to provision all 10 tables, triggers, and Row Level Security policies.
          </p>
        </div>
      </section>

      {/* 3. Appearance / Theme */}
      <section className="p-6 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-4">
        <h3 className="font-serif text-lg font-medium text-[#242424] dark:text-[#EAE7DF]">
          Appearance
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { id: 'light', label: 'Light', icon: Sun, desc: 'Warm Parchment' },
              { id: 'dark', label: 'Dark', icon: Moon, desc: 'Quiet Obsidian' },
              { id: 'system', label: 'System', icon: Laptop, desc: 'OS Preference' },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={`p-3 rounded-[4px] border text-left transition-colors flex flex-col justify-between h-20 ${
                  isSelected
                    ? 'border-[#9B8963] bg-[#9B8963]/10 ring-1 ring-[#9B8963]/40'
                    : 'border-[#E5E1D8] dark:border-[#2E2C28] hover:bg-[#F5F3ED]/40 dark:hover:bg-[#2A2824]/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#9B8963]' : 'text-[#858176]'}`} />
                <div>
                  <div className="text-xs font-medium text-[#242424] dark:text-[#EAE7DF]">{item.label}</div>
                  <div className="text-[10px] text-[#858176]">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Data Export & Backup */}
      <section className="p-6 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-medium text-[#242424] dark:text-[#EAE7DF]">
              Data Sovereignty & Backup
            </h3>
            <p className="text-xs text-[#858176] mt-0.5">
              Export your entire second brain in open JSON format anytime. No vendor lock-in.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportBackup}
            isLoading={isExporting}
            disabled={!user}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export JSON
          </Button>
        </div>
      </section>
    </div>
  );
};
