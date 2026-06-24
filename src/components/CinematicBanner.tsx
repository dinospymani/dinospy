import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CinematicBannerProps {
  videoUrl: string;
  title: string;
  subtitle: string;
  description: string;
  align?: 'left' | 'right';
  ctaText?: string;
  link?: string;
}

export default function CinematicBanner({
  videoUrl,
  title,
  subtitle,
  description,
  align = 'left',
  ctaText = "Explore Collection",
  link = "/explore"
}: CinematicBannerProps) {
  return (
    <section className="relative min-h-[110vh] md:min-h-screen w-full flex items-center overflow-hidden bg-white">
      {/* Background Content */}
      <div className="absolute inset-0 z-0 px-4 md:px-24 py-12 md:py-48">
        <div className="relative w-full h-full overflow-hidden bg-neutral-50 flex items-center justify-center border border-black/5">
          <div className="font-display text-[25vw] opacity-[0.01] select-none pointer-events-none italic font-bold">
            {title.slice(0, 3).toUpperCase()}
          </div>
          <div className="absolute inset-0 bg-white/10 z-10" />
          
          {/* Internal Grid */}
          <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.03]">
             <div className="w-full h-full grid grid-cols-12 grid-rows-12">
                {Array.from({ length: 144 }).map((_, i) => (
                   <div key={i} className="border-[0.5px] border-black" />
                ))}
             </div>
          </div>
          <div className="absolute inset-0 opacity-[0.02]" 
               style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-30">
        <div className={`flex flex-col ${align === 'right' ? 'items-start md:items-end md:text-right' : 'items-start'}`}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl"
          >
            <div className={`flex items-center space-x-6 md:space-x-10 mb-8 md:mb-16 ${align === 'right' ? 'md:justify-end md:flex-row-reverse md:space-x-reverse' : ''}`}>
               <div className="w-2 md:w-3 h-2 md:h-3 bg-black rounded-full animate-pulse shadow-[0_0_15px_rgba(0,0,0,0.1)]" />
               <span className="font-tech text-black text-[10px] md:text-[12px] uppercase tracking-[0.5em] md:tracking-[1em] font-bold">
                 {subtitle}
               </span>
               <div className="w-12 md:w-24 h-[1px] bg-black/10" />
            </div>

            <h2 className="text-[12vw] md:text-[16rem] font-display font-light leading-[0.8] md:leading-[0.7] italic mb-8 md:mb-20 text-black tracking-tightest">
              {title}
            </h2>
            <p className="text-black/30 text-xl md:text-3xl font-light italic leading-tight mb-12 md:mb-24 max-w-2xl">
              {description}
            </p>
            
            <Link 
              to={link}
              className={`inline-flex items-center group transition-all duration-1000 ${align === 'right' ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-28 h-28 rounded-full border border-black/10 flex items-center justify-center group-hover:border-black group-hover:bg-black group-hover:text-white transition-all duration-1000 group-hover:scale-110">
                <ArrowRight className="transition-transform duration-1000 group-hover:rotate-[-45deg]" size={36} />
              </div>
              <div className={`flex flex-col mx-12 ${align === 'right' ? 'items-end' : 'items-start'}`}>
                 <span className="font-tech text-[9px] text-black/20 mb-3 font-bold uppercase tracking-[1.5em]">REFERENCE_PROTOCOL</span>
                 <span className="font-tech text-[14px] font-bold uppercase tracking-[0.6em] text-black group-hover:tracking-[1em] transition-all duration-1000">
                   {ctaText}
                 </span>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none grid grid-cols-24 px-20 opacity-5">
         <div className="col-span-1 h-full border-x border-black" />
         <div className="col-span-1 h-full border-r border-black col-start-24" />
      </div>

      {/* Scanning Indicator */}
      <div className="absolute bottom-20 right-20 z-30 hidden md:block">
         <div className="flex flex-col items-end">
            <span className="font-tech text-[7px] text-black/20 mb-1">CHAPTER_SEQUENCE</span>
            <span className="font-tech text-[10px] text-black tracking-widest italic">{align === 'left' ? '01_CORE' : '02_MATERIA'}</span>
         </div>
      </div>
    </section>
  );
}
