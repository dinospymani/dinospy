import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Package, Settings, LogOut, Shield, ChevronRight, ArrowLeft, MessageSquare, ShieldAlert, Database, CreditCard, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
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

  const downloadReceipt = async (order: any) => {
    if (!order || !order.items) {
      toast.error('Manifest data corrupted. Cannot generate archive.');
      return;
    }

    try {
      const doc = new jsPDF();
      const black = [0, 0, 0];
      const gray = [100, 100, 100];

      // 1. Header Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(black[0], black[1], black[2]);
      doc.text('DINOSPY', 20, 25);
      
      doc.setFontSize(32);
      doc.text('Invoice', 190, 30, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('+91 98765 43210', 20, 32);
      doc.text('vault@dinospy.in', 20, 37);
      doc.text('Manufactured in Karnataka, India', 20, 42);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(black[0], black[1], black[2]);
      doc.text(`#${order.id?.slice(-5).toUpperCase() || 'N/A'}`, 190, 40, { align: 'right' });

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(20, 50, 190, 50);

      // 2. Billing Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Billing To:', 20, 65);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      // Left Column
      doc.text(`Client's name: ${profile?.displayName || 'Anonymous'}`, 20, 75);
      doc.text(`Address: ${order.shippingAddress?.address || 'N/A'}`, 20, 81);
      doc.text(`Payment Method: ${order.paymentMethod?.toUpperCase() || 'CARD'}`, 20, 87);

      // Right Column
      doc.text(`Phone: +91 ${order.customerPhone || order.shippingAddress?.phone || 'N/A'}`, 120, 75);
      doc.text(`Email: ${profile?.email || order.customerEmail || 'N/A'}`, 120, 81);
      doc.text(`Bank Name: Dinospy Global Vault`, 120, 87);

      // 3. Table Header & Items
      const tableData = (order.items || []).map((item: any) => [
        (item.name || 'UNKNOWN').toUpperCase(),
        `Rs. ${(item.price || 0).toLocaleString()}`,
        (item.quantity || 1).toString(),
        `Rs. ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 100,
        head: [['Description', 'Price (Rs)', 'QTY', 'Total (Rs)']],
        body: tableData,
        theme: 'plain',
        headStyles: { 
          fillColor: black as any, 
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'left'
        },
        styles: { fontSize: 9, cellPadding: 5, textColor: black as any },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { halign: 'right' },
          2: { halign: 'center' },
          3: { halign: 'right' }
        },
        margin: { left: 20, right: 20 },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === data.table.columns.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.line(data.settings.margin.left, data.cell.y + data.cell.height, 190, data.cell.y + data.cell.height);
          }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;

      // 4. Summary
      const orderTotal = order.totalAmount || order.total || 0;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('SUBTOTAL', 140, finalY);
      doc.text(`Rs. ${orderTotal.toLocaleString()}`, 190, finalY, { align: 'right' });
      
      doc.text('TAX', 140, finalY + 8);
      doc.text('Rs. 0.00', 190, finalY + 8, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TOTAL', 140, finalY + 18);
      doc.text(`Rs. ${orderTotal.toLocaleString()}`, 190, finalY + 18, { align: 'right' });

      // 5. Terms & Conditions
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMS & CONDITIONS:', 20, finalY + 40);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const terms = 'This manifest certifies the secure acquisition of horological assets. Every piece is guaranteed authentic. All sales are final under vault protocol. Heritage certificates provided upon request.';
      doc.text(doc.splitTextToSize(terms, 120), 20, finalY + 47);

      // 6. Footer
      doc.setDrawColor(0, 0, 0);
      doc.line(20, 280, 190, 280);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('f  x  @dinospy', 20, 287);
      doc.text('dinospy.in', 190, 287, { align: 'right' });

      doc.save(`DINOSPY_INVOICE_${order.id?.slice(0, 8) || 'ARCHIVE'}.pdf`);
      toast.success('Manifest exported.');
    } catch (err: any) {
      console.error('Archive Generation Error:', err);
      toast.error('The Vault AI failed to compile the PDF.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      <Navbar />
      
      <main className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-40 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
          
          {/* Identity Hub */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-stretch space-y-12 md:space-y-16">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-50 text-black p-8 md:p-10 rounded-[3rem] md:rounded-[4.5rem] w-full aspect-auto md:aspect-square flex flex-col justify-between relative overflow-hidden shadow-xl border border-black/5 group min-h-[350px] md:min-h-0"
            >
              <div className="absolute top-0 right-0 p-8 md:p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12 scale-150 text-black">
                <Shield size={180} strokeWidth={1} />
              </div>
              
              <div className="relative z-10 w-full text-center lg:text-left">
                <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start mb-12 md:mb-20 gap-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-black text-white rounded-full flex items-center justify-center shadow-2xl shrink-0">
                    <User size={24} strokeWidth={1} />
                  </div>
                  <div className="text-center lg:text-right">
                    <span className="font-mono text-black/20 text-[8px] md:text-[9px] tracking-[0.4em] uppercase mb-2 block font-bold">Member_Auth_Status</span>
                    <div className="px-4 md:px-6 py-2 rounded-full border border-black/20 text-black text-[8px] md:text-[9px] font-mono font-bold tracking-[0.3em] uppercase inline-block">
                       {profile?.role === 'admin' ? 'SYSTEM_ROOT' : 'AUTHENTICATED_NODE'}
                    </div>
                  </div>
                </div>
                
                <h2 className="text-[clamp(2.5rem,8vw,4.5rem)] md:text-7xl font-display font-medium tracking-tightest mb-6 uppercase leading-tight break-words">
                  {profile?.displayName?.split(' ')[0] || 'Member'} <br className="md:hidden" /> <span className="opacity-10 text-black italic">{profile?.displayName?.split(' ')[1] || ''}</span>
                </h2>
                <div className="flex items-center justify-center lg:justify-start space-x-4 md:space-x-6">
                   <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-black rounded-full animate-pulse shrink-0" />
                   <p className="font-mono text-[9px] md:text-xs text-black/40 tracking-[0.3em] font-bold break-all max-w-[250px] md:max-w-none">{profile?.email?.toUpperCase()}</p>
                </div>
              </div>

              <div className="relative z-10 pt-8 md:pt-12 border-t border-black/5 flex flex-col sm:flex-row justify-between items-center lg:items-end mt-8 md:mt-0 gap-8">
                <div className="space-y-2 md:space-y-3 text-center lg:text-left">
                  <p className="font-mono text-black/10 text-[8px] md:text-[9px] tracking-[0.5em] uppercase font-bold">Node_Identification</p>
                  <p className="font-mono text-[10px] md:text-sm font-bold tracking-tight text-black/30 break-all">{user?.uid?.slice(0, 16).toUpperCase() || 'ANONYMOUS_NODE'}</p>
                </div>
                <div className="bg-white p-4 md:p-5 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-black/5 group-hover:scale-110 transition-transform duration-700 shrink-0">
                  <QRCodeSVG value={user?.uid || 'DINOSPY'} size={40} fgColor="#000" bgColor="transparent" />
                </div>
              </div>
            </motion.div>

            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center space-x-6 px-6 md:px-8">
                 <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full" />
                 <span className="font-mono text-black opacity-40 text-[9px] md:text-[10px] tracking-[0.5em] uppercase font-bold">Security_Interfaces</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {(profile?.role === 'admin' || profile?.role === 'support' || user?.email === 'manikanta5sy@gmail.com') && (
                  <Link to="/admin" className="flex items-center justify-between p-6 md:p-10 bg-black text-white rounded-[2.5rem] md:rounded-[3.5rem] group/admin transition-all duration-700 hover:scale-[1.02] shadow-2xl">
                    <div className="flex items-center space-x-6 md:space-x-8">
                       <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
                          <Shield size={20} strokeWidth={1} />
                       </div>
                       <div className="space-y-1">
                          <p className="font-mono text-[9px] md:text-[10px] tracking-[0.4em] md:tracking-[0.5em] font-bold uppercase">Command_Core</p>
                          <p className="text-xs md:text-sm font-display italic opacity-60">Management & Support</p>
                       </div>
                    </div>
                    <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </Link>
                )}
                <Link 
                  to="/support"
                  className="w-full flex items-center justify-between p-6 md:p-10 bg-white border border-black/5 rounded-[2.5rem] md:rounded-[3.5rem] hover:bg-neutral-50 text-black transition-all duration-700 group/support shadow-xl"
                >
                  <div className="flex items-center space-x-6 md:space-x-8 text-black transition-colors">
                     <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/5 flex items-center justify-center border border-black/5 transition-colors shrink-0">
                        <MessageSquare size={20} strokeWidth={1} />
                     </div>
                     <div className="space-y-1 text-left">
                        <p className="font-mono text-[9px] md:text-[10px] tracking-[0.4em] md:tracking-[0.5em] font-bold uppercase transition-colors">Support_Hub</p>
                        <p className="text-xs md:text-sm font-display italic opacity-40">Report Issues & Tickets</p>
                     </div>
                  </div>
                  <ChevronRight size={20} strokeWidth={1} className="opacity-10 group-hover/support:opacity-100 group-hover/support:translate-x-2 transition-all" />
                </Link>
                <button 
                  onClick={signOut}
                  className="w-full flex items-center justify-between p-6 md:p-10 bg-neutral-50 border border-black/5 rounded-[2.5rem] md:rounded-[3.5rem] hover:bg-neutral-100 text-black transition-all duration-700 group/logout"
                >
                  <div className="flex items-center space-x-6 md:space-x-8 text-black group-hover/logout:text-black transition-colors">
                     <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center border border-black/5 transition-colors shrink-0">
                        <LogOut size={20} strokeWidth={1} />
                     </div>
                     <div className="space-y-1 text-left">
                        <p className="font-mono text-[9px] md:text-[10px] tracking-[0.4em] md:tracking-[0.5em] font-bold uppercase transition-colors">Terminate_Session</p>
                        <p className="text-xs md:text-sm font-display italic opacity-40">Secure Node De-auth</p>
                     </div>
                  </div>
                  <ChevronRight size={20} strokeWidth={1} className="opacity-10 group-hover/logout:opacity-100 group-hover/logout:translate-x-2 transition-all" />
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20 border-b border-black/5 pb-20 w-full">
                <div className="space-y-8">
                  <div className="flex items-center space-x-6">
                    <div className="w-4 h-4 bg-black rounded-full animate-pulse" />
                    <span className="font-mono text-black opacity-40 text-xs tracking-[0.6em] font-bold uppercase">ACQUISITION_LOGBOOKS // SEC_LEVEL_3</span>
                  </div>
                  <h1 className="text-[clamp(2.5rem,8vw,6rem)] md:text-9xl font-display leading-none tracking-tightest font-medium text-black">Vault <span className="opacity-10 text-black italic">Archives.</span></h1>
                </div>
              </div>
              
              {loading ? (
                 <div className="space-y-12">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="h-64 bg-neutral-50 rounded-[4rem] border border-black/5 animate-pulse" />
                   ))}
                 </div>
              ) : (
                <div className="space-y-12">
                  {orders.length === 0 ? (
                    <div className="p-8 md:p-32 text-center bg-neutral-50 rounded-[3rem] md:rounded-[5rem] border border-black/5 opacity-40 flex flex-col items-center justify-center min-h-[300px]">
                       <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-8">
                          <Activity size={32} className="text-black/20" />
                       </div>
                       <p className="font-display font-medium text-xl md:text-4xl mb-6">No historical records found.</p>
                       <Link to="/explore" className="font-mono text-[9px] md:text-xs tracking-[0.5em] uppercase hover:text-black transition-all duration-700 font-bold border-b border-black/10 pb-1">Initialize_Acquisition_01</Link>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-12 md:p-16 rounded-[5rem] border border-black/5 bg-white hover:shadow-2xl transition-all duration-1000 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none -rotate-12 translate-x-1/4 -translate-y-1/4 scale-150 group-hover:opacity-[0.05] transition-all duration-1000 text-black">
                           <Package size={400} />
                        </div>
                        
                        <div className="flex flex-col xl:flex-row justify-between gap-12 mb-20 relative z-10">
                          <div className="space-y-8">
                            <p className="font-mono text-black opacity-40 text-xs tracking-[0.5em] font-bold uppercase">MANIFEST_ID // DNX_{order.id?.slice(-10).toUpperCase() || 'UNKNOWN'}</p>
                            <h4 className="text-6xl md:text-8xl font-display font-medium tracking-tightest leading-none text-black">Record <span className="opacity-10 text-black italic">Item.</span></h4>
                            <div className="flex flex-wrap items-center gap-6">
                               <div className={`px-8 py-3 rounded-full text-xs font-mono font-bold tracking-widest uppercase border transition-all duration-1000 ${order.status === 'delivered' ? 'bg-black text-white border-black' : 'bg-neutral-50 text-black/60 border-black/10'}`}>
                                 {order.status.toUpperCase()}
                               </div>
                               <span className="text-xs font-mono font-bold text-black/20 tracking-[0.3em] uppercase">{new Date(order.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row xl:flex-col items-start md:items-center xl:items-end justify-between gap-10">
                            <span className="text-6xl md:text-8xl font-display font-medium tracking-tightest leading-none text-black">Rs. {order.total.toLocaleString()}</span>
                            <div className="flex flex-wrap items-center justify-end gap-4 md:gap-6">
                               <Link
                                 to="/support"
                                 className="px-6 py-4 rounded-3xl bg-neutral-50 border border-black/5 text-[8px] font-mono font-bold tracking-[0.3em] uppercase hover:bg-black hover:text-white transition-all duration-700"
                               >
                                 REPORT_ISSUE
                               </Link>
                               <button
                                 onClick={() => downloadReceipt(order)}
                                 className="flex items-center justify-center space-x-4 px-10 py-5 rounded-3xl bg-white border border-black/5 text-black/40 hover:text-black hover:border-black transition-all duration-700 font-bold group/btn"
                               >
                                 <FileDown size={18} strokeWidth={1.5} className="group-hover/btn:-translate-y-1 transition-transform" />
                                 <span className="font-mono text-xs tracking-[0.4em]">MANIFEST</span>
                               </button>
                               <button 
                                 onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                 className={`w-14 h-14 rounded-3xl flex items-center justify-center border transition-all duration-700 ${expandedOrderId === order.id ? 'bg-black border-black text-white' : 'bg-white border-black/5 text-black/40 hover:border-black hover:text-black'}`}
                               >
                                  <motion.div animate={{ rotate: expandedOrderId === order.id ? 180 : 0 }}>
                                    <ChevronRight size={24} className="rotate-90" />
                                  </motion.div>
                               </button>
                            </div>
                          </div>
                        </div>

                        {/* Order Timeline Visualizer */}
                        <div className="mb-20 relative z-10 p-12 bg-neutral-50 rounded-[3.5rem] border border-black/5 overflow-hidden">
                           <div className="relative h-1.5 bg-black/[0.05] rounded-full mb-12 overflow-hidden">
                              <motion.div 
                                 initial={{ width: 0 }}
                                 whileInView={{ width: `${getStatusProgress(order.status)}%` }}
                                 transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                                 className="absolute top-0 left-0 h-full bg-black" 
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
                                       <div className={`w-4 h-4 rounded-full border-4 border-neutral-50 transition-all duration-1000 ${isCurrent ? 'bg-black scale-150' : isActive ? 'bg-black' : 'bg-black/10'}`} />
                                       <span className={`text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-center ${isCurrent ? 'text-black' : 'text-black/40'}`}>{step.label}</span>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>

                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-12 pt-12 border-t border-black/5 mt-auto relative z-10">
                             <div className="flex flex-wrap gap-6">
                                {(order.items || []).slice(0, 3).map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center space-x-6 bg-neutral-50 p-6 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl transition-all duration-1000 group/item">
                                    <div className="w-16 h-20 rounded-[1.5rem] overflow-hidden bg-white relative flex items-center justify-center border border-black/5">
                                       {item.images && item.images.length > 0 ? (
                                         <img 
                                           src={item.images[0]} 
                                           alt={item.name}
                                           className="w-full h-full object-contain p-2 group-hover/item:scale-110 transition-transform duration-1000"
                                           referrerPolicy="no-referrer"
                                         />
                                       ) : (
                                         <span className="font-display text-2xl opacity-10 group-hover/item:opacity-30 transition-opacity font-bold uppercase">{item.name?.[0] || 'D'}</span>
                                       )}
                                       <div className="absolute inset-0 opacity-[0.02]" 
                                            style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                                    </div>
                                    <div>
                                      <p className="text-[13px] font-display font-medium tracking-tight uppercase text-black/80 group-hover/item:text-black transition-colors">{item.name}</p>
                                      <p className="font-mono text-black opacity-30 text-[9px] mt-2 font-bold tracking-[0.3em]">QTY: 0{item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                             </div>
                             <div className="flex items-center justify-between xl:justify-end gap-12">
                                <div className="text-right space-y-2">
                                  <p className="font-mono text-black/20 text-[9px] font-bold tracking-[0.4em] uppercase">Auth_Pin</p>
                                  <p className="font-mono text-4xl font-bold tracking-[0.3em] leading-none text-black">{order.deliveryPin || 'SYNC'}</p>
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
                               <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 bg-neutral-50 p-10 md:p-16 rounded-[5rem] border border-black/5 relative">
                                  <div className="lg:col-span-2 space-y-12">
                                    <h5 className="font-mono text-[10px] text-black opacity-20 tracking-[0.4em] font-bold uppercase mb-12">LOGISTICS_TIMELINE</h5>
                                    {(order.timeline || []).slice().reverse().map((event: any, i: number) => (
                                      <div key={i} className="flex space-x-10 relative">
                                        <div className={`w-[14px] h-[14px] rounded-full flex-shrink-0 z-10 ${i === 0 ? 'bg-black' : 'bg-black/10'}`} />
                                        <div className="pb-10">
                                          <p className={`text-[12px] font-mono font-bold tracking-[0.2em] ${i === 0 ? 'text-black' : 'text-black/20'}`}>{event.status.toUpperCase()}</p>
                                          <p className={`text-[13px] font-display mt-3 leading-relaxed tracking-tight font-medium ${i === 0 ? 'text-black/60' : 'text-black/20'}`}>{event.message}</p>
                                          <p className="font-mono text-[9px] text-black/10 mt-4 font-bold">{new Date(event.timestamp).toLocaleString().toUpperCase()}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="lg:col-span-3 space-y-12">
                                     <div className="rounded-[4rem] overflow-hidden border-[12px] border-white bg-white shadow-2xl relative aspect-video">
                                        <DeliveryMap status={order.status} orderId={order.id} />
                                     </div>
                                     <div className="bg-white p-12 rounded-[4rem] border border-black/5 flex flex-col sm:flex-row items-center justify-between gap-12 shadow-sm">
                                        <div className="text-center sm:text-left space-y-6">
                                           <div className="flex items-center space-x-4">
                                              <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                                              <p className="font-mono text-[10px] text-black opacity-40 tracking-[0.4em] font-bold uppercase">HANDSHAKE_PROTOCOL</p>
                                           </div>
                                           <p className="text-[12px] font-display font-medium text-black/40 leading-relaxed max-w-sm">PRESENT THIS DIGITAL MANIFEST FOR SECURE CARGO AUTHORIZATION. PIN EXCHANGE IS MANDATORY.</p>
                                        </div>
                                        <div className="p-6 bg-white rounded-[3rem] border border-black/5 shadow-inner">
                                           <QRCodeSVG value={`${window.location.origin}/partner/${order.id}`} size={80} fgColor="#000" bgColor="transparent" />
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
