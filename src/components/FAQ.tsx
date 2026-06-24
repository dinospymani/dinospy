import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, HelpCircle, Shield, Truck, Clock, ShieldCheck } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'maintenance' | 'shipping' | 'authentication' | 'legal';
}

const faqs: FAQItem[] = [
  {
    category: 'legal',
    question: "Privacy Protocols & Data Encryption",
    answer: "We treat your digital footprint with archival reverence. Personal metadata is encrypted using the DINOSPY Vault Protocol. We do not share your acquisition records with third-party brokers. Your data is used exclusively for order fulfillment, security verification, and personalized concierge services. You retain the absolute right to request a full data extract or archival deletion at any point."
  },
  {
    category: 'legal',
    question: "Refund & Return Policy",
    answer: "We offer a 14-day 'No Questions Asked' return policy for heritage pieces in 'Vault Original' condition. To be eligible, all security seals must be intact and the timepiece must show no signs of micro-abrasions or wear. Refunds are processed to the original payment node within 5-7 business days of archival verification. Note: Grand Complications and Bespoke Commissions are ineligible for returns due to their unique craftsmanship."
  },
  {
    category: 'shipping',
    question: "Logistics & Global Transport Policies",
    answer: "All DINOSPY acquisitions are shipped via insured, climate-controlled transport. Standard domestic transit takes 3-5 archival days, while global logistics typically span 10-14 days. We provide end-to-end tracking and require a physical signature and secure PIN for every delivery. DINOSPY assumes full liability for the asset until it is successfully secured by the recipient."
  },
  {
    category: 'authentication',
    question: "Warranty & Aftercare Protection",
    answer: "Every masterpiece is protected by the DINOSPY 24-Month Heritage Warranty, covering all mechanical defects. We also provide a complimentary 'Archival Rejuvenation' service once per year, which includes a professional ultrasonic cleaning and movement calibration. Damage resulting from accidents, unauthorized opening, or misuse is not covered but can be repaired via our concierge service."
  },
  {
    category: 'legal',
    question: "Ethics & Sourcing Standards",
    answer: "DINOSPY is committed to ethical horology. We only acquire pre-owned pieces with verifiable provenance. Our sourcing protocols ensure that every component complies with international heritage protection laws and conflict-free diamond standards. We refuse to participate in any markets that jeopardize the integrity of the watchmaking tradition."
  },
  {
    category: 'maintenance',
    question: "How do I initiate a return or service request?",
    answer: "To initiate a return or request service, navigate to your 'Vault Portal' (Profile) and select the specific acquisition. Click on 'Request Logistics' to generate a pre-paid, insured shipping label and scheduling instructions for our armored transport partner. Our concierge will guide you through the secure packaging protocol."
  },
  {
    category: 'maintenance',
    question: "How often should I service my luxury watch?",
    answer: "Most mechanical luxury watches should be serviced every 3 to 5 years. This includes cleaning, oiling, and adjusting the movement to ensure long-term accuracy and prevent wear on the delicate components."
  },
  {
    category: 'maintenance',
    question: "Is my watch water-resistant?",
    answer: "Water resistance varies by model. Always check the ATM or depth rating. We recommend having your watch pressure-tested annually, especially if you frequently swim or dive with it. Never adjust the crown while the watch is wet or submerged."
  },
  {
    category: 'maintenance',
    question: "How should I store my watch when not in use?",
    answer: "Store your watch in a cool, dry place away from direct sunlight. We recommend using the original presentation box or a dedicated watch winder for automatic movements to keep the internal lubricants flowing correctly."
  },
  {
    category: 'shipping',
    question: "What is the expected delivery timeline?",
    answer: "Standard delivery for our heritage pieces typically takes 3-7 business days within major metropolitan areas. Each shipment is fully insured and requires am authentication PIN provided in your profile upon delivery."
  },
  {
    category: 'shipping',
    question: "Do you ship internationally?",
    answer: "Yes, DINOSPY provides global logistics coverage. International shipping timelines vary between 10-21 days depending on customs clearance procedures in the destination country."
  },
  {
    category: 'authentication',
    question: "How do you verify the authenticity of pre-owned pieces?",
    answer: "Every pre-owned timepiece undergoes a rigorous 40-point inspection by our master watchmakers. We verify the movement, serial numbers, and physical condition against manufacturer databases before awarding the DINOSPY Certificate of Heritage."
  },
  {
    category: 'authentication',
    question: "What is included in the Certificate of Heritage?",
    answer: "The certificate provides a permanent digital and physical record of your watch's authenticity, service history during our possession, and a 24-month mechanical warranty backed by DINOSPY."
  },
  {
    category: 'maintenance',
    question: "How do I request a refund or return?",
    answer: "We offer a 7-day 'No Questions Asked' return policy for all pieces, provided they are in 'Vault Original' condition with all seals intact. Refunds are processed to the original payment node within 5-7 business days of archival verification. Pieces showing signs of wear or unauthorized opening are ineligible for return."
  },
  {
    category: 'shipping',
    question: "What is your refund policy for late deliveries?",
    answer: "While we strive for precision, if a delivery exceeds 21 business days, you are eligible for a 5% heritage credit or a full return of the acquisition value. This does not apply to custom bespoke orders (Grand Complications)."
  }
];

export function FAQ() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'maintenance' | 'shipping' | 'authentication' | 'legal'>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = activeCategory === 'all' ? faqs : faqs.filter(f => f.category === activeCategory);

  const categories = [
    { id: 'all', label: 'All Queries', icon: HelpCircle },
    { id: 'maintenance', label: 'Maintenance', icon: Clock },
    { id: 'shipping', label: 'Logistics', icon: Truck },
    { id: 'authentication', label: 'Authentication', icon: Shield },
    { id: 'legal', label: 'Legal Protocols', icon: ShieldCheck },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-2xl md:text-4xl font-display text-black mb-4 uppercase tracking-tightest">Archives of Knowledge</h2>
        <p className="text-black/30 uppercase tracking-[0.3em] font-black text-[10px]">Navigating the Heritage Experience</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id as any);
              setOpenIndex(null);
            }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-full border transition-all ${
              activeCategory === cat.id 
                ? 'bg-black border-black text-white font-bold' 
                : 'bg-black/5 border-black/5 text-black/60 hover:bg-black/10'
            }`}
          >
            <cat.icon size={16} />
            <span className="text-[10px] uppercase tracking-widest font-black">{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredFaqs.map((faq, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-black/5 bg-neutral-50 overflow-hidden transition-all hover:border-black/20"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-8 py-6 flex items-center justify-between text-left"
            >
              <span className={`text-sm font-bold uppercase tracking-widest transition-colors ${openIndex === index ? 'text-black' : 'text-black/60'}`}>
                {faq.question}
              </span>
              <div className={`p-2 rounded-full transition-all ${openIndex === index ? 'bg-black text-white' : 'bg-black/5 text-black/40'}`}>
                {openIndex === index ? <Minus size={14} /> : <Plus size={14} />}
              </div>
            </button>
            
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-8 pb-8"
                >
                  <p className="text-sm text-black/60 leading-relaxed max-w-2xl">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
