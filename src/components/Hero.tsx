import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Hero() {
  const [activeFrame, setActiveFrame] = useState(0);
  const frames = [
    {
      title: "Heritage.",
      id: "REF-001",
      data: "42mm Titanium / Caliber 9S / Chronos Core",
      video: "https://v.pexels.com/video-files/4441005/4441005-uhd_2160_3840_30fps.mp4",
      image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=2000",
      description: "A clinical study in structural integrity and mechanical silence."
    },
    {
      title: "Vanguard.",
      id: "REF-072",
      data: "Surgical Steel / Obsidian Dial / Multi-Axial",
      video: "https://v.pexels.com/video-files/4440941/4440941-uhd_2160_3840_30fps.mp4",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2000",
      description: "Absorbing light, projecting authority. The obsidian standard."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % frames.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [frames.length]);

  return (
    <section className="relative h-screen w-full bg-white overflow-hidden flex flex-col justify-end">
      {/* Background Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFrame}
          initial={{ opacity: 0, scale: 1.2, filter: 'brightness(1.5)' }}
          animate={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
          exit={{ opacity: 0, scale: 0.9, filter: 'brightness(1.5)' }}
          transition={{ duration: 2.5, ease: [0.19, 1, 0.22, 1] }}
          className="absolute inset-0 z-0"
        >
          {frames[activeFrame].video ? (
            <video
              key={frames[activeFrame].video}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover grayscale opacity-20 contrast-[1.2]"
            >
              <source src={frames[activeFrame].video} type="video/mp4" />
            </video>
          ) : (
            <img 
              src={frames[activeFrame].image} 
              className="w-full h-full object-cover grayscale opacity-20 contrast-[1.2]" 
              alt="Hero"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white opacity-40" />
        </motion.div>
      </AnimatePresence>

      {/* Modern Brutalist Grid */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.05]">
        <div className="w-full h-full grid grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-black h-full last:border-r-0" />
          ))}
        </div>
      </div>

      {/* Content Architecture */}
      <div className="container mx-auto px-6 relative z-30 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFrame}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            <div className="grid grid-cols-12 gap-12 items-end">
              <div className="col-span-12 lg:col-span-10">
                <motion.div
                  variants={{
                    initial: { opacity: 0, x: -30 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: 20 }
                  }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="flex items-center space-x-10 mb-12"
                >
                  <div className="w-24 h-[1px] bg-black/10" />
                  <span className="font-tech text-black/40">ARCHIVE_REF // 0{activeFrame + 1}</span>
                  <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
                </motion.div>

                <motion.h1
                  variants={{
                    initial: { opacity: 0, x: -100 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: 100 }
                  }}
                  transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[16vw] sm:text-[14vw] lg:text-[20rem] xl:text-[24rem] leading-[0.65] font-display italic tracking-tightest text-black"
                >
                  {frames[activeFrame].title}
                </motion.h1>
              </div>

              <div className="hidden lg:col-span-2 lg:flex flex-col items-end">
                <motion.div
                  variants={{
                    initial: { opacity: 0, scale: 0.8 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 1.2 }
                  }}
                  transition={{ duration: 1.5 }}
                >
                  <Link to="/explore" className="group relative w-32 h-32 rounded-full border border-black/10 flex items-center justify-center bg-black/5 backdrop-blur-xl hover:bg-black hover:text-white transition-all duration-1000">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="transition-transform duration-1000 group-hover:rotate-45">
                      <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="0.5" />
                    </svg>
                    <div className="absolute -inset-4 border border-black/5 rounded-full group-hover:inset-0 transition-all duration-1000" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* System Status Readout */}
      <div className="w-full bg-white/40 backdrop-blur-3xl border-t border-black/5 py-8 md:py-12 relative z-50 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-4 md:gap-8 text-black/20 font-tech items-center">
            <div className="col-span-1 md:col-span-4 flex items-center space-x-3 md:space-x-6">
              <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-black rounded-full" />
              <span className="tracking-[0.5em] md:tracking-[1em] text-[8px] md:text-sm truncate">DINOSPY_PROTOCOL</span>
            </div>
            <div className="hidden md:flex col-span-4 justify-center items-center space-x-12">
              <span className="opacity-40">EST_00:00:UTC</span>
              <div className="w-[1px] h-4 bg-black/10" />
              <span className="text-black/60">CORE_TEMP: 32C</span>
            </div>
            <div className="col-span-1 md:col-span-4 flex justify-end items-center space-x-4 md:space-x-8">
              <span className="tracking-widest text-[8px] md:text-xs">RSA_4096</span>
              <div className="w-1.5 md:w-2 h-1.5 md:h-2 border border-black/20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Frame Navigation */}
      <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 z-40 flex flex-col space-y-8 md:space-y-12">
        {frames.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveFrame(i)}
            className={`group relative flex flex-col items-center ${i === 1 ? 'hidden sm:flex' : 'flex'}`}
          >
            <span className={`font-tech text-black transition-all duration-1000 mb-2 md:mb-4 text-[10px] md:text-sm ${activeFrame === i ? 'opacity-100' : 'opacity-0 scale-50'}`}>0{i+1}</span>
            <div className={`w-[1px] transition-all duration-1000 ${activeFrame === i ? 'h-16 md:h-24 bg-black shadow-[0_0_20px_black]' : 'h-4 md:h-6 bg-black/10 group-hover:h-12'}`} />
          </button>
        ))}
      </div>
    </section>
  );
}

