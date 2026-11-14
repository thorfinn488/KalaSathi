import React, { useState } from 'react';
import { OpportunityListItem } from '../types';
import { IndianRupee, Send, ShieldCheck, CheckCircle2, Clock, X, MessageSquare, ArrowRight } from 'lucide-react';

interface CounterOfferModalProps {
  opportunity: OpportunityListItem;
  onClose: () => void;
  onSuccess: (offer: CounterOfferSubmission) => void;
}

export interface CounterOfferSubmission {
  opportunity_id: string;
  proposed_unit_price: number;
  delivery_days: number;
  artisan_note: string;
  deposit_percentage: number;
  status: 'PENDING_BUYER_REVIEW';
}

export const CounterOfferModal: React.FC<CounterOfferModalProps> = ({ opportunity, onClose, onSuccess }) => {
  const [proposedPrice, setProposedPrice] = useState<number>(2400);
  const [deliveryDays, setDeliveryDays] = useState<number>(14);
  const [depositPercent, setDepositPercent] = useState<number>(40);
  const [artisanNote, setArtisanNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const submission: CounterOfferSubmission = {
      opportunity_id: opportunity.opportunity_id,
      proposed_unit_price: proposedPrice,
      delivery_days: deliveryDays,
      artisan_note: artisanNote || 'Handcrafted directly by master cluster artisans with authentic raw materials.',
      deposit_percentage: depositPercent,
      status: 'PENDING_BUYER_REVIEW'
    };

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        onSuccess(submission);
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-heritage-navy/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-heritage-sand bg-white shadow-2xl p-6 sm:p-7 space-y-5 text-heritage-navy">
        <button
          onClick={onClose}
          aria-label="Close counter offer modal"
          className="absolute right-5 top-5 p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-serif text-heritage-navy">Counter-Offer Transmitted!</h3>
            <p className="text-xs text-stone-600">
              Your counter-offer has been routed to <strong className="text-heritage-terracotta">{opportunity.company_name}</strong> for procurement sign-off.
            </p>
          </div>
        ) : (
          <>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-heritage-gold block">
                Wholesale Negotiation Desk
              </span>
              <h2 className="text-xl font-black font-serif text-heritage-navy mt-1">
                Propose Terms to {opportunity.company_name}
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Requirement: "{opportunity.requirement}"
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Proposed Unit Price */}
                <div className="bg-heritage-ivory p-3.5 rounded-2xl border border-heritage-sand space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-500 block">
                    Unit Counter Price
                  </label>
                  <div className="flex items-center text-heritage-navy font-black text-lg">
                    <IndianRupee className="w-4 h-4 mr-0.5 text-heritage-gold" />
                    <input
                      type="number"
                      min="50"
                      step="50"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(Number(e.target.value))}
                      className="bg-transparent w-full text-heritage-navy font-black text-lg outline-none"
                    />
                  </div>
                </div>

                {/* Delivery Timeline */}
                <div className="bg-heritage-ivory p-3.5 rounded-2xl border border-heritage-sand space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-500 block">
                    Lead Time (Days)
                  </label>
                  <div className="flex items-center text-heritage-navy font-black text-lg">
                    <Clock className="w-4 h-4 mr-1.5 text-heritage-terracotta" />
                    <input
                      type="number"
                      min="3"
                      max="90"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(Number(e.target.value))}
                      className="bg-transparent w-full text-heritage-navy font-black text-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Escrow Advance Deposit */}
              <div className="bg-heritage-ivory p-3.5 rounded-2xl border border-heritage-sand space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-600">
                    Artisan Raw Material Advance
                  </span>
                  <span className="font-bold text-heritage-maroon">{depositPercent}% Upfront Escrow</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  step="5"
                  value={depositPercent}
                  onChange={(e) => setDepositPercent(Number(e.target.value))}
                  className="w-full accent-heritage-terracotta cursor-pointer"
                />
                <span className="text-[10px] text-stone-500 block">
                  Protects artisan cluster cashflow for purchasing authentic silk, wood, or raw pigments.
                </span>
              </div>

              {/* Message Note */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-600 block">
                  Message to Buyer / Special Terms
                </label>
                <textarea
                  rows={2}
                  value={artisanNote}
                  onChange={(e) => setArtisanNote(e.target.value)}
                  placeholder="e.g. Can include custom cluster seal on back of every piece; 2 samples ready for courier."
                  className="w-full px-3 py-2 rounded-xl bg-heritage-ivory border border-heritage-sand text-xs text-heritage-navy placeholder-stone-400 outline-none focus:border-heritage-gold"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fair Trade Agreement Bound</span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary text-xs py-2.5 px-5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Send Counter Offer'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
