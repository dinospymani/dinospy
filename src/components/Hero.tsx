import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Watch3D } from './Watch3D';
import { MagneticButton } from './MagneticButton';
import gsap from 'gsap';
import { ChevronRight, Play } from 'lucide-react';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef1 = useRef<HTMLSpanElement>(null);
  const titleRef2 = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from([titleRef1.current, titleRef2.current], {
        y: 150,
        opacity: 0,
        rotateX: -30,
        duration: 2,
        stagger: 0.2
      })
      .from(subtitleRef.current, {
        y: 50,
        opacity: 0,
        duration: 1.5
      }, "-=1.5")
      .from(ctaRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 1
      }, "-=1");
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white pt-24">
      
      {/* Ambient Background Detail */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-neutral-50/50 to-white" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="container mx-auto px-6 md:px-12 grid grid-cols-12 items-center relative z-10">
        
        {/* Left: Text Content */}
        <div className="col-span-12 lg:col-span-6 flex flex-col items-start space-y-12 mb-20 lg:mb-0">
          <div ref={subtitleRef} className="flex items-center space-x-6 opacity-40">
             <div className="w-1.5 h-1.5 bg-black rounded-full" />
             <span className="font-tech text-xs tracking-[0.6em] uppercase text-black">CRAFTED FOR THOSE WHO LEAD</span>
          </div>

          <h1 className="text-[12vw] lg:text-[9rem] font-display font-medium leading-[0.85] text-black tracking-tightest flex flex-col">
            <span ref={titleRef1} className="block">TIME DEFINES</span> 
            <span ref={titleRef2} className="opacity-20 block">GREATNESS.</span>
          </h1>

          <div className="max-w-xl space-y-12" ref={ctaRef}>
            <p className="text-black/60 text-xl md:text-2xl font-light leading-relaxed">
              Experience the pinnacle of horological engineering. A masterclass in precision, designed for the visionaries of tomorrow.
            </p>

            <div className="flex flex-wrap items-center gap-8">
               <MagneticButton>
                  <button className="btn-luxury px-10 py-5">
                    EXPLORE COLLECTION
                  </button>
               </MagneticButton>
               
               <button className="flex items-center space-x-4 group">
                  <div className="w-16 h-16 rounded-full glass border border-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-700">
                     <Play size={20} fill="currentColor" strokeWidth={0} />
                  </div>
                  <span className="font-tech text-[10px] tracking-widest text-black/60 group-hover:text-black transition-colors uppercase">WATCH_FILM</span>
               </button>
            </div>
          </div>
        </div>

        {/* Right: 3D Watch Model */}
        <div className="col-span-12 lg:col-span-6 flex items-center justify-center relative">
           <div className="absolute inset-0 bg-black/5 blur-[120px] rounded-full scale-150 animate-pulse" />
           <Watch3D />
           
           {/* Technical Specs Floating Markup */}
           <div className="absolute -right-10 top-1/4 hidden xl:block">
              <div className="glass p-6 rounded-3xl border-black/5 luxury-shadow space-y-4">
                 <div className="space-y-1">
                    <span className="block font-tech text-[8px] text-black/30 tracking-widest uppercase">MATERIAL</span>
                    <span className="block font-tech text-[10px] text-black font-black">PLATINUM_CORE</span>
                 </div>
                 <div className="w-full h-px bg-black/5" />
                 <div className="space-y-1">
                    <span className="block font-tech text-[8px] text-black/30 tracking-widest uppercase">RESERVE</span>
                    <span className="block font-tech text-[10px] text-black font-black">120_HOUR_CALIBER</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-4 opacity-20">
         <span className="font-tech text-[8px] tracking-[1em] uppercase ml-[1em] text-black">SCROLL</span>
         <div className="w-px h-12 bg-gradient-to-b from-black to-transparent" />
      </div>
    </div>
  );
}
