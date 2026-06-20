import React from 'react';
import { motion } from 'motion/react';
import { Instagram, Twitter, Facebook, Youtube, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MagneticButton } from './MagneticButton';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-noir pt-32 pb-12 border-t border-white/5 selection:bg-gold selection:text-noir">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-12 gap-12 md:gap-24 mb-32">
          
          {/* Brand & Newsletter */}
          <div className="col-span-12 lg:col-span-5 space-y-12">
             <Link to="/" className="flex flex-col items-start group">
                <span className="font-display text-4xl tracking-[0.6em] text-text font-black uppercase transition-all duration-700 group-hover:tracking-[0.8em]">DINOSPY</span>
                <span className="font-tech text-[10px] tracking-widest text-gold opacity-40 uppercase mt-2">HOROLOGICAL_MASTERY // NOIR_VAULT</span>
             </Link>

             <div className="space-y-6 max-w-sm">
                <p className="text-text/40 text-lg font-light italic leading-relaxed">Join the inner circle of mechanical excellence. Intelligence on new calibers delivered to your vault.</p>
                <div className="relative group">
                   <input 
                     type="email" 
                     placeholder="VAULT_IDENTITY@EMAIL.COM"
                     className="w-full bg-graphite border-b border-white/10 py-6 px-4 font-tech text-xs tracking-widest outline-none focus:border-gold transition-colors text-text"
                   />
                   <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-text/20 group-hover:text-gold transition-colors">
                      <Mail size={18} strokeWidth={1.5} />
                   </button>
                </div>
             </div>
          </div>

          {/* Navigation Links */}
          <div className="col-span-6 lg:col-span-2 space-y-8">
             <span className="block font-tech text-[10px] tracking-widest text-text font-black uppercase">COLLECTIONS</span>
             <ul className="space-y-4">
                {['ARCHETYPE', 'MONOLITH', 'VANGUARD', 'CHRONOS'].map(item => (
                  <li key={item}>
                    <Link to="/explore" className="text-text/40 hover:text-gold transition-colors font-tech text-[10px] tracking-widest uppercase">{item}</Link>
                  </li>
                ))}
             </ul>
          </div>

          <div className="col-span-6 lg:col-span-2 space-y-8">
             <span className="block font-tech text-[10px] tracking-widest text-text font-black uppercase">PROTOCOL</span>
             <ul className="space-y-4">
                {['SHIPPING', 'WARRANTY', 'SERVICING', 'AUTHENTICITY'].map(item => (
                  <li key={item}>
                    <Link to="/faq" className="text-text/40 hover:text-gold transition-colors font-tech text-[10px] tracking-widest uppercase">{item}</Link>
                  </li>
                ))}
             </ul>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-8 text-left md:text-right flex flex-col md:items-end">
             <span className="block font-tech text-[10px] tracking-widest text-text font-black uppercase">CONNECT</span>
             <div className="flex space-x-6">
                {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                  <MagneticButton key={i}>
                    <a href="#" className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                       <Icon size={18} strokeWidth={1.5} />
                    </a>
                  </MagneticButton>
                ))}
             </div>
             <div className="pt-8 block">
                <span className="font-tech text-[8px] text-text/20 tracking-widest uppercase block mb-2">HEADQUARTERS</span>
                <span className="font-tech text-xs text-text uppercase">BUREAU_ZURICH // GENEVA</span>
             </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-black/5 gap-8">
           <div className="flex items-center space-x-12">
              <span className="font-tech text-[8px] text-text/20 tracking-widest">© {currentYear} DINOSPY_SYSTEMS</span>
              <span className="font-tech text-[8px] text-text/20 tracking-widest hidden md:block">ALL_RIGHTS_RESERVED</span>
           </div>
           
           <div className="flex space-x-12">
              <Link to="/faq" className="font-tech text-[8px] text-text/20 tracking-widest hover:text-gold transition-colors uppercase">PRIVACY_PROTOCOL</Link>
              <Link to="/faq" className="font-tech text-[8px] text-text/20 tracking-widest hover:text-gold transition-colors uppercase">TERMS_OF_SERVICE</Link>
           </div>
        </div>
      </div>
    </footer>
  );
}
