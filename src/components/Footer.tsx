import React from 'react';
import { motion } from 'motion/react';
import { Instagram, Twitter, Facebook, Youtube, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MagneticButton } from './MagneticButton';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ivory pt-32 pb-12 border-t border-charcoal/5 selection:bg-luxury-gold selection:text-charcoal font-sans">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-12 gap-12 md:gap-24 mb-32">
          
          {/* Brand & Newsletter */}
          <div className="col-span-12 lg:col-span-5 space-y-12">
             <Link to="/" className="flex flex-col items-start group">
                <span className="font-display text-4xl tracking-[0.5em] text-charcoal font-bold uppercase transition-all duration-1000 group-hover:tracking-[0.7em]">DINOSPY</span>
                <span className="font-mono text-[9px] tracking-[0.4em] text-charcoal/40 uppercase mt-4 font-black">HOROLOGICAL_VAULT // EST_2024</span>
             </Link>

             <div className="space-y-8 max-w-sm">
                <p className="text-charcoal/60 text-lg font-light leading-relaxed">Join the inner circle of horological excellence. Be the first to witness our limited edition releases.</p>
                <div className="relative group">
                   <input 
                     type="email" 
                     placeholder="VAULT_CREDENTIALS@EMAIL"
                     className="w-full bg-transparent border-b border-charcoal/10 py-6 px-4 font-mono text-[10px] tracking-[0.5em] outline-none focus:border-luxury-gold transition-colors text-charcoal uppercase font-bold"
                   />
                   <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-charcoal/20 group-hover:text-luxury-gold transition-colors">
                      <Mail size={18} strokeWidth={1.5} />
                   </button>
                </div>
             </div>
          </div>

          {/* Navigation Links */}
          <div className="col-span-6 lg:col-span-2 space-y-10">
             <span className="block font-mono text-[10px] tracking-[0.5em] text-charcoal font-black uppercase">CURATIONS</span>
             <ul className="space-y-5">
                {['DIVER', 'CLASSIC', 'VANGUARD', 'GRAND_COMPLICATIONS'].map(item => (
                  <li key={item}>
                    <Link to="/explore" className="text-charcoal/40 hover:text-luxury-gold transition-colors font-mono text-[9px] tracking-[0.4em] uppercase font-bold">{item}</Link>
                  </li>
                ))}
             </ul>
          </div>

          <div className="col-span-6 lg:col-span-2 space-y-10">
             <span className="block font-mono text-[10px] tracking-[0.5em] text-charcoal font-black uppercase">PROTOCOLS</span>
             <ul className="space-y-5">
                {['SHIPPING', 'WARRANTY', 'TRACK_ACQUISITION', 'AUTHENTICITY'].map(item => (
                  <li key={item}>
                    <Link to={item === 'TRACK_ACQUISITION' ? '/track' : '/faq'} className="text-charcoal/40 hover:text-luxury-gold transition-colors font-mono text-[9px] tracking-[0.4em] uppercase font-bold">{item}</Link>
                  </li>
                ))}
             </ul>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-10 text-left md:text-right flex flex-col md:items-end">
             <span className="block font-mono text-[10px] tracking-[0.5em] text-charcoal font-black uppercase">CHANNELS</span>
             <div className="flex space-x-6">
                {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                  <MagneticButton key={i}>
                    <a href="#" className="w-14 h-14 rounded-full border border-charcoal/5 flex items-center justify-center hover:bg-charcoal hover:text-ivory transition-all duration-700">
                       <Icon size={18} strokeWidth={1} />
                    </a>
                  </MagneticButton>
                ))}
             </div>
             <div className="pt-12 block">
                <span className="font-mono text-[8px] text-charcoal/20 tracking-[0.6em] uppercase block mb-4 font-black">LOGISTICS_NODES</span>
                <span className="font-mono text-[10px] text-charcoal uppercase font-bold tracking-widest leading-loose">GENEVA // ZURICH // MUMBAI</span>
             </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-16 border-t border-charcoal/5 gap-12">
           <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16">
              <span className="font-mono text-[9px] text-charcoal/40 tracking-[0.4em] font-black italic uppercase">© {currentYear} DINOSPY_SYSTEMS</span>
              <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold opacity-30 hidden md:block" />
              <span className="font-mono text-[9px] text-charcoal/40 tracking-[0.4em] uppercase font-black">CRAFTED_IN_INDIA</span>
           </div>
           
           <div className="flex space-x-12">
              <Link to="/privacy" className="font-mono text-[9px] text-charcoal/40 tracking-[0.4em] hover:text-charcoal transition-colors uppercase font-black">PRIVACY</Link>
              <Link to="/faq" className="font-mono text-[9px] text-charcoal/40 tracking-[0.4em] hover:text-charcoal transition-colors uppercase font-black">TERMS</Link>
           </div>
        </div>
      </div>
    </footer>
  );
}
