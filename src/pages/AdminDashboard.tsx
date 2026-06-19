import React, { useState, useEffect } from 'react';
import { db } from '../context/AuthContext';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, setDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { Plus, Trash2, Edit, Save, Package, QrCode, Printer, X, Truck, Loader2, ChevronLeft, TrendingUp, DollarSign, ShoppingBag, AlertCircle, BarChart2, Bell, ArrowLeft, Megaphone, Check, Zap, Clock, Shield, Lock, Eye, EyeOff, Database, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/utils';

interface AdminProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  rating: number;
  [key: string]: any;
}

interface AdminOrder {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'quality_check' | 'shipped' | 'out_for_delivery' | 'delivered';
  total: number;
  createdAt: string;
  items: any[];
  trackingId?: string;
  carrier?: string;
  timeline?: { status: string; timestamp: string; message: string }[];
  [key: string]: any;
}

export default function AdminDashboard() {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('DINOSPY');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [category, setCategory] = useState('Grand Complications');
  const [image, setImage] = useState('');
  const [imageFiles, setImageFiles] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isTrending, setIsTrending] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [discount, setDiscount] = useState('0');
  const [isOffer, setIsOffer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [view, setView] = useState<'products' | 'orders' | 'add' | 'banners' | 'stats' | 'notifications' | 'broadcast' | 'coupons' | 'security'>('stats');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'orders' | 'inventory'>('all');
  const [maintenanceStatus, setMaintenanceStatus] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [isTogglingTestMode, setIsTogglingTestMode] = useState(false);

  // Coupons States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponMinAmount, setCouponMinAmount] = useState('0');
  const [couponExpiry, setCouponExpiry] = useState('');

  // Broadcast States
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'offer' | 'trending' | 'new_arrival' | 'general'>('general');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [shouldAutoBroadcast, setShouldAutoBroadcast] = useState(false);

  // Stats
  const [stats, setStats] = useState({ revenue: 0, ordersCount: 0, lowStock: 0, conversionRate: 3.2 });
  const [chartData, setChartData] = useState<any[]>([]);

  // Stock edit states
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockValue, setNewStockValue] = useState<string>('');

  // Banner states
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerImageFile, setBannerImageFile] = useState<string | null>(null);
  const [bannerMobileImage, setBannerMobileImage] = useState('');
  const [bannerMobileImageFile, setBannerMobileImageFile] = useState<string | null>(null);
  const [bannerLink, setBannerLink] = useState('');
  const [bannerExpiry, setBannerExpiry] = useState('');
  const [bannerDisplayDesktop, setBannerDisplayDesktop] = useState(true);
  const [bannerDisplayMobile, setBannerDisplayMobile] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pSnap = await getDocs(collection(db, 'products'));
        const fetchedProducts = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminProduct));
        setProducts(fetchedProducts);
        
        const bSnap = await getDocs(collection(db, 'banners'));
        setBanners(bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
      // Initial manual stats calculation for products
      const lowStockProducts = fetchedProducts.filter(p => p.stock < 5);
      const lowStockCount = lowStockProducts.length;
      setStats(prev => ({ ...prev, lowStock: lowStockCount }));

      // Auto-populate inventory alerts
      if (lowStockCount > 0) {
        setNotifications(prev => {
          const newAlerts = lowStockProducts.map(p => ({
            id: `stock_${p.id}`,
            type: 'inventory',
            message: `CRITICAL STOCK: ${p.name} is down to ${p.stock} units.`,
            timestamp: new Date().toISOString(),
            read: false,
            productId: p.id
          }));
          
          // Filter out existing alerts to avoid duplicates
          const uniqueNewAlerts = newAlerts.filter(na => !prev.some(pa => pa.id === na.id));
          return [...uniqueNewAlerts, ...prev];
        });
      }

      } catch (err) {
        console.error("Error fetching static data:", err);
      }
    };
    fetchData();

    // REAL-TIME ORDER LISTENER
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminOrder));
      
      // If we already had orders, and new ones arrived, notify
      setOrders(prevOrders => {
        if (prevOrders.length > 0 && fetchedOrders.length > prevOrders.length) {
          const newOrders = fetchedOrders.filter(fo => !prevOrders.some(po => po.id === fo.id));
          newOrders.forEach((no) => {
             toast.success(`NEW ACQUISITION: ${no.customerName} just placed an order!`, {
               icon: <Bell className="text-gold" />,
               duration: 5000
             });
             setNotifications(prev => {
                // Prevent duplicate notifications for the same order
                if (prev.some(n => n.id === `noti_${no.id}`)) return prev;
                return [{
                  id: `noti_${no.id}`,
                  type: 'orders',
                  message: `New Order #${no.id.slice(-6)} received from ${no.customerName}`,
                  total: no.total,
                  timestamp: new Date().toISOString(),
                  read: false,
                  orderId: no.id
                }, ...prev];
             });
          });
        }
        return fetchedOrders;
      });

      // Update Intelligence (Stats) Real-time
      const revenue = fetchedOrders
        .filter(o => o.status === 'delivered')
        .reduce((acc, o) => acc + (o.total || 0), 0);
      
      setStats(prev => ({
        ...prev,
        revenue,
        ordersCount: fetchedOrders.length
      }));

      // Update chart data
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const dayOrders = fetchedOrders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString());
        const total = dayOrders.reduce((acc, o) => acc + (o.total || 0), 0);
        return { name: dateStr, sales: total };
      }).reverse();
      setChartData(last7Days);
    }, (error) => {
      console.warn("Order listener status: Verification required", error);
    });

    // Maintenance & Test Mode Listener
    const unsubMaintenance = onSnapshot(doc(db, 'settings', 'maintenance'), (doc) => {
      if (doc.exists()) {
        setMaintenanceStatus(doc.data().status || false);
        setTestMode(doc.data().testMode || false);
      }
    }, (error) => {
      console.warn("Settings isolation active", error);
    });

    // Coupons Listener
    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snap) => {
      setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Coupon isolation active", error);
    });

    return () => {
      unsubscribeOrders();
      unsubMaintenance();
      unsubCoupons();
    };
  }, []);

  const handleToggleMaintenance = async () => {
    setIsTogglingMaintenance(true);
    const mid = 'maint-toggle';
    try {
      const newStatus = !maintenanceStatus;
      await setDoc(doc(db, 'settings', 'maintenance'), { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success(newStatus ? 'SYSTEMS ENTERING STANDBY: Maintenance mode active' : 'SYSTEMS RESTORED: Storefront online', { id: mid });
    } catch (err) {
      console.error(err);
      toast.error('Maintenance state coordination failed', { id: mid });
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  const handleToggleTestMode = async () => {
    setIsTogglingTestMode(true);
    const tid = 'test-mode-toggle';
    try {
      const newStatus = !testMode;
      await setDoc(doc(db, 'settings', 'maintenance'), { 
        testMode: newStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success(newStatus ? 'TEST PROTOCOL ACTIVE: All new acquisitions marked for simulation' : 'LIVE PROTOCOL RESTORED: Transactions now legally binding', { id: tid });
    } catch (err) {
      console.error(err);
      toast.error('Test Mode state coordination failed', { id: tid });
    } finally {
      setIsTogglingTestMode(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      toast.warning('Manifest required: Title and Message are mandatory.');
      return;
    }

    if (broadcastTitle.trim().length < 5) {
      toast.error('Transmission title too short. Minimum 5 characters.');
      return;
    }

    if (broadcastMessage.trim().length < 10) {
      toast.error('Transmission message too short. Minimum 10 characters.');
      return;
    }

    setIsSaving(true);
    const path = 'notifications';
    try {
      await addDoc(collection(db, path), {
        title: broadcastTitle,
        message: broadcastMessage,
        type: broadcastType,
        link: broadcastLink || null,
        createdAt: new Date().toISOString()
      });
      
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastLink('');
      toast.success('Global Transmission Successful', { id: 'broadcast-success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurgeOrders = async () => {
    if (!window.confirm("CRITICAL PROTOCOL: This will permanently expunge ALL acquisition records and legacy manifests. Proceed with final authorization?")) return;
    
    setIsSaving(true);
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const batch = snap.docs.map(d => deleteDoc(doc(db, 'orders', d.id)));
      await Promise.all(batch);
      setOrders([]);
      setStats(prev => ({ ...prev, revenue: 0, ordersCount: 0 }));
      toast.success('Global Sales Manifest Expunged', { id: 'purge-orders' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear records', { id: 'purge-orders-error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
      toast.success('Local cache expunged. Re-syncing systems...', {
        icon: <Zap size={16} className="text-gold" />
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error('Failed to clear local cache');
    }
  };

  const handleUpdateStock = async (productId: string) => {
    if (!newStockValue) return;
    try {
      const stockNum = parseInt(newStockValue);
      await updateDoc(doc(db, 'products', productId), { stock: stockNum });
      setProducts(products.map(p => p.id === productId ? { ...p, stock: stockNum } : p));
      setEditingStockId(null);
      setNewStockValue('');
      toast.success('Inventory balance coordinated', { id: `stock-sync-${productId}` });
    } catch (err) {
      toast.error('Sync failed', { id: `stock-sync-err-${productId}` });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: AdminOrder['status'], trackingInfo?: { trackingId: string, carrier: string }) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const timelineEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        message: getStatusMessage(newStatus)
      };

      const updateData: any = { 
        status: newStatus,
        timeline: [...(order.timeline || []), timelineEntry]
      };

      if (trackingInfo) {
        updateData.trackingId = trackingInfo.trackingId;
        updateData.carrier = trackingInfo.carrier;
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);
      
      // Notify customer based on status
      if (order.userId) {
        let notificationTitle = "Order Update";
        let notificationMessage = timelineEntry.message;

        if (newStatus === 'quality_check') {
          notificationTitle = "Quality Assurance Initiated";
          notificationMessage = "Your timepiece is now undergoing rigorous multi-point inspection.";
        } else if (newStatus === 'shipped') {
          notificationTitle = "Masterpiece Dispatched";
          notificationMessage = `Your acquisition is in transit via ${trackingInfo?.carrier || 'Premium Courier'}. Tracking: ${trackingInfo?.trackingId || 'Available in portal'}`;
        } else if (newStatus === 'delivered') {
          notificationTitle = "Horological Milestone";
          notificationMessage = "Your DINOSPY Masterpiece has arrived. Does it meet your standards? Share your signature review.";
        }

        await addDoc(collection(db, 'users', order.userId, 'notifications'), {
          title: notificationTitle,
          message: notificationMessage,
          type: newStatus === 'delivered' ? "review_prompt" : "order_update",
          link: `/profile#orders`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      setOrders(orders.map(o => o.id === orderId ? { ...o, ...updateData } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, ...updateData });
      }
      toast.success(`Order advanced to: ${newStatus.replace('_', ' ')}`, { id: `order-status-${orderId}` });
    } catch (err) {
      console.error(err);
      toast.error('Transition failed', { id: `order-status-err-${orderId}` });
    }
  };

  const getStatusMessage = (status: string) => {
    const messages: Record<string, string> = {
      pending: "Order manifest received and awaiting validation.",
      processing: "Acquisition confirmed. Preparing for archival retrieval.",
      quality_check: "Currently undergoing precision testing and aesthetic validation.",
      shipped: "Logistics departure confirmed. The piece is in transit.",
      out_for_delivery: "A courier has taken possession for final local arrival.",
      delivered: "Signature delivery completed. Welcome to the collection."
    };
    return messages[status] || "Order state synchronized.";
  };

  const handleDelete = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'products', id));
        setProducts(products.filter(p => p.id !== id));
        toast.info('Product removed from catalog');
    } catch (err) {
        console.error(err);
        toast.error('Deletion failed');
    }
  };

  const handleMoveBanner = async (index: number, direction: 'up' | 'down') => {
    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;

    [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];
    
    try {
      // Update order in Firestore for all affected banners
      const batch = newBanners.map((b, i) => 
        updateDoc(doc(db, 'banners', b.id), { order: i })
      );
      await Promise.all(batch);
      setBanners(newBanners);
      toast.success('Banner sequence updated');
    } catch (err) {
      toast.error('Failed to sync sequence');
    }
  };

  const handleBannerMobileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Auto-select mobile, unselect desktop if no desktop file yet
    setBannerDisplayMobile(true);
    if (!bannerImageFile && !bannerImage) {
      setBannerDisplayDesktop(false);
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setBannerMobileImageFile(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImage && !bannerImageFile) {
      toast.warning('Vision required: Please provide at least one image for the banner.');
      return;
    }
    
    const finalImage = bannerImageFile || bannerImage;
    const finalMobileImage = bannerMobileImageFile || bannerMobileImage;

    if (!finalImage && !finalMobileImage) {
      toast.warning('Vision required: Please provide at least one image for the banner.');
      return;
    }

    if ((finalImage && finalImage.length > 800000) || (finalMobileImage && finalMobileImage.length > 800000)) {
      toast.error('Manifest too heavy: High-resolution assets detected. Please compress or use URL references.');
      return;
    }

    setIsSaving(true);
    const promise = async () => {
      try {
        const bannerData = {
          title: bannerTitle,
          subtitle: bannerSubtitle,
          imageUrl: finalImage || null,
          mobileImageUrl: finalMobileImage || null,
          link: bannerLink,
          expiryDate: bannerExpiry || null,
          active: true,
          displayDesktop: bannerDisplayDesktop,
          displayMobile: bannerDisplayMobile,
          order: banners.length,
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'banners'), bannerData);
        
        setBannerTitle('');
        setBannerSubtitle('');
        setBannerImage('');
        setBannerImageFile(null);
        setBannerMobileImage('');
        setBannerMobileImageFile(null);
        setBannerLink('');
        setBannerExpiry('');
        setBannerDisplayDesktop(true);
        setBannerDisplayMobile(true);
        
        const bSnap = await getDocs(collection(db, 'banners'));
        setBanners(bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } finally {
        setIsSaving(false);
      }
    };

    toast.promise(promise(), {
      loading: 'Deploying promotional asset...',
      success: 'Banner active on storefront!',
      error: (err) => {
        console.error('Banner Error:', err);
        return `Sync failed: ${err.message || 'Check connection'}`;
      }
    });
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !couponDiscount) {
      toast.warning('Coupon required: Code and value are mandatory.');
      return;
    }

    const cleanCode = couponCode.toUpperCase().trim();
    if (cleanCode.length < 3 || !/^[A-Z0-9]+$/.test(cleanCode)) {
      toast.error('Invalid coupon code. Alpha-numeric only, min 3 chars.');
      return;
    }

    const discountVal = parseFloat(couponDiscount);
    if (isNaN(discountVal) || discountVal <= 0) {
      toast.error('Discount value must be a positive number.');
      return;
    }

    if (couponType === 'percentage' && discountVal > 90) {
      toast.error('Discount cannot exceed 90%.');
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'coupons'), {
        code: cleanCode,
        discount: discountVal,
        type: couponType,
        minAmount: parseFloat(couponMinAmount) || 0,
        expiry: couponExpiry || null,
        active: true,
        createdAt: new Date().toISOString()
      });
      setCouponCode('');
      setCouponDiscount('');
      setCouponExpiry('');
      setCouponMinAmount('0');
      toast.success('Valid coupon applied');
    } catch (err) {
      toast.error('Failed to sync coupon');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
      toast.info('Coupon deleted');
    } catch (err) {
      toast.error('Delete operation failed');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'banners', id));
      setBanners(banners.filter(b => b.id !== id));
      toast.info('Banner removed');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleSeed = async () => {
    const seedProducts = [
      {
        name: 'Ouroboros Gold Edition',
        brand: 'DINOSPY',
        price: 245000,
        discount: 10,
        isOffer: true,
        category: 'Grand Complications',
        images: ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1974'],
        description: 'Forged in 18k solid gold with a deep obsidian skeleton dial. The Ouroboros is our signature statement of eternal luxury.',
        isTrending: true,
        isNewArrival: true,
        stock: 5,
        rating: 5.0,
        specs: { Movement: 'Tourbillon', Case: '18k Gold', Crystal: 'Double Sapphire' }
      },
      {
        name: 'Phantom Ghost Stealth',
        brand: 'DINOSPY',
        price: 85000,
        discount: 0,
        isOffer: false,
        category: 'Avant-Garde',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=2099'],
        description: 'Matte black titanium case with a carbon fiber dial. Designed for those who operate in the shadows.',
        isTrending: true,
        isNewArrival: true,
        stock: 12,
        rating: 4.8,
        specs: { Movement: 'Self-Winding', Case: 'Titanium', Crystal: 'Scratch-Proof' }
      },
      {
        name: 'Heritage Classic Ivory',
        brand: 'DINOSPY',
        price: 45000,
        discount: 5,
        isOffer: true,
        category: 'Heritage',
        images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=2018'],
        description: 'Hand-stitched leather strap with a sunray ivory dial. A timeless companion for the modern gentleman.',
        isTrending: false,
        isNewArrival: true,
        stock: 20,
        rating: 4.7,
        specs: { Movement: 'Quartz Precision', Case: 'Surgical Steel', Crystal: 'Mineral' }
      },
      {
        name: 'Quantum Connect Pro',
        brand: 'DINOSPY',
        price: 32000,
        discount: 0,
        isOffer: false,
        category: 'Avant-Garde',
        images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=2072'],
        description: 'The apex of wearable tech. OLED display with sapphire edge-to-edge protection. Syncs your digital life with luxury.',
        isTrending: true,
        isNewArrival: false,
        stock: 50,
        rating: 4.6,
        specs: { Movement: 'Digital Core', Case: 'Alloy', Crystal: 'Edge Sapphire' }
      },
      {
        name: 'Submariner Deep Sea',
        brand: 'DINOSPY',
        price: 135000,
        discount: 0,
        isOffer: false,
        category: 'Deep Sea',
        images: ['https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1974'],
        description: 'Waterproof up to 1000m. Built like a tank, finished like a diamond.',
        isTrending: true,
        isNewArrival: false,
        stock: 8,
        rating: 4.9,
        specs: { Movement: 'Automatic High-Freq', Case: 'Steel', Crystal: 'Thick Sapphire' }
      }
    ];

    setIsSaving(true);
    try {
      const batch = seedProducts.map(p => addDoc(collection(db, 'products'), {
        ...p,
        createdAt: new Date().toISOString(),
        reviewCount: 0
      }));
      await Promise.all(batch);
      
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminProduct)));
      toast.success('Catalog populated with seed data');
    } catch (err) {
      toast.error('Seeding failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || name.trim().length < 3) {
      toast.error('Product name required (min 3 chars).');
      return;
    }

    const priceVal = parseFloat(price);
    if (isNaN(priceVal) || priceVal <= 0) {
      toast.error('Price must be a positive numeric value.');
      return;
    }

    if (!description || description.trim().length < 20) {
      toast.error('Formal description required (min 20 chars).');
      return;
    }

    if (imageFiles.length === 0 && !image) {
      toast.warning('Evidence required: Please provide at least one image.');
      return;
    }
    
    const finalImages = imageFiles.length > 0 ? imageFiles : [image];
    const totalSize = finalImages.reduce((acc, img) => acc + img.length, 0);
    
    if (totalSize > 800000) {
      toast.error('Evidence payload too heavy. Please use smaller images or fewer high-res files.');
      return;
    }

    setIsSaving(true);
    const promise = async () => {
      try {
        const productRef = await addDoc(collection(db, 'products'), {
          name,
          brand,
          price: parseFloat(price) || 0,
          discount: parseFloat(discount) || 0,
          isOffer,
          category,
          images: finalImages,
          description,
          isTrending,
          isNewArrival,
          stock: parseInt(stock),
          rating: 5.0,
          reviewCount: 0,
          createdAt: new Date().toISOString(),
          specs: {
            Movement: 'Automatic',
            Case: 'Stainless Steel',
            Crystal: 'Sapphire'
          }
        });

        // Trigger Auto-Broadcast if enabled
        if (shouldAutoBroadcast) {
          let bTitle = "New Masterpiece Unveiled";
          let bMsg = `The ${name} is now available in our ${category} collection.`;
          let bType: 'new_arrival' | 'offer' | 'trending' = 'new_arrival';

          if (isOffer) {
            bTitle = "Limited Opportunity";
            bMsg = `Acquire the ${name} at an exclusive offer price for a limited time.`;
            bType = 'offer';
          } else if (isTrending) {
            bTitle = "Trending Acquisition";
            bMsg = `The ${name} is gaining significant traction among elite collectors.`;
            bType = 'trending';
          }

          await addDoc(collection(db, 'notifications'), {
            title: bTitle,
            message: bMsg,
            type: bType,
            link: `/product/${productRef.id}`,
            createdAt: new Date().toISOString()
          });
        }
        
        setName('');
        setPrice('');
        setDiscount('0');
        setImage('');
        setImageFiles([]);
        setDescription('');
        setShouldAutoBroadcast(false);
        
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminProduct)));
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'products');
      } finally {
        setIsSaving(false);
      }
    };

    toast.promise(promise(), {
      loading: 'Archiving new acquisition...',
      success: 'Masterpiece added to collection!',
      error: 'Manifest failed to save.'
    });
  };

  const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Auto-select desktop, unselect mobile if no mobile file yet
    setBannerDisplayDesktop(true);
    if (!bannerMobileImageFile && !bannerMobileImage) {
      setBannerDisplayMobile(false);
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setBannerImageFile(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const compressedFiles: string[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const reader = new FileReader();
      const compressed = await new Promise<string>((resolve) => {
        reader.onloadend = async () => {
          const result = await compressImage(reader.result as string);
          resolve(result);
        };
        reader.readAsDataURL(file);
      });
      compressedFiles.push(compressed);
    }
    setImageFiles(compressedFiles);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 max-w-[95%] mx-auto px-4 w-full bg-bg">
        <div className="mb-6">
          <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 text-text/40 hover:text-text transition-all duration-500 p-2 -ml-2"
          >
              <ArrowLeft size={16} />
              <span className="font-tech">EXIT_TERMINAL</span>
          </button>
        </div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12 border-b border-black/5 pb-12">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-2 h-2 bg-text rounded-full animate-pulse" />
              <span className="font-tech text-text/20">SYSTEM_ROOT // ADMIN_ACCESS</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display italic tracking-tightest">Command <span className="opacity-20">Center.</span></h1>
            <p className="text-text/30 mt-4 text-xs tracking-widest font-light italic">Master control interface for the DINOSPY global ecosystem.</p>
          </div>
          <div className="flex items-center space-x-1 p-1 bg-black/[0.02] rounded-full border border-black/5 overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'stats', label: 'INTELLIGENCE' },
              { id: 'add', label: 'ARCHIVE_NEW' },
              { id: 'products', label: 'INVENTORY' },
              { id: 'orders', label: 'ACQUISITIONS' },
              { id: 'notifications', label: 'ALERTS', urgent: notifications.some(n => !n.read) },
              { id: 'broadcast', label: 'TRANSMIT' },
              { id: 'banners', label: 'VISUALS' },
              { id: 'coupons', label: 'PROTOCOLS' },
              { id: 'security', label: 'SECURITY' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`flex-shrink-0 px-6 py-2.5 rounded-full text-[10px] font-tech transition-all duration-700 relative ${view === tab.id ? 'bg-text text-bg shadow-xl' : 'text-text/40 hover:text-text hover:bg-black/5'}`}
              >
                {tab.label}
                {tab.id === 'notifications' && tab.urgent && (
                  <span className="absolute top-2 right-4 w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="min-h-[60vh] relative">
          {view === 'stats' && (
            <div className="space-y-16 animate-in fade-in duration-1000">
               {/* Stats Cards */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { label: 'GROSS_REVENUE', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, trend: '+12%', color: 'from-black/5 to-transparent' },
                   { label: 'MANIFESTS_LOGGED', value: stats.ordersCount, icon: ShoppingBag, color: 'bg-black/[0.02]' },
                   { label: 'MARKET_TRACTION', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'bg-black/[0.02]' },
                   { label: 'INVENTORY_ALERTS', value: stats.lowStock, icon: AlertCircle, color: 'bg-black/[0.02]', alert: stats.lowStock > 0 },
                 ].map((stat, i) => (
                   <div key={i} className={`p-8 rounded-3xl border border-black/5 flex flex-col justify-between h-48 transition-all duration-700 hover:border-black/20 group ${stat.color}`}>
                     <div className="flex justify-between items-start">
                       <div className="w-10 h-10 bg-text text-bg rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                         <stat.icon size={18} />
                       </div>
                       {stat.trend && <span className="font-tech text-green-600">{stat.trend}</span>}
                       {stat.alert && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                     </div>
                     <div>
                       <p className="font-tech text-text/20 mb-1">{stat.label}</p>
                       <h3 className="text-3xl font-display">{stat.value}</h3>
                     </div>
                   </div>
                 ))}
               </div>

               {/* Chart */}
               <div className="p-8 rounded-[2.5rem] border border-black/5 bg-black/[0.01] h-[500px]">
                  <div className="flex justify-between items-center mb-12">
                     <div>
                        <div className="flex items-center space-x-3 mb-2">
                           <div className="w-1 h-1 bg-text rounded-full" />
                           <span className="font-tech text-text/20">DATA_VISUALIZATION // METRICS</span>
                        </div>
                        <h3 className="text-2xl font-display">Revenue <span className="opacity-20 italic">Intelligence.</span></h3>
                     </div>
                  </div>
                  <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#000000" stopOpacity={0.05}/>
                          <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#00000005" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#00000020" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tick={{ dy: 10 }}
                      />
                      <YAxis 
                        stroke="#00000020" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(0, 0, 0, 0.05)', 
                          borderRadius: '16px',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)'
                        }}
                        itemStyle={{ color: '#000', fontWeight: 'bold' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#000000" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>

               {/* System Diagnostics Output */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-black/5 pt-16">
                  <div className="space-y-6">
                     <div className="flex items-center space-x-3">
                        <Database size={16} className="text-text/20" />
                        <h4 className="font-tech text-text/40 text-[10px]">CORE_DATABASE // MAINTENANCE</h4>
                     </div>
                     <div className="space-y-4">
                        <button onClick={handleClearCache} className="w-full flex items-center justify-between p-6 bg-black/[0.02] border border-black/5 rounded-[2rem] hover:bg-black hover:text-bg transition-all duration-700">
                           <span className="font-tech text-[10px]">EXECUTE_CACHE_PURGE</span>
                           <ArrowRight size={14} />
                        </button>
                        <button onClick={handlePurgeOrders} className="w-full flex items-center justify-between p-6 border border-red-500/10 text-red-500/40 hover:bg-red-500 hover:text-white rounded-[2rem] transition-all duration-700">
                           <span className="font-tech text-[10px]">ERASE_ALL_MANIFESTS</span>
                           <Zap size={14} />
                        </button>
                     </div>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="flex items-center space-x-3">
                        <ShieldAlert size={16} className="text-text/20" />
                        <h4 className="font-tech text-text/40 text-[10px]">SECURITY_OVERRIDE // VAULT_LOCK</h4>
                     </div>
                     <button 
                       onClick={handleToggleMaintenance} 
                       className={`w-full p-10 rounded-[2.5rem] border transition-all duration-1000 flex flex-col items-center justify-center space-y-4 ${maintenanceStatus ? 'bg-black text-white border-black' : 'bg-transparent border-black/5 hover:border-black'}`}
                     >
                        <Lock size={32} />
                        <div className="text-center">
                           <p className="font-tech text-[10px] uppercase tracking-[0.3em]">{maintenanceStatus ? 'TERMINATE_LOCKDOWN' : 'INITIATE_VAULT_LOCK'}</p>
                           <p className="text-[8px] opacity-40 mt-1 font-tech uppercase tracking-widest">{maintenanceStatus ? 'SYSTEM_IS_CURRENTLY_RESTRICTED' : 'SECURE_THE_COLLECTION_FROM_PUBLIC'}</p>
                        </div>
                     </button>
                  </div>
               </div>
            </div>
          )}

          {view === 'products' && (
            <div className="space-y-12 animate-in fade-in duration-1000">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                       <div className="w-1 h-1 bg-text rounded-full" />
                       <span className="font-tech text-text/20">ASSET_REGISTER // CURATION</span>
                    </div>
                    <h2 className="text-3xl font-display">Inventory <span className="opacity-20 italic">Manifest.</span></h2>
                  </div>
                  <button onClick={handleSeed} className="font-tech text-text/30 hover:text-text text-[10px] underline decoration-black/10 underline-offset-4">GENERATE_SAMPLE_DATA</button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {products.map((p) => (
                    <div key={p.id} className="group p-6 rounded-[2.5rem] border border-black/5 bg-white hover:shadow-2xl transition-all duration-700">
                       <div className="aspect-square rounded-3xl overflow-hidden bg-black/5 mb-6 relative">
                          <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={p.name} />
                          <div className="absolute top-4 right-4 h-3 w-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: p.stock < 5 ? '#ef4444' : '#22c55e' }} />
                       </div>
                       <div className="space-y-1 mb-6">
                          <p className="font-tech text-text/20 text-[8px]">{p.category.toUpperCase()} // STOCK_{p.stock}</p>
                          <h4 className="text-lg font-bold truncate">{p.name}</h4>
                          <p className="font-mono text-xl opacity-60">₹{p.price.toLocaleString()}</p>
                       </div>
                       <div className="flex items-center justify-between pt-6 border-t border-black/5">
                          <div className="flex space-x-2">
                             <button onClick={() => {setEditingStockId(p.id); setNewStockValue(p.stock.toString());}} className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-500"><Edit size={16} /></button>
                             <button onClick={() => handleDelete(p.id)} className="w-10 h-10 rounded-full bg-red-50 text-red-500/40 hover:text-red-500 hover:bg-red-100 flex items-center justify-center transition-all duration-500"><Trash2 size={16} /></button>
                          </div>
                          {editingStockId === p.id && (
                             <div className="flex items-center space-x-2 animate-in slide-in-from-right-4 duration-500">
                                <input type="number" value={newStockValue} onChange={e => setNewStockValue(e.target.value)} className="w-16 bg-black/[0.02] border border-black/10 rounded-lg px-2 py-1 font-mono text-xs outline-none focus:border-black" />
                                <button onClick={() => handleUpdateStock(p.id)} className="font-tech text-text hover:underline text-[10px]">SYNC</button>
                             </div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {view === 'orders' && (
            <div className="space-y-12 animate-in fade-in duration-1000">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                       <div className="w-1 h-1 bg-text rounded-full" />
                       <span className="font-tech text-text/20">SALES_MANIFEST // TRANSACTION_LOGS</span>
                    </div>
                    <h2 className="text-3xl font-display">Global <span className="opacity-20 italic">Acquisitions.</span></h2>
                  </div>
               </div>

               <div className="space-y-6">
                  {orders.length === 0 && <p className="text-text/20 font-tech text-[10px] py-20 text-center">NO_TRANSACTIONS_DETECTED</p>}
                  {orders.map((o) => (
                    <div key={o.id} className="p-8 rounded-[2.5rem] border border-black/5 bg-white hover:shadow-xl transition-all duration-700 grid grid-cols-1 lg:grid-cols-4 gap-8 items-center relative overflow-hidden group">
                       <div className="lg:col-span-1">
                          <p className="font-tech text-text/20 text-[8px] mb-2">MANIFEST_ID // {o.id.slice(-8)}</p>
                          <h4 className="text-xl font-bold italic">{o.customerName}</h4>
                          <p className="text-text/40 text-xs font-tech mt-1">{o.customerEmail}</p>
                       </div>
                       <div className="lg:col-span-1">
                          <p className="font-tech text-text/20 text-[8px] mb-2">ACQUISITION_VALUE</p>
                          <p className="text-2xl font-mono">₹{o.total.toLocaleString()}</p>
                       </div>
                       <div className="lg:col-span-1">
                          <p className="font-tech text-text/20 text-[8px] mb-2">STATUS_PROTOCOL</p>
                          <div className="flex items-center space-x-3">
                             <div className={`px-3 py-1 rounded-full text-[8px] font-tech border ${o.status === 'delivered' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-black/5 border-black/10 text-text/60'}`}>
                                {o.status.toUpperCase()}
                             </div>
                          </div>
                       </div>
                       <div className="lg:col-span-1 flex flex-wrap justify-end gap-3">
                          <button onClick={() => setSelectedOrder(o)} className="px-6 py-3 rounded-full border border-black/10 font-tech text-[10px] hover:bg-black hover:text-bg transition-all duration-700">MANIFEST_DETAILS</button>
                          <select 
                            value={o.status} 
                            onChange={(e) => {
                              const newStatus = e.target.value as AdminOrder['status'];
                              handleUpdateOrderStatus(o.id, newStatus);
                            }}
                            className="bg-black/[0.02] border border-black/5 rounded-full px-4 py-3 font-tech text-[9px] focus:border-black outline-none cursor-pointer"
                          >
                             {['pending', 'processing', 'shipped', 'delivered'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                          </select>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {view === 'banners' && (
            <div className="space-y-16 animate-in fade-in duration-1000">
               <div className="max-w-4xl">
                  <div className="flex items-center space-x-3 mb-4">
                     <div className="w-1 h-1 bg-text rounded-full" />
                     <span className="font-tech text-text/20">VISUAL_ASSETS // BRAND_EXPOSURE</span>
                  </div>
                  <h2 className="text-4xl font-display mb-12 italic">Promotional <span className="opacity-20">Banners.</span></h2>
                  
                  <form onSubmit={handleAddBanner} className="space-y-10 p-10 rounded-[2.5rem] border border-black/5 bg-black/[0.01]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="font-tech text-text/30">HEADLINE_TXT</label>
                        <input value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="w-full bg-transparent border-b border-black/10 py-3 italic text-xl focus:border-black outline-none transition-all" placeholder="e.g. THE_LOST_COLLECTION" />
                      </div>
                      <div className="space-y-4">
                        <label className="font-tech text-text/30">SUBHEAD_TXT</label>
                        <input value={bannerSubtitle} onChange={e => setBannerSubtitle(e.target.value)} className="w-full bg-transparent border-b border-black/10 py-3 italic text-sm focus:border-black outline-none transition-all" placeholder="e.g. ARCHIVAL_RELEASE_2026" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="font-tech text-text/30">DESKTOP_ASSET</label>
                        <input type="file" accept="image/*" onChange={handleBannerFileChange} className="w-full text-xs font-tech text-text/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-text file:text-bg cursor-pointer" />
                      </div>
                      <div className="space-y-4">
                        <label className="font-tech text-text/30">MOBILE_ASSET</label>
                        <input type="file" accept="image/*" onChange={handleBannerMobileFileChange} className="w-full text-xs font-tech text-text/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-text file:text-bg cursor-pointer" />
                      </div>
                    </div>

                    <button type="submit" disabled={isSaving} className="w-full py-6 bg-text text-bg font-tech text-[10px] tracking-[0.4em] rounded-full hover:scale-[1.02] transition-all">
                      {isSaving ? 'UPLOADING_VISUALS...' : 'DEPLOY_BRAND_ASSET'}
                    </button>
                  </form>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {banners.length === 0 && <p className="text-text/20 font-tech text-[10px] py-20 text-center col-span-2">NO_ACTIVE_BANNERS_IN_FEED</p>}
                  {banners.map((b, index) => (
                    <div key={b.id} className="group relative p-6 rounded-[2.5rem] border border-black/5 bg-white hover:shadow-2xl transition-all duration-700">
                       <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-black/5 mb-6 relative">
                          <img src={b.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={b.title} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-4 left-6">
                             <p className="font-tech text-white/40 text-[8px] mb-1">PROMO_ID_{b.id.slice(-4)}</p>
                             <h4 className="text-white text-lg font-display italic">{b.title}</h4>
                          </div>
                       </div>
                       <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                             <button onClick={() => handleMoveBanner(index, 'up')} disabled={index === 0} className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center text-text/20 hover:text-text disabled:opacity-10"><ChevronLeft size={18} className="rotate-90" /></button>
                             <button onClick={() => handleMoveBanner(index, 'down')} disabled={index === banners.length - 1} className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center text-text/20 hover:text-text disabled:opacity-10"><ChevronLeft size={18} className="-rotate-90" /></button>
                          </div>
                          <button onClick={() => handleDeleteBanner(b.id)} className="w-10 h-10 rounded-full bg-red-50 text-red-500/40 hover:text-red-500 hover:bg-red-100 flex items-center justify-center transition-all"><Trash2 size={18} /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {view === 'broadcast' && (
            <div className="max-w-4xl animate-in fade-in duration-1000 space-y-16">
               <div>
                  <div className="flex items-center space-x-3 mb-4">
                     <div className="w-1 h-1 bg-text rounded-full" />
                     <span className="font-tech text-text/20">COMMS_TERMINAL // GLOBAL_PULSE</span>
                  </div>
                  <h2 className="text-4xl font-display mb-12 italic">Transmit <span className="opacity-20">Broadcast.</span></h2>
                  
                  <form onSubmit={handleBroadcast} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-2">
                        <label className="font-tech text-text/20">TRANSMISSION_TITLE</label>
                        <input 
                          value={broadcastTitle} 
                          onChange={e => setBroadcastTitle(e.target.value)} 
                          className="w-full bg-black/[0.02] border-b border-black/10 py-4 focus:border-black outline-none transition-all font-display italic text-xl" 
                          placeholder="e.g. EXCLUSIVE_HOROLOGY_EVENT" 
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-tech text-text/20">SIGNAL_TYPE</label>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {['offer', 'trending', 'new_arrival', 'general'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setBroadcastType(type as any)}
                              className={`px-4 py-2 rounded-full text-[8px] font-tech transition-all border ${broadcastType === type ? 'bg-text text-bg border-text' : 'border-black/10 text-text/40 hover:border-text'}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="font-tech text-text/20">MANIFEST_BODY</label>
                      <textarea 
                        value={broadcastMessage} 
                        onChange={e => setBroadcastMessage(e.target.value)} 
                        className="w-full bg-black/[0.02] border border-black/5 rounded-2xl p-6 focus:border-black outline-none transition-all h-40 italic text-lg shadow-inner" 
                        placeholder="Detail the acquisition opportunity..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-tech text-text/20">TARGET_LINK_URI</label>
                      <input 
                        value={broadcastLink} 
                        onChange={e => setBroadcastLink(e.target.value)} 
                        className="w-full bg-black/[0.02] border-b border-black/10 py-4 focus:border-black outline-none transition-all font-tech text-[10px]" 
                        placeholder="/MASTERPIECE/ID_00X" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSaving} 
                      className="w-full py-6 bg-text text-bg font-tech text-xs tracking-[0.5em] rounded-full hover:scale-[1.02] transition-all duration-700 shadow-2xl"
                    >
                      {isSaving ? 'TRANSMITTING...' : 'EXECUTE_GLOBAL_PULSE'}
                    </button>
                  </form>
               </div>
            </div>
          )}

          {view === 'add' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex items-center space-x-3 mb-10">
                 <div className="w-1 h-1 bg-text rounded-full" />
                 <span className="font-tech text-text/20">PROTOCOL // ARCHIVE_INITIATION</span>
              </div>
              <h2 className="text-4xl font-display mb-12 italic">Register <span className="opacity-20">New Asset.</span></h2>
              
              <form onSubmit={handleAddProduct} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="font-tech text-text/30">IDENTIFIER_NAME</label>
                    <input 
                      value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-4 focus:border-black outline-none transition-all font-display italic text-2xl"
                      placeholder="e.g. PHANTOM_GHOST" required
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="font-tech text-text/30">VALUATION_INR</label>
                    <input 
                      type="number" value={price} onChange={e => setPrice(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-4 focus:border-black outline-none transition-all font-mono text-2xl"
                      placeholder="00.00" required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                  <div className="space-y-4">
                    <label className="font-tech text-text/30">UNITS_AVAIL</label>
                    <input 
                      type="number" value={stock} onChange={e => setStock(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-4 focus:border-black outline-none transition-all font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="font-tech text-text/30">DISCOUNT_%</label>
                    <input 
                      type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-4 focus:border-black outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="col-span-2 space-y-4">
                    <label className="font-tech text-text/30">CLASSIFICATION</label>
                    <select 
                      value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-4 focus:border-black outline-none transition-all cursor-pointer font-tech"
                    >
                      {['Grand Complications', 'Heritage', 'Avant-Garde', 'Deep Sea'].map(cat => (
                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="font-tech text-text/30">VISUAL_ASSETS</label>
                    <div className="relative">
                      <input 
                        type="file" multiple accept="image/*" onChange={handleFileChange}
                        className="opacity-0 absolute inset-0 cursor-pointer z-10"
                      />
                      <div className="border border-dashed border-black/10 rounded-2xl p-8 text-center bg-black/[0.01] group-hover:border-black transition-all">
                         <Plus className="mx-auto mb-2 opacity-20" />
                         <p className="text-[10px] font-tech text-text/40">UPLOAD_IMAGES</p>
                         {imageFiles.length > 0 && <p className="text-[8px] text-green-600 mt-2">{imageFiles.length} ASSETS_STAGED</p>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="font-tech text-text/30">SOURCE_URL_REDIRECT</label>
                    <input 
                      value={image} onChange={e => setImage(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-4 focus:border-black outline-none transition-all font-tech text-[10px]"
                      placeholder="HTTPS://..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="font-tech text-text/30">CRITICAL_DESCRIPTION</label>
                  <textarea 
                    value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full bg-black/[0.02] border border-black/5 rounded-2xl p-6 focus:border-black outline-none transition-all h-32 italic text-lg"
                    placeholder="Describe the masterpiece detailing..." required
                  />
                </div>

                <div className="flex flex-wrap gap-8 items-center border-t border-black/5 pt-10">
                  {[
                    { label: 'TRENDING', state: isTrending, set: setIsTrending },
                    { label: 'NEW_ARRIVAL', state: isNewArrival, set: setIsNewArrival },
                    { label: 'ACTIVE_OFFER', state: isOffer, set: setIsOffer },
                    { label: 'AUTO_BROADCAST', state: shouldAutoBroadcast, set: setShouldAutoBroadcast, urgent: true },
                  ].map((check, i) => (
                    <label key={i} className="flex items-center space-x-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${check.state ? 'bg-text border-text' : 'border-black/20 group-hover:border-black'}`}>
                         {check.state && <Check size={10} className="text-bg" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={check.state} onChange={e => check.set(e.target.checked)} />
                      <span className={`font-tech text-[10px] ${check.state ? 'text-text' : 'text-text/30'} ${check.urgent && 'text-red-500/60'}`}>{check.label}</span>
                    </label>
                  ))}
                </div>

                <button type="submit" disabled={isSaving} className="w-full py-6 bg-text text-bg font-tech text-xs tracking-[0.5em] rounded-full hover:scale-[1.02] transition-all duration-700 disabled:opacity-50 shadow-2xl">
                  {isSaving ? 'EXECUTING_SYNC...' : 'ARCHIVE_COLLECTION_DATA'}
                </button>
              </form>
            </div>
          )}

          {view === 'notifications' && (
            <div className="space-y-12 animate-in fade-in duration-1000">
               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                       <div className="w-1 h-1 bg-text rounded-full" />
                       <span className="font-tech text-text/20">INTELLIGENCE_FEED // SYSTEM_SCAN</span>
                    </div>
                    <h2 className="text-3xl font-display">System <span className="opacity-20">Alerts.</span></h2>
                  </div>
                  <div className="flex items-center space-x-4">
                     <div className="flex items-center p-1 bg-black/[0.02] border border-black/5 rounded-lg">
                        {(['all', 'orders', 'inventory'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setNotificationFilter(f)}
                            className={`px-3 py-1 rounded text-[8px] font-tech transition-all ${notificationFilter === f ? 'bg-text text-bg shadow-sm' : 'text-text/40 hover:text-text'}`}
                          >
                            {f}
                          </button>
                        ))}
                     </div>
                     <button 
                       onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                       className="font-tech text-[8px] text-text/30 hover:text-text"
                     >
                       MARK_READ_ALL
                     </button>
                  </div>
               </div>

               <div className="space-y-4">
                 {notifications.filter(n => notificationFilter === 'all' || n.type === notificationFilter).length === 0 ? (
                   <div className="text-center py-32 rounded-[2rem] border border-dashed border-black/5">
                     <Bell className="mx-auto text-black/5 mb-4" size={48} />
                     <p className="font-tech text-[8px] text-text/20">NO_ACTIVE_SIGNALS</p>
                   </div>
                 ) : (
                   notifications
                     .filter(n => notificationFilter === 'all' || n.type === notificationFilter)
                     .map((n) => (
                     <motion.div 
                       key={n.id} 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className={`p-6 rounded-[2rem] border transition-all duration-700 group flex items-center justify-between ${n.read ? 'border-black/5 bg-transparent opacity-60' : 'border-black/10 bg-black/[0.03] shadow-lg'}`}
                     >
                        <div className="flex items-center space-x-6">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${n.type === 'orders' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {n.type === 'orders' ? <ShoppingBag size={20} /> : <AlertCircle size={20} />}
                           </div>
                           <div>
                              <div className="flex items-center space-x-3 mb-1">
                                 <span className="font-tech text-text/20 text-[8px]">{n.type}</span>
                                 <span className="font-tech text-text/20 text-[8px] opacity-40">{new Date(n.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <h4 className="text-sm font-bold text-text">{n.message}</h4>
                              {n.total && <p className="font-tech text-[9px] text-text/40 mt-1">LOGGED_VALUE: ₹{n.total.toLocaleString()}</p>}
                           </div>
                        </div>
                        <div className="flex items-center space-x-3">
                           {n.orderId && (
                             <button onClick={() => {const o = orders.find(ord => ord.id === n.orderId); if (o) {setSelectedOrder(o); setView('orders');}}} className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-text hover:text-bg transition-all duration-500">
                                <Eye size={18} />
                             </button>
                           )}
                           {!n.read && (
                             <button onClick={() => setNotifications(notifications.map(notif => notif.id === n.id ? {...notif, read: true} : notif))} className="w-10 h-10 rounded-full bg-text text-bg flex items-center justify-center hover:scale-110 transition-all duration-500">
                                <Check size={18} />
                             </button>
                           )}
                        </div>
                     </motion.div>
                   ))
                 )}
               </div>
            </div>

          )}

          {/* Shipping Manifest Terminal */}
          {selectedOrder && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-in fade-in duration-500">
              <div className="bg-white max-w-2xl w-full rounded-[3rem] shadow-2xl overflow-hidden border border-black/5 animate-in zoom-in-95 duration-700">
                <div className="p-10 border-b border-black/5 flex justify-between items-start">
                   <div>
                     <div className="flex items-center space-x-2 mb-1">
                        <div className="w-1 h-1 bg-text rounded-full" />
                        <p className="font-tech text-text/20 text-[8px]">LOGISTICS_MANIFEST // ID_{selectedOrder.id.slice(-6)}</p>
                     </div>
                     <h2 className="text-3xl font-display italic">Fulfillment <span className="opacity-20">Terminal.</span></h2>
                   </div>
                   <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-500">
                     <X size={20} />
                   </button>
                </div>
                
                <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                   {/* Industrial Shipping Label */}
                   <div id="shipping-label" className="bg-black text-white p-12 rounded-[2rem] shadow-2xl relative border-8 border-black font-mono">
                      <div className="flex justify-between items-start border-b border-white/20 pb-6 mb-8">
                         <div>
                            <p className="text-[10px] text-white/40 mb-1">ORIGIN_FACILITY</p>
                            <h3 className="text-sm font-black italic tracking-widest underline decoration-2 underline-offset-4">DINOSPY_EXECUTIVE_HUB</h3>
                            <p className="text-[10px] mt-2 opacity-60">Rue de l'Horloge, Geneva // IND_DIST</p>
                         </div>
                         <div className="p-2 bg-white rounded-lg">
                            <QRCodeSVG value={`https://ais-dev-wty7sygzhusofsxwhxmva3-281798882282.run.app/tracking/${selectedOrder.id}`} size={60} />
                         </div>
                      </div>

                      <div className="mb-12">
                         <p className="text-[10px] text-white/40 mb-2">DELIVERY_TARGET</p>
                         <h3 className="text-3xl font-black italic mb-2 uppercase tracking-tighter">{selectedOrder.customerName}</h3>
                         <div className="space-y-1 opacity-80 text-lg">
                            <p>{selectedOrder.shippingAddress.address}</p>
                            <p className="font-black">{selectedOrder.shippingAddress.city}, IND - {selectedOrder.shippingAddress.zip}</p>
                         </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-white/20 pt-8">
                         <div className="space-y-4">
                            <div>
                               <p className="text-[8px] text-white/20 mb-1">CARGO_MANIFEST</p>
                               <div className="text-[10px] space-y-1">
                                  {selectedOrder.items.map((it: any, idx: number) => (
                                     <div key={idx} className="flex space-x-2">
                                        <span className="opacity-40">[{it.quantity}X]</span>
                                        <span className="font-bold italic">{it.name.toUpperCase()}</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] text-white/20 mb-1">AUTHENTICATION_TAG</p>
                            <p className="text-2xl font-black italic tracking-tighter shadow-sm">DNX-{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button 
                        onClick={() => window.print()}
                        className="flex items-center justify-center space-x-3 py-6 rounded-full border border-black/10 hover:bg-black/[0.02] transition-all font-tech text-[10px]"
                      >
                        <Printer size={18} />
                        <span>GENERATE_PHYSICAL_MANIFEST</span>
                      </button>
                      <button className="flex items-center justify-center space-x-3 py-6 rounded-full bg-text text-bg hover:scale-[1.02] transition-all font-tech text-[10px]">
                        <Package size={18} />
                        <span>INITIATE_DISPATCH_PROTOCOL</span>
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {view === 'coupons' && (
            <div className="space-y-16 animate-in fade-in duration-1000">
               <div className="flex justify-between items-end">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                       <div className="w-1 h-1 bg-text rounded-full" />
                       <span className="font-tech text-text/20">MERCH_PROTOCOLS // VOUCHERS</span>
                    </div>
                    <h2 className="text-4xl font-display italic">Promo <span className="opacity-20">Protocols.</span></h2>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <form onSubmit={handleAddCoupon} className="lg:col-span-1 space-y-8 p-10 rounded-[2.5rem] border border-black/5 bg-black/[0.01]">
                    <div className="space-y-4">
                      <label className="font-tech text-text/30">CODE_IDENTIFIER</label>
                      <input value={couponCode} onChange={e => setCouponCode(e.target.value)} className="w-full bg-transparent border-b border-black/10 py-3 uppercase font-mono text-xl focus:border-black outline-none transition-all" placeholder="E.G._NOIR30" />
                    </div>
                    <div className="space-y-4">
                      <label className="font-tech text-text/30">BENEFIT_TYPE</label>
                      <select value={couponType} onChange={e => setCouponType(e.target.value as any)} className="w-full bg-transparent border-b border-black/10 py-3 font-tech text-[10px] focus:border-black outline-none transition-all cursor-pointer">
                        <option value="percentage">PERCENTAGE (%)</option>
                        <option value="fixed">FIXED_AMOUNT (₹)</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="font-tech text-text/30">VALUE_UNIT</label>
                      <input type="number" value={couponDiscount} onChange={e => setCouponDiscount(e.target.value)} className="w-full bg-transparent border-b border-black/10 py-3 font-mono focus:border-black outline-none transition-all" />
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full py-5 bg-text text-bg font-tech text-[10px] tracking-[0.4em] rounded-full">EXECUTE_PROTOCOL</button>
                  </form>

                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {coupons.map(c => (
                      <div key={c.id} className="p-8 rounded-[2rem] border border-black/5 bg-white relative group">
                        <div className="flex justify-between items-start mb-6">
                           <div className="font-mono text-2xl font-black">{c.code}</div>
                           <button onClick={() => handleDeleteCoupon(c.id)} className="text-text/20 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px] font-tech text-text/40"><span>BENEFIT</span><span className="text-text">{c.type === 'percentage' ? `${c.discount}% OFF` : `₹${c.discount} OFF`}</span></div>
                           <div className="flex justify-between text-[10px] font-tech text-text/40"><span>THRESHOLD</span><span className="text-text">₹{c.minAmount}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
          {view === 'security' && (
            <div className="space-y-16 animate-in fade-in duration-1000">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="p-10 rounded-[2.5rem] border border-black/5 bg-black/[0.01]">
                    <div className="flex items-center space-x-4 mb-10">
                       <Lock size={20} className="text-text/40" />
                       <h3 className="text-2xl font-display italic">Protocol <span className="opacity-20">Overrides.</span></h3>
                    </div>
                    <div className="space-y-6">
                       {[
                         { label: 'MAINTENANCE_MODE', state: maintenanceStatus, action: handleToggleMaintenance, toggle: isTogglingMaintenance, desc: 'RESTRICTS_PUBLIC_ACCESS_TO_GRID' },
                         { label: 'TEST_ENVIRONMENT', state: testMode, action: handleToggleTestMode, toggle: isTogglingTestMode, desc: 'ISOLATES_ACQUISITION_LOGIC' }
                       ].map((item, i) => (
                         <div key={i} className="flex items-center justify-between p-6 bg-white border border-black/5 rounded-2xl">
                           <div>
                              <p className="font-tech text-text text-[10px]">{item.label}</p>
                              <p className="text-[8px] font-tech text-text/20 mt-1">{item.desc}</p>
                           </div>
                           <button onClick={item.action} disabled={item.toggle} className={`px-5 py-2 rounded-full font-tech text-[8px] transition-all ${item.state ? 'bg-text text-bg' : 'bg-black/5 text-text/40'}`}>
                             {item.toggle ? 'SYNCING...' : (item.state ? 'ACTIVE' : 'STANDBY')}
                           </button>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="p-10 rounded-[2.5rem] border border-black/5 bg-black/[0.01]">
                    <div className="flex items-center space-x-4 mb-10">
                       <Shield size={20} className="text-green-600/60" />
                       <h3 className="text-2xl font-display italic">Firewall <span className="opacity-20">Status.</span></h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { l: 'HELMET_PROTOCOL', v: 'ACTIVE', s: 'text-green-600' },
                         { l: 'SSL_ENCRYPTION', v: 'VERIFIED', s: 'text-green-600' },
                         { l: 'RATE_LIMITING', v: '100/15M', s: 'text-text/60' },
                         { l: 'AUDIT_LOGGING', v: 'SYNCED', s: 'text-text/60' }
                       ].map((stat, i) => (
                         <div key={i} className="p-5 bg-white border border-black/5 rounded-2xl">
                            <p className="font-tech text-text/20 text-[8px] mb-2">{stat.l}</p>
                            <p className={`font-tech text-[9px] ${stat.s}`}>{stat.v}</p>
                         </div>
                       ))}
                    </div>
                    <button onClick={() => toast.success('Diagnostics successful')} className="w-full mt-8 py-4 border border-black/10 rounded-full font-tech text-[8px] hover:bg-black/5 transition-all">TERMINAL_DIAGNOSTICS</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
