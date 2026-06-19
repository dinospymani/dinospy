import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
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
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <Navbar />
      
      <main className="flex-grow pt-24 md:pt-40 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
          {/* Left Column: Membership Card & Identity */}
          <div className="lg:col-span-4 space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white text-black p-10 rounded-[4rem] aspect-square flex flex-col justify-between relative overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,0.1)] border border-black/5 group"
            >
              {/* Terminal Overlay */}
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000 rotate-12 scale-150">
                <Shield size={240} strokeWidth={1} />
              </div>
              
              <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-20">
                  <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl">
                    <User size={24} strokeWidth={1} />
                  </div>
                  <div className="text-right">
                    <span className="font-tech text-black/20 text-[9px] tracking-[0.4em] uppercase mb-2 block">Member_Auth_Status</span>
                    <div className="px-5 py-2 rounded-full border border-black text-[9px] font-tech tracking-[0.3em] uppercase inline-block">
                       {profile?.role === 'admin' ? 'SYSTEM_ROOT' : 'AUTHENTICATED_NODE'}
                    </div>
                  </div>
                </div>
                
                <h2 className="text-5xl md:text-6xl font-display italic tracking-tightest mb-4 uppercase leading-none">
                  {profile?.displayName?.split(' ')[0] || 'Member'} <span className="opacity-20 font-sans italic">{profile?.displayName?.split(' ')[1] || ''}</span>
                </h2>
                <div className="flex items-center space-x-4">
                   <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                   <p className="font-tech text-[10px] text-black/40 tracking-[0.2em]">{profile?.email?.toUpperCase()}</p>
                </div>
              </div>

              <div className="relative z-10 pt-12 border-t border-black/5 flex justify-between items-end">
                <div className="space-y-2">
                  <p className="font-tech text-black/10 text-[8px] tracking-[0.4em]">NODE_IDENTIFICATION_HEX</p>
                  <p className="font-mono text-[11px] font-bold tracking-tighter text-black/40">{user?.uid.slice(0, 16).toUpperCase()}</p>
                </div>
                <div className="bg-black p-4 rounded-[2rem] shadow-2xl hover:scale-105 transition-transform duration-500">
                  <QRCodeSVG value={user?.uid || 'DINOSPY'} size={48} fgColor="#FFFFFF" bgColor="#000000" />
                </div>
              </div>
            </motion.div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 px-6">
                 <div className="w-1.5 h-1.5 bg-black rounded-full" />
                 <span className="font-tech text-black/20 text-[9px] tracking-[0.4em] uppercase">Security_Protocol_Interface</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {(profile?.role === 'admin' || user?.email === 'manikanta5sy@gmail.com') && (
                  <Link to="/admin" className="flex items-center justify-between p-8 bg-black text-white rounded-[3rem] hover:scale-[1.02] active:scale-[0.98] transition-all duration-700 shadow-2xl relative overflow-hidden group/admin border border-white/10">
                    <div className="absolute inset-0 bg-white/10 translate-x-full group-hover/admin:translate-x-0 transition-transform duration-700" />
                    <div className="flex items-center space-x-6 relative z-10">
                       <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          <Shield size={20} strokeWidth={1} />
                       </div>
                       <div className="space-y-1">
                          <p className="font-tech text-[10px] tracking-[0.4em]">ADMIN_COMMAND</p>
                          <p className="text-xs font-display italic tracking-tight opacity-40">System Core Terminal</p>
                       </div>
                    </div>
                    <ChevronRight size={20} strokeWidth={1} className="relative z-10" />
                  </Link>
                )}
                <button 
                  onClick={signOut}
                  className="w-full flex items-center justify-between p-8 bg-white border border-black/5 rounded-[3rem] hover:bg-black hover:text-white transition-all duration-700 shadow-sm relative overflow-hidden group/logout"
                >
                  <div className="flex items-center space-x-6 relative z-10 text-black group-hover/logout:text-white transition-colors">
                     <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center group-hover/logout:bg-white/10 transition-colors">
                        <LogOut size={20} strokeWidth={1} />
                     </div>
                     <div className="space-y-1 text-left">
                        <p className="font-tech text-[10px] tracking-[0.4em] group-hover/logout:text-white/60 transition-colors">TERMINATE_HANDSHAKE</p>
                        <p className="text-xs font-display italic tracking-tight opacity-40">Secure Session De-auth</p>
                     </div>
                  </div>
                  <ChevronRight size={20} strokeWidth={1} className="opacity-10 group-hover/logout:opacity-100 transition-all relative z-10" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Archives */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-b border-black/5 pb-16">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-black rounded-full animate-pulse shadow-2xl" />
                    <span className="font-tech text-black/20 text-[11px] tracking-[0.4em] font-black uppercase">LOGISTICS_CORE // VAULT_ACCESS</span>
                  </div>
                  <h1 className="text-7xl md:text-9xl font-display italic tracking-tightest leading-none">Archive <span className="opacity-20 font-sans italic">Locus.</span></h1>
                </div>
              </div>
              
              <div className="space-y-12">
                {loading ? (
                   <div className="py-40 flex flex-col items-center justify-center space-y-8">
                      <div className="relative">
                         <div className="w-24 h-24 border border-black/5 rounded-full" />
                         <div className="w-24 h-24 border-t-2 border-black rounded-full animate-spin absolute inset-0" />
                      </div>
                      <p className="font-tech text-black/20 text-[10px] tracking-[0.6em] animate-pulse uppercase font-black">Decrypting_Manifests...</p>
                   </div>
                ) : (
                  <div className="space-y-10">
                    {orders.length === 0 ? (
                       <div className="py-40 text-center bg-black/[0.01] rounded-[4rem] border border-black/5 relative overflow-hidden group">
                          <Package className="mx-auto mb-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000" size={160} strokeWidth={1} />
                          <p className="text-black/40 font-tech text-[10px] tracking-[0.6em] mb-12 font-black uppercase">EMPTY_VAULT_PROTOCOL</p>
                          <Link to="/explore" className="inline-flex items-center space-x-6 px-12 py-5 bg-black text-white rounded-full text-[10px] font-tech font-black tracking-[0.4em] hover:scale-105 active:scale-95 transition-all duration-700 shadow-2xl group/link">
                            <span>INITIATE_EXPLORATION</span>
                            <ArrowLeft size={16} className="rotate-180 group-hover/link:translate-x-2 transition-transform" />
                          </Link>
                       </div>
                    ) : (
                      orders.map((order) => (
                        <div key={order.id} className="p-8 md:p-14 rounded-[4rem] border border-black/5 bg-white hover:shadow-2xl transition-all duration-1000 group relative">
                          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none -rotate-12 translate-x-1/4 -translate-y-1/4 scale-150 group-hover:opacity-[0.05] transition-opacity duration-1000">
                             <Package size={300} />
                          </div>
                          
                          <div className="flex flex-col xl:flex-row justify-between gap-12 mb-16 relative z-10">
                            <div className="space-y-6">
                              <p className="font-tech text-black/20 text-[10px] tracking-[0.4em] font-black uppercase">MANIFEST_ID // DNX_{order.id.slice(-10).toUpperCase()}</p>
                              <h4 className="text-5xl md:text-7xl font-display italic tracking-tightest leading-none drop-shadow-2xl">Acquisition <span className="opacity-20 text-black font-sans">Unit.</span></h4>
                              <div className="flex flex-wrap items-center gap-4">
                                 <div className={`px-6 py-2 rounded-full text-[10px] font-tech font-black tracking-[0.2em] border transition-all duration-700 ${order.status === 'delivered' ? 'bg-black text-white border-black' : 'bg-white text-black border-black/10'}`}>
                                   {order.status.toUpperCase()}
                                 </div>
                                 <span className="text-[10px] font-tech font-bold text-black/20 tracking-[0.2em] uppercase">{new Date(order.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                              </div>
                            </div>

                            <div className="flex flex-col xl:items-end justify-between gap-8">
                              <span className="text-5xl md:text-7xl font-display italic tracking-tightest leading-none">₹{order.total.toLocaleString()}</span>
                              <button
                                onClick={() => downloadReceipt(order)}
                                className="flex items-center justify-center space-x-6 px-10 py-5 rounded-[2rem] bg-black text-white hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-700 group/btn"
                              >
                                <FileDown size={20} strokeWidth={1} className="group-hover/btn:-translate-y-1 transition-transform" />
                                <span className="font-tech text-[10px] font-black tracking-[0.4em]">EXPORT_MANIFEST</span>
                              </button>
                            </div>
                          </div>

                          {/* Refined Tracking Indicator */}
                          <div className="mb-16 relative z-10 p-10 bg-black/[0.02] rounded-[3rem] border border-black/5 overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-r from-black/[0.02] to-transparent pointer-events-none" />
                             <div className="relative h-1 bg-black/5 rounded-full mb-10 overflow-hidden">
                                <motion.div 
                                   initial={{ width: 0 }}
                                   whileInView={{ width: `${getStatusProgress(order.status)}%` }}
                                   transition={{ duration: 2, ease: "circOut" }}
                                   className="absolute top-0 left-0 h-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.2)]" 
                                />
                             </div>
                             <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                                {getStatusSteps().map((step) => {
                                   const currentIdx = getStatusSteps().findIndex(s => s.key === order.status);
                                   const stepIdx = getStatusSteps().findIndex(s => s.key === step.key);
                                   const isActive = stepIdx <= currentIdx;
                                   const isCurrent = stepIdx === currentIdx;
                                   
                                   return (
                                      <div key={step.key} className={`flex flex-col items-center space-y-4 transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-20'}`}>
                                         <div className={`w-3 h-3 rounded-full border-2 border-white transition-all duration-700 ${isCurrent ? 'bg-black scale-150 animate-pulse' : isActive ? 'bg-black' : 'bg-black/10 shadow-inner'}`} />
                                         <span className={`text-[8px] font-tech font-black uppercase tracking-[0.2em] text-center ${isCurrent ? 'text-black' : 'text-black/40'}`}>{step.label}</span>
                                      </div>
                                   );
                                })}
                             </div>
                          </div>

                          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-12 pt-12 border-t border-black/5 mt-auto relative z-10">
                             <div className="flex flex-wrap gap-6">
                                {order.items.slice(0, 3).map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center space-x-6 bg-white p-5 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl transition-all duration-700 group/item">
                                    <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-[#F9F9F9] relative">
                                       <img src={item.images?.[0]} className="w-full h-full object-cover grayscale brightness-110 group-hover/item:grayscale-0 transition-all duration-700" alt="" />
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-display font-black italic tracking-tight uppercase group-hover/item:text-black transition-colors">{item.name}</p>
                                      <p className="font-tech text-black/20 text-[9px] mt-2 font-black tracking-[0.2em]">UNIT_COUNT: 0{item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                   <div className="w-14 h-14 rounded-full border border-black/5 flex items-center justify-center font-tech text-[10px] text-black/20 bg-black/[0.01]">
                                      +{order.items.length - 3}
                                   </div>
                                )}
                             </div>
                             <div className="flex items-center justify-between xl:justify-end gap-12">
                                <div className="text-right space-y-2">
                                  <p className="font-tech text-black/20 text-[9px] font-black tracking-[0.4em] uppercase">Security_Key</p>
                                  <p className="font-mono text-3xl font-black tracking-[0.3em] leading-none text-black/80">{order.deliveryPin || 'PENDING'}</p>
                                </div>
                                <button 
                                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                  className={`w-20 h-20 rounded-full border flex items-center justify-center transition-all duration-1000 shadow-sm ${expandedOrderId === order.id ? 'bg-black text-white border-black scale-110' : 'bg-white text-black/20 border-black/5 hover:border-black/20 hover:text-black hover:scale-105'}`}
                                >
                                  <ChevronRight size={24} strokeWidth={1} className={`transition-transform duration-1000 ${expandedOrderId === order.id ? 'rotate-90' : ''}`} />
                                </button>
                             </div>
                          </div>

                          {expandedOrderId === order.id && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="pt-16 overflow-hidden"
                            >
                              <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 bg-black/[0.01] p-10 md:p-16 rounded-[5rem] border border-black/5 relative shadow-inner">
                                <div className="absolute inset-0 bg-white/20 pointer-events-none" />
                                <div className="lg:col-span-2 space-y-12 relative">
                                  <div className="absolute left-[9px] top-4 bottom-4 w-px bg-black/[0.05]" />
                                  <h5 className="font-tech text-[10px] text-black/20 tracking-[0.4em] font-black uppercase mb-12">LOGISTICS_TIMELINE</h5>
                                  {order.timeline?.slice().reverse().map((event: any, i: number) => (
                                    <div key={i} className="flex space-x-10 relative">
                                      <div className={`w-[18px] h-[18px] rounded-full border-4 flex-shrink-0 z-10 transition-all duration-1000 ${i === 0 ? 'bg-black border-white shadow-2xl scale-125' : 'bg-white border-black/5 translate-y-1'}`} />
                                      <div className="pb-4">
                                        <p className={`text-[12px] font-tech font-black tracking-[0.2em] ${i === 0 ? 'text-black' : 'text-black/20'}`}>{event.status.toUpperCase()}</p>
                                        <p className={`text-[13px] font-display italic mt-3 leading-relaxed tracking-tight ${i === 0 ? 'text-black/60' : 'text-black/20'}`}>{event.message}</p>
                                        <p className="font-mono text-[9px] text-black/10 mt-4 font-bold">{new Date(event.timestamp).toLocaleString().toUpperCase()}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="lg:col-span-3 space-y-12 relative">
                                  <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-8">
                                       <div className="flex items-center space-x-4">
                                          <div className="w-10 h-10 rounded-[1.2rem] bg-black text-white flex items-center justify-center shadow-2xl">
                                             <MapPin size={18} strokeWidth={1} />
                                          </div>
                                          <div>
                                             <span className="font-tech text-black/60 text-[10px] tracking-[0.3em] font-black uppercase block">REAL_TIME_TELEMETRICS</span>
                                             <span className="font-tech text-[8px] text-black/20 uppercase tracking-[0.2em]">Systems_Nominal</span>
                                          </div>
                                       </div>
                                       <div className="flex items-center space-x-3 bg-white px-5 py-2 rounded-full border border-black/5 shadow-sm">
                                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                          <span className="font-tech text-black/60 text-[9px] font-black tracking-widest">LIVE</span>
                                       </div>
                                    </div>
                                    <div className="rounded-[4rem] overflow-hidden grayscale border-[12px] border-white bg-white shadow-2xl relative aspect-video">
                                      <DeliveryMap status={order.status} orderId={order.id} />
                                      <div className="absolute inset-0 bg-black/[0.02] pointer-events-none" />
                                    </div>
                                  </div>
                                  <div className="bg-white p-10 rounded-[4rem] border border-black/5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-10">
                                    <div className="text-center sm:text-left space-y-4">
                                      <p className="font-tech text-[10px] text-black/40 mb-2 tracking-[0.4em] font-black uppercase underline decoration-black/10 underline-offset-8">Handshake_Mandate</p>
                                      <p className="text-[11px] font-display italic text-black/30 max-w-[280px] leading-relaxed">PRESENT THIS DIGITAL MANIFEST TO THE AGENT DURING PHYSICAL ARRIVAL. AUTHORIZATION PIN MUST BE EXCHANGED FOR CARGO RELEASE.</p>
                                    </div>
                                    <div className="p-6 border border-black/5 rounded-[3rem] bg-white shadow-2xl hover:scale-110 transition-transform duration-700">
                                      <QRCodeSVG 
                                        value={`${window.location.origin}/partner/${order.id}`} 
                                        size={80} 
                                        fgColor="#000000" 
                                        bgColor="#FFFFFF" 
                                        includeMargin={true}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
