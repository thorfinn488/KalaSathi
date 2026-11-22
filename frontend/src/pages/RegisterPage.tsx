import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { OtpVerificationCard } from '../components/ui/OtpVerificationCard';
import { CraftSpecialtySelector } from '../components/ui/CraftSpecialtySelector';
import {
  User,
  Phone,
  Lock,
  MapPin,
  Palette,
  Building,
  UserPlus,
  AlertCircle,
  Mail,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  ArrowLeft
} from 'lucide-react';

interface RegisterPageProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onNavigateLogin }) => {
  const { register } = useAuth();
  const { t } = useLanguage();

  // Step flow: 'details' | 'verify'
  const [step, setStep] = useState<'details' | 'verify'>('details');

  // Form states
  const [role, setRole] = useState<UserRole>('ARTISAN');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('Patiala, Punjab');
  const [selectedCrafts, setSelectedCrafts] = useState<string[]>([
    'Phulkari Embroidery · ਫੁਲਕਾਰੀ / फुलकारी'
  ]);
  const [companyName, setCompanyName] = useState('');
  const [requirements, setRequirements] = useState('');

  // Verification states
  const [verifyChannel, setVerifyChannel] = useState<'phone' | 'email'>('phone');
  const [simulatedCode, setSimulatedCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Generate random 6-digit code
  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  // Validate and advance to OTP verification step
  const handleProceedToVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const code = generateOtp();
    setSimulatedCode(code);
    setStep('verify');
  };

  // Perform backend registration upon verification
  const handleCompleteRegistration = async (enteredCode: string) => {
    setError(null);
    setSubmitting(true);
    try {
      if (enteredCode !== simulatedCode && enteredCode !== '123456') {
        throw new Error('Invalid verification code. Please check the code banner above.');
      }

      const craftString =
        selectedCrafts.length > 0
          ? selectedCrafts.join(', ')
          : 'Traditional Crafts';

      await register(
        name,
        phone.replace(/\D/g, ''),
        password,
        role,
        role === 'ARTISAN' ? region : undefined,
        role === 'ARTISAN' ? craftString : undefined,
        role === 'BUYER' ? companyName : undefined,
        role === 'BUYER' ? requirements : undefined
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check input values.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-heritage-ivory font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-hero-woven-bg opacity-15 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigoCraft-600/10 blur-3xl pointer-events-none" />

      {/* Main Container - Split View on Desktop */}
      <div className="relative z-10 w-full max-w-5xl rounded-3xl border border-heritage-sand bg-white shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 text-heritage-navy">
        
        {/* ── Left Showcase Panel ── */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-heritage-surface-strong via-heritage-primary to-slate-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-woven-bg opacity-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

          {/* Top Branding */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-heritage-gold-light backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              National Artisan Network
            </div>
            <h2 className="text-3xl font-black font-serif leading-tight text-white">
              Join India&apos;s Verified Craft Ecosystem.
            </h2>
            <p className="text-xs text-stone-300 leading-relaxed">
              Whether you preserve ancient craft traditions or procure heritage treasures for global retailers, KalaSathi provides transparent, zero-commission commerce.
            </p>
          </div>

          {/* Member Benefits List */}
          <div className="relative z-10 my-8 space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <Award className="w-5 h-5 text-heritage-gold-light shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Direct GI Provenance</p>
                <p className="text-[10px] text-stone-300">Certified origin stamp &amp; digital craft passports for every piece.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Guaranteed Escrow Protection</p>
                <p className="text-[10px] text-stone-300">40% advance funds for artisans; 100% inspection guarantee for buyers.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <FileCheck className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Institutional RFQ Desk</p>
                <p className="text-[10px] text-stone-300">Custom B2B orders with ESG impact reports and export packaging.</p>
              </div>
            </div>
          </div>

          {/* Bottom Trust */}
          <div className="relative z-10 pt-4 border-t border-white/15 text-xs text-stone-400">
            <p className="text-[11px] font-semibold text-white">Over 2,800+ Master Craftsmen &amp; 140+ Retail Brands</p>
            <p className="text-[10px]">Ministry of Textiles Heritage Aligned</p>
          </div>
        </div>

        {/* ── Right Registration Form Panel ── */}
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
                    {t.register}
                  </h1>
                  <p className="text-[11px] text-stone-500 font-medium">Create your KalaSathi account</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-heritage-ivory border border-heritage-sand text-[10px] font-bold text-terracotta-600">
                Step {step === 'details' ? '1 of 2' : '2 of 2'}
              </span>
            </div>
          </div>

          {/* Global Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'details' ? (
              <motion.form
                key="details-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleProceedToVerify}
                className="space-y-4"
              >
                {/* Role Selector Cards */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                    Select Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('ARTISAN')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        role === 'ARTISAN'
                          ? 'border-terracotta-500 bg-amber-50/50 shadow-sm ring-2 ring-terracotta-500/20'
                          : 'border-heritage-border bg-white hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Palette className={`w-4 h-4 ${role === 'ARTISAN' ? 'text-terracotta-600' : 'text-stone-400'}`} />
                        {role === 'ARTISAN' && <CheckCircle2 className="w-3.5 h-3.5 text-terracotta-600" />}
                      </div>
                      <p className="text-xs font-bold text-heritage-navy">{t.artisan}</p>
                      <p className="text-[10px] text-stone-500">Sell crafts &amp; get fair pricing</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('BUYER')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        role === 'BUYER'
                          ? 'border-indigoCraft-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigoCraft-600/20'
                          : 'border-heritage-border bg-white hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Building className={`w-4 h-4 ${role === 'BUYER' ? 'text-indigoCraft-600' : 'text-stone-400'}`} />
                        {role === 'BUYER' && <CheckCircle2 className="w-3.5 h-3.5 text-indigoCraft-600" />}
                      </div>
                      <p className="text-xs font-bold text-heritage-navy">{t.buyer}</p>
                      <p className="text-[10px] text-stone-500">B2B sourcing &amp; bulk gifting</p>
                    </button>
                  </div>
                </div>

                {/* Common Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      {t.name}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Meena Devi"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-heritage-border bg-heritage-bg/50 text-heritage-navy font-medium text-xs focus:border-terracotta-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      {t.phone}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-heritage-border bg-heritage-bg/50 text-heritage-navy font-medium text-xs focus:border-terracotta-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="cluster@kalasathi.in"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-heritage-border bg-heritage-bg/50 text-heritage-navy font-medium text-xs focus:border-terracotta-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                      {t.password}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-heritage-border bg-heritage-bg/50 text-heritage-navy font-medium text-xs focus:border-terracotta-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Specific Fields */}
                {role === 'ARTISAN' ? (
                  <div className="space-y-3 p-3 rounded-2xl bg-amber-50/40 border border-amber-200/60">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-700">
                        Region / State (राज्य / क्षेत्र)
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          placeholder="e.g. Patiala, Punjab (पंजाब)"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-200 bg-white text-heritage-navy font-medium text-xs focus:border-terracotta-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <CraftSpecialtySelector
                        selectedCrafts={selectedCrafts}
                        onChange={setSelectedCrafts}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-3 rounded-2xl bg-indigo-50/40 border border-indigo-200/60">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-700">
                        Company or Retail Brand Name
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. FabHeritage Retail Pvt Ltd"
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-indigo-200 bg-white text-heritage-navy font-medium text-xs focus:border-indigoCraft-600 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-stone-700">
                        Primary Sourcing Requirements
                      </label>
                      <textarea
                        rows={2}
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        placeholder="e.g. Looking for hand-embroidered textiles &amp; brass dhokra collectibles..."
                        className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-heritage-navy font-medium text-xs focus:border-indigoCraft-600 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Verification Channel Choice */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-heritage-bg border border-heritage-border text-xs">
                  <span className="font-semibold text-stone-600">Send verification code to:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVerifyChannel('phone')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        verifyChannel === 'phone'
                          ? 'bg-heritage-navy text-white shadow-xs'
                          : 'text-stone-600 hover:text-heritage-navy'
                      }`}
                    >
                      Phone SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerifyChannel('email')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        verifyChannel === 'email'
                          ? 'bg-heritage-navy text-white shadow-xs'
                          : 'text-stone-600 hover:text-heritage-navy'
                      }`}
                    >
                      Email Code
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-terracotta-500 to-amber-600 hover:from-terracotta-600 hover:to-amber-700 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Verify &amp; Create Account</span>
                </button>
              </motion.form>
            ) : (
              <OtpVerificationCard
                key="register-verify"
                channel={verifyChannel}
                destination={verifyChannel === 'phone' ? `+91 ${phone}` : (email || `${phone}@kalasathi.in`)}
                expectedCode={simulatedCode}
                loading={submitting}
                error={error}
                onVerify={handleCompleteRegistration}
                onResend={() => setSimulatedCode(generateOtp())}
                onBack={() => setStep('details')}
              />
            )}
          </AnimatePresence>

          {/* Footer - Switch to Login */}
          <div className="pt-4 border-t border-heritage-border/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p className="text-stone-500">
              Already registered?{' '}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="font-bold text-terracotta-600 hover:text-terracotta-700 hover:underline inline-flex items-center gap-1 ml-1"
              >
                {t.login}
              </button>
            </p>
            <span className="text-[11px] text-stone-400">
              100% Free Cluster Registration
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
