import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, User, ShoppingBag, ShieldCheck, Palette, Monitor, History } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import NotificationCenter from './NotificationCenter';
import { HorologicalTheme } from '../types';

export default function Navbar() {
  const { user, profile, setIsAuthModalOpen } = useAuth();
  const { cartCount } = useCart();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isCheckingSecurity, setIsCheckingSecurity] = React.useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = React.useState(false);

  const themes: { id: HorologicalTheme; label: string; icon: any }[] = [
    { id: 'noir', label: 'Noir', icon: Palette },
    { id: 'titanium', label: 'Titanium', icon: Monitor },
    { id: 'heritage', label: 'Heritage', icon: History }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsCheckingSecurity(true);
      setTimeout(() => setIsCheckingSecurity(false), 2000);
    }, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-50 glass border border-text/5 h-20 px-8 flex items-center justify-between min-w-[320px] md:min-w-[800px] xl:min-w-[1200px] rounded-[100px] transition-all duration-700 hover:border-text/20">
      <div className="flex items-center space-x-12">
        <Link to="/" className="group flex items-center space-x-4">
          <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center p-1.5 overflow-hidden">
             <div className="w-full h-full bg-gold rounded-full" />
          </div>
          <span className="font-tech text-xs tracking-[0.8em] text-text font-bold uppercase transition-all duration-700 group-hover:text-gold group-hover:tracking-[1em]">DINOSPY</span>
        </Link>
      </div>

      <div className="hidden lg:flex items-center space-x-16">
        {[
          { to: "/explore", label: "ARCHIVE_REFERENCE" },
          { to: "/wishlist", label: "SAVED_SEQUENCES" },
          { to: "/#philosophy", label: "MANIFESTO_LOGS" }
        ].map((link) => (
          <Link 
            key={link.label}
            to={link.to} 
            className="font-tech text-[8px] font-bold text-text/30 hover:text-text transition-all duration-700 hover:tracking-[0.5em]"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center space-x-12">
        {user ? (
           <Link to="/profile" className="flex items-center space-x-3 group">
             <span className="font-tech text-[8px] text-text/30 group-hover:text-gold transition-colors font-bold uppercase tracking-widest">{profile?.username || 'AUTHORIZED_ENTITY'}</span>
             <User size={16} strokeWidth={1} className="text-text/30 group-hover:text-gold transition-colors" />
           </Link>
        ) : (
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="font-tech text-[8px] font-bold text-gold hover:text-white transition-all duration-700 uppercase tracking-widest"
          >
            ESTABLISH_CONNECTION
          </button>
        )}
        
        <Link to="/cart" className="relative group flex items-center">
          <ShoppingBag size={18} strokeWidth={1} className="text-text/30 group-hover:text-gold transition-colors" />
          {cartCount > 0 && (
            <span className="ml-2 font-tech text-[10px] text-gold">{cartCount}</span>
          )}
        </Link>
      </div>
    </nav>
  );
}
