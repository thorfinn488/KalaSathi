import React, { useState } from 'react';
import { ProductDetail } from '../types';
import { 
  X, Award, CheckCircle2, ShieldCheck, Printer, QrCode, 
  Share2, ExternalLink, Sparkles, MapPin, Feather, Check, Copy 
} from 'lucide-react';

interface ProvenanceCertificateModalProps {
  product: ProductDetail;
  onClose: () => void;
}

export const ProvenanceCertificateModal: React.FC<ProvenanceCertificateModalProps> = ({ product, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'certificate' | 'passport'>('certificate');

  const verificationId = `KS-GI-${(product.product_id || '9841').slice(-6).toUpperCase()}`;
  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}?verify=${verificationId}` 
    : `https://kalasathi.crafts/verify/${verificationId}`;

  // QR Code encoded SVG representation (authentic vector QR style)
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verificationUrl)}&color=d97706&bgcolor=1c1917`;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-heritage-navy/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-heritage-sand bg-white shadow-2xl p-5 sm:p-8 space-y-5 text-heritage-navy max-h-[92vh] overflow-y-auto">
        
        {/* Modal Controls */}
        <div className="flex items-center justify-between border-b border-heritage-sand pb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-heritage-gold" />
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('certificate')}
                className={`text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'certificate' 
                    ? 'bg-heritage-navy text-white shadow-sm' 
                    : 'text-stone-600 hover:text-heritage-navy hover:bg-stone-100'
                }`}
              >
                GI Certificate
              </button>
              <button
                onClick={() => setActiveTab('passport')}
                className={`text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'passport' 
                    ? 'bg-heritage-navy text-white shadow-sm' 
                    : 'text-stone-600 hover:text-heritage-navy hover:bg-stone-100'
                }`}
              >
                Digital Passport QR
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              aria-label="Print certificate"
              className="px-3 py-1.5 rounded-xl border border-heritage-sand bg-heritage-ivory hover:bg-stone-100 text-xs font-bold text-heritage-navy flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close provenance modal"
              className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeTab === 'certificate' ? (
          /* Classical Framed Certificate View */
          <div className="border-2 border-heritage-gold/50 rounded-2xl p-6 sm:p-8 bg-[#FAF6EE] relative space-y-5 text-center shadow-inner">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black tracking-[0.25em] text-heritage-terracotta block">
                Government of India · Geographical Indication (GI) Linked
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-heritage-navy font-serif tracking-tight">
                Certificate of Provenance &amp; Authenticity
              </h2>
              <p className="text-xs text-stone-500 font-mono">
                Verification Protocol ID: <strong className="text-heritage-maroon">{verificationId}</strong>
              </p>
            </div>

            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-heritage-gold to-transparent mx-auto" />

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed max-w-lg mx-auto">
              This document certifies that the artisanal artifact titled <strong className="text-heritage-navy">"{product.catalogue?.name}"</strong> is an unadulterated handmade creation, handcrafted in accordance with ancestral techniques registered under Indian GI guidelines.
            </p>

            {/* Structured Certificate Grid */}
            <div className="grid grid-cols-2 gap-3 text-left text-xs bg-white p-4 rounded-xl border border-heritage-sand shadow-sm">
              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Artisan Master</span>
                <strong className="text-heritage-navy text-sm font-serif">{product.artisan_name || 'Master Artisan'}</strong>
              </div>

              <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Heritage Cluster</span>
                <strong className="text-heritage-terracotta text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-heritage-terracotta inline" />
                  {product.region || 'Madhubani Cluster, Bihar'}
                </strong>
              </div>

              <div className="col-span-2 border-t border-heritage-sand/60 pt-2">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Raw Materials Certified</span>
                <span className="text-stone-700">{product.catalogue?.material || 'Natural vegetable dyes, organic handloom textile / paper'}</span>
              </div>

              <div className="col-span-2 border-t border-heritage-sand/60 pt-2">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Craft Methodology &amp; Tradition</span>
                <span className="text-stone-700">{product.catalogue?.craft || 'Handcrafted Heritage Guild Technique'}</span>
              </div>
            </div>

            {/* Trust Seals */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-heritage-sand/60 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-[11px]">
                <ShieldCheck className="w-5 h-5" />
                <span>Fair Trade &amp; Ethical Wage Verified</span>
              </div>

              <div className="flex items-center gap-1.5 text-heritage-gold text-[11px] font-semibold">
                <CheckCircle2 className="w-4 h-4 text-heritage-gold" />
                <span>KalaSaathi Provenance Registry</span>
              </div>
            </div>
          </div>
        ) : (
          /* Digital Passport & Printable QR Packaging Tag */
          <div className="space-y-4">
            <div className="bg-heritage-ivory rounded-2xl p-6 border border-heritage-sand flex flex-col sm:flex-row items-center gap-6">
              <div className="relative p-3 bg-white rounded-2xl border-2 border-dashed border-heritage-gold/50 flex flex-col items-center justify-center shadow-md">
                <img 
                  src={qrSvgUrl} 
                  alt="Craft Passport QR" 
                  className="w-36 h-36 rounded-lg p-1"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-[9px] font-mono text-heritage-gold font-bold mt-1.5 uppercase tracking-wider">
                  Scan to Verify
                </span>
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Packaging Labels
                </div>
                <h3 className="text-lg font-black font-serif text-heritage-navy">Smart Packaging QR Passport</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Stick this QR passport on your shipped boxes or physical craft hangtags. When end-buyers scan this code with their smartphone camera, they instantly see:
                </p>
                <ul className="text-xs text-stone-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <Feather className="w-3.5 h-3.5 text-heritage-terracotta" /> Verified Artisan Biography &amp; Workshop origin
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-heritage-gold" /> 100% GI Cluster Authenticity Certificate
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Transparent fair-wage artisan payout breakdown
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Share Link */}
            <div className="flex items-center gap-2 bg-heritage-ivory p-3 rounded-xl border border-heritage-sand text-xs">
              <input 
                type="text" 
                readOnly 
                value={verificationUrl} 
                className="bg-transparent flex-1 text-stone-700 font-mono text-[11px] outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="btn btn-gold text-xs py-1.5 px-3"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-[10px] text-stone-400">
          Official KalaSaathi Authenticity Engine · Linked to Ministry of Textiles Craft Cluster Registry
        </div>
      </div>
    </div>
  );
};
