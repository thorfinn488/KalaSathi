import React, { useState, useEffect } from 'react';
import { ProductDetail } from '../types';
import { apiRequest, resolveAssetUrl } from '../api/client';
import { B2BQuoteModal } from '../components/B2BQuoteModal';
import { SampleOrderModal } from '../components/SampleOrderModal';
import { ProvenanceCertificateModal } from '../components/ProvenanceCertificateModal';
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Search,
  Award,
  Layers,
  ArrowRight,
  Package,
  ShoppingBag,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Globe2,
  Users,
  Feather
} from 'lucide-react';

interface PublicMarketplacePageProps {
  onSelectProduct: (productId: string) => void;
  onEnterStudio: () => void;
}

// High-fidelity fallback catalog items aligned with the reference design
const fallbackHeritageCatalog: ProductDetail[] = [
  {
    product_id: 'prod_mithila_peacock',
    artisan_id: 'art_sita_devi',
    artisan_name: 'Sita Devi Mahila Samooh',
    region: 'Madhubani, Bihar',
    status: 'READY',
    created_at: new Date().toISOString(),
    image_url: '/images/2adeba65-a3b6-448a-88bb-71068feed09a.jpg',
    images: [{ id: 'img_1', url: '/images/2adeba65-a3b6-448a-88bb-71068feed09a.jpg' }],
    audio: [],
    moq: 1,
    lead_time_days: 14,
    price: {
      suggested_price: 14500,
      price_range: [12000, 16000],
      explanation: 'Fair-trade handcrafted appraisal based on 14 days master artisan labor and mineral dyes.'
    },
    catalogue: {
      name: 'Madhubani Peacock Scroll',
      craft: 'Mithila Folk Painting',
      category: 'Paintings & Wall Art',
      description: 'Hand-painted peacock and lotus motif in red and ochre natural mineral pigments on handmade paper.',
      material: 'Handmade paper, natural mineral pigments',
      tags: ['madhubani', 'folk-art', 'natural-dyes']
    },
    pricing: {
      id: 'price_1',
      suggested_price: 14500,
      price_range_low: 12000,
      price_range_high: 16000,
      explanation: 'Fair-trade master craft appraisal.'
    },
    opportunities: []
  },
  {
    product_id: 'prod_jaipur_vase',
    artisan_id: 'art_neerja',
    artisan_name: 'Neerja Kiln Collective',
    region: 'Jaipur, Rajasthan',
    status: 'READY',
    created_at: new Date().toISOString(),
    image_url: '/images/0a985587-0c5b-4017-b387-ee7e3084f982.jpg',
    images: [{ id: 'img_2', url: '/images/0a985587-0c5b-4017-b387-ee7e3084f982.jpg' }],
    audio: [],
    moq: 1,
    lead_time_days: 10,
    price: {
      suggested_price: 6200,
      price_range: [5000, 7500],
      explanation: 'Quartz glaze cobalt blue handcraft technique from Jaipur cluster.'
    },
    catalogue: {
      name: 'Blue Pottery Floral Vase',
      craft: 'Jaipur Blue Pottery',
      category: 'Ceramics & Vases',
      description: 'Cobalt blue hand-painted pottery vase with traditional Rajasthani floral motifs on quartz glaze.',
      material: 'Quartz powder, fullers earth, cobalt glaze',
      tags: ['blue-pottery', 'jaipur', 'ceramics']
    },
    pricing: {
      id: 'price_2',
      suggested_price: 6200,
      price_range_low: 5000,
      price_range_high: 7500,
      explanation: 'Quartz glaze cobalt blue handcraft technique from Jaipur cluster.'
    },
    opportunities: []
  },
  {
    product_id: 'prod_channapatna_stack',
    artisan_id: 'art_channa_guild',
    artisan_name: 'Channapatna Toy Guild',
    region: 'Ramanagara, Karnataka',
    status: 'READY',
    created_at: new Date().toISOString(),
    image_url: '/images/8ea142ca-6372-4e12-91e5-5a1bcb756294.jpg',
    images: [{ id: 'img_3', url: '/images/8ea142ca-6372-4e12-91e5-5a1bcb756294.jpg' }],
    audio: [],
    moq: 10,
    lead_time_days: 21,
    price: {
      suggested_price: 3400,
      price_range: [2800, 4000],
      explanation: 'Hand-lathed ivory wood with child-safe vegetable lacquer.'
    },
    catalogue: {
      name: 'Lacquered Stacking Set',
      craft: 'Channapatna Woodcraft',
      category: 'Eco Toys & Collectibles',
      description: 'Eco-friendly lacquered wooden stacking toys in jewel tones coated with non-toxic vegetable dyes.',
      material: 'Ivory wood (Wrightia tinctoria), vegetable lacquer',
      tags: ['channapatna', 'wooden-toys', 'non-toxic']
    },
    pricing: {
      id: 'price_3',
      suggested_price: 3400,
      price_range_low: 2800,
      price_range_high: 4000,
      explanation: 'Hand-lathed ivory wood with child-safe vegetable lacquer.'
    },
    opportunities: []
  },
  {
    product_id: 'prod_dhokra_horse',
    artisan_id: 'art_bastar_shilp',
    artisan_name: 'Bastar Shilp Parivar',
    region: 'Bastar, Chhattisgarh',
    status: 'READY',
    created_at: new Date().toISOString(),
    image_url: '/images/07422837-4d84-4eb6-b449-9af4b1322db0.jpg',
    images: [{ id: 'img_4', url: '/images/07422837-4d84-4eb6-b449-9af4b1322db0.jpg' }],
    audio: [],
    moq: 1,
    lead_time_days: 18,
    price: {
      suggested_price: 9800,
      price_range: [8000, 11500],
      explanation: 'Ancient lost-wax bell metal casting by Bastar tribal artisans.'
    },
    catalogue: {
      name: 'Dhokra Bronze Horse',
      craft: 'Bastar Dhokra Bronze',
      category: 'Metal Sculptures',
      description: 'Lost-wax cast bronze figurine of a standing tribal horse adorned with intricate wire texture.',
      material: 'Bell metal alloy, beeswax, clay core',
      tags: ['dhokra', 'lost-wax', 'bastar', 'bronze']
    },
    pricing: {
      id: 'price_4',
      suggested_price: 9800,
      price_range_low: 8000,
      price_range_high: 11500,
      explanation: 'Ancient lost-wax bell metal casting by Bastar tribal artisans.'
    },
    opportunities: []
  },
  {
    product_id: 'prod_sozni_pashmina',
    artisan_id: 'art_zeba_weavers',
    artisan_name: 'Zeba Weavers Circle',
    region: 'Srinagar, Kashmir',
    status: 'READY',
    created_at: new Date().toISOString(),
    image_url: '/images/1de238af-eaa2-4244-8959-4b4deacab81d.jpg',
    images: [{ id: 'img_5', url: '/images/1de238af-eaa2-4244-8959-4b4deacab81d.jpg' }],
    audio: [],
    moq: 5,
    lead_time_days: 30,
    price: {
      suggested_price: 28500,
      price_range: [25000, 34000],
      explanation: 'Hand-spun Changthangi cashmere with fine Sozni needlework.'
    },
    catalogue: {
      name: 'Sozni Pashmina Shawl',
      craft: 'Kashmir Pashmina',
      category: 'Textiles & Shawls',
      description: 'Ultra-fine Changthangi cashmere handwoven shawl with delicate needle-embroidered Sozni border.',
      material: '100% Pure Changthangi Pashmina, silk needlework',
      tags: ['pashmina', 'sozni', 'kashmir', 'handloom']
    },
    pricing: {
      id: 'price_5',
      suggested_price: 28500,
      price_range_low: 25000,
      price_range_high: 34000,
      explanation: 'Hand-spun Changthangi cashmere with fine Sozni needlework.'
    },
    opportunities: []
  }
];

export const PublicMarketplacePage: React.FC<PublicMarketplacePageProps> = ({
  onSelectProduct,
  onEnterStudio
}) => {
  const [products, setProducts] = useState<ProductDetail[]>(fallbackHeritageCatalog);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quoteProduct, setQuoteProduct] = useState<ProductDetail | null>(null);
  const [sampleProduct, setSampleProduct] = useState<ProductDetail | null>(null);
  const [provenanceProduct, setProvenanceProduct] = useState<ProductDetail | null>(null);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const data = await apiRequest<ProductDetail[]>('/products');
        if (data && data.length > 0) {
          // Merge API products with reference fallback to guarantee high-res imagery
          const apiMap = new Map(data.map((p) => [p.product_id, p]));
          const combined = [...data];
          for (const item of fallbackHeritageCatalog) {
            if (!apiMap.has(item.product_id)) {
              combined.push(item);
            }
          }
          setProducts(combined);
        }
      } catch (err) {
        console.warn('API catalog currently using authenticated cluster seed:', err);
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
    { id: 'Textiles & Shawls', label: 'Kashmir Pashmina' }
  ];

  const filteredProducts = products.filter((prod) => {
    const name = prod.catalogue?.name || '';
    const craft = prod.catalogue?.craft || '';
    const region = prod.region || '';
    const artisan = prod.artisan_name || '';
    const category = prod.catalogue?.category || '';

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      name.toLowerCase().includes(query) ||
      craft.toLowerCase().includes(query) ||
      region.toLowerCase().includes(query) ||
      artisan.toLowerCase().includes(query);

    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen text-[#1F1A2E] space-y-0">
      {/* Toast Notification */}
      {quoteSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#1B2352] text-[#F3EBDA] border border-[#E4C27A] font-bold text-xs px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-[#E4C27A]" />
          {quoteSuccessMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Aligned with Reference Design) */}
      {/* ========================================================================= */}
      <section className="hero-woven-bg pt-10 pb-16 sm:pb-20 border-b border-[#E1D6BE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-5">
              <span className="eyebrow">GI-tagged crafts, direct from the cluster</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1F1A2E] tracking-tight leading-[1.12]">
                Where India's Living Heritage Meets <em className="italic text-[#B5532F]">Global Commerce.</em>
              </h1>
              <p className="text-base sm:text-lg text-[#4A4458] leading-relaxed max-w-2xl">
                Discover certified GI-tagged handcrafted treasures directly from rural master artisan clusters—transparent fair-trade pricing, verifiable origin, and zero middleman markup.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a href="#catalog" className="btn btn-primary">
                  Explore Certified Crafts
                </a>
                <button onClick={onEnterStudio} className="btn btn-ghost">
                  Launch Artisan / Buyer Studio
                </button>
              </div>
            </div>

            {/* Right Hero Visual with Asymmetric Radius & Floating Provenance Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <img
                  src="/images/ea6408fa-eda9-4d66-94b1-b33943d39fcf.jpg"
                  alt="Elderly Indian master artisan hand-painting a Madhubani folk art canvas by window light"
                  className="w-full aspect-[4/5] object-cover rounded-tl-[1.75rem] rounded-tr-[1.75rem] rounded-br-[7rem] rounded-bl-[1.75rem] shadow-2xl bg-[#1B2352]"
                />

                {/* Floating Provenance Card */}
                <div className="absolute -left-3 sm:-left-6 bottom-6 max-w-[280px] bg-[#FFFFFF] border border-[#E1D6BE] rounded-2xl p-4 shadow-xl">
                  <div className="space-y-2 text-xs font-bold text-[#1F1A2E]">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#FAF5EA] flex items-center justify-center text-[#B8893A]">
                        ✓
                      </div>
                      <span>100% GI Tagged</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#FAF5EA] flex items-center justify-center text-[#B8893A]">
                        ✓
                      </div>
                      <span>Direct Cluster Source</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#FAF5EA] flex items-center justify-center text-[#B8893A]">
                        ✓
                      </div>
                      <span>Verifiable Origin</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TRUST STRIP (5 Pillars from Reference Design) */}
      {/* ========================================================================= */}
      <section className="bg-[#1B2352] text-[#F3EBDA] border-y border-[#E4C27A]/20 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
            <li className="flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wide">
              <ShieldCheck className="w-5 h-5 text-[#E4C27A] shrink-0" />
              <span>100% GI Tagged</span>
            </li>
            <li className="flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wide">
              <Award className="w-5 h-5 text-[#E4C27A] shrink-0" />
              <span>Government-Certified</span>
            </li>
            <li className="flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wide">
              <Package className="w-5 h-5 text-[#E4C27A] shrink-0" />
              <span>40% Escrow Advance</span>
            </li>
            <li className="flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wide">
              <TrendingUp className="w-5 h-5 text-[#E4C27A] shrink-0" />
              <span>Zero Middleman Markup</span>
            </li>
            <li className="flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wide">
              <Globe2 className="w-5 h-5 text-[#E4C27A] shrink-0" />
              <span>Export & Corporate Ready</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CURATED HERITAGE CATALOG SECTION */}
      {/* ========================================================================= */}
      <section id="catalog" className="py-16 sm:py-20 bg-[#FAF5EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="max-w-2xl space-y-2">
            <span className="eyebrow">Certified, one craft at a time</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A2E]">Curated Heritage Catalog</h2>
            <p className="text-[#4A4458] text-sm sm:text-base">
              Every piece carries a GI certificate and a traceable path from the artisan's workshop to your door.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-bold text-xs transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#22306B] text-white shadow-sm'
                    : 'bg-[#FFFFFF] border border-[#E1D6BE] text-[#4A4458] hover:border-[#B5532F] hover:text-[#1F1A2E]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 text-[#B5532F] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by craft, artisan, or state..."
              className="w-full bg-[#FFFFFF] border border-[#E1D6BE] rounded-full pl-11 pr-5 py-2.5 text-xs sm:text-sm text-[#1F1A2E] placeholder:text-[#5E576B] focus:border-[#B5532F] focus:ring-1 focus:ring-[#B5532F] shadow-xs"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
            {filteredProducts.map((prod, index) => {
              const imageSrc = prod.image_url ? resolveAssetUrl(prod.image_url) : '/images/2adeba65-a3b6-448a-88bb-71068feed09a.jpg';
              const price = prod.price || prod.pricing?.suggested_price || 4500;
              const isFeature = index === 0;

              return (
                <article
                  key={prod.product_id}
                  className={`heritage-card overflow-hidden flex flex-col ${
                    isFeature ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  {/* Image container */}
                  <div className="relative overflow-hidden bg-[#1B2352]">
                    <img
                      src={imageSrc}
                      alt={prod.catalogue?.name || 'Handcrafted Indian Heritage Craft'}
                      loading="lazy"
                      className={`w-full object-cover transition-transform duration-500 hover:scale-105 ${
                        isFeature ? 'aspect-[16/9]' : 'aspect-[4/3]'
                      }`}
                    />
                    <span className="gi-badge absolute top-3 left-3">
                      <Award className="w-3.5 h-3.5 text-[#B8893A]" /> GI Tagged
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#B5532F] uppercase tracking-wider">
                          {prod.catalogue?.craft || 'Traditional Indian Craft'}
                        </span>
                        <span className="text-xs text-[#5E576B] font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#B8893A]" /> {prod.region || 'India'}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#1F1A2E] mt-1">
                        {prod.catalogue?.name || 'Handcrafted Artefact'}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5E576B] mt-1 line-clamp-2">
                        {prod.artisan_name ? `${prod.artisan_name} · ` : ''}
                        {prod.catalogue?.description || 'Authentic artisan cluster handmade heritage piece.'}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-[#E1D6BE] flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-[#5E576B] block">Fair-Trade Price</span>
                        <span className="font-serif font-bold text-xl sm:text-2xl text-[#1F1A2E]">
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setProvenanceProduct(prod)}
                          className="px-3.5 py-1.5 rounded-full border border-[#1F1A2E] text-xs font-bold text-[#1F1A2E] hover:bg-[#FAF5EA] transition-all"
                        >
                          View Provenance
                        </button>
                        <button
                          onClick={() => setSampleProduct(prod)}
                          className="btn btn-primary text-xs py-1.5 px-4 min-h-[36px]"
                        >
                          Buy Sample
                        </button>
                        <button
                          onClick={() => setQuoteProduct(prod)}
                          className="px-3 py-1.5 rounded-full bg-[#FAF5EA] border border-[#B8893A] text-xs font-bold text-[#6E2233] hover:bg-[#E4C27A]/20 transition-all"
                          title="Request Custom B2B Quotation"
                        >
                          B2B Quote
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. ARTISAN STORY SECTION (3-Photo Mosaic from Reference Design) */}
      {/* ========================================================================= */}
      <section id="artisans" className="py-16 sm:py-24 bg-[#FFFFFF] border-t border-[#E1D6BE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* 3-Photo Media Mosaic */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <img
                src="/images/e113d8c6-b37d-4f34-b677-16f9c6df59e8.jpg"
                alt="Portrait of a smiling rural Indian woman artisan holding a clay pot"
                loading="lazy"
                className="row-span-2 w-full h-full object-cover rounded-2xl shadow-xl bg-[#1B2352]"
              />
              <img
                src="/images/6b052069-99eb-4336-91e2-df185a0c344c.jpg"
                alt="Close view of hands shaping wet clay on a potter's wheel"
                loading="lazy"
                className="w-full aspect-square object-cover rounded-2xl shadow-md bg-[#1B2352]"
              />
              <img
                src="/images/fe6ddec0-22d5-48f1-9ab5-34b87a74cf66.jpg"
                alt="Group of women artisans seated together weaving and painting"
                loading="lazy"
                className="w-full aspect-square object-cover rounded-2xl shadow-md bg-[#1B2352]"
              />
            </div>

            {/* Narrative & Metrics */}
            <div className="lg:col-span-6 space-y-6">
              <span className="eyebrow">24 clusters, one promise</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F1A2E] leading-tight">
                Meet the Hands Behind the Heritage.
              </h2>
              <p className="text-base text-[#4A4458] leading-relaxed">
                KalaSaathi stands beside self-help artisan women's groups and traditional families across 24 rural clusters. We replace layers of middlemen with AI cataloging, fair pricing, raw-material funding, and direct B2B market access.
              </p>
              <p className="text-base text-[#4A4458] leading-relaxed">
                The result is simple: more of every rupee reaches the person who made the work.
              </p>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-r-xl border-l-4 border-[#B8893A] bg-[#FAF5EA]">
                  <strong className="block font-serif text-2xl text-[#6E2233]">24</strong>
                  <span className="text-xs text-[#5E576B]">Rural Clusters</span>
                </div>
                <div className="p-4 rounded-r-xl border-l-4 border-[#B8893A] bg-[#FAF5EA]">
                  <strong className="block font-serif text-2xl text-[#6E2233]">Direct</strong>
                  <span className="text-xs text-[#5E576B]">Artisan Linkage</span>
                </div>
                <div className="p-4 rounded-r-xl border-l-4 border-[#B8893A] bg-[#FAF5EA]">
                  <strong className="block font-serif text-2xl text-[#6E2233]">0%</strong>
                  <span className="text-xs text-[#5E576B]">Intermediary Fee</span>
                </div>
                <div className="p-4 rounded-r-xl border-l-4 border-[#B8893A] bg-[#FAF5EA]">
                  <strong className="block font-serif text-2xl text-[#6E2233]">Verified</strong>
                  <span className="text-xs text-[#5E576B]">Verifiable Origin</span>
                </div>
              </div>

              <div>
                <button onClick={onEnterStudio} className="btn btn-primary mt-2">
                  Meet the Artisans & Enter Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. HOW IT WORKS SECTION (Numbered Steps from Reference Design) */}
      {/* ========================================================================= */}
      <section id="how" className="py-16 sm:py-24 bg-[#FAF5EA] border-t border-[#E1D6BE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-xl space-y-2">
            <span className="eyebrow">Simple by design</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A2E]">
              From cluster to your door in three steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="heritage-card p-6 sm:p-8 relative space-y-4">
              <div className="step-counter">1</div>
              <h3 className="font-serif font-bold text-xl text-[#1F1A2E]">Discover Certified Crafts</h3>
              <p className="text-sm text-[#4A4458] leading-relaxed">
                Browse GI-tagged products with verified artisan and regional cluster origin.
              </p>
            </div>

            {/* Step 2 */}
            <div className="heritage-card p-6 sm:p-8 relative space-y-4 md:translate-y-4">
              <div className="step-counter">2</div>
              <h3 className="font-serif font-bold text-xl text-[#1F1A2E]">Order Directly or Request B2B Specs</h3>
              <p className="text-sm text-[#4A4458] leading-relaxed">
                Individuals can purchase sample pieces; businesses can request wholesale specifications, custom laser engraving, and export-ready quotations.
              </p>
            </div>

            {/* Step 3 */}
            <div className="heritage-card p-6 sm:p-8 relative space-y-4">
              <div className="step-counter">3</div>
              <h3 className="font-serif font-bold text-xl text-[#1F1A2E]">Track Impact and Delivery</h3>
              <p className="text-sm text-[#4A4458] leading-relaxed">
                Buyers receive transparent order tracking, digital provenance certificates, and verifiable ESG impact paperwork for corporate compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CORPORATE GIFTING & B2B PROCUREMENT (Deep Navy from Reference Design) */}
      {/* ========================================================================= */}
      <section id="gifting" className="py-16 sm:py-24 bg-[#1B2352] text-[#F3EBDA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hamper Photography */}
            <div className="lg:col-span-5">
              <img
                src="/images/2c67e795-fd99-45be-9e1f-81832e31eba3.jpg"
                alt="Premium corporate gift hamper with engraved wooden box, brass diya, hand-block-printed cloth and pashmina"
                loading="lazy"
                className="w-full aspect-[5/4] object-cover rounded-3xl shadow-2xl bg-[#6E2233]"
              />
            </div>

            {/* Value Propositions */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs uppercase tracking-widest font-bold text-[#E4C27A] block">
                B2B Procurement Desk
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
                Corporate Gifting with Tangible Social Impact.
              </h2>
              <p className="text-base text-[#F3EBDA]/85 leading-relaxed">
                Bulk orders directly support artisan women's groups and traditional families across rural clusters—and you get the paperwork and ESG impact certification to prove it.
              </p>

              {/* 5 Feature Rows */}
              <ul className="space-y-3">
                <li className="flex items-start gap-3.5 p-3 rounded-xl border border-white/15 bg-white/5">
                  <div className="w-5 h-5 rounded-full bg-[#E4C27A]/20 flex items-center justify-center text-[#E4C27A] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-white">Custom laser-engraved packaging</strong>
                    <span className="text-xs text-[#F3EBDA]/75">Your corporate brand etched on heritage-grade sustainably sourced wood.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3.5 p-3 rounded-xl border border-white/15 bg-white/5">
                  <div className="w-5 h-5 rounded-full bg-[#E4C27A]/20 flex items-center justify-center text-[#E4C27A] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-white">Curated gift hampers</strong>
                    <span className="text-xs text-[#F3EBDA]/75">Themed gift sets across multiple craft clusters (pottery, brass, wood, textile).</span>
                  </div>
                </li>
                <li className="flex items-start gap-3.5 p-3 rounded-xl border border-white/15 bg-white/5">
                  <div className="w-5 h-5 rounded-full bg-[#E4C27A]/20 flex items-center justify-center text-[#E4C27A] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-white">Bulk pricing</strong>
                    <span className="text-xs text-[#F3EBDA]/75">Tiered rates with zero intermediary markup direct from clusters.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3.5 p-3 rounded-xl border border-white/15 bg-white/5">
                  <div className="w-5 h-5 rounded-full bg-[#E4C27A]/20 flex items-center justify-center text-[#E4C27A] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-white">Export-compliant logistics</strong>
                    <span className="text-xs text-[#F3EBDA]/75">International phytosanitary, origin certificates, and doorstep freight handling.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3.5 p-3 rounded-xl border border-white/15 bg-white/5">
                  <div className="w-5 h-5 rounded-full bg-[#E4C27A]/20 flex items-center justify-center text-[#E4C27A] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-white">Verifiable ESG impact certificates</strong>
                    <span className="text-xs text-[#F3EBDA]/75">Audited proof of rural livelihoods supported by your corporate procurement.</span>
                  </div>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => setQuoteProduct(products[0])}
                  className="btn btn-light"
                >
                  Access Buyer Procurement Desk
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOR ARTISANS SECTION (5 Tool Cards with Maroon Escrow Highlight) */}
      {/* ========================================================================= */}
      <section id="join" className="py-16 sm:py-24 bg-[#FAF5EA] border-t border-[#E1D6BE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Copy */}
            <div className="lg:col-span-5 space-y-4">
              <span className="eyebrow">For artisans</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A2E] leading-tight">
                Built for Artisans, Not Middlemen.
              </h2>
              <p className="text-base text-[#4A4458] leading-relaxed">
                Your skill is the product. We provide the tools, the funding, and the buyers—so you keep the value you create.
              </p>
              <div>
                <button onClick={onEnterStudio} className="btn btn-gold">
                  Join as an Artisan
                </button>
              </div>
            </div>

            {/* 5 Tool Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: 40% Escrow Advance in Deep Maroon */}
              <div className="sm:col-span-2 p-6 rounded-2xl bg-[#6E2233] text-white border border-[#6E2233] shadow-lg space-y-2">
                <h3 className="font-serif font-bold text-xl text-white">
                  40% raw-material escrow advance
                </h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  Funds for wool, clay, wood, and natural pigments arrive before you begin, so no order starts with debt.
                </p>
              </div>

              {/* Card 2 */}
              <div className="heritage-card p-5 space-y-2">
                <h3 className="font-serif font-bold text-lg text-[#1F1A2E]">
                  AI-powered cataloging
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4458] leading-relaxed">
                  Photograph your work and speak in your mother tongue; our studio writes the listing and certifies the origin.
                </p>
              </div>

              {/* Card 3 */}
              <div className="heritage-card p-5 space-y-2">
                <h3 className="font-serif font-bold text-lg text-[#1F1A2E]">
                  Fair-price recommendations
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4458] leading-relaxed">
                  Transparent cost-plus pricing calculator ensuring artisan wages meet fair-trade living wage benchmarks.
                </p>
              </div>

              {/* Card 4 */}
              <div className="heritage-card p-5 space-y-2">
                <h3 className="font-serif font-bold text-lg text-[#1F1A2E]">
                  Direct buyer connections
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4458] leading-relaxed">
                  Reach global corporate buyers, interior designers, and exporters without an intermediary taking 70% cuts.
                </p>
              </div>

              {/* Card 5 */}
              <div className="heritage-card p-5 space-y-2">
                <h3 className="font-serif font-bold text-lg text-[#1F1A2E]">
                  Digital business tools
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4458] leading-relaxed">
                  Manage orders, automated invoices, payout tracking, and shipping labels all in one intuitive studio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FINAL CTA SECTION (Madder Crimson Maroon with Gold Lattice) */}
      {/* ========================================================================= */}
      <section className="maroon-lattice-bg py-16 sm:py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-between">
            <div className="lg:col-span-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
                Your craft deserves a bigger stage.
              </h2>
              <p className="text-sm sm:text-base text-white/80 mt-2 max-w-xl">
                Whether you are a rural craft guild seeking fair markets or a business seeking meaningful corporate gifting.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3.5">
              <a href="#catalog" className="btn btn-light shadow-md">
                Explore Certified Crafts
              </a>
              <button onClick={onEnterStudio} className="btn btn-outline-light">
                Partner with KalaSaathi
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {sampleProduct && (
        <SampleOrderModal
          product={sampleProduct}
          onClose={() => setSampleProduct(null)}
          onSuccess={(orderId) => {
            setSampleProduct(null);
            setQuoteSuccessMsg(`Sample order ${orderId} placed successfully!`);
            setTimeout(() => setQuoteSuccessMsg(null), 5000);
          }}
        />
      )}

      {quoteProduct && (
        <B2BQuoteModal
          product={quoteProduct}
          onClose={() => setQuoteProduct(null)}
          onSuccess={() => {
            setQuoteProduct(null);
            setQuoteSuccessMsg('B2B quotation request submitted to cluster master artisan!');
            setTimeout(() => setQuoteSuccessMsg(null), 5000);
          }}
        />
      )}

      {provenanceProduct && (
        <ProvenanceCertificateModal
          product={provenanceProduct}
          onClose={() => setProvenanceProduct(null)}
        />
      )}
    </div>
  );
};
