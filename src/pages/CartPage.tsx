import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth, db } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { X, AlertCircle } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, coupon, applyCoupon, removeCoupon } = useCart();
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const savings = subtotal - cartTotal;
  const [outOfStockItems, setOutOfStockItems] = React.useState<string[]>([]);
  const [showErrorPopup, setShowErrorPopup] = React.useState(false);
  const [couponCode, setCouponCode] = React.useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase().trim()), where('active', '==', true));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error('Invalid coupon');
        return;
      }

      const couponData = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;

      if (couponData.expiry && new Date(couponData.expiry) < new Date()) {
        toast.error('Coupon expired');
        return;
      }

      if (couponData.minAmount && subtotal < couponData.minAmount) {
        toast.error(`Min purchase ₹${couponData.minAmount.toLocaleString()} required`);
        return;
      }

      applyCoupon(couponData);
      toast.success('Valid coupon applied');
      setCouponCode('');
    } catch (err) {
      toast.error('Validation failed');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  React.useEffect(() => {
    const obs = cart.filter(item => item.stock <= 0).map(item => item.name);
    if (obs.length > 0 && JSON.stringify(obs) !== JSON.stringify(outOfStockItems)) {
      setOutOfStockItems(obs);
    }
  }, [cart]);

  const hasOutOfStock = cart.some(item => item.stock <= 0);

  return (
    <div className="min-h-screen flex flex-col bg-noir text-text selection:bg-gold selection:text-noir">
      <Navbar />
      
      <main className="flex-grow pt-40 pb-40 max-w-7xl mx-auto px-6 lg:px-12 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-12">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center space-x-3 text-text/40 hover:text-gold transition-all duration-500 p-2 -ml-2 group"
            >
              <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-gold transition-colors">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.4em] font-black">RETURN_ARCHIVE</span>
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
            <div className="space-y-8">
              <div className="flex items-center space-x-6 opacity-40">
                <div className="w-1.5 h-1.5 bg-gold rounded-full shadow-[0_0_10px_#c5a059]" />
                <span className="font-tech text-xs tracking-widest uppercase text-gold">ACQUISITION_MANIFEST</span>
              </div>
              <h1 className="text-6xl md:text-9xl font-display italic leading-none tracking-tightest">Your <span className="opacity-10">Vault.</span></h1>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="glass p-20 rounded-[4rem] text-center border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gold opacity-0 group-hover:opacity-[0.02] transition-opacity duration-1000" />
              <div className="w-24 h-24 bg-noir/40 rounded-full flex items-center justify-center mx-auto mb-12 border border-white/5 shadow-2xl">
                <ShoppingBag className="text-gold opacity-20" size={32} />
              </div>
              <h2 className="text-4xl font-display mb-6 italic">The vault is currently empty.</h2>
              <p className="text-text/40 mb-12 max-w-sm mx-auto italic font-light leading-relaxed">
                Initialize your primary acquisition protocol by exploring our elite mechanical archives.
              </p>
              <Link to="/explore">
                <button className="btn-luxury">Initialize_Acquisition</button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
              <div className="lg:col-span-8 flex flex-col space-y-8">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`group glass p-6 md:p-10 rounded-[3.5rem] border transition-all duration-700 relative overflow-hidden flex flex-col md:flex-row items-center gap-10 ${item.stock <= 0 ? 'border-red-900/30 opacity-40 grayscale-[0.8]' : 'border-white/5 hover:border-gold/20'}`}
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none -rotate-12 translate-x-1/3 -translate-y-1/3 scale-150">
                        <Star size={200} />
                      </div>

                      <div className="w-32 h-40 md:w-40 md:h-52 shrink-0 bg-noir/40 rounded-[2rem] p-4 flex items-center justify-center relative overflow-hidden border border-white/5">
                        <img 
                          src={item.images[0]} 
                          className="w-full h-full object-contain filter group-hover:scale-110 transition-transform duration-1000" 
                          alt={item.name} 
                        />
                      </div>
                      
                      <div className="flex-grow space-y-4 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                           <span className="font-tech text-gold tracking-widest text-[9px] font-black uppercase opacity-60">{item.brand} // REF_{item.id.slice(-8).toUpperCase()}</span>
                           <button 
                             onClick={() => removeFromCart(item.id)}
                             className="text-text/20 hover:text-red-500 transition-colors self-center md:self-auto"
                           >
                              <X size={18} />
                           </button>
                        </div>
                        <h3 className="text-2xl md:text-4xl font-display italic text-text line-clamp-1">{item.name}</h3>
                        
                        <div className="flex items-center justify-center md:justify-start gap-4">
                           {item.discount && (!item.offerExpiry || new Date(item.offerExpiry) > new Date()) ? (
                             <div className="flex items-center space-x-3">
                               <span className="text-text/20 line-through text-xs font-light italic">₹{item.price.toLocaleString()}</span>
                               <span className="text-gold font-display text-2xl">₹{Math.round(item.price * (1 - item.discount / 100)).toLocaleString()}</span>
                               <span className="text-[8px] bg-gold text-noir px-2 py-0.5 rounded font-black tracking-widest">-{item.discount}%</span>
                             </div>
                           ) : (
                             <div className="text-gold font-display text-2xl">₹{item.price.toLocaleString()}</div>
                           )}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                           <div className="flex items-center glass rounded-full p-1 border border-white/10">
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:text-gold transition-colors">
                                 <Minus size={12} />
                              </button>
                              <span className="w-10 text-center font-mono font-black text-sm text-gold">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)} 
                                disabled={item.stock !== undefined && item.quantity >= item.stock}
                                className="w-8 h-8 flex items-center justify-center hover:text-gold transition-colors disabled:opacity-20"
                              >
                                 <Plus size={12} />
                              </button>
                           </div>

                           {item.stock !== undefined && (
                             <div className={`text-[9px] uppercase font-black tracking-widest flex items-center space-x-3 ${item.stock <= 0 ? 'text-red-500' : (item.stock <= 5 ? 'text-orange-500 bg-orange-500/5 px-3 py-1 rounded-full' : 'text-text/30')}`}>
                                {item.stock > 0 ? (
                                  <>
                                    <div className={`w-1.5 h-1.5 rounded-full ${item.stock <= 5 ? 'bg-orange-500 animate-bounce' : 'bg-green-500'}`} />
                                    <span>{item.stock <= 5 ? `REMAINING: ${item.stock}` : 'VAULT_READY'}</span>
                                  </>
                                ) : (
                                  <span className="font-black">VAULT_DEPLETED</span>
                                )}
                             </div>
                           )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="lg:col-span-4">
                <div className="glass p-12 rounded-[4rem] border border-white/5 sticky top-32 space-y-12 luxury-shadow">
                   <div className="space-y-4">
                      <span className="font-tech text-gold tracking-widest text-[9px] font-black uppercase opacity-60">MANIFEST_SUMMARY</span>
                      <h4 className="text-4xl font-display italic">Acquisition <span className="opacity-20 italic">Total.</span></h4>
                   </div>

                   <div className="space-y-6 pt-10 border-t border-white/5">
                      <div className="flex justify-between items-center opacity-40">
                         <span className="font-tech text-[10px] tracking-widest uppercase">Base_Subtotal</span>
                         <span className="font-display text-xl">₹{subtotal.toLocaleString()}</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between items-center text-gold">
                           <span className="font-tech text-[10px] tracking-widest uppercase">Vault_Savings</span>
                           <span className="font-display text-xl">-₹{savings.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center opacity-40">
                         <span className="font-tech text-[10px] tracking-widest uppercase">Courier_Privilege</span>
                         <span className="font-tech text-[10px] tracking-widest uppercase text-gold">COMPLIMENTARY</span>
                      </div>
                      
                      <div className="pt-10 border-t border-white/10 space-y-8">
                         <div className="flex justify-between items-end">
                            <span className="font-tech text-[10px] tracking-[0.4em] uppercase font-black">TOTAL_CARGO_VALUE</span>
                            <span className="text-4xl font-display text-gold leading-none tracking-tightest">₹{cartTotal.toLocaleString()}</span>
                         </div>

                         <Link to={hasOutOfStock ? "#" : "/checkout"} className="block">
                            <button 
                              onClick={() => { if (hasOutOfStock) setShowErrorPopup(true); }}
                              className={`btn-luxury w-full flex items-center justify-center transition-all ${hasOutOfStock ? 'opacity-20 cursor-not-allowed' : 'group'}`}
                            >
                              <span>{hasOutOfStock ? 'VAULT_RESTRICTED' : 'AUTHORIZED_CHECKOUT'}</span>
                              {!hasOutOfStock && <ArrowRight className="ml-4 group-hover:translate-x-2 transition-transform" size={16} />}
                            </button>
                         </Link>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
      <MobileNav />

      {/* Out of Stock Popup */}
      <AnimatePresence>
        {showErrorPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-noir/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="glass max-w-xl w-full p-12 md:p-20 rounded-[5rem] border border-red-500/10 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none -rotate-12 transform scale-150">
                 <AlertCircle size={300} />
              </div>

              <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                <AlertCircle className="text-red-500" size={40} strokeWidth={1} />
              </div>

              <h2 className="text-4xl md:text-5xl font-display mb-6 italic leading-none">Vault <span className="text-red-500/40">Restriction.</span></h2>
              <p className="text-text/40 mb-12 text-xs md:text-sm italic font-light leading-relaxed max-w-md mx-auto">
                Primary acquisition handshake failed. Certain artifacts in your current manifest have been claimed or removed from the physical vault.
              </p>

              <div className="space-y-4 mb-12 text-left max-h-[30vh] overflow-y-auto no-scrollbar pr-2">
                {cart.filter(item => item.stock <= 0).map(item => (
                  <div key={item.id} className="flex items-center space-x-6 p-6 rounded-3xl bg-white/5 border border-white/5 group hover:border-red-500/20 transition-all">
                    <img src={item.images[0]} className="w-16 h-16 object-cover rounded-xl opacity-30 grayscale" />
                    <div className="flex-grow">
                       <p className="text-[10px] font-tech text-gold opacity-40 uppercase tracking-widest font-black mb-1">UNAVAILABLE_UNIT</p>
                       <p className="text-lg font-display italic text-text opacity-60">{item.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowErrorPopup(false)}
                className="btn-luxury w-full bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-noir"
              >
                Return_To_Manifest
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
