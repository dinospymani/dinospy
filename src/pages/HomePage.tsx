import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import WatchCard from '../components/WatchCard';
import ProductSkeleton from '../components/ProductSkeleton';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { db, auth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { ArrowRight, Zap } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/utils';

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState<any[]>(() => {
    // Immediate pre-hydration from local cache for instant appearance
    const cached = localStorage.getItem('dinospy_new_arrivals');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(!newArrivals.length);

  useEffect(() => {
    const prodRef = collection(db, 'products');
    
    const unsubscribe = onSnapshot(prodRef, (snapshot) => {
      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const arrivals = allProducts.filter((p: any) => p.isNewArrival).slice(0, 8);
      
      setNewArrivals(arrivals);
      localStorage.setItem('dinospy_new_arrivals', JSON.stringify(arrivals));
      setLoading(false);
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      
      // Fallback mock data
      const mockProducts = [
        { id: 'mock-1', name: 'Ouroboros Gold', brand: 'DINOSPY', price: 125000, images: ['https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=2070'], category: 'Luxury', rating: 4.9, isTrending: true, stock: 100 },
        { id: 'mock-2', name: 'Chrono Sport', brand: 'DINOSPY', price: 42000, images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=2080'], category: 'Sport', rating: 4.8, isTrending: true, stock: 150 },
        { id: 'mock-3', name: 'Minimalist Slate', brand: 'DINOSPY', price: 21000, images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=2018'], category: 'Classic', rating: 4.7, isTrending: true, stock: 80 },
        { id: 'mock-4', name: 'Quantum Smart', brand: 'DINOSPY', price: 18000, images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=2072'], category: 'Smart', rating: 4.6, isTrending: true, stock: 200 }
      ];
      setNewArrivals([...mockProducts, ...mockProducts.map(p => ({ ...p, id: `extra-${p.id}` }))]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);



  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Hero />

      <main className="flex-grow space-y-32 md:space-y-60 pb-32">
        {/* Cinematic Marquee */}
        <section className="border-y border-white/5 py-8 overflow-hidden relative bg-luxury-black">
          <div className="flex whitespace-nowrap animate-marquee">
            {[1,2,3,4,5].map(i => (
              <span key={i} className="text-white/10 font-medium uppercase tracking-[0.6em] text-[9px] mx-16">
                DINOSPY EXCLUSIVE • PREMIER HOROLOGY • ARCHITECTURAL PRECISION • LIFETIME HERITAGE • 
              </span>
            ))}
          </div>
        </section>

        {/* New Arrivals Section */}
        <section id="new" className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
              className="flex flex-col md:flex-row justify-between items-start md:items-end mb-32 gap-12"
            >
              <div className="max-w-2xl">
                <span className="text-gold font-sans text-[10px] uppercase tracking-[0.6em] mb-8 block font-bold">New Additions</span>
                <h2 className="text-5xl md:text-8xl font-display font-light tracking-tight leading-tight">Latest <span className="italic">Acquisitions</span></h2>
                <p className="mt-8 text-white/30 text-lg font-light tracking-wide max-w-md">Our newest masterpieces, forged in the fires of precision and heritage.</p>
              </div>
              <Link to="/explore" className="group flex flex-col items-end">
                <span className="text-white/40 text-[10px] uppercase tracking-[0.6em] font-bold py-3 border-b border-white/5 group-hover:text-gold group-hover:border-gold transition-all duration-1000 group-hover:tracking-[1em] group-hover:pr-10">
                  Explore All
                </span>
              </Link>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.3 }
                }
              }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-x-12 sm:gap-y-24"
            >
              {loading ? (
                new Array(4).fill(0).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))
              ) : newArrivals.length > 0 ? (
                newArrivals.map(product => (
                  <WatchCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-40 md:py-60 text-center border border-white/5 bg-white/[0.01] rounded-3xl">
                   <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 2 }}
                   >
                    <p className="text-white/20 font-display text-3xl md:text-5xl italic font-light tracking-widest mb-12">Archive Empty.</p>
                    <div className="flex flex-col items-center space-y-6">
                      <div className="w-12 h-[1px] bg-gold/30 animate-pulse" />
                      <p className="text-gold font-sans text-[10px] md:text-xs uppercase tracking-[0.6em] font-black leading-relaxed">
                        The products will be added soon
                      </p>
                    </div>
                   </motion.div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* The DINOSPY Narrative Section */}
        <section id="philosophy" className="relative overflow-hidden px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
              <div className="lg:col-span-6 space-y-20">
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.8, ease: [0.19, 1, 0.22, 1] }}
                >
                  <span className="text-gold font-sans text-[10px] uppercase tracking-[0.8em] mb-12 block font-bold">The Narrative</span>
                  <h2 className="text-6xl md:text-9xl font-display leading-[0.9] tracking-tighter mb-16 font-light">
                    Archive of <br />
                    <span className="gold-text italic">Excellence.</span>
                  </h2>
                  <p className="text-2xl text-white/30 max-w-lg leading-relaxed font-light italic">
                    "At DINOSPY, we curate history. Each timepiece is a manifestation of time itself, forged for those who understand that true luxury is silent."
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 pt-10">
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5 }}
                    className="space-y-8"
                  >
                    <div className="w-10 h-[1px] bg-gold/40" />
                    <h4 className="text-[11px] uppercase font-bold tracking-[0.5em] text-gold">The Caliber</h4>
                    <p className="text-[10px] text-white/20 leading-relaxed uppercase tracking-[0.2em] font-medium">
                      Absolute chronometric stability meet innovative craftsmanship.
                    </p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.4 }}
                    className="space-y-8"
                  >
                    <div className="w-10 h-[1px] bg-gold/40" />
                    <h4 className="text-[11px] uppercase font-bold tracking-[0.5em] text-gold">The Identity</h4>
                    <p className="text-[10px] text-white/20 leading-relaxed uppercase tracking-[0.2em] font-medium">
                      Silhouettes that define the presence of the modern elite.
                    </p>
                  </motion.div>
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 2.5, ease: [0.19, 1, 0.22, 1] }}
                className="lg:col-span-6 relative group"
              >
                <div className="aspect-[4/5] overflow-hidden border border-white/5 relative luxury-shadow">
                  <img 
                    src="https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1974" 
                    alt="Horological Art"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s] ease-out"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="absolute -bottom-24 -right-4 md:-right-24 bg-luxury-black p-16 rounded-none border border-white/5 flex flex-col items-center justify-center w-64 h-64 backdrop-blur-3xl shadow-2xl z-10">
                  <span className="text-[11px] uppercase font-bold tracking-[0.6em] text-gold mb-4">Artisanal</span>
                  <span className="text-4xl font-display italic font-light">Mastery</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Global Excellence Section */}
        <section className="py-80 bg-luxury-black relative overflow-hidden px-4">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 2 }}
            >
              <h2 className="text-6xl md:text-9xl font-display mb-16 font-light tracking-tight leading-[0.85]">Pinnacle of <br /><span className="gold-text italic">Boutique Luxury.</span></h2>
              <p className="text-white/20 max-w-3xl mx-auto mb-24 text-xl md:text-3xl font-light leading-relaxed tracking-wide italic">
                "DINOSPY merges artisanal craftsmanship with limited-edition exclusivity. Every timepiece is a rare artifact of time."
              </p>
              
              <div className="flex flex-col md:flex-row justify-center gap-16 md:gap-32 pt-12">
                <div className="space-y-6">
                  <p className="text-5xl md:text-7xl font-display gold-text italic tracking-tighter font-light">Exclusive</p>
                  <p className="text-[11px] text-white/20 uppercase tracking-[0.6em] font-bold">Genesis Collection</p>
                </div>
                <div className="w-[1px] h-32 bg-white/5 hidden md:block self-center" />
                <div className="space-y-6">
                  <p className="text-5xl md:text-7xl font-display gold-text italic tracking-tighter font-light">Limited</p>
                  <p className="text-[11px] text-white/20 uppercase tracking-[0.6em] font-bold">Serial Numbered</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Craftsmanship Section */}
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-40 items-center">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 2 }}
                className="relative"
              >
                <div className="aspect-square luxury-shadow overflow-hidden group border border-white/5 bg-luxury-charcoal">
                  <img 
                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072" 
                    alt="Watch Engineering"
                    className="w-full h-full object-cover grayscale transition-all duration-[3s] group-hover:grayscale-0 group-hover:scale-105 opacity-60 group-hover:opacity-100"
                  />
                </div>
                <div className="absolute -bottom-16 -left-16 bg-luxury-black p-16 border border-white/5 hidden xl:block shadow-2xl">
                   <p className="text-7xl font-display gold-text mb-3 italic font-light">100%</p>
                   <p className="text-[11px] uppercase tracking-[0.5em] text-white/20 font-bold">Precision Assets</p>
                </div>
              </motion.div>

              <div className="space-y-24">
                 <motion.div
                   initial={{ opacity: 0, x: 40 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 2 }}
                 >
                    <span className="text-gold font-sans tracking-[0.8em] text-[10px] uppercase mb-12 block font-bold">The Standard</span>
                    <h2 className="text-5xl md:text-8xl font-display mb-12 leading-[1] font-light tracking-tight">Mastery in <br /><span className="gold-text italic">Motion.</span></h2>
                    <p className="text-white/30 leading-relaxed text-2xl font-light italic">
                      "Each instrument undergoes 400 hours of testing. Merging Swiss legacy with avant-garde engineering."
                    </p>
                 </motion.div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
                    <div className="p-10 border border-white/5 hover:border-gold/30 transition-all duration-700 bg-white/[0.01] group">
                       <h4 className="text-gold font-bold uppercase tracking-[0.5em] text-[11px] mb-8 group-hover:text-white transition-colors">Sapphire</h4>
                       <p className="text-[10px] text-white/20 tracking-[0.2em] uppercase leading-loose font-medium">Eternal clarity via triple-layer anti-reflective coating.</p>
                    </div>
                    <div className="p-10 border border-white/5 hover:border-gold/30 transition-all duration-700 bg-white/[0.01] group">
                       <h4 className="text-gold font-bold uppercase tracking-[0.5em] text-[11px] mb-8 group-hover:text-white transition-colors">Surgical</h4>
                       <p className="text-[10px] text-white/20 tracking-[0.2em] uppercase leading-loose font-medium">Forged 316L stainless steel for absolute endurance.</p>
                    </div>
                 </div>

                 <motion.button 
                   whileHover={{ x: 30 }}
                   transition={{ duration: 0.8, ease: "easeOut" }}
                   className="text-[11px] font-bold uppercase tracking-[0.6em] text-white/50 hover:text-gold transition-all duration-700 flex items-center group pt-10"
                 >
                    The Manifesto
                    <div className="w-20 h-[1px] bg-gold/30 ml-8 group-hover:w-32 group-hover:bg-gold transition-all duration-700" />
                 </motion.button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
