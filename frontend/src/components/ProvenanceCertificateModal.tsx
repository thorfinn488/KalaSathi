import React from 'react';
import { ProductDetail } from '../types';
import { X, Award, CheckCircle2, ShieldCheck, Printer, QrCode } from 'lucide-react';

interface ProvenanceCertificateModalProps {
  product: ProductDetail;
  onClose: () => void;
}

export const ProvenanceCertificateModal: React.FC<ProvenanceCertificateModalProps> = ({ product, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-stone-900 to-stone-950 shadow-2xl p-6 sm:p-9 space-y-6 text-white max-h-[92vh] overflow-y-auto">
        {/* Action Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold">
              Official Heritage Certificate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Print Certificate
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Vintage border frame) */}
        <div className="border border-amber-500/30 rounded-2xl p-6 sm:p-8 bg-stone-900/60 relative space-y-5 text-center">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-[0.25em] text-amber-400/80 block">
              Government of India · Geographical Indication (GI) Linked
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-100 font-serif tracking-tight">
              Certificate of Provenance &amp; Authenticity
            </h2>
            <p className="text-xs text-stone-400 italic">
              Verification Code: KS-GI-{(product.product_id || '9841').slice(-6).toUpperCase()}
            </p>
          </div>

          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto" />

          <p className="text-xs text-stone-300 leading-relaxed max-w-md mx-auto">
            This document certifies that the artisanal treasure titled <strong className="text-amber-200">"{product.catalogue?.name}"</strong> is an unadulterated handmade artifact, created in accordance with centuries-old ancestral techniques.
          </p>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-3 text-left text-xs bg-stone-950/70 p-4 rounded-xl border border-amber-500/20">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Artisan Master</span>
              <strong className="text-white text-sm">{product.artisan_name || 'Sunita Devi'}</strong>
            </div>

            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Heritage Cluster</span>
              <strong className="text-amber-300 text-sm">{product.region || 'Madhubani, Bihar'}</strong>
            </div>

            <div className="col-span-2 border-t border-white/5 pt-2">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Raw Materials Certified</span>
              <span className="text-stone-300">{product.catalogue?.material || '100% Organic natural vegetable pigments & unbleached paper'}</span>
            </div>

            <div className="col-span-2 border-t border-white/5 pt-2">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Craft Methodology</span>
              <span className="text-stone-300">{product.catalogue?.craft || 'Traditional Kachni Fine Line Handwork'}</span>
            </div>
          </div>

          {/* Trust Seal */}
          <div className="pt-3 flex items-center justify-between border-t border-white/10 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
              <ShieldCheck className="w-5 h-5" />
              <span>Fair Trade Verified</span>
            </div>

            <div className="flex items-center gap-1.5 text-stone-400 text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>KalaSaathi Trust Guarantee</span>
            </div>
          </div>

          <p className="text-[10px] text-stone-500 italic text-center pt-1">
            Digital prototype credential generated by KalaSaathi cluster verification protocol.
          </p>
        </div>
      </div>
    </div>
  );
};
