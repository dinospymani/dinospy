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
    <section className="relative min-h-[90vh] md:min-h-screen w-full flex items-center overflow-hidden bg-bg">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 px-4 md:px-20 py-12 md:py-32">
        <div className="relative w-full h-full overflow-hidden hairline">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover grayscale brightness-[0.2]"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-bg/20 z-10" />
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-20">
        <div className={`max-w-4xl ${align === 'right' ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={`flex items-center space-x-6 mb-8 ${align === 'right' ? 'justify-end md:flex-row-reverse md:space-x-reverse' : ''}`}>
               <span className="font-tech text-gold text-[10px] uppercase tracking-[0.5em] font-bold">
                 {subtitle}
               </span>
               <div className="w-12 h-[1px] bg-gold/30" />
            </div>

            <h2 className="text-6xl md:text-[10rem] font-display font-light leading-none italic mb-12 text-white">
              {title}
            </h2>
            <p className="text-text/30 text-xl font-light italic leading-relaxed mb-16 max-w-xl">
              {description}
            </p>
            
            <Link 
              to={link}
              className={`inline-flex items-center group ${align === 'right' ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-20 h-20 rounded-full border border-text/10 flex items-center justify-center group-hover:border-gold group-hover:rotate-45 transition-all duration-700">
                <ArrowRight className="text-gold" size={24} />
              </div>
              <div className={`flex flex-col mx-8 ${align === 'right' ? 'items-end' : 'items-start'}`}>
                 <span className="font-tech text-[8px] text-text/20 mb-2 font-bold uppercase tracking-widest">Initialization</span>
                 <span className="font-tech text-[10px] font-bold uppercase tracking-[0.4em] text-white group-hover:text-gold transition-colors">
                   {ctaText}
                 </span>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none grid grid-cols-24 px-20 opacity-5">
         <div className="col-span-1 h-full border-x border-text" />
         <div className="col-span-1 h-full border-r border-text col-start-24" />
      </div>

      {/* Scanning Indicator */}
      <div className="absolute bottom-20 right-20 z-30 hidden md:block">
         <div className="flex flex-col items-end">
            <span className="font-tech text-[7px] text-text/20 mb-1">CHAPTER_SEQUENCE</span>
            <span className="font-tech text-[10px] text-gold tracking-widest italic">{align === 'left' ? '01_CORE' : '02_MATERIA'}</span>
         </div>
      </div>
    </section>
  );
}
