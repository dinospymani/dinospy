import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WatchCard from '../components/WatchCard';
import ProductSkeleton from '../components/ProductSkeleton';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-grow pt-40 pb-40 max-w-[100%] mx-auto px-6 md:px-12 lg:px-24 w-full">
        <div className="mb-16">
            <button 
                onClick={() => window.history.back()}
                className="flex items-center space-x-4 text-black/40 hover:text-black transition-all duration-500 p-2 -ml-2 group"
            >
                <div className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center group-hover:border-black transition-colors">
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold">BACK_TO_HOME</span>
            </button>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24 md:mb-40">
            <div className="max-w-4xl text-left">
              <div className="flex items-center space-x-6 mb-8 opacity-40">
                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                <span className="font-mono text-xs tracking-widest uppercase text-black">GALLERY EXHIBITION</span>
              </div>
              <h1 className="text-7xl md:text-[10rem] font-display font-medium leading-[0.8] tracking-tightest">THE <br /> <span className="opacity-10">ARCHIVE.</span></h1>
            </div>
            
            <div className="flex items-center space-x-12 overflow-x-auto pb-4 no-scrollbar lg:border-b lg:border-black/5">
                {['All', 'Grand Complications', 'Heritage', 'Avant-Garde', 'Deep Sea'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`pb-4 text-[10px] font-bold uppercase tracking-widest transition-all duration-700 whitespace-nowrap relative ${filter === cat ? 'text-black' : 'text-black/20 hover:text-black'}`}
                    >
                        {cat}
                        {filter === cat && (
                          <motion.div 
                            layoutId="activeFilter"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" 
                          />
                        )}
                    </button>
                ))}
            </div>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 md:gap-16">
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
               className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 md:gap-16"
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
            <div className="text-center py-40 md:py-60 border border-black/5 rounded-[4rem]">
                <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ duration: 2 }}
                >
                    <p className="text-black/20 font-display text-3xl md:text-5xl font-light tracking-widest mb-12">
                      {products.length === 0 ? "Gallery Empty." : "Selection Invalid."}
                    </p>
                    
                    {products.length === 0 ? (
                      <div className="flex flex-col items-center space-y-6">
                        <div className="w-12 h-[1px] bg-black/10 animate-pulse" />
                        <p className="text-black/40 font-mono text-[10px] md:text-xs uppercase tracking-[0.6em] font-bold leading-relaxed px-12">
                          The vault is currently closed for inventory update.
                        </p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setFilter('All')}
                        className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-black hover:tracking-[0.6em] transition-all"
                      >
                        RESET FILTERS
                      </button>
                    )}
                </motion.div>
            </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
