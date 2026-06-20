import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Search, Heart, ShoppingCart, User, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const FloatingBottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, path: '/', label: 'HOME' },
    { icon: Search, path: '/explore', label: 'EXPLORE' },
    { icon: Heart, path: '/wishlist', label: 'WISHES' },
    { icon: ShoppingCart, path: '/cart', label: 'VAULT' },
    { icon: User, path: '/profile', label: 'IDENTITY' },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[45] md:hidden w-[90%] max-w-sm">
      <div className="glass px-6 py-4 rounded-[2rem] luxury-shadow flex items-center justify-between border-white/40">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="relative group">
              <motion.div
                animate={{ 
                  scale: isActive ? 1.2 : 1,
                  y: isActive ? -4 : 0
                }}
                className={`p-2 rounded-xl transition-colors ${isActive ? 'text-gold' : 'text-text/40'}`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
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
};
