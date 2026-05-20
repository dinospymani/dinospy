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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
             {unreadCount > 0 && <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />}
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="md:hidden fixed inset-0 z-[60] glass backdrop-blur-3xl flex flex-col pt-32 px-10 pb-20 overflow-hidden"
          >
            <div className="absolute top-8 right-8">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-4 glass rounded-full border border-white/10"
              >
                <X size={28} />
              </button>
            </div>

            <div className="space-y-12 mb-auto">
              {[
                { label: 'Curated Collection', path: '/' },
                { label: 'New Acquisitions', path: '/#new' },
                { label: 'Exhibition Hall', path: '/#categories' },
                { label: 'Direct Support', path: '/support' }
              ].map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link 
                    to={item.path} 
                    onClick={() => setIsOpen(false)}
                    className="text-4xl font-display uppercase tracking-widest hover:text-gold transition-colors block"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              {profile?.role === 'admin' && (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link 
                    to="/admin" 
                    onClick={() => setIsOpen(false)}
                    className="text-4xl font-display uppercase tracking-widest text-gold/60 block"
                  >
                    Command Center
                  </Link>
                </motion.div>
              )}
            </div>

            <div className="pt-12 border-t border-white/5 flex flex-col space-y-8">
              <div className="flex justify-between items-center text-white/40 uppercase tracking-[0.3em] text-[10px] font-black">
                <span>Account Sync</span>
                <span>Enforced Security</span>
              </div>
              {!user ? (
                <button 
                  onClick={() => {
                    signInWithGoogle();
                    setIsOpen(false);
                  }}
                  className="w-full py-6 gold-gradient text-luxury-black font-black uppercase tracking-[0.2em] rounded-3xl text-sm shadow-[0_20px_40px_rgba(212,175,55,0.2)]"
                >
                  Establish Connection
                </button>
              ) : (
                <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                        <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{user.displayName}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Verified Member</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => {
                       signOut();
                       setIsOpen(false);
                     }}
                     className="p-3 glass rounded-xl text-red-500/60 hover:text-red-500 transition-colors"
                   >
                     <ShoppingBag size={20} className="rotate-45" /> {/* Use as close icon alternative */}
                   </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
