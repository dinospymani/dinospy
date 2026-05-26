import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth, db } from './AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  discount?: number;
  offerExpiry?: string;
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
  coupon: any | null;
  applyCoupon: (coupon: any) => void;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('dinospy_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('dinospy_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [coupon, setCoupon] = useState<any | null>(() => {
    const saved = localStorage.getItem('dinospy_coupon');
    return saved ? JSON.parse(saved) : null;
  });

  // Sync wishlist from profile when user logs in
  useEffect(() => {
    if (profile?.wishlist) {
      setWishlist(profile.wishlist);
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('dinospy_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('dinospy_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (coupon) {
      localStorage.setItem('dinospy_coupon', JSON.stringify(coupon));
    } else {
      localStorage.removeItem('dinospy_coupon');
    }
  }, [coupon]);

  // Real-time synchronization for items currently in the cart
  useEffect(() => {
    if (cart.length === 0) return;

    const unsubscribedIds = new Set<string>();
    const unsubscribes: (() => void)[] = [];

    cart.forEach((item) => {
      if (unsubscribedIds.has(item.id)) return;
      unsubscribedIds.add(item.id);

      const itemRef = doc(db, 'products', item.id);
      const unsub = onSnapshot(itemRef, (docSnap) => {
        if (docSnap.exists()) {
          const updatedProduct = { id: docSnap.id, ...docSnap.data() } as Product;
          setCart(prev => prev.map(cartItem => 
            cartItem.id === docSnap.id 
              ? { ...cartItem, ...updatedProduct } 
              : cartItem
          ));
        } else {
          // If product removed from database, remove from cart
          setCart(prev => prev.filter(cartItem => cartItem.id !== item.id));
        }
      }, (err) => {
        console.warn(`Cart sync isolation active for ${item.id}`, err);
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [cart.length]); // Only re-run when items are added/removed

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
      toast.success(`${product.name} Secured`, {
        id: `cart-${product.id}`,
        description: `${quantity} unit${quantity > 1 ? 's' : ''} added to your acquisition queue.`
      });
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const item = prev.find(i => i.id === productId);
      if (item) {
        toast.info('Asset Released', {
          id: `cart-remove-${productId}`,
          description: `${item.name} removed from cart.`
        });
      }
      return prev.filter(i => i.id !== productId);
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        
        // Capped at 1
        if (newQty < 1) return item;

        // Capped at stock
        if (item.stock !== undefined && newQty > item.stock) {
          toast.error(`Stock Limit: Only ${item.stock} units available`, {
            id: `stock-err-${productId}`
          });
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

    if (isAdding) {
      toast.success('Collection Updated', {
        id: `wishlist-${productId}`,
        description: 'Asset archived in your private registry.'
      });
    } else {
      toast.info('Collection Updated', {
        id: `wishlist-${productId}`,
        description: 'Asset removed from your private registry.'
      });
    }

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

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
  };

  const applyCoupon = (newCoupon: any) => {
    setCoupon(newCoupon);
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  const baseTotal = cart.reduce((acc, item) => {
    let itemDiscount = item.discount || 0;
    const discountPrice = Math.round(item.price * (1 - itemDiscount / 100));
    return acc + (discountPrice * item.quantity);
  }, 0);

  let cartTotal = baseTotal;
  if (coupon) {
    if (coupon.type === 'percentage') {
      cartTotal = Math.round(baseTotal * (1 - coupon.discount / 100));
    } else {
      cartTotal = Math.max(0, baseTotal - coupon.discount);
    }
  }

  return (
    <CartContext.Provider value={{ 
      cart, wishlist, addToCart, removeFromCart, updateQuantity, toggleWishlist, clearCart, cartCount, cartTotal, coupon, applyCoupon, removeCoupon 
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
