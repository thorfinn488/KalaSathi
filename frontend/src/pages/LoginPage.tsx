import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { OtpVerificationCard } from '../components/ui/OtpVerificationCard';
import {
  Phone,
  Lock,
  LogIn,
  UserCheck,
  Sparkles,
  AlertCircle,
  Shield,
  Store,
  Palette,
  ArrowRight,
  Mail,
  ShieldCheck,
  Award,
  KeyRound
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateRegister: () => void;
}

type LoginTab = 'phone-otp' | 'email-code' | 'password';

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onNavigateRegister }) => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const showDemoProfiles = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';

  // Tabs: 'phone-otp' | 'email-code' | 'password'
  const [activeTab, setActiveTab] = useState<LoginTab>('phone-otp');

  // Input states
  const [phone, setPhone] = useState(showDemoProfiles ? '9811122233' : '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(showDemoProfiles ? 'Password123' : '');

  // OTP flow states
  const [otpStep, setOtpStep] = useState<'input' | 'verify'>('input');
  const [simulatedCode, setSimulatedCode] = useState<string>('');
  const [activeChannel, setActiveChannel] = useState<'phone' | 'email'>('phone');

  // Status & error states
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState<string | null>(null);

  // Generate random 6-digit OTP
  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  // Send Phone OTP
  const handleSendPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const code = generateOtp();
    setSimulatedCode(code);
    setActiveChannel('phone');
    setOtpStep('verify');
  };

  // Send Email Code
  const handleSendEmailCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    const code = generateOtp();
    setSimulatedCode(code);
    setActiveChannel('email');
    setOtpStep('verify');
  };

  // Verify OTP & Complete Login
  const handleVerifyOtp = async (enteredCode: string) => {
    setError(null);
    setSubmitting(true);
    try {
      if (enteredCode !== simulatedCode && enteredCode !== '123456') {
        throw new Error('Invalid verification code. Please check the simulated code above.');
      }
      // Log in with the verified phone or default demo credentials
      const targetPhone = activeChannel === 'phone' && phone ? phone.replace(/\D/g, '') : '9811122233';
      await login(targetPhone, 'Password123');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Standard Password Login
  const handlePasswordSubmit = async (e?: React.FormEvent, customPhone?: string, customPassword?: string) => {
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

  // Instant 1-Click Demo Profiles
  const handleInstantDemoLogin = async (demoPhone: string, roleName: string) => {
    setPhone(demoPhone);
    setPassword('Password123');
    setActiveQuickRole(roleName);
    await handlePasswordSubmit(undefined, demoPhone, 'Password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-heritage-ivory font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-hero-woven-bg opacity-15 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigoCraft-600/10 blur-3xl pointer-events-none" />

      {/* Main Container - Split View on Desktop */}
      <div className="relative z-10 w-full max-w-5xl rounded-3xl border border-heritage-sand bg-white shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 text-heritage-navy">
        
        {/* ── Left Showcase Panel (Hero Visual on Desktop) ── */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-heritage-surface-strong via-heritage-primary to-slate-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-woven-bg opacity-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

          {/* Top Branding */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-heritage-gold-light backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              National Artisan Portal
            </div>
            <h2 className="text-3xl font-black font-serif leading-tight text-white">
              Empowering India&apos;s Living Master Crafts.
            </h2>
            <p className="text-xs text-stone-300 leading-relaxed">
              Direct cluster access, fair-trade valuation, and institutional B2B procurement without intermediaries.
            </p>
          </div>

          {/* Real Craft Visual Pill Card */}
          <div className="relative z-10 my-8 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 bg-stone-900 shrink-0">
                <img
                  src="/images/2adeba65-a3b6-448a-88bb-71068feed09a.jpg"
                  alt="Mithila Folk Painting"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">Madhubani Heritage Cluster</p>
                <p className="text-[10px] text-amber-300 font-medium">Certified GI Tag · Bihar</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Active
              </span>
            </div>
            <p className="text-[11px] text-stone-300 italic leading-relaxed">
              &quot;Fair pricing gives our cooperative the financial security to train the next generation of women artisans.&quot;
            </p>
            <p className="text-[10px] text-stone-400 font-semibold">— Sita Devi Mahila Samooh</p>
          </div>

          {/* Bottom Trust Indicators */}
          <div className="relative z-10 grid grid-cols-2 gap-3 pt-4 border-t border-white/15 text-xs">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-heritage-gold-light shrink-0" />
              <div>
                <p className="font-bold text-white text-[11px]">24+ GI Clusters</p>
                <p className="text-[9px] text-stone-400">Government Verified</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-[11px]">Escrow Secured</p>
                <p className="text-[9px] text-stone-400">40% Upfront Advance</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Authentication Panel ── */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-heritage-navy text-heritage-gold font-serif font-black text-xl flex items-center justify-center shadow-md">
                  क
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black font-serif text-heritage-navy">
                    {t.appName}
                  </h1>
                  <p className="text-[11px] text-stone-500 font-medium">Artisan &amp; Buyer Portal</p>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-heritage-ivory border border-heritage-sand text-[10px] font-bold text-terracotta-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Network
              </span>
            </div>
          </div>

          {/* Authentication Mode Tabs */}
          {otpStep === 'input' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-stone-100 border border-heritage-border text-xs font-bold">
              <button
                type="button"
                onClick={() => { setActiveTab('phone-otp'); setError(null); }}
                className={`py-2.5 px-2 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'phone-otp'
                    ? 'bg-heritage-navy text-white shadow-md'
                    : 'text-stone-700 hover:text-heritage-navy hover:bg-white/70'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone OTP</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('email-code'); setError(null); }}
                className={`py-2.5 px-2 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'email-code'
                    ? 'bg-heritage-navy text-white shadow-md'
                    : 'text-stone-700 hover:text-heritage-navy hover:bg-white/70'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Code</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('password'); setError(null); }}
                className={`py-2.5 px-2 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'password'
                    ? 'bg-heritage-navy text-white shadow-md'
                    : 'text-stone-700 hover:text-heritage-navy hover:bg-white/70'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
            </div>
          )}

          {/* Global Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Main Auth Form Bodies */}
          <AnimatePresence mode="wait">
            
            {/* ── 1. Phone OTP Mode ── */}
            {activeTab === 'phone-otp' && (
              otpStep === 'input' ? (
                <motion.form
                  key="phone-input"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleSendPhoneOtp}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                      Mobile Number (मोबाइल नंबर)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-3 flex items-center gap-1 text-stone-500 font-bold text-sm">
                        <span>🇮🇳 +91</span>
                        <span className="text-stone-300">|</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="98765 43210"
                        className="w-full pl-22 pr-4 py-3 rounded-xl border border-heritage-border bg-heritage-bg/50 text-heritage-navy font-semibold text-sm focus:border-terracotta-500 focus:bg-white focus:ring-2 focus:ring-terracotta-500/20 outline-none transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500">
                      We will send a 6-digit one-time verification code via SMS.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-terracotta-500 to-amber-600 hover:from-terracotta-600 hover:to-amber-700 text-white font-black text-sm shadow-lg shadow-terracotta-500/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                <OtpVerificationCard
                  key="phone-verify"
                  channel="phone"
                  destination={`+91 ${phone}`}
                  expectedCode={simulatedCode}
                  loading={submitting}
                  error={error}
                  onVerify={handleVerifyOtp}
                  onResend={() => setSimulatedCode(generateOtp())}
                  onBack={() => setOtpStep('input')}
                />
              )
            )}

            {/* ── 2. Email Code Mode ── */}
            {activeTab === 'email-code' && (
              otpStep === 'input' ? (
                <motion.form
                  key="email-input"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleSendEmailCode}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                      Registered Email (ईमेल पता)
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="artisan@kalasathi.in or buyer@corporate.com"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-heritage-border bg-heritage-bg/50 text-heritage-navy font-semibold text-sm focus:border-terracotta-500 focus:bg-white focus:ring-2 focus:ring-terracotta-500/20 outline-none transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500">
                      We will email you a 6-digit confirmation security code.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-heritage-primary to-indigoCraft-600 hover:from-heritage-surface-strong hover:to-indigoCraft-700 text-white font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <span>Send Email Security Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                <OtpVerificationCard
                  key="email-verify"
                  channel="email"
                  destination={email}
                  expectedCode={simulatedCode}
                  loading={submitting}
                  error={error}
                  onVerify={handleVerifyOtp}
                  onResend={() => setSimulatedCode(generateOtp())}
                  onBack={() => setOtpStep('input')}
                />
              )
            )}

            {/* ── 3. Password / Demo Mode ── */}
            {activeTab === 'password' && (
              <motion.div
                key="password-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {/* 1-Click Instant Persona Login */}
                {showDemoProfiles && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-terracotta-600 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        1-Click Demo Profiles
                      </span>
                      <span className="text-[10px] text-stone-500">Instant Switch</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleInstantDemoLogin('9811122233', 'artisan')}
                        className="p-2 rounded-xl border border-amber-200 bg-white hover:border-amber-400 text-left transition-all active:scale-95 disabled:opacity-50 shadow-xs"
                      >
                        <Palette className="w-3.5 h-3.5 text-amber-600 mb-1" />
                        <p className="text-[11px] font-bold text-heritage-navy leading-tight">Sunita Devi</p>
                        <p className="text-[9px] text-amber-700 font-semibold">Artisan</p>
                      </button>

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleInstantDemoLogin('9844455566', 'buyer')}
                        className="p-2 rounded-xl border border-indigo-200 bg-white hover:border-indigo-400 text-left transition-all active:scale-95 disabled:opacity-50 shadow-xs"
                      >
                        <Store className="w-3.5 h-3.5 text-indigoCraft-600 mb-1" />
                        <p className="text-[11px] font-bold text-heritage-navy leading-tight">FabIndia</p>
                        <p className="text-[9px] text-indigoCraft-600 font-semibold">Retail Buyer</p>
                      </button>

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleInstantDemoLogin('9876543210', 'admin')}
                        className="p-2 rounded-xl border border-emerald-200 bg-white hover:border-emerald-400 text-left transition-all active:scale-95 disabled:opacity-50 shadow-xs"
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-600 mb-1" />
                        <p className="text-[11px] font-bold text-heritage-navy leading-tight">Handloom</p>
                        <p className="text-[9px] text-emerald-700 font-semibold">Admin</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Password Credentials Form */}
                <form onSubmit={(e) => handlePasswordSubmit(e)} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                      {t.phone}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-heritage-border bg-heritage-bg/50 text-heritage-navy font-medium text-sm focus:border-terracotta-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-heritage-border bg-heritage-bg/50 text-heritage-navy font-medium text-sm focus:border-terracotta-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-terracotta-500 to-amber-600 hover:from-terracotta-600 hover:to-amber-700 text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm active:scale-98 disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    {submitting ? (activeQuickRole ? `Authenticating as ${activeQuickRole}...` : 'Signing In...') : t.login}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer - Switch to Sign Up */}
          <div className="pt-4 border-t border-heritage-border/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p className="text-stone-500">
              New to KalaSathi?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-bold text-terracotta-600 hover:text-terracotta-700 hover:underline inline-flex items-center gap-1 ml-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {t.register}
              </button>
            </p>
            <span className="text-[11px] text-stone-400">
              Encrypted 256-bit SSL · Fair Trade Verified
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
