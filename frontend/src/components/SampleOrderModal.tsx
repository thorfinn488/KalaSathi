import React, { useState } from 'react';
import { ProductDetail } from '../types';
import { apiRequest } from '../api/client';
import { X, CheckCircle2, ShieldCheck, IndianRupee, Truck, ArrowRight, Loader2, Award } from 'lucide-react';

interface OrderResponse {
  order_id: string;
  product_name: string;
  artisan_name: string;
  total_amount: number;
  estimated_delivery: string;
  payment_status: 'PAID' | 'PENDING';
  payment_mode?: 'sandbox' | 'razorpay';
  checkout?: {
    key_id: string;
    order_id: string;
    amount: number;
    currency: string;
  };
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckout {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; contact: string };
  handler: (response: RazorpayPaymentResponse) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

interface SampleOrderModalProps {
  product: ProductDetail;
  onClose: () => void;
  onSuccess: (order: OrderResponse) => void;
}

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay checkout script.')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
    document.body.appendChild(script);
  });
}

export const SampleOrderModal: React.FC<SampleOrderModalProps> = ({ product, onClose, onSuccess }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutOrder, setCheckoutOrder] = useState<OrderResponse | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderResponse | null>(null);

  const price = product.price?.suggested_price || product.pricing?.suggested_price || 3500;
  const totalAmount = price * quantity;

  const openRazorpayCheckout = async (order: OrderResponse) => {
    if (!order.checkout) {
      setError('Razorpay checkout details are missing from order response.');
      return;
    }

    try {
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Razorpay SDK unavailable.');

      const razorpay = new window.Razorpay({
        key: order.checkout.key_id,
        amount: order.checkout.amount,
        currency: order.checkout.currency,
        name: 'KalaSaathi Living Heritage',
        description: `Sample: ${order.product_name}`,
        order_id: order.checkout.order_id,
        prefill: {
          name: customerName,
          contact: customerPhone,
        },
        handler: async (response: RazorpayPaymentResponse) => {
          setSubmitting(true);
          try {
            const verified = await apiRequest<OrderResponse>(
              `/orders/${encodeURIComponent(order.order_id)}/payment/verify`,
              {
                method: 'POST',
                body: JSON.stringify(response),
              },
            );
            setConfirmedOrder(verified);
            onSuccess(verified);
          } catch (verificationError) {
            setError(verificationError instanceof Error ? verificationError.message : 'Payment confirmation failed.');
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment cancelled. You can retry checkout.');
          },
        },
      });

      razorpay.open();
    } catch (razorpayError) {
      setError(razorpayError instanceof Error ? razorpayError.message : 'Could not launch payment gateway.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPhone = customerPhone.trim();
    if (!/^\d{10,20}$/.test(trimmedPhone)) {
      setError('Please enter a valid phone number (10 to 20 digits).');
      return;
    }

    const trimmedAddress = `${address.trim()}, PIN: ${pincode.trim()}`;
    if (trimmedAddress.length < 8) {
      setError('Please provide a complete shipping address.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await apiRequest<OrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.product_id,
          customer_name: customerName.trim(),
          customer_phone: trimmedPhone,
          shipping_address: trimmedAddress,
          quantity,
        }),
      });

      setCheckoutOrder(order);
      if (order.payment_mode === 'razorpay' && order.checkout) {
        await openRazorpayCheckout(order);
      }
    } catch (err: any) {
      setError(err.message || 'Could not create the order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1A2E]/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#E1D6BE] bg-[#FAF5EA] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto text-[#1F1A2E]">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-[#5E576B] hover:bg-[#FFFFFF] hover:text-[#1F1A2E] transition-all border border-transparent hover:border-[#E1D6BE]"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedOrder ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#1B2352] text-[#E4C27A] mx-auto flex items-center justify-center shadow-lg border border-[#E4C27A]/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E2233] bg-[#FFFFFF] px-3 py-1 rounded-full border border-[#B8893A]">
                {confirmedOrder.payment_status === 'PAID' ? 'Payment Confirmed' : 'Payment Pending'}
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#1F1A2E] mt-3">
                {confirmedOrder.payment_status === 'PAID' ? 'Sample Order Confirmed' : 'Order Created'}
              </h2>
              <p className="text-xs text-[#5E576B] mt-1">
                Order Tracking ID: <strong className="text-[#6E2233] font-mono text-sm">{confirmedOrder.order_id}</strong>
              </p>
            </div>

            <div className="rounded-2xl border border-[#E1D6BE] bg-[#FFFFFF] p-5 text-left text-xs space-y-2.5 shadow-xs">
              <div className="flex justify-between">
                <span className="text-[#5E576B]">Craft Piece:</span>
                <span className="font-bold text-[#1F1A2E] truncate max-w-[200px]">{confirmedOrder.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5E576B]">Master Artisan:</span>
                <span className="font-bold text-[#B5532F]">{confirmedOrder.artisan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5E576B]">Order Total:</span>
                <span className="font-serif font-bold text-[#1F1A2E] text-sm">₹{confirmedOrder.total_amount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5E576B]">Estimated Delivery:</span>
                <span className="font-bold text-[#22306B]">{confirmedOrder.estimated_delivery}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn btn-primary w-full"
            >
              Continue Exploring Heritage
            </button>
          </div>
        ) : checkoutOrder ? (
          <div className="py-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#1B2352] text-[#E4C27A] mx-auto flex items-center justify-center shadow-lg border border-[#E4C27A]/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="eyebrow">Sandbox Evaluation Mode</span>
              <h2 className="text-2xl font-serif font-bold text-[#1F1A2E] mt-1">Order {checkoutOrder.order_id}</h2>
              <p className="mt-2 text-sm text-[#4A4458]">₹{checkoutOrder.total_amount.toLocaleString('en-IN')} · Payment Status: {checkoutOrder.payment_status}</p>
              <p className="mt-1 text-xs text-[#5E576B]">This evaluation checkout does not charge real money.</p>
            </div>

            {checkoutOrder.payment_mode === 'sandbox' ? (
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  setError(null);
                  try {
                    const paidOrder = await apiRequest<OrderResponse>(
                      `/orders/${encodeURIComponent(checkoutOrder.order_id)}/payment/sandbox-confirm`,
                      { method: 'POST' },
                    );
                    setConfirmedOrder(paidOrder);
                    onSuccess(paidOrder);
                  } catch (confirmationError) {
                    setError(confirmationError instanceof Error ? confirmationError.message : 'Sandbox payment could not be confirmed.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="btn btn-gold w-full disabled:opacity-50"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming Sandbox Payment…</> : 'Simulate Successful Sandbox Payment'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void openRazorpayCheckout(checkoutOrder)}
                className="btn btn-primary w-full"
              >
                Resume Gateway Checkout
              </button>
            )}
            {error && <p className="text-xs text-rose-600 font-semibold" role="alert">{error}</p>}
          </div>
        ) : (
          <>
            <div>
              <span className="eyebrow">Direct Cluster Linkage · Transparent Escrow</span>
              <h2 className="text-2xl font-serif font-bold text-[#1F1A2E] tracking-tight">
                Order Certified Craft Sample
              </h2>
              <p className="text-xs text-[#5E576B] mt-1">
                {product.catalogue?.name} · Handcrafted by {product.artisan_name || 'Cluster Artisan'}
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Price & Quantity Summary */}
            <div className="rounded-2xl border border-[#E1D6BE] bg-[#FFFFFF] p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-[#5E576B] uppercase tracking-wider block">Quantity</span>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 5].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={`w-9 h-9 rounded-full font-bold text-xs transition-all ${
                        quantity === q
                          ? 'bg-[#22306B] text-white shadow-xs'
                          : 'bg-[#FAF5EA] text-[#1F1A2E] hover:bg-[#E1D6BE] border border-[#E1D6BE]'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-[#5E576B] uppercase tracking-wider block">Total Payable</span>
                <span className="text-xl font-serif font-bold text-[#6E2233] flex items-center justify-end mt-0.5">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-[#B5532F] flex items-center justify-end gap-1">
                  <Truck className="w-3 h-3" /> Insured Cluster Shipping
                </span>
              </div>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1F1A2E] uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1D6BE] bg-[#FFFFFF] text-xs text-[#1F1A2E] placeholder-[#5E576B]/60 focus:border-[#B5532F] focus:ring-1 focus:ring-[#B5532F] outline-none shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1F1A2E] uppercase tracking-wider mb-1">
                    Phone (Delivery Updates) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1D6BE] bg-[#FFFFFF] text-xs text-[#1F1A2E] placeholder-[#5E576B]/60 focus:border-[#B5532F] focus:ring-1 focus:ring-[#B5532F] outline-none shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F1A2E] uppercase tracking-wider mb-1">
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, building, city, state"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1D6BE] bg-[#FFFFFF] text-xs text-[#1F1A2E] placeholder-[#5E576B]/60 focus:border-[#B5532F] focus:ring-1 focus:ring-[#B5532F] outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F1A2E] uppercase tracking-wider mb-1">
                  Postal PIN Code *
                </label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 560038"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1D6BE] bg-[#FFFFFF] text-xs text-[#1F1A2E] placeholder-[#5E576B]/60 focus:border-[#B5532F] focus:ring-1 focus:ring-[#B5532F] outline-none shadow-xs"
                />
              </div>

              <div className="rounded-xl border border-[#B8893A]/40 bg-[#FFFFFF] p-3 text-xs text-[#4A4458]">
                Funds are held in secure escrow. 40% raw material advance is transferred to the cluster before crafting starts.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-full disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Preparing Secure Checkout…</>
                  ) : (
                    <>Proceed to Checkout · ₹{totalAmount.toLocaleString('en-IN')} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
