import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Watch, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { db } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WatchCard from '../components/WatchCard';
import { Link } from 'react-router-dom';

export default function WishlistPage() {
  const { wishlist } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wishlist.length === 0) {
      setProducts([]);
      return;
    }

    setLoading(true);
    // Real-time synchronization for the products in the wishlist
    // Note: 'in' operator is limited to 10 items in Firestore. 
    // For a larger wishlist, we would fetch in batches or use a different strategy.
    const q = query(collection(db, 'products'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const wishlistedProducts = allProducts.filter(p => wishlist.includes(p.id));
      setProducts(wishlistedProducts);
      setLoading(false);
    }, (err) => {
      console.warn("Archive transmission isolated", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [wishlist]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-black selection:bg-black selection:text-white">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-40 max-w-[100%] mx-auto px-4 md:px-8 lg:px-10 w-full text-center sm:text-left">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-black/40 hover:text-black transition-colors p-2 -ml-2"
            >
              <ArrowLeft size={20} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Return</span>
            </button>
          </div>
          <div className="flex justify-between items-end mb-12">
            <div>
              <h1 className="text-5xl font-display font-medium text-black">Private Archive</h1>
              <p className="text-black/40 mt-2">Your curated selection of horological excellence.</p>
            </div>
            {loading && (
              <Watch className="text-black animate-pulse" size={24} />
            )}
          </div>

          {wishlist.length === 0 ? (
            <div className="bg-neutral-50 p-20 rounded-[3rem] text-center border border-black/5">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 border border-black/10">
                <Heart className="text-black/10" size={32} />
              </div>
              <h2 className="text-2xl font-display font-medium mb-4">Your wishlist is empty</h2>
              <p className="text-black/40 mb-12 max-w-md mx-auto">
                Save your favorite timepieces here to keep track of what moves you.
              </p>
              <Link 
                to="/explore"
                className="inline-block px-10 py-5 bg-black text-white font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all rounded-full"
              >
                Explore Collection
              </Link>
            </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-8">
                <AnimatePresence mode="popLayout">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <WatchCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
