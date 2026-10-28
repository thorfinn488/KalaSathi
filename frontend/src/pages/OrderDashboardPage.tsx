import React, { useEffect, useState } from 'react';
import { AlertCircle, IndianRupee, PackageCheck, RefreshCw, Wallet } from 'lucide-react';

interface ArtisanProfit {
  artisan_id: string;
  artisan: string;
  revenue: number;
  expenses: number;
  net_profit: number;
}

interface LowStockProduct {
  product_id: string;
  product_name: string;
  artisan_id: string;
  artisan_name: string;
  stock: number;
  low_stock_threshold: number;
}

interface DashboardData {
  profits: ArtisanProfit[];
  lowStock: LowStockProduct[];
}

const ORDER_API_BASE_URL = (import.meta.env.VITE_ORDER_API_BASE_URL || '/demo-api').replace(/\/$/, '');

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${ORDER_API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

interface OrderDashboardPageProps {
  onAddProduct?: () => void;
}

export const OrderDashboardPage: React.FC<OrderDashboardPageProps> = ({ onAddProduct }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      getJson<ArtisanProfit[]>('/artisans/profit'),
      getJson<LowStockProduct[]>('/products/low-stock'),
    ])
      .then(([profits, lowStock]) => {
        if (active) setData({ profits, lowStock });
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Dashboard data could not be loaded.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [reloadKey]);

  return (
    <main className="dashboard-page mx-auto max-w-[1440px] space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="dashboard-hero relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-7 lg:p-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-200/75">Business overview</p>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">KalaSaathi dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">Artisan revenue, expenses, profit, and stock that needs attention.</p>
          </div>
          {onAddProduct && (
            <button type="button" onClick={onAddProduct} className="primary-cta rounded-lg px-4 py-3 text-sm font-bold text-white">
              Add a product
            </button>
          )}
        </div>
      </header>

      {loading && (
        <section className="bento-panel p-6 text-sm text-white/60" role="status" aria-label="Loading dashboard">
          Loading dashboard data…
        </section>
      )}

      {error && (
        <section className="flex flex-col gap-3 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] p-4 text-sm text-rose-100 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <span><AlertCircle className="mr-2 inline h-4 w-4" />Dashboard data could not be loaded: {error}</span>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="inline-flex items-center gap-2 self-start rounded-lg border border-rose-100/15 px-3 py-2 text-xs font-bold hover:bg-white/5 sm:self-auto">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </section>
      )}

      {!loading && !error && data && (
        <>
          <section className="grid gap-3 sm:grid-cols-2" aria-label="Business totals">
            <article className="bento-panel metric-panel p-5 sm:p-6">
              <div className="flex items-center justify-between"><span className="metric-label">Products low on stock</span><PackageCheck className="h-4 w-4 text-amber-200" /></div>
              <p className="mt-5 text-3xl font-bold text-white" data-testid="low-stock-count">{data.lowStock.length}</p>
              <p className="mt-1 text-xs text-white/40">Items at or below their stock threshold</p>
            </article>
            <article className="bento-panel metric-panel p-5 sm:p-6">
              <div className="flex items-center justify-between"><span className="metric-label">Artisans reporting</span><Wallet className="h-4 w-4 text-emerald-200" /></div>
              <p className="mt-5 text-3xl font-bold text-white">{data.profits.length}</p>
              <p className="mt-1 text-xs text-white/40">Profit details supplied by the order API</p>
            </article>
          </section>

          <section className="space-y-3" aria-labelledby="artisan-profit-title">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-200/70">Financial overview</p>
              <h2 id="artisan-profit-title" className="mt-1 text-xl font-bold text-white">Profit by artisan</h2>
            </div>
            {data.profits.length === 0 ? (
              <div className="bento-panel p-6 text-sm text-white/50" role="status">No artisan profit data is available yet.</div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {data.profits.map((artisan) => (
                  <article className="bento-panel p-5 sm:p-6" key={artisan.artisan_id}>
                    <h3 className="truncate text-base font-bold text-white">{artisan.artisan}</h3>
                    <dl className="mt-5 grid grid-cols-3 gap-3">
                      <div>
                        <dt className="metric-label">Revenue</dt>
                        <dd className="mt-2 text-sm font-semibold tabular-nums text-white">{formatCurrency(artisan.revenue)}</dd>
                      </div>
                      <div>
                        <dt className="metric-label">Expenses</dt>
                        <dd className="mt-2 text-sm font-semibold tabular-nums text-white">{formatCurrency(artisan.expenses)}</dd>
                      </div>
                      <div>
                        <dt className="metric-label">Net profit</dt>
                        <dd className="mt-2 flex items-center text-sm font-bold tabular-nums text-emerald-100"><IndianRupee className="mr-0.5 h-3.5 w-3.5" />{artisan.net_profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="low-stock-title">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200/70">Inventory</p>
              <h2 id="low-stock-title" className="mt-1 text-xl font-bold text-white">Low stock</h2>
            </div>
            {data.lowStock.length === 0 ? (
              <div className="bento-panel p-6 text-sm text-white/50" role="status">No products are currently low on stock.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.lowStock.map((product) => (
                  <article className="bento-panel p-5" key={product.product_id}>
                    <h3 className="truncate text-sm font-bold text-white">{product.product_name}</h3>
                    <p className="mt-1 text-xs text-white/45">{product.artisan_name}</p>
                    <p className="mt-4 text-sm font-semibold text-amber-100">{product.stock} in stock <span className="text-white/40">· threshold {product.low_stock_threshold}</span></p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
};
