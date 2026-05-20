import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import WatchCard from '../components/WatchCard';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { db } from '../context/AuthContext';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { ArrowRight, Zap } from 'lucide-react';

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const prodRef = collection(db, 'products');
    
    // Real-time listener for ALL products to distribute locally
    const unsubscribe = onSnapshot(prodRef, (snapshot) => {
      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setNewArrivals(allProducts.filter((p: any) => p.isNewArrival).slice(0, 8));
      setLoading(false);
    }, (error: any) => {
      console.error("Error fetching products:", error);
      
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

      <main className="flex-grow">
        {/* Flash Sale Section */}
        <section className="bg-gold py-4 overflow-hidden relative">
          <div className="flex whitespace-nowrap animate-marquee-slow">
            {[1,2,3,4,5].map(i => (
              <span key={i} className="text-luxury-black font-bold uppercase tracking-[0.4em] text-xs mx-10">
                DINOSPY EXCLUSIVE: India's Premier Watch Collection • Express India-wide Dispatch • Lifetime Service Support •
              </span>
            ))}
          </div>
        </section>

        {/* New Arrivals Section - MOVED TO TOP */}
        <section id="new" className="py-24 bg-luxury-black/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-16">
              <div>
                <span className="text-gold font-mono text-xs uppercase tracking-widest mb-4 block">New Additions</span>
                <h2 className="text-3xl md:text-5xl font-display">New Releases</h2>
              </div>
              <button className="text-gold text-sm font-bold uppercase tracking-widest flex items-center hover:opacity-70 transition-opacity">
                View All <ArrowRight className="ml-2" size={16} />
              </button>
            </div>
            
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16"
            >
              {newArrivals.length > 0 ? (
                newArrivals.map(product => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                  >
                    <WatchCard product={product} />
                  </motion.div>
                ))
              ) : !loading && (
                <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/5">
                  <p className="text-white/40 font-display text-xl mb-4">No acquisitions available yet.</p>
                  <p className="text-white/20 text-sm max-w-sm mx-auto">Access the Admin panel to initialize the DINOSPY Masterpiece catalog.</p>
                </div>
              )}
              {loading && new Array(4).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse glass aspect-[4/5] rounded-xl" />
              ))}
            </motion.div>
          </div>
        </section>

        {/* The DINOSPY Narrative Section (Replacement for Style Selection) */}
        <section id="philosophy" className="py-40 bg-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gold/5 blur-[120px] -z-10 animate-pulse" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-7 space-y-12">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <span className="text-gold font-mono text-xs uppercase tracking-[0.5em] mb-8 block">Legacy of Excellence</span>
                  <h2 className="text-6xl md:text-8xl font-display leading-[0.9] tracking-tighter mb-12">
                    Not Just a Watch.<br />
                    <span className="gold-text italic">An Archive.</span>
                  </h2>
                  <p className="text-xl text-white/60 max-w-xl leading-relaxed font-light">
                    At DINOSPY, we don't follow trends. We curate history. Each timepiece is a marriage of architectural precision and uncompromising luxury—a physical manifestation of time itself.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-4"
                  >
                    <div className="w-12 h-[1px] bg-gold" />
                    <h4 className="text-xs uppercase font-black tracking-widest text-gold">The Caliber</h4>
                    <p className="text-sm text-white/40 leading-relaxed">
                      Custom movements engineered to tolerances within microns. Absolute chronometric stability.
                    </p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="w-12 h-[1px] bg-gold" />
                    <h4 className="text-xs uppercase font-black tracking-widest text-gold">The Identity</h4>
                    <p className="text-sm text-white/40 leading-relaxed">
                      Hand-finished surfaces that play with light. A silhouette that defines the room.
                    </p>
                  </motion.div>
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="lg:col-span-5 relative"
              >
                <div className="aspect-[4/5] rounded-[4rem] overflow-hidden border border-white/10 glass p-4">
                  <img 
                    src="https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1974" 
                    alt="Horological Art"
                    className="w-full h-full object-cover rounded-[3rem]"
                  />
                </div>
                <div className="absolute -bottom-10 -left-10 glass p-8 rounded-full border border-gold/20 flex flex-col items-center justify-center w-40 h-40 animate-marquee-slow">
                  <span className="text-[10px] uppercase font-black tracking-widest text-gold">Artisanal</span>
                  <span className="text-lg font-display">1 of 1</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Premium Startup Section */}
        <section className="py-24 border-y border-white/5 bg-gradient-to-b from-transparent to-gold/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass border border-gold/20 mb-8"
            >
              <Zap className="text-gold" size={14} />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/80">Premium Disruptor</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-display mb-8">Pinnacle of <span className="gold-text md:italic">Boutique Luxury.</span></h2>
            <p className="text-white/50 max-w-2xl mx-auto mb-12">
              DINOSPY is a rising force in haute horology. As a high-end startup, we merge artisanal craftsmanship with limited-edition drops, ensuring every timepiece remains a rare artifact of your personal journey.
            </p>
            
            <div className="flex flex-wrap justify-center gap-8">
              <div className="glass p-6 rounded-2xl border border-white/5 min-w-[200px]">
                <p className="text-2xl font-display gold-text mb-1 italic">Exclusive</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Limited Genesis Drops</p>
              </div>
              <div className="glass p-6 rounded-2xl border border-white/5 min-w-[200px]">
                <p className="text-2xl font-display gold-text mb-1 italic">Rare</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Serial Numbered Assets</p>
              </div>
            </div>
          </div>
        </section>

        {/* Craftsmanship Section */}
        <section className="py-32 bg-luxury-black/50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="relative aspect-square"
              >
                <div className="absolute inset-0 gold-gradient blur-[100px] opacity-20 animate-pulse" />
                <img 
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072" 
                  alt="Watch Engineering"
                  className="w-full h-full object-cover rounded-3xl border border-white/10 glass grayscale hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute -bottom-10 -right-10 glass p-8 rounded-3xl border border-gold/30 hidden md:block">
                   <p className="text-4xl font-display gold-text mb-2">100%</p>
                   <p className="text-[10px] uppercase tracking-widest text-white/50">Hand-Assembled in India</p>
                </div>
              </motion.div>

              <div className="space-y-12">
                 <div>
                    <span className="text-gold font-mono tracking-widest text-xs uppercase mb-4 block">The DINOSPY Standard</span>
                    <h2 className="text-5xl font-display mb-6 leading-tight">Mastery in Every <span className="gold-text italic">Millisecond.</span></h2>
                    <p className="text-white/60 leading-relaxed text-lg">
                      Each DINOSPY timepiece undergoes 400 hours of rigorous testing and calibration. Our master horologists merge traditional Swiss techniques with innovative Indian engineering to create instruments of absolute precision.
                    </p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass p-6 rounded-2xl border border-white/5 hover:border-gold/20 transition-all">
                       <h4 className="text-gold font-bold uppercase tracking-widest text-xs mb-3">Sapphire Crystal</h4>
                       <p className="text-xs text-white/40">Scratch-resistant glass with triple-layer anti-reflective coating for ultimate clarity.</p>
                    </div>
                    <div className="glass p-6 rounded-2xl border border-white/5 hover:border-gold/20 transition-all">
                       <h4 className="text-gold font-bold uppercase tracking-widest text-xs mb-3">Surgical Steel</h4>
                       <p className="text-xs text-white/40">Forged from 316L stainless steel, offering maximum corrosion resistance and durability.</p>
                    </div>
                 </div>

                 <button className="text-sm font-bold uppercase tracking-[0.3em] text-white hover:text-gold transition-colors flex items-center group">
                    Discover Our Process
                    <div className="w-12 h-[1px] bg-gold ml-4 group-hover:w-20 transition-all" />
                 </button>
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
