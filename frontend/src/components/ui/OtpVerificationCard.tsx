import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, MessageSquare, Mail } from 'lucide-react';

interface OtpVerificationCardProps {
  channel: 'phone' | 'email';
  destination: string;
  expectedCode?: string;
  onVerify: (code: string) => Promise<void> | void;
  onResend: () => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}

export const OtpVerificationCard: React.FC<OtpVerificationCardProps> = ({
  channel,
  destination,
  expectedCode,
  onVerify,
  onResend,
  onBack,
  loading = false,
  error = null
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    if (clean.length > 1) {
      // User pasted multiple digits
      const pasted = clean.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      if (newDigits.every((d) => d !== '')) {
        onVerify(newDigits.join(''));
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean.slice(-1);
    setDigits(newDigits);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== '')) {
      onVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendClick = () => {
    if (!canResend) return;
    setDigits(['', '', '', '', '', '']);
    setTimeLeft(30);
    setCanResend(false);
    onResend();
    inputRefs.current[0]?.focus();
  };

  const formattedTime = `00:${timeLeft < 10 ? '0' : ''}${timeLeft}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-heritage-navy transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Change {channel === 'phone' ? 'Phone' : 'Email'}
        </button>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Secure 2FA
        </span>
      </div>

      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mb-2 shadow-sm">
          {channel === 'phone' ? <MessageSquare className="w-6 h-6 text-terracotta-500" /> : <Mail className="w-6 h-6 text-indigoCraft-600" />}
        </div>
        <h2 className="text-xl font-bold font-serif text-heritage-navy">
          Enter Verification Code
        </h2>
        <p className="text-xs text-stone-600 max-w-xs mx-auto">
          We sent a 6-digit verification code to{' '}
          <strong className="text-heritage-navy font-semibold">{destination}</strong>
        </p>
      </div>

      {/* Simulated Live Code Delivery Pill for instant testability */}
      {expectedCode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 flex items-center justify-between text-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="text-stone-700 font-medium">
              Simulated {channel === 'phone' ? 'SMS' : 'Mail'} Code:
            </span>
          </div>
          <span className="font-mono font-black text-sm tracking-wider text-terracotta-600 bg-white px-2.5 py-0.5 rounded-lg border border-amber-200/80 shadow-xs">
            {expectedCode}
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* 6-cell interactive OTP input */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={loading}
            className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border outline-none transition-all shadow-xs ${
              digit
                ? 'border-terracotta-500 bg-white text-heritage-navy ring-2 ring-terracotta-500/20 shadow-sm'
                : 'border-heritage-border bg-heritage-bg/40 text-heritage-navy focus:border-terracotta-500 focus:bg-white focus:ring-2 focus:ring-terracotta-500/20'
            }`}
          />
        ))}
      </div>

      {/* Action / Verify Button */}
      <button
        type="button"
        disabled={loading || digits.some((d) => d === '')}
        onClick={() => onVerify(digits.join(''))}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-terracotta-500 to-amber-600 hover:from-terracotta-600 hover:to-amber-700 text-white font-black text-sm shadow-md shadow-terracotta-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Code...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" /> Verify &amp; Continue
          </>
        )}
      </button>

      {/* Resend Timer / Action */}
      <div className="text-center pt-1 text-xs text-stone-500">
        Didn&apos;t receive the code?{' '}
        {canResend ? (
          <button
            type="button"
            onClick={handleResendClick}
            className="font-bold text-terracotta-600 hover:text-terracotta-700 hover:underline ml-1"
          >
            Resend Code
          </button>
        ) : (
          <span className="font-mono text-stone-400 ml-1">
            Resend in <span className="font-bold text-stone-600">{formattedTime}</span>
          </span>
        )}
      </div>
    </motion.div>
  );
};
