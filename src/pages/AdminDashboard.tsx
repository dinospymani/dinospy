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
      <main className="flex-grow pt-24 md:pt-32 pb-10 md:pb-20 max-w-[98%] md:max-w-[95%] mx-auto px-4 w-full bg-bg">
        <div className="mb-4 md:mb-6">
          <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 text-text/40 hover:text-text transition-all duration-500 p-2 -ml-2"
          >
              <ArrowLeft size={16} />
              <span className="font-tech text-xs">EXIT_TERMINAL</span>
          </button>
        </div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12 border-b border-black/5 pb-12">
          <div className="max-w-2xl">
            <div className="flex items-center space-x-3 md:space-x-4 mb-4">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-text rounded-full animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
              <span className="font-tech text-text/20 text-[10px] md:text-xs">ROOT@DINOSPY: ~ // ADMIN_AUTHORIZATION_ACTIVE</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-display italic tracking-tightest mb-4">Command <span className="opacity-20">Locus.</span></h1>
            <div className="flex flex-wrap gap-3 font-tech text-[8px] opacity-30">
              <span>LAT: 28.6139° N</span>
              <span>•</span>
              <span>LONG: 77.2090° E</span>
              <span>•</span>
              <span>NODE: APAC-S1</span>
              <span>•</span>
              <span>UPTIME: 99.99%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:flex items-center gap-2 p-2 bg-black/[0.02] rounded-3xl border border-black/5 w-full lg:w-fit overflow-hidden">
            {[
              { id: 'stats', label: 'METRICS', icon: BarChart2 },
              { id: 'orders', label: 'LOGISTICS', icon: Truck },
              { id: 'products', label: 'INVENTORY', icon: Package },
              { id: 'add', label: 'ARCHIVE', icon: Plus },
              { id: 'notifications', label: 'FEED', icon: Bell, urgent: notifications.some(n => !n.read) },
              { id: 'broadcast', label: 'SIGNAL', icon: Megaphone },
              { id: 'banners', label: 'VISUALS', icon: Eye },
              { id: 'coupons', label: 'PROTOCOLS', icon: Zap },
              { id: 'security', label: 'SECURE', icon: Shield },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`flex flex-col items-center justify-center px-4 py-3 rounded-2xl transition-all duration-700 relative group min-w-[70px] ${view === tab.id ? 'bg-text text-bg shadow-2xl scale-105' : 'text-text/30 hover:text-text hover:bg-black/5'}`}
              >
                <tab.icon size={14} className={`mb-1.5 transition-transform duration-700 ${view === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[7px] font-tech tracking-normal">{tab.label}</span>
                {tab.id === 'notifications' && tab.urgent && (
                  <span className="absolute top-2 right-2 w-1 h-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,1)]" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="min-h-[60vh] relative">
          {view === 'stats' && (
            <div className="space-y-12 animate-in fade-in duration-1000">
               {/* High Density Stats */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { label: 'NET_ACQUISITIONS_VAL', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, trend: '+12.4%', detail: 'LAST_24H_CYCLE' },
                   { label: 'ACTIVE_MANIFESTS', value: stats.ordersCount, icon: ShoppingBag, trend: '+3', detail: 'PROCESSING_PENDING' },
                   { label: 'CONVERSION_EFFICIENCY', value: `${stats.conversionRate}%`, icon: TrendingUp, trend: 'OPTIMIZED', detail: 'ALGORITHMIC_TARGET: 4.0%' },
                   { label: 'INVENTORY_HEALTH', value: `${products.length - stats.lowStock}/${products.length}`, icon: Database, alert: stats.lowStock > 0, detail: `${stats.lowStock} CRITICAL_ASSETS` },
                 ].map((stat, i) => (
                   <div key={i} className={`p-8 rounded-[2rem] border border-black/5 flex flex-col justify-between h-56 transition-all duration-700 hover:shadow-2xl hover:border-black/20 group relative overflow-hidden bg-white`}>
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <stat.icon size={80} />
                     </div>
                     <div className="relative z-10 flex justify-between items-start">
                       <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all duration-700 shadow-lg">
                         <stat.icon size={20} />
                       </div>
                       <div className="text-right">
                          <p className={`font-tech text-[10px] ${stat.alert ? 'text-red-500 animate-pulse' : 'text-green-600'}`}>{stat.trend || (stat.alert ? 'CRITICAL' : 'STABLE')}</p>
                          <p className="font-tech text-text/10 text-[7px] mt-1">STATUS_VERIFIED</p>
                       </div>
                     </div>
                     <div className="relative z-10">
                       <p className="font-tech text-text/30 mb-2 text-[9px] tracking-widest">{stat.label}</p>
                       <h3 className="text-4xl font-display italic tracking-tightest mb-2">{stat.value}</h3>
                       <p className="font-tech text-text/20 text-[7px] border-t border-black/5 pt-3">{stat.detail}</p>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Chart */}
                  <div className="lg:col-span-2 p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm overflow-hidden group">
                    <div className="flex justify-between items-center mb-12">
                       <div>
                          <div className="flex items-center space-x-3 mb-3">
                             <div className="w-1.5 h-1.5 bg-black rounded-full shadow-[0_0_5px_rgba(0,0,0,0.3)]" />
                             <span className="font-tech text-text/30 text-[10px]">REALTIME_DATA // REVENUE_STREAM</span>
                          </div>
                          <h3 className="text-3xl font-display italic">Growth <span className="opacity-20">Analytics.</span></h3>
                       </div>
                       <div className="flex items-center space-x-2">
                          <div className="px-4 py-2 bg-black/[0.02] border border-black/5 rounded-xl text-[10px] font-tech text-text/40">7_DAY_CYCLE</div>
                       </div>
                    </div>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#000000" stopOpacity={0.08}/>
                              <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#00000005" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#00000010" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            tick={{ dy: 10, fontStyle: 'italic' }}
                          />
                          <YAxis 
                            stroke="#00000010" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                          />
                          <Tooltip 
                            cursor={{ stroke: '#000', strokeWidth: 0.5, strokeDasharray: '4 4' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-black text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl">
                                    <p className="font-tech text-[8px] text-white/40 mb-1">{payload[0].payload.name.toUpperCase()}</p>
                                    <p className="font-display text-lg italic">₹{payload[0].value?.toLocaleString()}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="sales" 
                            stroke="#000000" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorSales)" 
                            animationDuration={2000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Terminal Log / Activity */}
                  <div className="p-8 rounded-[2.5rem] border border-black/5 bg-black text-white shadow-2xl flex flex-col h-[500px] lg:h-auto">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                         <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                         <span className="font-tech text-white/40 text-[10px]">LIVE_ACTIVITY_LOG</span>
                      </div>
                      <span className="font-tech text-white/20 text-[8px]">BUFFER_SYNCED</span>
                    </div>
                    <div className="flex-grow space-y-4 overflow-y-auto no-scrollbar font-mono text-[9px] text-white/50">
                       {notifications.slice(0, 15).map((n, i) => (
                         <div key={i} className="flex space-x-4 group border-l border-white/5 pl-4 hover:border-white/20 transition-colors">
                           <span className="text-white/20 whitespace-nowrap">{new Date(n.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                           <span className={n.type === 'orders' ? 'text-green-400' : 'text-red-400'}>
                             {`[${n.type.toUpperCase()}]`}
                           </span>
                           <span className="group-hover:text-white transition-colors">{n.message}</span>
                         </div>
                       ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <button 
                        onClick={() => setView('notifications')}
                        className="w-full py-4 border border-white/10 rounded-2xl font-tech text-[8px] hover:bg-white hover:text-black transition-all duration-700"
                      >
                         ANALYZE_FULL_LOGS
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'products' && (
            <div className="space-y-12 animate-in fade-in duration-1000">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                       <div className="w-1.5 h-1.5 bg-black rounded-full" />
                       <span className="font-tech text-text/20 text-[10px]">ASSET_REGISTER // CURATION_SYSTEM</span>
                    </div>
                    <h2 className="text-4xl font-display italic tracking-tightest">Collection <span className="opacity-20">Manifest.</span></h2>
                  </div>
                  <button onClick={handleSeed} className="px-6 py-3 border border-black/5 rounded-full font-tech text-[10px] text-text/30 hover:bg-black hover:text-white transition-all duration-700">GENERATE_SAMPLE_DATA</button>
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                  {products.map((p) => (
                    <div key={p.id} className="group p-6 rounded-[2.5rem] border border-black/5 bg-white hover:shadow-2xl transition-all duration-700 flex flex-col h-full relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                          <span className="font-tech text-[40px]">{p.id.slice(0, 2).toUpperCase()}</span>
                       </div>
                       
                       <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-black/5 mb-6 relative group">
                          <img src={p.images?.[0] || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 grayscale" alt={p.name} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-center justify-center backdrop-blur-sm">
                             <div className="text-center p-4">
                               <p className="font-tech text-[8px] text-white/60 mb-2">ROI_ESTIMATE</p>
                               <p className="text-white text-xl font-display italic">STABLE_VALUE</p>
                             </div>
                          </div>
                          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[7px] font-tech border backdrop-blur-md ${p.stock < 5 ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-green-500/10 border-green-500/20 text-green-600'}`}>
                            {p.stock < 5 ? 'CRITICAL_STOCK' : 'OPTIMAL_LEVEL'}
                          </div>
                       </div>

                       <div className="space-y-2 mb-8 flex-grow">
                          <div className="flex items-center space-x-2">
                             <span className="font-tech text-text/20 text-[8px]">{p.category.toUpperCase()}</span>
                             <span className="w-1 h-1 bg-black/10 rounded-full" />
                             <span className="font-tech text-text/20 text-[8px]">INV_0{p.stock}</span>
                          </div>
                          <h4 className="text-xl font-display italic tracking-tight">{p.name}</h4>
                          <div className="flex items-end justify-between">
                             <p className="font-mono text-2xl tracking-tighter">₹{p.price.toLocaleString()}</p>
                             <div className="text-right">
                                <p className="font-tech text-[7px] text-black/20">VALUATION</p>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-6 border-t border-black/5 mt-auto">
                          <div className="flex space-x-2">
                             <button onClick={() => {setEditingStockId(p.id); setNewStockValue(p.stock.toString());}} className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-700">
                                <Edit size={16} />
                             </button>
                             <button onClick={() => handleDelete(p.id)} className="w-12 h-12 rounded-full bg-red-50 text-red-500/40 hover:text-red-500 hover:bg-red-100 flex items-center justify-center transition-all duration-700">
                                <Trash2 size={16} />
                             </button>
                          </div>
                          {editingStockId === p.id ? (
                             <div className="flex items-center space-x-2 animate-in slide-in-from-right-4">
                                <input 
                                  type="number" value={newStockValue} onChange={e => setNewStockValue(e.target.value)} 
                                  className="w-16 bg-black/[0.02] border border-black/10 rounded-xl px-3 py-2 font-mono text-xs outline-none focus:border-black" 
                                />
                                <button onClick={() => handleUpdateStock(p.id)} className="font-tech text-text hover:underline text-[9px]">COMMIT</button>
                             </div>
                          ) : (
                             <div className="text-right">
                                <p className="font-tech text-[8px] text-black/30">LST_MOD: {new Date().toLocaleDateString()}</p>
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

               <div className="overflow-x-auto no-scrollbar">
                 <table className="w-full border-collapse">
                   <thead>
                     <tr className="border-b border-black/5">
                       <th className="font-tech text-[9px] text-text/30 text-left pb-6 pl-4">IDENT_HEX</th>
                       <th className="font-tech text-[9px] text-text/30 text-left pb-6">CLIENT_ENTITY</th>
                       <th className="font-tech text-[9px] text-text/30 text-left pb-6">VALUATION</th>
                       <th className="font-tech text-[9px] text-text/30 text-left pb-6">STATUS_CODE</th>
                       <th className="font-tech text-[9px] text-text/30 text-right pb-6 pr-4">ACTIONS</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-black/5">
                     {orders.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="py-32 text-center text-text/20 font-tech text-[10px]">
                            NO_ACQUISITIONS_PENDING
                         </td>
                       </tr>
                     ) : (
                       orders.map((o) => (
                         <tr key={o.id} className="group hover:bg-black/[0.01] transition-all">
                           <td className="py-8 pl-4">
                              <p className="font-mono text-[10px] text-black/40">#{o.id.slice(-8).toUpperCase()}</p>
                              <p className="font-tech text-[7px] text-black/10 mt-1">{new Date(o.createdAt).toLocaleDateString()}</p>
                           </td>
                           <td className="py-8">
                              <p className="font-display italic text-lg leading-none">{o.customerName}</p>
                              <p className="font-tech text-[8px] text-black/20 mt-1">{o.customerEmail || 'GUEST_USER'}</p>
                           </td>
                           <td className="py-8">
                              <p className="font-mono text-xl tracking-tighter">₹{o.total.toLocaleString()}</p>
                           </td>
                           <td className="py-8">
                              <div className={`inline-flex items-center space-x-2`}>
                                 <div className={`px-4 py-1.5 rounded-full text-[9px] font-tech border ${o.status === 'delivered' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-black/5 border-black/10 text-black/40'}`}>
                                    {o.status.toUpperCase()}
                                 </div>
                                 <select 
                                   value={o.status} 
                                   onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                                   className="bg-transparent font-tech text-[8px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none outline-none"
                                 >
                                    {['pending', 'processing', 'shipped', 'delivered'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                 </select>
                              </div>
                           </td>
                           <td className="py-8 pr-4 text-right">
                             <button 
                               onClick={() => setSelectedOrder(o)}
                               className="p-4 rounded-2xl border border-black/5 hover:bg-black hover:text-white transition-all duration-700"
                             >
                               <Eye size={16} />
                             </button>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
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
                  <h2 className="text-3xl md:text-4xl font-display mb-8 md:mb-12 italic">Promotional <span className="opacity-20">Banners.</span></h2>
                  
                  <form onSubmit={handleAddBanner} className="space-y-6 md:space-y-10 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-black/5 bg-black/[0.01]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                      <div className="space-y-3 md:space-y-4">
                        <label className="font-tech text-text/30 text-[10px]">HEADLINE_TXT</label>
                        <input value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="w-full bg-transparent border-b border-black/10 py-2 md:py-3 italic text-lg md:text-xl focus:border-black outline-none transition-all" placeholder="e.g. THE_LOST_COLLECTION" />
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        <label className="font-tech text-text/30 text-[10px]">SUBHEAD_TXT</label>
                        <input value={bannerSubtitle} onChange={e => setBannerSubtitle(e.target.value)} className="w-full bg-transparent border-b border-black/10 py-2 md:py-3 italic text-xs md:text-sm focus:border-black outline-none transition-all" placeholder="e.g. ARCHIVAL_RELEASE_2026" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                      <div className="space-y-3 md:space-y-4">
                        <label className="font-tech text-text/30 text-[10px]">DESKTOP_ASSET</label>
                        <input type="file" accept="image/*" onChange={handleBannerFileChange} className="w-full text-[10px] font-tech text-text/40 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-text file:text-bg cursor-pointer" />
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        <label className="font-tech text-text/30 text-[10px]">MOBILE_ASSET</label>
                        <input type="file" accept="image/*" onChange={handleBannerMobileFileChange} className="w-full text-[10px] font-tech text-text/40 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-text file:text-bg cursor-pointer" />
                      </div>
                    </div>

                    <button type="submit" disabled={isSaving} className="w-full py-4 md:py-6 bg-text text-bg font-tech text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.4em] rounded-full hover:scale-[1.02] transition-all">
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
              <div className="flex items-center space-x-3 mb-6 md:mb-10">
                 <div className="w-1 h-1 bg-text rounded-full" />
                 <span className="font-tech text-text/20 text-[10px] md:text-xs">PROTOCOL // ARCHIVE_INITIATION</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-display mb-8 md:mb-12 italic">Register <span className="opacity-20">New Asset.</span></h2>
              
              <form onSubmit={handleAddProduct} className="space-y-8 md:space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  <div className="space-y-3 md:space-y-4">
                    <label className="font-tech text-text/30 text-[10px]">IDENTIFIER_NAME</label>
                    <input 
                      value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-3 md:py-4 focus:border-black outline-none transition-all font-display italic text-xl md:text-2xl"
                      placeholder="e.g. PHANTOM_GHOST" required
                    />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <label className="font-tech text-text/30 text-[10px]">VALUATION_INR</label>
                    <input 
                      type="number" value={price} onChange={e => setPrice(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-3 md:py-4 focus:border-black outline-none transition-all font-mono text-xl md:text-2xl"
                      placeholder="00.00" required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
                  <div className="space-y-3 md:space-y-4">
                    <label className="font-tech text-text/30 text-[10px]">UNITS_AVAIL</label>
                    <input 
                      type="number" value={stock} onChange={e => setStock(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-3 md:py-4 focus:border-black outline-none transition-all font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <label className="font-tech text-text/30 text-[10px]">DISCOUNT_%</label>
                    <input 
                      type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-3 md:py-4 focus:border-black outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="col-span-2 space-y-3 md:space-y-4">
                    <label className="font-tech text-text/30 text-[10px]">CLASSIFICATION</label>
                    <select 
                      value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-3 md:py-4 focus:border-black outline-none transition-all cursor-pointer font-tech text-[10px] md:text-xs"
                    >
                      {['Grand Complications', 'Heritage', 'Avant-Garde', 'Deep Sea'].map(cat => (
                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  <div className="space-y-3 md:space-y-4">
                    <label className="font-tech text-text/30 text-[10px]">VISUAL_ASSETS</label>
                    <div className="relative">
                      <input 
                        type="file" multiple accept="image/*" onChange={handleFileChange}
                        className="opacity-0 absolute inset-0 cursor-pointer z-10"
                      />
                      <div className="border border-dashed border-black/10 rounded-2xl p-6 md:p-8 text-center bg-black/[0.01] group-hover:border-black transition-all">
                         <Plus className="mx-auto mb-2 opacity-20" size={16} />
                         <p className="text-[10px] font-tech text-text/40">UPLOAD_IMAGES</p>
                         {imageFiles.length > 0 && <p className="text-[8px] text-green-600 mt-2">{imageFiles.length} ASSETS_STAGED</p>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <label className="font-tech text-text/30 text-[10px]">SOURCE_URL_REDIRECT</label>
                    <input 
                      value={image} onChange={e => setImage(e.target.value)}
                      className="w-full bg-black/[0.02] border-b border-black/10 px-0 py-3 md:py-4 focus:border-black outline-none transition-all font-tech text-[10px]"
                      placeholder="HTTPS://..."
                    />
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <label className="font-tech text-text/30 text-[10px]">CRITICAL_DESCRIPTION</label>
                  <textarea 
                    value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full bg-black/[0.02] border border-black/5 rounded-2xl p-4 md:p-6 focus:border-black outline-none transition-all h-32 italic text-base md:text-lg"
                    placeholder="Describe the masterpiece detailing..." required
                  />
                </div>

                <div className="flex flex-wrap gap-4 md:gap-8 items-center border-t border-black/5 pt-6 md:pt-10">
                  {[
                    { label: 'TRENDING', state: isTrending, set: setIsTrending },
                    { label: 'NEW_ARRIVAL', state: isNewArrival, set: setIsNewArrival },
                    { label: 'ACTIVE_OFFER', state: isOffer, set: setIsOffer },
                    { label: 'AUTO_BROADCAST', state: shouldAutoBroadcast, set: setShouldAutoBroadcast, urgent: true },
                  ].map((check, i) => (
                    <label key={i} className="flex items-center space-x-3 cursor-pointer group">
                      <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded border flex items-center justify-center transition-all ${check.state ? 'bg-text border-text' : 'border-black/20 group-hover:border-black'}`}>
                         {check.state && <Check size={8} className="text-bg md:w-2.5" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={check.state} onChange={e => check.set(e.target.checked)} />
                      <span className={`font-tech text-[8px] md:text-[10px] ${check.state ? 'text-text' : 'text-text/30'} ${check.urgent && 'text-red-500/60'}`}>{check.label}</span>
                    </label>
                  ))}
                </div>

                <button type="submit" disabled={isSaving} className="w-full py-5 md:py-6 bg-text text-bg font-tech text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.5em] rounded-full hover:scale-[1.02] transition-all duration-700 disabled:opacity-50 shadow-2xl">
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
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-4 bg-black/40 backdrop-blur-xl animate-in fade-in duration-500">
              <div className="bg-white max-w-2xl w-full rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-black/5 animate-in zoom-in-95 duration-700">
                <div className="p-6 md:p-10 border-b border-black/5 flex justify-between items-start">
                   <div>
                     <div className="flex items-center space-x-2 mb-1">
                        <div className="w-1 h-1 bg-text rounded-full" />
                        <p className="font-tech text-text/20 text-[7px] md:text-[8px]">LOGISTICS_MANIFEST // ID_{selectedOrder.id.slice(-6)}</p>
                     </div>
                     <h2 className="text-xl md:text-3xl font-display italic">Fulfillment <span className="opacity-20">Terminal.</span></h2>
                   </div>
                   <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-500">
                     <X size={16} className="md:w-5" />
                   </button>
                </div>
                
                <div className="p-6 md:p-10 space-y-6 md:space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
                   {/* Industrial Shipping Label */}
                   <div id="shipping-label" className="bg-black text-white p-6 md:p-12 rounded-2xl md:rounded-[2rem] shadow-2xl relative border-4 md:border-8 border-black font-mono">
                      <div className="flex justify-between items-start border-b border-white/20 pb-4 md:pb-6 mb-6 md:mb-8">
                         <div>
                            <p className="text-[8px] md:text-[10px] text-white/40 mb-1">ORIGIN_FACILITY</p>
                            <h3 className="text-[10px] md:text-sm font-black italic tracking-widest underline decoration-2 underline-offset-4">DINOSPY_EXECUTIVE_HUB</h3>
                            <p className="text-[8px] md:text-[10px] mt-2 opacity-60">Rue de l'Horloge, Geneva // IND_DIST</p>
                         </div>
                         <div className="p-1 md:p-2 bg-white rounded-lg">
                            <QRCodeSVG value={`https://ais-dev-wty7sygzhusofsxwhxmva3-281798882282.run.app/tracking/${selectedOrder.id}`} size={40} className="md:w-[60px]" />
                         </div>
                      </div>

                      <div className="mb-8 md:mb-12">
                         <p className="text-[8px] md:text-[10px] text-white/40 mb-1 md:mb-2 text-[8px]">DELIVERY_TARGET</p>
                         <h3 className="text-xl md:text-3xl font-black italic mb-2 uppercase tracking-tighter leading-tight">{selectedOrder.customerName}</h3>
                         <div className="space-y-1 opacity-80 text-sm md:text-lg">
                            <p className="truncate">{selectedOrder.shippingAddress.address}</p>
                            <p className="font-black">{selectedOrder.shippingAddress.city}, IND - {selectedOrder.shippingAddress.zip}</p>
                         </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-white/20 pt-6 md:pt-8">
                         <div className="space-y-3 md:space-y-4">
                            <div>
                               <p className="text-[7px] md:text-[8px] text-white/20 mb-1">CARGO_MANIFEST</p>
                               <div className="text-[8px] md:text-[10px] space-y-1">
                                  {selectedOrder.items.map((it: any, idx: number) => (
                                     <div key={idx} className="flex space-x-2">
                                        <span className="opacity-40">[{it.quantity}X]</span>
                                        <span className="font-bold italic truncate max-w-[100px] md:max-w-none">{it.name.toUpperCase()}</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[7px] md:text-[8px] text-white/20 mb-1">AUTH_TAG</p>
                            <p className="text-base md:text-2xl font-black italic tracking-tighter shadow-sm">DNX-{selectedOrder.id.slice(0, 6).toUpperCase()}</p>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button 
                        onClick={() => window.print()}
                        className="flex items-center justify-center space-x-3 py-4 md:py-6 rounded-full border border-black/10 hover:bg-black/[0.02] transition-all font-tech text-[8px] md:text-[10px]"
                      >
                        <Printer size={16} className="md:w-4" />
                        <span>GENERATE_PHYSICAL_MANIFEST</span>
                      </button>
                      <button className="flex items-center justify-center space-x-3 py-4 md:py-6 rounded-full bg-text text-bg hover:scale-[1.02] transition-all font-tech text-[8px] md:text-[10px]">
                        <Package size={16} className="md:w-4" />
                        <span>INITIATE_DISPATCH_PROTOCOL</span>
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {view === 'coupons' && (
            <div className="space-y-12 animate-in fade-in duration-1000">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                       <div className="w-1.5 h-1.5 bg-black rounded-full" />
                       <span className="font-tech text-text/20 text-[10px]">MERCH_PROTOCOLS // VOUCHERS</span>
                    </div>
                    <h2 className="text-4xl font-display italic tracking-tightest">Discount <span className="opacity-20">Protocols.</span></h2>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 p-8 rounded-[2.5rem] border border-black/5 bg-black text-white shadow-2xl h-fit">
                    <div className="flex items-center space-x-3 mb-8">
                       <Zap size={18} className="text-white/40" />
                       <span className="font-tech text-[10px]">INITIATE_VOUCHER</span>
                    </div>
                    <form onSubmit={handleAddCoupon} className="space-y-8">
                      <div className="space-y-3">
                        <label className="font-tech text-white/20 text-[9px]">IDENT_CODE</label>
                        <input value={couponCode} onChange={e => setCouponCode(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-3 uppercase font-mono text-xl focus:border-white outline-none transition-all placeholder:text-white/5" placeholder="E.G._NOIR40" />
                      </div>
                      <div className="space-y-3">
                        <label className="font-tech text-white/20 text-[9px]">VALUATION_TYPE</label>
                        <select value={couponType} onChange={e => setCouponType(e.target.value as any)} className="w-full bg-transparent border-b border-white/10 py-3 font-tech text-[10px] focus:border-white outline-none transition-all cursor-pointer">
                          <option value="percentage">PERCENTAGE (%)</option>
                          <option value="fixed">FIXED_AMOUNT (₹)</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="font-tech text-white/20 text-[9px]">BENEFIT_MAGNITUDE</label>
                        <input type="number" value={couponDiscount} onChange={e => setCouponDiscount(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-3 font-mono text-xl focus:border-white outline-none transition-all" />
                      </div>
                      <button type="submit" disabled={isSaving} className="w-full py-5 bg-white text-black font-tech text-[10px] tracking-[0.4em] rounded-full hover:scale-105 transition-all duration-700 shadow-xl">
                        {isSaving ? 'EXECUTING...' : 'DEPLOY_PROTOCOL'}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {coupons.map(c => (
                      <div key={c.id} className="group p-8 rounded-[2.5rem] border border-black/5 bg-white relative overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-all duration-700 h-64">
                        <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                           <Zap size={100} />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                           <div>
                              <div className="flex items-center space-x-2 mb-2">
                                 <span className="font-tech text-text/20 text-[8px]">ACTIVE_VOUCHER</span>
                                 <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                              </div>
                              <h3 className="text-3xl font-mono font-black italic tracking-tighter">{c.code}</h3>
                           </div>
                           <button onClick={() => handleDeleteCoupon(c.id)} className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center text-black/20 hover:text-red-500 hover:bg-red-50 transition-all duration-700">
                             <Trash2 size={16} />
                           </button>
                        </div>
                        <div className="relative z-10 grid grid-cols-2 gap-4 pb-2">
                           <div className="p-4 bg-black/[0.02] rounded-2xl border border-black/5">
                              <p className="font-tech text-[7px] text-black/20 mb-1">MAGNITUDE</p>
                              <p className="font-display italic text-lg">{c.type === 'percentage' ? `${c.discount}%` : `₹${c.discount}`}</p>
                           </div>
                           <div className="p-4 bg-black/[0.02] rounded-2xl border border-black/5">
                              <p className="font-tech text-[7px] text-black/20 mb-1">THRESHOLD</p>
                              <p className="font-mono text-lg">₹{c.minAmount}</p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
          {view === 'security' && (
            <div className="space-y-12 animate-in fade-in duration-1000">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Master Overrides */}
                  <div className="lg:col-span-1 space-y-8">
                    <div className="p-8 rounded-[2.5rem] border border-black/5 bg-white group hover:shadow-2xl transition-all duration-700">
                       <div className="flex items-center space-x-3 mb-8">
                          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center group-hover:rotate-12 transition-transform duration-700">
                             <Lock size={18} />
                          </div>
                          <div>
                             <p className="font-tech text-[10px] text-black/20 mb-0.5">SECURITY_OVERRIDE</p>
                             <h3 className="text-2xl font-display italic">Vault <span className="opacity-20 text-black">Lock.</span></h3>
                          </div>
                       </div>
                       
                       <p className="text-[10px] font-tech text-black/30 mb-8 leading-relaxed">
                         INITIATING THE VAULT LOCK WILL RESTRICT ALL PUBLIC ACCESS TO THE COLLECTIONS. ONLY AUTHORIZED PERSONNEL TERMINALS WILL REMAIN OPERATIONAL.
                       </p>

                       <button 
                         onClick={handleToggleMaintenance} 
                         disabled={isTogglingMaintenance}
                         className={`w-full py-6 rounded-full font-tech text-[10px] tracking-[0.4em] transition-all duration-700 ${maintenanceStatus ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-black text-white'}`}
                       >
                         {maintenanceStatus ? 'DEACTIVATE_LOCKDOWN' : 'INITIATE_VAULT_LOCK'}
                       </button>
                    </div>

                    <div className="p-8 rounded-[2.5rem] border border-black/5 bg-white group hover:shadow-2xl transition-all duration-700">
                       <div className="flex justify-between items-center mb-6">
                          <span className="font-tech text-[9px] text-black/20">TEST_ISOLATION</span>
                          <div className={`w-2 h-2 rounded-full ${testMode ? 'bg-green-500' : 'bg-black/10'}`} />
                       </div>
                       <div className="flex items-center justify-between">
                          <h4 className="font-display italic text-xl">Sandbox <span className="opacity-20 text-black">Mode.</span></h4>
                          <button 
                            onClick={handleToggleTestMode} 
                            disabled={isTogglingTestMode}
                            className={`w-12 h-6 rounded-full relative transition-all duration-500 ${testMode ? 'bg-black' : 'bg-black/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 ${testMode ? 'left-7' : 'left-1'}`} />
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* Firewall & Signals */}
                  <div className="lg:col-span-2 p-10 rounded-[3rem] border border-black/5 bg-black text-white shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Shield size={200} />
                     </div>
                     
                     <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-12">
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]" />
                           <span className="font-tech text-white/40 text-[10px]">CORE_FIREWALL_TERMINAL // STATUS_NOMINAL</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                           {[
                             { label: 'ENC_HANDSHAKE', value: 'ECC_PRIME_256', detail: 'SECURE_CHANNEL' },
                             { label: 'ACCESS_LIST_RL', value: '45_ACTIVE_NODES', detail: 'AUTO_FILTER_ENABLE' },
                             { label: 'THREAT_SCAN', value: 'ZERO_BREACH', detail: 'LAST_SCAN: 200MS_AGO' },
                             { label: 'LATENCY_SYNC', value: '14MS', detail: 'REGION: APAC_S1' }
                           ].map((s, i) => (
                             <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
                                <p className="font-tech text-[8px] text-white/20 mb-2">{s.label}</p>
                                <div className="flex items-end justify-between">
                                  <p className="font-mono text-lg">{s.value}</p>
                                  <p className="font-tech text-[7px] text-green-500">{s.detail}</p>
                                </div>
                             </div>
                           ))}
                        </div>

                        <div className="p-8 rounded-2xl bg-white/5 border border-white/5 font-mono text-[9px] text-white/30 space-y-2">
                           <p className="text-green-500">{`> [SYS_OK] SECURE_SOCKET_ESTABLISHED`}</p>
                           <p>{`> [INFO] CLOUD_SYNC_COMPLETED_SUCCESSFULLY`}</p>
                           <p>{`> [WARN] UNIDENTIFIED_SCAN_DETECTED_FROM_IP: 192.168.X.X (BLOCKED)`}</p>
                           <p className="animate-pulse">{`> [LIVE] MONITORING_IN_PROGRESS...`}</p>
                        </div>
                     </div>
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
