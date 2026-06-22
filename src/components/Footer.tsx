import React from 'react';
import { motion } from 'motion/react';
import { Instagram, Twitter, Facebook, Youtube, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MagneticButton } from './MagneticButton';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white pt-32 pb-12 border-t border-black/5 selection:bg-black selection:text-white">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-12 gap-12 md:gap-24 mb-32">
          
          {/* Brand & Newsletter */}
          <div className="col-span-12 lg:col-span-5 space-y-12">
             <Link to="/" className="flex flex-col items-start group">
                <span className="font-display text-4xl tracking-[0.4em] text-black font-bold uppercase transition-all duration-700 group-hover:tracking-[0.6em]">DINOSPY</span>
                <span className="font-mono text-[10px] tracking-widest text-black/40 uppercase mt-2">SWISS HOROLOGY // MASTERPIECE VAULT</span>
             </Link>

             <div className="space-y-6 max-w-sm">
                <p className="text-black/60 text-lg font-light leading-relaxed">Join the inner circle of horological excellence. Be the first to witness our limited edition releases.</p>
                <div className="relative group">
                   <input 
                     type="email" 
                     placeholder="EMAIL ADDRESS"
                     className="w-full bg-transparent border-b border-black/10 py-6 px-4 font-mono text-[10px] tracking-[0.4em] outline-none focus:border-black transition-colors text-black uppercase"
                   />
                   <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-black/20 group-hover:text-black transition-colors">
                      <Mail size={18} strokeWidth={1} />
                   </button>
                </div>
             </div>
          </div>

          {/* Navigation Links */}
          <div className="col-span-6 lg:col-span-2 space-y-8">
             <span className="block font-mono text-[10px] tracking-widest text-black font-bold uppercase">COLLECTIONS</span>
             <ul className="space-y-4">
                {['DIVER', 'CLASSIC', 'VANGUARD', 'CHRONOGRAPH'].map(item => (
                  <li key={item}>
                    <Link to="/explore" className="text-black/40 hover:text-black transition-colors font-mono text-[9px] tracking-[0.4em] uppercase">{item}</Link>
                  </li>
                ))}
             </ul>
          </div>

          <div className="col-span-6 lg:col-span-2 space-y-8">
             <span className="block font-mono text-[10px] tracking-widest text-black font-bold uppercase">SERVICE</span>
             <ul className="space-y-4">
                {['SHIPPING', 'WARRANTY', 'SERVICING', 'AUTHENTICITY'].map(item => (
                  <li key={item}>
                    <Link to="/faq" className="text-black/40 hover:text-black transition-colors font-mono text-[9px] tracking-[0.4em] uppercase">{item}</Link>
                  </li>
                ))}
             </ul>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-8 text-left md:text-right flex flex-col md:items-end">
             <span className="block font-mono text-[10px] tracking-widest text-black font-bold uppercase">CONNECT</span>
             <div className="flex space-x-6">
                {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                  <MagneticButton key={i}>
                    <a href="#" className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                       <Icon size={18} strokeWidth={1} />
                    </a>
                  </MagneticButton>
                ))}
             </div>
             <div className="pt-8 block">
                <span className="font-mono text-[8px] text-black/20 tracking-widest uppercase block mb-2">HEADQUARTERS</span>
                <span className="font-mono text-[10px] text-black uppercase">GENEVA // ZURICH</span>
             </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-black/5 gap-8">
           <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12">
              <span className="font-mono text-[8px] text-black/40 tracking-widest">© {currentYear} DINOSPY HANDCRAFTED</span>
              <span className="font-mono text-[8px] text-black/40 tracking-widest hidden md:block uppercase leading-none">All Rights Reserved</span>
              <span className="font-mono text-[8px] text-black/40 tracking-widest uppercase">Proudly made with ❤️ in India</span>
           </div>
           
           <div className="flex space-x-12">
              <Link to="/privacy" className="font-mono text-[8px] text-black/40 tracking-widest hover:text-black transition-colors uppercase">PRIVACY POLICY</Link>
              <Link to="/faq" className="font-mono text-[8px] text-black/40 tracking-widest hover:text-black transition-colors uppercase">TERMS OF SERVICE</Link>
           </div>
        </div>
      </div>
    </footer>
  );
}
