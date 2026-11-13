import React, { useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrderDashboardPage } from './pages/OrderDashboardPage';
import { AddProductPage } from './pages/AddProductPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { AdminPage } from './pages/AdminPage';
import { PublicMarketplacePage } from './pages/PublicMarketplacePage';

const showOrderDashboard = import.meta.env.VITE_SHOW_ORDER_DASHBOARD === 'true';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('marketplace');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen app-shell flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 text-white flex items-center justify-center font-black text-2xl animate-pulse mb-4 shadow-2xl shadow-orange-500/20">
          क
        </div>
        <p className="text-white/70 font-bold text-sm">Loading KalaSaathi Heritage Platform...</p>
      </div>
    );
  }

  // Handle explicit Login / Register navigation
  if (!user) {
    if (currentTab === 'register') {
      return (
        <RegisterPage
          onSuccess={() => setCurrentTab('dashboard')}
          onNavigateLogin={() => setCurrentTab('login')}
        />
      );
    }
    if (currentTab === 'login') {
      return (
        <LoginPage
          onSuccess={() => setCurrentTab('dashboard')}
          onNavigateRegister={() => setCurrentTab('register')}
        />
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col app-shell text-white">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 pb-16">
        {currentTab === 'marketplace' && (
          <PublicMarketplacePage
            onSelectProduct={(id) => {
              setSelectedProductId(id);
              setCurrentTab('product-detail');
            }}
            onEnterStudio={() => setCurrentTab('login')}
          />
        )}

        {currentTab === 'dashboard' && user && (
          <DashboardPage
            onAddProduct={() => setCurrentTab('add-product')}
            onSelectProduct={(id) => {
              setSelectedProductId(id);
              setCurrentTab('product-detail');
            }}
          />
        )}

        {showOrderDashboard && currentTab === 'order-dashboard' && user?.role === 'ADMIN' && (
          <OrderDashboardPage onAddProduct={() => setCurrentTab('add-product')} />
        )}

        {currentTab === 'add-product' && (user?.role === 'ARTISAN' || user?.role === 'ADMIN') && (
          <AddProductPage
            onComplete={(id) => {
              setSelectedProductId(id);
              setCurrentTab('product-detail');
            }}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'product-detail' && selectedProductId && (
          <ProductDetailPage
            productId={selectedProductId}
            onBack={() => setCurrentTab(user ? 'dashboard' : 'marketplace')}
          />
        )}

        {currentTab === 'opportunities' && (user?.role === 'BUYER' || user?.role === 'ADMIN') && <OpportunitiesPage />}

        {currentTab === 'admin' && user?.role === 'ADMIN' && <AdminPage />}
      </main>

      <footer className="app-footer border-t border-white/10 px-5 py-8 text-xs text-white/50 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <p className="font-bold text-white text-sm">KalaSaathi</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Empowering rural master artisans with AI cataloging, fair pricing, and direct B2B market linkage.</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Active B2B Market Linkage</span>
            <span>·</span>
            <span>100% GI Origin Guaranteed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
        <SpeedInsights />
      </LanguageProvider>
    </AuthProvider>
  );
}
