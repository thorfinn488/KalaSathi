import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DashboardSummary, InsightItem } from '../types';
import { apiRequest, resolveAssetUrl } from '../api/client';
import { Activity, ArrowRight, ArrowUpRight, BarChart3, CheckCircle2, Clock3, FileText, IndianRupee, Layers3, Plus, RefreshCw, ShoppingBag, Sparkles, Tag, TrendingUp } from 'lucide-react';

interface DashboardPageProps {
  onAddProduct: () => void;
  onSelectProduct: (productId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onAddProduct, onSelectProduct }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const sumData = await apiRequest<DashboardSummary>('/dashboard');
        if (active) {
          setSummary(sumData);
          setLoadError('');
        }
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : 'Dashboard data could not be loaded.');
      }

      try {
        const insData = await apiRequest<{ insights: InsightItem[] }>('/dashboard/insights');
        if (active) setInsights(insData.insights || []);
      } catch (err) {
        console.error('Error loading market notes:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [reloadToken]);

  const statusCounts = summary?.catalogue_status;
  const trends = summary?.trends;
  const activityMax = Math.max(1, ...(trends?.monthly_activity.map((point) => point.count) || [0]));
  const categoryMax = Math.max(1, ...(trends?.categories.map((category) => category.products) || [0]));
  const currency = (value: number | null | undefined) => value == null
    ? 'Not available'
    : `₹${Math.round(value).toLocaleString('en-IN')}`;

  return (
    <div className="dashboard-page mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-heritage-navy p-6 sm:p-8 lg:p-10 shadow-xl border border-heritage-sand/20 text-white" aria-labelledby="dashboard-title">
        <div className="absolute inset-0 bg-hero-woven-bg opacity-15 pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-heritage-gold text-xs font-bold mb-3 border border-white/15">
              <Sparkles className="w-3.5 h-3.5" /> Artisan Studio Overview
            </div>
            <p className="mb-1 text-sm text-stone-300">Welcome back, {user?.name?.split(' ')[0] || 'Master Artisan'}</p>
            <h1 id="dashboard-title" className="text-3xl font-black font-serif leading-tight text-white sm:text-4xl">
              Your Studio, at a Glance.
            </h1>
            <p className="mt-2 text-sm text-stone-300 max-w-xl">
              Real-time oversight of your craft catalogue, fair-trade pricing intelligence, and enterprise buyer demands.
            </p>
          </div>
          {(user?.role === 'ARTISAN' || user?.role === 'ADMIN') && (
            <button 
              onClick={onAddProduct} 
              className="btn btn-gold inline-flex shrink-0 items-center justify-center gap-2 py-3 px-5 text-sm font-bold shadow-lg"
            >
              <Plus className="h-4 w-4" /> {t.addProduct}
            </button>
          )}
        </div>
      </section>

      {/* 4 Metric Cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Catalogue overview">
        <article className="rounded-2xl border border-heritage-sand bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.totalProducts}</span>
            <div className="w-8 h-8 rounded-xl bg-heritage-ivory flex items-center justify-center text-heritage-navy border border-heritage-sand">
              <Layers3 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black font-serif text-heritage-navy">{loading ? '—' : summary?.total_products ?? 0}</p>
          <p className="mt-1 text-xs text-stone-500">All catalogue pieces</p>
        </article>

        <article className="rounded-2xl border border-heritage-sand bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.readyCatalogues}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black font-serif text-emerald-800">{loading ? '—' : statusCounts?.ready ?? 0}</p>
          <p className="mt-1 text-xs text-stone-500">Ready to meet buyers</p>
        </article>

        <article className="rounded-2xl border border-heritage-sand bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.processing}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200">
              <Clock3 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black font-serif text-heritage-gold">{loading ? '—' : statusCounts?.processing ?? 0}</p>
          <p className="mt-1 text-xs text-stone-500">AI catalogue in progress</p>
        </article>

        <article className="rounded-2xl border border-heritage-sand bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.drafts}</span>
            <div className="w-8 h-8 rounded-xl bg-stone-50 flex items-center justify-center text-stone-600 border border-stone-200">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-black font-serif text-heritage-maroon">{loading ? '—' : statusCounts?.draft ?? 0}</p>
          <p className="mt-1 text-xs text-stone-500">Waiting for your next step</p>
        </article>
      </section>

      {loadError && (
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between shadow-sm" role="alert">
          <span className="font-medium">{loadError}</span>
          <button 
            type="button" 
            onClick={() => { setLoading(true); setReloadToken((value) => value + 1); }} 
            className="inline-flex items-center gap-2 self-start rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold hover:bg-rose-50 sm:self-auto text-rose-900 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      )}

      {/* Grid: Signals & Trends */}
      <section className="space-y-3" aria-labelledby="trend-title">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-heritage-terracotta">Your Catalogue Insights</p>
            <h2 id="trend-title" className="mt-1 text-2xl font-black font-serif text-heritage-navy">Signals &amp; Market Trends</h2>
          </div>
          <p className="text-xs text-stone-500">Listing activity, pricing benchmarks, and buyer demand matching</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-12" aria-label="Catalogue activity and market signals">
        {/* Listing Activity Chart */}
        <article className="rounded-2xl border border-heritage-sand bg-white p-5 sm:p-6 lg:col-span-7 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-heritage-ivory flex items-center justify-center text-heritage-navy border border-heritage-sand">
                <Activity className="h-5 w-5 text-heritage-terracotta" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-heritage-navy">Listing Activity</h3>
                <p className="mt-0.5 text-xs text-stone-500">New pieces added each month</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-stone-400">Past 6 months</span>
          </div>

          {loading ? (
            <div className="mt-7 flex h-40 items-end gap-3" aria-label="Loading listing activity" role="status">
              {[38, 64, 48, 82, 56, 72].map((height, index) => (
                <span key={index} className="flex-1 rounded-t bg-stone-200 animate-pulse" style={{ height: `${height}%` }} />
              ))}
            </div>
          ) : trends?.monthly_activity.length ? (
            <div className="mt-7 flex h-40 items-end gap-3 sm:gap-5" role="img" aria-label={`Monthly catalogue additions: ${trends.monthly_activity.map((point) => `${point.month}, ${point.count}`).join('; ')}`}>
              {trends.monthly_activity.map((point) => (
                <div key={point.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${point.month}: ${point.count} ${point.count === 1 ? 'piece' : 'pieces'}`}>
                  <span className="text-xs font-semibold tabular-nums text-stone-600">{point.count || ''}</span>
                  <div className="flex h-[112px] w-full items-end">
                    <span 
                      className={`block w-full rounded-t-md transition-all ${
                        point.count ? 'bg-heritage-navy hover:bg-heritage-terracotta' : 'bg-stone-200'
                      }`} 
                      style={{ height: `${point.count ? Math.max(9, (point.count / activityMax) * 100) : 3}%` }} 
                    />
                  </div>
                  <span className="text-[11px] font-medium text-stone-500">{point.month}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex h-40 items-center justify-center rounded-xl border border-dashed border-heritage-sand text-sm text-stone-400">
              Activity will appear as pieces are added.
            </div>
          )}
        </article>

        {/* Craft Mix */}
        <article className="rounded-2xl border border-heritage-sand bg-white p-5 sm:p-6 lg:col-span-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-heritage-ivory flex items-center justify-center text-heritage-navy border border-heritage-sand">
              <BarChart3 className="h-5 w-5 text-heritage-gold" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-heritage-navy">Craft Mix</h3>
              <p className="mt-0.5 text-xs text-stone-500">Catalogue pieces by craft category</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 space-y-4" role="status" aria-label="Loading category trends">
              {[0, 1, 2].map((item) => <div key={item} className="h-7 rounded bg-stone-100 animate-pulse" />)}
            </div>
          ) : trends?.categories.length ? (
            <div className="mt-6 space-y-4">
              {trends.categories.slice(0, 4).map((category) => (
                <div key={category.name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-semibold text-heritage-navy">{category.name}</span>
                    <span className="shrink-0 tabular-nums text-stone-500">{category.products} · {currency(category.average_suggested_price)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-label={`${category.name} share of catalogue`} aria-valuemin={0} aria-valuemax={categoryMax} aria-valuenow={category.products}>
                    <span className="block h-full rounded-full bg-heritage-gold" style={{ width: `${(category.products / categoryMax) * 100}%` }} />
                  </div>
                </div>
              ))}
              <p className="border-t border-heritage-sand/60 pt-3 text-[11px] text-stone-400">
                Average suggested price for each category
              </p>
            </div>
          ) : (
            <div className="mt-6 flex min-h-32 items-center justify-center rounded-xl border border-dashed border-heritage-sand px-4 text-center text-sm text-stone-400">
              Category patterns will appear when a catalogue is ready.
            </div>
          )}
        </article>

        {/* Price Positioning */}
        <article className="rounded-2xl border border-heritage-sand bg-white p-5 sm:p-6 lg:col-span-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-heritage-ivory flex items-center justify-center text-heritage-navy border border-heritage-sand">
              <IndianRupee className="h-5 w-5 text-heritage-terracotta" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-heritage-navy">Price Positioning</h3>
              <p className="mt-0.5 text-xs text-stone-500">Across priced catalogue pieces</p>
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-black font-serif tabular-nums text-heritage-navy">{loading ? '—' : currency(trends?.average_suggested_price)}</p>
              <p className="mt-1 text-xs text-stone-500">Average suggested price</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold tabular-nums text-stone-700">{loading ? '—' : trends?.priced_products ?? 0}</p>
              <p className="mt-1 text-xs text-stone-500">Pieces with pricing</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-heritage-sand/60 pt-4 text-xs text-stone-500">
            <TrendingUp className="h-4 w-4 text-emerald-700" />
            Catalogue pricing is an algorithmic fair-trade guide, not a recorded sale price.
          </div>
        </article>

        {/* Buyer Interest */}
        <article className="rounded-2xl border border-heritage-sand bg-white p-5 sm:p-6 lg:col-span-7 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-heritage-ivory flex items-center justify-center text-heritage-navy border border-heritage-sand">
              <ShoppingBag className="h-5 w-5 text-heritage-gold" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-heritage-navy">Buyer Demand Matching</h3>
              <p className="mt-0.5 text-xs text-stone-500">Open opportunities linked to your pieces</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-black font-serif tabular-nums text-heritage-navy">{loading ? '—' : trends?.open_opportunities ?? 0}</p>
              <p className="mt-1 text-xs text-stone-500">Open matches</p>
            </div>
            <div>
              <p className="text-3xl font-black font-serif tabular-nums text-heritage-terracotta">{loading ? '—' : trends?.average_match_score == null ? '—' : `${Math.round(trends.average_match_score)}%`}</p>
              <p className="mt-1 text-xs text-stone-500">Average match score</p>
            </div>
            <div className="col-span-2 border-t border-heritage-sand/60 pt-4 sm:col-span-1 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <a href="#market-notes" className="inline-flex items-center gap-1.5 text-xs font-bold text-heritage-terracotta hover:text-heritage-maroon">
                Market notes <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <p className="mt-1 text-xs text-stone-500">{insights.length} saved {insights.length === 1 ? 'note' : 'notes'}</p>
            </div>
          </div>
        </article>

        {/* Market Notes */}
        <article id="market-notes" className="rounded-2xl border border-heritage-sand bg-white p-5 sm:p-6 lg:col-span-12 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-heritage-ivory flex items-center justify-center text-heritage-navy border border-heritage-sand">
              <Sparkles className="h-5 w-5 text-heritage-gold" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-heritage-navy">Market Intelligence Notes</h3>
              <p className="mt-0.5 text-xs text-stone-500">Algorithmic recommendations for your craft studio</p>
            </div>
          </div>
          {insights.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {insights.slice(0, 4).map((item, index) => (
                <div key={`${item.type}-${index}`} className="flex items-start gap-3 rounded-xl border border-heritage-sand bg-heritage-ivory p-4">
                  <Tag className="mt-0.5 h-4 w-4 shrink-0 text-heritage-terracotta" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-heritage-terracotta">{item.type.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-sm leading-5 text-stone-700">{item.message}</p>
                  </div>
                  <ArrowUpRight className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-heritage-sand px-4 py-5 text-sm text-stone-400">
              No saved market notes yet.
            </p>
          )}
        </article>

        {/* Your Collection */}
        <article id="your-products" className="rounded-2xl border border-heritage-sand bg-white p-5 sm:p-6 lg:col-span-12 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Your Masterpieces</p>
              <h2 className="mt-1 text-2xl font-black font-serif text-heritage-navy">{t.products}</h2>
            </div>
            <span className="rounded-full border border-heritage-sand bg-heritage-ivory px-3 py-1.5 text-xs font-bold text-heritage-navy">
              {loading ? '—' : summary?.total_products ?? 0} pieces
            </span>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2" role="status" aria-label="Loading your collection">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 rounded-xl bg-stone-100 animate-pulse" />)}
            </div>
          ) : summary?.recent_products && summary.recent_products.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {summary.recent_products.slice(0, 4).map((prod) => (
                <button 
                  key={prod.product_id || prod.id} 
                  type="button" 
                  onClick={() => onSelectProduct(prod.product_id || prod.id || '')} 
                  className="group flex min-w-0 items-center gap-4 rounded-2xl border border-heritage-sand bg-heritage-ivory p-3.5 text-left transition hover:border-heritage-gold hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-heritage-navy"
                >
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100 border border-heritage-sand">
                    {prod.image_url ? (
                      <img 
                        src={resolveAssetUrl(prod.image_url)} 
                        alt={prod.catalogue?.name || 'Artisan product'} 
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105" 
                        onError={(event) => { event.currentTarget.style.display = 'none'; }} 
                      />
                    ) : (
                      <ShoppingBag className="h-7 w-7 text-stone-300" />
                    )}
                    <span className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                      prod.status === 'READY' || prod.status === 'PUBLISHED' 
                        ? 'bg-emerald-600 text-white' 
                        : prod.status === 'PROCESSING' 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-stone-700 text-white'
                    }`}>
                      {prod.status}
                    </span>
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold font-serif text-heritage-navy group-hover:text-heritage-terracotta transition-colors">
                      {prod.catalogue?.name || 'Draft Product'}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-stone-500">
                      {prod.catalogue?.description || 'Your product story is taking shape.'}
                    </span>
                    <span className="mt-2 flex items-center gap-1 text-xs font-bold text-heritage-navy">
                      <IndianRupee className="h-3.5 w-3.5 text-heritage-gold" />
                      {(prod.price?.suggested_price || prod.pricing?.suggested_price)?.toLocaleString('en-IN') || 'Price pending'}
                      <ArrowRight className="ml-auto h-3.5 w-3.5 text-stone-400 transition group-hover:translate-x-1 group-hover:text-heritage-terracotta" />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-heritage-sand px-5 text-center bg-heritage-ivory/50">
              <div className="w-12 h-12 rounded-2xl bg-white border border-heritage-sand flex items-center justify-center text-heritage-gold mb-3 shadow-sm">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold font-serif text-heritage-navy">Your first piece starts here</h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-stone-500">
                Add a piece with a photo and voice note to generate your intelligent AI catalogue.
              </p>
              {(user?.role === 'ARTISAN' || user?.role === 'ADMIN') && (
                <button 
                  onClick={onAddProduct} 
                  className="btn btn-primary mt-4 inline-flex items-center gap-2 py-2.5 px-4 text-xs font-bold"
                >
                  <Plus className="h-4 w-4" />{t.addProduct}
                </button>
              )}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};
