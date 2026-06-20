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
    <div ref={containerRef} className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-noir pt-24">
      
      {/* Background Video with Cinematic Blur */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="w-full h-full object-cover opacity-10 scale-110 blur-3xl lg:blur-[120px]"
        >
          <source src="https://v.pexels.com/video-files/4440938/4440938-uhd_2160_3840_30fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-noir via-transparent to-noir" />
      </div>

      <div className="container mx-auto px-6 md:px-12 grid grid-cols-12 items-center relative z-10">
        
        {/* Left: Text Content */}
        <div className="col-span-12 lg:col-span-6 flex flex-col items-start space-y-12 mb-20 lg:mb-0">
          <div ref={subtitleRef} className="flex items-center space-x-6 opacity-40">
             <div className="w-1.5 h-1.5 bg-gold rounded-full shadow-[0_0_10px_#c5a059]" />
             <span className="font-tech text-xs tracking-[0.6em] uppercase text-gold">COLLECTION_V.01 // NOIR_EDITION</span>
          </div>

          <h1 className="text-[12vw] lg:text-[10rem] font-display italic leading-[0.8] text-text tracking-tightest flex flex-col">
            <span ref={titleRef1} className="block">Engineered</span> 
            <span ref={titleRef2} className="opacity-20 block">Splendor.</span>
          </h1>

          <div className="max-w-xl space-y-12" ref={ctaRef}>
            <p className="text-text/40 text-xl md:text-2xl font-light leading-relaxed italic">
              A collision of carbon, titanium, and timelessness. Experience the radical evolution of luxury horology.
            </p>

            <div className="flex flex-wrap items-center gap-8">
               <MagneticButton>
                  <button className="btn-luxury px-10 py-5">
                    SHOP_COLLECTION
                  </button>
               </MagneticButton>
               
               <button className="flex items-center space-x-4 group">
                  <div className="w-16 h-16 rounded-full glass border border-white/5 flex items-center justify-center group-hover:bg-text group-hover:text-noir transition-all duration-700">
                     <Play size={20} fill="currentColor" strokeWidth={0} />
                  </div>
                  <span className="font-tech text-[10px] tracking-widest text-text/60 group-hover:text-gold transition-colors">WATCH_CINEMATIC</span>
               </button>
            </div>
          </div>
        </div>

        {/* Right: 3D Watch Model */}
        <div className="col-span-12 lg:col-span-6 flex items-center justify-center relative">
           <div className="absolute inset-0 bg-gold/5 blur-[120px] rounded-full scale-150 animate-pulse" />
           <Watch3D />
           
           {/* Technical Specs Floating Markup */}
           <div className="absolute -right-10 top-1/4 hidden xl:block">
              <div className="glass p-6 rounded-3xl border-white/40 space-y-4">
                 <div className="space-y-1">
                    <span className="block font-tech text-[8px] text-text/30 tracking-widest uppercase">MATERIAL</span>
                    <span className="block font-tech text-[10px] text-text font-black">GRADE_5_TITANIUM</span>
                 </div>
                 <div className="w-full h-px bg-black/5" />
                 <div className="space-y-1">
                    <span className="block font-tech text-[8px] text-text/30 tracking-widest uppercase">RESERVE</span>
                    <span className="block font-tech text-[10px] text-text font-black">72_HOUR_ENERGY</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Hero Bottom Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-4 opacity-20">
         <span className="font-tech text-[8px] tracking-[1em] uppercase ml-[1em]">SCROLL_DOWN</span>
         <div className="w-px h-12 bg-gradient-to-b from-text to-transparent" />
      </div>
    </div>
  );
}
