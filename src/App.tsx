import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FirebaseProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion } from 'motion/react';

import HomePage from './pages/HomePage';
import ProductDetailsPage from './pages/ProductDetails';
import AdminDashboard from './pages/AdminDashboard';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import PartnerPortal from './pages/PartnerPortal';
import FAQPage from './pages/FAQPage';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15, scale: 0.985 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -15, scale: 0.985 }}
    transition={{ 
      duration: 0.8, 
      ease: [0.22, 1, 0.36, 1] 
    }}
  >
    {children}
  </motion.div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-luxury-black">
    <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
  </div>;
  if (!user) return <Navigate to="/" />;
  if (adminOnly && profile?.role !== 'admin' && user?.email !== 'manikanta5sy@gmail.com') return <Navigate to="/" />;
  
  return <>{children}</>;
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetailsPage /></PageTransition>} />
        <Route path="/explore" element={<PageTransition><ExplorePage /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/wishlist" element={<PageTransition><WishlistPage /></PageTransition>} />
        <Route path="/checkout" element={<ProtectedRoute><PageTransition><CheckoutPage /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
        <Route path="/faq" element={<PageTransition><FAQPage /></PageTransition>} />
        <Route path="/partner/:orderId" element={<PageTransition><PartnerPortal /></PageTransition>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './context/AuthContext';
import { Toaster, toast } from 'sonner';
import AuthModal from './components/AuthModal';

import { Shield, Lock, Activity, Wifi } from 'lucide-react';

const MaintenanceScreen = ({ isAdmin, onBypass }: { isAdmin: boolean; onBypass: () => void }) => {
  const { setIsAuthModalOpen } = useAuth();
  const [isScanning, setIsScanning] = React.useState(true);
  const [logs, setLogs] = React.useState<string[]>([]);
  
  const SECURITY_LOGS = [
    "SSL Handshake Verified",
    "Encrypted Buffer Sync",
    "Firewall Integrity: 100%",
    "Port 443 Traffic Scrubbed",
    "Database Handshake: SECURE",
    "Node AIS-Alpha Active",
    "Biometric Vault Locked",
    "IP Filtering Initialized",
    "Malware Scan: CLEAN",
    "Protocol D-OS Synchronized"
  ];

  React.useEffect(() => {
    const scanTimer = setTimeout(() => setIsScanning(false), 3500);
    
    // Automatic frequent security checks
    const logInterval = setInterval(() => {
      const randomLog = SECURITY_LOGS[Math.floor(Math.random() * SECURITY_LOGS.length)];
      setLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ${randomLog}`,
        ...prev.slice(0, 3)
      ]);
      
      // Briefly trigger scanning animation during "check"
      if (Math.random() > 0.7) {
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 2000);
      }
    }, 4500);

    return () => {
      clearTimeout(scanTimer);
      clearInterval(logInterval);
    };
  }, []);
  
  return (
    <div className="h-screen w-full bg-[#030303] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Security Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#d4af37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Side Security Ticker (Automatic Checks) */}
      <div className="absolute left-10 bottom-10 hidden lg:block space-y-4">
        <div className="flex items-center space-x-3 mb-6">
           <Activity size={14} className="text-gold animate-pulse text-luxury-black bg-gold rounded-full p-0.5" />
           <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-gold">Security Pulse</span>
        </div>
        <AnimatePresence mode="popLayout">
          {logs.map((log, idx) => (
            <motion.div 
              key={log + idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1 - (idx * 0.25), x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-[8px] font-mono text-white/40 uppercase tracking-widest whitespace-nowrap"
            >
              <span className="text-gold/40 mr-2">»</span> {log}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dynamic Laser Scan */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] bg-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.8)] z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 blur-[120px] rounded-full" />

      <div className="max-w-2xl w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 md:p-16 rounded-[4rem] border border-white/5 bg-black/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden"
        >
          {/* Security Corner Marks */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-gold/30 rounded-tl-xl" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-gold/30 rounded-br-xl" />

          {/* Top Status Bar */}
          <div className="flex justify-between items-center mb-16 px-2">
             <div className="flex items-center space-x-3">
                <div className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-orange-500 animate-ping' : 'bg-gold animate-pulse'}`} />
                <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-gold/60">
                  {isScanning ? 'Analyzing Cryptographic Integrity' : 'Vault Protocol Active'}
                </span>
             </div>
             <div className="flex items-center space-x-4 opacity-40">
                <Shield size={10} className="text-white" />
                <Lock size={10} className="text-white" />
                <Wifi size={10} className="text-white" />
             </div>
          </div>

          <div className="text-center">
            <div className="relative mb-14 inline-block">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 border border-gold/10 border-t-gold border-r-gold rounded-full"
              />
              <div className="absolute inset-4 border border-white/5 rounded-full flex items-center justify-center">
                 <Activity size={32} className={`transition-colors duration-1000 ${isScanning ? 'text-orange-500' : 'text-gold/40'} animate-pulse`} />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-display text-white mb-6 tracking-tight">
              Vault Under <span className="text-gold">Maintenance</span>
            </h1>
            
            <p className="text-[10px] font-mono uppercase tracking-[0.8em] text-gold/60 mb-10 ml-[0.8em]">
              Protocol: Alignment & Security
            </p>

            <div className="max-w-md mx-auto space-y-8">
              <div className="relative">
                <p className="text-xs md:text-sm text-white/40 leading-relaxed font-light font-sans px-4">
                  The DINOSPY digital archive is currently processing an infrastructure recalibration. Access to the collection is temporarily restricted to ensure absolute transaction security and manifest integrity.
                </p>
                {isScanning && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl"
                  >
                    <span className="text-[10px] font-mono text-gold uppercase animate-pulse">Running Diagnostic...</span>
                  </motion.div>
                )}
              </div>

              <div className="pt-10 flex flex-col items-center space-y-8">
                <div className="flex items-center space-x-12">
                   <div className="flex flex-col items-center">
                      <span className="text-[7px] uppercase tracking-widest text-white/20 mb-1">Enc Level</span>
                      <span className="text-[9px] uppercase tracking-widest text-white font-black">Grade 1 Luxury</span>
                   </div>
                   <div className="w-[1px] h-8 bg-white/5" />
                   <div className="flex flex-col items-center">
                      <span className="text-[7px] uppercase tracking-widest text-white/20 mb-1">Status</span>
                      <span className="text-[9px] uppercase tracking-widest text-white font-black">Restructuring</span>
                   </div>
                </div>
                
                <div className="w-full max-w-sm">
                  {isAdmin ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        toast.success('Protocol Bypassed', { id: 'maint-bypass' });
                        onBypass();
                      }}
                      className="w-full py-5 rounded-2xl gold-gradient text-black text-[10px] uppercase tracking-[0.4em] font-black shadow-2xl shadow-gold/20 flex items-center justify-center group"
                    >
                      <Lock size={14} className="mr-3 group-hover:rotate-12 transition-transform" />
                      Deactivate Vault Lock
                    </motion.button>
                  ) : (
                    <button 
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full py-5 rounded-2xl border border-white/5 text-[9px] uppercase tracking-[0.4em] text-white/10 hover:text-white/40 hover:border-white/10 transition-all font-bold group"
                    >
                      <Shield size={12} className="inline mr-2 group-hover:text-gold transition-colors" />
                      Secure Authorization Required
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3 opacity-20">
                   {[1, 2, 3, 4, 5].map(i => (
                     <motion.div 
                        key={i} 
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1 h-1 bg-white rounded-full" 
                     />
                   ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Footer Technical Detail */}
        <div className="mt-8 flex justify-center opacity-10 space-x-12">
           <p className="text-[7px] font-mono uppercase tracking-[0.5em] text-white">System: D-OS Active</p>
           <p className="text-[7px] font-mono uppercase tracking-[0.5em] text-white">Encryption: AES-512-GCM</p>
           <p className="text-[7px] font-mono uppercase tracking-[0.5em] text-white">Node: AIS-Alpha</p>
        </div>
      </div>
    </div>
  );
};

const MaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [isMaintenance, setIsMaintenance] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [isBypassed, setIsBypassed] = React.useState(() => {
    return sessionStorage.getItem('maintenance_bypass') === 'true';
  });

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'maintenance'), (doc) => {
      if (doc.exists()) {
        setIsMaintenance(doc.data().status || false);
      }
      setChecking(false);
    }, () => {
      setChecking(false);
    });
    return () => unsub();
  }, []);

  const isAdmin = profile?.role === 'admin' || user?.email === 'manikanta5sy@gmail.com';

  const handleBypass = () => {
    if (isAdmin) {
      setIsBypassed(true);
      sessionStorage.setItem('maintenance_bypass', 'true');
    }
  };

  if (checking) {
    return <div className="h-screen flex items-center justify-center bg-luxury-black">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  // If maintenance is on, show screen unless user is admin AND has bypassed
  if (isMaintenance && !isBypassed) {
    return (
      <>
        <AuthModal />
        <MaintenanceScreen isAdmin={isAdmin} onBypass={handleBypass} />
      </>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <FirebaseProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <MaintenanceGuard>
              <div className="min-h-screen bg-bg text-text selection:bg-gold selection:text-luxury-black">
                <Toaster position="top-center" richColors />
                <AuthModal />
                <AnimatedRoutes />
              </div>
            </MaintenanceGuard>
          </Router>
        </CartProvider>
      </FirebaseProvider>
    </ThemeProvider>
  );
}
