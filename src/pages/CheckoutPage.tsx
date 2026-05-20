import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, CreditCard, ShieldCheck, Truck, Phone, CheckCircle2, AlertTriangle, Key, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth, db } from '../context/AuthContext';
import { collection, doc, runTransaction } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: profile?.displayName || '',
    email: profile?.email || '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: 'India'
  });

  const handleSendEmailOtp = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsVerifyingEmail(true);
    const promise = async () => {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      if (data.devOtp) {
        console.log('OTP (Dev Mode):', data.devOtp);
        setDevOtp(data.devOtp);
        toast.info(`[DEMO MODE] Identity Verification Enabled`, {
          description: "Use the code displayed in the secure terminal below."
        });
      }
      setShowOtpField(true);
    };

    toast.promise(promise(), {
      loading: 'Initializing secure email handshake...',
      success: 'Verification code dispatched to your email',
      error: (err: any) => `Connection failed: ${err.message}`
    });

    setIsVerifyingEmail(false);
  };

  const handleVerifyEmailOtp = async () => {
    if (!otp || otp.length < 6) return;
    
    setIsVerifyingEmail(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsEmailVerified(true);
      setShowOtpField(false);
      toast.success('Identity validated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isEmailVerified) {
      toast.error('Email verification required to prevent fake orders');
      return;
    }
    if (!formData.phone || formData.phone.length < 10) {
      toast.error('Valid phone number is mandatory');
      return;
    }
    
    setIsProcessing(true);

    const promise = async () => {
      // Direct order placement without real payment gateway for now
      // 1. Validate Stock and Finalize Order using a Transaction
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

        productSnaps.forEach((snap, i) => {
          const currentStock = snap.data().stock;
          transaction.update(snap.ref, { stock: currentStock - cart[i].quantity });
        });

        const deliveryPin = Math.floor(100000 + Math.random() * 900000).toString();

        const orderData = {
          userId: user.uid,
          customerName: formData.fullName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          deliveryPin,
          paymentStatus: 'pending_manual',
          shippingAddress: { ...formData },
          items: cart,
          total: cartTotal,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          timeline: [
            {
              status: 'confirmed',
              timestamp: new Date().toISOString(),
              message: "Acquisition authorized. Logistics manifest initialized."
            },
            {
              status: 'pending_payment',
              timestamp: new Date().toISOString(),
              message: "Awaiting physical bank transfer verification."
            }
          ]
        };
        
        const orderRef = doc(collection(db, 'orders'));
        transaction.set(orderRef, orderData);
        
        // Return order data for email trigger
        return { orderId: orderRef.id, ...orderData };
      });

      // 2. Trigger Confirmation Email via Server Proxy
      try {
        const emailRes = await fetch('/api/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            orderDetails: {
              customerName: formData.fullName,
              total: cartTotal,
              items: cart,
              deliveryPin: result.deliveryPin
            }
          })
        });
        const emailData = await emailRes.json();
        if (emailData.message && emailData.message.includes('skipped')) {
          toast.info("Order processed. (Email manifest logged to server console)");
        }
      } catch (err) {
        console.error('Email Trigger Failed:', err);
      }

      clearCart();
      setTimeout(() => navigate('/profile'), 2000);
      return true;
    };

    toast.promise(promise(), {
      loading: 'Securing transaction and reserving stock...',
      success: 'Acquisition finalized! Welcome to the DINOSPY circle.',
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
        <Link to="/cart" className="flex items-center text-white/40 hover:text-gold transition-colors mb-8 group">
          <ChevronLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={18} />
          Back to Vault
        </Link>
        
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
                  Shipping Credentials
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
                    <ShieldCheck className="mr-3 text-gold" size={20} />
                    Identity Integrity
                  </h3>
                  
                  {!isEmailVerified ? (
                    <div className="space-y-4">
                      <div className="flex space-x-4">
                        <div className="flex-grow space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40">Registered Email</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <input 
                              required
                              type="email"
                              value={formData.email}
                              disabled={showOtpField}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 focus:border-gold outline-none text-sm transition-all"
                            />
                          </div>
                        </div>
                        {!showOtpField && (
                          <div className="flex items-end">
                            <button 
                              type="button"
                              onClick={handleSendEmailOtp}
                              disabled={isVerifyingEmail || !formData.email}
                              className="h-14 px-6 gold-gradient rounded-xl text-luxury-black font-bold text-xs uppercase tracking-widest disabled:opacity-50 transition-all shadow-[0_10px_20px_rgba(212,175,55,0.1)]"
                            >
                              {isVerifyingEmail ? 'Sending...' : 'Verify Email'}
                            </button>
                          </div>
                        )}
                      </div>

                      {showOtpField && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          {devOtp && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-6 bg-gold/10 border-2 border-dashed border-gold/40 rounded-2xl text-center"
                            >
                              <p className="text-[10px] uppercase tracking-widest text-gold mb-2 font-bold flex items-center justify-center">
                                <Key size={12} className="mr-2" />
                                Secure Demo Manifest: Verified Code
                              </p>
                              <h2 className="text-3xl font-mono text-gold tracking-[0.5em] font-black">{devOtp}</h2>
                              <button 
                                onClick={() => setOtp(devOtp)}
                                className="mt-4 text-[9px] uppercase tracking-widest text-gold/60 underline hover:text-gold transition-colors"
                              >
                                Auto-Fill Verification
                              </button>
                            </motion.div>
                          )}
                          
                          <div className="flex space-x-4">
                            <div className="flex-grow space-y-2">
                              <label className="text-[10px] uppercase tracking-widest text-white/40">Email OTP</label>
                              <input 
                                required
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-gold outline-none text-sm transition-all text-center tracking-[0.5em] font-mono"
                              />
                            </div>
                            <div className="flex items-end">
                              <button 
                                type="button"
                                onClick={handleVerifyEmailOtp}
                                disabled={isVerifyingEmail || otp.length < 6}
                                className="h-14 px-6 gold-gradient rounded-xl text-luxury-black font-bold text-xs uppercase tracking-widest disabled:opacity-50 transition-all"
                              >
                                {isVerifyingEmail ? 'Confirm' : 'Authorize'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 glass p-4 rounded-xl border border-gold/40 text-gold bg-gold/5">
                      <CheckCircle2 size={24} />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-widest">Verified: {formData.email}</p>
                        <p className="text-[10px] opacity-60">Identity protection active. Acquisition authorized.</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-6">
                    <h3 className="text-lg font-bold uppercase tracking-widest flex items-center mb-4">
                      <Phone className="mr-3 text-gold" size={20} />
                      Contact Coordinates
                    </h3>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Mandatory Phone Number</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-mono">+91</span>
                        <input 
                          required
                          type="tel"
                          placeholder="10 digit contact"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-14 pr-5 py-4 focus:border-gold outline-none text-sm transition-all"
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
                disabled={isProcessing || !isEmailVerified}
                className={`w-full py-6 gold-gradient text-luxury-black font-bold uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-gold/10 transition-all ${isProcessing || !isEmailVerified ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-gold/20 active:scale-[0.98]'}`}
              >
                {!isEmailVerified ? 'Verify Email to Proceed' : isProcessing ? 'Synchronizing...' : 'Initialize Concierge'}
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
                      <p className="text-xs text-gold mt-1 font-mono">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex justify-between text-white/40">
                  <span className="text-xs uppercase tracking-widest">Subtotal</span>
                  <span className="font-mono text-white">₹{cartTotal.toLocaleString()}</span>
                </div>
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
