import React from 'react';
import { motion } from 'motion/react';
import { Home, Heart, ShoppingBag, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function MobileNav() {
  const location = useLocation();
  const { cartCount } = useCart();

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Heart, path: '/wishlist', label: 'Wish' },
    { icon: ShoppingBag, path: '/cart', label: 'Cart', badge: cartCount },
    { icon: User, path: '/profile', label: 'Me' },
  ];

  return (
    <div className="md:hidden fixed bottom-1 left-0 right-0 z-50 px-2 pb-6">
      <div className="glass px-8 py-5 rounded-[2.5rem] flex justify-between items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-black/5 backdrop-blur-3xl relative overflow-hidden bg-white/80">
        <div className="absolute inset-0 bg-gradient-to-t from-black/[0.02] to-transparent pointer-events-none" />
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path.startsWith('/#') && location.hash === item.path.substring(1));
          return (
            <Link key={item.path} to={item.path} className="relative flex flex-col items-center transition-all px-2">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`transition-all duration-300 ${isActive ? 'text-gold' : 'text-text/40'}`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-gold text-bg text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-lg">
                    {item.badge}
                  </span>
                )}
              </motion.div>
              <span className={`text-[7px] uppercase tracking-[0.1em] mt-1.5 font-bold transition-all duration-300 ${isActive ? 'text-gold opacity-100' : 'text-text/30 opacity-100'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-black/5 rounded-full blur-xl pointer-events-none"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
