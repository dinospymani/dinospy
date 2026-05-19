import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { Link } from 'react-router-dom';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-luxury-black">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="glass p-6 rounded-3xl flex items-center space-x-6 border border-white/5"
                    >
                      <img 
                        src={item.images[0]} 
                        className="w-24 h-32 object-cover rounded-xl bg-white/5" 
                        alt={item.name} 
                      />
                      <div className="flex-grow">
                        <span className="text-[10px] uppercase tracking-widest text-white/30">{item.brand}</span>
                        <h3 className="text-xl font-display mt-1">{item.name}</h3>
                        <div className="text-gold font-mono mt-2">₹{item.price.toLocaleString()}</div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center glass rounded-full p-1 border border-white/10">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-2 hover:text-gold transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-10 text-center font-mono font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-2 hover:text-gold transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-3 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={20} />
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
                      <span className="font-mono text-white">₹{cartTotal.toLocaleString()}</span>
                    </div>
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
                    to="/checkout"
                    className="w-full py-5 gold-gradient text-luxury-black font-bold uppercase tracking-widest flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all"
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
    </div>
  );
}
