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
      className="group relative h-full perspective-[1000px] cursor-pointer"
    >
      <div className="bg-white rounded-[2rem] p-6 md:p-8 luxury-shadow transition-all duration-1000 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-black/5 flex flex-col h-full relative overflow-hidden group/card scale-[0.98] hover:scale-100">
        
        {/* Luxury Background Detail */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none -rotate-12 translate-x-1/4 -translate-y-1/4 group-hover/card:opacity-[0.05] transition-opacity duration-1000">
           <Star size={300} strokeWidth={1} />
        </div>

        <div className="flex items-center justify-between mb-8 relative z-10 transition-transform duration-700 translate-z-[40px]">
          <span className="font-mono text-black/40 tracking-widest text-[9px] font-bold uppercase">CODE_{product.id.slice(-6)}</span>
          <div className="flex items-center space-x-1 opacity-20">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={8} className={`${i < Math.floor(product.rating) ? 'text-black fill-black' : 'text-black/10'}`} />
            ))}
          </div>
        </div>

        <Link 
          to={`/product/${product.id}`} 
          className="relative aspect-square mb-10 rounded-2xl overflow-hidden group/img block transition-transform duration-700 translate-z-[60px] bg-[#fdfdfd] border border-black/5"
        >
          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50 group-hover/img:bg-neutral-100 transition-colors duration-1000">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover/img:scale-110"
                referrerPolicy="no-referrer"
              />
            ) : (
              <>
                <div className="font-display text-9xl opacity-[0.03] select-none group-hover/img:opacity-[0.08] transition-opacity duration-1000 pointer-events-none">
                  {product.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-1/4 h-[1px] bg-black/10 mb-6 scale-x-0 group-hover/img:scale-x-150 transition-transform duration-1000" />
                  <span className="font-mono text-[8px] tracking-[0.6em] text-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-1000 uppercase font-black">Geometric_Asset</span>
                </div>
              </>
            )}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-700">
            <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-black shadow-2xl scale-50 group-hover/img:scale-100 transition-transform duration-700">
               <ArrowUpRight size={24} strokeWidth={1} />
            </div>
          </div>
          
          {product.isLimited && (
            <div className="absolute bottom-6 left-6 bg-black px-5 py-2 rounded-full">
               <span className="font-mono text-[8px] tracking-widest font-bold text-white uppercase">LIMITED</span>
            </div>
          )}
        </Link>

        <div className="flex-grow space-y-4 relative z-10 translate-z-[20px]">
          <div className="flex flex-col">
            <span className="font-mono text-black/30 tracking-widest text-[9px] mb-2 uppercase font-bold">{product.brand}</span>
            <h3 className="text-3xl font-display text-black leading-tight group-hover/card:translate-x-2 transition-transform duration-700">
              {product.name}
            </h3>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between relative z-10 translate-z-[50px]">
          <div className="flex flex-col">
            <span className="font-mono text-black/30 text-[8px] mb-1 tracking-widest uppercase font-bold">VALUATION</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-mono tracking-tighter font-black text-black">
                ₹{discountPrice.toLocaleString()}
              </span>
              {product.discount && (
                <span className="text-xs font-mono text-black/20 line-through">₹{product.price.toLocaleString()}</span>
              )}
            </div>
          </div>

          <MagneticButton 
            onClick={() => {
              if (!user) { setIsAuthModalOpen(true); return; }
              addToCart(product);
              toast.success(`${product.name} Added to Vault`);
            }}
            className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center luxury-shadow hover:bg-neutral-800 transition-all active:scale-90"
          >
            <Plus size={24} strokeWidth={1} />
          </MagneticButton>
        </div>
      </div>
    </motion.div>
  );
}
