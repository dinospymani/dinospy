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
      
      <main className="flex-grow pt-40 pb-40 max-w-[100%] mx-auto px-6 md:px-12 lg:px-20 w-full text-center sm:text-left">
        <div className="mb-12">
            <button 
                onClick={() => window.history.back()}
                className="flex items-center space-x-3 text-text/40 hover:text-gold transition-all duration-500 p-2 -ml-2 group"
            >
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-gold transition-colors">
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.4em] font-black">RETURN_HOME</span>
            </button>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24 md:mb-32">
            <div className="max-w-3xl text-left">
              <div className="flex items-center space-x-6 mb-8 opacity-40">
                <div className="w-1.5 h-1.5 bg-gold rounded-full shadow-[0_0_10px_#c5a059]" />
                <span className="font-tech text-xs tracking-widest uppercase text-gold">VAULT_ARCHIVES</span>
              </div>
              <h1 className="text-6xl md:text-9xl font-display italic leading-none tracking-tightest">Archive <span className="opacity-10">Collection.</span></h1>
            </div>
            
            <div className="flex items-center space-x-12 overflow-x-auto pb-4 no-scrollbar lg:border-b lg:border-white/5">
                {['All', 'Grand Complications', 'Heritage', 'Avant-Garde', 'Deep Sea'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-700 whitespace-nowrap relative ${filter === cat ? 'text-gold' : 'text-text/20 hover:text-text'}`}
                    >
                        {cat}
                        {filter === cat && (
                          <motion.div 
                            layoutId="activeFilter"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold shadow-[0_0_10px_#c5a059]" 
                          />
                        )}
                    </button>
                ))}
            </div>
        </div>

        {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-16 lg:gap-24">
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
               className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-16 lg:gap-24"
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
