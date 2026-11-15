import React from 'react';
import { Award } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ShimmerBadgeProps {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'gold' | 'terracotta' | 'navy' | 'emerald';
}

export const ShimmerBadge: React.FC<ShimmerBadgeProps> = ({
  children = '100% GI Tagged',
  icon = <Award className="w-3.5 h-3.5 text-[#D97706]" />,
  className,
  variant = 'gold',
}) => {
  const variantStyles = {
    gold: 'border-[#D97706]/40 bg-[#FFFFFF] text-[#78350F] shadow-xs',
    terracotta: 'border-[#991B1B]/40 bg-[#FFFFFF] text-[#991B1B] shadow-xs',
    navy: 'border-[#E4C27A]/30 bg-[#14101E] text-[#FDE68A] shadow-md',
    emerald: 'border-emerald-600/40 bg-emerald-50 text-emerald-800 shadow-xs',
  };

  return (
    <span
      className={cn(
        'relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1 text-xs font-bold transition-all',
        variantStyles[variant],
        className
      )}
    >
      {/* Moving Shimmer Highlight */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent"
      />
      {icon}
      <span className="relative z-10">{children}</span>
    </span>
  );
};
