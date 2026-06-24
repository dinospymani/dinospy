import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Search, Heart, ShoppingCart, User, Menu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const FloatingBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setIsAuthModalOpen } = useAuth();
  
  const navItems = [
    { icon: Home, path: '/', label: 'HOME' },
    { icon: Search, path: '/explore', label: 'EXPLORE' },
    { icon: Heart, path: '/wishlist', label: 'WISHES' },
    { icon: ShoppingCart, path: '/cart', label: 'VAULT' },
    { icon: User, path: '/profile', label: 'IDENTITY', auth: true },
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-[45] md:hidden w-full px-4 sm:px-6 max-w-md pb-[env(safe-area-inset-bottom)]">
      <div className="bg-black py-4 sm:py-5 px-6 sm:px-8 rounded-full shadow-2xl flex items-center justify-between border border-white/10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          const handleClick = (e: React.MouseEvent) => {
            if (item.auth && !user) {
              e.preventDefault();
              setIsAuthModalOpen(true);
            }
          };

          return (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={handleClick}
              className="relative group"
            >
              <motion.div
                animate={{ 
                  scale: isActive ? 1.2 : 1,
                  y: isActive ? -4 : 0
                }}
                className={`p-2 rounded-xl transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              </motion.div>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
