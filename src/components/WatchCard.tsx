import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

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
  const isWishlisted = wishlist.includes(product.id);
  const discountPrice = product.discount ? product.price * (1 - product.discount / 100) : product.price;
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3;
  const isOutOfStock = product.stock !== undefined && product.stock === 0;

  return (
    <motion.div 
      whileHover={{ y: -12 }}
      className="group relative glass p-5 rounded-2xl overflow-hidden border border-white/5 hover:border-gold/40 transition-all duration-700 shadow-xl"
    >
      <motion.div 
        className="absolute inset-0 z-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        initial={false}
      />
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        {isOutOfStock ? (
          <div className="px-3 py-1 bg-red-600/80 text-white text-[10px] font-bold uppercase tracking-tighter">
            Sold Out
          </div>
        ) : isLowStock ? (
          <div className="px-3 py-1 bg-orange-600 text-white text-[10px] font-bold uppercase tracking-tighter animate-pulse">
            Only {product.stock} Left
          </div>
        ) : product.isLimited && (
          <div className="px-3 py-1 gold-gradient text-luxury-black text-[10px] font-bold uppercase tracking-tighter">
            Limited
          </div>
        )}
        {product.isOffer && (
          <div className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-tighter">
            Special Offer
          </div>
        )}
        {product.discount && product.discount > 0 ? (
          <div className="px-3 py-1 bg-gold text-luxury-black text-[10px] font-bold uppercase tracking-tighter">
            {product.discount}% OFF
          </div>
        ) : null}
      </div>
      
      <button 
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
        }}
        className={`absolute top-4 right-4 z-10 p-2 glass rounded-full transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'hover:text-red-500'}`}
      >
        <Heart size={16} />
      </button>

      <Link to={`/product/${product.id}`} className="block aspect-[4/5] mb-6 overflow-hidden rounded-lg bg-luxury-gray/50 relative">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-white font-display text-xl uppercase tracking-[0.2em] -rotate-12 border border-white/20 px-4 py-2 bg-black/60 backdrop-blur-sm">Sold Out</span>
          </div>
        )}
      </Link>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-widest text-white/50">{product.brand}</span>
          <div className="flex items-center text-gold space-x-1 bg-gold/10 px-2 py-0.5 rounded">
            <Star size={10} fill="currentColor" />
            <span className="text-[10px] font-bold">{product.rating}</span>
          </div>
        </div>
        <h3 className="text-lg font-display group-hover:text-gold transition-colors leading-tight min-h-[3rem] line-clamp-2">{product.name}</h3>
        
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            {product.discount && product.discount > 0 && (
              <span className="text-[10px] line-through text-white/30 mb-0.5 font-mono">
                ₹{product.price.toLocaleString()}
              </span>
            )}
            <div className={`text-xl font-mono font-medium ${isOutOfStock ? 'text-white/20' : 'text-gold'}`}>
              ₹{discountPrice.toLocaleString()}
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isOutOfStock}
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className={`p-3 rounded-xl transition-all ${isOutOfStock ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'glass hover:bg-gold hover:text-luxury-black border border-white/10 group-hover:border-gold/50'}`}
          >
            <ShoppingBag size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
