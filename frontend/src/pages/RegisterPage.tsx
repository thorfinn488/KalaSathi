import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { User, Phone, Lock, MapPin, Palette, Building, UserPlus, AlertCircle } from 'lucide-react';

interface RegisterPageProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onNavigateLogin }) => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [role, setRole] = useState<UserRole>('ARTISAN');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('Patiala, Punjab');
  const [craftSpecialty, setCraftSpecialty] = useState('Phulkari Embroidery');
  const [companyName, setCompanyName] = useState('');
  const [requirements, setRequirements] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, phone, password, role, region, craftSpecialty, companyName, requirements);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check input values.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-heritage-ivory font-sans relative">
      <div className="absolute inset-0 bg-hero-woven-bg opacity-20 pointer-events-none" />
      <div className="relative z-10 max-w-md w-full p-8 rounded-3xl border border-heritage-sand bg-white shadow-2xl space-y-6 text-heritage-navy">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-heritage-navy text-heritage-gold font-serif font-black text-3xl shadow-lg border border-heritage-sand/40 mb-1">
            क
          </div>
          <h1 className="text-2xl font-black font-serif text-heritage-navy">{t.register}</h1>
          <p className="text-sm text-stone-500">{t.tagline}</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-heritage-ivory rounded-2xl border border-heritage-sand">
          <button
            type="button"
            onClick={() => setRole('ARTISAN')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              role === 'ARTISAN' ? 'bg-heritage-navy text-white shadow-sm' : 'text-stone-600 hover:text-heritage-navy'
            }`}
          >
            {t.artisan}
          </button>
          <button
            type="button"
            onClick={() => setRole('BUYER')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              role === 'BUYER' ? 'bg-heritage-navy text-white shadow-sm' : 'text-stone-600 hover:text-heritage-navy'
            }`}
          >
            {t.buyer}
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-rose-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
              {t.name}
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meena Devi"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-heritage-sand bg-heritage-ivory text-heritage-navy font-medium text-sm focus:border-heritage-gold focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
              {t.phone}
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-heritage-sand bg-heritage-ivory text-heritage-navy font-medium text-sm focus:border-heritage-gold focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
              {t.password}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-heritage-sand bg-heritage-ivory text-heritage-navy font-medium text-sm focus:border-heritage-gold focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          {/* Artisan specific fields */}
          {role === 'ARTISAN' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Region / State (क्षेत्र)
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. Patiala, Punjab"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-heritage-sand bg-heritage-ivory text-heritage-navy font-medium text-sm focus:border-heritage-gold focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Craft Specialty (कला का प्रकार)
                </label>
                <div className="relative">
                  <Palette className="w-5 h-5 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={craftSpecialty}
                    onChange={(e) => setCraftSpecialty(e.target.value)}
                    placeholder="e.g. Phulkari / Madhubani / Woodcraft"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-heritage-sand bg-heritage-ivory text-heritage-navy font-medium text-sm focus:border-heritage-gold focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Buyer specific fields */}
          {role === 'BUYER' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Company / Retail Store Name
                </label>
                <div className="relative">
                  <Building className="w-5 h-5 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Heritage Crafts Retail Ltd."
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-heritage-sand bg-heritage-ivory text-heritage-navy font-medium text-sm focus:border-heritage-gold focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Sourcing Requirements
                </label>
                <textarea
                  rows={2}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="e.g. Looking for authentic hand-embroidered textiles..."
                  className="w-full px-4 py-2.5 rounded-xl border border-heritage-sand bg-heritage-ivory text-heritage-navy font-medium text-sm focus:border-heritage-gold focus:bg-white outline-none transition-all"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <UserPlus className="w-5 h-5" />
            {submitting ? 'Creating Account...' : t.register}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-heritage-sand/60">
          <p className="text-xs text-stone-500">
            Already registered?{' '}
            <button
              onClick={onNavigateLogin}
              className="text-heritage-terracotta font-bold hover:underline inline-flex items-center gap-1"
            >
              {t.login}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
