import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins } from 'lucide-react';

interface SoundCoinBadgeProps {
  balance: number;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SoundCoinBadge({ balance, animated = false, size = 'md' }: SoundCoinBadgeProps) {
  const [prevBalance, setPrevBalance] = useState(balance);
  const [floatingDelta, setFloatingDelta] = useState<number | null>(null);

  useEffect(() => {
    if (animated && balance > prevBalance) {
      const delta = balance - prevBalance;
      setFloatingDelta(delta);
      setPrevBalance(balance);

      const timer = setTimeout(() => setFloatingDelta(null), 2000);
      return () => clearTimeout(timer);
    }
    setPrevBalance(balance);
  }, [balance, animated, prevBalance]);

  const sizeClasses = {
    sm: 'h-8 px-2 text-sm',
    md: 'h-10 px-3 text-base',
    lg: 'h-12 px-4 text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <div className="relative inline-flex">
      <motion.div
        className={`flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 font-semibold shadow-md ${sizeClasses[size]}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Coins size={iconSizes[size]} strokeWidth={2} />
        <span>{Math.floor(balance)}</span>
      </motion.div>

      <AnimatePresence>
        {floatingDelta && floatingDelta > 0 && (
          <motion.div
            key={`float-${Date.now()}`}
            className="absolute left-1/2 top-1/2 text-lg font-bold text-green-500 pointer-events-none"
            initial={{ opacity: 1, y: 0, x: '-50%' }}
            animate={{ opacity: 0, y: -40, x: '-50%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          >
            +{floatingDelta}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
