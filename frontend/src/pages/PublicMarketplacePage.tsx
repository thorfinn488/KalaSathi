import React, { useState, useEffect } from 'react';
import { ProductDetail } from '../types';
import { apiRequest, resolveAssetUrl } from '../api/client';
import { B2BQuoteModal } from '../components/B2BQuoteModal';
import { SampleOrderModal } from '../components/SampleOrderModal';
import { Sparkles, MapPin, ShieldCheck, IndianRupee, ShoppingBag, ArrowRight, Layers, Award, CheckCircle, Search, Filter, Palette, Truck, HelpCircle, User, ShoppingCart } from 'lucide-react';

interface PublicMarketplacePageProps {
  onSelectProduct: (productId: string) => void;
  onEnterStudio: () => void;
}

export const PublicMarketplacePage: React.FC<PublicMarketplacePageProps> = ({ onSelectProduct, onEnterStudio }) => {
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quoteProduct, setQuoteProduct] = useState<ProductDetail | null>(null);
  const [sampleProduct, setSampleProduct] = useState<ProductDetail | null>(null);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const data = await apiRequest<ProductDetail[]>('/products');
        setProducts(data || []);
      } catch (err) {
        console.error('Failed to load marketplace catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  const categories = [
    { id: 'all', label: 'All Treasures' },
    { id: 'Paintings & Wall Art', label: 'Mithila & Folk Art' },
    { id: 'Ceramics & Vases', label: 'Jaipur Blue Pottery' },
    { id: 'Eco Toys & Collectibles', label: 'Channapatna Woodcraft' },
    { id: 'Metal Sculptures', label: 'Bastar Dhokra Bronze' },
    { id: 'Textiles & Shawls', label: 'Kashmir Pashmina' },
  ];

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      !searchQuery ||
      prod.catalogue?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.catalogue?.craft.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.artisan_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || prod.catalogue?.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen text-white space-y-12 pb-20">
      {/* Toast Notification */}
      {quoteSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 font-black text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 text-slate-950" />
          {quoteSuccessMsg}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-radial-gradient">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-slate-950/40 to-slate-950 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto space-y-8">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-bold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Direct Artisan Linkage · 0% Intermediary Fee · Verifiable Origin
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Where India's Living Heritage Meets <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">Global Commerce.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
              Procure certified GI-tagged handcrafted masterpieces directly from rural master artisan clusters. Transparent fair-trade pricing, custom corporate gifting, and export-compliant B2B orders.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#catalog"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" /> Explore Certified Crafts
            </a>
            <button
              onClick={onEnterStudio}
              className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-sm backdrop-blur-md transition-all flex items-center gap-2 active:scale-95"
            >
              <User className="w-4 h-4 text-amber-300" /> Launch Artisan / Buyer Studio
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Trust Value Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <Award className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-extrabold text-white">100% GI Tagged</p>
                <p className="text-[10px] text-slate-400">Government Certified Heritage</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-extrabold text-white">40% Escrow Advance</p>
                <p className="text-[10px] text-slate-400">Artisan Raw Material Fund</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <p className="font-extrabold text-white">Direct Cluster Source</p>
                <p className="text-[10px] text-slate-400">Zero Middleman Markup</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <Truck className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <p className="font-extrabold text-white">Export & Corporate Ready</p>
                <p className="text-[10px] text-slate-400">Global Packing & Logistics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Search & Filter Controls */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Curated Heritage Catalog
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any piece to inspect provenance or request a B2B wholesale spec proposal.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by craft, artisan, or state..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 font-medium text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-white/[0.03] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredProducts.map((prod) => (
              <div
                key={prod.product_id || prod.id}
                className="group rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col"
              >
                {/* Image Banner */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                  <img
                    src={resolveAssetUrl(prod.image_url)}
                    alt={prod.catalogue?.name || 'Artisan product'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

                  {/* Top Origin Tag */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {prod.region && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        {prod.region}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-lg bg-amber-500/90 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                      GI Certified
                    </span>
                  </div>

                  {/* Suggested Price Pill */}
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/15 text-right">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Fair Trade Guide</span>
                    <span className="text-sm font-black text-amber-300 flex items-center justify-end">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {(prod.price?.suggested_price || prod.pricing?.suggested_price || 2500).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
                      {prod.catalogue?.craft || prod.catalogue?.category}
                    </p>
                    <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {prod.catalogue?.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {prod.heritage_story || prod.catalogue?.description}
                    </p>
                  </div>

                  {/* Artisan Maker Credit */}
                  {prod.artisan_name && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                      <span>Crafted by <strong className="text-white font-bold">{prod.artisan_name}</strong></span>
                      <span className="text-[10px] font-semibold text-emerald-300">MOQ: {prod.moq || 15} units</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSampleProduct(prod)}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md transition-all text-center flex items-center justify-center gap-1 active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Buy Sample
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuoteProduct(prod)}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition-all text-center flex items-center justify-center gap-1 active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Wholesale RFQ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
            <p className="text-sm font-bold text-slate-400">No craft treasures matched your filter.</p>
          </div>
        )}
      </section>

      {/* Corporate Gifting & ESG Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              For Corporate Gifting & Luxury Hospitality
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Elevate Your Corporate Gifting with Tangible Social Impact.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Every bulk order placed through KalaSathi directly supports self-help artisan women groups and traditional families across 24 rural clusters. Receive custom laser-engraved corporate packaging and verifiable ESG impact certificates.
            </p>
            <div className="pt-2">
              <button
                onClick={onEnterStudio}
                className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-2"
              >
                Access Buyer Procurement Desk <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* B2B Quote Modal */}
      {quoteProduct && (
        <B2BQuoteModal
          product={quoteProduct}
          onClose={() => setQuoteProduct(null)}
          onSuccess={(quote) => {
            setQuoteProduct(null);
            setQuoteSuccessMsg(`RFQ for ${quote.quantity} units sent to ${quoteProduct.artisan_name || 'artisan cluster'}!`);
            setTimeout(() => setQuoteSuccessMsg(null), 5000);
          }}
        />
      )}

      {/* Sample Order Modal */}
      {sampleProduct && (
        <SampleOrderModal
          product={sampleProduct}
          onClose={() => setSampleProduct(null)}
          onSuccess={(order) => {
            setSampleProduct(null);
            setQuoteSuccessMsg(`Sample order #${order.order_id} placed! Tracking is now active.`);
            setTimeout(() => setQuoteSuccessMsg(null), 6000);
          }}
        />
      )}
    </div>
  );
};
