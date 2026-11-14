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
    <div className="min-h-screen flex items-center justify-center p-4 bg-heritage-ivory font-sans relative">
      <div className="absolute inset-0 bg-hero-woven-bg opacity-20 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-heritage-sand bg-white p-7 sm:p-9 shadow-2xl space-y-7 text-heritage-navy">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-heritage-navy text-heritage-gold font-serif font-black text-3xl shadow-lg border border-heritage-sand/40 mb-1">
            क
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black font-serif text-heritage-navy tracking-tight">{t.appName}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-heritage-ivory border border-heritage-sand text-[10px] font-bold text-heritage-terracotta uppercase tracking-wider">
              2.0 Studio
            </span>
          </div>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            AI-powered market intelligence, cataloging, &amp; fair pricing for Indian artisans.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-300 p-3.5 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* Quick 1-Click Persona Login */}
        {showDemoProfiles && (
        <div className="rounded-2xl border border-heritage-sand bg-heritage-ivory p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-heritage-terracotta flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-heritage-gold animate-pulse" />
              1-Click Demo Profiles
            </span>
            <span className="text-[10px] text-stone-400">Instant Access</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleInstantDemoLogin('9811122233', 'artisan')}
              className="group p-2.5 rounded-xl border border-heritage-sand bg-white hover:border-heritage-gold hover:shadow-sm text-left transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <Palette className="w-3.5 h-3.5 text-heritage-terracotta" />
                <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-heritage-navy group-hover:text-heritage-terracotta">Sunita Devi</p>
              <p className="text-[10px] text-heritage-gold font-bold">Artisan</p>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleInstantDemoLogin('9844455566', 'buyer')}
              className="group p-2.5 rounded-xl border border-heritage-sand bg-white hover:border-heritage-navy hover:shadow-sm text-left transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <Store className="w-3.5 h-3.5 text-heritage-navy" />
                <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-heritage-navy group-hover:text-heritage-navy">FabIndia</p>
              <p className="text-[10px] text-stone-500 font-bold">Retail Buyer</p>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleInstantDemoLogin('9876543210', 'admin')}
              className="group p-2.5 rounded-xl border border-heritage-sand bg-white hover:border-emerald-600 hover:shadow-sm text-left transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-heritage-navy group-hover:text-emerald-800">Handloom</p>
              <p className="text-[10px] text-emerald-700 font-bold">Officer</p>
            </button>
          </div>
        </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
              {t.phone}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-heritage-sand bg-heritage-ivory text-heritage-navy placeholder-stone-400 focus:border-heritage-gold focus:bg-white font-medium text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
              {t.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-heritage-sand bg-heritage-ivory text-heritage-navy placeholder-stone-400 focus:border-heritage-gold focus:bg-white font-medium text-sm transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? (activeQuickRole ? `Connecting as ${activeQuickRole}...` : 'Signing In...') : t.login}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-heritage-sand/60">
          <p className="text-xs text-stone-500">
            Don't have an artisan studio account?{' '}
            <button
              onClick={onNavigateRegister}
              className="text-heritage-terracotta font-bold hover:underline inline-flex items-center gap-1 ml-1"
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
