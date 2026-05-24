import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FirebaseProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
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

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
        <Route path="/partner/:orderId" element={<PageTransition><PartnerPortal /></PageTransition>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './context/AuthContext';
import { Toaster } from 'sonner';
import AuthModal from './components/AuthModal';

const MaintenanceScreen = ({ isAdmin, onBypass }: { isAdmin: boolean; onBypass: () => void }) => {
  const { setIsAuthModalOpen } = useAuth();
  
  return (
    <div className="h-screen w-full bg-luxury-black flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-12 rounded-[3rem] border border-gold/10"
        >
          <div className="relative mb-12">
            <motion.div 
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-2 border-gold/20 border-t-gold rounded-full mx-auto"
            />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-2 h-2 bg-gold rounded-full animate-ping" />
            </div>
          </div>
          <h1 className="text-3xl font-display gold-text mb-6">Store Under Maintenance</h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.4em] font-black mb-8 italic">Enhancing Your Experience</p>
          <div className="space-y-4">
            <p className="text-sm text-white/60 leading-relaxed">
              DINOSPY is currently undergoing a scheduled update. We are making some improvements to our store to provide you with a even better shopping experience.
            </p>
            <div className="pt-8 border-t border-white/5 flex flex-col items-center space-y-6">
              <p className="text-[9px] uppercase tracking-widest text-gold font-bold">Standard service will resume shortly</p>
              
              <div className="flex flex-col items-center space-y-4 w-full">
                {isAdmin ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBypass}
                    className="px-8 py-3 rounded-full border border-gold/20 text-gold text-[10px] uppercase tracking-widest font-bold hover:bg-gold/5 transition-all flex items-center"
                  >
                    <span className="mr-2">●</span> Bypass Alignment
                  </motion.button>
                ) : (
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-[9px] uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
                  >
                    Authorized Access Only
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
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
    <FirebaseProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <MaintenanceGuard>
            <div className="min-h-screen bg-luxury-black text-white selection:bg-gold selection:text-luxury-black">
              <Toaster position="top-center" richColors />
              <AuthModal />
              <AnimatedRoutes />
            </div>
          </MaintenanceGuard>
        </Router>
      </CartProvider>
    </FirebaseProvider>
  );
}
