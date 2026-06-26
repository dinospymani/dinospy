import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, ShieldCheck, ArrowLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const { user, signInWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const from = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(formData.email, formData.password);
      // Success toast is handled in context
    } catch (err) {
      console.error('Login error:', err);
      // Error toast is handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-charcoal flex items-center justify-center relative overflow-hidden px-6 py-20">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          src="/images/watch_movement_macro_1782377142964.jpg"
          className="w-full h-full object-cover grayscale opacity-40 brightness-50"
          alt="Precision Movement Background"
        />
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 z-1 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        <Link to="/" className="inline-flex items-center space-x-4 text-white/40 hover:text-white transition-all mb-12 group">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-colors">
            <ArrowLeft size={16} strokeWidth={1} />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] font-bold">Return_to_Vault</span>
        </Link>

        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_100px_200px_-50px_rgba(0,0,0,0.5)] p-12 md:p-16">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="w-20 h-20 bg-luxury-gold text-charcoal rounded-full flex items-center justify-center mb-10 shadow-2xl relative">
              <div className="absolute inset-0 rounded-full border-2 border-luxury-gold animate-ping opacity-20" />
              <ShieldCheck size={32} strokeWidth={1} />
            </div>
            
            <div className="space-y-4">
              <span className="font-mono text-luxury-gold/40 text-[9px] tracking-[0.6em] uppercase flex items-center justify-center font-bold">
                <div className="w-1.5 h-1.5 bg-luxury-gold rounded-full mr-4 animate-pulse" />
                Access_Terminal_Authorized
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tightest leading-none text-white">
                Initialize <span className="opacity-20 text-white italic">Session.</span>
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-3 group">
                <label className="text-[9px] uppercase tracking-[0.4em] text-white/20 ml-6 font-mono font-bold group-focus-within:text-luxury-gold transition-colors">ACCOUNT_NODE_ID</label>
                <div className="relative">
                  <Mail className="absolute left-8 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-luxury-gold/40 transition-colors" size={18} strokeWidth={1} />
                  <input 
                    type="email"
                    placeholder="operator@network.nexus"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pl-20 pr-8 text-sm font-mono text-white focus:border-luxury-gold/50 outline-none transition-all placeholder:text-white/10"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-[9px] uppercase tracking-[0.4em] text-white/20 ml-6 font-mono font-bold group-focus-within:text-luxury-gold transition-colors">ENCRYPTION_KEY</label>
                <div className="relative">
                  <Lock className="absolute left-8 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-luxury-gold/40 transition-colors" size={18} strokeWidth={1} />
                  <input 
                    type="password"
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pl-20 pr-8 text-sm font-mono text-white focus:border-luxury-gold/50 outline-none transition-all placeholder:text-white/10"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-8 bg-white text-charcoal font-mono font-bold uppercase tracking-[0.8em] rounded-[2.5rem] text-[10px] flex items-center justify-center shadow-2xl hover:bg-luxury-gold hover:scale-[1.02] active:scale-[0.98] transition-all duration-700 disabled:opacity-50 relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-700" />
                <span className="relative z-10 flex items-center">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      ESTABLISH_AUTH
                      <LogIn className="ml-6 opacity-40 group-hover/btn:translate-x-2 transition-transform" size={18} />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          <div className="mt-12 flex flex-col items-center space-y-6">
            <Link 
              to="/signup"
              className="text-[9px] uppercase tracking-[0.4em] font-bold text-white/20 hover:text-luxury-gold transition-all flex items-center group"
            >
              UNAUTHORIZED? <span className="underline underline-offset-8 ml-2 font-display italic tracking-tight text-white/60 group-hover:text-white">CREATE_IDENTITY</span>
              <ChevronRight size={12} className="ml-2 opacity-20 group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="pt-10 border-t border-white/5 w-full flex justify-between items-center text-[7px] uppercase tracking-[0.5em] font-bold text-white/10">
              <div className="flex items-center">
                <div className="w-1 h-1 bg-luxury-gold rounded-full mr-2" />
                Encrypted_S256
              </div>
              <div className="flex items-center">
                <div className="w-1 h-1 bg-luxury-gold rounded-full mr-2" />
                Vault_Certified
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
