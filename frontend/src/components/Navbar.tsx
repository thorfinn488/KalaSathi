import React, { useState } from 'react';
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
            {/* Heritage Star Emblem from Reference Design */}
            <div className="w-10 h-10 rounded-full bg-[#1B2352] text-[#E4C27A] flex items-center justify-center shadow-md shadow-[#1B2352]/20 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 32 32" aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M16 3l3.5 6.5L27 11l-5.5 5 1.5 8L16 20.5 9 24l1.5-8L5 11l7.5-1.5z"></path>
              </svg>
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

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FFFFFF] border border-[#E1D6BE] p-1.5 rounded-full shadow-xs">
            <button
              onClick={() => setCurrentTab('marketplace')}
              className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                currentTab === 'marketplace'
                  ? 'bg-[#22306B] text-white shadow-xs'
                  : 'text-[#4A4458] hover:text-[#1F1A2E] hover:bg-[#FAF5EA]'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-[#B8893A]" />
              Explore Crafts
            </button>

            <button
              onClick={() => setCurrentTab('heritage-map')}
              className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                currentTab === 'heritage-map'
                  ? 'bg-[#22306B] text-white shadow-xs'
                  : 'text-[#4A4458] hover:text-[#1F1A2E] hover:bg-[#FAF5EA]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#B5532F]" />
              Cluster Map
            </button>

            {user && (
              <>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                    currentTab === 'dashboard'
                      ? 'bg-[#22306B] text-white shadow-xs'
                      : 'text-[#4A4458] hover:text-[#1F1A2E] hover:bg-[#FAF5EA]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  {t.dashboard}
                </button>

                {showOrderDashboard && user.role === 'ADMIN' && (
                  <button
                    onClick={() => setCurrentTab('order-dashboard')}
                    className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                      currentTab === 'order-dashboard'
                        ? 'bg-[#22306B] text-white shadow-xs'
                        : 'text-[#4A4458] hover:text-[#1F1A2E] hover:bg-[#FAF5EA]'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Analytics
                  </button>
                )}

                {(user.role === 'ARTISAN' || user.role === 'ADMIN') && (
                  <button
                    onClick={() => setCurrentTab('add-product')}
                    className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                      currentTab === 'add-product'
                        ? 'bg-[#B5532F] text-white shadow-xs'
                        : 'text-[#B5532F] hover:bg-[#FAF5EA]'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {t.addProduct}
                  </button>
                )}

                {(user.role === 'BUYER' || user.role === 'ADMIN') && (
                  <button
                    onClick={() => setCurrentTab('opportunities')}
                    className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                      currentTab === 'opportunities'
                        ? 'bg-[#22306B] text-white shadow-xs'
                        : 'text-[#4A4458] hover:text-[#1F1A2E] hover:bg-[#FAF5EA]'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {t.opportunities}
                  </button>
                )}

                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => setCurrentTab('admin')}
                    className={`px-3.5 py-1.5 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                      currentTab === 'admin'
                        ? 'bg-[#6E2233] text-white shadow-xs'
                        : 'text-[#6E2233] hover:bg-[#FAF5EA]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </button>
                )}
              </>
            )}
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

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <nav className="border-t border-[#E1D6BE] px-4 py-3 md:hidden space-y-1.5 bg-[#FFFFFF] shadow-lg animate-fade-in" aria-label="Mobile navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setCurrentTab(id); setMenuOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition ${
                currentTab === id
                  ? 'bg-[#22306B] text-white shadow-xs'
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
              className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold bg-[#B5532F] text-white mt-3 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#E4C27A]" /> Sign In / Studio Access
            </button>
          )}
        </nav>
      )}

      {showTrackModal && <OrderTrackModal onClose={() => setShowTrackModal(false)} />}
      {showNotifications && (
        <NotificationModal
          onClose={() => setShowNotifications(false)}
          onNavigateTab={setCurrentTab}
        />
      )}
    </header>
  );
};
