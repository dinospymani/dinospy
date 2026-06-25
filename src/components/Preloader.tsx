import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import watchBackground from '../assets/images/watch_movement_macro_1782377142964.jpg';

export const Preloader = () => {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsDone(true), 2500);
          return 100;
        }
        return prev + Math.random() * 8;
      });
    }, 120);

    setTimeout(() => setPhase(1), 500);
    setTimeout(() => setPhase(2), 1500);

    return () => clearInterval(timer);
  }, []);

  const words = "DINOSPY".split("");

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.1,
            filter: "blur(20px)"
          }}
          transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Cinematic Background Overlay */}
          <motion.div 
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 0.35, scale: 1 }}
            transition={{ duration: 4, ease: "easeOut" }}
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
               backgroundImage: `url(${watchBackground})`,
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               filter: 'brightness(0.6) contrast(1.2)'
            }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-60 z-[1]" />
          
          {/* Grain Effect */}
          <div className="absolute inset-0 z-[2] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex mb-12">
              {words.map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 50, opacity: 0, filter: "blur(10px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  transition={{ 
                    duration: 1, 
                    delay: 0.2 + (i * 0.1),
                    ease: [0.215, 0.61, 0.355, 1]
                  }}
                  className="text-4xl md:text-7xl font-display tracking-[0.5em] text-white uppercase inline-block mx-2"
                >
                  {char}
                </motion.span>
              ))}
            </div>
            
            <div className="w-80 h-[1px] bg-white/5 relative overflow-hidden backdrop-blur-sm">
               <motion.div 
                 className="absolute inset-0 bg-white origin-left"
                 style={{ scaleX: progress / 100 }}
                 transition={{ type: "spring", stiffness: 50 }}
               />
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 flex flex-col items-center space-y-4"
            >
               <div className="flex justify-between w-80 font-tech text-[10px] tracking-widest text-white/30 uppercase">
                  <motion.span
                    key={phase}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {phase === 0 && "INITIATING_SEQUENCE..."}
                    {phase === 1 && "SYNCING_VAULT_ASSETS..."}
                    {phase === 2 && "AUTHENTICATING_CRYPTO_NODE..."}
                  </motion.span>
                  <span>{Math.round(progress)}%</span>
               </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-16 flex flex-col items-center space-y-4"
          >
            <div className="w-0.5 h-12 bg-gradient-to-b from-white/20 to-transparent" />
            <div className="font-tech text-[9px] tracking-[1.2em] text-white/20 uppercase">
              CRAFTED_FOR_THE_MECHANICAL_ELITE
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
