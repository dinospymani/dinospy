import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Heart, User, ShoppingBag, ShieldCheck, Palette, Monitor, History, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, profile, setIsAuthModalOpen } = useAuth();
  const { cartCount } = useCart();
  const { scrollY } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Decorative scroll reactive values
  const navPadding = useTransform(scrollY, [0, 100], ['3rem', '1.5rem']);
  const navBlur = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(40px)']);
  const navBg = useTransform(scrollY, [0, 100], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)']);

  return (
    <motion.nav 
      style={{ 
        paddingTop: navPadding, 
        paddingBottom: navPadding,
        backgroundColor: navBg,
        backdropFilter: navBlur
      }}
      className="fixed top-0 left-0 w-full z-[100] transition-all duration-1000 border-b border-black/0 hover:border-black/5"
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-6 group">
            <div className="w-10 h-10 border border-black/20 flex items-center justify-center p-1 relative overflow-hidden group-hover:border-black transition-colors duration-1000">
               <motion.div 
                 animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                 className="w-full h-full border border-black/5 border-t-black/60 rounded-full" 
               />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-1 bg-black rounded-full animate-pulse" />
               </div>
            </div>
            <div className="flex flex-col">
               <span className="font-tech text-black text-sm tracking-[1em] group-hover:tracking-[1.2em] transition-all duration-1000">DINOSPY.</span>
               <span className="font-tech text-[6px] text-black/20 tracking-tighter">EST_2026 // MONOLITH_V3</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center space-x-24">
            {[
              { to: "/explore", label: "REFERENCE_INDEX" },
              { to: "/wishlist", label: "SAVED_ARTIFACTS" },
              { to: "/explore", label: "MECHANICAL_CORE" }
            ].map((link) => (
              <Link 
                key={link.label}
                to={link.to} 
                className="font-tech text-[10px] text-black/40 hover:text-black transition-all duration-1000 hover:tracking-[0.6em] relative group/link"
              >
                {link.label}
                <div className="absolute -bottom-4 left-0 w-0 h-[1px] bg-black group-hover:w-full transition-all duration-1000" />
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-12">
            <div className="hidden md:flex flex-col items-end mr-8 opacity-20 hover:opacity-100 transition-opacity duration-1000">
               <span className="font-tech text-[7px] tracking-widest">SYSTEM_STABLE</span>
               <span className="font-tech text-[7px] text-black/60">SECURE_TRANSIT_ON</span>
            </div>

            {user ? (
               <Link to="/profile" className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center transition-all duration-1000 hover:bg-black hover:text-white">
                  <User size={14} strokeWidth={1} />
               </Link>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="font-tech text-[8px] text-black/40 border border-black/10 px-10 py-4 transition-all duration-1000 hover:bg-black hover:text-white tracking-[0.5em]"
              >
                AUTH_L1
              </button>
            )}

            <Link to="/cart" className="flex items-center space-x-4 group/cart">
               <div className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center group-hover/cart:bg-black group-hover/cart:text-white transition-all duration-1000 relative">
                  <ShoppingBag size={14} strokeWidth={1} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[9px] font-tech flex items-center justify-center rounded-full">
                       {cartCount}
                    </span>
                  )}
               </div>
            </Link>

            <button 
              className="lg:hidden w-12 h-12 flex items-center justify-center border border-black/10 rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={16} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[200] bg-white flex flex-col p-12"
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
               <div className="grid grid-cols-12 h-full">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="border-r border-black h-full" />
                  ))}
               </div>
            </div>

            <div className="flex items-center justify-between mb-24 relative z-10">
               <div className="flex flex-col">
                  <span className="font-tech text-black text-sm tracking-[1em]">DINOSPY.</span>
                  <span className="font-tech text-[6px] text-black/20 tracking-tighter">MOBILE_TERMINAL_V3</span>
               </div>
               <button 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className="w-16 h-16 flex items-center justify-center border border-black/10 rounded-full bg-white shadow-xl active:scale-90 transition-transform"
               >
                 <X size={24} strokeWidth={1} />
               </button>
            </div>

            <nav className="flex flex-col space-y-12 relative z-10">
               {[
                 { to: "/explore", label: "REFERENCE_INDEX" },
                 { to: "/wishlist", label: "SAVED_ARTIFACTS" },
                 { to: "/explore", label: "MECHANICAL_CORE" },
                 { to: "/profile", label: "USER_PROTOCOL" }
               ].map((item, i) => (
                 <motion.div
                   key={item.label}
                   initial={{ opacity: 0, x: -40 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.2 + (i * 0.1), duration: 0.8, ease: "easeOut" }}
                 >
                   <Link 
                     to={item.to} 
                     className="block group"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     <div className="flex flex-col">
                        <span className="text-[10px] font-tech text-black/20 tracking-[0.5em] mb-4">0{i+1}__{item.label}</span>
                        <span className="text-5xl font-display italic text-black leading-none group-active:translate-x-4 transition-transform duration-500">
                          {item.label.split('_')[0]} <span className="opacity-10">{item.label.split('_')[1] || ''}</span>
                        </span>
                     </div>
                   </Link>
                 </motion.div>
               ))}
            </nav>

            <div className="mt-auto relative z-10 space-y-10">
               <div className="grid grid-cols-2 gap-8 pt-12 border-t border-black/5">
                  <div className="space-y-2">
                     <span className="font-tech text-[8px] text-black/20 tracking-widest block">SYSTEM_AUTH</span>
                     <span className="font-tech text-[10px] text-black font-black">L3_ENCRYPTED</span>
                  </div>
                  <div className="space-y-2">
                     <span className="font-tech text-[8px] text-black/20 tracking-widest block">TIME_SYNC</span>
                     <span className="font-tech text-[10px] text-black font-black uppercase">{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}_UTC</span>
                  </div>
               </div>
               
               <button 
                 onClick={() => {
                   setIsMobileMenuOpen(false);
                   setIsAuthModalOpen(true);
                 }}
                 className="w-full py-6 bg-black text-white font-tech text-[10px] tracking-[0.5em] rounded-full shadow-2xl active:scale-95 transition-all"
               >
                 IDENT_AUTHORIZATION
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
