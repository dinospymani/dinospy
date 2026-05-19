import React from 'react';
import { ShoppingCart, Heart, User, Menu, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, profile, signInWithGoogle, signOut } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-display font-bold gold-text tracking-widest">DINOSPY</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium hover:text-gold transition-colors">Home</Link>
            <Link to="/#trending" className="text-sm font-medium hover:text-gold transition-colors">Trending</Link>
            <Link to="/#categories" className="text-sm font-medium hover:text-gold transition-colors">Categories</Link>
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium text-gold/80 hover:text-gold">Admin</Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <button className="p-2 hover:text-gold transition-colors">
              <Search size={20} />
            </button>
            <Link to="/wishlist" className="p-2 hover:text-gold transition-colors">
              <Heart size={20} />
            </Link>
            <Link to="/cart" className="p-2 hover:text-gold transition-colors relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-gold text-luxury-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="p-2 hover:text-gold transition-colors">
                  <User size={20} />
                </Link>
                <button 
                  onClick={() => signOut()}
                  className="text-xs uppercase tracking-wider font-bold hover:text-gold transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signInWithGoogle()}
                className="px-6 py-2 bg-gold text-luxury-black font-bold rounded-full text-sm hover:scale-105 transition-transform active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              <Link to="/" className="block text-lg font-medium py-2">Home</Link>
              <Link to="/#trending" className="block text-lg font-medium py-2">Trending</Link>
              <Link to="/#categories" className="block text-lg font-medium py-2">Categories</Link>
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex space-x-6">
                  <Heart size={22} />
                  <ShoppingCart size={22} />
                  <User size={22} />
                </div>
                {!user && (
                    <button 
                      onClick={() => signInWithGoogle()}
                      className="px-6 py-2 bg-gold text-luxury-black font-bold rounded-full text-sm"
                    >
                      Sign In
                    </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
