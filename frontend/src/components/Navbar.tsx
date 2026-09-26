import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, LogOut, Languages, PlusCircle, LayoutDashboard, ShoppingBag, ShieldCheck, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, visible: Boolean(user) },
    { id: 'add-product', label: t.addProduct, icon: PlusCircle, visible: user?.role === 'ARTISAN' || user?.role === 'ADMIN' },
    { id: 'opportunities', label: t.opportunities, icon: ShoppingBag, visible: Boolean(user) },
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, visible: user?.role === 'ADMIN' },
  ].filter((item) => item.visible);

  return (
    <header className="glass-header sticky top-0 z-50 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            role="button"
            tabIndex={0}
            aria-label="Go to dashboard"
            onClick={() => setCurrentTab('dashboard')}
            onKeyDown={(event) => event.key === 'Enter' && setCurrentTab('dashboard')}
          >
            <div className="brand-mark w-10 h-10 rounded-xl text-white flex items-center justify-center font-black text-xl shadow-lg">
              क
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">{t.appName}</span>
                <span className="hidden lg:flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-cyan-200">
                  <Sparkles className="w-3 h-3 text-cyan-300" /> AI business manager
                </span>
              </div>
              <p className="text-xs text-white/45 hidden sm:block">{t.tagline}</p>
            </div>
          </div>

          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
                  currentTab === 'dashboard' ? 'bg-white/10 text-white border border-white/10' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                {t.dashboard}
              </button>

              {(user.role === 'ARTISAN' || user.role === 'ADMIN') && (
                <button
                  onClick={() => setCurrentTab('add-product')}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1.5 ${
                    currentTab === 'add-product' ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-purple-500/20' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  {t.addProduct}
                </button>
              )}

              <button
                onClick={() => setCurrentTab('opportunities')}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
                  currentTab === 'opportunities' ? 'bg-white/10 text-white border border-white/10' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {t.opportunities}
              </button>

              {user.role === 'ADMIN' && (
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
                    currentTab === 'admin' ? 'bg-white/10 text-white border border-white/10' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </button>
              )}
            </nav>
          )}

          {/* User Controls & Language Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/75 transition-all hover:bg-white/10 sm:px-3"
            >
              <Languages className="w-4 h-4 text-cyan-300" />
              <span className="hidden sm:inline">{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 border-l border-white/10 pl-2 sm:gap-3 sm:pl-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white">{user.name}</span>
                  <span className="text-[10px] text-cyan-200/70 font-mono uppercase">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  title={t.logout}
                  className="rounded-lg p-2 text-white/60 transition-all hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('login')}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white"
                >
                  {t.login}
                </button>
                <button
                  onClick={() => setCurrentTab('register')}
                  className="rounded-lg bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110"
                >
                  {t.register}
                </button>
              </div>
            )}
          </div>
          {user && (
            <button
              type="button"
              className="rounded-lg border border-white/10 p-2 text-white/75 md:hidden"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
      {user && menuOpen && (
        <nav className="mobile-nav border-t border-white/10 px-4 py-2 md:hidden" aria-label="Mobile navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setCurrentTab(id); setMenuOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${currentTab === id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              aria-current={currentTab === id ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};
