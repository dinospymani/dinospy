import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface WatchCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    price: number;
    discount?: number;
    isOffer?: boolean;
    images: string[];
    category: string;
    rating: number;
    stock?: number;
    isLimited?: boolean;
  };
}

export default function WatchCard({ product }: WatchCardProps) {
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const { user, setIsAuthModalOpen } = useAuth();
  const isWishlisted = wishlist.includes(product.id);
  const discountPrice = product.discount ? product.price * (1 - product.discount / 100) : product.price;
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3;
  const isOutOfStock = product.stock !== undefined && product.stock === 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -15 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="group relative glass p-6 rounded-3xl overflow-hidden border border-white/5 hover:border-gold/30 transition-all duration-700 shadow-2xl"
    >
      <motion.div 
        className="absolute inset-0 z-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        initial={false}
      />
      <div className="absolute top-5 left-5 z-10 flex flex-col space-y-2">
        {isOutOfStock ? (
          <div className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-sm shadow-2xl border border-white/20">
            Out of Stock
          </div>
        ) : isLowStock ? (
          <div className="px-3 py-1 bg-orange-600/90 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-sm shadow-lg animate-pulse">
            Only {product.stock} Left
          </div>
        ) : product.isLimited && (
          <div className="px-3 py-1 gold-gradient text-luxury-black text-[8px] font-black uppercase tracking-[0.2em] rounded-sm shadow-lg">
            Limited Edition
          </div>
        )}
        {product.isOffer && (
          <div className="px-3 py-1 bg-red-600/90 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-sm shadow-lg">
            Private Offer
          </div>
        )}
      </div>
      
      <button 
        onClick={(e) => {
          e.preventDefault();
          if (!user) {
            setIsAuthModalOpen(true);
            return;
          }
          toggleWishlist(product.id);
        }}
        className={`absolute top-5 right-5 z-10 p-3 glass rounded-full backdrop-blur-md border border-white/10 transition-all ${isWishlisted ? 'text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-white/40 hover:text-red-500'}`}
      >
        <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
      </button>

      <Link to={`/product/${product.id}`} className="block aspect-[4/5] mb-8 overflow-hidden rounded-2xl bg-luxury-gray/30 relative group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-700">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-[0.23, 1, 0.32, 1] ${isOutOfStock ? 'grayscale opacity-50 contrast-[0.8]' : ''}`}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <span className="text-white/40 font-display text-sm uppercase tracking-[0.5em] -rotate-12 border-2 border-white/10 px-6 py-2">Acquired</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-[9px] uppercase tracking-[0.3em] font-black text-gold/60">{product.brand}</span>
          <div className="flex items-center text-gold space-x-1.5 bg-gold/5 px-2 py-1 rounded-lg border border-gold/10">
            <Star size={10} fill="currentColor" />
            <span className="text-[10px] font-black tracking-tighter">{product.rating}</span>
          </div>
        </div>
        <h3 className="text-xl font-display group-hover:text-gold transition-colors leading-tight min-h-[3.5rem] line-clamp-2 uppercase tracking-wide">{product.name}</h3>
        
        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <div className="flex flex-col">
            {product.discount && product.discount > 0 && (
              <span className="text-[10px] line-through text-white/20 mb-0.5 font-mono">
                ₹{product.price.toLocaleString()}
              </span>
            )}
            <div className={`text-2xl font-mono tracking-tighter ${isOutOfStock ? 'text-white/10' : 'text-gold'}`}>
              ₹{discountPrice.toLocaleString()}
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            disabled={isOutOfStock}
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              addToCart(product);
            }}
            className={`p-4 rounded-2xl transition-all shadow-xl ${isOutOfStock ? 'bg-white/5 text-white/10 cursor-not-allowed' : 'gold-gradient text-luxury-black hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'}`}
          >
            <ShoppingBag size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
