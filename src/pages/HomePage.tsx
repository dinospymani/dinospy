import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import WatchCard from '../components/WatchCard';
import Footer from '../components/Footer';
import CinematicBanner from '../components/CinematicBanner';
import { db } from '../context/AuthContext';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/utils';

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), limit(4));
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
    <div className="min-h-screen flex flex-col bg-bg selection:bg-gold selection:text-black text-text">
      <Navbar />
      
      <main className="flex-grow">
        {/* Typographic Hero */}
        <Hero />

        {/* Editorial Section 01: The Philosophy */}
        <section className="py-60 px-6 border-b border-text/5">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2 }}
              >
                <span className="font-tech text-gold text-[10px] mb-8 block">EST_1974 // PHILOSOPHY</span>
                <h2 className="text-6xl md:text-9xl mb-12 leading-none">
                  Precision as <br /> <span className="italic font-display">Brutality.</span>
                </h2>
                <p className="text-text/40 text-xl font-light italic leading-relaxed max-w-xl">
                  We strip away the decorative to reveal the structural soul of time. 
                  Horology is not an accessory; it is an architectural commitment.
                </p>
              </motion.div>
              
              <div className="relative">
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   viewport={{ once: true }}
                   transition={{ duration: 2 }}
                   className="aspect-[4/5] overflow-hidden grayscale brightness-50"
                 >
                    <img 
                      src="https://images.unsplash.com/photo-1509112756314-34a0badb29d4?q=80&w=2000" 
                      alt="Mechanical Detail" 
                      className="w-full h-full object-cover"
                    />
                 </motion.div>
                 <div className="absolute -bottom-10 -left-10 bg-bg p-8 border border-text/5 hidden md:block">
                    <span className="font-tech text-[8px] text-gold block mb-4">CALIBER_STATUS</span>
                    <div className="flex items-center space-x-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                       <span className="font-tech text-[10px] text-text/60 italic">99.998% ACCURACY_TARGET</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Archive: Product Grid */}
        <section className="py-60 px-6">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-40 gap-12">
               <div className="max-w-xl">
                  <span className="font-tech text-gold text-[10px] mb-8 block">THE_ARCHIVE</span>
                  <h2 className="text-5xl md:text-8xl leading-none">The <span className="italic">Manifesto.</span></h2>
               </div>
               <div className="flex flex-col items-end">
                  <span className="font-tech text-[10px] text-text/20 mb-4 font-bold tracking-[0.5em]">LATEST_SEQUENCE</span>
                  <div className="h-[1px] w-40 bg-text/10" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
              {loading ? (
                <div className="col-span-full h-80 flex items-center justify-center font-tech text-text/20">LOADING_ASSETS...</div>
              ) : (
                featured.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                  >
                    <WatchCard product={product} />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Cinematic Chapter: Video Integration */}
        <CinematicBanner 
          videoUrl="https://assets.mixkit.co/videos/preview/mixkit-mechanical-watch-gears-close-up-17361-large.mp4"
          title="The Machine State."
          subtitle="HOROLOGICAL_CORE"
          description="Witness the raw kinetic energy within our movements. A relentless pursuit of mechanical perfection, forged in the fires of discipline."
          align="left"
        />

        {/* Technical Specification Section */}
        <section className="py-60 bg-text text-bg overflow-hidden relative">
           <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
                 <div className="lg:col-span-2">
                    <h3 className="text-6xl md:text-[8rem] leading-none mb-20 text-bg italic font-display">Technical <br /> Sovereignty.</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-6">
                          <span className="font-tech font-bold text-[10px] border-b border-bg/10 pb-2 block">01_MATERIAL</span>
                          <p className="text-xl font-light">Grade 5 Titanium alloy, typically reserved for aerospace engineering, forms our indestructible chassis.</p>
                       </div>
                       <div className="space-y-6">
                          <span className="font-tech font-bold text-[10px] border-b border-bg/10 pb-2 block">02_HEARTBEAT</span>
                          <p className="text-xl font-light">Self-winding hybrid movements with a 72-hour power reserve and magnetic resistance up to 4,800 A/m.</p>
                       </div>
                    </div>
                 </div>
                 <div className="flex flex-col justify-center items-end hidden lg:flex">
                    <div className="w-full aspect-square border border-bg/10 flex items-center justify-center relative group">
                       <div className="absolute inset-4 border border-bg/5 group-hover:inset-0 transition-all duration-700" />
                       <span className="font-tech text-[10px] uppercase rotate-90 origin-center text-bg opacity-40">SYSTEM_SCHEMA_V.2</span>
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
