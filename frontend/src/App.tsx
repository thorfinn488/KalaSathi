import React, { useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
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
import { HeritageMapPage } from './pages/HeritageMapPage';

const showOrderDashboard = import.meta.env.VITE_SHOW_ORDER_DASHBOARD === 'true';

function MainApp() {
  const { user, loading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [currentTab, setCurrentTab] = useState<string>('marketplace');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5EA] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-[#1B2352] text-[#E4C27A] flex items-center justify-center shadow-xl shadow-[#1B2352]/20 mb-4 animate-pulse">
          <svg viewBox="0 0 32 32" aria-hidden="true" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M16 3l3.5 6.5L27 11l-5.5 5 1.5 8L16 20.5 9 24l1.5-8L5 11l7.5-1.5z"></path>
          </svg>
        </div>
        <p className="text-[#1F1A2E] font-serif font-bold text-lg">Loading KalaSaathi Heritage Platform...</p>
        <p className="text-[#5E576B] text-xs mt-1">Connecting to rural master artisan clusters</p>
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
    <div className="min-h-screen flex flex-col bg-[#FAF5EA] text-[#1F1A2E]">
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

        {currentTab === 'heritage-map' && (
          <HeritageMapPage
            onExploreMarketplace={() => setCurrentTab('marketplace')}
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

      {/* Heritage Footer matching Reference Design */}
      <footer className="bg-[#1B2352] text-[#F3EBDA] border-t border-[#E4C27A]/20 pt-14 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand column */}
            <div className="space-y-4 lg:col-span-2 max-w-md">
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 32 32" aria-hidden="true" className="w-7 h-7 text-[#E4C27A]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M16 3l3.5 6.5L27 11l-5.5 5 1.5 8L16 20.5 9 24l1.5-8L5 11l7.5-1.5z"></path>
                </svg>
                <span className="font-serif font-bold text-2xl text-white">KalaSaathi</span>
              </div>
              <p className="text-sm text-[#F3EBDA]/85 leading-relaxed">
                Our mission: bring India's GI-tagged artisans directly to the world, with fairness and verifiable proof at every step.
              </p>
              <p className="text-xs text-[#F3EBDA]/60">
                Empowering rural master artisans with AI cataloging, transparent fair pricing, and direct B2B market linkage.
              </p>
            </div>

            {/* Platform links */}
            <div>
              <h4 className="font-serif font-bold text-base text-[#E4C27A] mb-3">Explore & Connect</h4>
              <ul className="space-y-2 text-sm text-[#F3EBDA]/80">
                <li>
                  <button onClick={() => setCurrentTab('marketplace')} className="hover:text-white hover:underline transition-colors text-left">
                    Explore Certified Crafts
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentTab('heritage-map')} className="hover:text-white hover:underline transition-colors text-left">
                    Heritage Cluster Map
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentTab(user ? 'dashboard' : 'login')} className="hover:text-white hover:underline transition-colors text-left">
                    Artisan Studio
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentTab('opportunities')} className="hover:text-white hover:underline transition-colors text-left">
                    B2B Corporate Procurement
                  </button>
                </li>
              </ul>
            </div>

            {/* Assurance & Governance */}
            <div>
              <h4 className="font-serif font-bold text-base text-[#E4C27A] mb-3">Cluster Commitments</h4>
              <ul className="space-y-2 text-xs text-[#F3EBDA]/75">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E4C27A]" /> 100% GI Origin Authenticated
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E4C27A]" /> 40% Raw-Material Advance
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E4C27A]" /> Zero Intermediary Commissions
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E4C27A]" /> Verifiable ESG Impact Certificates
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F3EBDA]/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white/90">Language:</span>
              <div className="inline-flex rounded-full border border-white/20 p-0.5 bg-white/5">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    language === 'en' ? 'bg-[#F3EBDA] text-[#1B2352]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    language === 'hi' ? 'bg-[#F3EBDA] text-[#1B2352]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            <p>© {new Date().getFullYear()} KalaSaathi Heritage Foundation. Living Heritage Meets Global Commerce.</p>
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
