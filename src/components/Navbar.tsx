import React from 'react';
import { ShoppingCart, Heart, User, Menu, Search, X, Bell, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import { db } from '../context/AuthContext';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

export default function Navbar() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const { user, profile, signInWithGoogle, signOut } = useAuth();
  const { cartCount } = useCart();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [mobileSearchTerm, setMobileSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (showSearch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSearch]);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchTerm.trim()) {
      navigate(`/explore?search=${encodeURIComponent(mobileSearchTerm)}`);
      setShowSearch(false);
    }
  };


  React.useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-display font-bold gold-text tracking-widest">DINOSPY</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium hover:text-gold transition-colors">Home</Link>
            <Link to="/#new" className="text-sm font-medium hover:text-gold transition-colors">New Arrivals</Link>
            <Link to="/#philosophy" className="text-sm font-medium hover:text-gold transition-colors">Philosophy</Link>
            <Link to="/explore" className="text-sm font-medium hover:text-gold transition-colors text-gold/60">Collection</Link>
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium text-gold/80 hover:text-gold">Admin</Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <button className="p-2 hover:text-gold transition-colors">
              <Search size={20} />
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:text-gold transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Intelligence Feed</span>
                        {unreadCount > 0 && <span className="text-[10px] text-white/40">{unreadCount} New</span>}
                      </div>
                      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-12 text-center">
                            <div className="w-12 h-12 glass rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                              <Bell size={20} className="text-white/20" />
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Zero Intelligence Reports</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              className={`p-6 border-b border-white/5 transition-all cursor-pointer hover:bg-white/5 group ${!n.read ? 'bg-gold/[0.03]' : ''}`}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) navigate(n.link);
                                setShowNotifications(false);
                              }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gold/60">{n.type?.replace('_', ' ') || 'Report'}</span>
                                {!n.read && <div className="w-1.5 h-1.5 bg-gold rounded-full shadow-[0_0_8px_#D4AF37]" />}
                              </div>
                              <p className="text-xs font-bold text-white/90 mb-1 group-hover:text-gold transition-colors">{n.title}</p>
                              <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <Link to="/wishlist" className="p-2 hover:text-gold transition-colors">
              <Heart size={20} />
            </Link>
            <Link to="/cart" className="p-2 hover:text-gold transition-colors relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-gold text-luxury-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="p-2 hover:text-gold transition-colors">
                  <User size={20} />
                </Link>
                <button 
                  onClick={() => {
                    signOut();
                    toast.info('Session Terminated. Returning to guest access.');
                  }}
                  className="text-xs uppercase tracking-wider font-bold hover:text-gold transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signInWithGoogle()}
                className="px-6 py-2 bg-gold text-luxury-black font-bold rounded-full text-sm hover:scale-105 transition-transform active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Search Trigger */}
          <div className="md:hidden flex items-center space-x-2">
            <button 
              onClick={() => setShowSearch(true)}
              className="p-2 hover:text-gold transition-colors"
            >
              <Search size={22} />
            </button>
            <Link to="/cart" className="p-2 hover:text-gold transition-colors relative">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-gold text-luxury-black text-[8px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] glass backdrop-blur-3xl p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-display gold-text font-bold tracking-widest">SEARCH VAULT</span>
              <button 
                onClick={() => setShowSearch(false)}
                className="p-3 glass rounded-full border border-white/10"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSearch} className="relative mb-12">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Search collection..."
                value={mobileSearchTerm}
                onChange={(e) => setMobileSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-2xl pl-16 pr-6 py-6 focus:border-gold outline-none text-xl transition-all font-display"
              />
            </form>

            <div className="space-y-6">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Trending Searches</p>
              {['Gold Precision', 'Heritage', 'Automatic', 'Limited Edition'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setMobileSearchTerm(tag);
                    navigate(`/explore?search=${encodeURIComponent(tag)}`);
                    setShowSearch(false);
                  }}
                  className="flex items-center space-x-4 w-full group p-2 rounded-xl hover:bg-white/5 transition-all text-left"
                >
                  <div className="w-10 h-10 glass rounded-lg flex items-center justify-center group-hover:bg-gold/10 transition-all">
                    <Search size={14} className="text-white/20 group-hover:text-gold" />
                  </div>
                  <span className="text-sm font-medium text-white/60 group-hover:text-white">{tag}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
