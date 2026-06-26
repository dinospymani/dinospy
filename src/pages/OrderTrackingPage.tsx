import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Package, MapPin, Truck, CheckCircle2, ShieldCheck, ArrowRight, AlertCircle, Clock, Info } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const STATUS_STEPS = [
  { id: 'PENDING', label: 'ACQUISITION_PENDING', icon: Clock, desc: 'Verification of horological credentials and bank authorization.' },
  { id: 'CONFIRMED', label: 'MANIFEST_CONFIRMED', icon: ShieldCheck, iconColor: 'text-emerald', desc: 'Secure vault reservation successful. Logistics manifest initialized.' },
  { id: 'PROCESSING', label: 'CURATION_IN_PROGRESS', icon: Info, desc: 'Final calibration, polishing, and secure documentation packaging.' },
  { id: 'SHIPPED', label: 'LOGISTICS_DEPLOYED', icon: Truck, desc: 'Armored transit initiated. Secure delivery coordinates synchronized.' },
  { id: 'DELIVERED', label: 'MISSION_COMPLETED', icon: CheckCircle2, iconColor: 'text-emerald', desc: 'Archival piece safely transferred to acquisitor.' }
];

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // Order IDs often come from Cashfree and are stored in Firestore
      // We'll try to find the order by ID first, then verify email
      const cleanId = orderId.replace('DNX_', '').trim();
      const orderRef = doc(db, 'orders', cleanId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const data = orderSnap.data();
        if (data.customerEmail.toLowerCase() === email.toLowerCase()) {
          setOrder({ id: orderSnap.id, ...data });
        } else {
          setError('IDENTIFICATION_MISMATCH // EMAIL_UNAUTHORIZED');
        }
      } else {
        // Try searching by custom order ID field if ID isn't the document ID
        const q = query(collection(db, 'orders'), where('orderId', '==', orderId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const data = qSnap.docs[0].data();
          if (data.customerEmail.toLowerCase() === email.toLowerCase()) {
            setOrder({ id: qSnap.docs[0].id, ...data });
          } else {
            setError('IDENTIFICATION_MISMATCH // EMAIL_UNAUTHORIZED');
          }
        } else {
          setError('ARCHIVE_NOT_FOUND // INVALID_PROTOCOL_ID');
        }
      }
    } catch (err) {
      console.error(err);
      setError('VAULT_ACCESS_FAILURE // CONNECTION_INTERRUPTED');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    const idx = STATUS_STEPS.findIndex(s => s.id === status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-40 pb-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="flex flex-col items-center text-center mb-24">
             <motion.div
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex items-center space-x-6 mb-12 opacity-40"
             >
                <div className="w-1.5 h-1.5 bg-charcoal rounded-full" />
                <span className="font-mono text-xs tracking-[0.6em] uppercase font-bold">LOGISTICS_MAINFRAME // TRACKING</span>
                <div className="w-1.5 h-1.5 bg-charcoal rounded-full" />
             </motion.div>
             <h1 className="text-6xl md:text-8xl font-display font-medium tracking-tightest leading-none mb-12">Track your <br /><span className="opacity-10 italic">Acquisition.</span></h1>
             <p className="text-charcoal/40 text-lg md:text-xl font-light max-w-2xl leading-relaxed">Access the secure logistics feed to monitor the movement of your horological piece from the DINOSPY vault to your private collection.</p>
          </div>

          <div className="grid grid-cols-12 gap-12">
             {/* Left: Input Form */}
             <div className="col-span-12 lg:col-span-12 xl:col-span-4 self-start">
                <div className="bg-charcoal text-ivory rounded-[4rem] p-12 shadow-2xl relative overflow-hidden">
                   <div className="absolute inset-0 opacity-10 pointer-events-none" 
                        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                   
                   <div className="relative z-10 space-y-12">
                      <div className="space-y-4">
                         <div className="w-12 h-12 bg-ivory text-charcoal rounded-2xl flex items-center justify-center mb-8">
                            <Search size={22} strokeWidth={1.5} />
                         </div>
                         <h2 className="text-3xl font-display uppercase tracking-tight">Vault Protocol</h2>
                         <p className="text-ivory/40 font-mono text-[10px] tracking-widest uppercase font-black">AUTHENTICATION_LEVEL_4_REQUIRED</p>
                      </div>

                      <form onSubmit={handleTrack} className="space-y-8">
                         <div className="space-y-4">
                            <label className="font-mono text-ivory/20 text-[9px] tracking-[0.5em] font-black uppercase ml-4">Manifest_Archive_ID</label>
                            <input
                              type="text"
                              value={orderId}
                              onChange={(e) => setOrderId(e.target.value)}
                              placeholder="DNX_0000_0000"
                              className="w-full bg-ivory/5 border border-ivory/10 rounded-[2.5rem] px-10 py-6 text-sm font-bold tracking-widest outline-none focus:border-luxury-gold transition-all text-ivory placeholder:text-ivory/10 uppercase"
                              required
                            />
                         </div>
                         <div className="space-y-4">
                            <label className="font-mono text-ivory/20 text-[9px] tracking-[0.5em] font-black uppercase ml-4">Acquisitor_Credentials</label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="ARCHIVAL_EMAIL@DOMAIN.COM"
                              className="w-full bg-ivory/5 border border-ivory/10 rounded-[2.5rem] px-10 py-6 text-sm font-bold tracking-widest outline-none focus:border-luxury-gold transition-all text-ivory placeholder:text-ivory/10 uppercase"
                              required
                            />
                         </div>
                         
                         <button
                           type="submit"
                           disabled={loading}
                           className="w-full py-8 bg-luxury-gold text-charcoal text-[11px] font-black tracking-[0.6em] uppercase rounded-full shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-700 disabled:opacity-50"
                         >
                           {loading ? 'SYNCHRONIZING...' : 'INITIALIZE_TRACKING'}
                         </button>
                      </form>

                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 bg-ruby/10 border border-ruby/20 rounded-[2rem] flex items-center space-x-4"
                        >
                           <AlertCircle size={20} className="text-ruby" />
                           <p className="text-[10px] font-mono font-bold tracking-widest text-ruby uppercase">{error}</p>
                        </motion.div>
                      )}
                   </div>
                </div>
             </div>

             {/* Right: Results Display */}
             <div className="col-span-12 lg:col-span-12 xl:col-span-8 min-h-[600px]">
                <AnimatePresence mode="wait">
                   {order ? (
                     <motion.div
                       key="results"
                       initial={{ opacity: 0, x: 50 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -50 }}
                       className="space-y-12"
                     >
                        {/* Order Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="bg-white border border-charcoal/5 rounded-[3.5rem] p-10 luxury-shadow">
                              <div className="flex justify-between items-start mb-8">
                                 <span className="font-mono text-[9px] text-charcoal/20 tracking-[0.4em] font-black uppercase">Current_Phasing</span>
                                 <div className="px-5 py-2 bg-charcoal text-ivory rounded-full text-[9px] font-mono font-black tracking-widest uppercase">
                                    {order.status}
                                 </div>
                              </div>
                              <h3 className="text-3xl font-display font-medium text-charcoal mb-4 uppercase tracking-tight">
                                 {STATUS_STEPS[getStatusIndex(order.status)].label}
                              </h3>
                              <p className="text-charcoal/40 text-sm leading-relaxed max-w-xs">{STATUS_STEPS[getStatusIndex(order.status)].desc}</p>
                           </div>
                           
                           <div className="bg-charcoal text-ivory border border-charcoal/5 rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold opacity-10 rounded-bl-full" />
                              <span className="font-mono text-[9px] text-ivory/20 tracking-[1em] font-black uppercase block mb-8">SECURE_MANIFEST</span>
                              <div className="space-y-6">
                                 <div>
                                    <p className="text-[9px] font-mono text-ivory/40 uppercase mb-1">Acquisitor_Reference</p>
                                    <p className="text-xl font-display font-medium text-ivory uppercase tracking-widest">{order.id.toUpperCase()}</p>
                                 </div>
                                 <div className="flex justify-between">
                                    <div>
                                       <p className="text-[9px] font-mono text-ivory/40 uppercase mb-1">Acquisition_Date</p>
                                       <p className="text-sm font-mono text-ivory uppercase font-bold">
                                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'PENDING'}
                                       </p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[9px] font-mono text-ivory/40 uppercase mb-1">Acquisition_Value</p>
                                       <p className="text-xl font-display font-medium text-luxury-gold uppercase">₹{order.total.toLocaleString()}</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Tracker Timeline */}
                        <div className="bg-white border border-charcoal/5 rounded-[4rem] p-12 lg:p-20 luxury-shadow relative">
                           <div className="flex flex-col space-y-16">
                              {STATUS_STEPS.map((step, idx) => {
                                 const currentIdx = getStatusIndex(order.status);
                                 const isCompleted = idx <= currentIdx;
                                 const isActive = idx === currentIdx;
                                 const Icon = step.icon;

                                 return (
                                   <div key={step.id} className="flex items-start space-x-10 relative">
                                      {/* Connector */}
                                      {idx !== STATUS_STEPS.length - 1 && (
                                        <div className={`absolute left-7 top-14 bottom-[-64px] w-0.5 ${isCompleted ? 'bg-charcoal' : 'bg-charcoal/5'} transition-all duration-1000`} />
                                      )}

                                      <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-1000 ${
                                         isActive ? 'bg-charcoal text-ivory scale-125 shadow-2xl rotate-3' : 
                                         isCompleted ? 'bg-charcoal/10 text-charcoal' : 'bg-charcoal/5 text-charcoal/10'
                                      }`}>
                                         <Icon size={24} strokeWidth={isActive ? 2 : 1} />
                                         {isActive && (
                                           <div className="absolute -inset-2 border-2 border-charcoal border-dashed rounded-3xl animate-[spin_10s_linear_infinite]" />
                                         )}
                                      </div>

                                      <div className="flex-1 pt-2">
                                         <div className="flex items-center space-x-4 mb-2">
                                            <h4 className={`text-xl font-display font-bold uppercase transition-all duration-700 ${isCompleted ? 'text-charcoal' : 'text-charcoal/20'}`}>
                                               {step.label}
                                            </h4>
                                            {isActive && (
                                              <span className="px-3 py-1 bg-emerald text-white rounded-full text-[8px] font-mono font-black tracking-widest uppercase animate-pulse">ACTIVE_STATE</span>
                                            )}
                                         </div>
                                         <p className="text-charcoal/40 text-sm max-w-md font-light leading-relaxed">{step.desc}</p>
                                      </div>
                                   </div>
                                 );
                              })}
                           </div>
                        </div>
                     </motion.div>
                   ) : (
                     <motion.div
                       key="empty"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-charcoal/10 rounded-[5rem]"
                     >
                        <div className="w-48 h-48 bg-soft-silver rounded-full flex items-center justify-center mb-12 relative">
                           <Package size={80} className="text-charcoal/5" strokeWidth={0.5} />
                           <motion.div 
                             animate={{ rotate: 360 }}
                             transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                             className="absolute inset-0 border-2 border-charcoal/5 border-dashed rounded-full"
                           />
                        </div>
                        <h3 className="text-4xl font-display font-medium text-charcoal/20 uppercase tracking-tightest mb-8">Archival Stream Empty</h3>
                        <p className="text-charcoal/10 font-mono text-[9px] tracking-[0.4em] uppercase font-black">Initialize_Protocol_Above_to_Synchronize_Logistics_Feed</p>
                     </motion.div>
                   )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
