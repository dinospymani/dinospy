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
    <div className="min-h-screen flex flex-col bg-luxury-black text-white">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div className="glass p-8 rounded-[2.5rem] border border-white/10 text-center">
              <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/20">
                <User className="text-gold" size={40} />
              </div>
              <h2 className="text-xl font-display mb-1">{profile?.displayName || 'DINOSPY Member'}</h2>
              <p className="text-white/40 text-xs uppercase tracking-widest">{profile?.role || 'Guest'}</p>
              
              <button 
                onClick={signOut}
                className="mt-8 flex items-center justify-center w-full space-x-2 text-red-500 hover:text-red-400 transition-colors text-sm font-bold uppercase tracking-widest"
              >
                <LogOut size={16} />
                <span>Terminate Session</span>
              </button>
            </div>

            <div className="glass p-8 rounded-[2.5rem] border border-white/10">
              <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-6">Internal Access</h3>
              <div className="space-y-2">
                {profile?.role === 'admin' && user?.email === 'manikanta5sy@gmail.com' && (
                  <Link to="/admin" className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                    <div className="flex items-center space-x-3">
                       <Shield size={18} className="text-gold" />
                       <span className="text-sm">Command Center</span>
                    </div>
                    <ChevronRight size={14} className="text-white/20 group-hover:text-gold transition-colors" />
                  </Link>
                )}
                {user?.email === 'manikanta5sy@gmail.com' && (
                  <button 
                    onClick={toggleAdmin}
                    className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center space-x-3 text-white/60 group-hover:text-white">
                       <Settings size={18} />
                       <span className="text-sm">{profile?.role === 'admin' ? 'Relinquish Oversight' : 'Acquire Oversight'}</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-8">
                <button 
                  onClick={() => window.history.back()}
                  className="flex items-center space-x-2 text-white/60 hover:text-gold transition-colors p-2 -ml-2"
                >
                  <ArrowLeft size={20} />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Return</span>
                </button>
              </div>
              <h1 className="text-5xl font-display gold-text mb-12">Your Heritage</h1>
              
              <div className="space-y-6">
                <h3 className="text-xl font-bold uppercase tracking-widest flex items-center">
                  <Package className="mr-3 text-gold" size={24} />
                  Acquisition History
                </h3>

                {loading ? (
                   <p className="py-20 text-center text-white/20">Accessing archives...</p>
                ) : orders.length === 0 ? (
                   <div className="glass p-16 rounded-[3rem] text-center border border-white/5">
                      <p className="text-white/40 mb-8">No previous acquisitions found in your name.</p>
                      <Link to="/" className="gold-text font-bold uppercase tracking-widest hover:underline">Explore Boutique</Link>
                   </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {orders.map((order) => (
                      <div key={order.id} className="glass p-8 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40">Order #{order.id.slice(-6)}</p>
                            <div className="flex items-center space-x-2 mt-1">
                               <h4 className={`text-lg font-bold uppercase tracking-widest ${order.status === 'delivered' ? 'text-green-500' : 'text-gold'}`}>
                                 {order.status.replace('_', ' ')}
                               </h4>
                               <div className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : 'bg-gold animate-pulse'}`} />
                            </div>
                            <p className="text-xs text-white/40 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="text-2xl font-mono text-white block">₹{order.total.toLocaleString()}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1 block">Full Acquisition Value</span>
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => downloadReceipt(order)}
                              className="mt-4 flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest font-bold hover:bg-gold/10 hover:border-gold/30 transition-all text-white/60 hover:text-gold"
                            >
                              <FileDown size={14} />
                              <span>Download PDF Receipt</span>
                            </motion.button>
                          </div>
                        </div>

                        {/* Tracking Progress */}
                        <div className="mb-12 relative pt-4">
                           <div className="h-1 bg-white/5 rounded-full w-full absolute top-1/2 -translate-y-1/2" />
                           <div 
                              className="h-1 bg-gold rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-1000 shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
                              style={{ width: `${getStatusProgress(order.status)}%` }}
                           />
                           <div className="flex justify-between relative px-1">
                              {getStatusSteps().map((step) => {
                                 const currentIdx = getStatusSteps().findIndex(s => s.key === order.status);
                                 const stepIdx = getStatusSteps().findIndex(s => s.key === step.key);
                                 const isActive = stepIdx <= currentIdx;
                                 
                                 return (
                                    <div key={step.key} className="flex flex-col items-center">
                                       <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${isActive ? 'bg-gold border-gold scale-125 shadow-[0_0_8px_rgba(212,175,55,1)]' : 'bg-luxury-black border-white/10'} z-10`} />
                                       <span className={`text-[7px] uppercase tracking-tighter mt-3 font-black whitespace-nowrap ${isActive ? 'text-gold' : 'text-white/10'}`}>{step.label}</span>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>

                        {/* Expandable Tracking Detail */}
                        {expandedOrderId === order.id && order.timeline && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="bg-white/[0.02] border-y border-white/5 p-8 mb-8 space-y-6"
                          >
                            <div className="flex justify-between items-center mb-8">
                               <h5 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/40">Logistics Timeline</h5>
                               {order.trackingId && (
                                 <div className="text-right">
                                    <span className="text-[8px] uppercase tracking-widest text-white/20 block mb-1">Carrier: {order.carrier}</span>
                                    <span className="text-[10px] font-mono text-gold/80 block"># {order.trackingId}</span>
                                 </div>
                               )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                              <div className="space-y-8 relative">
                                <div className="absolute left-2 top-2 bottom-2 w-px bg-white/5" />
                                {order.timeline.slice().reverse().map((event: any, i: number) => (
                                  <div key={i} className="flex space-x-6 relative">
                                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 z-10 transition-colors ${i === 0 ? 'bg-gold border-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'bg-luxury-black border-white/20'}`} />
                                    <div className="flex-grow pt-0">
                                      <div className="flex justify-between items-start">
                                        <p className={`text-xs font-bold uppercase tracking-widest ${i === 0 ? 'text-white' : 'text-white/40'}`}>
                                          {event.status.replace('_', ' ')}
                                        </p>
                                        <span className="text-[8px] font-mono text-white/20">{new Date(event.timestamp).toLocaleString()}</span>
                                      </div>
                                      <p className={`text-[10px] mt-1 leading-relaxed ${i === 0 ? 'text-white/60' : 'text-white/20'}`}>
                                        {event.message}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-2">
                                   <MapPin size={16} className="text-gold" />
                                   <h6 className="text-[10px] uppercase tracking-widest font-black text-white/60">Live Deployment Status</h6>
                                </div>
                                <DeliveryMap status={order.status} orderId={order.id} />
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                   <p className="text-[9px] text-white/40 leading-relaxed italic">
                                      Real-time courier telemetrics provided via DINOSPY Secure Channel. Deployment route optimized for heritage asset safety.
                                   </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6 pt-6 border-t border-white/5">
                           <div className="flex flex-col space-y-4 flex-grow w-full">
                              <div className="flex flex-wrap gap-4">
                                {order.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center space-x-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                                    <img src={item.images[0]} className="w-10 h-10 object-cover rounded-lg" alt="" />
                                    <div>
                                      <p className="text-xs font-bold">{item.name}</p>
                                      <p className="text-[10px] text-white/40">Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <button 
                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                className="w-fit text-[10px] font-black uppercase tracking-[0.2em] text-gold/60 hover:text-gold transition-colors flex items-center"
                              >
                                {expandedOrderId === order.id ? 'Hide Logistics Intel' : 'Analyze Delivery Assets'}
                                <ChevronRight size={12} className={`ml-1 transition-transform ${expandedOrderId === order.id ? '-rotate-90' : 'rotate-90'}`} />
                              </button>
                           </div>
                           <div className="flex flex-col items-center p-3 glass rounded-2xl border border-gold/10">
                              <p className="text-[8px] uppercase tracking-widest text-gold mb-1 font-bold">Acquisition PIN</p>
                              <div className="text-xl font-mono font-black text-white mb-2 tracking-widest">{order.deliveryPin || 'PENDING'}</div>
                              <p className="text-[7px] uppercase tracking-widest text-white/40 mb-2">Show to Courier Agent</p>
                              <div className="bg-white p-1 rounded">
                                <QRCodeSVG value={`${window.location.origin}/partner/${order.id}`} size={64} />
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
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
