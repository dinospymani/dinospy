import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Phone, UserPlus, ShieldCheck, ArrowLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { user, signUpWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUpWithEmail(formData.email, formData.password, formData.name, formData.phone);
    } catch (err) {
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-charcoal flex items-center justify-center relative overflow-hidden px-6 py-20">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/70 z-10" />
        <motion.img 
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
          src="/images/watch_movement_macro_1782377142964.jpg"
          className="w-full h-full object-cover grayscale opacity-30 brightness-[0.3]"
          alt="Precision Movement Detail"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Link to="/login" className="inline-flex items-center space-x-4 text-white/40 hover:text-white transition-all mb-12 group">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-colors">
            <ArrowLeft size={16} strokeWidth={1} />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] font-bold">Return_to_Auth</span>
        </Link>

        <div className="bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/10 overflow-hidden shadow-[0_100px_200px_-50px_rgba(0,0,0,0.5)]">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Info Panel */}
            <div className="p-12 md:p-16 bg-luxury-gold flex flex-col justify-between">
              <div className="space-y-8">
                <div className="w-16 h-16 bg-charcoal text-luxury-gold rounded-full flex items-center justify-center shadow-2xl">
                  <UserPlus size={28} strokeWidth={1} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-display font-medium tracking-tight text-charcoal leading-none">
                    Establish <br /><span className="italic opacity-40 text-charcoal">Identity.</span>
                  </h2>
                  <p className="text-charcoal/60 text-[11px] font-medium leading-relaxed tracking-tight max-w-[200px]">
                    Join the global collective of horological enthusiasts and gain early access to the vault.
                  </p>
                </div>
              </div>

              <div className="space-y-6 pt-20">
                <div className="flex items-center space-x-4 opacity-40">
                  <ShieldCheck size={16} strokeWidth={1} className="text-charcoal" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.4em] font-bold text-charcoal">SECURE_PROTOCOL_v3</span>
                </div>
                <div className="flex -space-x-3">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-luxury-gold bg-charcoal overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-full h-full object-cover grayscale" />
                     </div>
                   ))}
                   <div className="w-8 h-8 rounded-full border-2 border-luxury-gold bg-charcoal flex items-center justify-center">
                     <span className="text-[8px] font-bold text-luxury-gold">+4k</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Form Panel */}
            <div className="p-12 md:p-16">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3 group">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-white/20 ml-6 font-mono font-bold group-focus-within:text-luxury-gold transition-colors">IDENTITY_MANIFEST</label>
                  <div className="relative">
                    <User className="absolute left-8 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-luxury-gold/40 transition-colors" size={18} strokeWidth={1} />
                    <input 
                      type="text"
                      placeholder="Authorized Full Name..."
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pl-20 pr-8 text-sm font-display font-medium tracking-tight text-white focus:border-luxury-gold/50 outline-none transition-all placeholder:text-white/10"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

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
                  <label className="text-[9px] uppercase tracking-[0.4em] text-white/20 ml-6 font-mono font-bold group-focus-within:text-luxury-gold transition-colors">SECURE_TELEMETRY</label>
                  <div className="relative">
                    <Phone className="absolute left-8 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-luxury-gold/40 transition-colors" size={18} strokeWidth={1} />
                    <input 
                      type="tel"
                      placeholder="+91 . . . . . . . . . ."
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pl-20 pr-8 text-sm font-mono text-white focus:border-luxury-gold/50 outline-none transition-all placeholder:text-white/10"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                          INITIALIZE_MANIFEST
                          <UserPlus className="ml-6 opacity-40 group-hover/btn:translate-x-2 transition-transform" size={18} />
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
