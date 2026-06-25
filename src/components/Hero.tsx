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

  const defaultBanners = [
    {
      title: "Mechanical Sovereignty.",
      subtitle: "VAULT_SERIES_001",
      imageUrl: "/src/assets/images/hero_skeleton_movement_1782293477542.jpg",
      link: "/explore"
    },
    {
      title: "Oceanic Mastery.",
      subtitle: "DIVER_PROTOCOL_002",
      imageUrl: "/src/assets/images/diver_watch_underwater_1782293493132.jpg",
      link: "/explore?category=DIVER"
    },
    {
      title: "Minimalist Legacy.",
      subtitle: "MINIMAL_LEGACY_003",
      imageUrl: "/src/assets/images/minimalist_marble_watch_1782293522898.jpg",
      link: "/explore?category=CLASSIC"
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!db) {
          setBanners(defaultBanners);
          setLoading(false);
          return;
        }

        const [bSnapResult, oSnapResult] = await Promise.allSettled([
          getDocs(collection(db, 'banners')),
          getDocs(collection(db, 'offers'))
        ]);

        if (bSnapResult.status === 'fulfilled' && !bSnapResult.value.empty) {
          const bannerList = bSnapResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setBanners(bannerList);
        } else {
          setBanners(defaultBanners);
        }

        if (oSnapResult.status === 'fulfilled') {
          const offerList = oSnapResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOffers(offerList);
        }
      } catch (error) {
        console.error('Hero generic fetch error:', error);
        setBanners(defaultBanners);
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
      {/* Banner Carousel - Exact Full Screen */}
      <div className="relative h-screen w-full bg-charcoal overflow-hidden">
        <AnimatePresence mode="wait">
          {banners.length > 0 ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              {banners[currentIndex].videoUrl ? (
                <div className="w-full h-full relative overflow-hidden">
                  <video 
                    key={banners[currentIndex].videoUrl}
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    className="w-full h-full object-cover scale-110"
                    poster={banners[currentIndex].imageUrl}
                  >
                    <source src={banners[currentIndex].videoUrl} type="video/mp4" />
                  </video>
                </div>
              ) : (
                <picture>
                  <source media="(max-width: 768px)" srcSet={banners[currentIndex].mobileImageUrl || banners[currentIndex].imageUrl} />
                  <img 
                    src={banners[currentIndex].imageUrl} 
                    alt={banners[currentIndex].title}
                    className="w-full h-full object-cover transition-all duration-[5000ms] scale-110 hover:scale-100"
                    style={{ filter: 'contrast(1.1) brightness(0.95)' }} // Subtle pop for high-quality feel
                  />
                </picture>
              )}
              
              {/* Overlays for Readability - Minimal to preserve image quality */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-transparent to-charcoal/20 opacity-70" />
              <div className="absolute inset-0 bg-black/5" />
              
              <div className="absolute bottom-24 left-10 md:left-24 max-w-5xl space-y-8 z-10">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 1 }}
                >
                  <p className="font-tech text-gold text-xs md:text-sm tracking-[0.3em] md:tracking-[0.5em] font-black uppercase mb-6 drop-shadow-2xl">
                    {banners[currentIndex].subtitle || 'COLLECTION_INDEX_001'}
                  </p>
                  <h1 className="text-[clamp(2.2rem,11vw,9rem)] font-display italic tracking-tightest leading-[0.95] text-white drop-shadow-2xl mb-10 break-words overflow-hidden">
                    {banners[currentIndex].title}
                  </h1>
                  {banners[currentIndex].link && (
                    <a 
                      href={banners[currentIndex].link}
                      className="inline-flex items-center space-x-6 group"
                    >
                      <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-ivory group-hover:text-black transition-all duration-700">
                        <ChevronRight size={20} />
                      </div>
                      <span className="font-tech text-[10px] text-white tracking-[0.4em] md:tracking-[0.5em] font-black uppercase group-hover:translate-x-2 transition-transform duration-700">
                        EXPLORE_ARCHIVE
                      </span>
                    </a>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-charcoal">
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

      {/* Ticker / Scrolling Offers - Displayed BELOW the hero carousel in Cream/Ivory */}
      {offers.length > 0 && (
        <div className="w-full bg-[#fffff0] py-4 md:py-8 overflow-hidden border-b border-black/5 z-30">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...offers, ...offers, ...offers, ...offers].map((offer, idx) => (
              <div key={`${offer.id}-${idx}`} className="flex items-center space-x-4 md:space-x-12 px-4 md:px-12">
                {offer.imageUrl && (
                  <div className="w-6 h-6 md:w-10 md:h-10 rounded-full overflow-hidden border border-black/5 flex-shrink-0">
                    <img src={offer.imageUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                )}
                <span className="font-tech text-[11px] md:text-sm text-black tracking-[0.1em] md:tracking-[0.4em] font-black uppercase whitespace-nowrap">
                  {offer.text}
                </span>
                <div className="w-1 h-1 md:w-2 md:h-2 bg-gold rounded-full shadow-[0_0_10px_#c5a059]" />
              </div>
            ))}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}} />
    </section>
  );
};

export default Hero;
