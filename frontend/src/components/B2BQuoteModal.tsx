import React, { useState, useEffect } from 'react';
import { ProductDetail } from '../types';
import { apiRequest } from '../api/client';
import { X, Sparkles, CheckCircle2, ShieldCheck, Clock, ArrowRight, IndianRupee, Layers, Package } from 'lucide-react';

interface B2BQuoteModalProps {
  product: ProductDetail;
  onClose: () => void;
  onSuccess: () => void;
}

interface ServerQuotePreview {
  quantity: number;
  unit_price: number;
  estimated_total: number;
  estimated_lead_days: number;
  discount_percent: number;
  moq: number;
}

export const B2BQuoteModal: React.FC<B2BQuoteModalProps> = ({ product, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState(product.moq || 25);
  const [buyerName, setBuyerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [packaging, setPackaging] = useState('Sustainable Jute Keepsake Bag');
  const [customNotes, setCustomNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [serverQuote, setServerQuote] = useState<ServerQuotePreview | null>(null);

  const basePrice = product.price?.suggested_price || product.pricing?.suggested_price || 3500;

  useEffect(() => {
    let ignore = false;
    async function fetchQuotePreview() {
      try {
        const preview = await apiRequest<ServerQuotePreview>(
          `/products/${encodeURIComponent(product.product_id)}/wholesale-quote?quantity=${encodeURIComponent(quantity)}`,
        );
        if (!ignore && preview) {
          setServerQuote(preview);
        }
      } catch {
        // Fallback to local computation
      }
    }
    fetchQuotePreview();
    return () => {
      ignore = true;
    };
  }, [product.product_id, quantity]);

  let discountPercent = 0;
  if (quantity >= 500) discountPercent = 30;
  else if (quantity >= 200) discountPercent = 25;
  else if (quantity >= 100) discountPercent = 20;
  else if (quantity >= 50) discountPercent = 15;
  else if (quantity >= 25) discountPercent = 10;

  const unitDiscountedPrice = Math.round(basePrice * (1 - discountPercent / 100));
  const totalValue = unitDiscountedPrice * quantity;
  const leadTime = Math.min(60, Math.max(10, Math.round((product.lead_time_days || 14) * (1 + quantity / 250))));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest('/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.product_id,
          buyer_name: buyerName.trim(),
          company_name: companyName.trim() || undefined,
          requirement: `B2B Wholesale Request: ${quantity} units of "${product.catalogue?.name}". Packaging: ${packaging}. Notes: ${customNotes.trim() || 'None'}. Contact: ${contactInfo.trim()}`,
        }),
      });

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1A2E]/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#E1D6BE] bg-[#FAF5EA] text-[#1F1A2E] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-[#5E576B] hover:bg-[#FFFFFF] hover:text-[#1F1A2E] transition-all border border-transparent hover:border-[#E1D6BE]"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#1B2352] text-[#E4C27A] mx-auto flex items-center justify-center shadow-lg border border-[#E4C27A]/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#1F1A2E]">Quotation Request Submitted!</h2>
            <p className="text-xs text-[#5E576B] max-w-md mx-auto leading-relaxed">
              The artisan cluster has received your wholesale specification for <strong className="text-[#1F1A2E] font-bold">{serverQuote?.quantity ?? quantity} units</strong>.
              {serverQuote && (
                <span className="mt-2 block text-xs text-[#22306B] font-semibold">
                  Server estimate: ₹{serverQuote.estimated_total.toLocaleString('en-IN')} total (₹{serverQuote.unit_price.toLocaleString('en-IN')}/unit), ~{serverQuote.estimated_lead_days} working days. The cluster will review and confirm.
                </span>
              )}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div>
              <span className="eyebrow">Direct Wholesale & Corporate Gifting RFQ</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1A2E] tracking-tight mt-1">
                Request B2B Wholesale Proposal
              </h2>
              <p className="text-xs text-[#5E576B] mt-1">
                {product.catalogue?.name} · Handcrafted in {product.region || 'India'}
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Dynamic Volume Pricing Card */}
            <div className="rounded-2xl border border-[#E1D6BE] bg-[#FFFFFF] p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-[#5E576B] uppercase tracking-wider block">Quantity</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <input
                      type="range"
                      min={product.moq || 10}
                      max="1000"
                      step="5"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-48 sm:w-60 accent-[#B5532F] cursor-pointer"
                    />
                    <span className="text-sm font-bold text-[#1F1A2E] bg-[#FAF5EA] px-3 py-1 rounded-full border border-[#E1D6BE]">
                      {quantity} units
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[11px] font-bold text-[#5E576B] uppercase tracking-wider block">Unit Price</span>
                  <div className="flex items-center sm:justify-end gap-2 mt-1">
                    {discountPercent > 0 && (
                      <span className="text-xs text-[#5E576B] line-through">₹{basePrice.toLocaleString('en-IN')}</span>
                    )}
                    <span className="text-xl font-serif font-bold text-[#6E2233]">
                      ₹{unitDiscountedPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {discountPercent > 0 && (
                    <span className="text-[10px] font-bold text-[#B5532F] bg-[#FAF5EA] px-2.5 py-0.5 rounded-full border border-[#B8893A]/50">
                      {discountPercent}% Tiered Cluster Discount
                    </span>
                  )}
                </div>
              </div>

              {/* Estimate Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E1D6BE] text-xs">
                <div>
                  <span className="text-[#5E576B] block">Total Proposal Value:</span>
                  <span className="font-serif font-bold text-[#1F1A2E] text-base">₹{(serverQuote?.estimated_total ?? totalValue).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[#5E576B] block">Crafting & Dispatch:</span>
                  <span className="font-bold text-[#22306B] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#B8893A]" /> ~{serverQuote?.estimated_lead_days ?? leadTime} working days
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[#5E576B] block">Minimum Order:</span>
                  <span className="font-bold text-[#6E2233] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {serverQuote?.moq ?? product.moq ?? 10} units
                  </span>
                </div>
              </div>
            </div>

            {/* Procurement Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1F1A2E] uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Priya Nair (Head of Procurement)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1D6BE] bg-[#FFFFFF] font-medium text-xs text-[#1F1A2E] placeholder-[#5E576B]/60 outline-none focus:border-[#B5532F] focus:ring-1 focus:ring-[#B5532F] shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1F1A2E] uppercase tracking-wider mb-1">
                    Organization / Brand
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Heritage Luxe Hospitality / Retail"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1D6BE] bg-[#FFFFFF] font-medium text-xs text-[#1F1A2E] placeholder-[#5E576B]/60 outline-none focus:border-[#B5532F] focus:ring-1 focus:ring-[#B5532F] shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F1A2E] uppercase tracking-wider mb-1">
                  Business Email or Contact *
                </label>
                <input
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="e.g. procurement@company.com / +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1D6BE] bg-[#FFFFFF] font-medium text-xs text-[#1F1A2E] placeholder-[#5E576B]/60 outline-none focus:border-[#B5532F] focus:ring-1 focus:ring-[#B5532F] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F1A2E] uppercase tracking-wider mb-1">
                  Packaging & Presentation
                </label>
                <select
                  value={packaging}
                  onChange={(e) => setPackaging(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1D6BE] bg-[#FFFFFF] font-medium text-xs text-[#1F1A2E] outline-none focus:border-[#B5532F] focus:ring-1 focus:ring-[#B5532F] shadow-xs"
                >
                  <option value="Sustainable Jute Keepsake Bag">Sustainable Jute Keepsake Bag (Included)</option>
                  <option value="Eco-Friendly Kraft Gift Box">Eco-Friendly Kraft Gift Box (Included)</option>
                  <option value="Laser-Engraved Corporate Wooden Box">Laser-Engraved Corporate Wooden Box (+₹120/unit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F1A2E] uppercase tracking-wider mb-1">
                  Customization or Delivery Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Require custom corporate emblem engraving; export documentation needed."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1D6BE] bg-[#FFFFFF] font-medium text-xs text-[#1F1A2E] placeholder-[#5E576B]/60 outline-none focus:border-[#B5532F] focus:ring-1 focus:ring-[#B5532F] shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#5E576B] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#B8893A]" />
                  Zero middleman markup direct cluster RFQ
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary text-xs py-2.5 px-6 min-h-[42px] disabled:opacity-50"
                >
                  {submitting ? 'Generating Proposal...' : 'Transmit Quotation Request'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
