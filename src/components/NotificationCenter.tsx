import React, { useState, useEffect } from 'react';
import { Bell, X, Tag, Zap, Sparkles, Megaphone, Check, Shield, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/utils';

export default function NotificationCenter() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const path = 'notifications';
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      setNotifications(fetched);

      // Calculate unread
      const dismissedIds = profile?.dismissedNotifications || [];
      const visibleNotifications = fetched.filter(n => !dismissedIds.includes(n.id));
      
      if (profile?.lastReadNotification) {
        const lastRead = new Date(profile.lastReadNotification).getTime();
        const unread = visibleNotifications.filter(n => new Date(n.createdAt).getTime() > lastRead).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(visibleNotifications.length);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user, profile?.lastReadNotification]);

  const markAsRead = async () => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastReadNotification: new Date().toISOString()
      });
      setUnreadCount(0);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'offer':
      case 'promotion': return <Tag className="text-gold" size={16} />;
      case 'trending': return <Zap className="text-orange-500" size={16} />;
      case 'new_arrival': return <Sparkles className="text-blue-400" size={16} />;
      case 'order': return <ShoppingBag className="text-green-400" size={16} />;
      case 'security': return <Shield className="text-red-400" size={16} />;
      default: return <Megaphone className="text-white/40" size={16} />;
    }
  };

  const getBadge = (type: string) => {
    const config: Record<string, { label: string, color: string }> = {
      offer: { label: 'Promotion', color: 'bg-gold/10 text-gold border-gold/20' },
      promotion: { label: 'Promotion', color: 'bg-gold/10 text-gold border-gold/20' },
      trending: { label: 'Trending', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
      new_arrival: { label: 'New Arrival', color: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
      order: { label: 'Order Update', color: 'bg-green-400/10 text-green-400 border-green-400/20' },
      security: { label: 'Security', color: 'bg-red-400/10 text-red-400 border-red-400/20' },
      general: { label: 'Update', color: 'bg-white/5 text-white/40 border-white/10' }
    };
    const { label, color } = config[type] || config.general;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${color}`}>
        {label}
      </span>
    );
  };

  const filteredNotifications = notifications.filter(n => 
    !profile?.dismissedNotifications?.includes(n.id)
  );

  if (!user) return null;

  const handleDismiss = async (notificationId: string) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const currentDismissed = profile?.dismissedNotifications || [];
      if (!currentDismissed.includes(notificationId)) {
        await updateDoc(userRef, {
          dismissedNotifications: [...currentDismissed, notificationId]
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const markAllAsDismissed = async () => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const allIds = notifications.map(n => n.id);
      const currentDismissed = profile?.dismissedNotifications || [];
      const newDismissed = Array.from(new Set([...currentDismissed, ...allIds]));
      
      await updateDoc(userRef, {
        dismissedNotifications: newDismissed,
        lastReadNotification: new Date().toISOString()
      });
      setUnreadCount(0);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAsRead();
        }}
        className="relative p-2 text-white/60 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-gold text-luxury-black text-[10px] font-black rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-[350px] glass border border-white/5 rounded-3xl p-6 z-50 shadow-2xl overflow-hidden"
              style={{ maxHeight: '500px' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">Broadcasting System</h3>
                  {filteredNotifications.length > 0 && (
                    <button 
                      onClick={markAllAsDismissed}
                      className="text-[9px] uppercase tracking-widest text-gold/60 hover:text-gold font-bold"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {filteredNotifications.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 text-center"
                    >
                      <Bell className="mx-auto text-white/5 mb-4" size={40} />
                      <p className="text-[10px] uppercase tracking-widest text-white/20">No active transmissions</p>
                    </motion.div>
                  ) : (
                    filteredNotifications.map((n, index) => (
                      <motion.div 
                        key={n.id} 
                        initial={{ opacity: 0, x: -10, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ 
                          delay: index * 0.05, 
                          duration: 0.5, 
                          ease: [0.22, 1, 0.36, 1] 
                        }}
                        onClick={() => !n.link && handleDismiss(n.id)}
                        className={`group relative glass p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all ${!n.link ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="mt-1 p-2 bg-white/5 rounded-lg">
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-xs font-bold uppercase tracking-tight text-white/90">{n.title}</h4>
                              {getBadge(n.type)}
                            </div>
                            <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">{n.message}</p>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-[8px] font-mono text-white/20">
                                {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                              <div className="flex items-center space-x-4">
                                {n.link ? (
                                  <Link 
                                    to={n.link} 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsOpen(false);
                                      handleDismiss(n.id);
                                    }}
                                    className="text-[9px] uppercase tracking-widest text-gold hover:underline"
                                  >
                                    View Entry
                                  </Link>
                                ) : (
                                  <span className="text-[9px] uppercase tracking-widest text-white/10 group-hover:text-gold transition-colors font-bold">
                                    Mark Read
                                  </span>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismiss(n.id);
                                  }}
                                  className="text-[9px] uppercase tracking-widest text-white/20 hover:text-white"
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
