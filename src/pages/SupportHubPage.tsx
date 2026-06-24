import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, ShieldCheck, Ticket, ChevronRight, Plus, ArrowLeft, ChevronLeft, ShieldAlert, Clock, Activity, Database, LifeBuoy } from 'lucide-react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function SupportHubPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [view, setView] = useState<'list' | 'create' | 'chat'>('list');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('ORDER');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(ticketList);
      
      if (activeTicket) {
        const updated = ticketList.find(t => t.id === activeTicket.id);
        if (updated) setActiveTicket(updated);
      }
    }, (err) => {
      console.warn("Ticket vault restricted:", err);
    });

    return () => unsubscribe();
  }, [user, activeTicket?.id]);

  useEffect(() => {
    if (!activeTicket?.id) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'support_tickets', activeTicket.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messageList);
    }, (err) => {
      console.warn("Message sequence isolated:", err);
    });

    return () => unsubscribe();
  }, [activeTicket?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view]);

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !newMessage.trim()) return;

    try {
      const ticketDoc = await addDoc(collection(db, 'support_tickets'), {
        userId: user?.uid,
        userEmail: user?.email,
        userName: user?.displayName || 'Dinospy Member',
        subject: subject.trim(),
        category,
        status: 'OPEN',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        lastMessage: newMessage.trim(),
        unreadByAdmin: true,
        unreadByUser: false
      });

      await addDoc(collection(db, 'support_tickets', ticketDoc.id, 'messages'), {
        text: newMessage.trim(),
        senderId: user?.uid,
        senderName: user?.displayName || 'User',
        sender: 'user',
        timestamp: serverTimestamp()
      });

      toast.success('Support ticket initiated.');
      setSubject('');
      setNewMessage('');
      setView('list');
    } catch (err) {
      toast.error('Vault comms failure.');
      console.error(err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      const ticketRef = doc(db, 'support_tickets', activeTicket.id);
      
      await addDoc(collection(db, 'support_tickets', activeTicket.id, 'messages'), {
        text: msgText,
        senderId: user?.uid,
        senderName: user?.displayName || 'User',
        sender: 'user',
        timestamp: serverTimestamp()
      });

      await updateDoc(ticketRef, {
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        lastMessage: msgText,
        unreadByAdmin: true
      });
    } catch (err) {
      toast.error('Message transmission failed.');
      setNewMessage(msgText);
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
       <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-8">
          <ShieldAlert className="text-white" size={32} />
       </div>
       <h1 className="text-4xl font-display uppercase tracking-tightest mb-4">Authentication Required</h1>
       <p className="text-black/40 text-sm font-mono uppercase tracking-[0.4em] mb-12">Login to access the support matrix</p>
       <Link to="/" className="px-10 py-4 bg-black text-white rounded-full text-[10px] font-bold tracking-[0.4em] uppercase">Return to Hub</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Support Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-20 border-b border-black/5 pb-16">
            <div className="space-y-6">
               <div className="flex items-center space-x-6">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse" />
                  <span className="font-mono text-black/30 text-xs tracking-[0.5em] font-bold uppercase">LOGISTICS_HOSPITALITY // SUPPORT_VAULT</span>
               </div>
               <h1 className="text-4xl md:text-8xl font-display font-medium tracking-tightest leading-none">Support <span className="opacity-10 text-black italic">Dashboard.</span></h1>
            </div>
            
            <div className="flex items-center space-x-6">
               <div className="text-right hidden md:block">
                  <p className="font-mono text-[9px] text-black/20 tracking-[0.4em] uppercase font-bold">Protocol_Status</p>
                  <p className="font-mono text-sm font-bold tracking-tight text-indigo-600 uppercase">Synchronized</p>
               </div>
               <div className="w-14 h-14 rounded-3xl bg-neutral-50 border border-black/5 flex items-center justify-center">
                  <LifeBuoy size={24} className="text-black" strokeWidth={1.5} />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-12">
             {/* Sidebar: Navigation & Tickets */}
             <div className="col-span-12 lg:col-span-4 space-y-12">
                <div className="bg-neutral-50 rounded-[4rem] border border-black/5 p-10 space-y-10 group shadow-lg">
                   <div className="flex items-center space-x-6 mb-10">
                      <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
                         <Ticket size={24} strokeWidth={1} />
                      </div>
                      <h3 className="font-mono text-xs font-bold tracking-[0.4em] uppercase">Active_Tickets</h3>
                   </div>

                   <button 
                     onClick={() => setView('create')}
                     className="w-full py-6 bg-black text-white text-[10px] font-bold tracking-[0.4em] uppercase rounded-full hover:shadow-2xl transition-all flex items-center justify-center space-x-4 group/btn"
                   >
                     <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
                     <span>RAISE_NEW_TICKET</span>
                   </button>

                   <div className="space-y-4 pt-6">
                      {tickets.length === 0 ? (
                        <div className="p-12 text-center border border-dashed border-black/10 rounded-[3rem] opacity-30">
                           <p className="font-mono text-[10px] uppercase tracking-widest font-bold">No_Historical_Comms</p>
                        </div>
                      ) : (
                        tickets.map(ticket => (
                          <button
                            key={ticket.id}
                            onClick={() => {
                              setActiveTicket(ticket);
                              setView('chat');
                            }}
                            className={`w-full p-8 text-left rounded-[2.5rem] border transition-all duration-700 group hover:scale-[1.02] ${activeTicket?.id === ticket.id ? 'bg-white border-black shadow-xl ring-8 ring-black/5' : 'bg-white/50 border-black/5 hover:bg-white'}`}
                          >
                             <div className="flex justify-between items-start mb-4">
                                <span className={`text-[8px] px-3 py-1 rounded-full font-bold uppercase tracking-[0.2em] ${ticket.status === 'OPEN' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-neutral-200 text-black/40'}`}>
                                   {ticket.status}
                                </span>
                                <span className="font-mono text-[8px] text-black/20 font-bold">
                                   {ticket.createdAt?.toDate().toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()}
                                </span>
                             </div>
                             <h4 className="text-sm font-bold text-black mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{ticket.subject}</h4>
                             <p className="font-mono text-[8px] text-black/30 tracking-[0.3em] uppercase">{ticket.category} // DNX_L4</p>
                          </button>
                        ))
                      )}
                   </div>
                </div>

                <div className="bg-neutral-50 rounded-[4rem] border border-black/5 p-10 space-y-8 shadow-sm">
                   <div className="space-y-4">
                      <p className="font-mono text-black/20 text-[9px] tracking-[0.4em] uppercase font-bold">Information_Signals</p>
                      <div className="flex items-center space-x-6 p-6 bg-white rounded-3xl border border-black/5">
                         <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <ShieldCheck size={20} />
                         </div>
                         <div>
                            <p className="text-[10px] font-bold tracking-widest uppercase">Response_Protocol</p>
                            <p className="text-[11px] text-black/40 font-medium">Avg_Latency: 2-4 Hours</p>
                         </div>
                      </div>
                      <div className="flex items-center space-x-6 p-6 bg-white rounded-3xl border border-black/5">
                         <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock size={20} />
                         </div>
                         <div>
                            <p className="text-[10px] font-bold tracking-widest uppercase">Operating_Threshold</p>
                            <p className="text-[11px] text-black/40 font-medium">Archival_Hours: 24/7</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Main Viewer Area */}
             <div className="col-span-12 lg:col-span-8">
                <div className="bg-neutral-50 rounded-[5rem] border border-black/5 min-h-[700px] flex flex-col overflow-hidden relative shadow-2xl">
                   {/* Background Decorative */}
                   <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                   {view === 'list' && (
                     <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center relative z-10">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-24 h-32 md:w-32 md:h-40 bg-white border border-black/5 rounded-[4rem] flex items-center justify-center mb-12 shadow-2xl group"
                        >
                           <Database size={56} className="text-black/10 group-hover:text-indigo-600 transition-colors duration-700" strokeWidth={0.5} />
                           <div className="absolute inset-0 border-4 border-black/5 rounded-[4rem] animate-pulse" />
                        </motion.div>
                        <h3 className="text-2xl md:text-5xl font-display tracking-tightest uppercase mb-8">Central Intelligence Terminal</h3>
                        <p className="text-black/40 text-xs md:text-sm max-w-sm font-mono uppercase tracking-[0.3em] font-bold leading-relaxed mb-16">Select a comms historical record or initialize a new discovery protocol for dedicated logistics assistance.</p>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setView('create')}
                          className="px-16 py-7 bg-black text-white text-[10px] font-bold tracking-[0.5em] uppercase rounded-full hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all duration-700"
                        >
                          Initialize_Manifest_Report
                        </motion.button>
                     </div>
                   )}

                   {view === 'create' && (
                     <div className="flex-1 overflow-y-auto p-12 lg:p-24 relative z-10">
                        <button 
                          onClick={() => setView('list')} 
                          className="text-[10px] font-bold tracking-[0.4em] uppercase text-black/20 mb-16 flex items-center space-x-4 hover:text-black transition-colors group"
                        >
                           <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
                           <span>Return_to_Monitor_Feed</span>
                        </button>
                        
                        <div className="max-w-xl">
                           <div className="space-y-4 mb-16">
                              <h3 className="text-4xl md:text-7xl font-display tracking-tightest uppercase leading-none">New Protocol <span className="opacity-10 italic">Inquiry.</span></h3>
                              <p className="text-black/40 font-mono text-[9px] tracking-[0.4em] uppercase font-bold">Deployment_Level_Clearance_4</p>
                           </div>

                           <form onSubmit={createTicket} className="space-y-12">
                              <div className="space-y-6">
                                 <label className="font-mono text-black/20 text-[9px] tracking-[0.5em] font-black uppercase block ml-4">Deployment_Priority</label>
                                 <div className="grid grid-cols-2 gap-4">
                                    {['ORDER', 'PRODUCT', 'SHIPPING', 'VAULT'].map(cat => (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`py-6 text-[10px] font-bold tracking-[0.3em] uppercase rounded-[2.5rem] border transition-all duration-700 ${category === cat ? 'bg-black text-white border-black shadow-xl scale-[1.05]' : 'bg-white text-black/40 border-black/5 hover:border-black/20'}`}
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                 </div>
                              </div>

                              <div className="space-y-10">
                                 <div className="space-y-4">
                                    <label className="font-mono text-black/20 text-[9px] tracking-[0.5em] font-black uppercase block ml-4">Subject_Briefing</label>
                                    <input
                                      type="text"
                                      value={subject}
                                      onChange={(e) => setSubject(e.target.value)}
                                      className="w-full px-10 py-6 bg-white rounded-[2.5rem] border border-black/5 focus:border-black outline-none text-sm font-bold tracking-tight shadow-sm transition-all text-black uppercase"
                                      placeholder="DESIGNATE_FOCAL_POINT..."
                                      required
                                    />
                                 </div>
                                 <div className="space-y-4">
                                    <label className="font-mono text-black/20 text-[9px] tracking-[0.5em] font-black uppercase block ml-4">Manifest_Expansion</label>
                                    <textarea
                                      value={newMessage}
                                      onChange={(e) => setNewMessage(e.target.value)}
                                      className="w-full h-56 px-10 py-8 bg-white rounded-[3.5rem] border border-black/5 focus:border-black outline-none text-sm font-medium resize-none shadow-sm transition-all leading-relaxed"
                                      placeholder="DETAILED_LOGISTICS_DESCRIPTION..."
                                      required
                                    />
                                 </div>
                              </div>

                              <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full py-8 bg-black text-white text-[11px] font-bold tracking-[0.6em] uppercase rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-all duration-700"
                              >
                                EXECUTE_PROTOCOL_SYNC
                              </motion.button>
                           </form>
                        </div>
                     </div>
                   )}

                   {view === 'chat' && activeTicket && (
                     <div className="flex-1 flex flex-col overflow-hidden relative z-10 h-full">
                        {/* Thread Control Bar */}
                        <div className="px-12 py-10 bg-white border-b border-black/5 flex items-center justify-between">
                           <div className="flex items-center space-x-8">
                              <button onClick={() => setView('list')} className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center border border-black/5 hover:bg-black hover:text-white transition-all">
                                 <ChevronLeft size={20} />
                              </button>
                              <div>
                                 <div className="flex items-center space-x-3 mb-1">
                                    <h4 className="text-xl font-display font-medium tracking-tightest text-black uppercase">{activeTicket.subject}</h4>
                                    <span className={`px-2 py-0.5 rounded-full font-mono text-[7px] font-black tracking-widest ${activeTicket.status === 'OPEN' ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-black/40'}`}>
                                       {activeTicket.status}
                                    </span>
                                 </div>
                                 <div className="flex items-center space-x-4">
                                    <span className="text-[9px] text-black/20 font-mono tracking-[0.2em] font-bold uppercase">MANIFEST: {activeTicket.id.slice(0, 12).toUpperCase()}</span>
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
                                    <span className="text-[9px] text-indigo-600/60 font-mono font-black uppercase tracking-widest">Live_Secure_Stream</span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="hidden sm:flex items-center space-x-4">
                              <div className="px-5 py-2.5 bg-neutral-50 rounded-2xl border border-black/5 text-[9px] font-mono font-black tracking-widest uppercase">
                                 {activeTicket.category}
                              </div>
                           </div>
                        </div>

                        {/* Interactive Thread Matrix */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-12 bg-white/40 no-scrollbar">
                           {messages.map((msg: any) => (
                             <div
                               key={msg.id}
                               className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                             >
                               <motion.div 
                                 initial={{ opacity: 0, y: 15 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className={`max-w-[70%] space-y-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
                               >
                                 <div className={`px-10 py-7 rounded-[3.5rem] text-[15px] font-display font-medium leading-relaxed tracking-tight ${msg.sender === 'user' ? 'bg-black text-white rounded-br-none shadow-2xl overflow-hidden relative' : 'bg-white text-black border border-black/5 rounded-bl-none shadow-sm'}`}>
                                   {msg.sender === 'user' && <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />}
                                   {msg.text}
                                 </div>
                                 <div className={`flex items-center space-x-4 px-6 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <span className="font-mono text-[9px] text-black/20 font-black tracking-widest uppercase">
                                       {msg.sender === 'user' ? 'OPERATOR' : 'VAULT_CURATOR'}
                                    </span>
                                    <div className="w-1 h-1 bg-black/10 rounded-full" />
                                    <span className="text-[9px] text-black/20 font-bold uppercase tracking-widest">
                                       {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'SYNCHRONIZING...'}
                                    </span>
                                 </div>
                               </motion.div>
                             </div>
                           ))}
                        </div>

                        {/* Comms Deployment Node */}
                        <form onSubmit={sendMessage} className="p-10 border-t border-black/5 bg-white relative z-20">
                           <div className="flex items-center space-x-6">
                              <div className="flex-1 relative group">
                                 <input
                                   type="text"
                                   value={newMessage}
                                   onChange={(e) => setNewMessage(e.target.value)}
                                   className="w-full bg-neutral-50 border border-black/5 rounded-[3rem] px-12 py-7 text-sm font-medium focus:border-black transition-all outline-none placeholder:text-black/10"
                                   placeholder="TRANSMIT_INQUIRY_COMMAND..."
                                 />
                                 <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center space-x-4 opacity-10 group-focus-within:opacity-40 transition-opacity">
                                    <div className="w-2 h-2 bg-black rounded-full" />
                                    <span className="font-mono text-[8px] tracking-widest font-black uppercase text-black">ENCRYPTED_LINE</span>
                                 </div>
                              </div>
                              <motion.button 
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                className="w-20 h-20 bg-black text-white rounded-[2.5rem] flex items-center justify-center transition-all duration-700 shadow-2xl shadow-black/20 hover:bg-neutral-800"
                              >
                                 <Send size={28} strokeWidth={1} />
                              </motion.button>
                           </div>
                        </form>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
