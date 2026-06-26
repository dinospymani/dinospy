import React from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContactUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-50 pt-32 pb-20 px-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-4 mb-16 text-black/40 hover:text-black transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" />
          <span className="font-tech text-[10px] tracking-widest uppercase font-black">Return to Terminal</span>
        </button>

        <header className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-6 py-2 rounded-full border border-black/5 bg-white text-[8px] font-tech font-black tracking-[0.4em] uppercase mb-8"
          >
            Communication Uplink
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-display italic tracking-tighter"
          >
            Contact Us
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-neutral-400 max-w-xl text-lg font-light leading-relaxed"
          >
            Our master horologists and support specialists are standing by to assist with your archival inquiries.
          </motion.p>
        </header>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div className="p-12 bg-white rounded-[3rem] border border-black/5">
              <h3 className="text-2xl font-display italic mb-12">Vault Support Channels</h3>
              
              <div className="space-y-12">
                <div className="flex items-start space-x-8">
                  <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center text-black/20">
                    <Mail size={24} strokeWidth={1} />
                  </div>
                  <div>
                    <p className="font-tech text-[8px] tracking-[0.3em] uppercase text-black/40 mb-2">Electronic Mail</p>
                    <p className="text-xl font-display italic">archivist@dinospy.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-8">
                  <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center text-black/20">
                    <Phone size={24} strokeWidth={1} />
                  </div>
                  <div>
                    <p className="font-tech text-[8px] tracking-[0.3em] uppercase text-black/40 mb-2">Voice Protocol</p>
                    <p className="text-xl font-display italic">+91 (800) ARCHIVE</p>
                  </div>
                </div>

                <div className="flex items-start space-x-8">
                  <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center text-black/20">
                    <MapPin size={24} strokeWidth={1} />
                  </div>
                  <div>
                    <p className="font-tech text-[8px] tracking-[0.3em] uppercase text-black/40 mb-2">Physical Location</p>
                    <p className="text-xl font-display italic">The Grand Vault, Financial District<br />Mumbai, MH 400001, India</p>
                  </div>
                </div>

                <div className="flex items-start space-x-8">
                  <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center text-black/20">
                    <Clock size={24} strokeWidth={1} />
                  </div>
                  <div>
                    <p className="font-tech text-[8px] tracking-[0.3em] uppercase text-black/40 mb-2">Operational Cycle</p>
                    <p className="text-xl font-display italic">Mon - Sat: 10:00 - 19:00 IST</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <form className="p-12 bg-white rounded-[3rem] border border-black/5 space-y-8" onSubmit={(e) => e.preventDefault()}>
              <h3 className="text-2xl font-display italic mb-4">Inquiry Manifest</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="font-tech text-[8px] tracking-[0.3em] uppercase text-black/40 mb-4 block">Identity</label>
                  <input 
                    type="text" 
                    className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-display italic focus:ring-1 focus:ring-black/10 transition-all outline-none"
                    placeholder="Full Name"
                  />
                </div>

                <div>
                  <label className="font-tech text-[8px] tracking-[0.3em] uppercase text-black/40 mb-4 block">Communication Route</label>
                  <input 
                    type="email" 
                    className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-display italic focus:ring-1 focus:ring-black/10 transition-all outline-none"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="font-tech text-[8px] tracking-[0.3em] uppercase text-black/40 mb-4 block">Inquiry Metadata</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-display italic focus:ring-1 focus:ring-black/10 transition-all outline-none resize-none"
                    placeholder="Message"
                  />
                </div>
              </div>

              <button className="w-full bg-black text-white py-6 rounded-2xl font-tech text-[10px] tracking-[0.4em] uppercase font-black hover:bg-neutral-800 transition-all flex items-center justify-center space-x-4">
                <span>Transmit Inquiry</span>
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
