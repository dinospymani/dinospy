import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, User, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const { user, profile, setIsAuthModalOpen } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [isCheckingSecurity, setIsCheckingSecurity] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsCheckingSecurity(true);
      setTimeout(() => setIsCheckingSecurity(false), 2000);
    }, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center space-x-12">
            <Link to="/" className="flex items-center">
              <span className="text-xl md:text-2xl font-display font-medium text-white tracking-[0.3em] hover:text-gold transition-colors duration-500">DINOSPY</span>
            </Link>

            {/* Security Node Indicator */}
            <div className="hidden lg:flex items-center space-x-3 opacity-30 group cursor-default">
              <div className="relative">
                <ShieldCheck size={12} className={`${isCheckingSecurity ? 'text-gold fill-gold/20' : 'text-white/40'} transition-colors duration-1000`} />
                {isCheckingSecurity && (
                  <motion.div 
                    layoutId="security-ring"
                    className="absolute -inset-1 border border-gold/40 rounded-full"
                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
              <span className="text-[7px] font-mono uppercase tracking-[0.4em] text-white/40">
                {isCheckingSecurity ? 'Node Scan: Active' : 'AES-512 Secure'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-12">
            {[
              { to: "/", label: "Home" },
              { to: "/explore", label: "Collection" },
              { to: "/#philosophy", label: "Narrative" }
            ].map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="group relative text-[10px] font-semibold uppercase tracking-[0.4em] text-white/50 hover:text-gold transition-all duration-700"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold transition-all duration-700 group-hover:w-full" />
              </Link>
            ))}
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
                onClick={() => setIsAuthModalOpen(true)}
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
