import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
        toast.error(`Min purchase Rs. ${couponData.minAmount.toLocaleString()} required`);
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
    <div className="min-h-screen flex flex-col bg-white text-black selection:bg-black selection:text-white">
      <Navbar />
      
      <main className="flex-grow pt-40 pb-40 max-w-7xl mx-auto px-6 lg:px-12 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-12">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center space-x-3 text-black/40 hover:text-black transition-all duration-500 p-2 -ml-2 group"
            >
              <div className="w-8 h-8 rounded-full border border-black/5 flex items-center justify-center group-hover:border-black transition-colors">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.4em] font-black">RETURN_ARCHIVE</span>
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
            <div className="space-y-8">
              <div className="flex items-center space-x-6">
                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                <span className="font-mono text-xs tracking-widest uppercase text-black font-bold">ACQUISITION_MANIFEST</span>
              </div>
              <h1 className="text-6xl md:text-9xl font-display leading-none tracking-tightest font-medium text-black">Your <span className="text-black/10">Vault.</span></h1>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="bg-neutral-50 p-20 rounded-[4rem] text-center border border-black/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-[0.02] transition-opacity duration-1000" />
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-12 border border-black/5 shadow-2xl">
                <ShoppingBag className="text-black opacity-20" size={32} />
              </div>
              <h2 className="text-4xl font-display mb-6 font-medium text-black">The vault is currently empty.</h2>
              <p className="text-black/40 mb-12 max-w-sm mx-auto font-light leading-relaxed">
                Initialize your primary acquisition protocol by exploring our elite mechanical archives.
              </p>
              <Link to="/explore">
                <button className="bg-black text-white px-12 py-5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all">Initialize_Acquisition</button>
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
                      className={`group bg-white p-6 md:p-10 rounded-[3.5rem] border transition-all duration-700 relative overflow-hidden flex flex-col md:flex-row items-center gap-10 ${item.stock <= 0 ? 'border-red-100 opacity-40 grayscale-[0.8]' : 'border-black/5 hover:border-black/10 hover:shadow-xl'}`}
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none -rotate-12 translate-x-1/3 -translate-y-1/3 scale-150">
                        <Star size={200} />
                      </div>

                      <div className="w-32 h-40 md:w-40 md:h-52 shrink-0 bg-neutral-50 rounded-[2rem] flex items-center justify-center relative overflow-hidden border border-black/5">
                        <span className="font-display text-4xl opacity-[0.05] group-hover:opacity-[0.1] transition-opacity font-bold uppercase">{item.name?.[0] || 'D'}</span>
                        <div className="absolute inset-0 opacity-[0.01]" 
                             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                      </div>
                      
                      <div className="flex-grow space-y-4 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                           <span className="font-mono text-black tracking-widest text-[9px] font-bold uppercase opacity-40">{item.brand || 'DINOSPY'} // REF_{item.id?.slice(-8).toUpperCase() || 'N/A'}</span>
                           <button 
                             onClick={() => removeFromCart(item.id)}
                             className="text-black/20 hover:text-red-500 transition-colors self-center md:self-auto"
                           >
                              <X size={18} />
                           </button>
                        </div>
                        <h3 className="text-2xl md:text-4xl font-display text-black font-medium line-clamp-1">{item.name}</h3>
                        
                        <div className="flex items-center justify-center md:justify-start gap-4">
                           {item.discount && (!item.offerExpiry || new Date(item.offerExpiry) > new Date()) ? (
                             <div className="flex items-center space-x-3">
                               <span className="text-black/20 line-through text-xs font-light italic">Rs. {item.price.toLocaleString()}</span>
                               <span className="text-black font-display font-medium text-2xl">Rs. {Math.round(item.price * (1 - item.discount / 100)).toLocaleString()}</span>
                               <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded font-bold tracking-widest">-{item.discount}%</span>
                             </div>
                           ) : (
                             <div className="text-black font-display font-medium text-2xl">Rs. {item.price.toLocaleString()}</div>
                           )}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-black/5">
                           <div className="flex items-center bg-neutral-50 rounded-full p-1 border border-black/5">
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:text-black transition-colors">
                                 <Minus size={12} />
                              </button>
                              <span className="w-10 text-center font-mono font-bold text-sm text-black">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)} 
                                disabled={item.stock !== undefined && item.quantity >= item.stock}
                                className="w-8 h-8 flex items-center justify-center hover:text-black transition-colors disabled:opacity-20"
                              >
                                 <Plus size={12} />
                              </button>
                           </div>

                           {item.stock !== undefined && (
                             <div className={`text-[9px] uppercase font-bold tracking-widest flex items-center space-x-3 ${item.stock <= 0 ? 'text-red-500' : (item.stock <= 5 ? 'text-orange-500 bg-orange-50 px-3 py-1 rounded-full' : 'text-black/30')}`}>
                                {item.stock > 0 ? (
                                  <>
                                    <div className={`w-1.5 h-1.5 rounded-full ${item.stock <= 5 ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                                    <span>{item.stock <= 5 ? `REMAINING: ${item.stock}` : 'VAULT_READY'}</span>
                                  </>
                                ) : (
                                  <span className="font-bold">VAULT_DEPLETED</span>
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
                <div className="bg-neutral-50 p-12 rounded-[4rem] border border-black/5 sticky top-32 space-y-12 luxury-shadow">
                   <div className="space-y-4">
                      <span className="font-mono text-black tracking-widest text-[9px] font-bold uppercase opacity-40">MANIFEST_SUMMARY</span>
                      <h4 className="text-4xl font-display font-medium text-black">Acquisition <span className="opacity-20 italic">Total.</span></h4>
                   </div>

                   <div className="space-y-6 pt-10 border-t border-black/5">
                      <div className="flex justify-between items-center opacity-40">
                         <span className="font-mono text-[10px] tracking-widest uppercase font-bold">Base_Subtotal</span>
                         <span className="font-display font-medium text-xl">Rs. {subtotal.toLocaleString()}</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between items-center text-black">
                           <span className="font-mono text-[10px] tracking-widest uppercase font-bold">Vault_Savings</span>
                           <span className="font-display font-medium text-xl">-Rs. {savings.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center opacity-40">
                         <span className="font-mono text-[10px] tracking-widest uppercase font-bold">Courier_Privilege</span>
                         <span className="font-mono text-[10px] tracking-widest uppercase text-black font-bold">COMPLIMENTARY</span>
                      </div>
                      
                      <div className="pt-10 border-t border-black/10 space-y-8">
                         <div className="flex justify-between items-end">
                            <span className="font-mono text-[10px] tracking-[0.4em] uppercase font-bold">TOTAL_CARGO_VALUE</span>
                            <span className="text-4xl font-display text-black font-medium leading-none tracking-tightest">Rs. {cartTotal.toLocaleString()}</span>
                         </div>

                         <Link to={hasOutOfStock ? "#" : "/checkout"} className="block">
                            <button 
                              onClick={() => { if (hasOutOfStock) setShowErrorPopup(true); }}
                              className={`w-full py-6 bg-black text-white rounded-full flex items-center justify-center transition-all ${hasOutOfStock ? 'opacity-20 cursor-not-allowed' : 'hover:bg-neutral-800'}`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-widest">{hasOutOfStock ? 'VAULT_RESTRICTED' : 'AUTHORIZED_CHECKOUT'}</span>
                              {!hasOutOfStock && <ArrowRight className="ml-4" size={16} />}
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

      {/* Out of Stock Popup */}
      <AnimatePresence>
        {showErrorPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white max-w-xl w-full p-12 md:p-20 rounded-[5rem] border border-red-100 text-center relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none -rotate-12 transform scale-150">
                 <AlertCircle size={300} />
              </div>

              <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-red-100">
                <AlertCircle className="text-red-500" size={40} strokeWidth={1} />
              </div>

              <h2 className="text-4xl md:text-5xl font-display mb-6 font-medium leading-none">Vault <span className="text-red-500/40">Restriction.</span></h2>
              <p className="text-black/40 mb-12 text-xs md:text-sm italic font-light leading-relaxed max-w-md mx-auto">
                Primary acquisition handshake failed. Certain artifacts in your current manifest have been claimed or removed from the physical vault.
              </p>

              <div className="space-y-4 mb-12 text-left max-h-[30vh] overflow-y-auto no-scrollbar pr-2">
                {cart.filter(item => item.stock <= 0).map(item => (
                  <div key={item.id} className="flex items-center space-x-6 p-6 rounded-3xl bg-neutral-50 border border-black/5 group hover:border-red-500/20 transition-all">
                    <div className="w-16 h-16 rounded-xl bg-white border border-black/5 flex items-center justify-center relative overflow-hidden">
                       <span className="font-display text-xl opacity-10 font-bold uppercase">{item.name?.[0] || 'D'}</span>
                    </div>
                    <div className="flex-grow">
                       <p className="text-[10px] font-mono text-black opacity-40 uppercase tracking-widest font-bold mb-1">UNAVAILABLE_UNIT</p>
                       <p className="text-lg font-display font-medium text-black opacity-60">{item.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowErrorPopup(false)}
                className="w-full py-6 bg-red-500 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all"
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
