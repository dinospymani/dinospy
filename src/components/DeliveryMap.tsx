import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation } from 'lucide-react';

interface DeliveryMapProps {
  status: string;
  orderId: string;
}

export default function DeliveryMap({ status, orderId }: DeliveryMapProps) {
  // Mock coordinates for the visualization
  const getPosition = (status: string) => {
    switch (status) {
      case 'pending': return { top: '80%', left: '20%', label: 'Origin Node' };
      case 'processing': return { top: '70%', left: '35%', label: 'Processing' };
      case 'quality_check': return { top: '60%', left: '50%', label: 'HQ Inspection' };
      case 'shipped': return { top: '45%', left: '60%', label: 'Terminal A' };
      case 'out_for_delivery': return { top: '30%', left: '75%', label: 'Last Mile' };
      case 'delivered': return { top: '20%', left: '85%', label: 'Destination' };
      default: return { top: '80%', left: '20%', label: 'Origin' };
    }
  };

  const pos = getPosition(status);

  return (
    <div className="relative w-full h-[300px] rounded-[2rem] overflow-hidden bg-[#0c0c0c] border border-white/5 shadow-inner">
      {/* Abstract Map Grid Background */}
      <div className="absolute inset-0 opacity-20" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} 
      />
      
      {/* Route Line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <motion.path
          d="M 100 240 Q 300 200, 500 150 T 900 60"
          fill="none"
          stroke="rgba(212, 175, 55, 0.1)"
          strokeWidth="2"
          strokeDasharray="8 8"
        />
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          d="M 100 240 Q 300 200, 500 150 T 900 60"
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth="3"
        />
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Origin Point */}
      <div className="absolute top-[80%] left-[10%] -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-white/20 rounded-full" />
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[7px] uppercase tracking-widest text-white/20 whitespace-nowrap">Central Hub</span>
      </div>

      {/* Target Marker */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ top: pos.top, left: pos.left }}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gold animate-ping rounded-full opacity-20" />
          <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            {status === 'shipped' || status === 'out_for_delivery' ? (
              <Navigation className="text-luxury-black rotate-45" size={18} fill="currentColor" />
            ) : (
              <MapPin className="text-luxury-black" size={18} fill="currentColor" />
            )}
          </div>
          
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gold px-3 py-1 rounded-full whitespace-nowrap shadow-xl">
             <p className="text-[9px] font-black uppercase text-luxury-black tracking-widest leading-none">{pos.label}</p>
          </div>
        </div>
      </motion.div>

      {/* Information Overlay */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
        <div className="glass-dark p-4 rounded-2xl border border-white/5 backdrop-blur-md">
          <p className="text-[7px] uppercase tracking-widest text-white/40 mb-1">Live Asset Tracking</p>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-mono text-white/80">LAT: 28.6139° N | LON: 77.2090° E</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <p className="text-[7px] uppercase tracking-widest text-white/20 mb-2">Platform Protocol</p>
          <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-[9px] font-bold text-gold uppercase tracking-[0.2em]">{status === 'delivered' ? 'SECURED' : 'TRANSIT'}</span>
          </div>
        </div>
      </div>

      {/* Map Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-luxury-black/60 to-transparent" />
    </div>
  );
}
