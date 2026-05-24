import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, CheckCircle2, Truck, AlertCircle, ChevronRight, MapPin, ArrowLeft } from 'lucide-react';
import { db } from '../context/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PartnerPortal() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      try {
        const snap = await getDoc(doc(db, 'orders', orderId));
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to retrieve order data');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || pin !== order.deliveryPin) {
      toast.error('Invalid Acquisition PIN. Verification failed.');
      return;
    }

    setIsVerifying(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        timeline: arrayUnion({
          status: 'delivered',
          timestamp: new Date().toISOString(),
          message: 'Secure acquisition verified. Asset released to customer.'
        })
      });
      setIsConfirmed(true);
      toast.success('Delivery Verified Successfully');
    } catch (err) {
      toast.error('Failed to update delivery status');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-luxury-black flex flex-col items-center justify-center p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-display mb-2">Invalid Logistics ID</h2>
        <p className="text-white/40 mb-8">This asset identifier does not exist in our secure vault.</p>
        <button onClick={() => navigate('/')} className="gold-text uppercase tracking-widest font-bold">Return to Main Terminal</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-40 px-4">
        <div className="max-w-xl mx-auto space-y-8">
          <div className="mb-4">
            <button 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-white/60 hover:text-gold transition-colors p-2 -ml-2"
            >
                <ArrowLeft size={20} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Main Console</span>
            </button>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-gold/10 rounded-full border border-gold/20 mb-6 font-mono text-[10px] text-gold tracking-widest uppercase">
              <Shield size={14} className="mr-2" />
              Logistics Peer Verification
            </div>
            <h1 className="text-4xl font-display mb-2">Asset Release</h1>
            <p className="text-white/40 uppercase tracking-widest text-[10px]">Logistics ID: DNX-{order.id.slice(0, 8).toUpperCase()}</p>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-8">
            <div className="flex items-start space-x-6 pb-8 border-b border-white/5">
              <div className="w-20 h-20 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={order.items[0].images[0]} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-bold mb-1">{order.customerName}</h3>
                <p className="text-xs text-white/40 flex items-center mb-4">
                  <MapPin size={12} className="mr-1" />
                  {order.shippingAddress.city}, IND
                </p>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item: any, i: number) => (
                    <span key={i} className="text-[8px] uppercase tracking-widest bg-white/5 px-2 py-1 rounded-full border border-white/10">
                      {item.name} x{item.quantity}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {isConfirmed ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6"
              >
                <div className="w-20 h-20 bg-green-500/10 rounded-full border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={40} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-display">Acquisition Released</h3>
                <p className="text-white/40 text-sm max-w-[280px] mx-auto">Asset hand-over confirmed and logged in biological history.</p>
                <button 
                  onClick={() => navigate('/')} 
                  className="w-full py-4 glass border border-white/10 rounded-2xl uppercase tracking-[0.3em] text-[10px] font-bold hover:bg-white/5 transition-all"
                >
                  Close Terminal
                </button>
              </motion.div>
            ) : (
              <div className="space-y-8">
                <div className="bg-gold/5 border border-gold/10 p-6 rounded-2xl">
                  <p className="text-[10px] uppercase font-black tracking-widest text-gold text-center mb-4">Verification Required</p>
                  <p className="text-xs text-white/60 leading-relaxed text-center">
                    Ask the recipient for their unique 6-digit **Acquisition PIN** found in their DINOSPY Profile history.
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 ml-2">Acquisition PIN</label>
                    <input 
                      type="text"
                      maxLength={6}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center text-3xl font-mono tracking-[1em] focus:border-gold outline-none transition-all placeholder:text-white/5"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isVerifying || pin.length !== 6}
                    className="w-full py-6 gold-gradient text-luxury-black font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl shadow-xl shadow-gold/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    {isVerifying ? 'Verifying PIN...' : 'Authorize Release'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
