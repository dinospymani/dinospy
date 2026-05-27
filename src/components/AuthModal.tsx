import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Mail, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    await signInWithGoogle();
    setIsAuthModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
          >
            <div className="absolute top-0 left-0 w-full h-1 gold-gradient" />
            
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-10 pt-12 text-center">
              <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-8 border border-gold/30 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                <ShieldCheck size={32} className="text-gold" />
              </div>

              <h2 className="text-2xl font-display uppercase tracking-[0.2em] mb-4">Secure Access Required</h2>
              <p className="text-white/40 text-sm leading-relaxed mb-10 font-medium">
                To curate your collection and manage acquisitions, you must establish a verified secure connection.
              </p>

              <div className="space-y-4">
                <button 
                  onClick={handleSignIn}
                  className="w-full py-5 gold-gradient text-luxury-black font-black uppercase tracking-[0.2em] rounded-2xl text-xs flex items-center justify-center shadow-[0_20px_40px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <LogIn className="mr-3" size={18} />
                  Connect with Google
                </button>
                
                <div className="pt-6 border-t border-white/5">
                   <div className="flex justify-between items-center text-[8px] uppercase tracking-[0.3em] font-black text-white/20">
                     <span>Secure Connection</span>
                     <span>256-bit Encryption</span>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
