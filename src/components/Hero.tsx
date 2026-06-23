import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../context/AuthContext';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const Hero = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!db) {
          console.error('Firestore db is not initialized');
          return;
        }

        // Fetch banners and offers in parallel with independent error handling
        const [bSnapResult, oSnapResult] = await Promise.allSettled([
          getDocs(collection(db, 'banners')),
          getDocs(collection(db, 'offers'))
        ]);

        if (bSnapResult.status === 'fulfilled') {
          const bannerList = bSnapResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setBanners(bannerList);
        } else {
          console.error('Permission/Error fetching banners:', bSnapResult.reason);
        }

        if (oSnapResult.status === 'fulfilled') {
          const offerList = oSnapResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOffers(offerList);
        } else {
          console.error('Permission/Error fetching offers:', oSnapResult.reason);
        }
      } catch (error) {
        console.error('Hero generic fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (loading) return (
    <div className="h-[80vh] w-full bg-neutral-50 flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 border-t-2 border-black rounded-full animate-spin mx-auto" />
        <p className="font-tech text-[10px] tracking-widest text-black/20 uppercase">SYNCHRONIZING_EXPERIENCE</p>
      </div>
    </div>
  );

  return (
    <section className="relative w-full overflow-hidden">
      {/* Ticker / Scrolling Offers */}
      {offers.length > 0 && (
        <div className="w-full bg-black py-4 overflow-hidden border-y border-white/5">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...offers, ...offers, ...offers].map((offer, idx) => (
              <div key={`${offer.id}-${idx}`} className="flex items-center space-x-8 px-8">
                <span className="font-tech text-[10px] md:text-sm text-white tracking-[0.4em] font-black uppercase">
                  {offer.text}
                </span>
                <div className="w-2 h-2 bg-gold rounded-full shadow-[0_0_10px_#c5a059]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banner Carousel */}
      <div className="relative h-[65vh] md:h-[85vh] w-full bg-noir overflow-hidden">
        <AnimatePresence mode="wait">
          {banners.length > 0 ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <picture>
                <source media="(max-width: 768px)" srcSet={banners[currentIndex].mobileImageUrl || banners[currentIndex].imageUrl} />
                <img 
                  src={banners[currentIndex].imageUrl} 
                  alt={banners[currentIndex].title}
                  className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-1000"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent to-transparent opacity-60" />
              <div className="absolute inset-0 bg-black/20" />
              
              <div className="absolute bottom-20 left-10 md:left-24 max-w-4xl space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 1 }}
                >
                  <p className="font-tech text-gold text-xs md:text-sm tracking-[0.5em] font-black uppercase mb-6 drop-shadow-2xl">
                    {banners[currentIndex].subtitle || 'COLLECTION_INDEX_001'}
                  </p>
                  <h1 className="text-6xl md:text-8xl xl:text-9xl font-display italic tracking-tightest leading-none text-white drop-shadow-2xl mb-10">
                    {banners[currentIndex].title}
                  </h1>
                  {banners[currentIndex].link && (
                    <a 
                      href={banners[currentIndex].link}
                      className="inline-flex items-center space-x-6 group"
                    >
                      <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-700">
                        <ChevronRight size={20} />
                      </div>
                      <span className="font-tech text-[10px] text-white tracking-[0.5em] font-black uppercase group-hover:translate-x-2 transition-transform duration-700">
                        EXPLORE_ARCHIVE
                      </span>
                    </a>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-noir">
               <div className="text-center space-y-6">
                  <h2 className="text-4xl font-display italic text-white/10 uppercase tracking-widest">Awaiting_Visual_Feed</h2>
                  <p className="font-tech text-[10px] text-white/5 uppercase tracking-[0.5em]">SYSTEM_READY_FOR_DEPLOYMENT</p>
               </div>
            </div>
          )}
        </AnimatePresence>

        {/* Controls */}
        {banners.length > 1 && (
          <div className="absolute bottom-10 right-10 md:right-24 flex items-center space-x-6 z-20">
            <button onClick={prevBanner} className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white transition-all duration-700">
              <ChevronLeft size={20} />
            </button>
            <div className="flex space-x-3">
              {banners.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 transition-all duration-1000 rounded-full ${i === currentIndex ? 'w-12 bg-gold' : 'w-4 bg-white/20'}`} 
                />
              ))}
            </div>
            <button onClick={nextBanner} className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white transition-all duration-700">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />
    </section>
  );
};

export default Hero;
