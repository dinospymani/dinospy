import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import HomePage from './pages/HomePage';
import ProductDetailsPage from './pages/ProductDetails';
import AdminDashboard from './pages/AdminDashboard';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (adminOnly && (profile?.role !== 'admin' || user?.email !== 'manikanta5sy@gmail.com')) return <Navigate to="/" />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <FirebaseProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-luxury-black text-white selection:bg-gold selection:text-luxury-black">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductDetailsPage />} />
              <Route path="/search" element={<ExplorePage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </FirebaseProvider>
  );
}
