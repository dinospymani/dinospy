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

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
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

import { Toaster } from 'sonner';
import AuthModal from './components/AuthModal';

export default function App() {
  return (
    <FirebaseProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-luxury-black text-white selection:bg-gold selection:text-luxury-black">
            <Toaster position="top-center" richColors />
            <AuthModal />
            <AnimatedRoutes />
          </div>
        </Router>
      </CartProvider>
    </FirebaseProvider>
  );
}
