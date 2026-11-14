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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-stone-900 shadow-2xl p-6 sm:p-7 space-y-5 text-white">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-stone-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Counter-Offer Transmitted!</h3>
            <p className="text-xs text-stone-300">
              Your counter-offer has been routed to <strong className="text-amber-300">{opportunity.company_name}</strong> for procurement sign-off.
            </p>
          </div>
        ) : (
          <>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                Wholesale Negotiation Desk
              </span>
              <h2 className="text-xl font-black text-amber-100 mt-1">
                Propose Terms to {opportunity.company_name}
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Requirement: "{opportunity.requirement}"
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Proposed Unit Price */}
                <div className="bg-stone-950/80 p-3.5 rounded-2xl border border-white/5 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block">
                    Unit Counter Price
                  </label>
                  <div className="flex items-center text-amber-400 font-black text-lg">
                    <IndianRupee className="w-4 h-4 mr-0.5" />
                    <input
                      type="number"
                      min="50"
                      step="50"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(Number(e.target.value))}
                      className="bg-transparent w-full text-white font-black text-lg outline-none"
                    />
                  </div>
                </div>

                {/* Delivery Timeline */}
                <div className="bg-stone-950/80 p-3.5 rounded-2xl border border-white/5 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-400 block">
                    Lead Time (Days)
                  </label>
                  <div className="flex items-center text-cyan-400 font-black text-lg">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <input
                      type="number"
                      min="3"
                      max="90"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(Number(e.target.value))}
                      className="bg-transparent w-full text-white font-black text-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Escrow Advance Deposit */}
              <div className="bg-stone-950/80 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-400">
                    Artisan Raw Material Advance
                  </span>
                  <span className="font-bold text-emerald-400">{depositPercent}% Upfront Escrow</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  step="5"
                  value={depositPercent}
                  onChange={(e) => setDepositPercent(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-stone-500 block">
                  Protects artisan cluster cashflow for purchasing authentic silk, wood, or raw pigments.
                </span>
              </div>

              {/* Message Note */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-stone-400 block">
                  Message to Buyer / Special Terms
                </label>
                <textarea
                  rows={2}
                  value={artisanNote}
                  onChange={(e) => setArtisanNote(e.target.value)}
                  placeholder="e.g. Can include custom cluster seal on back of every piece; 2 samples ready for courier."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-stone-500 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fair Trade Agreement Bound</span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
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
