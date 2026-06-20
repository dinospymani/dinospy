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
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-12 gap-12 items-center">
          <div className="col-span-12 lg:col-span-7">
             <div className="flex items-center space-x-6 mb-12 opacity-40">
                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                <span className="font-mono text-xs tracking-widest uppercase text-black font-bold">THE_LEGACY // PHILOSOPHY</span>
             </div>
             
             <div className="flex flex-wrap gap-x-[0.3em] gap-y-0 text-5xl md:text-8xl font-display font-medium leading-[1.1] tracking-tightest text-black">
                {words.map((word, i) => {
                  const start = i / words.length;
                  const end = start + (1 / words.length);
                  return <Word key={i} range={[start, end]} progress={scrollYProgress}>{word}</Word>
                })}
             </div>
          </div>
          
          <div className="col-span-12 lg:col-span-5">
             <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden group border border-black/5">
                <motion.video 
                  autoPlay muted loop playsInline
                  style={{ scale: useTransform(scrollYProgress, [0, 1], [1.2, 1]) }}
                  className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[3s]"
                >
                  <source src="https://v.pexels.com/video-files/4441005/4441005-uhd_2160_3840_30fps.mp4" type="video/mp4" />
                </motion.video>
                <div className="absolute inset-24 border border-white/40 rounded-[2rem] group-hover:inset-12 transition-all duration-1000" />
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
    <span className="relative inline-block mr-[0.2em] mb-[0.2em]">
       <span className="absolute opacity-10">{children}</span>
       <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
};
