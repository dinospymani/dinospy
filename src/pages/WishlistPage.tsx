import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import WatchCard from '../components/WatchCard';
import { Link } from 'react-router-dom';

// In a real app, we'd fetch actual product data for these IDs
// For demo, we'll use a search or mock
export default function WishlistPage() {
  const { wishlist } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-luxury-black">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-display mb-12 gold-text">Your Wishlist</h1>

          {wishlist.length === 0 ? (
            <div className="glass p-20 rounded-[3rem] text-center border border-white/5">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                <Heart className="text-white/20" size={32} />
              </div>
              <h2 className="text-2xl font-display mb-4">Your wishlist is empty</h2>
              <p className="text-white/40 mb-12 max-w-md mx-auto">
                Save your favorite timepieces here to keep track of what moves you.
              </p>
              <Link 
                to="/" 
                className="inline-block px-10 py-5 glass border border-gold/20 text-gold font-bold uppercase tracking-widest hover:bg-gold hover:text-luxury-black transition-all"
              >
                Explore Collection
              </Link>
            </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <p className="col-span-full text-white/40 italic mb-4">
                    Items you've added to your private selection.
                </p>
                {/* Normally we'd map over actual product objects fetched from Firestore */}
                <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/5">
                    <p className="text-white/60 mb-6">Integration Pending: Connecting to your saved watchlist in real-time...</p>
                    <div className="flex justify-center space-x-2">
                        <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                </div>
             </div>
          )}
        </motion.div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
