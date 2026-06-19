import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingBag, Star, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

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
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="group flex flex-col h-full bg-white border border-black/5 p-6 md:p-8 transition-all duration-1000 hover:border-black/20 relative"
    >
      {/* Identification Header */}
      <div className="flex items-center justify-between mb-8 md:mb-12 opacity-40 group-hover:opacity-100 transition-opacity duration-1000">
        <div className="flex items-center space-x-6">
          <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
          <span className="font-tech">REF_{product.id.slice(-6).toUpperCase()}</span>
        </div>
        <span className="font-tech">CHAPTER_0{product.category === 'classic' ? '1' : '2'}</span>
      </div>

      <Link to={`/product/${product.id}`} className="block aspect-[3/4] overflow-hidden relative mb-10 md:mb-16 bg-[#F9F9F9] group/img">
        <motion.img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover grayscale brightness-110 contrast-[1.1] transition-all duration-[3s] ease-[0.16,1,0.3,1] group-hover/img:scale-105 group-hover/img:brightness-100 group-hover/img:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-40" />
        
        {/* Cinematic Label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-0 group-hover/img:opacity-100 transition-all duration-1000 scale-150 group-hover/img:scale-100">
           <span className="font-tech text-black text-[10px] tracking-[1.5em] translate-x-[0.75em] mb-4">MATERIALIZE</span>
           <div className="w-16 h-[1px] bg-black" />
        </div>

        {/* Limited Flag */}
        {product.isLimited && (
          <div className="absolute top-4 left-4 bg-black text-white px-4 py-2 font-tech text-[8px] tracking-widest font-bold">
            LTD_EDITION
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-grow">
        <div className="space-y-4 md:space-y-6 mb-10 md:mb-16">
          <span className="font-tech text-black/20 tracking-[0.3em] md:tracking-[0.5em] group-hover:text-black transition-colors duration-1000 text-[8px] md:text-[10px]">{product.brand} // CALIBER_CORE</span>
          <h3 className="text-4xl md:text-6xl italic font-display leading-[0.8] md:leading-[0.7] tracking-tightest group-hover:text-black/80 transition-all duration-1000 uppercase">
            {product.name}
          </h3>
        </div>
        
        <div className="mt-auto pt-8 md:pt-12 border-t border-black/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-tech text-[8px] text-black/20 mb-1 md:mb-2">VALUATION_UNIT</span>
            <span className="text-2xl md:text-4xl font-tech tracking-tight">INR_{discountPrice.toLocaleString()}</span>
          </div>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              if (isOutOfStock) return;
              addToCart(product);
            }}
            className={`w-20 h-20 rounded-full border flex items-center justify-center transition-all duration-1000 ${
              isOutOfStock 
                ? 'border-black/5 text-black/10 cursor-not-allowed' 
                : 'border-black/10 text-black/40 hover:bg-black hover:text-white hover:border-black'
            }`}
          >
            {isWishlisted ? (
              <Heart fill="black" size={14} className="text-white" />
            ) : (
              <span className="font-tech text-[8px] tracking-widest">{isOutOfStock ? 'OFF' : 'ADD'}</span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
