import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ProductDetail, Opportunity } from '../types';
import { apiRequest, resolveAssetUrl } from '../api/client';
import { ArrowLeft, Edit3, IndianRupee, Tag, Building2, MapPin, Sparkles, CheckCircle2, ShieldCheck, Volume2, ChevronDown, ChevronUp, Award, ShoppingBag, ShoppingCart } from 'lucide-react';
import { B2BQuoteModal } from '../components/B2BQuoteModal';
import { SampleOrderModal } from '../components/SampleOrderModal';
import { ProvenanceCertificateModal } from '../components/ProvenanceCertificateModal';

interface ProductDetailPageProps {
  productId: string;
  onBack: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, onBack }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Catalogue edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPriceCustomizer, setShowPriceCustomizer] = useState(false);
  const [materialCost, setMaterialCost] = useState(650);
  const [daysToMake, setDaysToMake] = useState(5);
  const [complexity, setComplexity] = useState<'low' | 'medium' | 'high'>('medium');
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Commercial action modals
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      try {
        const prodData = await apiRequest<ProductDetail>(`/products/${productId}`);
        setProduct(prodData);
        setEditName(prodData.catalogue?.name || '');
        setEditDesc(prodData.catalogue?.description || '');

        try {
          const oppData = await apiRequest<{ opportunities: Opportunity[] }>(`/products/${productId}/opportunities`);
          setOpportunities(oppData.opportunities || prodData.opportunities || []);
        } catch {
          setOpportunities(prodData.opportunities || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [productId]);

  const handleSaveCatalogue = async () => {
    setSaving(true);
    try {
      await apiRequest(`/products/${productId}/catalogue`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          description: editDesc,
        }),
      });

      // Reload product
      const updated = await apiRequest<ProductDetail>(`/products/${productId}`);
      setProduct(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert('Failed to update catalogue: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculatePrice = async () => {
    setSavingPrice(true);
    setPriceError(null);
    try {
      const updatedPrice = await apiRequest<{
        suggested_price: number;
        price_range: number[];
        explanation: string;
      }>(`/products/${productId}/recalculate-price`, {
        method: 'POST',
        body: JSON.stringify({
          material_cost: materialCost,
          days_to_make: daysToMake,
          complexity,
        }),
      });

      setProduct((currentProduct) => currentProduct ? {
        ...currentProduct,
        price: {
          suggested_price: updatedPrice.suggested_price,
          price_range: [updatedPrice.price_range[0], updatedPrice.price_range[1]],
          explanation: updatedPrice.explanation,
        },
        pricing: currentProduct.pricing ? {
          ...currentProduct.pricing,
          suggested_price: updatedPrice.suggested_price,
          price_range_low: updatedPrice.price_range[0],
          price_range_high: updatedPrice.price_range[1],
          explanation: updatedPrice.explanation,
        } : currentProduct.pricing,
      } : currentProduct);
    } catch (err: any) {
      setPriceError(err.message || 'Failed to recalculate price.');
    } finally {
      setSavingPrice(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-stone-500 font-serif text-lg">Loading master craft details...</div>;
  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl bg-white border border-heritage-sand text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
          <ArrowLeft className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold font-serif text-heritage-navy">Product Unavailable</h3>
        <p className="text-xs text-stone-500">{error || 'This craft product could not be loaded.'}</p>
        <button
          onClick={onBack}
          className="btn btn-primary inline-flex items-center gap-2 text-xs py-2.5 px-5"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Catalog
        </button>
      </div>
    );
  }

  const priceObj = product.price || {
    suggested_price: product.pricing?.suggested_price || 0,
    price_range: [product.pricing?.price_range_low || 0, product.pricing?.price_range_high || 0] as [number, number],
    explanation: product.pricing?.explanation || '',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Back Header */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-heritage-navy font-bold text-sm hover:text-heritage-terracotta bg-white border border-heritage-sand px-4 py-2 rounded-xl transition-all shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 text-heritage-terracotta" /> Back to Dashboard
      </button>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image & Audio */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-heritage-sand overflow-hidden shadow-sm">
            {product.image_url ? (
              <img
                src={resolveAssetUrl(product.image_url)}
                alt={product.catalogue?.name}
                className="w-full h-80 object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="h-80 bg-heritage-ivory flex items-center justify-center text-heritage-gold font-bold">No Image</div>
            )}
            <div className="p-4 bg-heritage-ivory flex items-center justify-between border-t border-heritage-sand/60">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Status</span>
              <span className="gi-badge">{product.status}</span>
            </div>
          </div>

          {/* Direct Commercial Actions */}
          <div className="bg-heritage-navy rounded-3xl border border-heritage-sand/20 p-6 space-y-3.5 text-white shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider">Procurement Actions</span>
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                100% Escrow Protected
              </span>
            </div>

            <button
              onClick={() => setShowSampleModal(true)}
              className="btn btn-gold w-full py-3 px-4 text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <ShoppingCart className="w-4 h-4" /> Order Sample Piece (₹{priceObj.suggested_price.toLocaleString('en-IN')})
            </button>

            <button
              onClick={() => setShowQuoteModal(true)}
              className="btn btn-primary w-full py-3 px-4 text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <ShoppingBag className="w-4 h-4" /> Request B2B Wholesale Proposal
            </button>

            <button
              onClick={() => setShowCertModal(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-heritage-gold/40 bg-white/5 hover:bg-white/10 text-heritage-gold font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" /> View GI Provenance Certificate
            </button>
          </div>

          {product.audio && product.audio.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-heritage-sand shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-heritage-navy font-bold text-sm">
                <Volume2 className="w-5 h-5 text-heritage-terracotta" />
                <span>Original Artisan Voice Note</span>
              </div>
              <audio controls src={resolveAssetUrl(product.audio[0].url)} className="w-full h-10" />
            </div>
          )}
        </div>

        {/* Right Column: Catalogue & Pricing Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Catalogue Overview Card */}
          <div className="bg-white rounded-3xl border border-heritage-sand p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-heritage-terracotta">{product.catalogue?.category}</span>
                <h1 className="text-2xl sm:text-3xl font-black font-serif text-heritage-navy mt-1">{product.catalogue?.name}</h1>
              </div>

              {(user?.role === 'ARTISAN' || user?.role === 'ADMIN') && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 bg-heritage-ivory hover:bg-stone-100 text-heritage-navy font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-heritage-sand shrink-0 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-heritage-terracotta" /> Edit Catalogue
                </button>
              )}
            </div>

            <p className="text-sm text-stone-700 leading-relaxed bg-heritage-ivory p-4 rounded-2xl border border-heritage-sand/70">
              {product.catalogue?.description}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-white text-heritage-navy font-bold text-xs rounded-full border border-heritage-sand shadow-sm">
                Craft: {product.catalogue?.craft}
              </span>
              <span className="px-3 py-1 bg-white text-heritage-navy font-bold text-xs rounded-full border border-heritage-sand shadow-sm">
                Material: {product.catalogue?.material}
              </span>
              {product.catalogue?.tags?.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-stone-100 text-stone-600 font-semibold text-xs rounded-full flex items-center gap-1">
                  <Tag className="w-3 h-3 text-stone-400" /> #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Fair Pricing Card */}
          <div className="bg-heritage-ivory rounded-3xl border border-heritage-sand p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-heritage-navy font-extrabold text-lg">
                <Sparkles className="w-5 h-5 text-heritage-gold" />
                <span className="font-serif">AI Fair Pricing Engine (उचित मूल्य निर्धारण)</span>
              </div>
              <span className="text-xs font-bold bg-white text-heritage-maroon px-3 py-1 rounded-full border border-heritage-sand shadow-sm">
                25% Artisan Margin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-heritage-sand shadow-sm">
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">{t.suggestedPrice}</span>
                <div className="flex items-center text-3xl font-black font-serif text-heritage-navy mt-1">
                  <IndianRupee className="w-7 h-7 text-heritage-gold" />
                  <span>{priceObj.suggested_price.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">{t.priceRange}</span>
                <div className="flex items-center text-lg font-bold text-stone-700 mt-2">
                  <span>₹{priceObj.price_range[0]?.toLocaleString('en-IN')} - ₹{priceObj.price_range[1]?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 bg-white p-4 rounded-xl border border-heritage-sand leading-relaxed italic">
              "{priceObj.explanation}"
            </p>

            <div className="border-t border-heritage-sand/70 pt-4">
              <button
                type="button"
                onClick={() => setShowPriceCustomizer((visible) => !visible)}
                className="w-full flex items-center justify-between text-left text-sm font-extrabold text-heritage-navy"
                aria-expanded={showPriceCustomizer}
              >
                <span>Customize Cost &amp; Labor Variables (मूल्य चर समायोजित करें)</span>
                {showPriceCustomizer ? <ChevronUp className="w-5 h-5 text-heritage-terracotta" /> : <ChevronDown className="w-5 h-5 text-heritage-terracotta" />}
              </button>

              {showPriceCustomizer && (
                <div className="mt-4 space-y-5 bg-white rounded-2xl border border-heritage-sand p-5 shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="material-cost" className="text-xs font-bold text-stone-700">Raw Material Cost (₹)</label>
                      <input
                        id="material-cost"
                        type="number"
                        min="50"
                        max="20000"
                        step="50"
                        value={materialCost}
                        onChange={(event) => setMaterialCost(Number(event.target.value))}
                        className="w-28 rounded-lg border border-heritage-sand px-2 py-1.5 text-right text-sm font-bold text-heritage-navy bg-heritage-ivory"
                      />
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="20000"
                      step="50"
                      value={materialCost}
                      onChange={(event) => setMaterialCost(Number(event.target.value))}
                      className="w-full accent-heritage-terracotta"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="days-to-make" className="text-xs font-bold text-stone-700">Artisan Labor Time (Days)</label>
                      <input
                        id="days-to-make"
                        type="number"
                        min="1"
                        max="60"
                        value={daysToMake}
                        onChange={(event) => setDaysToMake(Number(event.target.value))}
                        className="w-20 rounded-lg border border-heritage-sand px-2 py-1.5 text-right text-sm font-bold text-heritage-navy bg-heritage-ivory"
                      />
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={daysToMake}
                      onChange={(event) => setDaysToMake(Number(event.target.value))}
                      className="w-full accent-heritage-terracotta"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-stone-700">Craft Complexity</span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['low', 'medium', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setComplexity(level)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize transition-all ${
                            complexity === level
                              ? 'border-heritage-navy bg-heritage-navy text-white shadow-sm'
                              : 'border-heritage-sand bg-heritage-ivory text-heritage-navy hover:bg-stone-100'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-heritage-sand bg-heritage-ivory p-3.5 text-xs text-heritage-navy space-y-1">
                    <p className="font-bold">Labour Cost = {daysToMake} × ₹400/day = ₹{(daysToMake * 400).toLocaleString('en-IN')}</p>
                    <p>Material Cost = ₹{materialCost.toLocaleString('en-IN')} + Complexity Fee = ₹{({ low: 0, medium: 200, high: 500 }[complexity]).toLocaleString('en-IN')}</p>
                    <p className="text-emerald-700 font-semibold">+ 25% Sustainable Profit Margin Guaranteed</p>
                  </div>

                  {priceError && <p className="text-xs font-semibold text-rose-600">{priceError}</p>}
                  <button
                    type="button"
                    onClick={handleRecalculatePrice}
                    disabled={savingPrice}
                    className="btn btn-primary w-full py-3 text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    {savingPrice ? 'Recalculating...' : 'Recalculate & Save Price'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Buyer Opportunities Section */}
          <div className="bg-white rounded-3xl border border-heritage-sand p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-heritage-navy font-black text-xl font-serif">
              <Building2 className="w-6 h-6 text-heritage-terracotta" />
              <span>{t.matchingBuyers} ({opportunities.length})</span>
            </div>

            {opportunities.length > 0 ? (
              <div className="space-y-3">
                {opportunities.map((opp, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-heritage-sand bg-heritage-ivory hover:bg-stone-50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-heritage-navy text-sm font-serif">{opp.buyer_name}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 font-medium">{opp.requirement}</p>
                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-heritage-terracotta" /> {opp.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Match Score</span>
                        <span className="text-base font-black text-heritage-terracotta">{opp.match_score}%</span>
                      </div>
                      <button 
                        onClick={() => setShowQuoteModal(true)}
                        className="btn btn-gold text-xs py-2 px-3.5"
                      >
                        Connect Buyer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No buyer matches found yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Catalogue Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-heritage-navy/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-heritage-sand">
            <h3 className="text-xl font-bold font-serif text-heritage-navy">Edit AI Generated Catalogue</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-heritage-sand bg-heritage-ivory text-heritage-navy focus:border-heritage-gold font-medium text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                  Craft Story &amp; Description
                </label>
                <textarea
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-heritage-sand bg-heritage-ivory text-heritage-navy focus:border-heritage-gold font-medium text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-heritage-sand/60">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:text-heritage-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveCatalogue}
                className="btn btn-primary text-xs py-2.5 px-6 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* B2B Quote Modal */}
      {showQuoteModal && product && (
        <B2BQuoteModal
          product={product}
          onClose={() => setShowQuoteModal(false)}
          onSuccess={() => {
            setShowQuoteModal(false);
            alert('Quotation Request Transmitted! Our artisan cluster desk is preparing your proposal.');
          }}
        />
      )}

      {/* Sample Order Modal */}
      {showSampleModal && product && (
        <SampleOrderModal
          product={product}
          onClose={() => setShowSampleModal(false)}
          onSuccess={() => {
            setShowSampleModal(false);
          }}
        />
      )}

      {/* Provenance Certificate Modal */}
      {showCertModal && product && (
        <ProvenanceCertificateModal
          product={product}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
};
