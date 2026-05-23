import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { X, AlertCircle } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const savings = subtotal - cartTotal;
  const [outOfStockItems, setOutOfStockItems] = React.useState<string[]>([]);
  const [showErrorPopup, setShowErrorPopup] = React.useState(false);

  React.useEffect(() => {
    const obs = cart.filter(item => item.stock <= 0).map(item => item.name);
    if (obs.length > 0 && JSON.stringify(obs) !== JSON.stringify(outOfStockItems)) {
      setOutOfStockItems(obs);
    }
  }, [cart]);

  const hasOutOfStock = cart.some(item => item.stock <= 0);

  return (
    <div className="min-h-screen flex flex-col bg-luxury-black">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-white/60 hover:text-gold transition-colors p-2 -ml-2"
            >
              <ArrowLeft size={20} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Return</span>
            </button>
          </div>
          <h1 className="text-5xl font-display mb-12 gold-text">Your Collection</h1>

          {cart.length === 0 ? (
            <div className="glass p-20 rounded-[3rem] text-center border border-white/5">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                <ShoppingBag className="text-white/20" size={32} />
              </div>
              <h2 className="text-2xl font-display mb-4">Your vault is empty</h2>
              <p className="text-white/40 mb-12 max-w-md mx-auto">
                Discover our latest collections and start your journey with DINOSPY.
              </p>
              <Link 
                to="/" 
                className="inline-block px-10 py-5 gold-gradient text-luxury-black font-bold uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Browse Watches
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`glass p-4 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 border transition-all duration-700 ${item.stock <= 0 ? 'border-red-900/30 opacity-40 grayscale-[0.8]' : 'border-white/5'}`}
                    >
                      <div className="flex items-center space-x-4 sm:space-x-6 w-full sm:w-auto">
                        <img 
                          src={item.images[0]} 
                          className="w-20 h-24 sm:w-24 sm:h-32 object-cover rounded-xl bg-white/5 shrink-0" 
                          alt={item.name} 
                        />
                        <div className="flex-grow">
                          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/30">{item.brand}</span>
                          <h3 className="text-lg sm:text-xl font-display mt-1 line-clamp-1">{item.name}</h3>
                          <div className="flex flex-col mt-1 sm:mt-2">
                             {item.discount ? (
                               <div className="flex items-center space-x-2">
                                 <span className="text-white/20 line-through text-[10px] font-light italic">₹{item.price.toLocaleString()}</span>
                                 <span className="text-gold font-mono text-sm sm:text-base">₹{Math.round(item.price * (1 - item.discount / 100)).toLocaleString()}</span>
                                 <span className="text-[8px] bg-gold/10 text-gold px-1.5 py-0.5 rounded font-black tracking-tighter">-{item.discount}%</span>
                               </div>
                             ) : (
                               <div className="text-gold font-mono text-sm sm:text-base">₹{item.price.toLocaleString()}</div>
                             )}
                           </div>
                           {item.stock !== undefined && (
                            <div className={`text-[9px] sm:text-[10px] uppercase font-bold mt-1 sm:mt-2 flex items-center space-x-2 ${item.stock <= 0 ? 'text-red-500' : (item.stock <= 5 ? 'text-orange-500' : 'text-white/40')}`}>
                               {item.stock > 0 ? (
                                 <>
                                   <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${item.stock <= 5 ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                                   <span>{item.stock} Units</span>
                                 </>
                               ) : (
                                 <>
                                   <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500" />
                                   <span className="font-black">OUT OF STOCK</span>
                                 </>
                               )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between w-full sm:w-auto sm:flex-grow-0 sm:space-x-4 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                        <div className="flex items-center glass rounded-full p-1 border border-white/10">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 sm:p-2 hover:text-gold transition-colors"
                          >
                            <Minus size={14} className="sm:w-4 sm:h-4" />
                          </button>
                          <span className="w-8 sm:w-10 text-center font-mono font-bold text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={item.stock !== undefined && item.quantity >= item.stock}
                            className={`p-1 sm:p-2 transition-colors ${item.stock !== undefined && item.quantity >= item.stock ? 'opacity-20 cursor-not-allowed' : 'hover:text-gold'}`}
                          >
                            <Plus size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="flex items-center space-x-2 text-white/40 hover:text-red-500 transition-colors py-2 px-4 rounded-xl hover:bg-red-500/10"
                        >
                          <Trash2 size={18} />
                          <span className="text-[10px] uppercase tracking-widest font-bold sm:hidden">Remove</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="lg:col-span-1">
                <div className="glass p-8 rounded-[2.5rem] border border-white/10 sticky top-32">
                  <h2 className="text-xl font-bold uppercase tracking-widest mb-8">Summary</h2>
                  <div className="space-y-4 mb-8 pb-8 border-b border-white/5">
                    <div className="flex justify-between text-white/50">
                      <span>Subtotal</span>
                      <span className="font-mono text-white">₹{subtotal.toLocaleString()}</span>
                    </div>
                    {savings > 0 && (
                      <div className="flex justify-between text-gold/60">
                        <span className="uppercase text-[10px] font-bold tracking-widest">Acquisition Savings</span>
                        <span className="font-mono">-₹{savings.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white/50">
                      <span>Shipping</span>
                      <span className="text-gold uppercase text-[10px] font-bold tracking-widest">Complimentary</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end mb-10">
                    <span className="text-lg font-bold uppercase tracking-widest">Total</span>
                    <span className="text-3xl font-mono text-gold">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <Link 
                    to={hasOutOfStock ? "#" : "/checkout"}
                    onClick={(e) => {
                      if (hasOutOfStock) {
                        e.preventDefault();
                        setShowErrorPopup(true);
                      }
                    }}
                    className={`w-full py-5 font-bold uppercase tracking-widest flex items-center justify-center transition-all ${hasOutOfStock ? 'bg-white/10 text-white/50 cursor-pointer' : 'gold-gradient text-luxury-black hover:scale-[1.02] active:scale-[0.98]'}`}
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2" size={18} />
                  </Link>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-luxury-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass max-w-md w-full p-10 rounded-[2.5rem] border border-red-500/20 text-center relative"
            >
              <button 
                onClick={() => setShowErrorPopup(false)}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                <AlertCircle className="text-red-500" size={32} />
              </div>

              <h2 className="text-2xl font-display mb-4 uppercase tracking-wider">Vault Restriction</h2>
              <p className="text-white/40 mb-10 text-[11px] uppercase tracking-widest leading-relaxed">
                Some assets in your selection are no longer available in our vault. Please remove the following items to proceed:
              </p>

              <div className="space-y-4 mb-10 text-left">
                {cart.filter(item => item.stock <= 0).map(item => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-white/5 bg-white/[0.02]">
                    <img src={item.images[0]} className="w-12 h-12 object-cover opacity-50" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">{item.name}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowErrorPopup(false)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-[0.3em] text-[10px] transition-all border border-white/10"
              >
                Return to Collection
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
