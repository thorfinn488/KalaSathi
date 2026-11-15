import React, { useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate
} from 'framer-motion';
import { cn } from '../../lib/utils';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  enableTilt?: boolean;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  spotlightColor = 'rgba(217, 119, 6, 0.14)', // Warm amber/gold heritage glow
  enableTilt = false,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Position relative to card top-left
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Position relative to card center for 3D tilt
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  const springTiltX = useSpring(tiltX, { stiffness: 150, damping: 20 });
  const springTiltY = useSpring(tiltY, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(springTiltY, [-150, 150], [5, -5]);
  const rotateY = useTransform(springTiltX, [-150, 150], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseX.set(x);
    mouseY.set(y);

    if (enableTilt) {
      tiltX.set(x - rect.width / 2);
      tiltY.set(y - rect.height / 2);
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (enableTilt) {
      tiltX.set(0);
      tiltY.set(0);
    }
  };

  const spotlightBg = useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 75%)`;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={enableTilt ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined}
      className={cn(
        'group relative rounded-3xl bg-white border border-[#E1D6BE] overflow-hidden transition-all duration-300',
        'hover:shadow-xl hover:border-[#D97706]/50',
        className
      )}
      {...(props as any)}
    >
      {/* Dynamic Cursor Spotlight Overlay */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300 z-10"
        style={{
          opacity: isHovered ? 1 : 0,
          background: spotlightBg,
        }}
      />
      <div className="relative z-20 h-full flex flex-col">{children}</div>
    </motion.div>
  );
};
