import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, CreditCard, ShieldCheck, Truck, Phone, CheckCircle2, AlertTriangle, Key, Mail } from 'lucide-react';
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-luxury-black">
        <h2 className="text-2xl font-display mb-8">Your cart is empty</h2>
        <Link to="/" className="gold-text uppercase tracking-widest font-bold">Return to Boutique</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-luxury-black">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-12">
          <Link to="/cart" className="flex items-center text-white/40 hover:text-gold transition-colors mb-12 group w-fit">
            <ChevronLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={18} />
            Back to Vault
          </Link>
          
          {/* Progress Tracker */}
          <div className="flex items-center justify-between max-w-2xl mx-auto mb-16 relative">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-[1px] bg-gold -translate-y-1/2 z-0 transition-all duration-1000" 
              style={{ width: '50%' }}
            />
            
            {[
              { label: 'Details', icon: Mail, active: true },
              { label: 'Payment', icon: CreditCard, active: false }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700 ${step.active ? 'bg-gold text-luxury-black border-gold' : 'bg-luxury-black text-white/20 border-white/5'} border`}>
                  <step.icon size={16} />
                </div>
                <span className={`text-[8px] uppercase tracking-[0.3em] mt-4 font-bold ${step.active ? 'text-gold' : 'text-white/20'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-12"
          >
            <div>
              <h1 className="text-5xl font-display mb-4 gold-text">Acquisition</h1>
              <p className="text-white/40 uppercase tracking-[0.2em] text-xs">Secure Checkout Terminal</p>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-bold uppercase tracking-widest flex items-center">
                  <Truck className="mr-3 text-gold" size={20} />
                  Shipping Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Full Name</label>
                    <input 
                      required
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-gold outline-none text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Email Protocol</label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-gold outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-white/5">
                  <h3 className="text-lg font-bold uppercase tracking-widest flex items-center">
                    <Phone className="mr-3 text-gold" size={20} />
                    Contact Coordinates
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">WhatsApp Number</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-mono">+91</span>
                        <input 
                          required
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 focus:border-gold outline-none text-sm transition-all"
                          placeholder="99999 99999"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-6 border-t border-white/5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Residence Address</label>
                  <input 
                    required
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-gold outline-none text-sm transition-all"
                    placeholder="Penthouse 42, Marble Towers..."
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">City</label>
                    <input 
                      required
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-gold outline-none text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Postal Code</label>
                    <input 
                      required
                      value={formData.zip}
                      onChange={e => setFormData({...formData, zip: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-gold outline-none text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Country</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-gold outline-none text-sm appearance-none cursor-not-allowed"
                      disabled
                      value="India"
                    >
                      <option value="India">India</option>
                    </select>
                    <p className="text-[8px] text-white/20 mt-1">DINOSPY currently ships exclusively within India.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-white/5">
                <h3 className="text-lg font-bold uppercase tracking-widest flex items-center">
                  <CreditCard className="mr-3 text-gold" size={20} />
                  Financing Options
                </h3>
                <div className="glass p-6 rounded-2xl border border-gold/20 flex flex-col space-y-4">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-8 bg-gold/10 rounded border border-gold/20 flex items-center justify-center text-[8px] font-bold text-gold italic">DINOSPY</div>
                      <div>
                        <p className="text-sm font-bold">Concierge Coordination</p>
                        <p className="text-[10px] text-white/40">Secure checkout will be finalized via personal link.</p>
                      </div>
                   </div>
                   <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-white/40 leading-relaxed italic">
                        "Your acquisition request will be logged. A personal DINOSPY concierge will contact you within 2 hours to provide a bespoke secure payment link and finalize logistics."
                      </p>
                   </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className={`w-full py-6 gold-gradient text-luxury-black font-bold uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-gold/10 transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-gold/20 active:scale-[0.98]'}`}
              >
                {isProcessing ? 'Synchronizing...' : 'Initialize Concierge'}
              </button>
              
              <div className="flex items-center justify-center space-x-2 text-white/20">
                <ShieldCheck size={14} />
                <span className="text-[10px] uppercase tracking-widest">Insured and Protected by DINOSPY Securities</span>
              </div>
            </form>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:pl-10"
          >
            <div className="glass p-10 rounded-[3rem] border border-white/10 sticky top-32">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-10">Manifest</h2>
              
              <div className="space-y-8 mb-10 overflow-y-auto max-h-[40vh] pr-4 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex space-x-4">
                    <img src={item.images[0]} className="w-16 h-20 object-cover rounded-lg bg-white/5" alt={item.name} />
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold">{item.name}</h4>
                      <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {item.discount && (!item.offerExpiry || new Date(item.offerExpiry) > new Date()) ? (
                          <>
                             <span className="text-[10px] text-white/20 line-through">₹{item.price.toLocaleString()}</span>
                             <span className="text-xs text-gold font-mono font-bold">₹{Math.round(item.price * (1 - item.discount / 100)).toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="text-xs text-gold font-mono">₹{item.price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                {/* Coupon Section */}
                <div className="pb-6 border-b border-white/5">
                   <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3 ml-1">Promotional Coupon</p>
                   {coupon ? (
                     <div className="flex items-center justify-between bg-gold/10 border border-gold/20 p-4 rounded-xl">
                        <div className="flex items-center space-x-3">
                           <Key size={14} className="text-gold" />
                           <span className="text-xs font-bold text-white uppercase tracking-widest">{coupon.code}</span>
                        </div>
                        <button onClick={removeCoupon} className="text-[10px] text-gold uppercase tracking-widest font-black hover:underline underline-offset-4">Remove</button>
                     </div>
                   ) : (
                     <div className="flex space-x-2">
                        <input 
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value)}
                          placeholder="ENTER CODE"
                          className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold text-xs uppercase tracking-widest transition-all"
                        />
                        <button 
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponCode}
                          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gold disabled:opacity-20 transition-all active:scale-95"
                        >
                          {isValidatingCoupon ? '...' : 'Verify'}
                        </button>
                     </div>
                   )}
                </div>

                <div className="flex justify-between text-white/40">
                  <span className="text-xs uppercase tracking-widest">Manifest Value</span>
                  <span className="font-mono text-white">₹{subtotal.toLocaleString()}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-gold/60">
                    <span className="text-[10px] uppercase tracking-widest font-bold">Acquisition Saved</span>
                    <span className="font-mono font-bold">-₹{savings.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/40">
                  <span className="text-xs uppercase tracking-widest">Shipping</span>
                  <span className="text-gold uppercase text-[10px] font-bold tracking-widest">Complimentary</span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span className="text-xs uppercase tracking-widest">Insurance</span>
                  <span className="text-gold uppercase text-[10px] font-bold tracking-widest">Complimentary</span>
                </div>
                <div className="flex justify-between items-end pt-6 mt-4 border-t border-gold/10">
                  <span className="text-lg font-bold uppercase tracking-widest">Grand Total</span>
                  <span className="text-3xl font-mono gold-text">₹{cartTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
