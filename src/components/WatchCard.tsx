import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Heart, ShoppingBag, Star, Share2, Plus, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { MagneticButton } from './MagneticButton';

interface WatchCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    price: number;
    discount?: number;
    images: string[];
    category: string;
    rating: number;
    isLimited?: boolean;
    stock?: number;
  };
}

export default function WatchCard({ product }: WatchCardProps) {
  const { addToCart, wishlist } = useCart();
  const { user, setIsAuthModalOpen } = useAuth();
  const isWishlisted = wishlist.includes(product.id);
  const discountPrice = Math.round(product.discount ? product.price * (1 - product.discount / 100) : product.price);
  
  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div 
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative h-full perspective-[1000px]"
    >
      <div className="bg-graphite rounded-[3rem] p-8 md:p-10 luxury-shadow transition-all duration-700 hover:shadow-[0_80px_100px_-40px_rgba(0,0,0,0.4)] border border-white/5 flex flex-col h-full relative overflow-hidden">
        
        {/* Luxury Background Detail */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none -rotate-12 translate-x-1/4 -translate-y-1/4">
           <Star size={300} strokeWidth={1} />
        </div>

        <div className="flex items-center justify-between mb-10 relative z-10 transition-transform duration-700 group-hover:translate-z-[40px]">
          <span className="font-tech text-gold tracking-[0.4em] text-[9px] font-black uppercase">REF_{product.id.slice(-6)}</span>
          <div className="flex items-center space-x-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={8} className={`${i < Math.floor(product.rating) ? 'text-gold fill-gold' : 'text-white/5'}`} />
            ))}
          </div>
        </div>

        <Link 
          to={`/product/${product.id}`} 
          className="relative aspect-[4/5] mb-12 rounded-[2rem] overflow-hidden group/img block transition-transform duration-700 group-hover:translate-z-[60px]"
        >
          <motion.img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-[2s] ease-[0.16,1,0.3,1] group-hover/img:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-1000" />
          
          <div className="absolute top-6 right-6">
            <MagneticButton className="w-12 h-12 glass rounded-full flex items-center justify-center text-text shadow-xl">
               <ArrowUpRight size={18} />
            </MagneticButton>
          </div>
          
          {product.isLimited && (
            <div className="absolute bottom-6 left-6 glass px-5 py-2 rounded-full backdrop-blur-md">
               <span className="font-tech text-[8px] tracking-[0.2em] font-black text-text uppercase">LIMITED</span>
            </div>
          )}
        </Link>

        <div className="flex-grow space-y-6 relative z-10 transition-transform duration-700 group-hover:translate-z-[20px]">
          <div className="flex flex-col">
            <span className="font-tech text-gold tracking-[0.2em] text-[10px] mb-2 uppercase">{product.brand}</span>
            <h3 className="text-4xl font-display italic text-text leading-tight group-hover:text-gold transition-colors duration-700">
              {product.name.split('_')[0]} <span className="opacity-20 font-sans italic">{product.name.split('_')[1] || ''}</span>
            </h3>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between relative z-10 transition-transform duration-700 group-hover:translate-z-[50px]">
          <div className="flex flex-col">
            <span className="font-tech text-text/30 text-[8px] mb-1 tracking-widest uppercase">VALU_VALUATION</span>
            <span className="text-2xl font-tech tracking-tight font-black">
               <span className="text-text/20 mr-1">INR.</span>
               {discountPrice.toLocaleString()}
            </span>
          </div>

          <MagneticButton 
            onClick={() => {
              if (!user) { setIsAuthModalOpen(true); return; }
              addToCart(product);
              toast.success(`${product.name} added to vault`);
            }}
            className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center luxury-shadow hover:bg-gold transition-colors"
          >
            <Plus size={24} strokeWidth={1} />
          </MagneticButton>
        </div>
      </div>
    </motion.div>
  );
}
