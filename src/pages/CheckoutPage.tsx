import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, CreditCard, ShieldCheck, Truck, Phone, CheckCircle2, AlertTriangle, Key, Mail, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth, db } from '../context/AuthContext';
import { collection, doc, runTransaction, getDoc, getDocs, query, where } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'sonner';
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, coupon, applyCoupon, removeCoupon } = useCart();
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const savings = subtotal - cartTotal;
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase().trim()), where('active', '==', true));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error('Invalid coupon: This coupon code does not exist in our registries.');
        return;
      }

      const couponData = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;

      if (couponData.expiry && new Date(couponData.expiry) < new Date()) {
        toast.error('Coupon expired: This promotional offer has closed.');
        return;
      }

      if (couponData.minAmount && subtotal < couponData.minAmount) {
        toast.error(`Requirement not met: Min purchase of ₹${couponData.minAmount.toLocaleString()} required.`);
        return;
      }

      applyCoupon(couponData);
      toast.success('Valid coupon applied');
      setCouponCode('');
    } catch (err) {
      toast.error('Security handshake failed during coupon validation.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const [formData, setFormData] = useState({
    fullName: profile?.displayName || '',
    email: profile?.email || '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: 'India'
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.address || !formData.city || !formData.phone || !formData.fullName || !formData.zip) {
      toast.error('Complete contact and address details required');
      return;
    }

    if (formData.fullName.trim().length < 3) {
      toast.error('Full name is too short. Minimum 3 characters required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Invalid email format detected.');
      return;
    }

    if (formData.phone.length !== 10) {
      toast.error('WhatsApp number must be exactly 10 digits.');
      return;
    }

    if (formData.zip.trim().length < 6) {
      toast.error('Postal code invalid. Minimum 6 digits required.');
      return;
    }
    
    setIsProcessing(true);

    const promise = async () => {
      // 0. Check for Test Mode
      let isTestOrder = false;
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'maintenance'));
        if (settingsSnap.exists() && settingsSnap.data().testMode) {
          isTestOrder = true;
        }
      } catch (err) {
        console.warn('Metadata sync issues, defaulting to live protocol');
      }

      // 1. Validate Stock and Pre-create Order using a Transaction
      const result = await runTransaction(db, async (transaction) => {
        const productSnaps = await Promise.all(
          cart.map(item => transaction.get(doc(db, 'products', item.id)))
        );

        for (let i = 0; i < cart.length; i++) {
          const snap = productSnaps[i];
          const cartItem = cart[i];
          if (!snap.exists()) throw new Error(`Product ${cartItem.name} not found.`);
          
          const currentStock = snap.data().stock || 0;
          if (currentStock < cartItem.quantity) {
            throw new Error(`Insufficient stock for ${cartItem.name}.`);
          }
        }

        const deliveryPin = Math.floor(100000 + Math.random() * 900000).toString();
        const orderId = `DSPY_${Date.now()}`;

        const orderData = {
          userId: user.uid,
          customerName: formData.fullName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          deliveryPin,
          paymentStatus: 'pending',
          shippingAddress: { ...formData },
          items: cart,
          total: cartTotal,
          status: 'pending_payment',
          isTest: isTestOrder,
          couponUsed: coupon ? coupon.code : null,
          createdAt: new Date().toISOString(),
          timeline: [
            {
              status: 'pending_payment',
              timestamp: new Date().toISOString(),
              message: "Order initialized. Awaiting payment authorization."
            }
          ]
        };
        
        const orderRef = doc(db, 'orders', orderId);
        transaction.set(orderRef, orderData);
        
        return { orderId, ...orderData };
      });

      // 2. Create Cashfree Session
      try {
        const res = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: result.orderId,
            amount: cartTotal,
            customerDetails: {
              customerId: user.uid,
              customerEmail: formData.email,
              customerPhone: formData.phone,
              customerName: formData.fullName
            }
          })
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Non-JSON API response:", text);
          throw new Error("Payment server returned an invalid response (HTML). Please ensure the backend is running correctly.");
        }

        const sessionData = await res.json();
        if (!res.ok) throw new Error(sessionData.error || "Payment session failed");

        // 3. Initialize Cashfree SDK and Open Checkout
        const cashfree = await loadCashfree({
          mode: import.meta.env.PROD ? "production" : "sandbox"
        });

        if (!cashfree) {
          throw new Error("Could not initialize payment gateway");
        }

        const checkoutOptions = {
          paymentSessionId: sessionData.payment_session_id,
          redirectTarget: "_self" 
        };

        await cashfree.checkout(checkoutOptions);
        
        // The above is usually a redirect or a popup depends on sandbox/prod.
        // If it's a redirect, the execution stops here.
        return true;
      } catch (err: any) {
        console.error('Payment Initialization Failed:', err);
        throw new Error(err.message || 'Payment engine offline');
      }
    };

    toast.promise(promise(), {
      loading: 'Securing transaction and initializing payment...',
      success: 'Payment gateway initialized.',
      error: (err: any) => {
        setIsProcessing(false);
        return `Secure processing failed: ${err.message}`;
      }
    });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg shadow-inner">
        <h2 className="text-2xl font-display mb-8 text-black/40">Your vault is empty</h2>
        <Link to="/" className="text-black uppercase tracking-[0.4em] font-bold text-xs hover:tracking-[0.6em] transition-all duration-700">Return to Boutique</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      
      <main className="flex-grow pt-24 md:pt-40 pb-24 w-full">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="mb-16 md:mb-24">
            <Link to="/cart" className="flex items-center text-text/30 hover:text-black transition-all mb-12 md:mb-20 group w-fit">
              <div className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-700 mr-4">
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.4em] font-tech font-black">TERMINAL_VAULT // REVERSE</span>
            </Link>
            
            {/* Progress Tracker */}
            <div className="flex items-center justify-between max-w-xl mx-auto relative px-4 md:px-12">
              <div className="absolute top-1/2 left-12 right-12 h-[1px] bg-black/[0.03] -translate-y-1/2 z-0 hidden md:block" />
              <div 
                className="absolute top-1/2 left-12 h-[1px] bg-black -translate-y-1/2 z-0 transition-all duration-1000 hidden md:block" 
                style={{ width: '45%' }}
              />
              
              {[
                { label: 'MANIFEST', icon: Mail, active: true },
                { label: 'HANDSHAKE', icon: CreditCard, active: false }
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-1000 ${step.active ? 'bg-black text-white border-black shadow-2xl scale-110' : 'bg-white text-black/10 border-black/5'} border`}>
                    <step.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1} />
                  </div>
                  <span className={`text-[8px] md:text-[10px] uppercase tracking-[0.4em] mt-4 md:mt-8 font-tech font-black ${step.active ? 'text-black' : 'text-black/10'}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 items-start">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-12 xl:col-span-7 space-y-16"
            >
              <div>
                <h1 className="text-5xl md:text-7xl xl:text-8xl font-display mb-6 text-text leading-none tracking-tightest italic">ACQUISITION<br /><span className="opacity-20 font-sans italic">_INITIALIZE.</span></h1>
                <p className="text-text/40 uppercase tracking-[0.4em] text-[10px] md:text-[12px] font-tech font-black">Secure Checkout Terminal // Port_443_SSL</p>
              </div>

            <form onSubmit={handlePlaceOrder} className="space-y-8 lg:space-y-12">
              <div className="space-y-6 md:space-y-8">
                <h3 className="text-xl font-display italic tracking-tight uppercase flex items-center mb-10 border-b border-black/5 pb-6">
                  <Truck className="mr-4 opacity-20" size={24} />
                  Logistics <span className="opacity-20 ml-2">Manifest</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-black/20 ml-1 font-tech font-bold">IDENTITY_MANIFEST</label>
                    <input 
                      required
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                      className="w-full bg-black/[0.01] border border-black/5 rounded-[2rem] px-8 py-6 focus:border-black outline-none text-sm transition-all font-medium font-display italic tracking-tight"
                      placeholder="Full Name..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-black/20 ml-1 font-tech font-bold">AUTH_EMAIL_PROTOCOL</label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-black/[0.01] border border-black/5 rounded-[2rem] px-8 py-6 focus:border-black outline-none text-sm transition-all font-mono"
                      placeholder="email@network.nexus"
                    />
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.4em] text-black/20 ml-1 font-tech font-bold">SECURE_TEL</label>
                      <div className="relative">
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-black/20 text-sm font-mono">+91</span>
                        <input 
                          required
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                          className="w-full bg-black/[0.01] border border-black/5 rounded-[2rem] pl-20 pr-8 py-6 focus:border-black outline-none text-sm transition-all font-mono"
                          placeholder="99999 99999"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.4em] text-black/20 ml-1 font-tech font-bold">POSTAL_INDEX</label>
                      <input 
                        required
                        value={formData.zip}
                        onChange={e => setFormData({...formData, zip: e.target.value})}
                        className="w-full bg-black/[0.01] border border-black/5 rounded-[2rem] px-8 py-6 focus:border-black outline-none text-sm transition-all font-mono"
                        placeholder="000 000"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-black/20 ml-1 font-tech font-bold">PHYSICAL_DROP_POINT</label>
                    <textarea 
                      required
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-black/[0.01] border border-black/5 rounded-[2rem] px-8 py-6 focus:border-black outline-none text-sm transition-all min-h-[120px] font-display italic tracking-tight"
                      placeholder="Building, Street, Landmark..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.4em] text-black/20 ml-1 font-tech font-bold">CITY_NODE</label>
                      <input 
                        required
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        className="w-full bg-black/[0.01] border border-black/5 rounded-[2rem] px-8 py-6 focus:border-black outline-none text-sm transition-all uppercase font-display italic tracking-tight"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.4em] text-black/20 ml-1 font-tech font-bold">TERRITORY</label>
                      <div className="w-full bg-black/[0.03] border border-black/5 rounded-[2rem] px-8 py-6 text-sm text-black/40 font-display italic tracking-tight flex items-center justify-between cursor-not-allowed">
                        <span>INDIA</span>
                        <ShieldCheck size={16} className="opacity-40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>              {/* Payment Info Notification */}
              <div className="p-10 rounded-[3rem] bg-black text-white relative overflow-hidden group shadow-2xl">
                 <div className="absolute top-0 right-0 p-12 opacity-[0.05] rotate-12 -translate-y-4 translate-x-4">
                    <Key size={180} />
                 </div>
                 <div className="relative z-10">
                   <div className="flex items-center space-x-4 mb-8">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                         <CreditCard size={20} />
                      </div>
                      <h4 className="text-xl font-display italic tracking-tight uppercase">Encryption <span className="opacity-40">Handshake</span></h4>
                   </div>
                   <p className="text-white/60 leading-relaxed text-sm font-display italic tracking-tight mb-8">
                     "Your acquisition request will be logged in the manifest. A DINOSPY terminal agent will synchronize with your provided contact coordinates to authorize the final secure handshake link."
                   </p>
                   <div className="flex items-center space-x-6">
                      <div className="px-5 py-2 rounded-full border border-white/20 bg-white/5 text-[9px] font-tech tracking-[0.3em] uppercase">
                        Protocol_Secure
                      </div>
                      <div className="px-5 py-2 rounded-full border border-white/20 bg-white/5 text-[9px] font-tech tracking-[0.3em] uppercase">
                        End_to_End
                      </div>
                   </div>
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className={`w-full py-10 bg-black text-white rounded-[3rem] font-tech font-black uppercase tracking-[0.8em] text-[11px] shadow-2xl transition-all duration-700 relative overflow-hidden group/btn ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-700" />
                <span className="relative z-10">{isProcessing ? 'SYNCHRONIZING...' : 'INITIALIZE_ACQUISITION'}</span>
              </button>
              
              <div className="flex items-center justify-center space-x-4 text-black/10">
                <ShieldCheck size={20} strokeWidth={1} />
                <span className="text-[10px] uppercase font-tech tracking-[0.6em] font-black">Insured Protocol by DINOSPY_SEC</span>
              </div>
            </form>
          </motion.div>

            {/* Right: Summary */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-12 xl:col-span-5"
            >
            <div className="bg-white border border-black/5 p-10 rounded-[4rem] shadow-sm sticky top-32 space-y-12 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none -rotate-12 translate-x-1/4 -translate-y-1/4">
                 <CheckCircle2 size={300} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-12">
                   <h2 className="text-sm font-tech font-black uppercase tracking-[0.6em] text-black/20">MANIFEST_ARCHIVE</h2>
                   <div className="w-12 h-[1px] bg-black/5" />
                </div>
                
                <div className="space-y-10 mb-16 overflow-y-auto max-h-[35vh] pr-4 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.id} className="flex space-x-6 items-center">
                      <div className="w-20 aspect-square overflow-hidden rounded-[1.5rem] bg-black/[0.02] border border-black/5 p-2 flex-shrink-0">
                         <img src={item.images[0]} className="w-full h-full object-cover rounded-xl grayscale opacity-80" alt={item.name} />
                      </div>
                      <div className="flex-grow space-y-2">
                        <h4 className="text-lg font-display italic tracking-tight uppercase leading-none">{item.name}</h4>
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] text-black/20 font-tech font-bold uppercase tracking-widest">U_COUNT: {item.quantity}</p>
                           <span className="text-base font-tech tracking-tighter text-black/80">₹{Math.round(item.discount && (!item.offerExpiry || new Date(item.offerExpiry) > new Date()) ? item.price * (1 - item.discount / 100) : item.price).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-6 pt-10 border-t border-black/5 relative">
                  {/* Coupon Section */}
                  <div className="pb-10 border-b border-black/5">
                     <p className="text-[9px] uppercase tracking-[0.4em] text-black/20 mb-6 font-tech font-black">PROMOTIONAL_KEY</p>
                     {coupon ? (
                       <div className="flex items-center justify-between bg-black text-white p-6 rounded-[2rem] shadow-xl group">
                          <div className="flex items-center space-x-4">
                             <Key size={18} className="text-white/40" />
                             <span className="text-sm font-tech font-bold uppercase tracking-[0.3em]">{coupon.code}</span>
                          </div>
                          <button onClick={removeCoupon} className="text-[10px] font-tech uppercase tracking-widest font-black opacity-40 hover:opacity-100 transition-opacity">REVOKE</button>
                       </div>
                     ) : (
                       <div className="flex bg-black/[0.03] border border-black/5 rounded-[2rem] p-1">
                          <input 
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value)}
                            placeholder="INPUT KEY..."
                            className="flex-grow bg-transparent px-6 py-4 outline-none text-xs uppercase tracking-[0.3em] font-tech"
                          />
                          <button 
                            onClick={handleApplyCoupon}
                            disabled={isValidatingCoupon || !couponCode}
                            className="px-8 bg-black text-white rounded-full text-[10px] font-tech font-black uppercase tracking-widest disabled:opacity-20 transition-all active:scale-95 py-4"
                          >
                            {isValidatingCoupon ? '...' : 'SYNC'}
                          </button>
                       </div>
                     )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-black/40">
                      <span className="text-[11px] uppercase tracking-[0.4em] font-tech">NET_VALUATION</span>
                      <span className="font-tech text-base tracking-tighter">₹{subtotal.toLocaleString()}</span>
                    </div>
                    {savings > 0 && (
                      <div className="flex justify-between items-center text-black">
                        <span className="text-[11px] uppercase tracking-[0.4em] font-black font-tech">ACQUISITION_GAINS</span>
                        <span className="font-tech text-base tracking-tighter">-₹{savings.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-black/40">
                      <span className="text-[11px] uppercase tracking-[0.4em] font-tech">LOGISTICS_FEES</span>
                      <span className="font-tech text ocean font-black uppercase tracking-[0.2em] px-3 py-1 bg-black/[0.05] rounded-full">NOMINAL_WAIVED</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end pt-12 mt-6 border-t-[3px] border-black">
                    <span className="text-[10px] font-tech font-black uppercase tracking-[0.6em] text-black/20 mb-2">GRAND_MANIFEST_TOTAL</span>
                    <span className="text-6xl md:text-7xl font-tech tracking-tightest leading-none font-black">₹{cartTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
