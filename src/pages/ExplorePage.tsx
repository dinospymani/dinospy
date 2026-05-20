import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search as SearchIcon, SlidersHorizontal, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import WatchCard from '../components/WatchCard';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../context/AuthContext';

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(fetched);
      setLoading(false);
    }, (e) => {
      console.error(e);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || p.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-luxury-black">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <h1 className="text-5xl font-display gold-text">Explore</h1>
            
            <div className="relative flex-grow max-w-xl">
                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                <input 
                    type="text"
                    placeholder="Search DINOSPY collection..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-16 pr-6 py-5 focus:border-gold outline-none text-lg transition-all"
                />
            </div>
        </div>

        <div className="flex space-x-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
            {['All', 'Luxury', 'Sport', 'Smart', 'Classic'].map(cat => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filter === cat ? 'gold-gradient text-luxury-black' : 'glass border border-white/10 text-white/50 hover:text-white'}`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1,2,3,4].map(i => <div key={i} className="h-[450px] glass rounded-3xl animate-pulse" />)}
            </div>
        ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filtered.map(product => (
                    <WatchCard key={product.id} product={product} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 glass rounded-3xl border border-white/5">
                <p className="text-white/40 text-xl font-display">No timepieces found matching your search.</p>
            </div>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
