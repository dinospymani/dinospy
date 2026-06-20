import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Package, Settings, LogOut, Shield, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, MapPin } from 'lucide-react';
import DeliveryMap from '../components/DeliveryMap';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const getStatusProgress = (status: string) => {
    const map: Record<string, number> = {
      pending: 10,
      processing: 25,
      quality_check: 45,
      shipped: 65,
      out_for_delivery: 85,
      delivered: 100
    };
    return map[status] || 0;
  };

  const getStatusSteps = () => [
    { key: 'pending', label: 'Manifested' },
    { key: 'processing', label: 'Archiving' },
    { key: 'quality_check', label: 'Inspection' },
    { key: 'shipped', label: 'Dispatched' },
    { key: 'out_for_delivery', label: 'Courier' },
    { key: 'delivered', label: 'Acquired' }
  ];

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get('order_id');
      if (orderId) {
        try {
          const res = await fetch(`/api/payment/verify-order/${orderId}`);
          const data = await res.json();
          
          if (data.order_status === 'PAID') {
            toast.success('Payment Authorized: Your heritage acquisition is confirmed.');
            // Update order in firestore
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { 
              paymentStatus: 'paid',
              status: 'confirmed',
              updatedAt: new Date().toISOString()
            });
            // Re-fetch orders to show updated status
            fetchOrders();
          } else if (data.order_status === 'ACTIVE') {
            toast.info('Payment Pending: Waiting for final authorization.');
          } else {
            toast.error(`Payment Protocol Failed: ${data.order_status || 'Session Terminated'}`);
          }
        } catch (err) {
          console.error('Handshake Failure:', err);
        }
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    async function fetchOrders() {
      if (!user) return;
      try {
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    fetchOrders();
    checkPaymentStatus();
  }, [user]);

  const toggleAdmin = async () => {
    if (!user) return;
    const newRole = profile?.role === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update role.');
    }
  };

  const downloadReceipt = (order: any) => {
    try {
      const doc = new jsPDF();
      const goldColor = [212, 175, 55]; // #D4AF37
      const blackColor = [10, 10, 10]; // #0A0A0A

      // Title & Branding
      doc.setFillColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('DINOSPY', 105, 25, { align: 'center' });
      
      doc.setFontSize(8);
      doc.text('ESTABLISHED IN HERITAGE', 105, 32, { align: 'center' });

      // Order Info Header
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(16);
      doc.text('ACQUISITION RECEIPT', 20, 55);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Order ID: #${order.id.slice(-8).toUpperCase()}`, 20, 65);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 70);
      doc.text(`Status: ${order.status.toUpperCase()}`, 20, 75);

      // Customer Info
      doc.setFont('helvetica', 'bold');
      doc.text('DELIVERY MANDATE', 140, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(profile?.displayName || 'DINOSPY Member', 140, 65);
      doc.text(profile?.email || '', 140, 70);

      // Table of Items
      const tableData = order.items.map((item: any) => [
        item.name,
        `x${item.quantity}`,
        `INR ${item.price.toLocaleString()}`,
        `INR ${(item.price * item.quantity).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 90,
        head: [['Heritage Asset', 'Qty', 'Unit Value', 'Total']],
        body: tableData,
        headStyles: { 
          fillColor: goldColor as any, 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        styles: { fontSize: 9 },
        margin: { top: 90 }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`FULL ACQUISITION VALUE: INR ${order.total.toLocaleString()}`, 120, finalY);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('Thank you for choosing DINOSPY. Your heritage is our legacy.', 105, 280, { align: 'center' });

      doc.save(`DINOSPY-Receipt-${order.id.slice(-6)}.pdf`);
      toast.success('Receipt localized successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate archive.');
    }
  };

  return (
    <div className="min-h-screen bg-noir text-text selection:bg-gold selection:text-noir">
      <Navbar />
      
      <main className="container mx-auto px-6 md:px-12 pt-40 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
          
          {/* Identity Hub */}
          <div className="lg:col-span-4 space-y-16">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-charcoal text-text p-10 rounded-[4.5rem] aspect-square flex flex-col justify-between relative overflow-hidden luxury-shadow border border-white/5 group"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12 scale-150">
                <Shield size={240} strokeWidth={1} />
              </div>
              
              <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-20">
                  <div className="w-20 h-20 bg-gold text-noir rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(197,160,89,0.2)]">
                    <User size={32} strokeWidth={1} />
                  </div>
                  <div className="text-right">
                    <span className="font-tech text-gold opacity-30 text-[9px] tracking-[0.4em] uppercase mb-2 block">Member_Auth_Status</span>
                    <div className="px-6 py-2 rounded-full border border-gold/40 text-gold text-[9px] font-tech font-black tracking-[0.3em] uppercase inline-block">
                       {profile?.role === 'admin' ? 'SYSTEM_ROOT' : 'AUTHENTICATED_NODE'}
                    </div>
                  </div>
                </div>
                
                <h2 className="text-5xl md:text-7xl font-display italic tracking-tightest mb-6 uppercase leading-none">
                  {profile?.displayName?.split(' ')[0] || 'Member'} <span className="opacity-10 font-sans italic">{profile?.displayName?.split(' ')[1] || ''}</span>
                </h2>
                <div className="flex items-center space-x-6">
                   <div className="w-2.5 h-2.5 bg-gold rounded-full animate-pulse shadow-[0_0_15px_#c5a059]" />
                   <p className="font-tech text-xs text-text/40 tracking-[0.3em] font-black">{profile?.email?.toUpperCase()}</p>
                </div>
              </div>

              <div className="relative z-10 pt-12 border-t border-white/5 flex justify-between items-end">
                <div className="space-y-3">
                  <p className="font-tech text-text/10 text-[9px] tracking-[0.5em] uppercase">Node_Identification</p>
                  <p className="font-mono text-sm font-black tracking-tight text-text/30">{user?.uid.slice(0, 16).toUpperCase()}</p>
                </div>
                <div className="bg-noir p-5 rounded-[2.5rem] shadow-2xl border border-white/5 group-hover:scale-110 transition-transform duration-700">
                  <QRCodeSVG value={user?.uid || 'DINOSPY'} size={60} fgColor="#c5a059" bgColor="transparent" />
                </div>
              </div>
            </motion.div>

            <div className="space-y-6">
              <div className="flex items-center space-x-6 px-8">
                 <div className="w-2 h-2 bg-gold rounded-full shadow-[0_0_10px_#c5a059]" />
                 <span className="font-tech text-gold opacity-40 text-[10px] tracking-[0.5em] uppercase font-black">Security_Interfaces</span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {(profile?.role === 'admin' || user?.email === 'manikanta5sy@gmail.com') && (
                  <Link to="/admin" className="flex items-center justify-between p-10 bg-gold text-noir rounded-[3.5rem] group/admin transition-all duration-700 hover:scale-[1.02] shadow-[0_30px_60px_-12px_rgba(197,160,89,0.3)]">
                    <div className="flex items-center space-x-8">
                       <div className="w-14 h-14 rounded-full bg-noir text-gold flex items-center justify-center">
                          <Shield size={24} strokeWidth={1} />
                       </div>
                       <div className="space-y-1">
                          <p className="font-tech text-[10px] tracking-[0.5em] font-black uppercase">Admin_Root</p>
                          <p className="text-sm font-display italic opacity-60">Corporate Command Core</p>
                       </div>
                    </div>
                    <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </Link>
                )}
                <button 
                  onClick={signOut}
                  className="w-full flex items-center justify-between p-10 bg-charcoal border border-white/5 rounded-[3.5rem] hover:bg-noir text-text transition-all duration-700 group/logout"
                >
                  <div className="flex items-center space-x-8 text-text group-hover/logout:text-gold transition-colors">
                     <div className="w-14 h-14 rounded-full bg-noir/60 flex items-center justify-center group-hover/logout:bg-gold/10 transition-colors">
                        <LogOut size={24} strokeWidth={1} />
                     </div>
                     <div className="space-y-1 text-left">
                        <p className="font-tech text-[10px] tracking-[0.5em] font-black uppercase group-hover/logout:text-gold transition-colors">Terminate_Session</p>
                        <p className="text-sm font-display italic opacity-40">Secure Node De-auth</p>
                     </div>
                  </div>
                  <ChevronRight size={24} strokeWidth={1} className="opacity-10 group-hover/logout:opacity-100 group-hover/logout:translate-x-2 transition-all text-gold" />
                </button>
              </div>
            </div>
          </div>

          {/* Orders Archive */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-16"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20 border-b border-white/5 pb-20">
                <div className="space-y-8">
                  <div className="flex items-center space-x-6">
                    <div className="w-4 h-4 bg-gold rounded-full animate-pulse shadow-[0_0_20px_#c5a059]" />
                    <span className="font-tech text-gold opacity-40 text-xs tracking-[0.6em] font-black uppercase">ACQUISITION_LOGBOOKS // SEC_LEVEL_3</span>
                  </div>
                  <h1 className="text-7xl md:text-9xl font-display italic tracking-tightest leading-none">Vault <span className="opacity-10 font-sans italic">Archives.</span></h1>
                </div>
              </div>
              
              {loading ? (
                 <div className="space-y-12">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="h-64 bg-charcoal rounded-[4rem] border border-white/5 animate-pulse" />
                   ))}
                 </div>
              ) : (
                <div className="space-y-12">
                  {orders.length === 0 ? (
                    <div className="p-32 text-center glass rounded-[5rem] border border-white/5 opacity-40">
                       <p className="font-display italic text-4xl mb-8">No historical records found.</p>
                       <Link to="/explore" className="font-tech text-xs tracking-[0.5em] uppercase hover:text-gold transition-all duration-700">Initialize_Acquisition_01</Link>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-12 md:p-16 rounded-[5rem] border border-white/5 bg-charcoal/40 hover:bg-charcoal transition-all duration-1000 group relative luxury-shadow overflow-hidden">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none -rotate-12 translate-x-1/4 -translate-y-1/4 scale-150 group-hover:opacity-[0.05] transition-all duration-1000">
                           <Package size={400} />
                        </div>
                        
                        <div className="flex flex-col xl:flex-row justify-between gap-12 mb-20 relative z-10">
                          <div className="space-y-8">
                            <p className="font-tech text-gold opacity-40 text-xs tracking-[0.5em] font-black uppercase">MANIFEST_ID // DNX_{order.id.slice(-10).toUpperCase()}</p>
                            <h4 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none">Record <span className="opacity-10 text-white font-sans italic">Item.</span></h4>
                            <div className="flex flex-wrap items-center gap-6">
                               <div className={`px-8 py-3 rounded-full text-xs font-tech font-black tracking-widest uppercase border transition-all duration-1000 ${order.status === 'delivered' ? 'bg-gold text-noir border-gold shadow-[0_0_30px_rgba(197,160,89,0.3)]' : 'bg-noir text-text/60 border-white/10'}`}>
                                 {order.status.toUpperCase()}
                               </div>
                               <span className="text-xs font-tech font-black text-text/20 tracking-[0.3em] uppercase">{new Date(order.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row xl:flex-col items-start md:items-center xl:items-end justify-between gap-10">
                            <span className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none text-gold">₹{order.total.toLocaleString()}</span>
                            <div className="flex items-center space-x-6">
                               <button
                                 onClick={() => downloadReceipt(order)}
                                 className="flex items-center justify-center space-x-4 px-10 py-5 rounded-3xl bg-noir border border-white/5 text-text/40 hover:text-gold hover:border-gold transition-all duration-700 font-black group/btn"
                               >
                                 <FileDown size={18} strokeWidth={1.5} className="group-hover/btn:-translate-y-1 transition-transform" />
                                 <span className="font-tech text-xs tracking-[0.4em]">MANIFEST</span>
                               </button>
                               <button 
                                 onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                 className={`w-14 h-14 rounded-3xl flex items-center justify-center border transition-all duration-700 ${expandedOrderId === order.id ? 'bg-gold border-gold text-noir' : 'bg-noir border-white/5 text-text/40 hover:border-gold hover:text-gold'}`}
                               >
                                  <motion.div animate={{ rotate: expandedOrderId === order.id ? 180 : 0 }}>
                                    <ChevronRight size={24} className="rotate-90" />
                                  </motion.div>
                               </button>
                            </div>
                          </div>
                        </div>

                        {/* Order Timeline Visualizer */}
                        <div className="mb-20 relative z-10 p-12 bg-noir/40 rounded-[3.5rem] border border-white/5 overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent pointer-events-none" />
                           <div className="relative h-1.5 bg-white/5 rounded-full mb-12 overflow-hidden">
                              <motion.div 
                                 initial={{ width: 0 }}
                                 whileInView={{ width: `${getStatusProgress(order.status)}%` }}
                                 transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                                 className="absolute top-0 left-0 h-full bg-gold shadow-[0_0_30px_#c5a059]" 
                              />
                           </div>
                           <div className="grid grid-cols-3 lg:grid-cols-6 gap-6 md:gap-10">
                              {getStatusSteps().map((step, idx) => {
                                 const currentIdx = getStatusSteps().findIndex(s => s.key === order.status);
                                 const stepIdx = getStatusSteps().findIndex(s => s.key === step.key);
                                 const isActive = stepIdx <= currentIdx;
                                 const isCurrent = stepIdx === currentIdx;
                                 
                                 return (
                                    <div key={step.key} className={`flex flex-col items-center space-y-5 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-20'}`}>
                                       <div className={`w-4 h-4 rounded-full border-4 border-noir transition-all duration-1000 ${isCurrent ? 'bg-gold scale-150 shadow-[0_0_20px_#c5a059]' : isActive ? 'bg-gold' : 'bg-white/10'}`} />
                                       <span className={`text-[9px] font-tech font-black uppercase tracking-[0.3em] text-center ${isCurrent ? 'text-gold' : 'text-text/40'}`}>{step.label}</span>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>

                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-12 pt-12 border-t border-white/5 mt-auto relative z-10">
                             <div className="flex flex-wrap gap-6">
                                {order.items.slice(0, 3).map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center space-x-6 bg-noir p-6 rounded-[2.5rem] border border-white/5 shadow-sm hover:shadow-xl transition-all duration-1000 group/item">
                                    <div className="w-16 h-20 rounded-[1.5rem] overflow-hidden bg-charcoal relative">
                                       <img src={item.images?.[0] || item.image} className="w-full h-full object-contain grayscale brightness-110 group-hover/item:grayscale-0 transition-all duration-1000" alt="" />
                                    </div>
                                    <div>
                                      <p className="text-[13px] font-display font-black italic tracking-tight uppercase text-text/80 group-hover/item:text-gold transition-colors">{item.name}</p>
                                      <p className="font-tech text-gold opacity-30 text-[9px] mt-2 font-black tracking-[0.3em]">QTY: 0{item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                             </div>
                             <div className="flex items-center justify-between xl:justify-end gap-12">
                                <div className="text-right space-y-2">
                                  <p className="font-tech text-text/20 text-[9px] font-black tracking-[0.4em] uppercase">Auth_Pin</p>
                                  <p className="font-mono text-4xl font-black tracking-[0.3em] leading-none text-gold">{order.deliveryPin || 'SYNC'}</p>
                                </div>
                             </div>
                          </div>

                        <AnimatePresence>
                          {expandedOrderId === order.id && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                              className="pt-16 overflow-hidden"
                            >
                               <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 bg-noir/60 p-10 md:p-16 rounded-[5rem] border border-white/5 relative">
                                  <div className="lg:col-span-2 space-y-12">
                                    <h5 className="font-tech text-[10px] text-gold opacity-20 tracking-[0.4em] font-black uppercase mb-12">LOGISTICS_TIMELINE</h5>
                                    {order.timeline?.slice().reverse().map((event: any, i: number) => (
                                      <div key={i} className="flex space-x-10 relative">
                                        <div className={`w-[14px] h-[14px] rounded-full flex-shrink-0 z-10 ${i === 0 ? 'bg-gold shadow-[0_0_15px_#c5a059]' : 'bg-white/10'}`} />
                                        <div className="pb-10">
                                          <p className={`text-[12px] font-tech font-black tracking-[0.2em] ${i === 0 ? 'text-gold' : 'text-text/20'}`}>{event.status.toUpperCase()}</p>
                                          <p className={`text-[13px] font-display italic mt-3 leading-relaxed tracking-tight ${i === 0 ? 'text-text/60' : 'text-text/20'}`}>{event.message}</p>
                                          <p className="font-mono text-[9px] text-text/10 mt-4 font-bold">{new Date(event.timestamp).toLocaleString().toUpperCase()}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="lg:col-span-3 space-y-12">
                                     <div className="rounded-[4rem] overflow-hidden grayscale brightness-50 border-[12px] border-noir bg-noir shadow-2xl relative aspect-video">
                                        <DeliveryMap status={order.status} orderId={order.id} />
                                     </div>
                                     <div className="bg-charcoal p-12 rounded-[4rem] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-12">
                                        <div className="text-center sm:text-left space-y-6">
                                           <div className="flex items-center space-x-4">
                                              <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                                              <p className="font-tech text-[10px] text-gold opacity-40 tracking-[0.4em] font-black uppercase">HANDSHAKE_PROTOCOL</p>
                                           </div>
                                           <p className="text-[12px] font-display italic text-text/40 leading-relaxed max-w-sm">PRESENT THIS DIGITAL MANIFEST FOR SECURE CARGO AUTHORIZATION. PIN EXCHANGE IS MANDATORY.</p>
                                        </div>
                                        <div className="p-6 bg-noir rounded-[3rem] border border-white/5">
                                           <QRCodeSVG value={`${window.location.origin}/partner/${order.id}`} size={80} fgColor="#c5a059" bgColor="transparent" />
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
