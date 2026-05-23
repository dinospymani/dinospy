import React, { useState, useEffect } from 'react';
import { db } from '../context/AuthContext';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { Plus, Trash2, Edit, Save, Package, QrCode, Printer, X, Truck, Loader2, ChevronLeft, TrendingUp, DollarSign, ShoppingBag, AlertCircle, BarChart2, Bell, ArrowLeft, Megaphone } from 'lucide-react';
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
  const [view, setView] = useState<'products' | 'orders' | 'add' | 'banners' | 'stats' | 'notifications' | 'broadcast'>('stats');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

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
  const [bannerLink, setBannerLink] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pSnap = await getDocs(collection(db, 'products'));
        const fetchedProducts = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminProduct));
        setProducts(fetchedProducts);
        
        const bSnap = await getDocs(collection(db, 'banners'));
        setBanners(bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Initial manual stats calculation for products
        const lowStock = fetchedProducts.filter(p => p.stock < 5).length;
        setStats(prev => ({ ...prev, lowStock }));

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
                 type: 'new_order',
                 message: `Order #${no.id.slice(-6)} received from ${no.customerName}`,
                 timestamp: new Date().toISOString(),
                 read: false
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
    });

    return () => unsubscribeOrders();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      toast.warning('Manifest required: Title and Message are mandatory.');
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
      toast.success('Global Transmission Successful');
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
      toast.success('Global Sales Manifest Expunged');
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear records');
    } finally {
      setIsSaving(false);
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
      toast.success('Inventory balance coordinated');
    } catch (err) {
      toast.error('Sync failed');
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
      toast.success(`Order advanced to: ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error(err);
      toast.error('Transition failed');
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

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImage && !bannerImageFile) {
      toast.warning('Vision required: Please provide an image for the banner.');
      return;
    }
    
    // Check for large base64 strings (Firestore Limit is 1MB)
    const finalImage = bannerImageFile || bannerImage;
    if (finalImage.length > 800000) {
      toast.error('Image too large for Firestore. Please use a smaller file or a URL.');
      return;
    }

    setIsSaving(true);
    const promise = async () => {
      try {
        const bannerData = {
          title: bannerTitle,
          subtitle: bannerSubtitle,
          imageUrl: finalImage,
          link: bannerLink,
          active: true,
          order: banners.length,
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'banners'), bannerData);
        
        setBannerTitle('');
        setBannerSubtitle('');
        setBannerImage('');
        setBannerImageFile(null);
        setBannerLink('');
        
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
          price: parseFloat(price),
          discount: parseFloat(discount),
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
      <main className="flex-grow pt-32 pb-20 max-w-6xl mx-auto px-4 w-full">
        <div className="mb-6">
          <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 text-white/60 hover:text-gold transition-colors p-2 -ml-2"
          >
              <ArrowLeft size={20} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Exit Terminal</span>
          </button>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-display gold-text">Admin Command Center</h1>
            <p className="text-white/40 mt-2 text-sm">Manage your luxury empire with precision.</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar max-w-full">
            <button 
              onClick={() => setView('stats')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'stats' ? 'gold-gradient text-luxury-black' : 'text-white/60 hover:text-white'}`}
            >
              Intelligence
            </button>
            <button 
              onClick={() => setView('add')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'add' ? 'gold-gradient text-luxury-black' : 'text-white/60 hover:text-white'}`}
            >
              Add Product
            </button>
            <button 
              onClick={() => setView('products')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'products' ? 'gold-gradient text-luxury-black' : 'text-white/60 hover:text-white'}`}
            >
              Products
            </button>
            <button 
              onClick={() => setView('orders')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'orders' ? 'gold-gradient text-luxury-black' : 'text-white/60 hover:text-white'}`}
            >
              Orders
            </button>
            <button 
              onClick={() => setView('notifications')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${view === 'notifications' ? 'gold-gradient text-luxury-black' : 'text-white/60 hover:text-white'}`}
            >
              Alerts
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-luxury-black animate-pulse" />
              )}
            </button>
            <button 
              onClick={() => setView('broadcast')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'broadcast' ? 'gold-gradient text-luxury-black' : 'text-white/60 hover:text-white'}`}
            >
              Broadcast
            </button>
            <button 
              onClick={() => setView('banners')}
              className={`flex-shrink-0 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'banners' ? 'gold-gradient text-luxury-black' : 'text-white/60 hover:text-white'}`}
            >
              Banners
            </button>
          </div>
        </div>
        
        <div className="glass p-8 rounded-3xl border border-white/10">
          {view === 'stats' && (
            <div className="space-y-12">
               {/* Stats Cards */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-gold/10 to-transparent">
                   <div className="flex justify-between items-start mb-4">
                     <div className="p-2 bg-gold/20 rounded-lg text-gold">
                       <DollarSign size={20} />
                     </div>
                     <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded-full font-bold">+12%</span>
                   </div>
                   <p className="text-[10px] uppercase tracking-widest text-white/40">Total Revenue</p>
                   <h3 className="text-2xl font-mono mt-1">₹{stats.revenue.toLocaleString()}</h3>
                 </div>

                 <div className="glass p-6 rounded-2xl border border-white/5">
                   <div className="flex justify-between items-start mb-4">
                     <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                       <ShoppingBag size={20} />
                     </div>
                   </div>
                   <p className="text-[10px] uppercase tracking-widest text-white/40">Manifests Logged</p>
                   <h3 className="text-2xl font-mono mt-1">{stats.ordersCount}</h3>
                 </div>

                 <div className="glass p-6 rounded-2xl border border-white/5">
                   <div className="flex justify-between items-start mb-4">
                     <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                       <TrendingUp size={20} />
                     </div>
                   </div>
                   <p className="text-[10px] uppercase tracking-widest text-white/40">Market Traction</p>
                   <h3 className="text-2xl font-mono mt-1">{stats.conversionRate}%</h3>
                 </div>

                 <div className="glass p-6 rounded-2xl border border-white/5">
                   <div className="flex justify-between items-start mb-4">
                     <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
                       <AlertCircle size={20} />
                     </div>
                   </div>
                   <p className="text-[10px] uppercase tracking-widest text-white/40">Inventory Warnings</p>
                   <h3 className={`text-2xl font-mono mt-1 ${stats.lowStock > 0 ? 'text-red-500' : ''}`}>{stats.lowStock}</h3>
                 </div>
               </div>

               {/* Chart */}
               <div className="glass p-8 rounded-2xl border border-white/5 h-[400px]">
                  <div className="flex justify-between items-center mb-8">
                     <div>
                       <h3 className="text-lg font-bold flex items-center">
                         <BarChart2 className="mr-2 text-gold" size={18} />
                         Revenue Intelligence
                       </h3>
                       <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Last 7 Days Acquisition Trend</p>
                     </div>
                  </div>
                  <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} />
                      <YAxis stroke="#ffffff40" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        itemStyle={{ color: '#D4AF37' }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#D4AF37" fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
          )}

          {view === 'banners' && (
            <div className="space-y-12">
               <div>
                  <h2 className="text-xl font-bold mb-8">Home Page Banner Controls</h2>
                  <form onSubmit={handleAddBanner} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Banner Title (Optional)</label>
                        <input value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="e.g. Summer Collection" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Subtitle (Offer Text)</label>
                        <input value={bannerSubtitle} onChange={e => setBannerSubtitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="e.g. Flat 30% Off" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Direct Banner Upload</label>
                        <input 
                          type="file" accept="image/*" onChange={handleBannerFileChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-luxury-black hover:file:bg-gold/80"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Or Image URL</label>
                        <input value={bannerImage} onChange={e => setBannerImage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="https://..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Link Path (Optional)</label>
                        <input value={bannerLink} onChange={e => setBannerLink(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" placeholder="/#new" />
                      </div>
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full py-4 gold-gradient text-luxury-black font-bold uppercase tracking-widest rounded-xl hover:scale-[1.01] transition-all disabled:opacity-50">
                      Deploy Banner
                    </button>
                  </form>
               </div>

               <div>
                 <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-6">Current active banners</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {banners.map((b, index) => (
                     <div key={b.id} className="relative aspect-[21/9] rounded-2xl overflow-hidden border border-white/10 hover:border-gold/30 transition-all group">
                        <img src={b.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt={b.title} />
                        <div className="absolute top-4 right-4 flex space-x-2 z-10">
                           <div className="flex flex-col space-y-1">
                             <button 
                               type="button"
                               onClick={() => handleMoveBanner(index, 'up')} 
                               disabled={index === 0}
                               className="p-1.5 bg-black/60 text-white rounded-lg hover:bg-gold hover:text-luxury-black transition-all disabled:opacity-20"
                             >
                               <ChevronLeft size={14} className="rotate-90" />
                             </button>
                             <button 
                               type="button"
                               onClick={() => handleMoveBanner(index, 'down')} 
                               disabled={index === banners.length - 1}
                               className="p-1.5 bg-black/60 text-white rounded-lg hover:bg-gold hover:text-luxury-black transition-all disabled:opacity-20"
                             >
                               <ChevronLeft size={14} className="-rotate-90" />
                             </button>
                           </div>
                           <button 
                             type="button"
                             onClick={() => handleDeleteBanner(b.id)} 
                             className="p-2 bg-red-600/20 text-red-500 rounded-lg h-fit hover:bg-red-600 hover:text-white transition-colors"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                        <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                           <span className="text-[10px] font-mono text-gold/60 mb-1">Slide #{index + 1}</span>
                           <h4 className="font-display text-lg text-gold">{b.title}</h4>
                           <p className="text-white/60 text-xs">{b.subtitle}</p>
                        </div>
                     </div>
                   ))}
                   {banners.length === 0 && <p className="text-white/20 text-xs py-10 text-center col-span-2">No promotional banners active.</p>}
                 </div>
               </div>
            </div>
          )}

          {view === 'broadcast' && (
            <div className="space-y-12">
               <div>
                  <h2 className="text-xl font-bold mb-8 flex items-center">
                    <Megaphone className="mr-3 text-gold" size={24} />
                    Global Transmission System
                  </h2>
                  <form onSubmit={handleBroadcast} className="space-y-6 max-w-2xl">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Transmission Title</label>
                        <input 
                          value={broadcastTitle} 
                          onChange={e => setBroadcastTitle(e.target.value)} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold" 
                          placeholder="e.g. Exclusive Weekend Offer" 
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Category</label>
                        <div className="flex flex-wrap gap-4">
                          {['offer', 'trending', 'new_arrival', 'general'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setBroadcastType(type as any)}
                              className={`px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest border transition-all ${broadcastType === type ? 'bg-gold/10 border-gold text-gold' : 'border-white/5 text-white/40'}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Transmission Manifest (Message)</label>
                        <textarea 
                          value={broadcastMessage} 
                          onChange={e => setBroadcastMessage(e.target.value)} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold h-32" 
                          placeholder="Detailed announcement for all elite members..."
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Link Target (Optional)</label>
                        <input 
                          value={broadcastLink} 
                          onChange={e => setBroadcastLink(e.target.value)} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold" 
                          placeholder="e.g. /explore or /product/ID" 
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSaving} 
                      className="w-full py-4 gold-gradient text-luxury-black font-black uppercase tracking-[0.3em] rounded-xl hover:scale-[1.01] transition-all disabled:opacity-50 shadow-xl shadow-gold/10"
                    >
                      {isSaving ? 'Initiating Broadcast...' : 'Execute Pulse'}
                    </button>
                  </form>
               </div>

               <div className="pt-12 border-t border-white/5">
                 <h3 className="text-[10px] uppercase tracking-widest text-white/20 mb-6">Historical Transmissions</h3>
                 <p className="text-white/40 text-xs italic">Pulse history is managed via the database console.</p>
               </div>
            </div>
          )}

          {view === 'add' && (
            <>
              <h2 className="text-xl font-bold mb-8 flex items-center">
                <Plus className="mr-2 text-gold" size={20} />
                Quick Catalog Addition
              </h2>
              
              <form onSubmit={handleAddProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Product Name</label>
                    <input 
                      value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none"
                      placeholder="e.g. Zenith Black" required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Base Price (INR)</label>
                    <input 
                      type="number" value={price} onChange={e => setPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none"
                      placeholder="e.g. 150000" required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Stock Quantity</label>
                    <input 
                      type="number" value={stock} onChange={e => setStock(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none"
                      placeholder="e.g. 10" required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Discount (%)</label>
                    <input 
                      type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Category</label>
                    <select 
                      value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full bg-[#1A1A1A] text-white border border-white/20 rounded-xl px-4 py-3 focus:border-gold outline-none cursor-pointer focus:ring-1 focus:ring-gold"
                    >
                      <option value="Grand Complications" className="bg-[#1A1A1A] text-white py-2">Grand Complications</option>
                      <option value="Heritage" className="bg-[#1A1A1A] text-white py-2">Heritage</option>
                      <option value="Avant-Garde" className="bg-[#1A1A1A] text-white py-2">Avant-Garde</option>
                      <option value="Deep Sea" className="bg-[#1A1A1A] text-white py-2">Deep Sea</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Direct Photo Upload</label>
                    <input 
                      type="file" multiple accept="image/*" onChange={handleFileChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-luxury-black hover:file:bg-gold/80"
                    />
                    <p className="text-[8px] text-white/20 mt-1">Uploaded photos are stored locally in the database.</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Or Image URL (Optional)</label>
                    <input 
                      value={image} onChange={e => setImage(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Description</label>
                  <textarea 
                    value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none h-32"
                    placeholder="Exquisite detailing..." required
                  />
                </div>

                <div className="flex space-x-8">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={isTrending} onChange={e => setIsTrending(e.target.checked)} className="accent-gold h-4 w-4" />
                    <span className="text-sm text-white/60">Trending</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={isNewArrival} onChange={e => setIsNewArrival(e.target.checked)} className="accent-gold h-4 w-4" />
                    <span className="text-sm text-white/60">New Arrival</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={isOffer} onChange={e => setIsOffer(e.target.checked)} className="accent-gold h-4 w-4" />
                    <span className="text-sm text-white/60">Active Offer</span>
                  </label>
                  <div className="h-6 w-[1px] bg-white/10 mx-2" />
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={shouldAutoBroadcast} onChange={e => setShouldAutoBroadcast(e.target.checked)} className="accent-gold h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm text-gold font-bold">Auto-Broadcast</span>
                      <span className="text-[8px] text-white/40 uppercase tracking-widest">Pulse to all collectors</span>
                    </div>
                  </label>
                </div>

                <button type="submit" disabled={isSaving} className="w-full py-4 gold-gradient text-luxury-black font-bold uppercase tracking-widest rounded-xl hover:scale-[1.01] transition-all disabled:opacity-50">
                  {isSaving ? 'Archiving...' : 'Save to Catalog'}
                </button>
              </form>
            </>
          )}

          {view === 'notifications' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Intelligence Feed</h2>
                <button 
                  onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                  className="text-[10px] uppercase font-bold text-white/40 hover:text-gold"
                >
                  Clear All Unread
                </button>
              </div>
              <div className="space-y-4">
                {notifications.length === 0 && (
                  <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Bell className="mx-auto text-white/20 mb-4" size={48} />
                    <p className="text-white/40">No new alerts in the feed.</p>
                  </div>
                )}
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`glass p-5 rounded-2xl border transition-all ${n.read ? 'border-white/5 opacity-60' : 'border-gold/30 bg-gold/5'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full ${n.type === 'new_order' ? 'bg-gold/20 text-gold' : 'bg-blue-500/20 text-blue-500'}`}>
                          <Bell size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{n.message}</p>
                          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Just Now
                          </p>
                        </div>
                      </div>
                      {!n.read && (
                        <button 
                          onClick={() => setNotifications(notifications.map(notif => notif.id === n.id ? {...notif, read: true} : notif))}
                          className="text-[10px] text-gold uppercase font-bold hover:underline"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'products' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-8">Current Inventory</h2>
              <div className="grid grid-cols-1 gap-4">
                {products.length === 0 && (
                  <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Package className="mx-auto text-white/20 mb-4" size={48} />
                    <p className="text-white/40 mb-8">No products found in catalog.</p>
                    <button 
                      onClick={handleSeed}
                      disabled={isSaving}
                      className="px-8 py-4 gold-gradient text-luxury-black font-bold uppercase tracking-widest rounded-xl hover:scale-[1.05] transition-all disabled:opacity-50"
                    >
                      {isSaving ? 'Initializing...' : 'Seed Sample Collection'}
                    </button>
                  </div>
                )}
                {products.map((p) => (
                  <div key={p.id} className="flex items-center space-x-4 glass p-4 rounded-2xl border border-white/5">
                    <img src={p.images[0]} className="w-16 h-16 object-cover rounded-lg" alt={p.name} />
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold">{p.name}</h4>
                        {p.stock < 5 && (
                          <div className="flex items-center text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">
                            <AlertCircle size={10} className="mr-1" />
                            Low Stock
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/40">₹{p.price.toLocaleString()} • {p.category} • <span className={p.stock < 5 ? 'text-red-500 font-bold' : ''}>{p.stock} units</span></p>
                    </div>
                    <div className="flex items-center space-x-2">
                       {editingStockId === p.id ? (
                         <div className="flex items-center space-x-2">
                            <input 
                              type="number" 
                              value={newStockValue} 
                              onChange={e => setNewStockValue(e.target.value)}
                              className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-gold"
                              placeholder="New Stock"
                              autoFocus
                            />
                            <button onClick={() => handleUpdateStock(p.id)} className="text-[10px] font-bold text-gold uppercase tracking-widest hover:underline">Sync</button>
                            <button onClick={() => setEditingStockId(null)} className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:underline">X</button>
                         </div>
                       ) : (
                         <button 
                           onClick={() => {
                             setEditingStockId(p.id);
                             setNewStockValue(p.stock.toString());
                           }} 
                           className="flex items-center text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-gold transition-colors"
                         >
                           <Edit size={12} className="mr-1" />
                           Inventory
                         </button>
                       )}
                       <button onClick={() => handleDelete(p.id)} className="p-2 hover:text-red-400 transition-colors">
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'orders' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Global Sales Manifest</h2>
                {orders.length > 0 && (
                  <button 
                    onClick={handlePurgeOrders}
                    disabled={isSaving}
                    className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    <Trash2 size={14} />
                    <span>Purge All Records</span>
                  </button>
                )}
              </div>
              <div className="space-y-6">
                {orders.length === 0 && <p className="text-white/40 text-center py-20">No orders received yet.</p>}
                {orders.map((o) => (
                  <div key={o.id} className="glass p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-full ${o.status === 'shipped' ? 'bg-blue-500/20 text-blue-500' : o.status === 'delivered' ? 'bg-green-500/20 text-green-500' : 'bg-gold/20 text-gold'}`}>
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-white/40">Order #{o.id.slice(-6)}</p>
                          <h4 className="font-bold text-white">{o.customerName}</h4>
                          <p className="text-xs text-white/60">{o.customerEmail}</p>
                          <div className="mt-2 flex items-center space-x-2">
                             <span className={`text-[8px] font-bold uppercase px-2 py-1 rounded tracking-widest ${o.status === 'delivered' ? 'bg-green-600' : 'bg-gold text-luxury-black'}`}>
                               {o.status}
                             </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xl">₹{o.total.toLocaleString()}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/40">{new Date(o.createdAt).toLocaleDateString()}</p>
                        <button 
                          onClick={() => setSelectedOrder(o)}
                          className="mt-4 flex items-center text-gold text-[10px] font-bold uppercase tracking-widest hover:underline"
                        >
                          <QrCode size={14} className="mr-1" />
                          View Tracking & Label
                        </button>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                       <div className="flex flex-wrap gap-2">
                         {o.items.map((item: any, idx: number) => (
                           <span key={idx} className="bg-white/5 px-3 py-1 rounded-full text-xs border border-white/10">
                              {item.name} x{item.quantity}
                           </span>
                         ))}
                       </div>
                       <select 
                         value={o.status} 
                         onChange={(e) => {
                           const newStatus = e.target.value as AdminOrder['status'];
                           if (newStatus === 'shipped') {
                             const trackingId = prompt("Enter Tracking ID:");
                             const carrier = prompt("Enter Carrier:", "DHL Global");
                             if (trackingId) {
                               handleUpdateOrderStatus(o.id, newStatus, { trackingId, carrier: carrier || 'Premium Logistics' });
                             }
                           } else {
                             handleUpdateOrderStatus(o.id, newStatus);
                           }
                         }}
                         className="bg-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest text-white border border-white/20 rounded px-3 py-2 focus:border-gold outline-none cursor-pointer"
                       >
                         <option value="pending">Pending</option>
                         <option value="processing">Processing</option>
                         <option value="quality_check">Quality Check</option>
                         <option value="shipped">Shipped</option>
                         <option value="out_for_delivery">Out for Delivery</option>
                         <option value="delivered">Delivered</option>
                       </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Label Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
              <div className="glass w-full max-w-2xl rounded-[2.5rem] overflow-hidden border border-gold/30">
                <div className="p-8 border-b border-white/10 flex justify-between items-start">
                   <div>
                     <h2 className="text-2xl font-display gold-text">Order Manifest</h2>
                     <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Order Tracking & Fulfillment</p>
                   </div>
                   <button onClick={() => setSelectedOrder(null)} className="p-2 hover:text-gold transition-colors">
                     <X size={24} />
                   </button>
                </div>
                
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                   {/* Label Component */}
                   <div id="shipping-label" className="bg-white text-black p-8 rounded-lg shadow-2xl relative">
                      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                         <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-black/50">Sender</p>
                            <h3 className="text-lg font-bold">DINOSPY LUXURY WATCHES</h3>
                            <p className="text-xs">Rue de l'Horloge, Geneva (Distribution India)</p>
                            <p className="text-xs">contact@dinospy.com</p>
                         </div>
                         <div className="text-right">
                           <QRCodeSVG value={`https://ais-dev-wty7sygzhusofsxwhxmva3-281798882282.run.app/tracking/${selectedOrder.id}`} size={80} />
                         </div>
                      </div>

                      <div className="mb-8">
                         <p className="text-[10px] font-bold uppercase tracking-wider text-black/50">Ship To</p>
                         <h3 className="text-2xl font-bold">{selectedOrder.customerName}</h3>
                         <p className="text-lg">{selectedOrder.shippingAddress.address}</p>
                         <p className="text-lg font-bold">{selectedOrder.shippingAddress.city}, IND - {selectedOrder.shippingAddress.zip}</p>
                         <p className="text-lg font-bold">INDIA</p>
                      </div>

                      <div className="flex justify-between items-end border-t-2 border-black pt-4">
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold">PACKAGE CONTENTS</p>
                            <div className="text-xs uppercase">
                               {selectedOrder.items.map((it: any) => `${it.name} (x${it.quantity})`).join(', ')}
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-bold">LOGISTICS ID</p>
                            <p className="text-xl font-mono">DNX-{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => window.print()}
                        className="flex items-center justify-center space-x-2 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors uppercase tracking-widest text-[10px] font-bold"
                      >
                        <Printer size={16} />
                        <span>Print Shipping Label</span>
                      </button>
                      <button className="flex items-center justify-center space-x-2 py-4 bg-gold text-luxury-black rounded-2xl hover:scale-[1.02] transition-transform uppercase tracking-widest text-[10px] font-bold">
                        <Truck size={16} />
                        <span>Dispatch via DINOSPY Logistics</span>
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-20 pt-10 border-t border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Demo Tools</h3>
            <button 
                onClick={async () => {
                    const demo = [
                        { name: "Dinospy Celestia", price: 185000, category: "Luxury", img: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=2070", trending: true },
                        { name: "Monarch Chrono", price: 129000, category: "Luxury", img: "https://images.unsplash.com/photo-1508685096489-7aac29a23fce?auto=format&fit=crop&q=80&w=1978", trending: false },
                        { name: "Nero Sport", price: 65000, category: "Sport", img: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=2080", trending: true },
                        { name: "Heritage Classic", price: 42000, category: "Classic", img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=2018", trending: false }
                    ];
                    
                    const promise = async () => {
                        // Seed products
                        for (const p of demo) {
                            await addDoc(collection(db, 'products'), {
                                ...p, brand: 'DINOSPY', images: [p.img], isTrending: p.trending, isNewArrival: true, stock: 10, rating: 5.0, reviewCount: 0, createdAt: new Date().toISOString(), specs: { Movement: 'Automatic', Case: 'Gold/Steel', Crystal: 'Sapphire' }, description: 'A masterpiece of precision craftsmanship and timeless elegance.'
                            });
                        }
                        // Seed banners
                        const demoBanners = [
                          { title: 'The Chronos Collection', subtitle: 'Exquisite Engineering', imageUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=2000', link: '/#new', active: true, order: 0 },
                          { title: 'Summer Sale 2024', subtitle: 'Up to 30% Off Selected Sets', imageUrl: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=2000', link: '/#new', active: true, order: 1 },
                          { title: 'The Monarch Series', subtitle: 'Limited Edition Heritage Sets', imageUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=2080', link: '/#categories', active: true, order: 2 }
                        ];
                        for (const b of demoBanners) {
                          await addDoc(collection(db, 'banners'), { ...b, createdAt: new Date().toISOString() });
                        }
                    };

                    toast.promise(promise(), {
                        loading: 'Seeding demo catalog...',
                        success: 'Boutique populated successfully!',
                        error: 'Seeding failed.'
                    });
                }}
                className="px-6 py-3 glass border border-gold/20 text-gold text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-luxury-black transition-all"
            >
                Seed Demo Catalog
            </button>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
