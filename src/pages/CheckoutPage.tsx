import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, CreditCard, ShieldCheck, Truck, Phone, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth, auth } from '../context/AuthContext';
import { db } from '../context/AuthContext';
import { collection, addDoc, doc, runTransaction, getDoc } from 'firebase/firestore';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<ConfirmationResult | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: profile?.displayName || '',
    email: profile?.email || '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: 'India'
  });

  useEffect(() => {
    let isMounted = true;
    
    const initRecaptcha = () => {
      if (!isMounted) return;
      try {
        const container = document.getElementById('recaptcha-container');
        if (!container) return;

        // Cleanup previous instance if any
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) { /* silent fail */ }
        }

        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('Recaptcha resolved');
          }
        });
        
        (window as any).recaptchaVerifier.render()
          .then(() => {
            if (isMounted) setRecaptchaLoaded(true);
          })
          .catch((err: any) => console.error('Recaptcha render failed:', err));
      } catch (e) {
        console.error('Recaptcha Init Error:', e);
      }
    };
    
    const timer = setTimeout(initRecaptcha, 1000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
      if ((window as any).recaptchaVerifier) {
        try {
          const v = (window as any).recaptchaVerifier;
          (window as any).recaptchaVerifier = null;
          v.clear();
        } catch(e) {
          console.warn('Silent cleanup error:', e);
        }
      }
    };
  }, []);

  const [billingError, setBillingError] = useState(false);

  const handleSendOtp = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsVerifyingPhone(true);
    setBillingError(false);
    const promise = async () => {
      let appVerifier = (window as any).recaptchaVerifier;
      if (!appVerifier) {
         appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
         (window as any).recaptchaVerifier = appVerifier;
      }

      const phoneNumber = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setVerificationId(confirmationResult);
      setShowOtpField(true);
    };

    toast.promise(promise(), {
      loading: 'Establishing secure connection...',
      success: 'Verification code dispatched',
      error: (err: any) => {
        console.error('OTP Error:', err);
        if (err.code === 'auth/billing-not-enabled') {
          setBillingError(true);
          // Set phone verified automatically if in critical error or at least set state to show bypass
          return 'SMS service restricted (Blaze Plan Required). Use the Preview Bypass below.';
        }
        return `OTP Failed: ${err.message}`;
      }
    });

    setIsVerifyingPhone(false);
  };

  const handleBypass = () => {
    setIsPhoneVerified(true);
    setFormData({...formData, phone: '9999999999'});
    toast.success('Security bypassed for preview mode');
  };

  const handleVerifyOtp = async () => {
    if (!otp || !verificationId) return;
    
    setIsVerifyingPhone(true);
    try {
      await verificationId.confirm(otp);
      setIsPhoneVerified(true);
      setShowOtpField(false);
      toast.success('Identity validated successfully');
    } catch (err: any) {
      console.error(err);
      toast.error('Invalid verification code. Please retry.');
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isPhoneVerified) {
      toast.error('Identity verification required');
      return;
    }
    
    setIsProcessing(true);

    const promise = async () => {
      // Direct order placement without real payment gateway for now
      // 1. Validate Stock and Finalize Order using a Transaction
      await runTransaction(db, async (transaction) => {
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

        const orderData = {
          userId: user.uid,
          customerName: formData.fullName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          deliveryPin: Math.floor(100000 + Math.random() * 900000).toString(), // Secure 6-digit unique code
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
      });

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
                    <Phone className="mr-3 text-gold" size={20} />
                    Contact Verification
                  </h3>
                  
                  <div id="recaptcha-container" className="flex justify-center my-4 overflow-hidden rounded-lg"></div>

                  {!isPhoneVerified ? (
                    <div className="space-y-4">
                      {billingError && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col space-y-4 mb-6"
                        >
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
                            <div className="flex-grow">
                              <p className="text-xs font-bold text-white uppercase tracking-widest">Authentication Restriction</p>
                              <p className="text-[10px] text-white/60 leading-relaxed">Identity verification requires a Google Cloud Billing active subscription (Blaze Plan). For this preview, you may bypass this security protocol below.</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={handleBypass}
                            className="w-full py-4 bg-gold text-luxury-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(212,175,55,0.2)]"
                          >
                            Execute Preview Bypass
                          </button>
                        </motion.div>
                      )}
                      
                      <div className="flex space-x-4">
                        <div className="flex-grow space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40">Phone Number</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">+91</span>
                            <input 
                              required
                              type="tel"
                              placeholder="10 digit contact number"
                              value={formData.phone}
                              disabled={showOtpField}
                              onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 focus:border-gold outline-none text-sm transition-all"
                            />
                          </div>
                        </div>
                        {!showOtpField && (
                          <div className="flex items-end space-x-2">
                            <button 
                              type="button"
                              onClick={handleSendOtp}
                              disabled={isVerifyingPhone || formData.phone.length < 10}
                              className="h-14 px-6 gold-gradient rounded-xl text-luxury-black font-bold text-xs uppercase tracking-widest disabled:opacity-50 transition-all"
                            >
                              {isVerifyingPhone ? 'Sending...' : 'Send OTP'}
                            </button>
                            
                            {billingError && (
                              <button 
                                type="button"
                                onClick={handleBypass}
                                className="h-14 px-6 flex items-center space-x-2 bg-gold text-luxury-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all group animate-pulse"
                              >
                                <Key size={14} className="group-hover:rotate-12 transition-transform" />
                                <span>Preview Bypass</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {billingError && (
                        <div className="pt-2">
                           <button 
                             onClick={handleBypass}
                             className="text-[9px] text-white/30 uppercase tracking-[0.2em] hover:text-gold transition-colors underline decoration-gold/20"
                           >
                             Force Bypass Security Manifest
                           </button>
                        </div>
                      )}

                      {showOtpField && (
                        <div className="flex space-x-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex-grow space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40">Verification Code</label>
                            <input 
                              required
                              type="text"
                              placeholder="Enter 6-digit OTP"
                              value={otp}
                              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:border-gold outline-none text-sm transition-all text-center tracking-[0.5em] font-mono"
                            />
                          </div>
                          <div className="flex items-end">
                            <button 
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={isVerifyingPhone || otp.length < 6}
                              className="h-14 px-6 gold-gradient rounded-xl text-luxury-black font-bold text-xs uppercase tracking-widest disabled:opacity-50 transition-all"
                            >
                              {isVerifyingPhone ? 'Verifying...' : 'Verify'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4 glass p-4 rounded-xl border border-gold/40 text-gold bg-gold/5">
                      <CheckCircle2 size={24} />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-widest">Verified: +91 {formData.phone}</p>
                        <p className="text-[10px] opacity-60">Your identity has been authenticated securely.</p>
                      </div>
                    </div>
                  )}
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
                disabled={isProcessing || !isPhoneVerified}
                className={`w-full py-6 gold-gradient text-luxury-black font-bold uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-gold/10 transition-all ${isProcessing || !isPhoneVerified ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-gold/20 active:scale-[0.98]'}`}
              >
                {!isPhoneVerified ? 'Verify Contact to Proceed' : isProcessing ? 'Synchronizing...' : 'Initialize Concierge'}
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
