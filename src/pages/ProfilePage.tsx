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
          <div className="lg:col-span-4 space-y-8 md:space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black text-white p-6 md:p-10 rounded-[2.5rem] aspect-square md:aspect-[1.6/1] flex flex-col justify-between relative overflow-hidden shadow-2xl group"
            >
              <div className="absolute top-0 right-0 p-8 md:p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-1000 rotate-12">
                <Shield size={240} />
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-16 md:mb-12">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md">
                    <User className="text-white/60" size={20} />
                  </div>
                  <div className="text-right">
                    <p className="font-tech text-white/20 text-[7px] md:text-[8px] mb-1">MEMBER_CLASS</p>
                    <p className="font-display italic text-base md:text-lg uppercase tracking-widest text-white/90">{profile?.role || 'CLIENT'}</p>
                  </div>
                </div>
                
                <h2 className="text-2xl md:text-4xl font-display italic tracking-tightest mb-2 uppercase leading-none">{profile?.displayName || 'DINOSPY Member'}</h2>
                <p className="font-mono text-[8px] md:text-[10px] text-white/30 tracking-[0.2em]">{profile?.email?.toUpperCase()}</p>
              </div>

              <div className="relative z-10 pt-8 border-t border-white/5 flex justify-between items-end">
                <div>
                  <p className="font-tech text-white/10 text-[7px] mb-1">AUTH_INDEX</p>
                  <p className="font-mono text-[9px] md:text-[10px] opacity-40">{user?.uid.slice(0, 12).toUpperCase()}</p>
                </div>
                <div className="bg-white p-1.5 rounded-xl opacity-80 hover:opacity-100 transition-opacity duration-500">
                  <QRCodeSVG value={user?.uid || 'DINOSPY'} size={44} />
                </div>
              </div>
            </motion.div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3 px-2">
                 <div className="w-1.5 h-1.5 bg-black rounded-full" />
                 <span className="font-tech text-black/20 text-[10px]">TERMINAL_ACCESS</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {profile?.role === 'admin' && user?.email === 'manikanta5sy@gmail.com' && (
                  <Link to="/admin" className="flex items-center justify-between p-6 bg-black text-white rounded-[2.5rem] hover:scale-[1.02] transition-all duration-700 shadow-xl group">
                    <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform duration-700">
                          <Shield size={18} />
                       </div>
                       <span className="font-tech text-[10px] tracking-widest">COMMAND_CENTER</span>
                    </div>
                    <ChevronRight size={16} />
                  </Link>
                )}
                <button 
                  onClick={signOut}
                  className="w-full flex items-center justify-between p-6 bg-white border border-black/5 rounded-[2.5rem] hover:bg-red-500 hover:text-white transition-all duration-700 group hover:border-red-500"
                >
                  <div className="flex items-center space-x-4">
                     <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center group-hover:rotate-12 transition-transform duration-700 group-hover:bg-white/20">
                        <LogOut size={18} />
                     </div>
                     <span className="font-tech text-[10px] tracking-widest">TERMINATE_SESSION</span>
                  </div>
                  <ChevronRight size={16} className="opacity-20" />
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-b border-black/5 pb-12">
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                    <span className="font-tech text-black/20 text-[10px]">MANIFEST_VAULT // ACQUISITIONS</span>
                  </div>
                  <h1 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none">Archive <span className="opacity-20">Locus.</span></h1>
                </div>
              </div>
              
              <div className="space-y-8">
                {loading ? (
                   <div className="py-40 flex flex-col items-center justify-center space-y-6">
                      <div className="relative">
                         <div className="w-16 h-16 border border-black/5 rounded-full" />
                         <div className="w-16 h-16 border-t-2 border-black rounded-full animate-spin absolute inset-0" />
                      </div>
                      <p className="font-tech text-black/20 text-[10px] tracking-[0.4em] animate-pulse">ACCESSING_DEEP_STORAGE</p>
                   </div>
                ) : (
                  <div className="space-y-6 md:space-y-8">
                    {orders.length === 0 ? (
                       <div className="py-32 text-center bg-black/[0.01] rounded-[3rem] border border-black/5">
                          <Package className="mx-auto mb-8 opacity-[0.03]" size={120} />
                          <p className="text-black/40 font-tech text-[10px] tracking-[0.4em] mb-12">EMPTY_MANIFEST</p>
                          <Link to="/" className="inline-flex items-center space-x-3 px-8 py-4 bg-black text-white rounded-full text-[10px] font-tech tracking-widest hover:scale-105 transition-all duration-700">
                            <span>INITIATE_EXPLORATION</span>
                            <ArrowLeft size={14} className="rotate-180" />
                          </Link>
                       </div>
                    ) : (
                      orders.map((order) => (
                        <div key={order.id} className="p-6 md:p-10 rounded-[2.5rem] border border-black/5 bg-white hover:shadow-2xl transition-all duration-700 group overflow-hidden relative">
                          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none -rotate-12 translate-x-1/4 -translate-y-1/4 scale-150">
                             <Package size={200} />
                          </div>
                          
                          <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-12 mb-12 relative z-10">
                            <div className="space-y-4">
                              <p className="font-tech text-black/20 text-[8px] md:text-[9px]">IDENT_NUMBER // {order.id.slice(-8).toUpperCase()}</p>
                              <h4 className="text-3xl md:text-5xl font-display italic tracking-tightest leading-none">Manifest <span className="opacity-20 text-black">Log.</span></h4>
                              <div className="flex items-center space-x-3">
                                 <div className={`px-5 py-2 rounded-full text-[9px] md:text-[10px] font-tech border transition-all ${order.status === 'delivered' ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20' : 'bg-black text-white border-black shadow-lg shadow-black/10'}`}>
                                   {order.status.toUpperCase()}
                                 </div>
                                 <span className="text-[10px] font-tech text-black/20">{new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex flex-col md:items-end justify-between">
                              <span className="text-4xl md:text-5xl font-display mb-6 tracking-tightest leading-none">₹{order.total.toLocaleString()}</span>
                              <button
                                onClick={() => downloadReceipt(order)}
                                className="flex items-center justify-center space-x-4 px-6 py-4 rounded-2xl bg-black/[0.02] border border-black/5 text-black/40 hover:bg-black hover:text-white transition-all duration-700 group/btn"
                              >
                                <FileDown size={16} className="group-hover/btn:-translate-y-1 transition-transform" />
                                <span className="font-tech text-[10px] tracking-widest">DOWNLOAD_ARCHIVE</span>
                              </button>
                            </div>
                          </div>

                          {/* Progress Line */}
                          <div className="mb-12 relative px-2">
                             <div className="h-[1px] bg-black/[0.03] rounded-full w-full absolute top-1/2 -translate-y-1/2" />
                             <div 
                                className="h-[1px] bg-black/40 rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-1000" 
                                style={{ width: `${getStatusProgress(order.status)}%` }}
                             />
                             <div className="flex justify-between relative">
                                {getStatusSteps().map((step) => {
                                   const currentIdx = getStatusSteps().findIndex(s => s.key === order.status);
                                   const stepIdx = getStatusSteps().findIndex(s => s.key === step.key);
                                   const isActive = stepIdx <= currentIdx;
                                   
                                   return (
                                      <div key={step.key} className="flex flex-col items-center">
                                         <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-700 ${isActive ? 'bg-black border-black scale-125' : 'bg-white border-black/10'} z-10`} />
                                         <span className={`text-[8px] font-tech mt-5 hidden lg:block uppercase tracking-widest ${isActive ? 'text-black' : 'text-black/10'}`}>{step.label}</span>
                                      </div>
                                   );
                                })}
                             </div>
                          </div>

                          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-8 pt-10 border-t border-black/5 mt-auto relative z-10">
                             <div className="flex flex-wrap gap-4">
                                {order.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center space-x-4 bg-black/[0.01] p-4 rounded-3xl border border-black/5 w-fit hover:bg-white transition-colors">
                                    <img src={item.images?.[0]} className="w-14 h-14 object-cover rounded-2xl grayscale" alt="" />
                                    <div>
                                      <p className="text-sm font-display italic tracking-tight uppercase">{item.name}</p>
                                      <p className="font-tech text-text/20 text-[8px] mt-1">U_COUNT: {item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                             </div>
                             <div className="flex items-center justify-between md:justify-end gap-8">
                                <div className="text-right">
                                  <p className="font-tech text-black/20 text-[8px] mb-1 uppercase">AUTH_TOKEN</p>
                                  <p className="font-mono text-2xl font-black tracking-widest leading-none">{order.deliveryPin || 'SYNC'}</p>
                                </div>
                                <button 
                                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                  className={`w-16 h-16 rounded-full border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-700 ${expandedOrderId === order.id ? 'bg-black text-white' : ''}`}
                                >
                                  <ChevronRight className={`transition-transform duration-700 ${expandedOrderId === order.id ? 'rotate-90' : ''}`} />
                                </button>
                             </div>
                          </div>

                          {expandedOrderId === order.id && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="pt-12 overflow-hidden"
                            >
                              <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 bg-black/[0.01] p-8 md:p-12 rounded-[3.5rem] border border-black/5">
                                <div className="lg:col-span-2 space-y-8 relative">
                                  <div className="absolute left-2.5 top-2.5 bottom-2.5 w-px bg-black/[0.05]" />
                                  {order.timeline?.slice().reverse().map((event: any, i: number) => (
                                    <div key={i} className="flex space-x-8 relative">
                                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 z-10 transition-all duration-700 ${i === 0 ? 'bg-black border-black shadow-[0_0_15px_rgba(0,0,0,0.2)]' : 'bg-white border-black/20'}`} />
                                      <div className="pb-2">
                                        <p className={`text-[11px] font-tech tracking-widest ${i === 0 ? 'text-black font-bold' : 'text-black/30'}`}>{event.status.toUpperCase()}</p>
                                        <p className={`text-[11px] font-display italic mt-2 leading-relaxed tracking-tight ${i === 0 ? 'text-black/60' : 'text-black/20'}`}>{event.message}</p>
                                        <p className="text-[8px] font-tech text-black/10 mt-3">{new Date(event.timestamp).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="lg:col-span-3 space-y-8">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                       <div className="flex items-center space-x-3">
                                          <MapPin size={16} className="text-black/40" />
                                          <span className="font-tech text-black/40 text-[10px] tracking-[0.2em]">LIVE_TELEMETRICS</span>
                                       </div>
                                       <div className="flex items-center space-x-2">
                                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                          <span className="font-tech text-green-500 text-[10px]">NOMINAL</span>
                                       </div>
                                    </div>
                                    <div className="rounded-[2.5rem] overflow-hidden grayscale border border-black/10 bg-white">
                                      <DeliveryMap status={order.status} orderId={order.id} />
                                    </div>
                                  </div>
                                  <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-8">
                                    <div className="text-center sm:text-left">
                                      <p className="font-tech text-[9px] text-black/20 mb-2 tracking-widest">MANDATE_QR_SYNC</p>
                                      <p className="text-[10px] font-display italic text-black/40 max-w-[200px] leading-relaxed">Present this terminal protocol to the dispatcher for final handshake verification.</p>
                                    </div>
                                    <div className="p-3 border border-black/5 rounded-[2rem] bg-white shadow-xl">
                                      <QRCodeSVG value={`${window.location.origin}/partner/${order.id}`} size={64} />
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
