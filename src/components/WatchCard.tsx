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
  const discountPrice = Math.round(product.discount ? product.price * (1 - product.discount / 100) : product.price);
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3;
  const isOutOfStock = product.stock !== undefined && product.stock === 0;

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, scale: 0.98, y: 30 },
        visible: { opacity: 1, scale: 1, y: 0 }
      }}
      whileHover={{ y: -16 }}
      transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
      className="group relative p-3 sm:p-10 rounded-none border border-white/5 hover:border-gold/30 transition-all duration-1000 bg-white/[0.01] hover:bg-white/[0.03] flex flex-col luxury-shadow"
    >
      <div className="absolute top-2 sm:top-8 left-2 sm:left-8 z-10 flex flex-col space-y-2 sm:space-y-3">
        {product.isLimited && (
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 border border-gold/40 text-gold text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.3em] bg-luxury-black/50 backdrop-blur-sm">
            Limited
          </div>
        )}
        {isOutOfStock && (
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 border border-red-900/50 text-red-500 text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.3em] bg-luxury-black/80 backdrop-blur-sm">
            Out of Stock
          </div>
        )}
      </div>
      
      <div className="absolute top-2 sm:top-8 right-2 sm:right-8 z-10 flex flex-col space-y-2">
        <button 
          onClick={(e) => {
            e.preventDefault();
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            toggleWishlist(product.id);
          }}
          className={`p-2 transition-all duration-500 ${isWishlisted ? 'text-gold' : 'text-white/20 hover:text-gold'}`}
        >
          <Heart size={16} className="sm:w-[18px] sm:h-[18px]" fill={isWishlisted ? "currentColor" : "none"} strokeWidth={1} />
        </button>
        
        {/* Quick Add Mobile Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            addToCart(product);
          }}
          disabled={isOutOfStock}
          className={`sm:hidden p-2 transition-all duration-500 ${isOutOfStock ? 'text-white/5' : 'text-white/20 active:text-gold active:bg-gold/10 rounded-full'}`}
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
        </button>
      </div>

      <Link to={`/product/${product.id}`} className="block aspect-square mb-6 sm:mb-12 overflow-hidden bg-luxury-black/50 relative group-hover:shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-all duration-[1s] ease-[0.22,1,0.36,1]">
        <motion.img 
          layoutId={`image-${product.id}`}
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-contain p-2 sm:p-12 group-hover:scale-105 transition-transform duration-[2.5s] ease-[0.22,1,0.36,1]"
        />
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      </Link>

      <div className="space-y-4 sm:space-y-6 flex-grow flex flex-col justify-end">
        <div className="text-center">
          <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.4em] font-medium text-gold/50 mb-1 sm:mb-3 block text-center w-full">{product.brand}</span>
          <h3 className="text-sm sm:text-xl font-display group-hover:text-gold transition-colors leading-tight line-clamp-1 italic tracking-wide uppercase px-1 text-center w-full">{product.name}</h3>
        </div>
        
        <div className="flex flex-col items-center pt-6 sm:pt-8 border-t border-white/5 space-y-4">
          <div className={`flex flex-col items-center ${isOutOfStock ? 'text-white/10' : ''}`}>
            {product.discount ? (
              <div className="flex items-center space-x-3 mb-1">
                <span className="text-[9px] sm:text-[10px] text-white/20 line-through tracking-widest italic decoration-gold/30">
                  INR {product.price.toLocaleString()}
                </span>
                <span className="text-[7px] sm:text-[9px] bg-gold/10 text-gold px-1.5 py-0.5 rounded font-black uppercase tracking-tighter shadow-[0_0_5px_rgba(212,175,55,0.1)]">
                  -{product.discount}%
                </span>
              </div>
            ) : null}
            <div className={`text-lg sm:text-xl font-sans font-light tracking-[0.2em] ${!isOutOfStock && product.discount ? 'text-gold' : 'text-white/90'}`}>
              <span className="text-[9px] sm:text-[10px] text-white/30 mr-2 uppercase">INR</span>
              {discountPrice.toLocaleString()}
            </div>
          </div>
          
          <motion.button 
            whileHover={{ letterSpacing: "0.4em" }}
            disabled={isOutOfStock}
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              addToCart(product);
            }}
            className={`w-full py-4 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.3em] transition-all duration-500 border border-white/10 group-hover:border-gold/50 hidden sm:block ${isOutOfStock ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-gold hover:bg-gold/5'}`}
          >
            {isOutOfStock ? 'Out of Inventory' : 'Add to Collection'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
