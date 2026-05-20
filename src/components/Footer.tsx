import React from 'react';
import { motion } from 'motion/react';
import { Mail, Facebook, Instagram, Twitter, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-luxury-gray pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-3xl font-display font-bold gold-text tracking-widest mb-6 block">
              DINOSPY
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              The world's premier destination for luxury timepieces. Combining centuries of tradition with modern innovation.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 glass rounded-full hover:text-gold transition-colors"><Instagram size={18} /></a>
              <a href="#" className="p-2 glass rounded-full hover:text-gold transition-colors"><Twitter size={18} /></a>
              <a href="#" className="p-2 glass rounded-full hover:text-gold transition-colors"><Facebook size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Explore</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link to="/#luxury" className="hover:text-gold transition-colors">Luxury Edition</Link></li>
              <li><Link to="/#sport" className="hover:text-gold transition-colors">Sport Performance</Link></li>
              <li><Link to="/#smart" className="hover:text-gold transition-colors">Smart Collection</Link></li>
              <li><Link to="/#classic" className="hover:text-gold transition-colors">Heritage Classic</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Information</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><a href="#" className="hover:text-gold transition-colors">Our Story</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Warranty & Returns</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Keep in Touch</h4>
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3 text-sm text-white/50">
                <MapPin size={16} className="text-gold" />
                <span>Rue de l'Horloge, Geneva, Switzerland</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-white/50">
                <Phone size={16} className="text-gold" />
                <span>+41 22 555 0123</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-white/50">
                <Mail size={16} className="text-gold" />
                <span>concierge@dinospy.com</span>
              </div>
            </div>
            <div className="relative">
              <input 
                type="email" 
                placeholder="Newsletter" 
                className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-3 text-sm focus:outline-none focus:border-gold transition-colors"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-gold text-luxury-black p-2 rounded-full hover:scale-110 transition-transform">
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-white/30">
          <p>© 2026 DINOSPY LUXURY WATCHES. ALL RIGHTS RESERVED.</p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <span>Designed in Geneva</span>
            <span>Handmade Excellence</span>
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
