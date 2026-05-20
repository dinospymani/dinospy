import React from 'react';
import { motion } from 'motion/react';
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function MobileNav() {
  const location = useLocation();
  const { cartCount } = useCart();

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Search, path: '/#categories', label: 'Explore' },
    { icon: Heart, path: '/wishlist', label: 'Wish' },
    { icon: ShoppingBag, path: '/cart', label: 'Cart', badge: cartCount },
    { icon: User, path: '/profile', label: 'Me' },
  ];

  return (
    <div className="md:hidden fixed bottom-8 left-8 right-8 z-50">
      <div className="glass px-10 py-6 rounded-[3.5rem] flex justify-between items-center shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/5 backdrop-blur-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gold/5 to-transparent pointer-events-none" />
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path.startsWith('/#') && location.hash === item.path.substring(1));
          return (
            <Link key={item.path} to={item.path} className="relative flex flex-col items-center transition-all">
              <motion.div
                whileTap={{ scale: 0.8 }}
                className={`transition-all duration-500 ${isActive ? 'text-gold scale-110' : 'text-white/30'}`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg transform scale-110">
                    {item.badge}
                  </span>
                )}
              </motion.div>
              <span className={`text-[7px] uppercase tracking-[0.2em] mt-2 font-black transition-all duration-500 ${isActive ? 'text-gold opacity-100' : 'text-white/0 opacity-0'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute -top-10 w-20 h-20 bg-gold/10 rounded-full blur-2xl pointer-events-none"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
