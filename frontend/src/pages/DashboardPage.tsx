import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DashboardSummary, InsightItem, ProductDetail } from '../types';
import { apiRequest, resolveAssetUrl } from '../api/client';
import { PlusCircle, Sparkles, CheckCircle2, Clock, FileText, ShoppingBag, ArrowRight, Tag, IndianRupee, Layers, AudioLines, TrendingUp, ArrowUpRight } from 'lucide-react';

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

  useEffect(() => {
    async function fetchData() {
      try {
        const [sumData, insData] = await Promise.all([
          apiRequest<DashboardSummary>('/dashboard'),
          apiRequest<{ insights: InsightItem[] }>('/dashboard/insights'),
        ]);
        setSummary(sumData);
        setInsights(insData.insights || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statusCounts = summary?.catalogue_status;

  return (
    <div className="dashboard-page mx-auto max-w-[1440px] space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <section className="dashboard-hero relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-9 lg:p-12" aria-labelledby="dashboard-title">
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="relative z-10 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-3xl">
            <span className="feature-badge mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 text-xs font-semibold text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" /> A smarter way to grow your craft
              <span className="badge-ping" aria-hidden="true" />
            </span>
            <p className="mb-3 text-sm font-medium text-white/45">Good to see you, {user?.name?.split(' ')[0] || 'there'}</p>
            <h1 id="dashboard-title" className="max-w-2xl text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-[3.5rem]">
              Your craft deserves <span className="text-gradient">a bigger stage.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
              Turn the work of your hands into a story buyers can find, understand, and value fairly.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {(user?.role === 'ARTISAN' || user?.role === 'ADMIN') && (
                <button onClick={onAddProduct} className="primary-cta inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
                  <PlusCircle className="h-4 w-4" /> {t.addProduct}
                </button>
              )}
              <a href="#your-products" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-white/20 hover:bg-white/[0.08]">
                Explore your studio <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
            <div className="hero-visual hidden h-48 w-48 items-center justify-center lg:flex" aria-hidden="true">
            <div className="hero-visual-ring"><div className="hero-visual-core"><Sparkles className="h-9 w-9 text-cyan-100" /></div></div>
            <span className="hero-spark hero-spark-a" /><span className="hero-spark hero-spark-b" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Catalogue overview">
        <article className="bento-panel metric-panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><span className="metric-label">{t.totalProducts}</span><Layers className="h-4 w-4 text-violet-300" /></div>
          <p className="mt-5 text-3xl font-bold text-white">{summary?.total_products ?? 0}</p>
          <p className="mt-1 text-xs text-white/40">Pieces in your studio</p>
        </article>
        <article className="bento-panel metric-panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><span className="metric-label">{t.readyCatalogues}</span><CheckCircle2 className="h-4 w-4 text-cyan-300" /></div>
          <p className="mt-5 text-3xl font-bold text-white">{statusCounts?.ready ?? 0}</p>
          <p className="mt-1 text-xs text-white/40">Ready to meet buyers</p>
        </article>
        <article className="bento-panel metric-panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><span className="metric-label">{t.processing}</span><Clock className="h-4 w-4 text-fuchsia-300" /></div>
          <p className="mt-5 text-3xl font-bold text-white">{statusCounts?.processing ?? 0}</p>
          <p className="mt-1 text-xs text-white/40">AI catalogue in progress</p>
        </article>
        <article className="bento-panel metric-panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><span className="metric-label">{t.drafts}</span><FileText className="h-4 w-4 text-white/50" /></div>
          <p className="mt-5 text-3xl font-bold text-white">{statusCounts?.draft ?? 0}</p>
          <p className="mt-1 text-xs text-white/40">Waiting for your next step</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-12" aria-label="Studio tools and market activity">
        <article className="bento-panel feature-panel relative overflow-hidden p-6 sm:p-7 lg:col-span-5">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div>
              <div className="icon-tile mb-5"><AudioLines className="h-5 w-5 text-violet-200" /></div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-200/75">Voice-powered cataloguing</p>
              <h2 className="mt-2 max-w-sm text-2xl font-bold leading-tight text-white">Your words bring every detail to life.</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">Describe your process naturally. KalaSaathi helps shape it into a buyer-ready product story.</p>
            </div>
            <div className="waveform" aria-label="Decorative audio waveform">{Array.from({ length: 28 }, (_, index) => <span key={index} style={{ '--bar': `${18 + ((index * 17) % 54)}%` } as React.CSSProperties} />)}</div>
          </div>
        </article>

        <article className="bento-panel insight-panel p-6 sm:p-7 lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="icon-tile cyan-tile"><TrendingUp className="h-5 w-5 text-cyan-200" /></div>
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200/75">Market pulse</p><h2 className="mt-1 text-lg font-bold text-white">A little signal, a lot of possibility</h2></div>
            </div>
            <span className="hidden rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 sm:inline-flex">AI insight</span>
          </div>
          {insights.length > 0 ? (
            <div className="mt-6 space-y-3">
              {insights.slice(0, 2).map((item, idx) => (
                <div key={`${item.type}-${idx}`} className="insight-row flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <Tag className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                  <p className="text-sm leading-6 text-white/70">{item.message}</p>
                  <ArrowUpRight className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-white/25" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex min-h-32 items-center rounded-xl border border-dashed border-white/10 px-5">
              <p className="max-w-lg text-sm leading-6 text-white/45">Your market insights will appear here as your catalogue grows. Add a product to start matching your craft with buyer demand.</p>
            </div>
          )}
          <div className="mt-5 flex items-center gap-2 text-xs text-white/35"><span className="live-dot" aria-hidden="true" /> Recommendations refresh with your catalogue</div>
        </article>

        <article className="bento-panel process-panel p-6 sm:p-7 lg:col-span-4">
          <div className="flex items-center justify-between"><div className="icon-tile cyan-tile"><Sparkles className="h-5 w-5 text-cyan-200" /></div><span className="text-xs font-semibold text-white/40">Your workflow</span></div>
          <h2 className="mt-5 text-lg font-bold text-white">From handmade to found.</h2>
          <div className="mt-6 space-y-4">
            {[['01', 'Capture your craft', 'A photo and your voice'], ['02', 'Build your catalogue', 'AI helps tell the story'], ['03', 'Meet the right buyers', 'Find a fair opportunity']].map(([number, title, detail], index) => (
              <div key={number} className="flex gap-3">
                <span className={`step-number ${index === 2 ? 'step-number-active' : ''}`}>{number}</span>
                <div><p className="text-sm font-semibold text-white/80">{title}</p><p className="mt-0.5 text-xs text-white/40">{detail}</p></div>
              </div>
            ))}
          </div>
        </article>

        <article id="your-products" className="bento-panel products-panel p-6 sm:p-7 lg:col-span-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Your collection</p><h2 className="mt-1 text-xl font-bold text-white">{t.products}</h2></div>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/55">{summary?.total_products ?? 0} pieces</span>
          </div>
          {loading ? (
            <div className="flex min-h-52 items-center justify-center text-sm text-white/40" role="status">Loading your collection...</div>
          ) : summary?.recent_products && summary.recent_products.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {summary.recent_products.slice(0, 4).map((prod) => (
                <button key={prod.product_id || prod.id} type="button" onClick={() => onSelectProduct(prod.product_id || prod.id || '')} className="product-tile group flex min-w-0 items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-200/25 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
                  <div className="product-thumb relative flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-950 to-cyan-950">
                    {prod.image_url ? <img src={resolveAssetUrl(prod.image_url)} alt={prod.catalogue?.name || 'Artisan product'} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <ShoppingBag className="h-7 w-7 text-white/30" />}
                    <span className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${prod.status === 'READY' || prod.status === 'PUBLISHED' ? 'bg-emerald-400/90 text-emerald-950' : prod.status === 'PROCESSING' ? 'bg-cyan-300/90 text-slate-950' : 'bg-white/80 text-slate-900'}`}>{prod.status}</span>
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white/85 group-hover:text-cyan-100">{prod.catalogue?.name || 'Draft product'}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-white/40">{prod.catalogue?.description || 'Your product story is taking shape.'}</span>
                    <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-white/65"><IndianRupee className="h-3 w-3 text-cyan-200" />{(prod.price?.suggested_price || prod.pricing?.suggested_price)?.toLocaleString('en-IN') || 'Price pending'}<ArrowRight className="ml-auto h-3.5 w-3.5 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-cyan-200" /></span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-collection flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-5 text-center">
              <div className="icon-tile cyan-tile mb-4"><ShoppingBag className="h-5 w-5 text-cyan-200" /></div>
              <h3 className="text-base font-bold text-white">Your first piece starts here</h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-white/40">Bring your craft into the studio with a photo and a voice note.</p>
              {(user?.role === 'ARTISAN' || user?.role === 'ADMIN') && <button onClick={onAddProduct} className="primary-cta mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white"><PlusCircle className="h-4 w-4" />{t.addProduct}</button>}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};
