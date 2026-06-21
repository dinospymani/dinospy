import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FAQ } from '../components/FAQ';
import { motion } from 'motion/react';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative h-60 rounded-[3rem] overflow-hidden mb-20 border border-black/5 bg-neutral-50 scale-[0.98] group flex items-center justify-center">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="absolute inset-0 bg-white/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <h1 className="text-6xl font-display font-medium text-black mb-4 uppercase tracking-tightest">Support</h1>
              <p className="text-black/40 text-[9px] uppercase tracking-[0.5em] font-bold">Curated Knowledge & Assistance</p>
            </div>
          </div>

          <FAQ />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
