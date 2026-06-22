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
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketIssue, setTicketIssue] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setTicketEmail(user.email || '');
    }
  }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmail.trim() || !ticketIssue.trim()) return;

    setIsSubmittingTicket(true);
    try {
      const chatRef = user ? user.uid : `guest_${Date.now()}`;
      
      await setDoc(doc(db, 'support_chats', chatRef), {
        userName: user?.displayName || 'Guest Collector',
        userEmail: ticketEmail,
        lastMessage: ticketIssue,
        lastActive: serverTimestamp(),
        unreadByAdmin: true,
        isTicket: true,
        status: 'open'
      }, { merge: true });

      await addDoc(collection(db, 'support_chats', chatRef, 'messages'), {
        text: `SYSTEM_AUTO_TICKET: ${ticketIssue}`,
        senderId: user ? user.uid : 'guest',
        senderName: ticketEmail,
        timestamp: serverTimestamp(),
        isAdmin: false
      });

      toast.success('High-Priority Vault Ticket created.');
      setShowTicketForm(false);
      setTicketIssue('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to register ticket.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  useEffect(() => {
    const handleOpenSupport = (e: any) => {
      setIsOpen(true);
      if (e.detail?.message) {
        setMessage(e.detail.message);
        if (e.detail.isTicket && user) {
           setDoc(doc(db, 'support_chats', user.uid), { 
             isTicket: true,
             updatedAt: serverTimestamp() 
           }, { merge: true });
        }
      }
    };
    window.addEventListener('openSupport', handleOpenSupport);
    return () => window.removeEventListener('openSupport', handleOpenSupport);
  }, [user]);

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
      const userMsgRef = await addDoc(collection(db, 'support_chats', user.uid, 'messages'), {
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

      // Call AI Support API
      console.log(">>> [SUPPORT_CHAT] Calling AI API with messages:", messages.length + 1);
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { text: msgText, senderId: user.uid }],
          userProfile: profile
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(">>> [SUPPORT_CHAT] API Error Response:", response.status, errText);
        throw new Error(`Signal frequency interrupted: ${response.status}`);
      }

      const aiData = await response.json();
      console.log(">>> [SUPPORT_CHAT] AI Data Received:", !!aiData.text);
      if (aiData.text) {
        const isTicketRequired = aiData.text.includes('[TICKET_REQUIRED]');
        const cleanText = aiData.text.replace('[TICKET_REQUIRED]', '').trim();

        if (isTicketRequired) {
          setShowTicketForm(true);
          setTicketIssue(msgText); // Pre-fill with the unresolved issue
        }

        // Add AI response to sub-collection
        await addDoc(collection(db, 'support_chats', user.uid, 'messages'), {
          text: cleanText,
          senderId: 'ai_assistant',
          senderName: 'Vault AI',
          timestamp: serverTimestamp(),
          isAdmin: true // Mark as admin so it shows on left
        });

        // Update main chat doc
        await setDoc(doc(db, 'support_chats', user.uid), {
          lastMessage: cleanText,
          lastActive: serverTimestamp(),
          unreadByUser: true,
          isTicket: isTicketRequired ? true : chatData?.isTicket || false
        }, { merge: true });
      }

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
            <div className="p-8 bg-slate-950 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-600/5 -skew-y-12 translate-y-8" />
              <div className="flex items-center space-x-5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
                  <ShieldCheck size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-display italic text-xl tracking-tight leading-none mb-1">Vault Support</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    <span className="font-tech text-[8px] tracking-[0.4em] uppercase opacity-40 font-black">Link Established</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors relative z-10 border border-white/5"
              >
                <X size={20} strokeWidth={1} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow p-8 overflow-y-auto space-y-8 bg-neutral-50/50 no-scrollbar relative"
            >
              {showTicketForm && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-x-8 top-8 bottom-8 bg-white/95 backdrop-blur-xl z-20 rounded-[2.5rem] border border-black/5 p-8 flex flex-col justify-center space-y-6 shadow-2xl"
                >
                   <div className="text-center space-y-4 mb-4">
                      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                         <ShieldCheck size={32} strokeWidth={1} />
                      </div>
                      <h4 className="font-display italic text-2xl">Escalate to Vault Support</h4>
                      <p className="text-[10px] font-tech text-black/40 uppercase tracking-widest leading-relaxed">The AI requires human expertise. Please verify your details to initiate a high-priority ticket.</p>
                   </div>
                   
                   <form onSubmit={handleCreateTicket} className="space-y-4">
                      <div className="space-y-2">
                        <label className="font-tech text-black/40 text-[8px] tracking-widest uppercase ml-4">Communication_Protocol (Email)</label>
                        <input 
                          type="email" 
                          required
                          value={ticketEmail}
                          onChange={e => setTicketEmail(e.target.value)}
                          className="w-full bg-neutral-100 border border-black/5 rounded-full px-6 py-4 text-xs outline-none focus:border-black transition-all"
                          placeholder="collector@archive.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-tech text-black/40 text-[8px] tracking-widest uppercase ml-4">Issue_Detail</label>
                        <textarea 
                          required
                          value={ticketIssue}
                          onChange={e => setTicketIssue(e.target.value)}
                          className="w-full bg-neutral-100 border border-black/5 rounded-[1.5rem] px-6 py-4 text-xs outline-none focus:border-black transition-all h-32 resize-none"
                          placeholder="Describe the anomaly..."
                        />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button 
                          type="button" 
                          onClick={() => setShowTicketForm(false)}
                          className="flex-1 py-4 bg-neutral-100 text-black/40 font-tech text-[10px] tracking-widest font-black uppercase rounded-full hover:bg-neutral-200 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={isSubmittingTicket}
                          className="flex-[2] py-4 bg-black text-white font-tech text-[10px] tracking-widest font-black uppercase rounded-full hover:bg-neutral-900 transition-all shadow-xl disabled:opacity-20"
                        >
                          {isSubmittingTicket ? 'REGISTERING...' : 'INITIATE_TICKET'}
                        </button>
                      </div>
                   </form>
                </motion.div>
              )}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-20">
                  <div className="w-24 h-24 rounded-[3rem] border border-dashed border-black/10 flex items-center justify-center">
                    <MessageSquare size={32} strokeWidth={0.5} />
                  </div>
                  <div className="space-y-4">
                    <p className="font-display italic text-2xl px-12">Universal support frequencies open.</p>
                    <p className="font-tech text-[9px] tracking-widest uppercase">Awaiting your secure transmission...</p>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: msg.isAdmin ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={msg.id || i}
                  className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] p-6 rounded-[2.8rem] text-sm leading-relaxed shadow-sm ${
                    msg.isAdmin 
                    ? 'bg-white border border-black/5 text-black' 
                    : 'bg-slate-950 text-white shadow-2xl shadow-indigo-900/10'
                  }`}>
                    <p className="font-light">{msg.text}</p>
                    <div className={`flex items-center space-x-3 mt-4 opacity-30 ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                      <Clock size={10} />
                      <span className="text-[8px] font-mono tracking-tighter uppercase">
                        {msg.timestamp ? (
                          msg.timestamp.toDate 
                            ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : 'Pending Sync'}
                      </span>
                    </div>
                  </div>
                </motion.div>
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
