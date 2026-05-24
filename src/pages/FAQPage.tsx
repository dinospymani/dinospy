import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FAQ } from '../components/FAQ';
import { motion } from 'motion/react';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-luxury-black text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative h-60 rounded-[3rem] overflow-hidden mb-20 border border-white/10">
            <img 
              src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80" 
              className="w-full h-full object-cover opacity-40"
              alt="Luxury watches background"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-luxury-black/90" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <h1 className="text-6xl font-display gold-text mb-4">Archives</h1>
              <p className="text-white/40 text-xs uppercase tracking-[0.5em] font-black italic">Curated Knowledge & Support</p>
            </div>
          </div>

          <FAQ />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
