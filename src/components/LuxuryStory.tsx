import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export const LuxuryStory = () => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"]
  });

  const words = "Every DINOSPY timepiece is a manifestation of architectural sovereignty. We do not merely tell time; we encapsulate the very essence of mechanical evolution in every gear and spring.".split(" ");

  return (
    <section ref={container} className="py-40 bg-white overflow-hidden border-y border-black/5">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-12 gap-12 items-center">
          <div className="col-span-12 lg:col-span-7">
             <div className="flex items-center space-x-6 mb-12 opacity-40">
                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                <span className="font-mono text-xs tracking-widest uppercase text-black font-bold">THE_LEGACY // PHILOSOPHY</span>
             </div>
             
             <div className="flex flex-wrap text-[clamp(1.5rem,7vw,6.5rem)] font-display font-medium leading-[1.1] tracking-tightest text-black break-words max-w-full">
                {words.map((word, i) => {
                  const start = i / words.length;
                  const end = start + (1 / words.length);
                  return <Word key={i} range={[start, end]} progress={scrollYProgress}>{word}</Word>
                })}
             </div>
          </div>
          
          <div className="col-span-12 lg:col-span-5">
             <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden group border border-black/5 bg-neutral-50 flex items-center justify-center p-20">
                <div className="text-center space-y-8 relative z-10 transition-transform duration-1000 group-hover:scale-110">
                   <div className="w-24 h-[1px] bg-black/10 mx-auto" />
                   <div className="font-display text-4xl text-black/20 italic select-none">Vault Heritage.</div>
                   <div className="w-24 h-[1px] bg-black/10 mx-auto" />
                </div>
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="absolute inset-24 border border-black/10 rounded-[2rem] group-hover:inset-12 transition-all duration-1000" />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Word = ({ children, range, progress }) => {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className="relative inline-block mr-[0.3em] my-[0.1em]">
       <span className="absolute opacity-10">{children}</span>
       <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
};
