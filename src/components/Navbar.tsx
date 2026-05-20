import React from 'react';
import { ShoppingCart, Heart, User, Menu, Search, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import { db } from '../context/AuthContext';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const { user, profile, signInWithGoogle, signOut } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

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
            <Link to="/#categories" className="text-sm font-medium hover:text-gold transition-colors">Categories</Link>
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
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-white/40 text-xs">No active intel.</div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              className={`p-4 border-b border-white/5 transition-colors cursor-pointer hover:bg-white/5 ${!n.read ? 'bg-gold/5' : ''}`}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) navigate(n.link);
                                setShowNotifications(false);
                              }}
                            >
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">{n.title}</p>
                              <p className="text-xs text-white/40 leading-relaxed">{n.message}</p>
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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
             {unreadCount > 0 && <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />}
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              <Link to="/" className="block text-lg font-medium py-2">Home</Link>
              <Link to="/#new" className="block text-lg font-medium py-2">New Arrivals</Link>
              <Link to="/#categories" className="block text-lg font-medium py-2">Categories</Link>
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex space-x-6">
                  <Heart size={22} />
                  <ShoppingCart size={22} />
                  <User size={22} />
                </div>
                {!user && (
                    <button 
                      onClick={() => signInWithGoogle()}
                      className="px-6 py-2 bg-gold text-luxury-black font-bold rounded-full text-sm"
                    >
                      Sign In
                    </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
