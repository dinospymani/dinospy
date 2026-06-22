import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Shield,
      title: "Data Stewardship",
      content: "At DINOSPY, we treat your personal data with the same reverence as a rare historical timekeeper. We do not sell, rent, or trade your acquisition history or personal identifies with third-party data brokers. Your presence in our vault is encrypted and confidential."
    },
    {
      icon: Eye,
      title: "Information Capture",
      content: "We collect minimal metadata required to facilitate your archival acquisitions. This includes your name, verified email protocol, and logistics data for secure transport. Payment information is handled through high-security encrypted gateways (Cashfree) and never persists in our internal manifests."
    },
    {
      icon: Lock,
      title: "Security Protocols",
      content: "All sessions are shielded by Industry-standard TLS encryption. Our internal archives are hosted on secure, distributed cloud nodes with zero-trust access architecture. We conduct periodic security audits to ensure your heritage assets remain protected from unauthorized extraction."
    },
    {
      icon: FileText,
      title: "Archival Rights",
      content: "You retain the right to request a full extract of your digital footprint or the total deletion of your archival records. Such requests are processed within 48 archival hours of verification. Note that certain logistics records must persist for regulatory and heritage tracing purposes."
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pt-32 pb-20 px-8">
      <div className="max-w-4xl mx-auto">
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
            Digital Heritage Protocols
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-display italic tracking-tighter"
          >
            Privacy Policy
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-neutral-400 max-w-xl text-lg font-light leading-relaxed"
          >
            Our commitment to your confidentiality is as enduring as the pieces we archive. 
            Last updated: Archival Cycle June 2024.
          </motion.p>
        </header>

        <div className="grid gap-12">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="group p-12 bg-white rounded-[3rem] border border-black/5 hover:border-black/10 transition-all duration-700"
            >
              <div className="flex flex-col md:flex-row gap-12">
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-neutral-50 flex items-center justify-center text-black/20 group-hover:text-black group-hover:bg-neutral-100 transition-all duration-700">
                  <section.icon size={32} strokeWidth={1} />
                </div>
                <div>
                  <h3 className="text-2xl font-display italic mb-6">{section.title}</h3>
                  <p className="text-neutral-500 leading-relaxed text-lg font-light italic">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <footer className="mt-24 pt-16 border-t border-black/5 text-center">
          <p className="font-tech text-[9px] tracking-widest text-black/20 uppercase">
            DINOSPY Vault Security // All rights reserved
          </p>
        </footer>
      </div>
    </div>
  );
}
