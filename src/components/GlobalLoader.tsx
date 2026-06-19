import React from 'react';
import { motion } from 'motion/react';
import { Watch } from 'lucide-react';

export default function GlobalLoader() {
  return (
    <div className="h-screen w-full bg-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#d4af37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 border border-gold/10 border-t-gold/40 rounded-full"
        />
        
        {/* Inner watch icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Watch size={40} strokeWidth={1} className="text-gold" />
          </motion.div>
        </div>
      </div>
      
      <div className="mt-12 flex flex-col items-center">
        <span className="font-tech text-gold text-[10px] uppercase tracking-[0.8em] animate-pulse">Initializing_Protocol</span>
        <div className="mt-4 flex space-x-2">
           {[1, 2, 3].map(i => (
             <motion.div 
               key={i}
               animate={{ opacity: [0.1, 1, 0.1] }}
               transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
               className="w-1 h-[1px] bg-gold"
             />
           ))}
        </div>
      </div>
    </div>
  );
}
