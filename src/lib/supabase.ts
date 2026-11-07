import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or localStorage override
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('inaba_supabase_url') : null;
  const localAnonKey = typeof window !== 'undefined' ? localStorage.getItem('inaba_supabase_anon_key') : null;

  const url = (localUrl && localUrl.trim().length > 0) ? localUrl.trim() : (envUrl || '').trim();
  const anonKey = (localAnonKey && localAnonKey.trim().length > 0) ? localAnonKey.trim() : (envAnonKey || '').trim();

  return { url, anonKey };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('http') &&
    url !== 'https://your-project-id.supabase.co' &&
    anonKey !== 'your-anon-key-here'
  );
};

export const saveCustomSupabaseConfig = (url: string, anonKey: string) => {
  localStorage.setItem('inaba_supabase_url', url.trim());
  localStorage.setItem('inaba_supabase_anon_key', anonKey.trim());
  window.location.reload();
};

export const clearCustomSupabaseConfig = () => {
  localStorage.removeItem('inaba_supabase_url');
  localStorage.removeItem('inaba_supabase_anon_key');
  window.location.reload();
};

const { url, anonKey } = getSupabaseConfig();

// Safe fallback placeholder if unconfigured to prevent crash at initialization
const effectiveUrl = (url && url.startsWith('http')) ? url : 'https://placeholder.supabase.co';
const effectiveAnonKey = anonKey || 'placeholder-anon-key';

export const supabase = createClient(effectiveUrl, effectiveAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'inaba-auth-token',
  },
});
