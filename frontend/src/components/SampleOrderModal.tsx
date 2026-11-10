import React, { useState } from 'react';
import { ProductDetail } from '../types';
import { apiRequest } from '../api/client';
import { X, CheckCircle2, ShieldCheck, IndianRupee, Truck, CreditCard, Smartphone, Lock, ArrowRight } from 'lucide-react';

interface SampleOrderModalProps {
  product: ProductDetail;
  onClose: () => void;
  onSuccess: (order: any) => void;
}

export const SampleOrderModal: React.FC<SampleOrderModalProps> = ({ product, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'COD'>('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unitPrice = product.price?.suggested_price || product.pricing?.suggested_price || 2500;
  const totalAmount = unitPrice * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !address || !pincode) {
      setError('Please fill in all shipping details.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        product_id: product.product_id || product.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        shipping_address: `${address}, PIN: ${pincode}`,
        quantity,
        payment_method: paymentMethod === 'UPI' ? 'Instant UPI (GPay/PhonePe)' : paymentMethod === 'Card' ? 'Credit/Debit Card' : 'Escrow Cash on Delivery',
      };

      const res = await apiRequest<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setConfirmedOrder(res);
      onSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedOrder ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Order Confirmed · 100% Escrow Protected
              </span>
              <h2 className="text-2xl font-black text-white mt-2">Sample Dispatched to Maker</h2>
              <p className="text-xs text-slate-400 mt-1">
                Order Tracking ID: <strong className="text-amber-300 font-mono text-sm">{confirmedOrder.order_id}</strong>
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Craft Piece:</span>
                <span className="font-bold text-white truncate max-w-[200px]">{confirmedOrder.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Artisan Master:</span>
                <span className="font-bold text-amber-300">{confirmedOrder.artisan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Paid Amount:</span>
                <span className="font-black text-white text-sm">₹{confirmedOrder.total_amount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Delivery:</span>
                <span className="font-bold text-cyan-300">{confirmedOrder.estimated_delivery}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all"
            >
              Continue Exploring Heritage
            </button>
          </div>
        ) : (
          <>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Direct Artisan Purchase · Sandbox Demo Gateway
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Order Sample Piece
              </h2>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                {product.catalogue?.name} · Handcrafted by {product.artisan_name || 'Cluster Artisan'}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Price & Quantity Summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantity</span>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 5].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                        quantity === q
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Payable</span>
                <span className="text-xl font-black text-amber-300 flex items-center justify-end mt-1">
                  <IndianRupee className="w-4 h-4" />
                  {totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-end gap-1">
                  <Truck className="w-3 h-3" /> Free Insured Shipping
                </span>
              </div>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Phone (for Delivery updates) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9811122233"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, apartment, city, state"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Postal PIN Code *
                </label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 560038"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      paymentMethod === 'UPI'
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-amber-400 mb-1" />
                    <span>Instant UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Card')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      paymentMethod === 'Card'
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-indigo-400 mb-1" />
                    <span>Card / NetBanking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-emerald-400 mb-1" />
                    <span>Escrow Pay</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Securing Escrow Payment...' : `Confirm & Pay ₹${totalAmount.toLocaleString('en-IN')}`}
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
