import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Mail, Lock, User, Phone, ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { user, isAuthModalOpen, setIsAuthModalOpen, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  useEffect(() => {
    if (user && isAuthModalOpen) {
      setIsAuthModalOpen(false);
    }
  }, [user, isAuthModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(formData.email, formData.password);
      } else {
        await signUpWithEmail(formData.email, formData.password, formData.name, formData.phone);
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setFormData({ email: '', password: '', name: '', phone: '' });
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-y-auto pt-20 pb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAuthModalOpen(false)}
            className="fixed inset-0 bg-black/95 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.9)] my-auto"
          >
            <div className="absolute top-0 left-0 w-full h-1 gold-gradient animate-pulse" />
            
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8 pt-12 sm:p-10 sm:pt-14">
              <div className="text-center mb-8">
                <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gold/30 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                  <ShieldCheck size={32} className="text-gold" />
                </div>
                <h2 className="text-2xl font-display uppercase tracking-[0.2em] mb-2">
                  {mode === 'login' ? 'Member Access' : 'New Acquisition'}
                </h2>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.1em] font-medium leading-relaxed max-w-[240px] mx-auto">
                  {mode === 'login' ? 'Authorized personnel login via secure credentials.' : 'Establish your identity for the acquisition database.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold/50 transition-colors" size={16} />
                      <input 
                        type="text"
                        placeholder="FULL NAME"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-mono tracking-widest text-white focus:border-gold/50 focus:bg-white/10 outline-none transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold/50 transition-colors" size={16} />
                      <input 
                        type="tel"
                        placeholder="MOBILE NO."
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-mono tracking-widest text-white focus:border-gold/50 focus:bg-white/10 outline-none transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </>
                )}
                
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold/50 transition-colors" size={16} />
                  <input 
                    type="email"
                    placeholder="EMAIL ADDRESS"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-mono tracking-widest text-white focus:border-gold/50 focus:bg-white/10 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold/50 transition-colors" size={16} />
                  <input 
                    type="password"
                    placeholder="SECURE PASSWORD"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-mono tracking-widest text-white focus:border-gold/50 focus:bg-white/10 outline-none transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 mt-4 gold-gradient text-luxury-black font-black uppercase tracking-[0.2em] rounded-2xl text-xs flex items-center justify-center shadow-[0_20px_40px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-luxury-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Authorize Access' : 'Join Collection'}
                      <ArrowRight className="ml-3" size={16} />
                    </>
                  )}
                </button>

                <div className="text-center pt-6">
                  <button 
                    type="button"
                    onClick={toggleMode}
                    className="text-[9px] uppercase tracking-[0.3em] font-black text-white/20 hover:text-gold transition-colors flex items-center justify-center mx-auto"
                  >
                    {mode === 'login' ? (
                      <>New Member? <span className="text-gold/60 ml-2">Register Proposal</span></>
                    ) : (
                      <>Registered? <span className="text-gold/60 ml-2">Login Credentials</span></>
                    )}
                  </button>
                </div>
              </form>

              <div className="pt-10 border-t border-white/5 mt-10">
                 <div className="flex justify-between items-center text-[7px] uppercase tracking-[0.4em] font-black text-white/10">
                   <div className="flex items-center">
                     <div className="w-1 h-1 bg-gold rounded-full mr-2" />
                     Encrypted
                   </div>
                   <div className="flex items-center">
                     <div className="w-1 h-1 bg-gold rounded-full mr-2" />
                     Verified
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
