import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, User, ShieldCheck, Clock } from 'lucide-react';
import { db, useAuth } from '../context/AuthContext';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function SupportChat() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatData, setChatData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Listen to chat metadata (for unread status)
    const unsubChat = onSnapshot(doc(db, 'support_chats', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setChatData(docSnap.data());
      }
    });

    if (isOpen) {
      // Mark as read when opening
      setDoc(doc(db, 'support_chats', user.uid), {
        unreadByUser: false 
      }, { merge: true });

      const q = query(
        collection(db, 'support_chats', user.uid, 'messages'),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as any));
        // Robust sorting
        msgs.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.()?.getTime() || new Date(a.timestamp || 0).getTime();
          const timeB = b.timestamp?.toDate?.()?.getTime() || new Date(b.timestamp || 0).getTime();
          return timeA - timeB;
        });
        setMessages(msgs);
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }, (error) => {
        console.warn("Signal frequency interrupted:", error);
      });

      return () => {
        unsubscribe();
        unsubChat();
      };
    }

    return () => unsubChat();
  }, [user, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;

    const msgText = message.trim();
    setMessage('');
    setLoading(true);

    try {
      // Add message to sub-collection
      await addDoc(collection(db, 'support_chats', user.uid, 'messages'), {
        text: msgText,
        senderId: user.uid,
        senderName: profile?.displayName || user.email,
        timestamp: serverTimestamp(),
        isAdmin: false
      });

      // Update main chat doc for admin dashboard
      await setDoc(doc(db, 'support_chats', user.uid), {
        lastMessage: msgText,
        lastActive: serverTimestamp(),
        unreadByAdmin: true,
        userName: profile?.displayName || user.email,
        userEmail: user.email
      }, { merge: true });

    } catch (err) {
      console.error(err);
      toast.error('Failed to send signal.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-32 right-8 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[90vw] md:w-96 h-[600px] bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-black/5"
          >
            {/* Header */}
            <div className="p-8 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <ShieldCheck size={20} strokeWidth={1} />
                </div>
                <div>
                  <h3 className="font-display font-medium text-lg tracking-tight">Vault Support</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    <span className="font-mono text-[9px] tracking-widest uppercase opacity-60">System Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow p-8 overflow-y-auto space-y-6 bg-slate-50 no-scrollbar"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                  <MessageSquare size={48} strokeWidth={1} />
                  <p className="font-display italic text-lg px-8">How may our support team assist your journey today?</p>
                </div>
              )}
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] p-5 rounded-[2.5rem] text-sm leading-relaxed ${
                    msg.isAdmin 
                    ? 'bg-white border border-black/5 text-black' 
                    : 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xl shadow-indigo-600/20'
                  }`}>
                    <p>{msg.text}</p>
                    <div className={`flex items-center space-x-2 mt-2 opacity-30 ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                      <Clock size={10} />
                      <span className="text-[8px] font-mono uppercase">
                        {msg.timestamp ? (
                          msg.timestamp.toDate 
                            ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : 'SYNCING'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-black/5">
              <div className="relative">
                <input 
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Inquire here..."
                  className="w-full bg-neutral-50 border border-black/5 rounded-full py-5 px-8 pr-16 text-sm outline-none focus:border-black transition-all"
                />
                <button 
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-lg shadow-indigo-600/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-full flex items-center justify-center shadow-2xl relative group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageSquare size={24} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {chatData?.unreadByUser && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-4 border-white animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
