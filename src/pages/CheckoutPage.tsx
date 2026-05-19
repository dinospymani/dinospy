import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.displayName || '',
    email: profile?.email || '',
    address: '',
    city: '',
    zip: '',
    country: 'USA'
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsProcessing(true);
    try {
      const orderData = {
        userId: user.uid,
        customerName: formData.fullName,
        customerEmail: formData.email,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          zip: formData.zip,
          country: formData.country
        },
        items: cart,
        total: cartTotal,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'orders'), orderData);
      
      // Simulate payment delay
      setTimeout(() => {
        clearCart();
        setIsProcessing(false);
        navigate('/profile'); // Redirect to profile to see orders (or a success page)
        alert('Order placed successfully! DINOSPY concierge will contact you shortly.');
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Error placing order.');
    }
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

                <div className="space-y-2">
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
                <div className="glass p-6 rounded-2xl border border-gold/20 flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-8 bg-white/10 rounded border border-white/20 flex items-center justify-center text-[8px] font-bold">VISA</div>
                      <div>
                        <p className="text-sm font-bold">Pay via Secure Gateway</p>
                        <p className="text-[10px] text-white/40">Encrypted 256-bit SSL transaction</p>
                      </div>
                   </div>
                   <input type="radio" checked readOnly className="accent-gold" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className={`w-full py-6 gold-gradient text-luxury-black font-bold uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-gold/10 transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-gold/20 active:scale-[0.98]'}`}
              >
                {isProcessing ? 'Transacting...' : 'Confirm Acquisition'}
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
