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
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
      <div className="glass px-8 py-5 rounded-[3rem] flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path.startsWith('/#') && location.hash === item.path.substring(1));
          return (
            <Link key={item.path} to={item.path} className="relative flex flex-col items-center text-center">
              <motion.div
                whileTap={{ scale: 0.8, y: -5 }}
                className={`transition-colors ${isActive ? 'text-gold' : 'text-white/40'}`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gold text-luxury-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-[2px] border-luxury-black shadow-lg">
                    {item.badge}
                  </span>
                )}
              </motion.div>
              <span className={`text-[8px] uppercase tracking-widest mt-1.5 font-bold ${isActive ? 'text-gold' : 'text-white/20'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-3 w-1 h-1 bg-gold rounded-full shadow-[0_0_10px_#D4AF37]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
