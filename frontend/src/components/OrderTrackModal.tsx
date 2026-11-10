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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-2">
            <Truck className="w-3.5 h-3.5 text-cyan-400" /> Live Cluster Tracking
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Track Artisan Order
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your Order ID (e.g., <strong className="text-amber-300">KS-98421</strong>) or registered phone number.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. KS-98421 or 9811122233"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 font-medium text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4 pt-2">
            {results.map((order) => {
              const stage = getStageIndex(order.delivery_status);
              return (
                <div key={order.order_id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-black text-amber-300">#{order.order_id}</span>
                      <h4 className="font-bold text-sm text-white mt-0.5">{order.product_name}</h4>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black text-[10px] uppercase">
                      {order.delivery_status}
                    </span>
                  </div>

                  {/* Delivery Timeline Stages */}
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[10px]">
                    <div className={`p-2 rounded-xl border ${stage >= 1 ? 'border-amber-400/50 bg-amber-500/10 text-white' : 'border-white/5 text-slate-500'}`}>
                      <Package className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
                      <span className="font-bold block">Crafting</span>
                    </div>

                    <div className={`p-2 rounded-xl border ${stage >= 2 ? 'border-indigo-400/50 bg-indigo-500/10 text-white' : 'border-white/5 text-slate-500'}`}>
                      <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-400" />
                      <span className="font-bold block">GI Inspection</span>
                    </div>

                    <div className={`p-2 rounded-xl border ${stage >= 3 ? 'border-cyan-400/50 bg-cyan-500/10 text-white' : 'border-white/5 text-slate-500'}`}>
                      <Truck className="w-3.5 h-3.5 mx-auto mb-1 text-cyan-400" />
                      <span className="font-bold block">In Transit</span>
                    </div>

                    <div className={`p-2 rounded-xl border ${stage >= 4 ? 'border-emerald-400/50 bg-emerald-500/10 text-white' : 'border-white/5 text-slate-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                      <span className="font-bold block">Delivered</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs text-slate-400">
                    <div>
                      <span>Artisan Maker: </span>
                      <strong className="text-white">{order.artisan_name}</strong>
                    </div>
                    <div className="text-right">
                      <span>Est. Arrival: </span>
                      <strong className="text-cyan-300">{order.estimated_delivery}</strong>
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
