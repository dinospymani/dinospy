import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import WatchCard from '../components/WatchCard';
import ProductSkeleton from '../components/ProductSkeleton';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../context/AuthContext';

export default function ExplorePage() {
  const [products, setProducts] = useState<any[]>(() => {
    // Immediate pre-hydration from local cache for instant appearance
    const cached = localStorage.getItem('dinospy_products_all');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(!products.length);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(fetched);
      localStorage.setItem('dinospy_products_all', JSON.stringify(fetched));
      setLoading(false);
    }, (e) => {
      console.error(e);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = products.filter(p => {
    const matchesFilter = filter === 'All' || p.category === filter;
    return matchesFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-luxury-black">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-8">
            <button 
                onClick={() => window.history.back()}
                className="flex items-center space-x-2 text-white/60 hover:text-gold transition-colors p-2 -ml-2"
            >
                <ArrowLeft size={20} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Return</span>
            </button>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-16 mb-24">
            <div className="max-w-2xl">
              <span className="text-gold font-sans text-[10px] uppercase tracking-[0.8em] mb-8 block font-bold">Archives</span>
              <h1 className="text-6xl md:text-9xl font-display font-light leading-none tracking-tighter">Collection</h1>
            </div>
        </div>

        <div className="flex space-x-12 mb-24 overflow-x-auto pb-4 scrollbar-hide border-b border-white/5">
            {['All', 'Grand Complications', 'Heritage', 'Avant-Garde', 'Deep Sea'].map(cat => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`pb-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all duration-700 whitespace-nowrap relative ${filter === cat ? 'text-gold' : 'text-white/20 hover:text-white'}`}
                >
                    {cat}
                    {filter === cat && (
                      <motion.div 
                        layoutId="activeFilter"
                        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gold" 
                      />
                    )}
                </button>
            ))}
        </div>

        {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-x-12 sm:gap-y-24">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <ProductSkeleton key={i} />
                ))}
            </div>
        ) : filtered.length > 0 ? (
            <motion.div 
               layout
               initial="hidden"
               animate="visible"
               variants={{
                 hidden: { opacity: 0 },
                 visible: {
                   opacity: 1,
                   transition: {
                     staggerChildren: 0.1,
                     delayChildren: 0.1
                   }
                 }
               }}
               className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-x-12 sm:gap-y-24"
            >
                {filtered.map(product => (
                    <motion.div
                      key={product.id}
                      layout
                      variants={{
                        hidden: { opacity: 0, y: 50 },
                        visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.19, 1, 0.22, 1] } }
                      }}
                    >
                      <WatchCard product={product} />
                    </motion.div>
                ))}
            </motion.div>
        ) : (
            <div className="text-center py-60 border border-white/5 bg-white/[0.01]">
                <p className="text-white/20 font-display text-4xl italic font-light tracking-widest mb-8">No assets matching your identity.</p>
                <button 
                  onClick={() => setFilter('All')}
                  className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold hover:text-white transition-colors"
                >
                  Clear Parameters
                </button>
            </div>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
