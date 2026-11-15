import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LogOut,
  Languages,
  PlusCircle,
  LayoutDashboard,
  ShoppingBag,
  ShieldCheck,
  Menu,
  X,
  BarChart3,
  Store,
  Truck,
  MapPin,
  Bell,
  Sparkles
} from 'lucide-react';
import { OrderTrackModal } from './OrderTrackModal';
import { NotificationModal } from './NotificationModal';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const showOrderDashboard = import.meta.env.VITE_SHOW_ORDER_DASHBOARD === 'true';

  const navItems = [
    { id: 'marketplace', label: 'Explore Crafts', icon: Store, visible: true },
    { id: 'heritage-map', label: 'Cluster Map', icon: MapPin, visible: true },
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, visible: Boolean(user) },
    { id: 'order-dashboard', label: 'Order Analytics', icon: BarChart3, visible: user?.role === 'ADMIN' && showOrderDashboard },
    { id: 'add-product', label: t.addProduct, icon: PlusCircle, visible: user?.role === 'ARTISAN' || user?.role === 'ADMIN' },
    { id: 'opportunities', label: t.opportunities, icon: ShoppingBag, visible: user?.role === 'BUYER' || user?.role === 'ADMIN' },
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, visible: user?.role === 'ADMIN' },
  ].filter((item) => item.visible);

  return (
    <header className="sticky top-0 z-50 bg-[#FAF5EA]/92 backdrop-blur-md border-b border-[#E1D6BE] text-[#1F1A2E] shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo & Branding */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none group"
            role="button"
            tabIndex={0}
            aria-label="Go to marketplace"
            onClick={() => setCurrentTab(user ? 'dashboard' : 'marketplace')}
            onKeyDown={(event) => event.key === 'Enter' && setCurrentTab(user ? 'dashboard' : 'marketplace')}
          >
            {/* Authentic KalaSathi Craft Seal */}
            <div className="w-10 h-10 rounded-2xl bg-[#1B2352] text-[#E4C27A] flex items-center justify-center shadow-md shadow-[#1B2352]/20 border border-[#E4C27A]/40 group-hover:scale-105 transition-transform overflow-hidden relative">
              <span className="font-serif font-black text-xl text-[#F59E0B] select-none">क</span>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#B5532F] ring-1 ring-white/50" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-2xl tracking-tight text-[#1F1A2E] group-hover:text-[#B5532F] transition-colors">
                  {t.appName}
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-[#B8893A]/50 bg-[#FFFFFF] px-2.5 py-0.5 text-[10px] font-bold text-[#6E2233] shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8893A] animate-pulse" /> 100% GI Tagged
                </span>
              </div>
              <p className="text-[11px] text-[#5E576B] font-medium hidden sm:block">Where India's Living Heritage Meets Global Commerce</p>
            </div>
          </div>

          {/* Navigation Links with Aceternity-style sliding layoutId pill */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FFFFFF] border border-[#E1D6BE] p-1.5 rounded-full shadow-xs">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = currentTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setCurrentTab(id)}
                  className={`relative px-4 py-1.5 rounded-full font-bold text-xs transition-colors flex items-center gap-1.5 ${
                    isActive ? 'text-white' : 'text-[#4A4458] hover:text-[#1F1A2E]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-0 rounded-full bg-[#1B2352] shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E4C27A]' : 'text-[#B8893A]'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Controls & Language Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Track Order Button */}
            <button
              onClick={() => setShowTrackModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E1D6BE] bg-[#FFFFFF] px-3 py-1.5 text-xs font-bold text-[#1F1A2E] transition-all hover:border-[#B5532F] hover:text-[#B5532F] shadow-xs"
            >
              <Truck className="w-3.5 h-3.5 text-[#B5532F]" />
              <span className="hidden sm:inline">Track Order</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative inline-flex items-center justify-center rounded-full border border-[#E1D6BE] bg-[#FFFFFF] p-2 text-[#4A4458] transition-all hover:text-[#1F1A2E] hover:border-[#B5532F] shadow-xs"
              title="Cluster Alerts & Notifications"
            >
              <Bell className="w-4 h-4 text-[#B8893A]" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#B5532F] ring-2 ring-white animate-pulse" />
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E1D6BE] bg-[#FFFFFF] px-3 py-1.5 text-xs font-bold text-[#4A4458] transition-all hover:text-[#1F1A2E] hover:border-[#B5532F] shadow-xs"
            >
              <Languages className="w-3.5 h-3.5 text-[#B8893A]" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 border-l border-[#E1D6BE] pl-2 sm:gap-2.5 sm:pl-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#1F1A2E] truncate max-w-[130px]">{user.name}</span>
                  <span className="text-[9px] font-bold text-[#B5532F] uppercase tracking-wider">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  title={t.logout}
                  className="rounded-full p-2 text-[#5E576B] transition-all hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('login')}
                  className="hidden sm:inline-flex rounded-full px-3.5 py-1.5 text-xs font-bold text-[#1F1A2E] hover:text-[#B5532F] transition-colors"
                >
                  {t.login}
                </button>
                <button
                  onClick={() => setCurrentTab('login')}
                  className="btn btn-primary text-xs py-1.5 px-4 min-h-[36px] shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E4C27A]" /> Artisan Studio
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="rounded-full border border-[#E1D6BE] bg-[#FFFFFF] p-2 text-[#1F1A2E] md:hidden shadow-xs hover:border-[#B5532F]"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown with Spring Physics */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="border-t border-[#E1D6BE] px-4 py-3 md:hidden space-y-1.5 bg-[#FFFFFF]/95 backdrop-blur-xl shadow-xl"
            aria-label="Mobile navigation"
          >
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setCurrentTab(id); setMenuOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition ${
                  currentTab === id
                    ? 'bg-[#1B2352] text-white shadow-xs'
                    : 'text-[#4A4458] hover:bg-[#FAF5EA] hover:text-[#1F1A2E]'
                }`}
              >
                <Icon className="h-4 w-4 text-[#B8893A]" />{label}
              </button>
            ))}
            {!user && (
              <button
                type="button"
                onClick={() => { setCurrentTab('login'); setMenuOpen(false); }}
                className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold bg-[#B5532F] text-white mt-3 shadow-sm hover:bg-[#991B1B] transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#E4C27A]" /> Sign In / Studio Access
              </button>
            )}
          </motion.nav>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTrackModal && <OrderTrackModal onClose={() => setShowTrackModal(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showNotifications && (
          <NotificationModal
            onClose={() => setShowNotifications(false)}
            onNavigateTab={setCurrentTab}
          />
        )}
      </AnimatePresence>
    </header>
  );
};
