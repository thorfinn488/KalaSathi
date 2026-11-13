import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Phone, Lock, LogIn, UserCheck, Sparkles, AlertCircle, Shield, Store, Palette, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onNavigateRegister }) => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const showDemoProfiles = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';
  const [phone, setPhone] = useState(showDemoProfiles ? '9811122233' : '');
  const [password, setPassword] = useState(showDemoProfiles ? 'Password123' : '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, customPhone?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(customPhone || phone, customPassword || password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
      setActiveQuickRole(null);
    }
  };

  const handleInstantDemoLogin = async (demoPhone: string, roleName: string) => {
    setPhone(demoPhone);
    setPassword('Password123');
    setActiveQuickRole(roleName);
    await handleSubmit(undefined, demoPhone, 'Password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 auth-shell">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl shadow-indigo-950/50 space-y-7">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 text-white font-black text-3xl shadow-xl shadow-orange-500/25 mb-1 animate-in zoom-in-75 duration-300">
            क
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black text-white tracking-tight">{t.appName}</h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              2.0 Studio
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            AI-powered market intelligence, cataloging, & fair pricing for Indian artisans.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl flex items-start gap-2.5 text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* Quick 1-Click Persona Login */}
        {showDemoProfiles && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              1-Click Demo Profiles
            </span>
            <span className="text-[10px] text-slate-400">Instant Access</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleInstantDemoLogin('9811122233', 'artisan')}
              className="group p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-400/40 text-left transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <ArrowRight className="w-3 h-3 text-amber-400/50 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-amber-200">Sunita Devi</p>
              <p className="text-[10px] text-amber-400/70 font-medium">Artisan</p>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleInstantDemoLogin('9844455566', 'buyer')}
              className="group p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/15 hover:border-indigo-400/40 text-left transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <Store className="w-3.5 h-3.5 text-indigo-400" />
                <ArrowRight className="w-3 h-3 text-indigo-400/50 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-indigo-200">FabIndia</p>
              <p className="text-[10px] text-indigo-400/70 font-medium">Retail Buyer</p>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleInstantDemoLogin('9876543210', 'admin')}
              className="group p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-400/40 text-left transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <ArrowRight className="w-3 h-3 text-emerald-400/50 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-200">Handloom</p>
              <p className="text-[10px] text-emerald-400/70 font-medium">Officer (Admin)</p>
            </button>
          </div>
        </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.phone}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:bg-white/[0.08] focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-medium text-sm text-white placeholder-slate-500 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:bg-white/[0.08] focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 font-medium text-sm text-white placeholder-slate-500 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-sm active:scale-98 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? (activeQuickRole ? `Connecting as ${activeQuickRole}...` : 'Signing In...') : t.login}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-1 border-t border-white/10">
          <p className="text-xs text-slate-400">
            Don't have an artisan studio account?{' '}
            <button
              onClick={onNavigateRegister}
              className="text-amber-300 font-bold hover:underline inline-flex items-center gap-1 ml-1"
            >
              <UserCheck className="w-3.5 h-3.5" />
              {t.register}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
