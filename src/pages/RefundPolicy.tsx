import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, ShieldCheck, Clock, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RefundPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Clock,
      title: "14-Day Archival Return",
      content: "We offer a 14-day 'No Questions Asked' return policy for all heritage timepieces. The period begins from the moment the delivery PIN is verified by our armored transport partner. To be eligible, the piece must remain in 'Vault Original' condition."
    },
    {
      icon: ShieldCheck,
      title: "Vault Original Condition",
      content: "A return is only authorized if the security seals remain intact. The timepiece must show no signs of micro-abrasions, strap wear, or unauthorized movement opening. Every return undergoes a 40-point verification by our master watchmakers before approval."
    },
    {
      icon: RefreshCw,
      title: "Reimbursement Protocol",
      content: "Approved refunds are processed to the original payment source (Credit Card, Physical Bank Transfer, or Crypto Vault) within 5-7 archival business days. Note that initial logistics and insurance fees are non-reimbursable."
    },
    {
      icon: FileText,
      title: "Cancellation Protocol",
      content: "Acquisition requests can be cancelled within 2 hours of authorization without penalty. Once the piece has been extracted from the vault and prepared for armored transport, a 5% archival restocking fee will apply to all cancellations."
    },
    {
      icon: FileText,
      title: "Exemptions",
      content: "Grand Complications, Bespoke Commissions, and items marked as 'Final Acquisition' are ineligible for returns due to their custom-crafted nature and unique heritage value. These pieces are protected by our 24-month mechanical warranty instead."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20 px-8">
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
              className="inline-block px-6 py-2 rounded-full border border-black/5 bg-neutral-50 text-[8px] font-tech font-black tracking-[0.4em] uppercase mb-8"
            >
              Heritage Protection Protocols
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-display italic tracking-tighter"
            >
              Refund Policy
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 text-black/40 max-w-xl text-lg font-light leading-relaxed"
            >
              Your satisfaction with our horological acquisitions is paramount. We maintain rigorous standards for both acquisition and return.
            </motion.p>
          </header>

          <div className="grid gap-12">
            {sections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="group p-12 bg-neutral-50 rounded-[3rem] border border-black/5 hover:border-black/10 transition-all duration-700"
              >
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-white border border-black/5 flex items-center justify-center text-black/20 group-hover:text-black transition-all duration-700">
                    <section.icon size={32} strokeWidth={1} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display italic mb-6">{section.title}</h3>
                    <p className="text-black/60 leading-relaxed text-lg font-light italic">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 p-12 rounded-[3rem] border border-black/5 bg-black text-white text-center">
            <h2 className="text-3xl font-display italic mb-6">Need Assistance?</h2>
            <p className="text-white/60 mb-10 max-w-lg mx-auto italic font-light">Our concierge is standing by to assist with your return or heritage claim.</p>
            <button 
              onClick={() => navigate('/support')}
              className="px-12 py-5 rounded-full border border-white/20 hover:bg-white hover:text-black transition-all font-tech text-[10px] tracking-widest uppercase font-black"
            >
              Contact Concierge
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
