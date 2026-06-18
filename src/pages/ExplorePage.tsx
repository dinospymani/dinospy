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
import { handleFirestoreError, OperationType } from '../lib/utils';

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
      handleFirestoreError(e, OperationType.LIST, 'products');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = products.filter(p => {
    const matchesFilter = filter === 'All' || p.category === filter;
    return matchesFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-40 max-w-[100%] mx-auto px-4 md:px-8 lg:px-10 w-full text-center sm:text-left">
        <div className="mb-8">
            <button 
                onClick={() => window.history.back()}
                className="flex items-center space-x-2 text-text/60 hover:text-gold transition-colors p-2 -ml-2"
            >
                <ArrowLeft size={20} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Return</span>
            </button>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-16 mb-24">
            <div className="max-w-2xl">
              <span className="text-gold font-sans text-[10px] uppercase tracking-[0.8em] mb-8 block font-bold">Archives</span>
              <h1 className="text-6xl md:text-9xl font-display font-light leading-none tracking-tighter text-text">Collection</h1>
            </div>
        </div>

        <div className="flex space-x-12 mb-24 overflow-x-auto pb-4 scrollbar-hide border-b border-white/5">
            {['All', 'Grand Complications', 'Heritage', 'Avant-Garde', 'Deep Sea'].map(cat => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`pb-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all duration-700 whitespace-nowrap relative ${filter === cat ? 'text-gold' : 'text-text/20 hover:text-text'}`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-6 sm:gap-x-8 md:gap-y-16 lg:gap-y-24">
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
               className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-6 sm:gap-x-8 md:gap-y-16 lg:gap-y-24"
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
            <div className="text-center py-40 md:py-60 border border-white/5 glass-card rounded-3xl">
                <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ duration: 2 }}
                >
                    <p className="text-text/20 font-display text-3xl md:text-5xl italic font-light tracking-widest mb-12">
                      {products.length === 0 ? "Archive Empty." : "No assets matching your identity."}
                    </p>
                    
                    {products.length === 0 ? (
                      <div className="flex flex-col items-center space-y-6">
                        <div className="w-12 h-[1px] bg-gold/30 animate-pulse" />
                        <p className="text-gold font-modern text-[10px] md:text-xs uppercase tracking-[0.6em] font-black leading-relaxed">
                          The products will be added soon
                        </p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setFilter('All')}
                        className="text-[10px] font-modern font-bold uppercase tracking-[0.4em] text-gold hover:text-text transition-all hover:tracking-[0.6em]"
                      >
                        Clear Parameters
                      </button>
                    )}
                </motion.div>
            </div>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
