import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Hero() {
  const [activeFrame, setActiveFrame] = useState(0);
  const frames = [
    {
      title: "Archetype.",
      id: "REF-001",
      data: "42mm Titanium / Caliber 9S",
      image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=2000"
    },
    {
      title: "Monolith.",
      id: "REF-072",
      data: "Surgical Steel / Obsidian Dial",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2000"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % frames.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [frames.length]);

  return (
    <section className="relative h-screen w-full bg-bg overflow-hidden flex items-center pt-20">
      {/* Background Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFrame}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={frames[activeFrame].image} 
            className="w-full h-full object-cover grayscale brightness-[0.4]" 
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />
        </motion.div>
      </AnimatePresence>

      {/* Decorative Lines */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-20">
        <div className="absolute top-0 left-[10%] w-[1px] h-full bg-text/30" />
        <div className="absolute top-0 right-[10%] w-[1px] h-full bg-text/30" />
        <div className="absolute top-[20%] left-0 w-full h-[1px] bg-text/30" />
        <div className="absolute bottom-[20%] left-0 w-full h-[1px] bg-text/30" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 relative z-20">
        <div className="grid-brutalist items-center">
          <div className="col-span-24 lg:col-span-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFrame}
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
              >
                <div className="flex items-center space-x-6 mb-8">
                  <span className="font-tech text-gold">ACTIVE_SESSION</span>
                  <div className="w-12 h-[1px] bg-gold" />
                  <span className="font-tech text-text/40 tracking-[0.5em]">0{activeFrame + 1} / 0{frames.length}</span>
                </div>

                <h1 className="text-[12vw] md:text-[12rem] leading-[0.8] mb-12 text-white font-display italic">
                  {frames[activeFrame].title}
                </h1>

                <div className="flex flex-col md:flex-row md:items-center space-y-8 md:space-y-0 md:space-x-20">
                   <Link to="/explore" className="group">
                      <div className="inline-flex items-center space-x-6 transition-all duration-700">
                        <span className="font-tech text-sm group-hover:text-gold">INITIALIZE_EXPLORATION</span>
                        <div className="w-16 h-16 rounded-full border border-text/10 flex items-center justify-center group-hover:border-gold group-hover:rotate-45 transition-all duration-700">
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gold">
                              <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                           </svg>
                        </div>
                      </div>
                   </Link>

                   <div className="flex flex-col">
                      <span className="font-tech text-[10px] text-text/30 mb-2 font-bold uppercase">Specifications</span>
                      <span className="font-tech text-xs text-text/80">{frames[activeFrame].data}</span>
                   </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Technical Sidebar Indicator */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 z-30 hidden xl:flex flex-col items-end space-y-12">
        <div className="rotate-90 flex items-center space-x-6 origin-right">
          <span className="font-tech text-[10px] text-text/20 font-bold whitespace-nowrap">EXTENDED_ARCHIVE_ACCESS</span>
          <div className="w-24 h-[1px] bg-text/10" />
        </div>
        <div className="flex flex-col space-y-4">
          {frames.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveFrame(i)}
              className={`w-1 h-8 transition-all duration-700 ${activeFrame === i ? 'bg-gold' : 'bg-text/10'}`}
            />
          ))}
        </div>
      </div>

      {/* Floating Precision Labels */}
      <div className="absolute bottom-12 left-12 z-30 flex flex-col font-tech text-[8px] text-text/20 font-bold">
        <span>LAT: 35.6895 N</span>
        <span>LNG: 139.6917 E</span>
        <span className="mt-2 text-gold/40">SYSTEM: ONLINE</span>
      </div>
    </section>
  );
}

