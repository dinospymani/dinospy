import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { ShoppingBag, Search, Heart, User, Menu, X, Plus } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { MagneticButton } from './MagneticButton';

export default function Navbar() {
  const { user, setIsAuthModalOpen } = useAuth();
  const { cartCount } = useCart();
  const { scrollY } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navHeight = useTransform(scrollY, [0, 100], ['6rem', '4.5rem']);
  const navBg = useTransform(scrollY, [0, 100], ['rgba(10, 10, 10, 0)', 'rgba(10, 10, 10, 0.9)']);
  const navBlur = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(20px)']);
  const navBorder = useTransform(scrollY, [0, 100], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.05)']);

  const navLinks = [
    { to: "/explore", label: "COLLECTION" },
    { to: "/explore", label: "MECHANICAL" },
    { to: "/faq", label: "ARCHIVE" }
  ];

  return (
    <motion.nav 
      style={{ 
        height: navHeight,
        backgroundColor: navBg,
        backdropFilter: navBlur,
        borderBottomColor: navBorder
      }}
      className="fixed top-0 left-0 w-full z-[100] flex items-center border-b transition-all duration-700"
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Left: Search & Wishlist */}
        <div className="hidden lg:flex items-center space-x-8">
          <MagneticButton className="p-2 text-text/60 hover:text-gold transition-colors">
            <Search size={20} strokeWidth={1.5} />
          </MagneticButton>
          <Link to="/wishlist">
            <MagneticButton className="p-2 text-text/60 hover:text-gold transition-colors">
              <Heart size={20} strokeWidth={1.5} />
            </MagneticButton>
          </Link>
        </div>

        {/* Center: Logo */}
        <Link to="/" className="flex flex-col items-center group">
          <span className="font-display text-2xl md:text-3xl tracking-[0.6em] text-text font-black uppercase transition-all duration-700 group-hover:tracking-[0.8em]">
            DINOSPY
          </span>
          <div className="flex items-center space-x-2 opacity-20 group-hover:opacity-100 transition-opacity duration-700">
             <div className="w-8 h-[1px] bg-gold" />
             <span className="font-tech text-xs tracking-widest uppercase">HOROLOGY</span>
             <div className="w-8 h-[1px] bg-gold" />
          </div>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center space-x-6 md:space-x-10">
          <div className="hidden lg:flex items-center space-x-12 mr-12">
            {navLinks.map((link) => (
              <Link 
                key={link.label}
                to={link.to}
                className="font-tech text-[10px] tracking-[0.4em] text-text/40 hover:text-gold transition-all duration-500 uppercase link-hover"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-6">
            {user ? (
               <Link to="/profile">
                  <MagneticButton className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                    <User size={18} strokeWidth={1.5} />
                  </MagneticButton>
               </Link>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="hidden md:block font-tech text-[9px] tracking-[0.3em] font-black text-text/40 hover:text-gold transition-colors"
              >
                IDENTITY_VAULT
              </button>
            )}

            <Link to="/cart">
              <MagneticButton className="relative p-2 text-text hover:text-gold transition-colors">
                <ShoppingBag size={22} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-white text-[8px] flex items-center justify-center rounded-full font-black">
                    {cartCount}
                  </span>
                )}
              </MagneticButton>
            </Link>

            <button 
              className="lg:hidden p-2 text-text"
              onClick={() => setIsMobileMenuOpen(true)}
            >
               <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[110] bg-noir flex flex-col p-12 lg:hidden"
          >
            <div className="flex justify-between items-center mb-24">
              <span className="font-display text-xl tracking-[0.6em] text-text font-black uppercase">DINOSPY</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col space-y-12">
               {navLinks.map((link, i) => (
                 <motion.div
                   key={link.label}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 + i * 0.1 }}
                 >
                   <Link 
                     to={link.to}
                     onClick={() => setIsMobileMenuOpen(false)}
                     className="text-5xl font-display italic text-text hover:text-gold transition-colors"
                   >
                     {link.label}
                   </Link>
                 </motion.div>
               ))}
            </nav>

            <div className="mt-auto grid grid-cols-2 gap-8 py-12 border-t border-black/5">
               <div className="space-y-2">
                 <span className="font-tech text-text/30 text-[8px] tracking-widest uppercase">HOROLOGICAL_TIME</span>
                 <span className="text-xl font-tech text-text block uppercase">
                   {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}_UTC
                 </span>
               </div>
               <div className="space-y-2">
                 <span className="font-tech text-text/30 text-[8px] tracking-widest uppercase">VAULT_ENCRYPTION</span>
                 <span className="text-xl font-tech text-text block">L2_AES.512</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
