import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { AlertCircle, Lock, Mail, User } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, isConfigured } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [setupCompleteMsg, setSetupCompleteMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSetupCompleteMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          navigate('/');
        }
      } else {
        const { error } = await signUp(email.trim(), password, fullName.trim() || 'Inaba User');
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSetupCompleteMsg(
            'Account setup initiated! If email confirmation is enabled on your Supabase project, check your inbox to confirm, or proceed to sign in.'
          );
          setMode('signin');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3ED] dark:bg-[#171614] text-[#242424] dark:text-[#EAE7DF] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded bg-[#242424] dark:bg-[#EAE7DF] flex items-center justify-center text-[#F5F3ED] dark:text-[#171614] font-serif font-bold text-lg mx-auto">
            稲
          </div>
          <h1 className="font-serif text-2xl font-medium tracking-tight">
            INABA // SECOND BRAIN
          </h1>
          <p className="text-xs text-[#858176] dark:text-[#8C877D] font-serif italic">
            Less to manage. More to live.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] p-6 shadow-lifted space-y-5">
          {!isConfigured && (
            <div className="p-3 rounded bg-[#9B8963]/10 border border-[#9B8963]/30 text-xs text-[#857451] dark:text-[#D1C2A3] space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Supabase Not Configured</span>
              </div>
              <p className="text-[11px]">
                Please enter your Supabase Project URL and Anon Key in{' '}
                <Link to="/settings" className="underline font-semibold">
                  Settings
                </Link>{' '}
                or your .env file to enable cloud login.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {setupCompleteMsg && (
            <div className="p-3 rounded bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-xs">
              {setupCompleteMsg}
            </div>
          )}

          <div className="flex border-b border-[#E5E1D8] dark:border-[#2E2C28] text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 font-medium border-b-2 -mb-[1px] transition-colors ${
                mode === 'signin'
                  ? 'border-[#242424] dark:border-[#EAE7DF] text-[#242424] dark:text-[#EAE7DF]'
                  : 'border-transparent text-[#858176]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 font-medium border-b-2 -mb-[1px] transition-colors ${
                mode === 'signup'
                  ? 'border-[#242424] dark:border-[#EAE7DF] text-[#242424] dark:text-[#EAE7DF]'
                  : 'border-transparent text-[#858176]'
              }`}
            >
              Initial Setup
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">
                  Full Name
                </label>
                <div className="flex items-center gap-2 px-3 py-2 border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] bg-[#F5F3ED]/30 dark:bg-[#171614]/30">
                  <User className="w-3.5 h-3.5 text-[#858176]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Marcus Aurelius"
                    className="w-full text-xs bg-transparent text-[#242424] dark:text-[#EAE7DF] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">
                Email
              </label>
              <div className="flex items-center gap-2 px-3 py-2 border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] bg-[#F5F3ED]/30 dark:bg-[#171614]/30">
                <Mail className="w-3.5 h-3.5 text-[#858176]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full text-xs bg-transparent text-[#242424] dark:text-[#EAE7DF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">
                Password
              </label>
              <div className="flex items-center gap-2 px-3 py-2 border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] bg-[#F5F3ED]/30 dark:bg-[#171614]/30">
                <Lock className="w-3.5 h-3.5 text-[#858176]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-transparent text-[#242424] dark:text-[#EAE7DF] focus:outline-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isLoading}
            >
              {mode === 'signin' ? 'Sign In' : 'Complete Setup'}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF] transition-colors"
          >
            ← Return to Workspace
          </Link>
        </div>
      </div>
    </div>
  );
};
