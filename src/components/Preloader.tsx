import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const Preloader = () => {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsDone(true), 1000);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);

    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -1000 }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] bg-ivory flex flex-col items-center justify-center"
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl md:text-6xl font-display tracking-[1em] text-text mb-12 uppercase"
            >
              DINOSPY
            </motion.div>
            
            <div className="w-64 h-[1px] bg-black/5 relative overflow-hidden">
               <motion.div 
                 className="absolute inset-0 bg-gold origin-left"
                 style={{ scaleX: progress / 100 }}
               />
            </div>
            
            <div className="mt-4 flex justify-between font-tech text-[10px] tracking-widest text-text/40">
               <span>INITIALIZING_VAULT</span>
               <span>{Math.round(progress)}%</span>
            </div>
          </div>
          
          <div className="absolute bottom-12 font-tech text-[9px] tracking-[1em] text-text/20">
            CRAFTED_FOR_THE_MECHANICAL_ELITE
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
