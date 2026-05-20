import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth, db } from './AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  discount?: number;
  isOffer?: boolean;
  images: string[];
  stock?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  toggleWishlist: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('aureum_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('aureum_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync wishlist from profile when user logs in
  useEffect(() => {
    if (profile?.wishlist) {
      setWishlist(profile.wishlist);
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('aureum_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('aureum_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (product: Product, quantity: number = 1) => {
    let success = false;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const targetQty = currentQty + quantity;

      if (product.stock !== undefined && targetQty > product.stock) {
        toast.error(`Insufficient inventory: Only ${product.stock} available.`);
        return prev;
      }

      if (product.stock !== undefined && product.stock <= 0) {
        toast.error(`${product.name} is currently out of stock.`);
        return prev;
      }
      
      success = true;
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: targetQty } : item);
      }
      return [...prev, { ...product, quantity }];
    });
    
    if (success) {
      toast.success(`${quantity} ${product.name} added to collection`);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        
        // Capped at 1
        if (newQty < 1) return item;

        // Capped at stock
        if (item.stock !== undefined && newQty > item.stock) {
          toast.error(`Insufficient stock: Only ${item.stock} units in inventory.`);
          return item;
        }

        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const toggleWishlist = async (productId: string) => {
    const isAdding = !wishlist.includes(productId);
    
    // Update local state immediately
    setWishlist(prev => 
      isAdding ? [...prev, productId] : prev.filter(id => id !== productId)
    );

    // Sync with Firestore if logged in
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          wishlist: isAdding ? arrayUnion(productId) : arrayRemove(productId)
        });
      } catch (err) {
        console.error('Wishlist Sync Error:', err);
        // Feedback not strictly necessary as local state is updated
      }
    }
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => {
    const discountPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;
    return acc + (discountPrice * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cart, wishlist, addToCart, removeFromCart, updateQuantity, toggleWishlist, clearCart, cartCount, cartTotal 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
