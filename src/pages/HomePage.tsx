import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import WatchCard from '../components/WatchCard';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { db } from '../context/AuthContext';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';

const CATEGORIES = ['Luxury', 'Sport', 'Smart', 'Classic'];

export default function HomePage() {
  const [trending, setTrending] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRecs, setAiRecs] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    const prodRef = collection(db, 'products');
    
    // Real-time listener for ALL products to distribute locally
    const unsubscribe = onSnapshot(prodRef, (snapshot) => {
      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setTrending(allProducts.filter((p: any) => p.isTrending).slice(0, 4));
      setNewArrivals(allProducts.filter((p: any) => p.isNewArrival).slice(0, 8));
      setLoading(false);
    }, (error: any) => {
      console.error("Error fetching products:", error);
      
      // Fallback mock data
      const mockProducts = [
        { id: 'mock-1', name: 'Ouroboros Gold', brand: 'DINOSPY', price: 125000, images: ['https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=2070'], category: 'Luxury', rating: 4.9, isTrending: true, stock: 5 },
        { id: 'mock-2', name: 'Chrono Sport', brand: 'DINOSPY', price: 42000, images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=2080'], category: 'Sport', rating: 4.8, isTrending: true, stock: 12 },
        { id: 'mock-3', name: 'Minimalist Slate', brand: 'DINOSPY', price: 21000, images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=2018'], category: 'Classic', rating: 4.7, isTrending: true, stock: 8 },
        { id: 'mock-4', name: 'Quantum Smart', brand: 'DINOSPY', price: 18000, images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=2072'], category: 'Smart', rating: 4.6, isTrending: true, stock: 15 }
      ];
      setTrending(mockProducts);
      setNewArrivals([...mockProducts, ...mockProducts.map(p => ({ ...p, id: `extra-${p.id}` }))]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getAIRecommendations = async () => {
    // Actually calling our API route
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: ['Luxury', 'Gold'], history: [] })
      });
      const data = await res.json();
      setAiRecs(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Hero />

      <main className="flex-grow">
        {/* Flash Sale Section */}
        <section className="bg-gold py-4 overflow-hidden relative">
          <div className="flex whitespace-nowrap animate-marquee">
            {[1,2,3,4,5].map(i => (
              <span key={i} className="text-luxury-black font-bold uppercase tracking-[0.4em] text-xs mx-10">
                DINOSPY EXCLUSIVE: India's Premier Watch Collection • Express India-wide Dispatch • Lifetime Service Support •
              </span>
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section id="categories" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-gold font-mono text-xs uppercase tracking-widest mb-4 block">Selection</span>
              <h2 className="text-4xl md:text-5xl font-display">Collections</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {CATEGORIES.map((cat, i) => (
              <motion.div 
                key={cat}
                whileHover={{ scale: 1.02 }}
                className="group relative h-64 md:h-80 rounded-2xl overflow-hidden glass cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-transparent to-transparent z-10" />
                <div className="absolute bottom-8 left-8 z-20">
                  <h3 className="text-xl font-bold uppercase tracking-widest mb-2">{cat}</h3>
                  <div className="w-8 h-[2px] bg-gold group-hover:w-full transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Trending Section */}
        <section id="trending" className="py-24 bg-luxury-gray/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-16">
              <div>
                <span className="text-gold font-mono text-xs uppercase tracking-widest mb-4 block">Most Desired</span>
                <h2 className="text-4xl md:text-5xl font-display">Trending Now</h2>
              </div>
              <button className="text-gold text-sm font-bold uppercase tracking-widest flex items-center hover:opacity-70 transition-opacity">
                View All <ArrowRight className="ml-2" size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {trending.map(product => (
                <WatchCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* AI Recommendations Section */}
        <section className="py-24 border-y border-white/5 bg-gradient-to-b from-transparent to-gold/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 px-4 py-1 rounded-full glass border border-gold/20 mb-8"
            >
              <Sparkles className="text-gold" size={14} />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/80">AI Powered Personalization</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-display mb-8">Guided by <span className="gold-text">Intelligence.</span></h2>
            <p className="text-white/50 max-w-2xl mx-auto mb-12">
              Our AI engine analyzes your unique style profile to suggest timepieces that don't just tell time, but tell your story.
            </p>
            
            {!aiRecs.length ? (
              <button 
                onClick={getAIRecommendations}
                className="px-10 py-5 glass border border-gold/30 hover:bg-gold hover:text-luxury-black transition-all font-bold uppercase tracking-widest"
              >
                Find My Match
              </button>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {aiRecs.map((rec: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="glass p-8 rounded-2xl border border-gold/20"
                  >
                    <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                      <Zap className="text-gold" size={24} />
                    </div>
                    <h4 className="text-xl font-bold gold-text mb-4 uppercase">{rec.type}</h4>
                    <p className="text-sm text-white/60 leading-relaxed mb-6 italic">"{rec.reason}"</p>
                  </motion.div>
                ))}
              </div>
            )}
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

        {/* New Arrivals Section */}
        <section id="new" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <span className="text-gold font-mono text-xs uppercase tracking-widest mb-4 block">New Additions</span>
              <h2 className="text-4xl md:text-5xl font-display">New Arrivals</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {newArrivals.map(product => (
                <WatchCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
