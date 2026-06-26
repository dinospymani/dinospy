import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { FirebaseProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion } from 'motion/react';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProductDetailsPage from './pages/ProductDetails';
import AdminDashboard from './pages/AdminDashboard';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import PartnerPortal from './pages/PartnerPortal';
import FAQPage from './pages/FAQPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import TermsOfService from './pages/TermsOfService';
import ContactUs from './pages/ContactUs';

import { SmoothScroll } from './components/SmoothScroll';
import { Preloader } from './components/Preloader';
import { FloatingBottomNav } from './components/FloatingBottomNav';
import GlobalLoader from './components/GlobalLoader';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './context/AuthContext';
import { Toaster, toast } from 'sonner';
import AuthModal from './components/AuthModal';
import { Shield, Lock, Activity, Wifi } from 'lucide-react';

import SupportHubPage from './pages/SupportHubPage';
import OrderTrackingPage from './pages/OrderTrackingPage';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    className="w-full"
    transition={{ 
      duration: 1, 
      ease: [0.76, 0, 0.24, 1] 
    }}
  >
    {children}
  </motion.div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <GlobalLoader />;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && profile?.role !== 'admin' && profile?.role !== 'support' && user?.email !== 'manikanta5sy@gmail.com') {
    if (process.env.NODE_ENV === "production") return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignupPage /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetailsPage /></PageTransition>} />
        <Route path="/explore" element={<PageTransition><ExplorePage /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/wishlist" element={<PageTransition><WishlistPage /></PageTransition>} />
        <Route path="/checkout" element={<ProtectedRoute><PageTransition><CheckoutPage /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
        <Route path="/faq" element={<PageTransition><FAQPage /></PageTransition>} />
        <Route path="/support" element={<ProtectedRoute><PageTransition><SupportHubPage /></PageTransition></ProtectedRoute>} />
        <Route path="/track" element={<PageTransition><OrderTrackingPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/refund" element={<PageTransition><RefundPolicy /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactUs /></PageTransition>} />
        <Route path="/partner/:orderId" element={<PageTransition><PartnerPortal /></PageTransition>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

const MaintenanceScreen = ({ isAdmin, onBypass }: { isAdmin: boolean; onBypass: () => void }) => {
  const { setIsAuthModalOpen } = useAuth();
  
  return (
    <div className="h-screen w-full bg-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      
      <div className="max-w-3xl w-full relative z-10 text-center">
        <motion.div
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="font-mono text-black tracking-[0.6em] text-[10px] mb-8 block font-bold uppercase">SYSTEM_CALIBRATION // STANDBY</span>
          <h1 className="text-6xl md:text-8xl font-display mb-8 text-black leading-tight font-medium">Refining the <br /><span className="opacity-10 text-black italic">Mechanical Soul.</span></h1>
          <p className="text-black/40 text-lg md:text-xl font-light mb-16 max-w-xl mx-auto leading-relaxed">
            We are currently recalibrating the DINOSPY vault for an improved horological experience. The storefront will be restored momentarily.
          </p>

          <div className="flex flex-col items-center space-y-8">
            <div className="w-48 h-[1px] bg-black/5 relative">
              <motion.div 
                animate={{ x: [-100, 200] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-black/20 w-12"
              />
            </div>
            
            {isAdmin ? (
              <button 
                onClick={onBypass}
                className="bg-black text-white px-12 py-5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all"
              >
                BYPASS_VAULT_LOCK
              </button>
            ) : (
              <Link 
                to="/login"
                className="font-mono text-[9px] tracking-[0.4em] text-black/40 hover:text-black transition-colors font-bold"
              >
                SECURE_IDENTITY_VERIFICATION
              </Link>
            )}
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

  if (checking) return <GlobalLoader />;

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

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, setIsAuthModalOpen } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    // Only prompt for login if:
    // 1. User is not logged in
    // 2. Auth state has finished loading
    // 3. We are NOT on login, signup, or legal pages (to avoid infinite loops or blocking public info)
    const publicPaths = ['/login', '/signup', '/privacy', '/refund', '/terms', '/contact', '/faq'];
    const isPublicPath = publicPaths.includes(location.pathname);

    if (!loading && !user && !isPublicPath) {
      // Delay slightly to allow page load
      const timer = setTimeout(() => {
        setIsAuthModalOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, location.pathname, setIsAuthModalOpen]);

  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <FirebaseProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <Preloader />
            <SmoothScroll>
              <MaintenanceGuard>
                <AuthGate>
                  <div className="min-h-screen w-full bg-white text-black selection:bg-black selection:text-white relative flex flex-col pb-24 md:pb-0">
                    <Toaster position="top-center" richColors />
                    <AuthModal />
                    <AnimatedRoutes />
                    <FloatingBottomNav />
                  </div>
                </AuthGate>
              </MaintenanceGuard>
            </SmoothScroll>
          </Router>
        </CartProvider>
      </FirebaseProvider>
    </ThemeProvider>
  );
}
