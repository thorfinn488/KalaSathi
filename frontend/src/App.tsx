import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddProductPage } from './pages/AddProductPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { AdminPage } from './pages/AdminPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen app-shell flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-cyan-400 text-white flex items-center justify-center font-black text-2xl animate-pulse mb-4 shadow-2xl shadow-purple-500/20">
          क
        </div>
        <p className="text-white/70 font-bold text-sm">Loading KalaSaathi...</p>
      </div>
    );
  }

  if (!user) {
    if (currentTab === 'register') {
      return (
        <RegisterPage
          onSuccess={() => setCurrentTab('dashboard')}
          onNavigateLogin={() => setCurrentTab('login')}
        />
      );
    }
    return (
      <LoginPage
        onSuccess={() => setCurrentTab('dashboard')}
        onNavigateRegister={() => setCurrentTab('register')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col app-shell text-white">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <DashboardPage
            onAddProduct={() => setCurrentTab('add-product')}
            onSelectProduct={(id) => {
              setSelectedProductId(id);
              setCurrentTab('product-detail');
            }}
          />
        )}

        {currentTab === 'add-product' && (
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
            onBack={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'opportunities' && <OpportunitiesPage />}

        {currentTab === 'admin' && <AdminPage />}
      </main>

      <footer className="app-footer border-t border-white/10 px-5 py-6 text-xs text-white/45">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="font-semibold text-white/75">KalaSaathi <span className="text-white/30">·</span> AI business tools for artisan communities</p>
          <p className="inline-flex items-center gap-2"><span className="live-dot" aria-hidden="true" /> Market linkage services active</p>
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
      </LanguageProvider>
    </AuthProvider>
  );
}
