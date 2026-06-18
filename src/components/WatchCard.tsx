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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col transition-all duration-700"
    >
      <div className="absolute top-4 left-4 z-10">
        {product.isLimited && (
          <div className="px-3 py-1 hairline bg-bg/80 backdrop-blur-md text-gold font-tech text-[7px]">
            REF_LTD_EDITION
          </div>
        )}
      </div>
      
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.preventDefault();
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            toggleWishlist(product.id);
          }}
          className={`p-3 transition-all duration-500 border ${
            isWishlisted 
              ? 'bg-gold text-bg border-gold shadow-[0_0_30px_rgba(197,160,89,0.3)]' 
              : 'bg-bg/80 text-text border-text/10'
          }`}
        >
          <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={1} />
        </motion.button>
      </div>

      <Link to={`/product/${product.id}`} className="block aspect-[3/4] overflow-hidden relative mb-8 hairline bg-slate">
        <motion.img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-[2s] ease-[0.22,1,0.36,1] grayscale group-hover:grayscale-0 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      </Link>

      <div className="flex flex-col flex-grow px-2">
        <div className="flex justify-between items-start mb-6">
           <div className="space-y-1">
             <span className="font-tech text-gold text-[8px] font-bold">{product.brand}</span>
             <h3 className="text-xl leading-none italic">{product.name}</h3>
           </div>
           <span className="font-tech text-[8px] text-text/20">SEQ_{product.id.slice(-4).toUpperCase()}</span>
        </div>
        
        <div className="flex items-center justify-between pt-8 border-t border-text/5 mt-auto">
          <div className="flex flex-col">
            <p className="text-lg font-tech tracking-tight">
              <span className="text-[10px] text-text/30 mr-2">INR_</span>
              {discountPrice.toLocaleString()}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              addToCart(product);
            }}
            disabled={isOutOfStock}
            className={`px-6 py-2 border transition-all duration-700 font-tech text-[10px] ${
              isOutOfStock 
                ? 'border-text/5 text-text/10 cursor-not-allowed' 
                : 'border-text/10 text-text/40 hover:text-gold hover:border-gold'
            }`}
          >
            {isOutOfStock ? 'ARCHIVED' : 'RESERVE'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
