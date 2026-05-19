import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, Package, Settings, LogOut, Shield, ChevronRight } from 'lucide-react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      window.location.reload(); // Quick way to refresh context
    } catch (err) {
      console.error(err);
      alert('Failed to update role.');
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
                       <span className="text-sm">{profile?.role === 'admin' ? 'Revoke Admin' : 'Elevate to Admin'}</span>
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
                                 {order.status}
                               </h4>
                               <div className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : 'bg-gold animate-pulse'}`} />
                            </div>
                            <p className="text-xs text-white/40 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-mono text-white block">₹{order.total.toLocaleString()}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1 block">Full Acquisition Value</span>
                          </div>
                        </div>

                        {/* Tracking Progress */}
                        <div className="mb-8 relative pt-4">
                           <div className="h-1 bg-white/5 rounded-full w-full absolute top-1/2 -translate-y-1/2" />
                           <div 
                              className="h-1 bg-gold rounded-full absolute top-1/2 -translate-y-1/2 transition-all duration-1000 shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
                              style={{ width: order.status === 'pending' ? '10%' : order.status === 'processing' ? '40%' : order.status === 'shipping' ? '70%' : '100%' }}
                           />
                           <div className="flex justify-between relative px-2">
                              {['Pending', 'Processing', 'Shipping', 'Delivered'].map((step) => {
                                 const isActive = order.status === step.toLowerCase() || (order.status === 'delivered') || (order.status === 'shipping' && step !== 'Delivered') || (order.status === 'processing' && (step === 'Pending' || step === 'Processing'));
                                 return (
                                    <div key={step} className="flex flex-col items-center">
                                       <div className={`w-3 h-3 rounded-full border-2 ${isActive ? 'bg-gold border-gold' : 'bg-luxury-black border-white/20'} z-10`} />
                                       <span className={`text-[8px] uppercase tracking-tighter mt-2 font-bold ${isActive ? 'text-gold' : 'text-white/20'}`}>{step}</span>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6 pt-6 border-t border-white/5">
                           <div className="flex flex-wrap gap-4 flex-grow">
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
                           <div className="flex flex-col items-center p-3 glass rounded-2xl border border-gold/10">
                              <p className="text-[8px] uppercase tracking-widest text-gold mb-2 font-bold">Logistics Passport</p>
                              <div className="bg-white p-1 rounded">
                                <QRCodeSVG value={`https://dinospy-logistics.com/track/${order.id}`} size={64} />
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
