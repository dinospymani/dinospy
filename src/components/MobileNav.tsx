import React from 'react';
import { motion } from 'motion/react';
import { Home, Heart, ShoppingBag, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function MobileNav() {
  const location = useLocation();
  const { cartCount } = useCart();

  const navItems = [
    { icon: Home, path: '/', label: 'CORE' },
    { icon: Heart, path: '/wishlist', label: 'SAVED' },
    { icon: ShoppingBag, path: '/cart', label: 'CART', badge: cartCount },
    { icon: User, path: '/profile', label: 'USER' },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-6">
      <div className="bg-white/70 backdrop-blur-3xl px-10 py-6 rounded-[3rem] flex justify-between items-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] border border-black/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className="relative flex flex-col items-center group/item transition-all"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`flex flex-col items-center transition-all duration-700 ${isActive ? 'text-black' : 'text-black/20'}`}
              >
                <div className="relative">
                  <item.icon size={20} strokeWidth={isActive ? 2 : 1.2} className="transition-all duration-700" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-3 bg-black text-white text-[7px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-2xl border border-white/20"
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </div>
                <span className={`text-[8px] font-tech font-black tracking-[0.2em] mt-3 transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-0 scale-75'}`}>
                  {item.label}
                </span>
              </motion.div>
              
              {isActive && (
                <motion.div
                  layoutId="mobileNavActive"
                  className="absolute -bottom-2 w-1.5 h-1.5 bg-black rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
