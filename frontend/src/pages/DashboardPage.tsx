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
    <div className="dashboard-page mx-auto max-w-[1440px] space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="dashboard-hero relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-7 lg:p-8" aria-labelledby="dashboard-title">
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-200/75">Artisan studio <span className="mx-1 text-white/25">/</span> Overview</p>
            <p className="mb-1 text-sm text-white/55">Welcome back, {user?.name?.split(' ')[0] || 'there'}</p>
            <h1 id="dashboard-title" className="text-3xl font-bold leading-tight text-white sm:text-4xl">Your studio, at a glance.</h1>
            <p className="mt-2 text-sm text-white/55">A clear view of your catalogue, pricing, and buyer interest.</p>
          </div>
          {(user?.role === 'ARTISAN' || user?.role === 'ADMIN') && (
            <button onClick={onAddProduct} className="primary-cta inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">
              <Plus className="h-4 w-4" /> {t.addProduct}
            </button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Catalogue overview">
        <article className="bento-panel metric-panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><span className="metric-label">{t.totalProducts}</span><Layers3 className="h-4 w-4 text-emerald-200" /></div>
          <p className="mt-5 text-3xl font-bold text-white">{loading ? '—' : summary?.total_products ?? 0}</p>
          <p className="mt-1 text-xs text-white/40">All catalogue pieces</p>
        </article>
        <article className="bento-panel metric-panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><span className="metric-label">{t.readyCatalogues}</span><CheckCircle2 className="h-4 w-4 text-lime-300" /></div>
          <p className="mt-5 text-3xl font-bold text-white">{loading ? '—' : statusCounts?.ready ?? 0}</p>
          <p className="mt-1 text-xs text-white/40">Ready to meet buyers</p>
        </article>
        <article className="bento-panel metric-panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><span className="metric-label">{t.processing}</span><Clock3 className="h-4 w-4 text-amber-200" /></div>
          <p className="mt-5 text-3xl font-bold text-white">{loading ? '—' : statusCounts?.processing ?? 0}</p>
          <p className="mt-1 text-xs text-white/40">AI catalogue in progress</p>
        </article>
        <article className="bento-panel metric-panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><span className="metric-label">{t.drafts}</span><FileText className="h-4 w-4 text-white/50" /></div>
          <p className="mt-5 text-3xl font-bold text-white">{loading ? '—' : statusCounts?.draft ?? 0}</p>
          <p className="mt-1 text-xs text-white/40">Waiting for your next step</p>
        </article>
      </section>

      {loadError && (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] p-4 text-sm text-rose-100 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={() => { setLoading(true); setReloadToken((value) => value + 1); }} className="inline-flex items-center gap-2 self-start rounded-lg border border-rose-100/15 px-3 py-2 text-xs font-bold hover:bg-white/5 sm:self-auto">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      )}

      <section className="space-y-3" aria-labelledby="trend-title">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-200/70">Your catalogue</p><h2 id="trend-title" className="mt-1 text-xl font-bold text-white">Signals and trends</h2></div>
          <p className="text-xs text-white/40">Listing activity, pricing, and buyer matches · Not sales data</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-12" aria-label="Catalogue activity and market signals">
        <article className="bento-panel p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><div className="icon-tile green-tile"><Activity className="h-5 w-5 text-emerald-200" /></div><div><h3 className="text-base font-bold text-white">Listing activity</h3><p className="mt-0.5 text-xs text-white/40">New pieces added each month</p></div></div>
            <span className="text-xs font-semibold text-white/35">6 months</span>
          </div>
          {loading ? (
            <div className="mt-7 flex h-40 items-end gap-3" aria-label="Loading listing activity" role="status">{[38, 64, 48, 82, 56, 72].map((height, index) => <span key={index} className="skeleton-bar flex-1 rounded-t" style={{ height: `${height}%` }} />)}</div>
          ) : trends?.monthly_activity.length ? (
            <div className="activity-chart mt-7 flex h-40 items-end gap-3 sm:gap-5" role="img" aria-label={`Monthly catalogue additions: ${trends.monthly_activity.map((point) => `${point.month}, ${point.count}`).join('; ')}`}>
              {trends.monthly_activity.map((point) => (
                <div key={point.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${point.month}: ${point.count} ${point.count === 1 ? 'piece' : 'pieces'}`}>
                  <span className="text-xs font-semibold tabular-nums text-white/65">{point.count || ''}</span>
                  <div className="flex h-[112px] w-full items-end"><span className={`chart-bar block w-full rounded-t-sm ${point.count ? 'chart-bar-filled' : 'chart-bar-empty'}`} style={{ height: `${point.count ? Math.max(9, (point.count / activityMax) * 100) : 3}%` }} /></div>
                  <span className="text-[11px] text-white/40">{point.month}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex h-40 items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-white/40">Activity will appear as pieces are added.</div>
          )}
        </article>

        <article className="bento-panel p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-center gap-3"><div className="icon-tile amber-tile"><BarChart3 className="h-5 w-5 text-amber-200" /></div><div><h3 className="text-base font-bold text-white">Craft mix</h3><p className="mt-0.5 text-xs text-white/40">Catalogue pieces by category</p></div></div>
          {loading ? (
            <div className="mt-6 space-y-5" role="status" aria-label="Loading category trends">{[0, 1, 2].map((item) => <div key={item} className="skeleton-line h-7 rounded" />)}</div>
          ) : trends?.categories.length ? (
            <div className="mt-6 space-y-4">
              {trends.categories.slice(0, 4).map((category) => (
                <div key={category.name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold text-white/75">{category.name}</span><span className="shrink-0 tabular-nums text-white/45">{category.products} · {currency(category.average_suggested_price)}</span></div>
                  <div className="category-track h-1.5 overflow-hidden rounded-full" role="progressbar" aria-label={`${category.name} share of catalogue`} aria-valuemin={0} aria-valuemax={categoryMax} aria-valuenow={category.products}><span className="category-fill block h-full rounded-full" style={{ width: `${(category.products / categoryMax) * 100}%` }} /></div>
                </div>
              ))}
              <p className="border-t border-white/[0.07] pt-3 text-[11px] text-white/35">Average suggested price for each category</p>
            </div>
          ) : (
            <div className="mt-6 flex min-h-32 items-center justify-center rounded-lg border border-dashed border-white/10 px-4 text-center text-sm text-white/40">Category patterns will appear when a catalogue is ready.</div>
          )}
        </article>

        <article className="bento-panel p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-center gap-3"><div className="icon-tile green-tile"><IndianRupee className="h-5 w-5 text-emerald-200" /></div><div><h3 className="text-base font-bold text-white">Price positioning</h3><p className="mt-0.5 text-xs text-white/40">Across priced catalogue pieces</p></div></div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div><p className="text-3xl font-bold tabular-nums text-white">{loading ? '—' : currency(trends?.average_suggested_price)}</p><p className="mt-1 text-xs text-white/40">Average suggested price</p></div>
            <div className="text-right"><p className="text-xl font-bold tabular-nums text-white/80">{loading ? '—' : trends?.priced_products ?? 0}</p><p className="mt-1 text-xs text-white/40">Pieces with pricing</p></div>
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-xs text-white/45"><TrendingUp className="h-4 w-4 text-emerald-200" />Catalogue pricing is a guide, not a recorded sale price.</div>
        </article>

        <article className="bento-panel p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center gap-3"><div className="icon-tile amber-tile"><ShoppingBag className="h-5 w-5 text-amber-200" /></div><div><h3 className="text-base font-bold text-white">Buyer interest</h3><p className="mt-0.5 text-xs text-white/40">Open matches linked to your pieces</p></div></div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div><p className="text-3xl font-bold tabular-nums text-white">{loading ? '—' : trends?.open_opportunities ?? 0}</p><p className="mt-1 text-xs text-white/40">Open matches</p></div>
            <div><p className="text-3xl font-bold tabular-nums text-white">{loading ? '—' : trends?.average_match_score == null ? '—' : `${Math.round(trends.average_match_score)}%`}</p><p className="mt-1 text-xs text-white/40">Average match score</p></div>
            <div className="col-span-2 border-t border-white/[0.07] pt-4 sm:col-span-1 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0"><a href="#market-notes" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100 hover:text-white">Market notes <ArrowRight className="h-3.5 w-3.5" /></a><p className="mt-1 text-xs text-white/40">{insights.length} saved {insights.length === 1 ? 'note' : 'notes'}</p></div>
          </div>
        </article>

        <article id="market-notes" className="bento-panel p-5 sm:p-6 lg:col-span-12">
          <div className="flex items-center gap-3"><div className="icon-tile amber-tile"><Sparkles className="h-5 w-5 text-amber-200" /></div><div><h3 className="text-base font-bold text-white">Market notes</h3><p className="mt-0.5 text-xs text-white/40">Saved recommendations for your studio</p></div></div>
          {insights.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {insights.slice(0, 4).map((item, index) => <div key={`${item.type}-${index}`} className="insight-row flex items-start gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] p-4"><Tag className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-amber-100/60">{item.type.replace(/_/g, ' ')}</p><p className="mt-1 text-sm leading-5 text-white/70">{item.message}</p></div><ArrowUpRight className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-white/25" /></div>)}
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-dashed border-white/10 px-4 py-5 text-sm text-white/40">No saved market notes yet.</p>
          )}
        </article>

        <article id="your-products" className="bento-panel p-5 sm:p-6 lg:col-span-12">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">Your collection</p><h2 className="mt-1 text-xl font-bold text-white">{t.products}</h2></div>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/55">{loading ? '—' : summary?.total_products ?? 0} pieces</span>
          </div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2" role="status" aria-label="Loading your collection">{[0, 1, 2, 3].map((item) => <div key={item} className="skeleton-line h-24 rounded-lg" />)}</div>
          ) : summary?.recent_products && summary.recent_products.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {summary.recent_products.slice(0, 4).map((prod) => (
                <button key={prod.product_id || prod.id} type="button" onClick={() => onSelectProduct(prod.product_id || prod.id || '')} className="product-tile group flex min-w-0 items-center gap-4 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-emerald-200/25 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300">
                  <div className="product-thumb relative flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-emerald-950 to-slate-900">
                    {prod.image_url ? <img src={resolveAssetUrl(prod.image_url)} alt={prod.catalogue?.name || 'Artisan product'} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <ShoppingBag className="h-7 w-7 text-white/30" />}
                    <span className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${prod.status === 'READY' || prod.status === 'PUBLISHED' ? 'bg-emerald-400/90 text-emerald-950' : prod.status === 'PROCESSING' ? 'bg-cyan-300/90 text-slate-950' : 'bg-white/80 text-slate-900'}`}>{prod.status}</span>
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white/85 group-hover:text-emerald-100">{prod.catalogue?.name || 'Draft product'}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-white/40">{prod.catalogue?.description || 'Your product story is taking shape.'}</span>
                    <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-white/65"><IndianRupee className="h-3 w-3 text-emerald-200" />{(prod.price?.suggested_price || prod.pricing?.suggested_price)?.toLocaleString('en-IN') || 'Price pending'}<ArrowRight className="ml-auto h-3.5 w-3.5 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-emerald-200" /></span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-collection flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-5 text-center">
              <div className="icon-tile green-tile mb-4"><ShoppingBag className="h-5 w-5 text-emerald-200" /></div>
              <h3 className="text-base font-bold text-white">Your first piece starts here</h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-white/40">Add a piece to begin building your catalogue.</p>
              {(user?.role === 'ARTISAN' || user?.role === 'ADMIN') && <button onClick={onAddProduct} className="primary-cta mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white"><Plus className="h-4 w-4" />{t.addProduct}</button>}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};
