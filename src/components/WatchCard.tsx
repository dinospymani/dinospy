import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Heart, ShoppingBag, Star, Share2, Plus, ArrowUpRight, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
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
      <div className="bg-ivory rounded-[2.5rem] p-8 luxury-shadow transition-all duration-1000 hover:shadow-[0_60px_100px_-20px_rgba(0,0,0,0.15)] border border-charcoal/5 flex flex-col h-full relative overflow-hidden group/card scale-[0.98] hover:scale-100">
        
        {/* Luxury Background Detail */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none -rotate-12 translate-x-1/4 -translate-y-1/4 group-hover/card:opacity-[0.05] transition-opacity duration-1000">
           <Star size={300} strokeWidth={1} className="text-charcoal" />
        </div>

        <div className="flex items-center justify-between mb-10 relative z-10 transition-transform duration-700 translate-z-[40px]">
          <span className="font-mono text-charcoal/40 tracking-[0.4em] text-[9px] font-black uppercase">CALIBER_{product.id?.slice(-6).toUpperCase() || 'N/A'}</span>
          <div className="flex items-center space-x-1 opacity-20">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={10} className={`${i < Math.floor(product.rating) ? 'text-charcoal fill-charcoal' : 'text-charcoal/10'}`} />
            ))}
          </div>
        </div>

        <Link 
          to={`/product/${product.id}`} 
          className="relative aspect-square mb-12 rounded-[2rem] overflow-hidden group/img block transition-transform duration-700 translate-z-[60px] bg-soft-silver border border-charcoal/5"
        >
          <div className={`w-full h-full flex flex-col items-center justify-center transition-all duration-1000 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}>
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
              </>
            )}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-700">
            <div className="w-18 h-18 rounded-full bg-charcoal text-ivory flex items-center justify-center shadow-2xl scale-50 group-hover/img:scale-100 transition-transform duration-700">
               <ArrowUpRight size={24} strokeWidth={1.5} />
            </div>
          </div>
          
          {product.isLimited && (
            <div className="absolute bottom-8 left-8 bg-luxury-gold px-6 py-2 rounded-full shadow-lg z-20">
               <span className="font-mono text-[8px] tracking-[0.2em] font-black text-charcoal uppercase text-xs">LIMITED_EDITION</span>
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute top-8 left-8 bg-black/80 backdrop-blur-md px-6 py-2 rounded-full shadow-lg z-20 border border-white/10 flex items-center space-x-2">
               <Bell size={12} className="text-luxury-gold" />
               <span className="font-mono text-[8px] tracking-[0.2em] font-black text-white uppercase text-xs">SOLD_OUT</span>
            </div>
          )}
        </Link>

        <div className="flex-grow space-y-6 relative z-10 translate-z-[20px]">
          <div className="flex flex-col">
            <div className="flex items-center space-x-3 mb-2">
               <div className="w-1 h-1 rounded-full bg-luxury-gold" />
               <span className="font-mono text-charcoal/30 tracking-[0.3em] text-[9px] uppercase font-black">{product.brand}</span>
            </div>
            <h3 className="text-4xl font-display text-charcoal leading-tight group-hover/card:translate-x-3 transition-transform duration-1000 font-medium">
              {product.name}
            </h3>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between relative z-10 translate-z-[50px]">
          <div className="flex flex-col">
            <span className="font-mono text-charcoal/30 text-[8px] mb-2 tracking-[0.4em] uppercase font-black">VALUATION</span>
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-display font-medium tracking-tight text-charcoal">
                Rs. {discountPrice.toLocaleString()}
              </span>
              {product.discount && (
                <span className="text-sm font-mono text-charcoal/20 line-through">Rs. {product.price.toLocaleString()}</span>
              )}
            </div>
          </div>

          <MagneticButton 
            onClick={() => {
              if (!user) { navigate('/login'); return; }
              if (isOutOfStock) {
                toast.success(`Priority Alert: We will notify you when ${product.name} returns to the vault.`);
                return;
              }
              addToCart(product);
              toast.success(`${product.name} Added to Vault`);
            }}
            className={`w-16 h-16 ${isOutOfStock ? 'bg-black text-white' : 'bg-luxury-gold text-charcoal'} rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all active:scale-90`}
          >
            {isOutOfStock ? <Bell size={28} strokeWidth={1.5} /> : <Plus size={28} strokeWidth={1.5} />}
          </MagneticButton>
        </div>
        
        {/* Animated Gold Border on Hover */}
        <div className="absolute inset-x-12 bottom-0 h-[3px] bg-luxury-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-center" />
      </div>
    </motion.div>
  );
}
