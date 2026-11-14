import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { X, Search, CheckCircle2, Clock, Truck, ShieldCheck, Package, MapPin, IndianRupee, AlertCircle } from 'lucide-react';

interface OrderTrackModalProps {
  onClose: () => void;
}

export const OrderTrackModal: React.FC<OrderTrackModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const orders = await apiRequest<any[]>(`/orders/track/${encodeURIComponent(query.trim())}`);
      setResults(orders);
    } catch (err: any) {
      setError(err.message || 'No matching orders found. Please verify the Order ID (e.g. KS-98421) or phone number.');
    } finally {
      setLoading(false);
    }
  };

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'CRAFTING': return 1;
      case 'QUALITY_CHECK': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      default: return 1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1A2E]/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#E1D6BE] bg-[#FAF5EA] text-[#1F1A2E] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-[#5E576B] hover:bg-[#FFFFFF] hover:text-[#1F1A2E] transition-all border border-transparent hover:border-[#E1D6BE]"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="eyebrow">Real-Time Cluster Logistics</span>
          <h2 className="text-2xl font-serif font-bold text-[#1F1A2E] tracking-tight mt-1">
            Track Artisan Order
          </h2>
          <p className="text-xs text-[#5E576B] mt-1">
            Enter your Order ID (e.g., <strong className="text-[#6E2233]">KS-98421</strong>) or registered phone number.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#B5532F] absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Order ID or 10-digit Phone"
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#E1D6BE] bg-[#FFFFFF] font-medium text-xs text-[#1F1A2E] placeholder-[#5E576B]/60 outline-none focus:border-[#B5532F] focus:ring-1 focus:ring-[#B5532F] shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary text-xs py-2 px-5 min-h-[38px] disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4 pt-2">
            {results.map((order) => {
              const stage = getStageIndex(order.delivery_status);
              return (
                <div key={order.order_id} className="rounded-2xl border border-[#E1D6BE] bg-[#FFFFFF] p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#6E2233]">#{order.order_id}</span>
                      <h4 className="font-serif font-bold text-base text-[#1F1A2E] mt-0.5">{order.product_name}</h4>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#FAF5EA] border border-[#B8893A] text-[#6E2233] font-bold text-[10px] uppercase">
                      {order.delivery_status}
                    </span>
                  </div>

                  {/* Delivery Timeline Stages */}
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[10px]">
                    <div className={`p-2.5 rounded-xl border ${stage >= 1 ? 'border-[#B8893A] bg-[#FAF5EA] text-[#1F1A2E]' : 'border-[#E1D6BE] text-[#5E576B]/60'}`}>
                      <Package className="w-4 h-4 mx-auto mb-1 text-[#B8893A]" />
                      <span className="font-bold block">Crafting</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${stage >= 2 ? 'border-[#22306B] bg-[#FAF5EA] text-[#1F1A2E]' : 'border-[#E1D6BE] text-[#5E576B]/60'}`}>
                      <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-[#22306B]" />
                      <span className="font-bold block">GI Inspection</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${stage >= 3 ? 'border-[#B5532F] bg-[#FAF5EA] text-[#1F1A2E]' : 'border-[#E1D6BE] text-[#5E576B]/60'}`}>
                      <Truck className="w-4 h-4 mx-auto mb-1 text-[#B5532F]" />
                      <span className="font-bold block">In Transit</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${stage >= 4 ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-[#E1D6BE] text-[#5E576B]/60'}`}>
                      <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                      <span className="font-bold block">Delivered</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E1D6BE] text-xs text-[#5E576B]">
                    <div>
                      <span>Artisan Maker: </span>
                      <strong className="text-[#1F1A2E]">{order.artisan_name}</strong>
                    </div>
                    <div className="text-right">
                      <span>Est. Arrival: </span>
                      <strong className="text-[#22306B]">{order.estimated_delivery}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
