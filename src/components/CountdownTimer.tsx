import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiryDate: string;
  onExpire?: () => void;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiryDate, onExpire, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiryDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft(null);
        if (onExpire) onExpire();
        return;
      }

      setTimeLeft({
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60)
      });
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, [expiryDate]);

  if (!timeLeft) return null;

  if (compact) {
    return (
      <div className="flex items-center space-x-1 text-gold/80 font-mono text-[8px] sm:text-[9px] uppercase tracking-widest font-black bg-gold/5 px-2 py-0.5 rounded-full border border-gold/10">
        <Clock size={10} className="animate-pulse" />
        <span>Ends in: {timeLeft.d > 0 ? `${timeLeft.d}d ` : ''}{timeLeft.h.toString().padStart(2, '0')}:{timeLeft.m.toString().padStart(2, '0')}:{timeLeft.s.toString().padStart(2, '0')}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center space-x-2 text-gold/60">
        <Clock size={14} className="animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.4em] font-black">Offer Security Window Closing</span>
      </div>
      <div className="flex space-x-4">
        {[
          { label: 'days', value: timeLeft.d },
          { label: 'hours', value: timeLeft.h },
          { label: 'mins', value: timeLeft.m },
          { label: 'secs', value: timeLeft.s }
        ].map((unit, idx) => (
          <div key={unit.label} className="flex flex-col items-center">
            <div className="glass w-12 h-14 rounded-xl border border-gold/20 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gold shadow-[0_0_10px_#D4AF37]" />
              <AnimatePresence mode="popLayout">
                <motion.span 
                  key={unit.value}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="text-xl font-mono gold-text font-bold"
                >
                  {unit.value.toString().padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-[8px] uppercase tracking-widest text-white/30 mt-2 font-black">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
