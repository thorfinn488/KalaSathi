import React, { useEffect, useState } from 'react';
import { OpportunityListItem } from '../types';
import { apiRequest } from '../api/client';
import { Building2, MapPin, ShieldCheck, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CounterOfferModal, CounterOfferSubmission } from '../components/CounterOfferModal';

export const OpportunitiesPage: React.FC = () => {
  const { t } = useLanguage();
  const [opportunities, setOpportunities] = useState<OpportunityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<OpportunityListItem | null>(null);
  const [submittedOffers, setSubmittedOffers] = useState<Record<string, CounterOfferSubmission>>({});

  useEffect(() => {
    async function loadOpps() {
      try {
        const data = await apiRequest<OpportunityListItem[]>('/opportunities');
        setOpportunities(data || []);
      } catch (err) {
        console.error('Failed to load opportunities:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOpps();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-sans">
      <div className="relative overflow-hidden bg-heritage-navy p-8 sm:p-10 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-heritage-sand/20">
        <div className="absolute inset-0 bg-hero-woven-bg opacity-15 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-heritage-gold text-xs font-bold border border-white/15">
            <Sparkles className="w-3.5 h-3.5" /> Direct B2B Market Linkage
          </div>
          <h1 className="text-3xl font-black font-serif text-white">{t.opportunities}</h1>
          <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
            Connect directly with verified retail enterprises, export buyers, and boutique stores looking for authentic Indian handicraft products.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-500 font-serif text-lg">Loading buyer opportunities...</div>
      ) : opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opportunities.map((opp) => (
            <div key={opp.opportunity_id} className="bg-white p-6 rounded-2xl border border-heritage-sand shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-heritage-terracotta uppercase tracking-wider block">{opp.company_name}</span>
                  <h3 className="text-lg font-bold font-serif text-heritage-navy mt-1">{opp.buyer_name}</h3>
                </div>
                <span className="px-3 py-1 bg-heritage-ivory text-heritage-navy font-black text-sm rounded-full border border-heritage-sand">
                  {opp.match_score}% Match
                </span>
              </div>

              <p className="text-xs text-stone-700 bg-heritage-ivory p-3.5 rounded-xl border border-heritage-sand/70 leading-relaxed font-medium">
                "{opp.requirement}"
              </p>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-heritage-terracotta" /> Verified Procurement
                </span>
                {submittedOffers[opp.opportunity_id] ? (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Proposal Sent (₹{submittedOffers[opp.opportunity_id].proposed_unit_price})
                  </span>
                ) : (
                  <button
                    onClick={() => setSelectedOpp(opp)}
                    className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" /> Propose Terms / Quote
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-heritage-ivory p-12 text-center rounded-3xl border-2 border-dashed border-heritage-sand space-y-2">
          <Building2 className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold font-serif text-heritage-navy">No Open Buyer Opportunities</h3>
          <p className="text-xs text-stone-500">Check back soon for new retail buyer demands.</p>
        </div>
      )}

      {selectedOpp && (
        <CounterOfferModal
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
          onSuccess={(submission) => {
            setSubmittedOffers(prev => ({ ...prev, [submission.opportunity_id]: submission }));
            setSelectedOpp(null);
          }}
        />
      )}
    </div>
  );
};
