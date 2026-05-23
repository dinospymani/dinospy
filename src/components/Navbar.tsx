import React from 'react';
import { motion } from 'motion/react';
import { Heart, User, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const { user, profile, signInWithGoogle } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-luxury-black/30 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link to="/" className="flex items-center">
            <span className="text-xl md:text-2xl font-display font-medium text-white tracking-[0.3em] hover:text-gold transition-colors duration-500">DINOSPY</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-12">
            <Link to="/" className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/50 hover:text-gold transition-all duration-500 hover:scale-105">Home</Link>
            <Link to="/explore" className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/50 hover:text-gold transition-all duration-500 hover:scale-105">Collection</Link>
            <Link to="/#philosophy" className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/50 hover:text-gold transition-all duration-500 hover:scale-105">Narrative</Link>
          </div>

          <div className="flex items-center space-x-6 md:space-x-8">
            <NotificationCenter />
            <Link to="/wishlist" className="text-white/40 hover:text-gold transition-colors duration-500">
              <Heart size={18} strokeWidth={1} />
            </Link>
            
            <Link to="/cart" className="relative group text-white/40 hover:text-gold transition-colors duration-500">
              <ShoppingBag size={18} strokeWidth={1} />
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={cartCount}
                  className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-gold text-luxury-black text-[8px] font-bold rounded-none flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>
            
            <div className="h-4 w-[1px] bg-white/10 hidden md:block" />

            {user ? (
              <div className="flex items-center space-x-6">
                <Link to="/profile" className="text-white/40 hover:text-gold transition-colors duration-500">
                  <User size={18} strokeWidth={1} />
                </Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/60 hover:text-gold hidden md:block">Master</Link>
                )}
              </div>
            ) : (
              <button 
                onClick={() => signInWithGoogle()}
                className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold hover:text-white transition-all duration-500"
              >
                Access
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
