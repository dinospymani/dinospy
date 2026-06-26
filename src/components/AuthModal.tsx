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
            className="fixed inset-0 bg-white/20 backdrop-blur-[100px]"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-md bg-white rounded-[3rem] border border-black/5 overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,0.15)] my-auto"
          >
            {/* Terminal Top Bar */}
            <div className="h-1.5 w-full bg-black flex space-x-1 px-8 items-center justify-end">
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <div className="w-1 h-1 rounded-full bg-white/20" />
            </div>
            
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-black/10 hover:text-black transition-colors z-10 hover:rotate-90 duration-500"
            >
              <X size={20} strokeWidth={1} />
            </button>

            <div className="p-6 sm:p-10">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mb-6 shadow-xl">
                  <ShieldCheck size={24} strokeWidth={1} />
                </div>
                <div className="space-y-2">
                  <span className="font-mono text-black/20 text-[8px] tracking-[0.4em] uppercase flex items-center justify-center font-bold">
                    <div className="w-1 h-1 bg-black rounded-full mr-2 animate-pulse" />
                    Protocol_Authorized_Only
                  </span>
                  <h2 className="text-3xl md:text-4xl font-display font-medium tracking-tightest leading-none">
                    {mode === 'login' ? 'Access' : 'Register'} <span className="opacity-10 text-black italic">{mode === 'login' ? 'Vault.' : 'Node.'}</span>
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {mode === 'signup' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5 group">
                        <label className="text-[8px] uppercase tracking-[0.2em] text-black/20 ml-4 font-mono font-bold group-focus-within:text-black transition-colors">IDENTITY_MANIFEST</label>
                        <div className="relative">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-black/10" size={14} strokeWidth={1} />
                          <input 
                            type="text"
                            placeholder="Authorized Full Name..."
                            required
                            className="w-full bg-neutral-50 border border-black/5 rounded-[1.5rem] py-4 pl-14 pr-5 text-sm font-display font-medium tracking-tight text-black focus:border-black outline-none transition-all placeholder:text-black/10"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 group">
                        <label className="text-[8px] uppercase tracking-[0.2em] text-black/20 ml-4 font-mono font-bold group-focus-within:text-black transition-colors">SECURE_TELEMETRY</label>
                        <div className="relative">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-black/10" size={14} strokeWidth={1} />
                          <input 
                            type="tel"
                            placeholder="+91 . . . . . . . . . ."
                            required
                            className="w-full bg-neutral-50 border border-black/5 rounded-[1.5rem] py-4 pl-14 pr-5 text-sm font-mono text-black focus:border-black outline-none transition-all placeholder:text-black/10"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="space-y-1.5 group">
                    <label className="text-[8px] uppercase tracking-[0.2em] text-black/20 ml-4 font-mono font-bold group-focus-within:text-black transition-colors">ACCOUNT_NODE_ID</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-black/10" size={14} strokeWidth={1} />
                      <input 
                        type="email"
                        placeholder="operator@network.nexus"
                        required
                        className="w-full bg-neutral-50 border border-black/5 rounded-[1.5rem] py-4 pl-14 pr-5 text-sm font-mono text-black focus:border-black outline-none transition-all placeholder:text-black/10"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 group">
                    <label className="text-[8px] uppercase tracking-[0.2em] text-black/20 ml-4 font-mono font-bold group-focus-within:text-black transition-colors">ENCRYPTION_KEY</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-black/10" size={14} strokeWidth={1} />
                      <input 
                        type="password"
                        placeholder="••••••••••••"
                        required
                        className="w-full bg-neutral-50 border border-black/5 rounded-[1.5rem] py-4 pl-14 pr-5 text-sm font-mono text-black focus:border-black outline-none transition-all placeholder:text-black/10"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-2">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 bg-black text-white font-mono font-bold uppercase tracking-[0.6em] rounded-[2rem] text-[9px] flex items-center justify-center shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-700 disabled:opacity-50 relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-700" />
                    <span className="relative z-10 flex items-center">
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {mode === 'login' ? 'INITIALIZE_AUTH' : 'CREATE_MANIFEST'}
                          <LogIn className="ml-4 opacity-40 group-hover/btn:translate-x-2 transition-transform" size={14} />
                        </>
                      )}
                    </span>
                  </button>

                  <div className="flex flex-col items-center space-y-4">
                    <button 
                      type="button"
                      onClick={toggleMode}
                      className="text-[8px] uppercase tracking-[0.2em] font-bold text-black/20 hover:text-black transition-all"
                    >
                      {mode === 'login' ? (
                        <>NO_NODE_FOUND? <span className="underline underline-offset-4 ml-2 font-display italic tracking-tight">ESTABLISH_IDENTITY</span></>
                      ) : (
                        <>NODE_EXISTS? <span className="underline underline-offset-4 ml-2 font-display italic tracking-tight">ACCESS_TERMINAL</span></>
                      )}
                    </button>
                    
                    <div className="flex items-center space-x-4 pt-2 opacity-5">
                       <ShieldCheck size={12} strokeWidth={1} />
                       <div className="w-6 h-[1px] bg-black" />
                       <span className="font-mono text-[6px] tracking-[0.2em] font-bold uppercase">DINOSPY_SECURE_v3.42</span>
                    </div>
                  </div>
                </div>
              </form>

              <div className="pt-4 border-t border-black/5 mt-6">
                 <div className="flex justify-between items-center text-[6px] uppercase tracking-[0.2em] font-bold text-black/10">
                   <div className="flex items-center">
                     <div className="w-1 h-1 bg-black rounded-full mr-2" />
                     Encrypted
                   </div>
                   <div className="flex items-center">
                     <div className="w-1 h-1 bg-black rounded-full mr-2" />
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
