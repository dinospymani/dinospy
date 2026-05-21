import React from 'react';
import { motion } from 'motion/react';
import { Mail, Facebook, Instagram, Twitter, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-luxury-black pt-40 pb-20 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-24 md:gap-12 mb-32">
          <div className="col-span-1 md:col-span-1 space-y-10">
            <Link to="/" className="text-3xl font-display font-medium text-white tracking-[0.3em] block">
              DINOSPY
            </Link>
            <p className="text-white/30 text-sm leading-relaxed font-light italic max-w-xs">
              "Witness the peak of horological engineering. Heritage forged for the modern elite."
            </p>
            <div className="flex space-x-8">
              <a href="#" className="text-white/30 hover:text-gold transition-colors duration-500"><Instagram size={18} strokeWidth={1} /></a>
              <a href="#" className="text-white/30 hover:text-gold transition-colors duration-500"><Twitter size={18} strokeWidth={1} /></a>
              <a href="#" className="text-white/30 hover:text-gold transition-colors duration-500"><Facebook size={18} strokeWidth={1} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white/80 font-bold uppercase tracking-[0.4em] text-[10px] mb-10">Curations</h4>
            <ul className="space-y-6 text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
              <li><Link to="/explore" className="hover:text-gold transition-all duration-500">Genesis Collection</Link></li>
              <li><Link to="/explore" className="hover:text-gold transition-all duration-500">Archive Items</Link></li>
              <li><Link to="/explore" className="hover:text-gold transition-all duration-500">Limited Editions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white/80 font-bold uppercase tracking-[0.4em] text-[10px] mb-10">Intelligence</h4>
            <ul className="space-y-6 text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
              <li><Link to="/#philosophy" className="hover:text-gold transition-all duration-500">Our Narrative</Link></li>
              <li><Link to="/#philosophy" className="hover:text-gold transition-all duration-500">Heritage</Link></li>
              <li><Link to="/explore" className="hover:text-gold transition-all duration-500">Logistics</Link></li>
            </ul>
          </div>

          <div className="space-y-10">
            <h4 className="text-white/80 font-bold uppercase tracking-[0.4em] text-[10px] mb-10">Concierge</h4>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] leading-relaxed">Exclusive updates for our elite clientele.</p>
            <div className="relative border-b border-white/10 pb-2">
              <input 
                type="email" 
                placeholder="REGISTRATION" 
                className="w-full bg-transparent text-[10px] uppercase tracking-[0.4em] text-white focus:outline-none placeholder:text-white/10"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-gold hover:text-white transition-colors">
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[9px] uppercase tracking-[0.5em] text-white/20 font-bold">
          <p>© 2026 DINOSPY . EXCLUSIVE HERITAGE .</p>
          <div className="flex space-x-12 mt-8 md:mt-0 italic font-light lowercase tracking-widest">
            <span>artisanal precision</span>
            <span>global logistics</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ArrowRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
