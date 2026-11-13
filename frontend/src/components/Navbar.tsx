import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, LogOut, Languages, PlusCircle, LayoutDashboard, ShoppingBag, ShieldCheck, Menu, X, BarChart3, Store, Truck } from 'lucide-react';
import { OrderTrackModal } from './OrderTrackModal';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const showOrderDashboard = import.meta.env.VITE_SHOW_ORDER_DASHBOARD === 'true';

  const navItems = [
    { id: 'marketplace', label: 'Explore Crafts', icon: Store, visible: true },
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, visible: Boolean(user) },
    { id: 'order-dashboard', label: 'Order Analytics', icon: BarChart3, visible: user?.role === 'ADMIN' && showOrderDashboard },
    { id: 'add-product', label: t.addProduct, icon: PlusCircle, visible: user?.role === 'ARTISAN' || user?.role === 'ADMIN' },
    { id: 'opportunities', label: t.opportunities, icon: ShoppingBag, visible: user?.role === 'BUYER' || user?.role === 'ADMIN' },
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, visible: user?.role === 'ADMIN' },
  ].filter((item) => item.visible);

  return (
    <header className="glass-header sticky top-0 z-50 text-white backdrop-blur-xl bg-slate-950/85 border-b border-white/10 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none group"
            role="button"
            tabIndex={0}
            aria-label="Go to marketplace"
            onClick={() => setCurrentTab(user ? 'dashboard' : 'marketplace')}
            onKeyDown={(event) => event.key === 'Enter' && setCurrentTab(user ? 'dashboard' : 'marketplace')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              क
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white group-hover:text-amber-300 transition-colors">{t.appName}</span>
                <span className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Backend
                </span>
              </div>
              <p className="text-[11px] text-white/45 hidden sm:block">{t.tagline}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/[0.03] border border-white/10 p-1 rounded-2xl">
            <button
              onClick={() => setCurrentTab('marketplace')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                currentTab === 'marketplace' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30 shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              Explore Crafts
            </button>

            {user && (
              <>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                    currentTab === 'dashboard' ? 'bg-white/10 text-white border border-white/20' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  {t.dashboard}
                </button>

                {showOrderDashboard && user.role === 'ADMIN' && (
                  <button
                    onClick={() => setCurrentTab('order-dashboard')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                      currentTab === 'order-dashboard' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Order Analytics
                  </button>
                )}

                {(user.role === 'ARTISAN' || user.role === 'ADMIN') && (
                  <button
                    onClick={() => setCurrentTab('add-product')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                      currentTab === 'add-product' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md' : 'text-amber-300 hover:bg-amber-500/10'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {t.addProduct}
                  </button>
                )}

                {(user.role === 'BUYER' || user.role === 'ADMIN') && (
                  <button
                    onClick={() => setCurrentTab('opportunities')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                      currentTab === 'opportunities' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {t.opportunities}
                  </button>
                )}

                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => setCurrentTab('admin')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                      currentTab === 'admin' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin Panel
                  </button>
                )}
              </>
            )}
          </nav>

          {/* User Controls & Language Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Track Order Button */}
            <button
              onClick={() => setShowTrackModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-bold text-cyan-200 transition-all hover:bg-cyan-500/20 sm:px-3"
            >
              <Truck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Track Order</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white/80 transition-all hover:bg-white/10 sm:px-3"
            >
              <Languages className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 border-l border-white/10 pl-2 sm:gap-3 sm:pl-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white truncate max-w-[130px]">{user.name}</span>
                  <span className="text-[9px] font-bold text-amber-300/80 uppercase tracking-wider">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  title={t.logout}
                  className="rounded-xl p-2 text-white/50 transition-all hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('login')}
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/5 hover:text-white"
                >
                  {t.login}
                </button>
                <button
                  onClick={() => setCurrentTab('login')}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md shadow-orange-500/20 transition hover:brightness-110 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Artisan Studio
                </button>
              </div>
            )}

            <button
              type="button"
              className="rounded-xl border border-white/10 p-2 text-white/75 md:hidden"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav className="mobile-nav border-t border-white/10 px-4 py-3 md:hidden space-y-1 bg-slate-950/95" aria-label="Mobile navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setCurrentTab(id); setMenuOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
                currentTab === id ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
          {!user && (
            <button
              type="button"
              onClick={() => { setCurrentTab('login'); setMenuOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-black bg-amber-500 text-slate-950 mt-2"
            >
              <Sparkles className="w-4 h-4" /> Sign In / Studio Access
            </button>
          )}
        </nav>
      )}

      {showTrackModal && <OrderTrackModal onClose={() => setShowTrackModal(false)} />}
    </header>
  );
};
