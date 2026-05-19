import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center">
      {/* Background Image with Parallax effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-luxury-black via-luxury-black/70 to-transparent z-10" />
        <img 
          src="/src/assets/images/hero_watch_cinematic_1779204584374.png" 
          alt="Luxury Watch"
          className="w-full h-full object-cover object-center scale-110 animate-pulse-slow"
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gold font-mono tracking-[0.3em] text-sm uppercase mb-4 block"
          >
            DINOSPY • Excellence Reimagined
          </motion.span>
          <h1 className="text-6xl md:text-8xl font-display font-medium leading-tight mb-8">
            The Art of <br />
            <span className="gold-text italic">Precision.</span>
          </h1>
          <p className="text-lg text-white/70 mb-10 leading-relaxed max-w-lg">
            Experience the pinnacle of horological engineering. Handcrafted timepieces for those who value every second of excellence.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <button className="px-10 py-5 gold-gradient text-luxury-black font-bold uppercase tracking-widest flex items-center justify-center hover:scale-105 transition-transform group">
              Explore Collection
              <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={18} />
            </button>
            <button className="px-10 py-5 glass border border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
              Limited Edition
            </button>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
      >
        <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-gold to-transparent" />
        <span className="text-[10px] uppercase tracking-[0.5em] text-white/50 mt-4">Scroll</span>
      </motion.div>
    </section>
  );
}
