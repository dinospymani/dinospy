import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../context/AuthContext';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';

export default function Hero() {
  const [banners, setBanners] = useState<any[]>(() => {
    const cached = localStorage.getItem('dinospy_banners');
    return cached ? JSON.parse(cached) : [];
  });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'banners'),
      where('active', '==', true),
      orderBy('order', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBanners(fetched);
      localStorage.setItem('dinospy_banners', JSON.stringify(fetched));
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

  const currentBanner = banners[currentIndex] || {
    imageUrl: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=2000",
    title: "Latest Acquisitions",
    subtitle: "Heritage Masterpieces"
  };

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
          <div className="absolute inset-0 bg-gradient-to-r from-luxury-black via-luxury-black/60 to-transparent z-10" />
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
              initial={{ opacity: 0, letterSpacing: "1em" }}
              animate={{ opacity: 1, letterSpacing: "0.5em" }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="text-gold font-sans font-bold tracking-[0.5em] text-[10px] md:text-xs uppercase mb-12 block"
            >
              DINOSPY • {currentBanner.subtitle || 'Excellence Reimagined'}
            </motion.span>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-light leading-[1] mb-12 text-white/95 tracking-tight">
              {currentBanner.title}
            </h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-12"
            >
              <Link 
                to="/explore"
                className="inline-flex items-center space-x-6 group"
              >
                <span className="text-gold font-bold uppercase tracking-[0.6em] text-[10px] md:text-xs group-hover:tracking-[0.8em] transition-all duration-700">
                  Discover Collection
                </span>
                <div className="w-12 h-[1px] bg-gold/30 group-hover:w-24 group-hover:bg-gold transition-all duration-700" />
              </Link>
            </motion.div>
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
    </section>
  );
}
