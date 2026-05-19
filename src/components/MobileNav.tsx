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
    { icon: Search, path: '/search', label: 'Explore' },
    { icon: Heart, path: '/wishlist', label: 'Wish' },
    { icon: ShoppingBag, path: '/cart', label: 'Cart', badge: cartCount },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
      <div className="glass px-6 py-4 rounded-[2.5rem] flex justify-between items-center shadow-2xl border border-white/20">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="relative">
              <motion.div
                whileTap={{ scale: 0.8 }}
                className={`p-2 rounded-full transition-colors ${isActive ? 'text-gold' : 'text-white/50'}`}
              >
                <item.icon size={24} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-luxury-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-luxury-black">
                    {item.badge}
                  </span>
                )}
              </motion.div>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
