import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import WatchCard from '../components/WatchCard';
import ProductSkeleton from '../components/ProductSkeleton';
import Footer from '../components/Footer';
import CinematicBanner from '../components/CinematicBanner';
import { db } from '../context/AuthContext';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { useScroll } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const q = query(collection(db, 'products'), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeatured(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      // Fallback
      setFeatured([
        { id: '1', name: 'Archetype 01', price: 950000, images: ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=2000'], category: 'Titanium' },
        { id: '2', name: 'Monolith Noir', price: 1200000, images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2000'], category: 'Ceramic' }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-black selection:text-white text-black">
      <Navbar />
      
      <main className="flex-grow">
        {/* Dynamic Entry Block */}
        <Hero />

        {/* Cinematic Chapter 01: The Creed */}
        <section className="py-40 lg:py-96 px-4 md:px-6 relative overflow-hidden" id="philosophy">
          {/* Parallax Background Text */}
          <motion.div 
            style={{ y: scrollYProgress }}
            className="absolute top-1/2 left-0 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none whitespace-nowrap"
          >
             <span className="text-[50vw] font-display italic leading-none uppercase">Architectural</span>
          </motion.div>

          <div className="container mx-auto relative z-10">
            <div className="grid grid-cols-12 gap-12 items-center">
              <motion.div 
                className="col-span-12 lg:col-span-10"
                initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center space-x-12 mb-20">
                   <div className="w-1.5 h-1.5 bg-black rounded-full" />
                   <span className="font-tech text-black/40 tracking-[1em]">SYSTEM_IDENTITY // PHILOSOPHY</span>
                </div>
                <h2 className="text-[18vw] lg:text-[20rem] leading-[0.7] font-display italic tracking-tightest mb-16 md:mb-32">
                   Movement <br /> <span className="opacity-10">Unbound.</span>
                </h2>
                <div className="max-w-4xl">
                   <p className="text-black/40 text-2xl md:text-4xl lg:text-6xl font-light italic leading-tight mb-12 md:mb-24">
                     Redefining the mechanical heartbeat. Every caliber we forge is a dialogue between 
                     ancient horological tradition and the radical future of avant-garde design.
                   </p>
                   <div className="flex items-center space-x-12">
                      <div className="w-32 h-[1px] bg-black/20" />
                      <span className="font-tech text-black/60 tracking-[0.5em]">PROTOCOL_DINOSPY_READY</span>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* The Monolithic Grid: Featured Archive */}
        <section className="py-40 lg:py-96 px-4 md:px-6 bg-[#F5F5F5] relative">
          {/* Subtle Grid Interaction */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)', backgroundSize: '10vw 10vh' }} />

          <div className="container mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-32 lg:mb-64 gap-12 lg:gap-20">
               <div>
                  <div className="flex items-center space-x-10 mb-12">
                     <div className="w-12 h-[1px] bg-black/20" />
                     <span className="font-tech text-black/40 tracking-[1em]">FEATURED_SEQUENCES</span>
                  </div>
                  <h2 className="text-[12vw] lg:text-[16rem] leading-[0.7] font-display italic tracking-tightest">Archive <span className="opacity-10">Manifest.</span></h2>
               </div>
               <div className="flex flex-col items-end">
                  <span className="font-tech text-[10px] text-black/20 mb-8 font-bold tracking-[1.5em]">LATEST_SEQUENCE // 2026.06</span>
                  <Link to="/explore" className="group flex items-center space-x-6">
                     <span className="font-tech text-black group-hover:tracking-[1em] transition-all duration-1000">BROWSE_ALL</span>
                     <div className="w-12 h-12 border border-black/10 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-1000">
                        <ArrowRight size={14} />
                     </div>
                  </Link>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {featured.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 150 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.2, duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <WatchCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Full-Width Visual Chapter */}
        <CinematicBanner 
          videoUrl="https://v.pexels.com/video-files/4440938/4440938-uhd_2160_3840_30fps.mp4"
          title="Engineered Eternity."
          subtitle="MONOLITH_CALIBER_V5"
          description="A masterful convergence of Grand Complications and structural brutalism. Witness the skeletonized architecture of a multi-axial tourbillon, forged in surgical grade-5 titanium."
          ctaText="EXPLORE_CALIBER"
          align="right"
        />

        {/* Technical Specification: The Schema */}
        <section className="py-96 bg-white text-black relative selection:bg-black selection:text-white">
           <div className="absolute top-0 right-0 p-24 opacity-[0.03] text-[40vw] font-display italic leading-none pointer-events-none">03</div>
           
           <div className="container mx-auto px-6 relative z-10">
              <div className="grid grid-cols-12 gap-12 mb-64">
                 <div className="col-span-12 lg:col-span-8">
                    <div className="flex items-center space-x-12 mb-20">
                       <div className="w-4 h-4 bg-black rounded-full" />
                       <span className="font-tech tracking-[1em] text-black/40">ARCHITECTURAL_SOVEREIGNTY</span>
                    </div>
                    <h3 className="text-[12vw] lg:text-[16rem] leading-[0.7] mb-32 italic font-display tracking-tightest">Structural <br /> <span className="opacity-20 italic">Sovereign.</span></h3>
                 </div>
              </div>

              <div className="grid grid-cols-12 gap-20">
                 <div className="col-span-12 lg:col-span-4 space-y-12">
                    <div className="relative pl-12 border-l-4 border-black/5 group">
                       <div className="absolute left-[-4px] top-0 w-[4px] h-0 group-hover:h-full bg-black transition-all duration-1000" />
                       <span className="font-tech text-black/30 mb-8 block tracking-[1em]">01_MATERIALIZATION</span>
                       <p className="text-4xl italic font-light leading-tight">Surgical Grade 5 Titanium. Indestructible. Compressed for extreme aerospace integrity.</p>
                    </div>
                 </div>
                 <div className="col-span-12 lg:col-span-4 space-y-12">
                    <div className="relative pl-12 border-l-4 border-black/5 group">
                       <div className="absolute left-[-4px] top-0 w-[4px] h-0 group-hover:h-full bg-black transition-all duration-1000" />
                       <span className="font-tech text-black/30 mb-8 block tracking-[1em]">02_OSCILLATION</span>
                       <p className="text-4xl italic font-light leading-tight">72-hour reserve. 4,800 A/m magnetic resistance. A heartbeat designed for the void.</p>
                    </div>
                 </div>
                 <div className="col-span-12 lg:col-span-4 flex flex-col items-center justify-center">
                    <div className="w-full aspect-square border border-black/10 flex items-center justify-center relative overflow-hidden group bg-white/50 backdrop-blur-3xl">
                       <div className="absolute inset-20 border border-black/5 group-hover:inset-0 transition-all duration-1000" />
                       <motion.div 
                         animate={{ rotate: 360 }}
                         transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                         className="w-64 h-64 border-t border-black/40 rounded-full"
                       />
                       <span className="absolute font-tech text-[10px] tracking-[2em] translate-x-[1em]">SCHEMA_V3</span>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
