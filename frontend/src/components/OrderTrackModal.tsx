import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  searchTrackingOrders,
  DetailedOrder,
  SEED_TRACKING_ORDERS,
  getLocalPlacedOrders,
} from '../utils/orderTracking';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Package,
  MapPin,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Award,
  Phone,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  BadgePercent,
  Calendar,
} from 'lucide-react';

interface OrderTrackModalProps {
  onClose: () => void;
  initialQuery?: string;
}

export const OrderTrackModal: React.FC<OrderTrackModalProps> = ({ onClose, initialQuery }) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DetailedOrder[] | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [recentLocalOrders, setRecentLocalOrders] = useState<DetailedOrder[]>([]);

  // Load recent local orders on mount
  useEffect(() => {
    const local = getLocalPlacedOrders();
    setRecentLocalOrders(local);

    // If an initial query was passed (e.g. from SampleOrderModal), trigger search immediately
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const executeSearch = async (searchTarget: string) => {
    if (!searchTarget.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const orders = await searchTrackingOrders(searchTarget);
      if (orders.length === 0) {
        setError(`No active orders found matching "${searchTarget}". Try one of the verified sample orders below or your 10-digit phone number.`);
        setResults(null);
        setSelectedOrder(null);
      } else {
        setResults(orders);
        setSelectedOrder(orders[0]); // select the best matching order by default
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Tracking service temporarily unavailable. Please retry shortly.');
      setResults(null);
      setSelectedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleChipClick = (orderId: string) => {
    setQuery(orderId);
    executeSearch(orderId);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAwb(id);
    setTimeout(() => setCopiedAwb(null), 2000);
  };

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'CRAFTING':
        return 1;
      case 'QUALITY_CHECK':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  const currentStage = selectedOrder ? getStageIndex(selectedOrder.delivery_status) : 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        className="relative w-full max-w-3xl rounded-3xl border border-heritage-sand bg-heritage-ivory text-heritage-navy shadow-2xl p-5 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 rounded-full text-stone-500 hover:bg-white hover:text-heritage-navy transition-all border border-transparent hover:border-heritage-sand"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-heritage-navy text-amber-300 text-[11px] font-bold border border-amber-300/20 shadow-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            National Artisan GI Logistics Network
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-heritage-navy tracking-tight">
            Track Artisan Order &amp; Provenance
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
            Live cluster dispatch updates, digital GI inspection milestones, and fair-trade escrow tracking for certified mastercraft orders.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-heritage-terracotta absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Order ID (e.g. KS-98421) or 10-digit registered phone"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 bg-white font-medium text-xs sm:text-sm text-heritage-navy placeholder-stone-400 outline-none focus:border-heritage-terracotta focus:ring-2 focus:ring-heritage-terracotta/20 shadow-xs transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary text-xs sm:text-sm py-2 px-5 min-h-[42px] rounded-2xl font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-md"
          >
            {loading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track Order</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo & Recent Order Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            <span>Quick-Track Samples &amp; Recent Orders:</span>
            <span className="text-[10px] text-stone-400 font-normal">Click any tag to test</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentLocalOrders.slice(0, 2).map((order) => (
              <button
                key={order.order_id}
                type="button"
                onClick={() => handleChipClick(order.order_id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100/70 border border-amber-300 text-[11px] font-bold text-amber-900 hover:bg-amber-200/70 transition shadow-2xs"
              >
                <Package className="w-3 h-3 text-amber-700" />
                <span>Your Order: {order.order_id}</span>
              </button>
            ))}

            {SEED_TRACKING_ORDERS.map((seed) => (
              <button
                key={seed.order_id}
                type="button"
                onClick={() => handleChipClick(seed.order_id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-medium transition shadow-2xs ${
                  selectedOrder?.order_id === seed.order_id
                    ? 'bg-heritage-navy text-white border-heritage-navy'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <span className="font-mono font-bold">{seed.order_id}</span>
                <span className="text-stone-400">·</span>
                <span>
                  {seed.delivery_status === 'SHIPPED'
                    ? 'In Transit'
                    : seed.delivery_status === 'QUALITY_CHECK'
                    ? 'GI Lab Check'
                    : 'Delivered'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Order Not Located</p>
              <p className="mt-0.5 text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Order Results View */}
        {results && selectedOrder && (
          <div className="space-y-5 pt-1">
            {/* If multiple orders returned (e.g. by customer phone) */}
            {results.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-stone-500 whitespace-nowrap">Found {results.length} orders:</span>
                {results.map((ord) => (
                  <button
                    key={ord.order_id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition whitespace-nowrap ${
                      selectedOrder.order_id === ord.order_id
                        ? 'bg-heritage-navy text-white border-heritage-navy'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    #{ord.order_id} ({ord.delivery_status})
                  </button>
                ))}
              </div>
            )}

            {/* Active Order Card */}
            <div className="rounded-3xl border border-heritage-sand bg-white p-5 sm:p-6 space-y-6 shadow-md">
              {/* Top Meta Line */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-heritage-terracotta shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-heritage-navy">
                        #{selectedOrder.order_id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {selectedOrder.payment_status === 'PAID' ? 'Escrow Funded' : selectedOrder.payment_status}
                      </span>
                    </div>
                    <h3 className="font-serif font-black text-lg sm:text-xl text-heritage-navy mt-0.5">
                      {selectedOrder.product_name}
                    </h3>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Total Procurement</span>
                  <span className="font-serif font-black text-xl text-heritage-navy">
                    ₹{selectedOrder.total_amount?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Qty: {selectedOrder.quantity} · Unit: ₹{selectedOrder.unit_price?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* ── 4-Stage Connected Stepper ── */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-3 uppercase tracking-wider">
                  <span>Logistics Pipeline &amp; Verification</span>
                  <span className="text-heritage-terracotta font-extrabold">
                    {selectedOrder.delivery_status === 'CRAFTING' && 'Stage 1 of 4: Crafting in Cluster'}
                    {selectedOrder.delivery_status === 'QUALITY_CHECK' && 'Stage 2 of 4: GI Lab Inspection'}
                    {selectedOrder.delivery_status === 'SHIPPED' && 'Stage 3 of 4: In Transit to Patron'}
                    {selectedOrder.delivery_status === 'DELIVERED' && 'Stage 4 of 4: Delivered & Settled'}
                  </span>
                </div>

                {/* Visual Progress Bar Line */}
                <div className="relative mb-6">
                  <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 bg-stone-100 rounded-full" />
                  <div
                    className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 bg-gradient-to-r from-heritage-navy via-heritage-terracotta to-emerald-600 rounded-full transition-all duration-500"
                    style={{
                      width:
                        currentStage === 1
                          ? '12%'
                          : currentStage === 2
                          ? '38%'
                          : currentStage === 3
                          ? '68%'
                          : '100%',
                    }}
                  />
                </div>

                {/* Stepper Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                  {/* Step 1 */}
                  <div
                    className={`p-3 rounded-2xl border transition-all ${
                      currentStage >= 1
                        ? 'border-amber-300 bg-amber-50/50 text-heritage-navy shadow-xs'
                        : 'border-stone-200 bg-stone-50/60 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-800">
                        <Package className="w-4 h-4" />
                      </div>
                      {currentStage > 1 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold block text-heritage-navy">1. Crafting</span>
                    <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                      Master artisan crafting; 40% advance funded
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`p-3 rounded-2xl border transition-all ${
                      currentStage >= 2
                        ? 'border-indigo-300 bg-indigo-50/50 text-heritage-navy shadow-xs'
                        : 'border-stone-200 bg-stone-50/60 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-800">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      {currentStage > 2 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : currentStage === 2 ? (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                      ) : null}
                    </div>
                    <span className="text-[11px] font-bold block text-heritage-navy">2. GI Inspection</span>
                    <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                      Physical lab assay &amp; digital passport audit
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`p-3 rounded-2xl border transition-all ${
                      currentStage >= 3
                        ? 'border-orange-300 bg-orange-50/50 text-heritage-navy shadow-xs'
                        : 'border-stone-200 bg-stone-50/60 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-800">
                        <Truck className="w-4 h-4" />
                      </div>
                      {currentStage > 3 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : currentStage === 3 ? (
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                      ) : null}
                    </div>
                    <span className="text-[11px] font-bold block text-heritage-navy">3. Dispatched</span>
                    <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                      Insured express courier in transit
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div
                    className={`p-3 rounded-2xl border transition-all ${
                      currentStage >= 4
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-xs'
                        : 'border-stone-200 bg-stone-50/60 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-800">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      {currentStage === 4 && <Check className="w-4 h-4 text-emerald-700" />}
                    </div>
                    <span className="text-[11px] font-bold block text-emerald-950">4. Delivered</span>
                    <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                      Patron handover; 60% escrow released
                    </span>
                  </div>
                </div>
              </div>

              {/* Courier & AWB Logistics Information Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Logistics Partner</span>
                  <div className="flex items-center gap-1.5 mt-0.5 font-bold text-heritage-navy">
                    <Truck className="w-3.5 h-3.5 text-heritage-terracotta" />
                    <span>{selectedOrder.carrier_name || 'India Post Heritage Express'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">AWB Tracking No.</span>
                  <div className="flex items-center gap-1.5 mt-0.5 font-mono font-bold text-heritage-navy">
                    <span>{selectedOrder.awb_number || 'PENDING_DISPATCH'}</span>
                    {selectedOrder.awb_number && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedOrder.awb_number!, 'awb')}
                        className="text-stone-400 hover:text-heritage-navy transition p-0.5 rounded"
                        title="Copy AWB number"
                      >
                        {copiedAwb === 'awb' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Estimated Delivery</span>
                  <div className="flex items-center gap-1.5 mt-0.5 font-bold text-emerald-800">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedOrder.estimated_delivery}</span>
                  </div>
                </div>
              </div>

              {/* ── Two Column: Provenance Card & Timeline Checkpoints ── */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
                {/* Left 5 Cols: Artisan & Escrow Guarantee */}
                <div className="md:col-span-5 space-y-4">
                  {/* Artisan & Cluster Badge */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <Award className="w-4 h-4 text-amber-700" />
                      <span>Artisan &amp; Provenance Guarantee</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="text-stone-700">
                        <strong className="text-heritage-navy font-bold">{selectedOrder.artisan_name}</strong>
                      </p>
                      <p className="text-stone-500 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>{selectedOrder.cluster_region}</span>
                      </p>
                      <p className="text-[11px] font-mono text-heritage-navy pt-1 font-bold">
                        GI Certificate: <span className="text-amber-800">{selectedOrder.gi_tag_cert || 'GI-VERIFIED-2026'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Escrow Transparency Card */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/60 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                      <ShieldCheck className="w-4 h-4 text-indigo-700" />
                      <span>Fair-Trade Escrow Breakdown</span>
                    </div>
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex justify-between text-stone-600">
                        <span>40% Upfront Advance (Artisan):</span>
                        <strong className="text-emerald-700">
                          ₹{Math.round((selectedOrder.total_amount * 0.4)).toLocaleString('en-IN')} (Paid)
                        </strong>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>60% Escrow Hold (Delivery Guarantee):</span>
                        <strong className="text-indigo-950">
                          ₹{Math.round((selectedOrder.total_amount * 0.6)).toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-500 leading-tight pt-1 border-t border-indigo-100">
                      Funds are held in secure escrow and released to the cooperative upon successful delivery verification.
                    </p>
                  </div>
                </div>

                {/* Right 7 Cols: Checkpoint Timeline */}
                <div className="md:col-span-7 space-y-3">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Live Checkpoint Trail</span>
                    <span className="text-[10px] text-stone-400 font-normal">Real-Time Cluster Feed</span>
                  </h4>

                  <div className="space-y-3 relative pl-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                    {selectedOrder.timeline.map((event, idx) => (
                      <div key={idx} className="relative pl-4 text-xs">
                        {/* Dot Indicator */}
                        <div
                          className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 bg-white transition-all ${
                            event.current
                              ? 'border-heritage-terracotta bg-heritage-terracotta ring-4 ring-orange-100'
                              : event.completed
                              ? 'border-emerald-600 bg-emerald-600'
                              : 'border-stone-300 bg-stone-100'
                          }`}
                        />

                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`font-bold ${event.completed ? 'text-heritage-navy' : 'text-stone-400'}`}>
                            {event.title}
                          </p>
                          <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                            {event.timestamp}
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-stone-400" />
                          <span>{event.location}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted 256-bit National GI Tracking · Verifiable ESG Chain of Custody</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-full border border-stone-300 bg-white hover:bg-stone-50 font-bold text-heritage-navy transition shadow-2xs"
          >
            Close Tracker
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
