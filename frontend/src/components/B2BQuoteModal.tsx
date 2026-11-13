import React, { useState } from 'react';
import { ProductDetail } from '../types';
import { apiRequest } from '../api/client';
import { X, CheckCircle2, ShieldCheck, Sparkles, Building2, Package, IndianRupee, Clock, ArrowRight, FileText } from 'lucide-react';

interface B2BQuoteModalProps {
  product: ProductDetail;
  onClose: () => void;
  onSuccess: (quoteDetails: B2BQuoteResponse) => void;
}

interface B2BQuoteResponse {
  opportunity_id: string;
  quantity: number;
  moq: number;
  estimated_lead_days: number;
  discount_percent: number;
  unit_price: number;
  estimated_total: number;
}

export const B2BQuoteModal: React.FC<B2BQuoteModalProps> = ({ product, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState<number>(product.moq || 50);
  const [buyerName, setBuyerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [packaging, setPackaging] = useState('Sustainable Jute Keepsake Bag');
  const [customNotes, setCustomNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverQuote, setServerQuote] = useState<B2BQuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const basePrice = product.pricing?.suggested_price || product.price?.suggested_price || 2500;
  
  // Tiered discount calculation
  let discountPercent = 0;
  if (quantity >= 200) {
    discountPercent = 18;
  } else if (quantity >= 50) {
    discountPercent = 10;
  }

  const packagingExtra = packaging === 'Laser-Engraved Corporate Wooden Box' ? 120 : 0;
  const unitDiscountedPrice = Math.round(basePrice * (1 - discountPercent / 100)) + packagingExtra;
  const totalValue = unitDiscountedPrice * quantity;
  const leadTime = Math.max(product.lead_time_days || 14, Math.ceil(quantity / 4));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !contactInfo) {
      setError('Please provide your name and contact details.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        buyer_name: buyerName,
        company_name: companyName || 'Enterprise Buyer',
        product_id: product.product_id || product.id,
        requirement: `Wholesale Quotation Request: ${quantity} units of "${product.catalogue?.name}". ${customNotes ? `Notes: ${customNotes}` : ''}`,
        quantity,
        packaging,
        contact_info: contactInfo,
      };

      const quote = await apiRequest<B2BQuoteResponse>('/opportunities', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setServerQuote(quote);
      setSubmitted(true);
      setTimeout(() => {
        onSuccess(quote);
      }, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit quotation request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Quotation Request Submitted!</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              The artisan cluster received your request for <strong className="text-white">{serverQuote?.quantity ?? quantity} units</strong>.
              {serverQuote && (
                <span className="mt-3 block text-sm text-slate-200">
                  Server estimate: ₹{serverQuote.estimated_total.toLocaleString('en-IN')} total
                  (₹{serverQuote.unit_price.toLocaleString('en-IN')} per unit), about {serverQuote.estimated_lead_days} working days.
                  The artisan's final confirmation is still pending.
                </span>
              )}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-amber-400" /> Direct Wholesale & Corporate Gifting RFQ
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Request B2B Wholesale Proposal
              </h2>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                {product.catalogue?.name} · Handcrafted in {product.region || 'India'}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Dynamic Volume Pricing Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Quantity</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min={product.moq || 10}
                      max="1000"
                      step="5"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-48 sm:w-64 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-base font-black text-white bg-slate-800 px-3 py-1 rounded-lg border border-white/10">
                      {quantity} units
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Unit Price</span>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    {discountPercent > 0 && (
                      <span className="text-xs text-slate-500 line-through">₹{basePrice.toLocaleString('en-IN')}</span>
                    )}
                    <span className="text-lg font-black text-amber-400">
                      ₹{unitDiscountedPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {discountPercent > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {discountPercent}% Tiered Discount Applied
                    </span>
                  )}
                </div>
              </div>

              {/* Estimate Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Quotation Value:</span>
                  <span className="font-extrabold text-white text-sm">₹{(serverQuote?.estimated_total ?? totalValue).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Crafting & Dispatch:</span>
                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> ~{serverQuote?.estimated_lead_days ?? leadTime} working days
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block">Minimum Order:</span>
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {serverQuote?.moq ?? product.moq ?? 10} units
                  </span>
                </div>
              </div>
            </div>

            {/* Procurement Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Priya Nair (Category Head)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 font-medium text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Organization / Brand
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. FabIndia / Boutique Hotel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 font-medium text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Business Email or Phone *
                </label>
                <input
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="e.g. procurement@luxuryboutique.com / +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 font-medium text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Packaging & Presentation
                </label>
                <select
                  value={packaging}
                  onChange={(e) => setPackaging(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-800 font-medium text-xs text-white outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Sustainable Jute Keepsake Bag">Sustainable Jute Keepsake Bag (Included)</option>
                  <option value="Eco-Friendly Kraft Gift Box">Eco-Friendly Kraft Gift Box (Included)</option>
                  <option value="Laser-Engraved Corporate Wooden Box">Laser-Engraved Corporate Wooden Box (+₹120/unit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Customization or Delivery Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Need sample approval by 15th; custom corporate logo stamp required."
                  className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 font-medium text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Catalog origin details shared with the artisan
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
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
