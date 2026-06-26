import React from 'react';
import { motion } from 'motion/react';
import { FileText, Scale, Gavel, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Gavel,
      title: "Archival Agreement",
      content: "By accessing the DINOSPY vault, you agree to abide by our strict acquisition protocols. Users must be at least 18 archival years of age and possess a verified digital identity. Our platform serves as a secure bridge for high-end horological acquisitions."
    },
    {
      icon: Scale,
      title: "User Responsibilities",
      content: "You are responsible for maintaining the confidentiality of your vault access credentials. Any acquisition authorized through your account is considered legally binding. DINOSPY reserves the right to terminate access if archival integrity is compromised."
    },
    {
      icon: ShieldCheck,
      title: "Intellectual Property",
      content: "All visual manifests, design architectures, and digital heritage assets displayed within the vault are the exclusive property of DINOSPY. Unauthorized extraction or replication of our mechanical soul is strictly prohibited and subject to legal pursuit."
    },
    {
      icon: FileText,
      title: "Liability Limitation",
      content: "While we ensure the utmost archival accuracy, DINOSPY is not liable for indirect metadata errors or transient digital synchronization delays. Acquisitions are subject to final physical verification by our master horologists."
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
            Vault Governance Framework
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-display italic tracking-tighter"
          >
            Terms of Service
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-neutral-400 max-w-xl text-lg font-light leading-relaxed"
          >
            Establishing the legal architecture of our digital exchange. 
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
            DINOSPY Legal Department // All rights reserved
          </p>
        </footer>
      </div>
    </div>
  );
}
