import React from 'react';
import { motion } from 'motion/react';

interface MarqueeProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  speed?: number;
}

export const Marquee: React.FC<MarqueeProps> = ({ children, direction = 'left', speed = 40 }) => {
  return (
    <div className="flex overflow-hidden select-none">
      <motion.div
        animate={{ x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        className="flex whitespace-nowrap min-w-full"
      >
        <div className="flex items-center space-x-12 px-6">
          {children}
        </div>
        <div className="flex items-center space-x-12 px-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
