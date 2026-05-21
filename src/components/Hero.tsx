import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../context/AuthContext';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';

export default function Hero() {
  const [banners, setBanners] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'banners'),
      where('active', '==', true),
      orderBy('order', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <section className="relative h-[90vh] w-full overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-luxury-black via-luxury-black/70 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Watch"
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <span className="text-gold font-mono tracking-[0.3em] text-sm uppercase mb-4 block">DINOSPY • Premier Horology</span>
            <h1 className="text-6xl md:text-8xl font-display leading-tight mb-8">Crafting <br /><span className="gold-text italic">Time.</span></h1>
            <p className="text-lg text-white/70 mb-10 max-w-lg">Handcrafted luxury timepieces for the modern elite. Experience perfection.</p>
            <button className="px-10 py-5 gold-gradient text-luxury-black font-bold uppercase tracking-widest flex items-center hover:scale-105 transition-transform group">
              View All Watches
              <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={18} />
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <section className="relative h-screen md:h-[90vh] w-full overflow-hidden flex items-center font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-luxury-black via-luxury-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-black/20 z-[5]" />
          <motion.img 
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 15, ease: "linear" }}
            src={currentBanner.imageUrl} 
            alt={currentBanner.title}
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>


      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
            className="max-w-4xl"
          >
            <motion.span 
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.35em" }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="text-gold font-sans font-semibold tracking-[0.35em] text-xs md:text-sm uppercase mb-6 block"
            >
              DINOSPY • {currentBanner.subtitle || 'Excellence Reimagined'}
            </motion.span>
            {currentBanner.title && (
              <h1 className="text-5xl md:text-8xl lg:text-9xl font-display font-light leading-[1] mb-12 text-white/95 tracking-tight">
                {currentBanner.title}
              </h1>
            )}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8 pt-4">
              <motion.div
                whileHover={{ scale: 1.05, letterSpacing: "0.3em" }}
                transition={{ duration: 0.4 }}
              >
                <Link 
                  to="/explore"
                  className="px-12 py-5 border border-gold/40 text-gold hover:bg-gold hover:text-luxury-black font-bold uppercase tracking-[0.25em] text-[10px] flex items-center justify-center transition-all bg-luxury-black/30 backdrop-blur-md group"
                >
                  Discover Collection
                  <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" size={16} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-10 right-10 z-30 flex space-x-4">
          <button 
            onClick={() => setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length)}
            className="p-4 glass rounded-full border border-white/10 hover:border-gold/50 transition-all text-white/50 hover:text-gold"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => setCurrentIndex(prev => (prev + 1) % banners.length)}
            className="p-4 glass rounded-full border border-white/10 hover:border-gold/50 transition-all text-white/50 hover:text-gold"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Progress indicators */}
      <div className="absolute bottom-10 left-10 z-30 flex space-x-2">
        {banners.map((_, i) => (
          <div 
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-12 bg-gold' : 'w-4 bg-white/20'}`}
          />
        ))}
      </div>
    </section>
  );
}
