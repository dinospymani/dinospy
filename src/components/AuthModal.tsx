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
            className="relative w-full max-w-xl bg-white rounded-[4rem] border border-black/5 overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,0.15)] my-auto"
          >
            {/* Terminal Top Bar */}
            <div className="h-2 w-full bg-black flex space-x-1 px-10 items-center justify-end">
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <div className="w-1 h-1 rounded-full bg-white/20" />
            </div>
            
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-10 right-10 p-4 text-black/10 hover:text-black transition-colors z-10 hover:rotate-90 duration-500"
            >
              <X size={24} strokeWidth={1} />
            </button>

            <div className="p-12 sm:p-20">
              <div className="flex flex-col items-center text-center mb-16">
                <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mb-10 shadow-2xl">
                  <ShieldCheck size={32} strokeWidth={1} />
                </div>
                <div className="space-y-4">
                  <span className="font-tech text-black/20 text-[10px] tracking-[0.6em] uppercase flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-full mr-4 animate-pulse" />
                    Protocol_Authorized_Only
                  </span>
                  <h2 className="text-5xl md:text-6xl font-display italic tracking-tightest leading-none">
                    {mode === 'login' ? 'Access' : 'Register'} <span className="opacity-20 font-sans italic">{mode === 'login' ? 'Vault.' : 'Node.'}</span>
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-6">
                  {mode === 'signup' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6"
                    >
                      <div className="space-y-3 group">
                        <label className="text-[10px] uppercase tracking-[0.4em] text-black/20 ml-6 font-tech font-black group-focus-within:text-black transition-colors">IDENTITY_MANIFEST</label>
                        <div className="relative">
                          <User className="absolute left-8 top-1/2 -translate-y-1/2 text-black/10" size={18} strokeWidth={1} />
                          <input 
                            type="text"
                            placeholder="Authorized Full Name..."
                            required
                            className="w-full bg-black/[0.01] border border-black/5 rounded-[2.5rem] py-6 pl-20 pr-8 text-sm font-display italic tracking-tight text-black focus:border-black outline-none transition-all placeholder:text-black/10"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-3 group">
                        <label className="text-[10px] uppercase tracking-[0.4em] text-black/20 ml-6 font-tech font-black group-focus-within:text-black transition-colors">SECURE_TELEMETRY</label>
                        <div className="relative">
                          <Phone className="absolute left-8 top-1/2 -translate-y-1/2 text-black/10" size={18} strokeWidth={1} />
                          <input 
                            type="tel"
                            placeholder="+91 . . . . . . . . . ."
                            required
                            className="w-full bg-black/[0.01] border border-black/5 rounded-[2.5rem] py-6 pl-20 pr-8 text-sm font-mono text-black focus:border-black outline-none transition-all placeholder:text-black/10"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="space-y-3 group">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-black/20 ml-6 font-tech font-black group-focus-within:text-black transition-colors">ACCOUNT_NODE_ID</label>
                    <div className="relative">
                      <Mail className="absolute left-8 top-1/2 -translate-y-1/2 text-black/10" size={18} strokeWidth={1} />
                      <input 
                        type="email"
                        placeholder="operator@network.nexus"
                        required
                        className="w-full bg-black/[0.01] border border-black/5 rounded-[2.5rem] py-6 pl-20 pr-8 text-sm font-mono text-black focus:border-black outline-none transition-all placeholder:text-black/10"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 group">
                    <label className="text-[10px] uppercase tracking-[0.4em] text-black/20 ml-6 font-tech font-black group-focus-within:text-black transition-colors">ENCRYPTION_KEY</label>
                    <div className="relative">
                      <Lock className="absolute left-8 top-1/2 -translate-y-1/2 text-black/10" size={18} strokeWidth={1} />
                      <input 
                        type="password"
                        placeholder="••••••••••••"
                        required
                        className="w-full bg-black/[0.01] border border-black/5 rounded-[2.5rem] py-6 pl-20 pr-8 text-sm font-mono text-black focus:border-black outline-none transition-all placeholder:text-black/10"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-10 pt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-10 bg-black text-white font-tech font-black uppercase tracking-[0.8em] rounded-[3rem] text-[11px] flex items-center justify-center shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-700 disabled:opacity-50 relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-700" />
                    <span className="relative z-10 flex items-center">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {mode === 'login' ? 'INITIALIZE_AUTH' : 'CREATE_MANIFEST'}
                          <LogIn className="ml-6 opacity-40 group-hover/btn:translate-x-2 transition-transform" size={18} />
                        </>
                      )}
                    </span>
                  </button>

                  <div className="flex flex-col items-center space-y-4">
                    <button 
                      type="button"
                      onClick={toggleMode}
                      className="text-[10px] uppercase tracking-[0.4em] font-black text-black/20 hover:text-black transition-all"
                    >
                      {mode === 'login' ? (
                        <>NO_NODE_FOUND? <span className="underline underline-offset-8 ml-2 font-display italic tracking-tight">ESTABLISH_IDENTITY</span></>
                      ) : (
                        <>NODE_EXISTS? <span className="underline underline-offset-8 ml-2 font-display italic tracking-tight">ACCESS_TERMINAL</span></>
                      )}
                    </button>
                    
                    <div className="flex items-center space-x-6 pt-10 opacity-10">
                       <ShieldCheck size={20} strokeWidth={1} />
                       <div className="w-10 h-[1px] bg-black" />
                       <span className="font-tech text-[8px] tracking-[0.4em] font-black uppercase">DINOSPY_SECURE_VAULT_v3.42</span>
                    </div>
                  </div>
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
