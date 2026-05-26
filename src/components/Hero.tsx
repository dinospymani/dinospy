import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../context/AuthContext';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { CountdownTimer } from './CountdownTimer';

export default function Hero() {
  const [allBanners, setAllBanners] = useState<any[]>(() => {
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
      setAllBanners(fetched);
      localStorage.setItem('dinospy_banners', JSON.stringify(fetched));
    }, (error) => {
      console.warn("Banner registry isolation active", error);
    });
    return () => unsubscribe();
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset index when switching modes to avoid out-of-bounds
  useEffect(() => {
    setCurrentIndex(0);
  }, [isMobile]);

  const visibleBanners = React.useMemo(() => {
    return allBanners.filter((b: any) => {
      if (isMobile) {
        // Strictly show only mobile-enabled banners that have a mobile image
        return b.displayMobile === true && b.mobileImageUrl;
      }
      // Strictly show only desktop-enabled banners that have a desktop image
      return b.displayDesktop === true && b.imageUrl;
    });
  }, [allBanners, isMobile]);

  useEffect(() => {
    // Auto-rotation disabled per user request for a stable banner
    return;
  }, [visibleBanners.length]);

  const currentBanner = visibleBanners[currentIndex] || {
    imageUrl: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=100&w=3840",
    mobileImageUrl: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=90&w=1500",
    title: "Latest Arrivals",
    subtitle: "Precision Reimagined",
    displayDesktop: true,
    displayMobile: true
  };

  return (
    <section className="relative h-[85vh] md:h-[90vh] mt-16 md:mt-20 w-full overflow-hidden flex items-center font-sans tracking-tight bg-black">
      {/* Modern Scroll Indicator */}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center space-y-2"
      >
        <span className="text-[7px] font-black uppercase tracking-[0.8em] text-white/30 ml-[0.8em]">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-gold/50 to-transparent relative overflow-hidden">
          <motion.div 
            animate={{ y: [0, 48, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full h-1/4 bg-gold"
          />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex + (isMobile ? 'mobile' : 'desktop')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 z-0"
        >
          {/* Subtle overlay for text readability */}
          <div className="absolute inset-0 bg-black/10 z-[5]" />
          
          {/* Desktop Banner Image - Stable state */}
          {!isMobile && currentBanner.imageUrl && (
            <img 
              src={currentBanner.imageUrl} 
              alt={currentBanner.title}
              fetchPriority="high"
              loading="eager"
              className="w-full h-full object-cover object-center"
            />
          )}

          {/* Mobile Banner Image - Stable state */}
          {isMobile && currentBanner.mobileImageUrl && (
            <img 
              src={currentBanner.mobileImageUrl} 
              alt={currentBanner.title}
              fetchPriority="high"
              loading="eager"
              className="w-full h-full object-cover object-[center_20%]"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 w-full flex flex-col justify-end items-center h-full pb-20 md:pb-24">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
            className="w-full max-w-7xl px-6 text-center"
          >
            <h1 className="text-7xl md:text-[12rem] 2xl:text-[16rem] font-display font-light leading-[0.8] text-white tracking-widest md:tracking-[0.1em] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              {currentBanner.title}
            </h1>

            <div className="flex flex-col items-center mt-8 md:mt-12">
              {currentBanner.expiryDate && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 1 }}
                >
                  <CountdownTimer expiryDate={currentBanner.expiryDate} />
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {visibleBanners.length > 1 && (
        <div className="absolute bottom-10 right-10 z-30 flex space-x-4">
          <button 
            onClick={() => setCurrentIndex(prev => (prev - 1 + visibleBanners.length) % visibleBanners.length)}
            className="p-4 glass rounded-full border border-white/10 hover:border-gold/50 transition-all text-white/50 hover:text-gold"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => setCurrentIndex(prev => (prev + 1) % visibleBanners.length)}
            className="p-4 glass rounded-full border border-white/10 hover:border-gold/50 transition-all text-white/50 hover:text-gold"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </section>
  );
}
