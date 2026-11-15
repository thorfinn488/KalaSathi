import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  locale?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  className = '',
  locale = 'en-IN',
}) => {
  // Start at 0 on mount if in browser, or directly at value to avoid test/SSR flash
  const spring = useSpring(value, {
    stiffness: 75,
    damping: 18,
    mass: 0.8,
  });

  const [displayValue, setDisplayValue] = useState<string>(
    `${prefix}${Math.round(value).toLocaleString(locale)}${suffix}`
  );

  useEffect(() => {
    spring.set(value);
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(`${prefix}${Math.round(latest).toLocaleString(locale)}${suffix}`);
    });
    return () => unsubscribe();
  }, [spring, value, prefix, suffix, locale]);

  return <motion.span className={className}>{displayValue}</motion.span>;
};
