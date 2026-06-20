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
  const navBg = useTransform(scrollY, [0, 100], ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)']);
  const navBlur = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(20px)']);
  const navBorder = useTransform(scrollY, [0, 100], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.05)']);

  const navLinks = [
    { to: "/explore", label: "COLLECTIONS" },
    { to: "/explore", label: "SHOP" },
    { to: "/explore", label: "LIMITED EDITION" },
    { to: "/about", label: "ABOUT" }
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
          <MagneticButton className="p-2 text-black/60 hover:text-black transition-colors">
            <Search size={20} strokeWidth={1} />
          </MagneticButton>
          <Link to="/wishlist">
            <MagneticButton className="p-2 text-black/60 hover:text-black transition-colors">
              <Heart size={20} strokeWidth={1} />
            </MagneticButton>
          </Link>
        </div>

        {/* Center: Logo */}
        <Link to="/" className="flex flex-col items-center group">
          <span className="font-display text-2xl md:text-3xl tracking-[0.4em] text-black font-semibold uppercase transition-all duration-700 group-hover:tracking-[0.6em]">
            DINOSPY
          </span>
          <div className="flex items-center space-x-2 opacity-10 group-hover:opacity-30 transition-opacity duration-700">
             <div className="w-8 h-[1px] bg-black" />
             <span className="font-mono text-[9px] tracking-widest uppercase">SWISS MADE</span>
             <div className="w-8 h-[1px] bg-black" />
          </div>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center space-x-6 md:space-x-10">
          <div className="hidden lg:flex items-center space-x-12 mr-8">
            {navLinks.map((link) => (
              <Link 
                key={link.label}
                to={link.to}
                className="font-mono text-[9px] tracking-widest text-black/40 hover:text-black transition-all duration-500 uppercase font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4 md:space-x-6">
            {user ? (
               <Link to="/profile">
                  <MagneticButton className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                    <User size={18} strokeWidth={1} />
                  </MagneticButton>
               </Link>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="hidden md:block font-mono text-[9px] tracking-widest font-bold text-black/40 hover:text-black transition-colors"
              >
                AUTHENTICATE
              </button>
            )}

            <Link to="/cart">
              <MagneticButton className="relative p-2 text-black hover:text-neutral-600 transition-colors">
                <ShoppingBag size={22} strokeWidth={1} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[8px] flex items-center justify-center rounded-full font-bold">
                    {cartCount}
                  </span>
                )}
              </MagneticButton>
            </Link>

            <button 
              className="lg:hidden p-2 text-black"
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[110] bg-white flex flex-col p-8 lg:hidden"
          >
            <div className="flex justify-between items-center mb-16">
              <span className="font-display text-xl tracking-[0.4em] text-black font-bold uppercase">DINOSPY</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col space-y-8">
               {navLinks.map((link, i) => (
                 <motion.div
                   key={link.label}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.2 + i * 0.1 }}
                 >
                   <Link 
                     to={link.to}
                     onClick={() => setIsMobileMenuOpen(false)}
                     className="text-4xl font-display text-black hover:text-neutral-500 transition-colors font-light"
                   >
                     {link.label}
                   </Link>
                 </motion.div>
               ))}
            </nav>

            <div className="mt-auto grid grid-cols-2 gap-8 py-12 border-t border-black/5 uppercase">
               <div className="space-y-2">
                 <span className="font-mono text-black/30 text-[8px] tracking-widest ">GENEVA_TIME</span>
                 <span className="text-lg font-mono text-black block">
                   {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}_CET
                 </span>
               </div>
               <div className="space-y-2">
                 <span className="font-mono text-black/30 text-[8px] tracking-widest">AUTHENTICITY</span>
                 <span className="text-lg font-mono text-black block">VERIFIED</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
