import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { ShoppingBag, Search, Heart, User, Menu, X, Plus } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { MagneticButton } from './MagneticButton';

export default function Navbar() {
  const { user, setIsAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { scrollY } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navHeight = useTransform(scrollY, [0, 100], ['6rem', '5rem']);
  const navBg = useTransform(scrollY, [0, 100], ['rgba(18, 18, 18, 0)', 'rgba(255, 255, 240, 0.98)']);
  const navTextColor = useTransform(scrollY, [0, 100], ['rgba(255, 255, 240, 1)', 'rgba(18, 18, 18, 1)']);
  const navBorder = useTransform(scrollY, [0, 100], ['rgba(255, 255, 240, 0)', 'rgba(18, 18, 18, 0.08)']);

  const navLinks = [
    { to: "/explore", label: "COLLECTIONS" },
    { to: "/track", label: "TRACK_ORDER" },
    { to: "/support", label: "SUPPORT" },
    { to: "/faq", label: "FAQ" }
  ];

  return (
    <motion.nav 
      style={{ 
        height: navHeight,
        backgroundColor: navBg,
        borderBottomColor: navBorder,
        color: navTextColor
      }}
      className="fixed top-0 left-0 w-full z-[100] flex items-center border-b transition-all duration-700 font-sans"
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Left: Search & Wishlist */}
        <div className="hidden lg:flex items-center space-x-8">
          <MagneticButton className="p-2 hover:text-luxury-gold transition-colors">
            <Search size={18} strokeWidth={1.5} />
          </MagneticButton>
          <Link to="/wishlist">
            <MagneticButton className="p-2 hover:text-luxury-gold transition-colors">
              <Heart size={18} strokeWidth={1.5} />
            </MagneticButton>
          </Link>
        </div>

        {/* Center: Branding */}
        <Link to="/" className="flex flex-col items-center group shrink-0">
          <span className="font-display text-xl md:text-3xl tracking-[0.5em] font-bold uppercase transition-all duration-1000 group-hover:tracking-[0.7em]">
            DINOSPY
          </span>
          <div className="hidden md:flex items-center space-x-3 opacity-10 group-hover:opacity-40 transition-opacity duration-1000">
             <div className="w-8 h-[1px] bg-current" />
             <span className="font-mono text-[8px] tracking-[0.4em] uppercase font-black">HOROLOGICAL_VAULT</span>
             <div className="w-8 h-[1px] bg-current" />
          </div>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center space-x-6 md:space-x-10">
          <div className="hidden lg:flex items-center space-x-12 mr-8">
            {navLinks.map((link) => (
              <Link 
                key={link.label}
                to={link.to}
                className="font-mono text-[9px] tracking-[0.4em] opacity-40 hover:opacity-100 hover:text-luxury-gold transition-all duration-500 uppercase font-bold"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4 md:space-x-6">
            <button 
              onClick={() => user ? navigate('/profile') : setIsAuthModalOpen(true)}
              className="flex items-center"
            >
              <MagneticButton className="w-10 h-10 rounded-full border border-current/5 flex items-center justify-center hover:bg-current hover:text-white transition-all">
                <User size={16} strokeWidth={1.5} />
              </MagneticButton>
            </button>

            <Link to="/cart">
              <MagneticButton className="relative p-2 hover:text-luxury-gold transition-colors">
                <ShoppingBag size={20} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-current text-white text-[7px] flex items-center justify-center rounded-full font-black">
                    {cartCount}
                  </span>
                )}
              </MagneticButton>
            </Link>

            <button 
              className="lg:hidden p-2 text-charcoal"
              onClick={() => setIsMobileMenuOpen(true)}
            >
               <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[110] bg-ivory flex flex-col p-12 lg:hidden font-sans"
          >
            <div className="flex justify-between items-center mb-24">
              <span className="font-display text-2xl tracking-[0.5em] text-charcoal font-bold uppercase">DINOSPY</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-12 h-12 rounded-full border border-charcoal/5 flex items-center justify-center text-charcoal"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col space-y-10">
               {navLinks.map((link, i) => (
                 <motion.div
                   key={link.label}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.1 + i * 0.05 }}
                 >
                   <Link 
                     to={link.to}
                     onClick={() => setIsMobileMenuOpen(false)}
                     className="text-4xl sm:text-5xl font-display text-charcoal hover:text-luxury-gold transition-colors font-medium tracking-tightest uppercase"
                   >
                     {link.label}
                   </Link>
                 </motion.div>
               ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      user ? navigate('/profile') : setIsAuthModalOpen(true);
                    }}
                    className="text-4xl sm:text-5xl font-display text-charcoal hover:text-luxury-gold transition-colors font-medium tracking-tightest uppercase flex items-center text-left"
                  >
                    {user ? 'MY_IDENTITY' : 'AUTHENTICATE'} <User className="ml-4" size={32} strokeWidth={1} />
                  </button>
                </motion.div>
            </nav>

            <div className="mt-auto grid grid-cols-2 gap-12 py-16 border-t border-charcoal/5">
               <div className="space-y-4">
                 <span className="font-mono text-charcoal/30 text-[9px] tracking-[0.5em] font-black uppercase">GENEVA_LATENCY</span>
                 <span className="text-xl font-mono text-charcoal block font-bold">
                   {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}_CET
                 </span>
               </div>
               <div className="space-y-4">
                 <span className="font-mono text-charcoal/30 text-[9px] tracking-[0.5em] font-black uppercase">VAULT_ENCRYPTION</span>
                 <span className="text-xl font-mono text-emerald block font-bold tracking-widest">ACTIVE_256BIT</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
