import React from 'react';
import { motion } from 'motion/react';

interface WatchFeatureRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function WatchFeatureReveal({ children, delay = 0, className = "" }: WatchFeatureRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        filter: 'blur(0px)',
        transition: {
          duration: 1.2,
          delay: delay,
          ease: [0.22, 1, 0.36, 1], // Custom luxury ease-out
        }
      }}
      viewport={{ once: true, margin: "-100px" }}
      className={className}
    >
      <div className="relative group overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-b from-white/10 to-transparent p-[1px]">
        {/* Luxury reflection glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative glass rounded-[2rem] overflow-hidden">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
