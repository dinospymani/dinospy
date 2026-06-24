import React, { useState, useEffect } from 'react';
import { db, useAuth } from '../context/AuthContext';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { Plus, Trash2, Edit, Save, Package, QrCode, Printer, X, Truck, Loader2, ChevronLeft, TrendingUp, DollarSign, ShoppingBag, AlertCircle, BarChart2, Bell, ArrowLeft, Megaphone, Check, Zap, Clock, Shield, Lock, Eye, EyeOff, Database, ArrowRight, ShieldAlert, AlertTriangle, ShieldCheck, Cpu, Activity, Wifi, Image as ImageIcon, MessageSquare, Send, User, Mail, Phone, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  status: 'pending' | 'processing' | 'quality_check' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  items: any[];
  trackingId?: string;
  carrier?: string;
  timeline?: { status: string; timestamp: string; message: string }[];
  [key: string]: any;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
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
  const [specsMovement, setSpecsMovement] = useState('Automatic');
  const [specsCase, setSpecsCase] = useState('Stainless Steel');
  const [specsCrystal, setSpecsCrystal] = useState('Sapphire');
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  
  const downloadReceipt = async (order: any) => {
    if (!order || !order.items) {
      toast.error('Manifest data corrupted.');
      return;
    }

    try {
      const doc = new jsPDF();
      const indigoColor = [79, 70, 229]; // #4f46e5
      const blackColor = [0, 0, 0]; // #000000
      const neutralGray = [150, 150, 150];
      const accentGray = [240, 240, 240];

      // Title & Branding Header
      doc.setFillColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.rect(0, 0, 210, 55, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text('DINOSPY', 105, 38, { align: 'center', charSpace: 3 });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('PREMIUM_COLLECTOR_SERVICES // VAULT_LOGISTICS_TERMINAL', 105, 48, { align: 'center', charSpace: 1.5 });
      
      doc.setDrawColor(indigoColor[0], indigoColor[1], indigoColor[2]);
      doc.setLineWidth(1);
      doc.line(60, 52, 150, 52);

      // Section: Shipping Label / Box Header (Industrial look)
      doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.setLineWidth(0.5);
      doc.rect(140, 65, 55, 35); // Order ID Box
      doc.setFontSize(7);
      doc.setTextColor(neutralGray[0], neutralGray[1], neutralGray[2]);
      doc.text('MANIFEST_ID_TRACKER', 145, 70);
      doc.setFontSize(10);
      doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`#${order.id.toUpperCase()}`, 145, 80);
      doc.setFontSize(8);
      doc.text(`DATE: ${new Date(order.createdAt).toLocaleDateString()}`, 145, 87);
      doc.text(`STATUS: ${order.status.toUpperCase()}`, 145, 93);

      // SHIP TO / CONSIGNEE Information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSIGNEE_SHIPPING_MANIFEST', 20, 70);
      doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.setLineWidth(0.3);
      doc.line(20, 73, 120, 73);

      doc.setFontSize(12);
      doc.text(order.customerName?.toUpperCase() || 'ANONYMOUS_COLLECTOR', 20, 83);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const address = order.shippingAddress;
      if (address) {
        doc.text(`${address.address || ''}`, 20, 90);
        doc.text(`${address.city || ''}, ${address.state || ''} - ${address.zip || ''}`, 20, 96);
        doc.text(`COUNTRY: ${address.country?.toUpperCase() || 'INDIA'}`, 20, 102);
        doc.setFont('helvetica', 'bold');
        doc.text(`CONTACT_ID: +91 ${order.customerPhone || address.phone || 'NOT_FOUND'}`, 20, 110);
      }
      
      doc.setFont('helvetica', 'normal');
      doc.text(`AUTH_EMAIL: ${order.customerEmail || 'UNTRACKED'}`, 20, 116);
      doc.setFont('helvetica', 'bold');
      doc.text(`SECURE_DELIVERY_PIN: ${order.deliveryPin || 'PENDING_SYNC'}`, 20, 123);

      // Logistics Warning Box
      doc.setFillColor(accentGray[0], accentGray[1], accentGray[2]);
      doc.rect(140, 110, 55, 20, 'F');
      doc.setFontSize(7);
      doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.text('FRAGILE // HIGH_VALUE_ASSET', 167.5, 117, { align: 'center' });
      doc.text('DO_NOT_BEND // SEALED_VAULT', 167.5, 122, { align: 'center' });

      // Asset Table
      const tableData = order.items.map((item: any) => [
        item.name.toUpperCase(),
        item.brand?.toUpperCase() || 'DINOSPY_ARCHIVE',
        `X${item.quantity}`,
        `INR ${(item.price || 0).toLocaleString()}`,
        `INR ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 140,
        head: [['ASSET_CLASS', 'BRAND_ORIGIN', 'QTY', 'UNIT_VAL', 'AGGREGATE']],
        body: tableData,
        headStyles: { 
          fillColor: blackColor as any, 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 40 },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        styles: { fontSize: 8, font: 'helvetica', cellPadding: 5 },
        margin: { left: 20, right: 20 }
      });

      // Financial Breakdown
      const lastTable = (doc as any).lastAutoTable;
      let finalY = lastTable ? lastTable.finalY + 15 : 200;

      // Ensure footer doesn't overlap
      if (finalY > 240) {
        doc.addPage();
        finalY = 30;
      }

      const subtotal = order.items.reduce((acc: number, item: any) => acc + ((item.price || 0) * (item.quantity || 1)), 0);
      const discount = subtotal - (order.total || subtotal);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(neutralGray[0], neutralGray[1], neutralGray[2]);
      doc.text('SUBTOTAL_ACQUISITION:', 140, finalY);
      doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.text(`INR ${subtotal.toLocaleString()}`, 190, finalY, { align: 'right' });

      if (discount > 0) {
        doc.setTextColor(neutralGray[0], neutralGray[1], neutralGray[2]);
        doc.text(`PROMO_KEY_ADJUSTMENT (${order.couponUsed || 'NA'}):`, 140, finalY + 6);
        doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
        doc.text(`- INR ${discount.toLocaleString()}`, 190, finalY + 6, { align: 'right' });
        finalY += 6;
      }

      doc.setTextColor(neutralGray[0], neutralGray[1], neutralGray[2]);
      doc.text('LOGISTICS_TRANSIT_FEE:', 140, finalY + 6);
      doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.text('INR 0 (WAIVED)', 190, finalY + 6, { align: 'right' });

      doc.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.setLineWidth(0.5);
      doc.line(140, finalY + 10, 190, finalY + 10);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('GRAND_TOTAL_VALUE:', 140, finalY + 20);
      doc.text(`INR ${(order.total || 0).toLocaleString()}`, 190, finalY + 20, { align: 'right' });

      // Verification Barcode Mock
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, finalY + 5, 80, 25);
      doc.setFontSize(6);
      doc.setTextColor(180, 180, 180);
      doc.text('INTERNAL_SECURITY_BARCODE_PLACEHOLDER', 40, finalY + 15);
      doc.setFontSize(9);
      doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
      doc.text(`* DNX-${order.id.slice(0, 10).toUpperCase()} *`, 40, finalY + 22);

      // Signature Section
      doc.setFontSize(8);
      doc.text('ADMIN_LOGISTICS_STAMP:', 20, 250);
      doc.line(20, 265, 80, 265);
      doc.text('AUTHORIZED_OFFICER', 20, 270);

      doc.text('CONSIGNEE_SIGNATURE:', 130, 250);
      doc.line(130, 265, 190, 265);
      doc.text('DATE_OF_ACCEPTANCE', 130, 270);

      // Footer
      doc.setTextColor(neutralGray[0], neutralGray[1], neutralGray[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('THIS_DOCUMENT_SERVES_AS_A_LEGAL_MANIFEST_AND_AUTHENTICITY_WARRANTY.', 105, 285, { align: 'center' });
      doc.text('DINOSPY VAULT // GENEVA // MUMBAI // GLOBAL_DISTRIBUTION_NODE', 105, 290, { align: 'center' });

      doc.save(`DINOSPY-MANIFEST-${order.id.slice(-8).toUpperCase()}.pdf`);
      toast.success('Professional Manifest Generated.');
    } catch (err) {
      console.error(err);
      toast.error('Manifest generation failure.');
    }
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [storyBanners, setStoryBanners] = useState<any[]>([]);
  const [view, setView] = useState<'products' | 'orders' | 'add' | 'banners' | 'offers' | 'gallery' | 'story_banners' | 'stats' | 'notifications' | 'broadcast' | 'coupons' | 'security' | 'support'>('stats');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [activeSupportChat, setActiveSupportChat] = useState<string | null>(null);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [liveActivity, setLiveActivity] = useState<any[]>([]);
  const adminScrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adminScrollRef.current) {
      adminScrollRef.current.scrollTop = adminScrollRef.current.scrollHeight;
    }
  }, [supportMessages]);

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
  const [isAddingGallery, setIsAddingGallery] = useState(false);
  const [galleryImageUrl, setGalleryImageUrl] = useState('');
  const [galleryLabel, setGalleryLabel] = useState('');
  const [galleryAspect, setGalleryAspect] = useState<'aspect-square' | 'aspect-[3/4]' | 'aspect-[4/5]'>('aspect-square');
  const [isSavingGallery, setIsSavingGallery] = useState(false);
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

  // Story Banner States
  const [storyBannerFile, setStoryBannerFile] = useState<string | null>(null);
  const [storyBannerMobileFile, setStoryBannerMobileFile] = useState<string | null>(null);
  const [storyBannerLink, setStoryBannerLink] = useState('');

  const [bannerExpiry, setBannerExpiry] = useState('');
  const [bannerDisplayDesktop, setBannerDisplayDesktop] = useState(true);
  const [bannerDisplayMobile, setBannerDisplayMobile] = useState(true);

  // Offer states
  const [offerText, setOfferText] = useState('');
  const [offerLink, setOfferLink] = useState('');
  const [offerImageUrl, setOfferImageUrl] = useState('');
  const [isSavingOffer, setIsSavingOffer] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pSnap = await getDocs(collection(db, 'products'));
        const fetchedProducts = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminProduct));
        setProducts(fetchedProducts);
        
        const bSnap = await getDocs(collection(db, 'banners'));
        setBanners(bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const offerSnap = await getDocs(collection(db, 'offers'));
        setOffers(offerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
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
               icon: <Bell size={18} />,
               duration: 5000
             });
             setLiveActivity(prev => [{
               id: Date.now(),
               type: 'order',
               message: `New acquisition protocol for DNX-${no.id.slice(-6).toUpperCase()} initiated by ${no.customerName}`,
               timestamp: new Date().toISOString()
             }, ...prev].slice(0, 20));
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

    // SUPPORT TICKETS LISTENER
    const qSupport = query(collection(db, 'support_tickets'), orderBy('lastActive', 'desc'));
    const unsubSupport = onSnapshot(qSupport, (snap) => {
      const fetchedChats = snap.docs.map(doc => ({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) }));
      setSupportChats(fetchedChats);
      
      // Live activity for new signals
      setSupportChats(prev => {
        if (prev.length > 0 && fetchedChats.length > prev.length) {
           setLiveActivity(la => [{
             id: Date.now(),
             type: 'support',
             message: `New secure signal frequency established`,
             timestamp: new Date().toISOString()
           }, ...la].slice(0, 50));
        }
        return fetchedChats;
      });
    }, (error) => {
      console.warn("Support vault restricted:", error);
    });

    // NOTIFICATIONS LISTENER
    const qNotif = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), orderBy('read', 'asc'));
    const unsubNotif = onSnapshot(qNotif, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Notification feed isolation active", error);
    });

    // GALLERY LISTENER
    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snap) => {
      setGalleryItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Gallery isolation active:", error);
    });

    // STORY BANNERS LISTENER
    const unsubStoryBanners = onSnapshot(query(collection(db, 'story_banners'), orderBy('order', 'asc')), (snap) => {
      setStoryBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Story banners isolation active:", error);
    });

    // Auto-redirect support role to support view
    if (profile?.role === 'support') {
      setView('support');
    }

    return () => {
      unsubscribeOrders();
      unsubMaintenance();
      unsubCoupons();
      unsubSupport();
      unsubNotif();
      unsubGallery();
      unsubStoryBanners();
    };
  }, []);

  // Support Messages Effect
  useEffect(() => {
    if (!activeSupportChat || view !== 'support') return;

    const qMsg = query(
      collection(db, 'support_tickets', activeSupportChat, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(qMsg, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data({ serverTimestamps: 'estimate' }) } as any));
      // Robust client-side sort to handle legacy mixed data (strings vs timestamps)
      msgs.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.()?.getTime() || new Date(a.timestamp || 0).getTime();
        const timeB = b.timestamp?.toDate?.()?.getTime() || new Date(b.timestamp || 0).getTime();
        return timeA - timeB;
      });
      setSupportMessages(msgs);
    }, (error) => {
       console.error("Message relay failed:", error);
    });

    // Mark as read by admin
    setDoc(doc(db, 'support_tickets', activeSupportChat), { unreadByAdmin: false }, { merge: true });

    return () => unsubscribe();
  }, [activeSupportChat, view]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupportChat || !replyText.trim()) return;

    const text = replyText.trim();
    setReplyText('');

    try {
      await addDoc(collection(db, 'support_tickets', activeSupportChat, 'messages'), {
        text,
        senderId: 'admin',
        senderName: 'Vault Administrator',
        sender: 'admin',
        timestamp: serverTimestamp(),
        isAdmin: true
      });

      await setDoc(doc(db, 'support_tickets', activeSupportChat), {
        lastMessage: text,
        lastActive: serverTimestamp(),
        unreadByUser: true,
        unreadByAdmin: false
      }, { merge: true });

    } catch (err) {
      toast.error('Transmission failed.');
    }
  };

  const handleResolveSupport = async (chatId: string) => {
    try {
      await setDoc(doc(db, 'support_tickets', chatId), { 
        status: 'RESOLVED',
        resolvedAt: serverTimestamp(),
        unreadByAdmin: false 
      }, { merge: true });
      toast.success('Ticket marked as RESOLVED.');
      setActiveSupportChat(null);
    } catch (err) {
      toast.error('Termination handshake failed.');
    }
  };

  const handleAddStoryBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyBannerFile) {
      toast.error('DESKTOP_IMAGE_REQUIRED');
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'story_banners'), {
        imageUrl: storyBannerFile,
        mobileImageUrl: storyBannerMobileFile || storyBannerFile,
        link: storyBannerLink,
        order: storyBanners.length,
        createdAt: serverTimestamp()
      });
      setStoryBannerFile(null);
      setStoryBannerMobileFile(null);
      setStoryBannerLink('');
      toast.success('STORY_BANNER_DEPLOYED');
    } catch (err) {
      console.error(err);
      toast.error('DEPLOYMENT_FAILURE');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStoryBanner = async (id: string) => {
    if (!window.confirm('Delete this story banner?')) return;
    try {
      await deleteDoc(doc(db, 'story_banners', id));
      toast.success('BANNER_PURGED');
    } catch (err) {
      toast.error('PURGE_FAILED');
    }
  };

  const handleMoveStoryBanner = async (index: number, direction: 'up' | 'down') => {
    const newBanners = [...storyBanners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;

    [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];

    try {
      await Promise.all(newBanners.map((b, i) => 
        updateDoc(doc(db, 'story_banners', b.id), { order: i })
      ));
    } catch (err) {
      toast.error('REORDER_FAILED');
    }
  };

  const handleDeleteSupport = async (chatId: string) => {
    if (!window.confirm('Delete this ticket permanently from the vault?')) return;
    try {
      await deleteDoc(doc(db, 'support_tickets', chatId));
      toast.success('Record purged.');
      setActiveSupportChat(null);
    } catch (err) {
      toast.error('Purge failed.');
    }
  };

  const handleToggleMaintenance = async () => {
    setIsTogglingMaintenance(true);
    const mid = 'maint-toggle';
    try {
      // Use the actual current state value to toggle
      const newStatus = !maintenanceStatus;
      
      await setDoc(doc(db, 'settings', 'maintenance'), { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Update local state immediately for better UX
      setMaintenanceStatus(newStatus);
      
      toast.success(newStatus ? 'SYSTEMS ENTERING STANDBY: Maintenance mode active' : 'SYSTEMS RESTORED: Storefront online', { id: mid });
    } catch (err) {
      console.error('Maintenance Toggle Error:', err);
      toast.error('Maintenance state coordination failed. Auth permission issue?', { id: mid });
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
      
      // Trigger SMS Notification via Server API
      if (newStatus === 'shipped' || newStatus === 'delivered') {
        try {
          await fetch('/api/notifications/order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              status: newStatus,
              phone: order.customerPhone,
              customerName: order.customerName,
              trackingId: trackingInfo?.trackingId,
              carrier: trackingInfo?.carrier
            })
          });
        } catch (error) {
          console.error("Critical: Failed to trigger notification gateway.", error);
        }
      }
      
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
      delivered: "Signature delivery completed. Welcome to the collection.",
      cancelled: "Acquisition protocol terminated and manifest archived."
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

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerText) {
      toast.warning('Signal required: Please provide offer text.');
      return;
    }

    setIsSavingOffer(true);
    try {
      const offerData = {
        text: offerText,
        link: offerLink,
        imageUrl: offerImageUrl,
        active: true,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'offers'), offerData);
      setOfferText('');
      setOfferLink('');
      setOfferImageUrl('');
      
      const offerSnap = await getDocs(collection(db, 'offers'));
      setOffers(offerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      toast.success('Promotional signal deployed.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'offers');
      toast.error('Deployment failed.');
    } finally {
      setIsSavingOffer(false);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'offers', id));
      setOffers(prev => prev.filter(o => o.id !== id));
      toast.success('Offer purged from the vault.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'offers');
      toast.error('Purge failed.');
    }
  };

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryImageUrl) {
      toast.warning('Evidence required: Please provide an image.');
      return;
    }

    setIsSavingGallery(true);
    try {
      if (galleryImageUrl.length > 1000000) {
        toast.error('Asset too large for the vault. Please use a smaller capture.');
        setIsSavingGallery(false);
        return;
      }

      await addDoc(collection(db, 'gallery'), {
        imageUrl: galleryImageUrl,
        label: galleryLabel,
        aspect: galleryAspect,
        active: true,
        order: galleryItems.length,
        createdAt: new Date().toISOString()
      });
      setGalleryImageUrl('');
      setGalleryLabel('');
      setIsAddingGallery(false);
      toast.success('Visual asset synced with gallery.');
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'gallery');
       toast.error('Sync failed.');
    } finally {
      setIsSavingGallery(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.warning('Evidence too heavy: Compressing visual asset...');
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions to keep size low
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // High quality but compressed
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          // Check size (base64 string size check)
          if (dataUrl.length > 800000) {
            // Further compress if still too large
            setGalleryImageUrl(canvas.toDataURL('image/jpeg', 0.4));
          } else {
            setGalleryImageUrl(dataUrl);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gallery', id));
      toast.success('Asset purged from gallery.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'gallery');
      toast.error('Purge failed.');
    }
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
        images: ['/src/assets/images/hero_skeleton_movement_1782293477542.jpg'],
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
        images: ['/src/assets/images/diver_watch_underwater_1782293493132.jpg'],
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
        images: ['/src/assets/images/minimalist_marble_watch_1782293522898.jpg'],
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
        images: ['/src/assets/images/vanguard_carbon_watch_1782293507993.jpg'],
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
        images: ['/src/assets/images/hero_skeleton_movement_1782293477542.jpg'],
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
            Movement: specsMovement,
            Case: specsCase,
            Crystal: specsCrystal
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
        setBrand('DINOSPY');
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

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you certain you wish to terminate this acquisition protocol? This action is irreversible.')) return;
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
        timeline: [
          ...(selectedOrder?.timeline || []),
          {
            status: 'cancelled',
            timestamp: new Date().toISOString(),
            message: "Protocol terminated by DINOSPY_EXECUTIVE."
          }
        ]
      });
      toast.success('Acquisition protocol terminated.');
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      toast.error('Termination sequence failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handeShipOrder = async (orderId: string) => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'shipped',
        updatedAt: serverTimestamp(),
        timeline: [
          ...(selectedOrder?.timeline || []),
          {
            status: 'shipped',
            timestamp: new Date().toISOString(),
            message: "Asset dispatched from Geneva logistics node."
          }
        ]
      });
      toast.success('Asset dispatched.');
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      toast.error('Dispatch handshake failed.');
    } finally {
      setIsSaving(false);
    }
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
    <div className="min-h-screen bg-white flex flex-col pt-24 md:pt-32 selection:bg-indigo-600 selection:text-white">
      <Navbar />
      <main className="flex-grow pt-8 md:pt-16 pb-40 max-w-[1600px] mx-auto px-6 md:px-12 w-full">
        <div className="mb-12 md:mb-20">
          <button 
              onClick={() => window.location.href = '/'}
              className="group flex items-center space-x-4 text-black/20 hover:text-black transition-all duration-700 p-3 -ml-3"
          >
              <div className="w-10 h-10 rounded-[1.5rem] border border-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-1000 shadow-2xl">
                <ArrowLeft size={16} />
              </div>
              <span className="font-tech text-xs tracking-[0.5em] font-black uppercase">EXIT_ADMIN</span>
          </button>
        </div>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 mb-24 md:mb-40 border-b border-black/5 pb-20 md:pb-32">
          <div className="max-w-5xl space-y-10">
            <div className="flex items-center space-x-6">
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
              <span className="font-tech text-indigo-600 opacity-60 text-xs tracking-[0.6em] font-black uppercase">VAULT_ADMIN_INTERFACE // SYNC_ACTIVE</span>
            </div>
            <h1 className="text-7xl md:text-9xl xl:text-[14rem] font-display italic tracking-tightest leading-[0.85] text-black">
              Control <span className="opacity-10 text-black font-sans italic">Core.</span>
            </h1>
            <div className="flex flex-wrap gap-8 md:gap-14 font-tech text-[10px] md:text-xs text-black/40 font-black uppercase tracking-[0.4em]">
              <div className="flex items-center space-x-4">
                 <div className="w-2 h-2 bg-black/10 rounded-full" />
                 <span>LOC: NEW_DELHI_HUB</span>
              </div>
              <div className="flex items-center space-x-4">
                 <div className="w-2 h-2 bg-black/10 rounded-full" />
                 <span>NODE: APAC_SOUTH_SYNC</span>
              </div>
              <div className="flex items-center space-x-4">
                 <div className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
                 <span>UPTIME: 99.998%</span>
              </div>
            </div>
          </div>

          <div className="w-full xl:w-auto overflow-x-auto no-scrollbar -mx-6 px-6 xl:mx-0 xl:px-0">
            <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-[3rem] border border-black/5 min-w-max shadow-inner">
              {[
                { id: 'stats', label: 'METRICS', icon: BarChart2, adminOnly: true },
                { id: 'orders', label: 'LOGISTICS', icon: Truck },
                { id: 'products', label: 'INVENTORY', icon: Package, adminOnly: true },
                { id: 'add', label: 'ARCHIVE', icon: Plus, adminOnly: true },
                { id: 'notifications', label: 'FEED', icon: Bell, urgent: notifications.some(n => !n.read) },
                { id: 'support', label: 'SUPPORT', icon: MessageSquare, urgent: supportChats.some(c => c.unreadByAdmin) },
                { id: 'broadcast', label: 'SIGNAL', icon: Megaphone, adminOnly: true },
                { id: 'banners', label: 'VISUALS', icon: Eye, adminOnly: true },
                { id: 'story_banners', label: 'STORY_FEED', icon: ImageIcon, adminOnly: true },
                { id: 'offers', label: 'PROMO_SCROLL', icon: Megaphone, adminOnly: true },
                { id: 'gallery', label: 'GALLERY', icon: ImageIcon, adminOnly: true },
                { id: 'coupons', label: 'PROTOCOLS', icon: Zap, adminOnly: true },
                { id: 'security', label: 'SECURE', icon: Shield, adminOnly: true },
              ].filter(tab => !tab.adminOnly || profile?.role === 'admin').map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setView(tab.id as any)}
                  className={`flex items-center space-x-4 px-10 py-5 rounded-[1.8rem] transition-all duration-1000 relative group ${view === tab.id ? 'bg-indigo-600 text-white shadow-[0_0_50px_rgba(79,70,229,0.2)] scale-105' : 'text-black/30 hover:bg-black/5 hover:text-black'}`}
                >
                  <tab.icon size={18} strokeWidth={view === tab.id ? 2 : 1} className={`transition-transform duration-1000 ${view === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="text-[10px] font-tech font-black uppercase tracking-[0.3em]">{tab.label}</span>
                  {(tab.id === 'notifications' || tab.id === 'support') && tab.urgent && (
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse absolute -top-1 -right-1 shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="min-h-[60vh] relative">
          {view === 'stats' && (
            <div className="space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
               {/* High Density Stats */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                 {[
                   { label: 'NET_REVENUE_STREAM', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, trend: '+14.2%', detail: 'CYCLE_STATUS: OPTIMAL' },
                   { label: 'ARCHIVE_MANIFESTS', value: stats.ordersCount, icon: ShoppingBag, trend: '+5', detail: 'QUEUED: 12' },
                   { label: 'VAULT_INDEX_RATE', value: `${stats.conversionRate}%`, icon: TrendingUp, trend: 'SYNCHRONIZED', detail: 'NETWORK_STABLE' },
                   { label: 'INVENTORY_RESERVE', value: `${products.length - stats.lowStock}/${products.length}`, icon: Database, alert: stats.lowStock > 0, detail: `${stats.lowStock} CRITICAL_NODES` },
                 ].map((stat, i) => (
                   <div key={i} className={`p-12 rounded-[4rem] border border-black/5 flex flex-col justify-between h-80 transition-all duration-1000 hover:bg-neutral-100 group relative overflow-hidden bg-neutral-50 luxury-shadow`}>
                     <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000 rotate-12 scale-150">
                        <stat.icon size={160} strokeWidth={1} />
                     </div>
                     <div className="relative z-10 flex justify-between items-start">
                       <div className="w-16 h-16 bg-black text-white rounded-[1.8rem] border border-black/5 flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000 shadow-xl">
                         <stat.icon size={26} strokeWidth={1} />
                       </div>
                       <div className="text-right">
                          <p className={`font-tech text-xs tracking-[0.3em] font-black ${stat.alert ? 'text-red-500 animate-pulse' : 'text-black/40'}`}>{stat.trend || (stat.alert ? 'CRITICAL' : 'NOMINAL')}</p>
                          <p className="font-tech text-black/10 text-[9px] mt-2 uppercase tracking-widest">Metric_Verified</p>
                       </div>
                     </div>
                     <div className="relative z-10">
                       <p className="font-tech text-black/20 mb-4 text-xs tracking-[0.5em] font-black uppercase">{stat.label}</p>
                       <h3 className="text-6xl font-display italic tracking-tightest mb-6 break-all leading-none text-black">{stat.value}</h3>
                       <div className="w-16 h-[1.5px] bg-black/10 mb-6" />
                       <p className="font-tech text-black/20 text-[10px] tracking-[0.3em] font-bold uppercase">{stat.detail}</p>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                  {/* Main Chart */}
                  <div className="lg:col-span-2 p-14 rounded-[5rem] border border-black/5 bg-neutral-50 luxury-shadow overflow-hidden group relative">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-all duration-1000">
                       <TrendingUp size={500} strokeWidth={1} className="text-black" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-20 gap-10 relative z-10">
                       <div className="space-y-6">
                          <div className="flex items-center space-x-6">
                             <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.3)]" />
                             <span className="font-tech text-indigo-600/30 text-xs tracking-[0.5em] font-black uppercase">TELEMETRY_SYNC // REVENUE_DYNAMICS</span>
                          </div>
                          <h3 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none text-black">Stream <span className="opacity-10 text-black font-sans italic">Analytics.</span></h3>
                       </div>
                       <div className="flex items-center space-x-6">
                          <div className="px-10 py-4 bg-indigo-600 text-white rounded-full text-xs font-tech font-black tracking-widest uppercase shadow-[0_0_30px_rgba(79,70,229,0.2)]">7_DAY_CYCLE</div>
                       </div>
                    </div>
                    <div className="h-[500px] relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="10 10" stroke="#00000005" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#00000010" 
                            fontSize={11} 
                            tickLine={false}
                            axisLine={false}
                            tick={{ dy: 20, fontStyle: 'italic', fontWeight: 'bold', fill: '#00000020' }}
                          />
                          <YAxis 
                            stroke="#00000010" 
                            fontSize={11} 
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                            tick={{ dx: -15, fontStyle: 'italic', fontWeight: 'bold', fill: '#00000020' }}
                          />
                          <Tooltip 
                            cursor={{ stroke: '#4f46e5', strokeWidth: 1.5, strokeDasharray: '12 12' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white text-black p-10 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-black/5 backdrop-blur-3xl space-y-3">
                                    <p className="font-tech text-[10px] text-indigo-600 tracking-[0.5em] mb-3 uppercase font-black">{payload[0].payload.name}</p>
                                    <p className="text-4xl font-display italic tracking-tightest leading-none">₹{payload[0].value?.toLocaleString()}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="sales" 
                            stroke="#4f46e5" 
                            strokeWidth={5}
                            fillOpacity={1} 
                            fill="url(#colorSales)" 
                            animationDuration={3000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Terminal Log / Activity */}
                  <div className="p-10 md:p-14 rounded-[5rem] border border-black/5 bg-white text-black overflow-hidden group relative flex flex-col justify-between shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none -rotate-12 translate-x-4 -translate-y-4">
                       <Zap className="w-80 h-80" strokeWidth={1} />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-12 pb-8 border-b border-black/10 relative z-10">
                        <div className="flex items-center space-x-6">
                           <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                           <span className="font-tech text-black/40 text-xs tracking-[0.4em] font-black uppercase">LIVE_DECODE</span>
                        </div>
                        <span className="font-tech text-indigo-600/20 text-[10px] font-bold tracking-widest">SECURE_SYNC</span>
                      </div>
                      <div className="space-y-8 max-h-[400px] overflow-y-auto no-scrollbar relative z-10 pr-4">
                         {(liveActivity.length > 0 ? liveActivity : notifications.slice(0, 8)).map((n, i) => (
                           <div key={i} className="flex gap-6 group border-l-2 border-black/5 pl-8 hover:border-indigo-600 transition-all duration-700">
                             <div className="flex-shrink-0 space-y-3">
                               <p className="font-tech text-black/10 text-[9px] uppercase tracking-widest">{new Date(n.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
                               <span className={`inline-block font-tech text-[8px] font-black tracking-widest px-3 py-1 rounded-full border ${n.type === 'order' || n.type === 'orders' ? 'text-indigo-600 border-indigo-600/20' : 'text-emerald-600 border-emerald-600/20'}`}>
                                 {n.type.toUpperCase()}
                               </span>
                             </div>
                             <p className="text-black/60 group-hover:text-black transition-colors text-[10px] leading-relaxed font-mono tracking-tight">{n.message}</p>
                           </div>
                         ))}
                         {liveActivity.length === 0 && notifications.length === 0 && (
                           <div className="text-center py-10 opacity-20">
                             <p className="font-tech text-[8px] tracking-[0.5em] uppercase">No activity detected.</p>
                           </div>
                         )}
                      </div>
                    </div>

                    <div className="mt-12 pt-10 border-t border-black/5 relative z-10">
                      <button 
                        onClick={() => setView('notifications')}
                        className="w-full py-6 bg-black/5 border border-black/5 rounded-[2.5rem] font-tech text-[10px] font-black tracking-[0.5em] uppercase hover:bg-black hover:text-white transition-all duration-1000"
                      >
                         SYNCHRONIZE_FULL_METRICS
                      </button>
                    </div>
                  </div>
               </div>
            </div>
           )}
           {view === 'products' && (
            <div className="space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20 border-b border-black/5 pb-16">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                       <div className="w-3 h-3 bg-black rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)]" />
                       <span className="font-tech text-black/30 text-xs tracking-[0.5em] font-black uppercase">ASSET_REGISTER // CURATION_SYSTEM</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none text-black">Collection <span className="opacity-10 text-black font-sans italic">Manifest.</span></h2>
                  </div>
                  <div className="flex gap-6 w-full md:w-auto items-center">
                    <div className="relative flex-grow md:w-80">
                      <input 
                        type="text" 
                        placeholder="SEARCH_MANIFEST..." 
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full bg-neutral-50 border border-black/5 rounded-full py-5 px-10 text-xs font-tech tracking-widest text-black outline-none focus:border-black/20 transition-all placeholder:text-black/10 uppercase"
                      />
                    </div>
                    <button onClick={handleSeed} className="px-10 py-5 border border-black/10 rounded-full font-tech text-xs font-black tracking-widest text-black/40 hover:bg-black hover:text-white transition-all duration-1000 active:scale-90 uppercase">GENERATE_SAMPLE_DATA</button>
                  </div>
               </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                  {products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase())).map((p) => (
                    <motion.div 
                      layout
                      key={p.id} 
                      className="group p-10 rounded-[4.5rem] border border-black/5 bg-white hover:bg-neutral-50 transition-all duration-1000 flex flex-col h-full relative overflow-hidden shadow-xl"
                    >
                       <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.08] transition-all duration-1000 rotate-12 scale-150 pointer-events-none">
                          <span className="font-display italic text-[12rem] leading-none text-black">{p.name.slice(0, 1)}</span>
                       </div>
                       
                       <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-neutral-100 mb-10 relative border border-black/5">
                          {p.images && p.images.length > 0 ? (
                            <img 
                               src={p.images[0]} 
                              alt={p.name}
                              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-black/5 p-4 relative overflow-hidden group-hover:bg-black/10 transition-colors">
                               <span className="font-display text-2xl text-white/10 group-hover:text-white/20 transition-all font-bold uppercase">{p.name?.[0] || 'D'}</span>
                               <div className="absolute inset-0 opacity-[0.02]" 
                                    style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-noir/80 opacity-0 group-hover:opacity-100 transition-all duration-1000 flex items-center justify-center backdrop-blur-sm">
                             <div className="text-center p-10 space-y-6">
                                <p className="font-tech text-xs text-gold/40 tracking-[0.5em] font-black uppercase">ASSET_VALUATION</p>
                                <p className="text-white text-4xl font-display italic tracking-tightest">STABLE_ROI</p>
                             </div>
                          </div>
                          <div className={`absolute top-8 right-8 px-5 py-2.5 rounded-full text-[10px] font-tech font-black tracking-[0.2em] border backdrop-blur-2xl transition-all duration-1000 ${p.stock < 5 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-noir/80 border-white/10 text-gold shadow-[0_0_15px_rgba(197,160,89,0.2)]'}`}>
                            {p.stock < 5 ? 'LOW_RESERVE' : 'OPTIMAL_SY'}
                          </div>
                       </div>

                       <div className="space-y-6 mb-12 flex-grow relative z-10">
                          <div className="flex items-center space-x-4">
                             <span className="font-tech text-gold/20 text-[10px] font-black tracking-[0.3em] uppercase">{p.category}</span>
                             <span className="w-2 h-2 bg-white/10 rounded-full" />
                             <span className="font-tech text-text/20 text-[10px] font-black tracking-[0.3em] uppercase">STOCK: {p.stock}</span>
                          </div>
                          <h4 className="text-4xl font-display italic tracking-tightest leading-tight group-hover:tracking-tight transition-all duration-1000 text-text/80 group-hover:text-gold">{p.name}</h4>
                          <div className="flex items-baseline space-x-4">
                             <p className="font-display text-5xl italic tracking-tightest leading-none text-gold">₹{p.price.toLocaleString()}</p>
                             <p className="font-tech text-[9px] text-text/10 font-black tracking-[0.4em] uppercase">VALUATION</p>
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-10 border-t border-white/5 mt-auto relative z-10">
                          <div className="flex space-x-4">
                             <button onClick={() => {setEditingStockId(p.id); setNewStockValue(p.stock.toString());}} className="w-16 h-16 rounded-[1.8rem] border border-white/5 bg-noir text-text/20 hover:text-gold hover:border-gold transition-all duration-1000 active:scale-90 group/edit flex items-center justify-center">
                                <Edit size={22} strokeWidth={1} className="group-hover/edit:rotate-12 transition-transform duration-700" />
                             </button>
                             <button onClick={() => handleDelete(p.id)} className="w-16 h-16 rounded-[1.8rem] bg-red-500/5 text-red-500/20 hover:bg-red-500/20 hover:text-red-500 border border-transparent hover:border-red-500/20 flex items-center justify-center transition-all duration-1000 active:scale-90 group/del">
                                <Trash2 size={22} strokeWidth={1} className="group-hover/del:scale-110 transition-transform duration-700" />
                             </button>
                          </div>
                          {editingStockId === p.id ? (
                             <div className="flex items-center space-x-6 animate-in fade-in slide-in-from-right-10 duration-1000">
                                <div className="space-y-1">
                                   <input 
                                     autoFocus
                                     type="number" 
                                     value={newStockValue} 
                                     onChange={e => setNewStockValue(e.target.value)} 
                                     className="w-24 bg-noir border border-gold/20 text-gold rounded-2xl px-6 py-3 font-mono text-xs outline-none shadow-[0_0_30px_rgba(197,160,89,0.1)]" 
                                   />
                                </div>
                                <button 
                                  onClick={() => handleUpdateStock(p.id)} 
                                  className="font-tech text-gold text-xs font-black tracking-[0.4em] uppercase hover:underline underline-offset-8 transition-all"
                                >
                                  COMMIT
                                </button>
                             </div>
                          ) : (
                             <div className="text-right">
                                <p className="font-tech text-[9px] text-text/10 font-black tracking-[0.3em] uppercase">SYNC_NOMINAL</p>
                                <p className="font-mono text-xs text-text/5 mt-1">LAT: 0.1ms</p>
                             </div>
                          )}
                       </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          )}

          {view === 'orders' && (
            <div className="space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20 border-b border-black/5 pb-16">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                       <div className="w-3 h-3 bg-black rounded-full shadow-xl" />
                       <span className="font-tech text-black/30 text-xs tracking-[0.5em] font-black uppercase">SALES_MANIFEST // TRANSACTION_LOGS</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none text-black">Global <span className="opacity-10 text-black font-sans italic">Acquisitions.</span></h2>
                  </div>
                  <div className="flex flex-col xl:flex-row gap-6 w-full xl:w-auto items-center">
                     <div className="relative w-full xl:w-80">
                        <input 
                          type="text"
                          placeholder="SEARCH_ACQUISITIONS..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          className="w-full bg-neutral-100 border border-black/5 rounded-full py-5 px-10 text-xs font-tech tracking-widest text-black outline-none focus:border-black/20 transition-all placeholder:text-black/10 uppercase"
                        />
                     </div>
                     <div className="flex bg-neutral-100 rounded-full border border-black/5 p-1.5 h-full overflow-x-auto no-scrollbar">
                        {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setOrderStatusFilter(status)}
                            className={`px-6 py-3 rounded-full text-[9px] font-tech font-black tracking-widest transition-all duration-700 uppercase whitespace-nowrap ${orderStatusFilter === status ? 'bg-black text-white shadow-xl' : 'text-black/20 hover:text-black'}`}
                          >
                            {status}
                          </button>
                        ))}
                     </div>
                     <div className="px-10 py-5 bg-neutral-100 border border-black/5 rounded-full text-xs font-tech font-black tracking-widest text-black/40 uppercase shadow-inner whitespace-nowrap">ACTIVE_NODES: {orders.length}</div>
                  </div>
               </div>

               <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
                  <div className="inline-block min-w-full align-middle">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-black/5">
                          <th className="font-tech text-xs text-black/20 text-left pb-12 pl-12 tracking-[0.5em] font-black uppercase font-black">IDENT_HEX</th>
                          <th className="font-tech text-xs text-black/20 text-left pb-12 tracking-[0.5em] font-black uppercase font-black">CLIENT_ENTITY</th>
                          <th className="font-tech text-xs text-black/20 text-left pb-12 tracking-[0.5em] font-black uppercase font-black">VALUATION</th>
                          <th className="font-tech text-xs text-black/20 text-left pb-12 tracking-[0.5em] font-black uppercase font-black">STATUS_CODE</th>
                          <th className="font-tech text-xs text-black/20 text-right pb-12 pr-12 tracking-[0.5em] font-black uppercase font-black">COMMANDS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-64 text-center text-black/10 font-tech text-sm tracking-[0.6em] font-black uppercase">
                               NO_ACQUISITIONS_PENDING_IN_BUFFER
                            </td>
                          </tr>
                        ) : (
                          orders
                           .filter(o => {
                             const matchesSearch = !orderSearch || o.customerName?.toLowerCase().includes(orderSearch.toLowerCase()) || o.id?.toLowerCase().includes(orderSearch.toLowerCase());
                             const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                             return matchesSearch && matchesStatus;
                           })
                           .map((o) => (
                            <tr key={o.id} className="group hover:bg-neutral-50 transition-all duration-700">
                              <td className="py-16 pl-12">
                                 <div className="flex items-center space-x-6">
                                    <div className="w-2.5 h-2.5 bg-black/10 rounded-full group-hover:bg-black group-hover:shadow-xl transition-all duration-1000" />
                                    <div>
                                       <p className="font-mono text-sm font-black text-black/40 tracking-tighter uppercase group-hover:text-black transition-colors">#{o.id.slice(-12).toUpperCase()}</p>
                                       <p className="font-tech text-[10px] text-black/20 mt-2 uppercase font-black tracking-widest">{new Date(o.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-16">
                                 <div className="space-y-2">
                                    <p className="font-display italic text-3xl leading-none tracking-tight text-black/80 group-hover:text-black transition-colors">{o.customerName || 'AUTHENTICATED_MEMBER'}</p>
                                    <p className="font-tech text-[10px] text-black/30 uppercase font-black tracking-widest">{o.customerEmail?.toUpperCase() || 'ANONYMOUS_ACQUISITION'}</p>
                                 </div>
                              </td>
                              <td className="py-16">
                                 <p className="font-display text-4xl italic tracking-tightest leading-none text-black">₹{o.total.toLocaleString()}</p>
                                 <p className="font-tech text-[9px] text-black/10 mt-3 uppercase font-black tracking-widest">INR_CURRENCY_NODE</p>
                              </td>
                              <td className="py-16">
                                 <div className="flex items-center space-x-6">
                                    <div className={`px-8 py-3 rounded-full text-xs font-tech font-black tracking-widest border transition-all duration-1000 ${
                                      o.status === 'delivered' ? 'bg-black text-white border-black shadow-xl' : 
                                      o.status === 'shipped' ? 'bg-white border-black/40 text-black' : 
                                      'bg-white border-black/10 text-black/40'
                                    }`}>
                                       {o.status.toUpperCase()}
                                    </div>
                                    <select 
                                      value={o.status} 
                                      onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                                      className="bg-transparent font-tech text-xs font-black tracking-[0.2em] opacity-0 group-hover:opacity-40 hover:opacity-100 transition-all cursor-pointer border-none outline-none appearance-none uppercase text-black"
                                    >
                                       {['pending', 'processing', 'quality_check', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s} className="bg-white text-black">{s.toUpperCase()}</option>)}
                                    </select>
                                 </div>
                              </td>
                              <td className="py-16 pr-12 text-right">
                                <div className="flex items-center justify-end space-x-6">
                                  <button 
                                    onClick={() => downloadReceipt(o)}
                                    className="w-16 h-16 rounded-[1.8rem] border border-black/5 bg-neutral-50 text-black/20 flex items-center justify-center hover:bg-black hover:shadow-xl hover:text-white transition-all duration-1000 group/btn active:scale-95"
                                    title="PRINT_MANIFEST"
                                  >
                                    <Printer size={22} strokeWidth={1} className="group-hover/btn:rotate-12 transition-transform duration-1000" />
                                  </button>
                                  <button 
                                    onClick={() => setSelectedOrder(o)}
                                    className="w-16 h-16 rounded-[1.8rem] border border-black/5 bg-neutral-50 text-black/20 flex items-center justify-center hover:bg-black hover:shadow-xl hover:text-white transition-all duration-1000 group/btn active:scale-95"
                                  >
                                    <Eye size={22} strokeWidth={1} className="group-hover/btn:scale-110 transition-transform duration-1000" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {view === 'story_banners' && (
            <div className="space-y-20 animate-in fade-in duration-1000">
               <div className="max-w-4xl space-y-12">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                       <div className="w-3 h-3 bg-black rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)]" />
                       <span className="font-tech text-black/30 text-xs tracking-[0.5em] font-black uppercase">STORY_ASSETS // BRAND_IMMERSION</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none text-black">Story <span className="opacity-10 text-black font-sans italic">Banners.</span></h2>
                  </div>
                  
                  <form onSubmit={handleAddStoryBanner} className="space-y-12 p-12 rounded-[5rem] border border-black/5 bg-neutral-50 shadow-xl relative overflow-hidden group">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                      <div className="space-y-6">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">DESKTOP_IMMERSIVE (21:9)</label>
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setStoryBannerFile(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} className="w-full text-xs font-tech text-black/40 file:mr-6 file:py-3 file:px-6 file:rounded-full file:border-black/5 file:bg-neutral-100 file:text-black file:text-[10px] file:font-black file:tracking-widest cursor-pointer hover:file:bg-black hover:file:text-white transition-all" />
                        {storyBannerFile && (
                          <div className="mt-4 aspect-video rounded-3xl overflow-hidden border border-black/10 bg-white">
                            <img src={storyBannerFile} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-6">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">MOBILE_IMMERSIVE (4:5)</label>
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setStoryBannerMobileFile(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} className="w-full text-xs font-tech text-black/40 file:mr-6 file:py-3 file:px-6 file:rounded-full file:border-black/5 file:bg-neutral-100 file:text-black file:text-[10px] file:font-black file:tracking-widest cursor-pointer hover:file:bg-black hover:file:text-white transition-all" />
                        {storyBannerMobileFile && (
                          <div className="mt-4 aspect-[4/5] w-32 mx-auto rounded-3xl overflow-hidden border border-black/10 bg-white">
                            <img src={storyBannerMobileFile} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4 relative z-10">
                      <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">DESTINATION_URL (OPTIONAL)</label>
                      <input value={storyBannerLink} onChange={e => setStoryBannerLink(e.target.value)} className="w-full bg-transparent border-b border-black/10 py-5 italic text-sm focus:border-black outline-none transition-all text-black" placeholder="/explore" />
                    </div>

                    <button type="submit" disabled={isSaving} className="w-full py-8 bg-black text-white font-tech text-xs tracking-[0.5em] font-black rounded-full hover:shadow-[0_0_50px_rgba(0,0,0,0.1)] transition-all duration-1000 uppercase relative z-10">
                      {isSaving ? 'DEPLOYING_STORY...' : 'INJECT_STORY_ASSET'}
                    </button>
                  </form>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {storyBanners.length === 0 && <p className="text-black/20 font-tech text-sm py-32 text-center col-span-full tracking-[0.5em]">NO_STORY_ASSETS_IN_FEED</p>}
                  {storyBanners.map((b, index) => (
                    <div key={b.id} className="group relative p-6 rounded-[3rem] border border-black/5 bg-white hover:border-black/10 transition-all duration-700 shadow-lg flex flex-col">
                       <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-neutral-100 mb-6 relative border border-black/5">
                          <img src={b.imageUrl} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" alt="Story Asset" />
                          <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 rounded-full text-[8px] font-tech font-black text-white tracking-widest backdrop-blur-md">#{index + 1}</div>
                       </div>
                       <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                             <button onClick={() => handleMoveStoryBanner(index, 'up')} disabled={index === 0} className="w-10 h-10 rounded-xl border border-black/5 bg-neutral-50 flex items-center justify-center text-black/20 hover:text-black disabled:opacity-30 transition-all"><ChevronLeft size={16} className="rotate-90" /></button>
                             <button onClick={() => handleMoveStoryBanner(index, 'down')} disabled={index === storyBanners.length - 1} className="w-10 h-10 rounded-xl border border-black/5 bg-neutral-50 flex items-center justify-center text-black/20 hover:text-black disabled:opacity-30 transition-all"><ChevronLeft size={16} className="-rotate-90" /></button>
                          </div>
                          <button onClick={() => handleDeleteStoryBanner(b.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white"><Trash2 size={16} strokeWidth={1.5} /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {view === 'banners' && (
            <div className="space-y-20 animate-in fade-in duration-1000">
               <div className="max-w-4xl space-y-12">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                       <div className="w-3 h-3 bg-gold rounded-full shadow-[0_0_15px_#c5a059]" />
                       <span className="font-tech text-gold/30 text-xs tracking-[0.5em] font-black uppercase">VISUAL_ASSETS // BRAND_EXPOSURE</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none">Promotional <span className="opacity-10 text-white font-sans italic">Banners.</span></h2>
                  </div>
                  
                  <form onSubmit={handleAddBanner} className="space-y-12 p-12 rounded-[5rem] border border-black/5 bg-neutral-50 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-all duration-1000">
                       <ImageIcon size={400} strokeWidth={1} className="text-black" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">HEADLINE_TXT</label>
                        <input value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="w-full bg-transparent border-b border-black/10 py-5 italic text-2xl focus:border-black outline-none transition-all text-black" placeholder="THE_LOST_COLLECTION" />
                      </div>
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">SUBHEAD_TXT</label>
                        <input value={bannerSubtitle} onChange={e => setBannerSubtitle(e.target.value)} className="w-full bg-transparent border-b border-black/10 py-5 italic text-sm focus:border-black outline-none transition-all text-black" placeholder="ARCHIVAL_RELEASE_2026" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                      <div className="space-y-6">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">DESKTOP_ASSET</label>
                        <input type="file" accept="image/*" onChange={handleBannerFileChange} className="w-full text-xs font-tech text-black/40 file:mr-6 file:py-3 file:px-6 file:rounded-full file:border-black/5 file:bg-neutral-100 file:text-black file:text-[10px] file:font-black file:tracking-widest cursor-pointer hover:file:bg-black hover:file:text-white transition-all" />
                        {bannerImageFile && (
                          <div className="mt-4 aspect-[21/9] rounded-2xl overflow-hidden border border-black/10">
                            <img src={bannerImageFile} alt="Desktop Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-6">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">MOBILE_ASSET</label>
                        <input type="file" accept="image/*" onChange={handleBannerMobileFileChange} className="w-full text-xs font-tech text-black/40 file:mr-6 file:py-3 file:px-6 file:rounded-full file:border-black/5 file:bg-neutral-100 file:text-black file:text-[10px] file:font-black file:tracking-widest cursor-pointer hover:file:bg-black hover:file:text-white transition-all" />
                        {bannerMobileImageFile && (
                          <div className="mt-4 aspect-[9/16] w-32 rounded-2xl overflow-hidden border border-black/10">
                            <img src={bannerMobileImageFile} alt="Mobile Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    <button type="submit" disabled={isSaving} className="w-full py-8 bg-indigo-600 text-white font-tech text-xs tracking-[0.5em] font-black rounded-full hover:shadow-[0_0_50px_rgba(79,70,229,0.3)] transition-all duration-1000 uppercase relative z-10">
                      {isSaving ? 'UPLOADING_VISUALS...' : 'DEPLOY_BRAND_ASSET'}
                    </button>
                  </form>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {banners.length === 0 && <p className="text-text/20 font-tech text-sm py-32 text-center col-span-2 tracking-[0.5em]">NO_ACTIVE_BANNERS_IN_FEED</p>}
                  {banners.map((b, index) => (
                    <div key={b.id} className="group relative p-8 rounded-[4rem] border border-white/5 bg-charcoal/20 hover:bg-charcoal transition-all duration-1000 luxury-shadow flex flex-col h-full">
                       <div className="aspect-[21/9] rounded-[2.5rem] overflow-hidden bg-noir mb-8 relative border border-white/5">
                          <div className="w-full h-full flex items-center justify-center bg-noir/20 p-8 border border-white/5 relative overflow-hidden group-hover:bg-noir/40 transition-colors">
                             <div className="text-center relative z-10">
                                <p className="font-mono text-gold text-[9px] tracking-widest uppercase font-bold mb-2">BANNER_ASSET</p>
                                <p className="font-display text-white/10 text-4xl italic font-bold">{b.title?.slice(0, 3).toUpperCase()}</p>
                             </div>
                             <div className="absolute inset-0 opacity-[0.05]" 
                                  style={{ backgroundImage: 'radial-gradient(#c5a059 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/20 to-transparent opacity-60" />
                          <div className="absolute bottom-6 left-8 space-y-2">
                             <p className="font-tech text-gold/40 text-[9px] tracking-[0.3em] font-black">PROMO_ID_{b.id.slice(-6).toUpperCase()}</p>
                             <h4 className="text-white text-3xl font-display italic tracking-tightest">{b.title}</h4>
                          </div>
                          <div className="absolute top-6 left-6 px-4 py-2 bg-noir/80 border border-white/10 rounded-full text-[8px] font-tech font-black text-gold tracking-widest backdrop-blur-xl">INDEX: {index + 1}</div>
                       </div>
                       <div className="flex items-center justify-between mt-auto">
                          <div className="flex space-x-4">
                             <button onClick={() => handleMoveBanner(index, 'up')} disabled={index === 0} className="w-14 h-14 rounded-[1.5rem] border border-white/5 bg-noir flex items-center justify-center text-text/20 hover:text-gold hover:border-gold disabled:opacity-5 transition-all duration-1000"><ChevronLeft size={20} className="rotate-90" /></button>
                             <button onClick={() => handleMoveBanner(index, 'down')} disabled={index === banners.length - 1} className="w-14 h-14 rounded-[1.5rem] border border-white/5 bg-noir flex items-center justify-center text-text/20 hover:text-gold hover:border-gold disabled:opacity-5 transition-all duration-1000"><ChevronLeft size={20} className="-rotate-90" /></button>
                          </div>
                          <button onClick={() => handleDeleteBanner(b.id)} className="w-14 h-14 rounded-[1.5rem] bg-red-500/5 border border-transparent hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/20 flex items-center justify-center transition-all duration-1000 text-red-500/20"><Trash2 size={20} strokeWidth={1} /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

           {view === 'offers' && (
             <div className="space-y-20 animate-in fade-in duration-1000">
                <div className="max-w-4xl space-y-12">
                   <div className="space-y-6">
                     <div className="flex items-center space-x-6">
                        <div className="w-3 h-3 bg-gold rounded-full shadow-[0_0_15px_#c5a059]" />
                        <span className="font-tech text-gold/30 text-xs tracking-[0.5em] font-black uppercase">COMMUNICATIONS // PROMO_FEED</span>
                     </div>
                     <h2 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none text-black">Promo <span className="opacity-10 text-black font-sans italic">Scroller.</span></h2>
                   </div>
                   
                   <form onSubmit={handleAddOffer} className="space-y-12 p-12 rounded-[5rem] border border-black/5 bg-neutral-50 shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-all duration-1000">
                        <Zap size={400} strokeWidth={1} className="text-black" />
                     </div>

                     <div className="space-y-12 relative z-10">
                       <div className="space-y-4">
                         <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">OFFER_TEXT</label>
                         <input 
                           value={offerText} 
                           onChange={e => setOfferText(e.target.value)} 
                           className="w-full bg-transparent border-b border-black/10 py-5 italic text-2xl focus:border-black outline-none transition-all text-black" 
                           placeholder="FREE_GLOBAL_ACQUISITION_DISPATCH" 
                           required
                         />
                       </div>
                       <div className="space-y-4">
                         <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">OFFER_IMAGE_URL (OPTIONAL)</label>
                         <input 
                           value={offerImageUrl} 
                           onChange={e => setOfferImageUrl(e.target.value)} 
                           className="w-full bg-transparent border-b border-black/10 py-5 italic text-sm focus:border-black outline-none transition-all text-black" 
                           placeholder="https://..." 
                         />
                       </div>
                       <div className="space-y-4">
                         <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">DESTINATION_LINK (OPTIONAL)</label>
                         <input 
                           value={offerLink} 
                           onChange={e => setOfferLink(e.target.value)} 
                           className="w-full bg-transparent border-b border-black/10 py-5 italic text-sm focus:border-black outline-none transition-all text-black" 
                           placeholder="/collections/grand-complications" 
                         />
                       </div>
                     </div>

                     <button type="submit" disabled={isSavingOffer} className="w-full py-8 bg-black text-white font-tech text-xs tracking-[0.5em] font-black rounded-full hover:shadow-[0_0_50px_rgba(0,0,0,0.1)] transition-all duration-1000 uppercase relative z-10">
                       {isSavingOffer ? 'TRANSMITTING...' : 'DEPLOY_SIGNAL'}
                     </button>
                   </form>
                </div>

                <div className="max-w-4xl space-y-6">
                   <h3 className="font-tech text-black/30 text-xs tracking-[0.5em] font-black uppercase px-6">Active_Feed</h3>
                   <div className="space-y-4">
                     {offers.length === 0 && <p className="text-black/20 font-tech text-sm py-20 text-center tracking-[0.5em] border border-black/5 rounded-[3rem]">NO_ACTIVE_SIGNALS</p>}
                     {offers.map((offer) => (
                       <div key={offer.id} className="group flex items-center justify-between p-8 rounded-[3rem] border border-black/5 bg-neutral-50 hover:bg-neutral-100 transition-all duration-700 luxury-shadow">
                         <div className="flex items-center space-x-10">
                            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center">
                               <Megaphone size={16} className="text-black/40" />
                            </div>
                            <div>
                               <p className="text-2xl font-display italic tracking-tightest text-black">{offer.text}</p>
                               <p className="font-tech text-black/20 text-[9px] uppercase tracking-widest mt-1">LINK: {offer.link || 'NONE'}</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => handleDeleteOffer(offer.id)}
                           className="w-14 h-14 rounded-2xl bg-red-500/5 hover:bg-red-500/20 text-red-500 opacity-20 group-hover:opacity-100 transition-all duration-700 flex items-center justify-center"
                         >
                           <Trash2 size={20} strokeWidth={1} />
                         </button>
                       </div>
                     ))}
                   </div>
                </div>
             </div>
          )}

          {view === 'gallery' && (
             <div className="space-y-20 animate-in fade-in duration-1000">
                <div className="max-w-4xl space-y-6">
                   <div className="flex items-center space-x-6">
                      <div className="w-3 h-3 bg-black rounded-full" />
                      <span className="font-tech text-black/30 text-xs tracking-[0.5em] font-black uppercase">VISUAL_ASSETS // GALLERY_INDEX</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <h2 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none text-black">Gallery <span className="opacity-10 text-black font-sans italic">Curator.</span></h2>
                      {!isAddingGallery && (
                        <button 
                          onClick={() => setIsAddingGallery(true)}
                          className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 transition-all duration-700 luxury-shadow"
                        >
                           <Plus size={32} strokeWidth={1} />
                        </button>
                      )}
                   </div>
                </div>

                {isAddingGallery && (
                  <div className="max-w-4xl space-y-12 animate-in slide-in-from-top duration-700">
                    <form onSubmit={handleAddGalleryItem} className="space-y-12 p-12 rounded-[5rem] border border-black/5 bg-neutral-50 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-all duration-1000">
                          <ImageIcon size={400} strokeWidth={1} className="text-black" />
                      </div>

                      <div className="space-y-12 relative z-10">
                          <div className="flex justify-between items-center">
                             <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">Asset_Source</label>
                             <button onClick={() => setIsAddingGallery(false)} className="text-black/40 hover:text-black transition-colors">
                                <X size={20} />
                             </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                             <div className="space-y-8">
                                <div className="aspect-[4/5] rounded-[3rem] border-2 border-dashed border-black/10 flex flex-col items-center justify-center space-y-6 bg-white overflow-hidden relative group/upload">
                                   {galleryImageUrl ? (
                                     <>
                                       <img src={galleryImageUrl} className="w-full h-full object-cover" alt="Preview" />
                                       <button 
                                         type="button"
                                         onClick={() => setGalleryImageUrl('')}
                                         className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-black/80 text-white flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity"
                                       >
                                          <X size={16} />
                                       </button>
                                     </>
                                   ) : (
                                     <>
                                       <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center">
                                          <Upload size={32} strokeWidth={1} className="text-black/40" />
                                       </div>
                                       <div className="text-center">
                                          <p className="font-tech text-[10px] tracking-widest text-black/40 uppercase font-black">Drop_Asset_Here</p>
                                          <p className="font-mono text-[8px] text-black/20 uppercase mt-2">OR CLICK TO BROWSE</p>
                                       </div>
                                       <input 
                                         type="file" 
                                         accept="image/*"
                                         onChange={handleFileUpload}
                                         className="absolute inset-0 opacity-0 cursor-pointer" 
                                       />
                                     </>
                                   )}
                                </div>
                                
                                <div className="space-y-4">
                                   <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">Alt_URL (Fallback)</label>
                                   <input 
                                     value={galleryImageUrl} 
                                     onChange={e => setGalleryImageUrl(e.target.value)} 
                                     className="w-full bg-transparent border-b border-black/10 py-5 italic text-[10px] focus:border-black outline-none transition-all text-black" 
                                     placeholder="https://..." 
                                   />
                                </div>
                             </div>

                             <div className="space-y-12 py-6">
                                <div className="space-y-4">
                                   <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">Label_Initials</label>
                                   <input 
                                     value={galleryLabel} 
                                     onChange={e => setGalleryLabel(e.target.value)} 
                                     className="w-full bg-transparent border-b border-black/10 py-5 italic text-5xl font-display focus:border-black outline-none transition-all text-black uppercase" 
                                     placeholder="DS" 
                                     maxLength={2}
                                   />
                                </div>
                                <div className="space-y-4">
                                   <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">Aspect_Orientation</label>
                                   <div className="grid grid-cols-3 gap-4">
                                      {[
                                        { id: 'aspect-square', label: '1:1', desc: 'Square' },
                                        { id: 'aspect-[3/4]', label: '3:4', desc: 'Portrait' },
                                        { id: 'aspect-[4/5]', label: '4:5', desc: 'Detailed' }
                                      ].map((opt) => (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => setGalleryAspect(opt.id as any)}
                                          className={`py-8 rounded-3xl border transition-all duration-700 flex flex-col items-center space-y-2 ${galleryAspect === opt.id ? 'bg-black border-black text-white shadow-xl' : 'bg-white border-black/5 text-black/40 hover:border-black/10'}`}
                                        >
                                           <span className="font-display text-xl">{opt.label}</span>
                                           <span className="font-tech text-[8px] tracking-[0.2em] font-black uppercase">{opt.desc}</span>
                                        </button>
                                      ))}
                                   </div>
                                </div>
                                <div className="pt-12">
                                  <button type="submit" disabled={isSavingGallery} className="w-full py-8 bg-black text-white font-tech text-xs tracking-[0.5em] font-black rounded-full hover:shadow-[0_0_50px_rgba(0,0,0,0.1)] transition-all duration-1000 uppercase">
                                    {isSavingGallery ? 'SYNC_IN_PROGRESS...' : 'COMMIT_TO_INDEX'}
                                  </button>
                                </div>
                             </div>
                          </div>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-12">
                   {!isAddingGallery && (
                      <button 
                        onClick={() => setIsAddingGallery(true)}
                        className="group relative rounded-[2rem] border-2 border-dashed border-black/5 flex flex-col items-center justify-center space-y-4 hover:border-black/20 hover:bg-black/5 transition-all duration-1000 aspect-square"
                      >
                         <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center transform group-hover:scale-110 transition-transform duration-700">
                            <Plus size={20} />
                         </div>
                         <span className="font-tech text-[8px] tracking-[0.4em] font-black uppercase text-black/20 group-hover:text-black/40">Append_Visual</span>
                      </button>
                   )}
                   
                   {galleryItems.map((item, i) => (
                      <div 
                        key={item.id} 
                        className={`group relative rounded-[2rem] border border-black/5 overflow-hidden transition-all duration-1000 bg-neutral-50 luxury-shadow flex items-center justify-center ${item.aspect} ${i === 3 ? 'md:-mt-20' : ''}`}
                      >
                         {item.imageUrl ? (
                            <>
                              <img src={item.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110" alt={item.label} />
                              <div className="absolute top-6 left-6 font-tech text-[10px] tracking-[0.4em] font-black uppercase text-black/10 group-hover:text-white/40 transition-colors pointer-events-none z-10">{item.label}</div>
                            </>
                         ) : (
                            <div className="font-display text-6xl opacity-[0.03] select-none group-hover:opacity-[0.08] transition-opacity duration-1000 uppercase">{item.label}</div>
                         ) }
                         
                         {/* Asset ID Tag (Matched to Frontend) */}
                         <div className="absolute bottom-6 right-6 font-mono text-[8px] text-black/10 group-hover:text-white/40 transition-colors uppercase font-black z-10">Asset_{i}</div>

                         {/* Curator Controls */}
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 flex flex-col items-center justify-center space-y-4 z-20">
                            <div className="text-center space-y-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                               <p className="font-tech text-white text-[10px] tracking-[0.5em] font-black uppercase">{item.label || 'UNTITLED'}</p>
                               <p className="font-mono text-white/40 text-[8px] uppercase tracking-widest">{item.aspect}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteGalleryItem(item.id)}
                              className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                            >
                               <Trash2 size={20} strokeWidth={1} />
                            </button>
                         </div>
                         <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                      </div>
                   ))}
                </div>
             </div>
          )}

          {view === 'broadcast' && (
            <div className="max-w-4xl animate-in fade-in duration-1000 space-y-20">
               <div className="space-y-12">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                       <div className="w-3 h-3 bg-black rounded-full shadow-xl" />
                       <span className="font-tech text-black/30 text-xs tracking-[0.5em] font-black uppercase">COMMS_TERMINAL // GLOBAL_PULSE</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none text-black">Transmit <span className="opacity-10 text-black font-sans italic">Broadcast.</span></h2>
                  </div>
                  
                  <form onSubmit={handleBroadcast} className="space-y-12 p-12 rounded-[5rem] border border-black/5 bg-neutral-50 luxury-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-all duration-1000">
                       <Megaphone size={400} strokeWidth={1} className="text-black" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">TRANSMISSION_TITLE</label>
                        <input 
                          value={broadcastTitle} 
                          onChange={e => setBroadcastTitle(e.target.value)} 
                          className="w-full bg-transparent border-b border-black/10 py-5 focus:border-black outline-none transition-all font-display italic text-2xl text-black" 
                          placeholder="EXCLUSIVE_HOROLOGY_EVENT" 
                          required
                        />
                      </div>
                      <div className="space-y-6">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">SIGNAL_TYPE</label>
                        <div className="flex flex-wrap gap-3 pt-2">
                          {['offer', 'trending', 'new_arrival', 'general'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setBroadcastType(type as any)}
                              className={`px-6 py-2.5 rounded-full text-[10px] font-tech font-black transition-all border tracking-widest uppercase ${broadcastType === type ? 'bg-black text-white border-black shadow-xl' : 'border-black/10 text-black/30 hover:border-black/30'}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                      <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">MANIFEST_BODY</label>
                      <textarea 
                        value={broadcastMessage} 
                        onChange={e => setBroadcastMessage(e.target.value)} 
                        className="w-full bg-white border border-black/5 rounded-[2.5rem] p-10 focus:border-black outline-none transition-all h-56 italic text-xl text-black/80 shadow-inner resize-none" 
                        placeholder="Detail the acquisition opportunity..."
                        required
                      />
                    </div>

                    <div className="space-y-4 relative z-10">
                      <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">TARGET_LINK_URI</label>
                      <input 
                        value={broadcastLink} 
                        onChange={e => setBroadcastLink(e.target.value)} 
                        className="w-full bg-transparent border-b border-black/10 py-5 focus:border-black outline-none transition-all font-tech text-xs text-black/40 tracking-[0.2em]" 
                        placeholder="/MASTERPIECE/ID_00X" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSaving} 
                      className="w-full py-8 bg-black text-white font-tech text-xs tracking-[0.6em] font-black rounded-full hover:shadow-xl transition-all duration-1000 uppercase relative z-10"
                    >
                      {isSaving ? 'TRANSMITTING...' : 'EXECUTE_GLOBAL_PULSE'}
                    </button>
                  </form>
               </div>
            </div>
          )}

          {view === 'add' && (
            <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-10 duration-1000 space-y-20">
               <div className="space-y-12">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                       <div className="w-3 h-3 bg-black rounded-full shadow-xl" />
                       <span className="font-tech text-black/30 text-xs tracking-[0.5em] font-black uppercase">PROTOCOL // ARCHIVE_INITIATION</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none text-black">Register <span className="opacity-10 text-black font-sans italic">New Asset.</span></h2>
                  </div>
                  
                  <form onSubmit={handleAddProduct} className="space-y-12 md:space-y-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">IDENTIFIER_NAME</label>
                        <input 
                          value={name} onChange={e => setName(e.target.value)}
                          className="w-full bg-transparent border-b border-black/10 px-0 py-6 focus:border-black outline-none transition-all font-display italic text-3xl md:text-4xl text-black"
                          placeholder="PHANTOM_GHOST" required
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">BRAND_MANIFEST_NAME</label>
                        <input 
                          value={brand} onChange={e => setBrand(e.target.value)}
                          className="w-full bg-transparent border-b border-black/10 px-0 py-6 focus:border-black outline-none transition-all font-display italic text-3xl md:text-4xl text-black"
                          placeholder="DINOSPY" required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">VALUATION_INR</label>
                        <input 
                          type="number" value={price} onChange={e => setPrice(e.target.value)}
                          className="w-full bg-transparent border-b border-black/10 px-0 py-6 focus:border-black outline-none transition-all font-mono text-3xl md:text-4xl text-black"
                          placeholder="000,000" required
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">STOCK_QUANTITY</label>
                        <input 
                          type="number" value={stock} onChange={e => setStock(e.target.value)}
                          className="w-full bg-transparent border-b border-black/10 px-0 py-6 focus:border-black outline-none transition-all font-mono text-3xl md:text-4xl text-black"
                          placeholder="10" required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20">
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">DISCOUNT_%</label>
                        <input 
                          type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                          className="w-full bg-transparent border-b border-black/10 px-0 py-6 focus:border-black outline-none transition-all font-mono text-2xl text-black/60"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">CLASSIFICATION</label>
                        <select 
                          value={category} onChange={e => setCategory(e.target.value)}
                          className="w-full bg-transparent border-b border-black/10 px-0 py-6 focus:border-black outline-none transition-all cursor-pointer font-tech text-xs tracking-[0.2em] uppercase text-black/80"
                        >
                          {['Grand Complications', 'Heritage', 'Avant-Garde', 'Deep Sea'].map(cat => (
                            <option key={cat} value={cat} className="bg-white text-black">{cat.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20">
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">CASE_MATERIAL</label>
                        <input 
                          type="text" value={specsCase} onChange={e => setSpecsCase(e.target.value)}
                          className="w-full bg-transparent border-b border-black/10 px-0 py-6 focus:border-black outline-none transition-all font-mono text-xl text-black/60"
                          placeholder="e.g. 18k Rose Gold"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">CALIBER_MOVEMENT</label>
                        <input 
                          type="text" value={specsMovement} onChange={e => setSpecsMovement(e.target.value)}
                          className="w-full bg-transparent border-b border-black/10 px-0 py-6 focus:border-black outline-none transition-all font-mono text-xl text-black/60"
                          placeholder="e.g. Automatic Self-Winding"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">CRYSTAL_COMPOSITION</label>
                        <input 
                          type="text" value={specsCrystal} onChange={e => setSpecsCrystal(e.target.value)}
                          className="w-full bg-transparent border-b border-black/10 px-0 py-6 focus:border-black outline-none transition-all font-mono text-xl text-black/60"
                          placeholder="e.g. Sapphire Crystal"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
                      <div className="space-y-6">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">VISUAL_ASSETS</label>
                        <div className="relative group/upload">
                          <input 
                            type="file" multiple accept="image/*" onChange={handleFileChange}
                            className="opacity-0 absolute inset-0 cursor-pointer z-10"
                          />
                          <div className="border border-dashed border-black/10 rounded-[3rem] p-16 text-center bg-neutral-50 group-hover/upload:border-black group-hover/upload:bg-neutral-100 transition-all duration-1000 shadow-xl">
                             <Plus className="mx-auto mb-6 text-black/20 group-hover/upload:text-black group-hover/upload:scale-125 transition-all duration-700" size={32} />
                             <p className="text-xs font-tech text-black/40 tracking-[0.3em] font-black uppercase">UPLOAD_MASTER_IMAGES</p>
                             {imageFiles.length > 0 && (
                               <div className="mt-8 grid grid-cols-4 gap-4">
                                 {imageFiles.map((img, i) => (
                                   <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-black/10 relative group/img">
                                     <img src={img} alt="Staged" className="w-full h-full object-cover" />
                                     <button 
                                       type="button"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         setImageFiles(prev => prev.filter((_, idx) => idx !== i));
                                       }}
                                       className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all text-white"
                                     >
                                       <X size={12} strokeWidth={3} />
                                     </button>
                                   </div>
                                 ))}
                               </div>
                             )}
                             {imageFiles.length > 0 && (
                               <motion.p 
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="text-[10px] text-black mt-6 font-mono font-bold tracking-widest"
                               >
                                 {imageFiles.length}_ASSETS_STAGED_FOR_SYNC
                               </motion.p>
                             )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">SOURCE_URL_REDIRECT</label>
                        <input 
                          value={image} onChange={e => setImage(e.target.value)}
                          className="w-full bg-transparent border-b border-black/10 px-0 py-6 focus:border-black outline-none transition-all font-tech text-[10px] text-black/40 tracking-[0.1em]"
                          placeholder="HTTPS://MANIFEST_ASSET_URI..."
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="font-tech text-black/30 text-[10px] tracking-[0.4em] font-black uppercase">CRITICAL_DESCRIPTION</label>
                      <textarea 
                        value={description} onChange={e => setDescription(e.target.value)}
                        className="w-full bg-neutral-50 border border-black/5 rounded-[3rem] p-10 focus:border-black outline-none transition-all h-64 italic text-xl md:text-2xl text-black/80 shadow-inner resize-none leading-relaxed"
                        placeholder="Detail the horological complexity and craftsmanship..." required
                      />
                    </div>

                    <div className="flex flex-wrap gap-8 md:gap-14 items-center border-t border-white/5 pt-12 md:pt-16">
                      {[
                        { label: 'TRENDING', state: isTrending, set: setIsTrending },
                        { label: 'NEW_ARRIVAL', state: isNewArrival, set: setIsNewArrival },
                        { label: 'ACTIVE_OFFER', state: isOffer, set: setIsOffer },
                        { label: 'AUTO_BROADCAST', state: shouldAutoBroadcast, set: setShouldAutoBroadcast, urgent: true },
                      ].map((check, i) => (
                        <label key={i} className="flex items-center space-x-4 cursor-pointer group">
                          <div className={`w-5 h-5 rounded-[0.6rem] border flex items-center justify-center transition-all duration-700 ${check.state ? 'bg-gold border-gold shadow-[0_0_15px_rgba(197,160,89,0.3)]' : 'border-white/10 group-hover:border-gold'}`}>
                             {check.state && <Check size={12} strokeWidth={4} className="text-noir" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={check.state} onChange={e => check.set(e.target.checked)} />
                          <span className={`font-tech text-[10px] font-black tracking-[0.2em] transition-colors duration-700 ${check.state ? 'text-text' : 'text-text/20 group-hover:text-gold/60'} ${check.urgent && check.state && 'text-gold'}`}>{check.label}</span>
                        </label>
                      ))}
                    </div>

                    <button type="submit" disabled={isSaving} className="w-full py-8 md:py-10 bg-black text-white font-tech text-xs md:text-sm tracking-[0.6em] font-black rounded-full hover:shadow-2xl transition-all duration-1000 disabled:opacity-50 uppercase relative z-10">
                      {isSaving ? 'EXECUTING_PARALLEL_SYNC...' : 'ARCHIVE_COLLECTION_DATA'}
                    </button>
                  </form>
               </div>
            </div>
          )}

          {view === 'notifications' && (
            <div className="space-y-20 animate-in fade-in duration-1000">
               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-16">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                       <div className="w-3 h-3 bg-gold rounded-full shadow-[0_0_15px_#c5a059]" />
                       <span className="font-tech text-gold/30 text-xs tracking-[0.5em] font-black uppercase">INTELLIGENCE_FEED // SYSTEM_SCAN</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none">System <span className="opacity-10 text-white font-sans italic">Alerts.</span></h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                     <div className="flex items-center p-1.5 bg-charcoal/40 border border-white/5 rounded-2xl luxury-shadow">
                        {(['all', 'orders', 'inventory'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setNotificationFilter(f)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-tech font-black tracking-widest uppercase transition-all ${notificationFilter === f ? 'bg-gold text-noir shadow-[0_0_15px_rgba(197,160,89,0.3)]' : 'text-text/30 hover:text-text'}`}
                          >
                            {f}
                          </button>
                        ))}
                     </div>
                     <button 
                       onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                       className="font-tech text-[10px] text-gold/30 hover:text-gold tracking-[0.3em] font-black uppercase transition-all"
                     >
                       MARK_READ_ALL
                     </button>
                  </div>
               </div>

               <div className="space-y-6">
                 {notifications.filter(n => notificationFilter === 'all' || n.type === notificationFilter).length === 0 ? (
                   <div className="text-center py-48 rounded-[4rem] border border-dashed border-white/5 bg-white/[0.01] luxury-shadow">
                     <Bell className="mx-auto text-white/5 mb-8" size={80} strokeWidth={0.5} />
                     <p className="font-tech text-xs text-text/20 tracking-[0.5em] font-black uppercase">NO_ACTIVE_SIGNALS_DETECTED</p>
                   </div>
                 ) : (
                   notifications
                     .filter(n => notificationFilter === 'all' || n.type === notificationFilter)
                     .map((n) => (
                     <motion.div 
                       key={n.id} 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className={`p-10 rounded-[3rem] border transition-all duration-1000 group flex flex-col md:flex-row items-start md:items-center justify-between gap-8 ${n.read ? 'border-white/5 bg-transparent opacity-30 saturation-0' : 'border-white/10 bg-charcoal/20 luxury-shadow hover:bg-charcoal/40'}`}
                     >
                        <div className="flex items-center space-x-8">
                           <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center relative overflow-hidden ${n.type === 'orders' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              <div className="absolute inset-0 opacity-10 animate-pulse bg-current" />
                              {n.type === 'orders' ? <ShoppingBag size={24} strokeWidth={1} /> : <AlertCircle size={24} strokeWidth={1} />}
                           </div>
                           <div>
                              <div className="flex items-center space-x-4 mb-2">
                                 <span className="font-tech text-gold/40 text-[9px] tracking-[0.3em] font-black uppercase">{n.type}</span>
                                 <div className="w-1 h-1 bg-white/20 rounded-full" />
                                 <span className="font-tech text-text/20 text-[9px] tracking-[0.2em]">{new Date(n.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <h4 className="text-xl font-bold text-text tracking-tight">{n.message}</h4>
                              {n.total && <p className="font-tech text-[10px] text-gold/60 mt-2 tracking-[0.2em] font-black uppercase">LOGGED_VALUE: ₹{n.total.toLocaleString()}</p>}
                           </div>
                        </div>
                        <div className="flex items-center space-x-4 ml-auto">
                           {n.orderId && (
                             <button onClick={() => {const o = orders.find(ord => ord.id === n.orderId); if (o) {setSelectedOrder(o); setView('orders');}}} className="w-14 h-14 rounded-full border border-white/10 bg-slate-950 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all duration-700 text-slate-100/40 hover:border-indigo-600 luxury-shadow group/eye">
                                <Eye size={20} strokeWidth={1} className="group-hover/eye:scale-110 transition-transform" />
                             </button>
                           )}
                           {!n.read && (
                             <button onClick={() => setNotifications(notifications.map(notif => notif.id === n.id ? {...notif, read: true} : notif))} className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-110 hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] transition-all duration-700 luxury-shadow group/check">
                                <Check size={20} strokeWidth={4} />
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-noir/80 backdrop-blur-2xl animate-in fade-in duration-1000">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white max-w-5xl w-full rounded-[5rem] shadow-2xl overflow-hidden border border-black/10 relative"
              >
                <div className="p-12 md:p-16 border-b border-black/5 flex justify-between items-center bg-neutral-50">
                   <div className="space-y-4">
                     <div className="flex items-center space-x-6">
                        <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                        <p className="font-tech text-black/40 text-xs tracking-[0.4em] font-black uppercase">LOGISTICS_MANIFEST // ID_{selectedOrder.id.slice(-12).toUpperCase()}</p>
                     </div>
                     <h2 className="text-5xl md:text-7xl font-display italic tracking-tightest leading-none text-black">Fulfillment <span className="opacity-10 font-sans italic text-black">Center.</span></h2>
                   </div>
                   <button 
                     onClick={() => setSelectedOrder(null)} 
                     className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:bg-black hover:text-white transition-all duration-1000 group/close active:scale-95 border border-black/5"
                   >
                     <X size={32} strokeWidth={1} className="group-hover/close:rotate-90 transition-transform duration-1000" />
                   </button>
                </div>
                
                <div className="p-12 md:p-16 space-y-16 max-h-[70vh] overflow-y-auto no-scrollbar scroll-smooth">
                   {/* Industrial Shipping Label */}
                   <div id="shipping-label" className="bg-white text-black p-16 md:p-24 rounded-[4rem] shadow-2xl relative border-t-[20px] border-black font-mono overflow-hidden group/label">
                      {/* Sealed Watermark */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none -rotate-45 font-black text-[200px] whitespace-nowrap select-none">
                         VAULT_SEALED
                      </div>
                      
                      <div className="flex justify-between items-start border-b-2 border-black/5 pb-12 mb-12 relative z-10">
                         <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                               <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">
                                  <Lock size={20} />
                               </div>
                               <p className="text-xs text-black/40 tracking-[0.5em] font-black uppercase">ORIGIN_FACILITY // GENEVA_ALPHA</p>
                            </div>
                            <h3 className="text-4xl font-black italic tracking-widest leading-none">DINOSPY_<span className="opacity-20 uppercase font-sans">HQ.</span></h3>
                            <p className="text-[10px] opacity-30 font-tech tracking-[0.4em] text-black">LOGISTICS_CORE // SECURITY_LEVEL_05</p>
                         </div>
                         <div className="flex flex-col items-end space-y-6">
                            <div className="p-4 bg-white rounded-3xl shadow-xl border border-black/5">
                               <QRCodeSVG value={`ACQ_AUTH_${selectedOrder.id}`} size={120} fgColor="#000000" bgColor="transparent" />
                            </div>
                            <p className="text-[8px] font-black text-black/20 tracking-[0.5em] uppercase">SYSTEM_AUTH_TAG</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-20 relative z-10">
                         <div className="space-y-10">
                            <div>
                               <p className="text-[10px] text-black/30 tracking-[0.4em] font-black uppercase mb-6 flex items-center space-x-3">
                                  <User size={12} />
                                  <span>CONSIGNEE_DATA</span>
                               </p>
                               <div className="space-y-2">
                                  <h3 className="text-5xl font-black italic uppercase tracking-tighter text-black">{selectedOrder.customerName}</h3>
                                  <p className="font-tech text-xs tracking-widest text-black/40 font-black">{selectedOrder.customerEmail?.toUpperCase()}</p>
                               </div>
                            </div>
                            <div>
                               <p className="text-[10px] text-black/30 tracking-[0.4em] font-black uppercase mb-6 flex items-center space-x-3">
                                  <Truck size={12} />
                                  <span>DELIVERY_TERMINUS</span>
                               </p>
                               <div className="space-y-4 text-2xl font-bold tracking-tighter text-black/80 leading-relaxed max-w-md">
                                  <p className="truncate underline decoration-black/5 decoration-2 underline-offset-8">{selectedOrder.shippingAddress.address}</p>
                                  <p className="font-black text-indigo-600 tracking-widest text-3xl">{selectedOrder.shippingAddress.city}_IND // {selectedOrder.shippingAddress.zip}</p>
                               </div>
                            </div>
                         </div>
                         
                         <div className="space-y-10 border-l border-black/5 pl-10 h-full">
                            <div>
                               <p className="text-[10px] text-black/30 tracking-[0.4em] font-black uppercase mb-8">ASSET_MANIFEST</p>
                               <div className="space-y-6 font-tech">
                                  {selectedOrder.items.map((it: any, idx: number) => (
                                     <div key={idx} className="flex justify-between items-center group/item border-b border-black/[0.03] pb-4">
                                        <div className="flex items-center space-x-6">
                                           <span className="w-8 h-8 rounded-lg bg-black text-white text-[10px] flex items-center justify-center font-black">0{it.quantity}X</span>
                                           <span className="font-black italic tracking-[0.1em] group-hover:text-indigo-600 transition-colors uppercase text-xl">{it.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-black/20">ITEM_STAGED</span>
                                     </div>
                                  ))}
                                </div>
                            </div>
                            <div className="pt-6">
                               <div className="flex justify-between items-end">
                                  <div className="space-y-2">
                                     <p className="text-[10px] text-black/30 tracking-[0.4em] font-black uppercase">NET_VALUATION</p>
                                     <p className="text-5xl font-black italic tracking-tightest">₹{selectedOrder.total?.toLocaleString()}</p>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-[10px] text-black/30 tracking-[0.4em] font-black uppercase mb-2">SECURE_PIN</p>
                                     <p className="text-3xl font-black tracking-[0.3em] font-mono text-indigo-600">{selectedOrder.deliveryPin || 'SYNCING'}</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex justify-between items-center border-t-2 border-black/5 pt-12 relative z-10">
                         <div className="flex flex-col">
                            <p className="text-[10px] text-black/30 tracking-[0.5em] font-black uppercase mb-6 flex items-center space-x-3">
                               <ShieldCheck size={12} />
                               <span>AUTHENTICATION_TAG</span>
                            </p>
                            <p className="text-6xl md:text-7xl font-black italic tracking-widest text-black">VAULT-{selectedOrder.id.slice(-10).toUpperCase()}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] text-black/10 font-bold uppercase tracking-[0.6em] mb-4">LEGAL_RESERVE_RIGHTS</p>
                            <div className="flex items-center justify-end space-x-10">
                               <div className="flex flex-col items-center">
                                  <ShieldCheck size={24} className="text-black/10" />
                                  <span className="text-[6px] tracking-widest text-black/20 mt-2 font-black">AUTHENTIC</span>
                               </div>
                               <div className="flex flex-col items-center">
                                  <Activity size={24} className="text-black/10" />
                                  <span className="text-[6px] tracking-widest text-black/20 mt-2 font-black">VERIFIED</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-4 items-stretch justify-center mt-12 pb-12">
                    <button 
                      onClick={() => downloadReceipt(selectedOrder)}
                      className="flex-1 flex items-center justify-center space-x-4 py-8 rounded-[2.5rem] border border-black/10 bg-white hover:bg-black hover:text-white active:scale-95 transition-all duration-700 font-tech text-[10px] font-black tracking-widest uppercase group/print"
                    >
                      <Printer size={18} strokeWidth={1} className="group-hover/print:rotate-12 transition-transform" />
                      <span>PRINT_MANIFEST</span>
                    </button>
                    <button 
                      onClick={() => handeShipOrder(selectedOrder.id)}
                      disabled={isSaving || selectedOrder.status === 'shipped' || selectedOrder.status === 'cancelled'}
                      className="flex-1 flex items-center justify-center space-x-4 py-8 rounded-[2.5rem] bg-black text-white hover:shadow-[0_0_40px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-700 font-tech text-[10px] font-black tracking-widest uppercase group/dispatch disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Package size={18} strokeWidth={1} className="group-hover/dispatch:translate-x-2 transition-transform" />
                      <span>INITIATE_DISPATCH</span>
                    </button>
                    <button 
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      disabled={isSaving || selectedOrder.status === 'cancelled' || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered'}
                      className="flex-1 flex items-center justify-center space-x-4 py-8 rounded-[2.5rem] border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white active:scale-95 transition-all duration-700 font-tech text-[10px] font-black tracking-widest uppercase group/cancel disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <AlertCircle size={18} strokeWidth={1} className="group-hover/cancel:rotate-90 transition-transform" />
                      <span>TERMINATE_ORDER</span>
                    </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
                



          {view === 'coupons' && (
            <div className="space-y-20 animate-in fade-in duration-1000">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 border-b border-black/5 pb-10">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                       <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_15px_#f59e0b]" />
                       <span className="font-tech text-amber-500/40 text-xs tracking-[0.5em] font-black uppercase">PROMOTIONAL_PROTOCOLS // VOUCHER_VAULT</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-display italic tracking-tightest leading-none">Coupon <span className="opacity-10 text-black font-sans italic">Management.</span></h2>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="px-6 py-3 bg-black text-white rounded-full font-tech text-[10px] tracking-widest font-black uppercase">{coupons.filter(c => c.active).length} ACTIVE_NODES</div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 md:gap-16">
                  {/* Creation Form */}
                  <div className="lg:col-span-1 p-10 rounded-[3rem] border border-black/5 bg-neutral-50 h-fit space-y-10 relative overflow-hidden group shadow-xl">
                    <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000 rotate-12 group-hover:scale-125">
                       <Zap size={300} strokeWidth={1} className="text-black" />
                    </div>
                    
                    <div className="flex items-center space-x-4 relative z-10">
                       <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg">
                          <Plus size={20} strokeWidth={1.5} />
                       </div>
                       <span className="font-tech text-black/40 text-[10px] tracking-widest font-black uppercase">DEPLOY_NEW_CODE</span>
                    </div>

                    <form onSubmit={handleAddCoupon} className="space-y-8 relative z-10">
                      <div className="space-y-3">
                        <label className="font-tech text-black/20 text-[8px] tracking-[0.3em] font-black uppercase">IDENT_CODE</label>
                        <input 
                          value={couponCode} onChange={e => setCouponCode(e.target.value)} 
                          className="w-full bg-white border border-black/5 rounded-2xl px-6 py-4 uppercase font-mono text-2xl focus:border-black outline-none transition-all placeholder:text-black/5 shadow-inner" 
                          placeholder="VAULT25" required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="font-tech text-black/20 text-[8px] tracking-[0.3em] font-black uppercase">TYPE</label>
                          <select 
                            value={couponType} onChange={e => setCouponType(e.target.value as any)} 
                            className="w-full bg-white border border-black/5 rounded-2xl px-6 py-4 font-tech text-[10px] tracking-widest font-black focus:border-black outline-none cursor-pointer shadow-inner uppercase"
                          >
                            <option value="percentage">% UNIT</option>
                            <option value="fixed">INR ₹</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="font-tech text-black/20 text-[8px] tracking-[0.3em] font-black uppercase">MAGNITUDE</label>
                          <input 
                            type="number" value={couponDiscount} onChange={e => setCouponDiscount(e.target.value)} 
                            className="w-full bg-white border border-black/5 rounded-2xl px-6 py-4 font-mono text-2xl focus:border-black outline-none shadow-inner" 
                            placeholder="0" required
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="font-tech text-black/20 text-[8px] tracking-[0.3em] font-black uppercase">MIN_ACQUISITION_VAL (INR)</label>
                        <input 
                          type="number" value={couponMinAmount} onChange={e => setCouponMinAmount(e.target.value)} 
                          className="w-full bg-white border border-black/5 rounded-2xl px-6 py-4 font-mono text-xl focus:border-black outline-none shadow-inner" 
                          placeholder="4999"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="font-tech text-black/20 text-[8px] tracking-[0.3em] font-black uppercase">EXPIRY_DATE</label>
                        <input 
                          type="date" value={couponExpiry} onChange={e => setCouponExpiry(e.target.value)} 
                          className="w-full bg-white border border-black/5 rounded-2xl px-6 py-4 font-tech text-[10px] tracking-widest font-black focus:border-black outline-none shadow-inner" 
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSaving} 
                        className="w-full py-6 bg-black text-white font-tech text-[10px] tracking-[0.5em] font-black rounded-full hover:bg-neutral-800 transition-all duration-700 uppercase shadow-xl disabled:opacity-20"
                      >
                        {isSaving ? 'ENCRYPTING...' : 'INITIALIZE_PROTOCOL'}
                      </button>
                    </form>
                  </div>

                  {/* Coupon Grid */}
                  <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {coupons.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map(c => (
                      <div key={c.id} className="group p-8 rounded-[3.5rem] border border-black/5 bg-white relative overflow-hidden flex flex-col justify-between hover:scale-[1.02] transition-all duration-700 h-96 luxury-shadow">
                        <div className="absolute -top-10 -right-10 opacity-[0.02] rotate-12 group-hover:scale-150 group-hover:opacity-5 transition-all duration-1000 pointer-events-none text-black">
                           <Zap size={250} strokeWidth={1} />
                        </div>
                        
                        <div className="relative z-10 flex justify-between items-start">
                           <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                 <div className={`w-2 h-2 rounded-full shadow-lg ${new Date(c.expiry) < new Date() ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                 <span className="font-tech text-black/30 text-[8px] tracking-[0.3em] font-black uppercase">
                                   {new Date(c.expiry) < new Date() ? 'PROTOCOL_EXPIRED' : 'ACTIVE_LOGISTICS'}
                                 </span>
                              </div>
                              <h3 className="text-4xl font-mono font-black italic tracking-tighter text-black uppercase">{c.code}</h3>
                           </div>
                           <button 
                            onClick={() => handleDeleteCoupon(c.id)} 
                            className="w-12 h-12 rounded-2xl border border-black/5 bg-neutral-50 flex items-center justify-center text-red-500/20 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-90"
                           >
                              <Trash2 size={20} strokeWidth={1} />
                           </button>
                        </div>

                        <div className="relative z-10 space-y-6 pt-10">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-5 bg-neutral-50 rounded-[1.8rem] border border-black/5">
                                 <p className="font-tech text-[8px] text-black/30 mb-2 tracking-widest uppercase">VALUATION</p>
                                 <p className="font-display italic text-3xl text-indigo-600">{c.type === 'percentage' ? `${c.discount}%` : `₹${c.discount}`}</p>
                              </div>
                              <div className="p-5 bg-neutral-50 rounded-[1.8rem] border border-black/5">
                                 <p className="font-tech text-[8px] text-black/30 mb-2 tracking-widest uppercase">THRESHOLD</p>
                                 <p className="font-mono text-xl text-black/60">₹{c.minAmount || 0}</p>
                              </div>
                           </div>

                           <div className="flex items-center justify-between px-4 pb-2 border-b border-black/5">
                              <div className="flex items-center space-x-3">
                                <Clock size={12} className="text-black/20" />
                                <span className="font-tech text-[9px] text-black/40 uppercase tracking-widest">
                                  {c.expiry ? `Expires: ${new Date(c.expiry).toLocaleDateString()}` : 'No Expiration'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                <span className="font-tech text-[9px] text-black/40 uppercase tracking-widest">SYNC_OK</span>
                              </div>
                           </div>
                        </div>

                        <div className="absolute bottom-6 right-8 opacity-10">
                           <p className="font-tech text-[7px] tracking-[0.5em] font-black uppercase text-black">VAULT_ENCRYPTED_PROTO</p>
                        </div>
                      </div>
                    ))}
                    {coupons.length === 0 && (
                      <div className="col-span-full py-40 bg-neutral-50 rounded-[4rem] border border-dashed border-black/10 flex flex-col items-center justify-center space-y-6 opacity-40">
                         <Zap size={60} strokeWidth={0.5} className="text-black animate-pulse" />
                         <p className="font-tech text-[10px] tracking-[0.8em] font-black uppercase">Archive_Empty</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}
          {view === 'support' && (
             <div className="grid grid-cols-12 gap-12 animate-in fade-in duration-1000 h-[750px]">
                {/* Ticket List */}
                <div className="col-span-12 lg:col-span-4 bg-white rounded-[4rem] border border-black/5 overflow-hidden flex flex-col luxury-shadow">
                   <div className="p-10 border-b border-black/5 flex justify-between items-center bg-neutral-50/50">
                      <div>
                        <h3 className="font-display italic text-2xl text-black">Ticket <span className="opacity-10 text-black font-sans italic">Hub.</span></h3>
                        <p className="font-tech text-black/30 text-[9px] tracking-widest uppercase mt-1">Live_Protocol_Monitoring</p>
                      </div>
                      <span className="px-4 py-1.5 bg-indigo-600/10 text-indigo-600 font-mono text-[9px] tracking-widest rounded-full font-black uppercase">{supportChats.filter(c => c.status !== 'resolved').length} OPEN</span>
                   </div>
                   <div className="flex-grow overflow-y-auto no-scrollbar bg-neutral-50/20">
                      {supportChats.sort((a,b) => {
                        const dateA = a.lastActive?.toDate?.() || new Date(a.lastActive || 0);
                        const dateB = b.lastActive?.toDate?.() || new Date(b.lastActive || 0);
                        return dateB.getTime() - dateA.getTime();
                      }).map(chat => (
                         <button 
                            key={chat.id}
                            onClick={() => setActiveSupportChat(chat.id)}
                            className={`w-full p-8 text-left border-b border-black/5 flex items-center space-x-6 transition-all duration-700 ${activeSupportChat === chat.id ? 'bg-indigo-600 shadow-[inset_4px_0_0_#4f46e5]' : 'hover:bg-neutral-100'}`}
                         >
                            <div className="relative">
                               <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center border border-black/5 shadow-lg transition-colors ${activeSupportChat === chat.id ? 'bg-white text-indigo-600' : 'bg-white text-black/20'}`}>
                                  <User size={20} strokeWidth={1} />
                               </div>
                               {chat.unreadByAdmin && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-4 border-white animate-pulse" />
                               )}
                            </div>
                            <div className="flex-grow min-w-0">
                               <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center space-x-3">
                                     <p className={`font-mono text-[10px] font-black truncate max-w-[140px] uppercase ${activeSupportChat === chat.id ? 'text-white' : 'text-black'}`}>{chat.userName || 'Unknown_Node'}</p>
                                     <span className={`px-2 py-0.5 font-mono text-[7px] font-black tracking-widest rounded-full uppercase ${chat.status === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
                                       {chat.status === 'resolved' ? 'RESOLVED' : 'OPEN'}
                                     </span>
                                  </div>
                               </div>
                               <p className={`text-[11px] truncate italic tracking-tight ${activeSupportChat === chat.id ? 'text-white/60' : 'text-black/40'}`}>{chat.lastMessage || 'Channel_Open...'}</p>
                            </div>
                         </button>
                      ))}
                      {supportChats.length === 0 && (
                         <div className="p-20 text-center opacity-20 space-y-4">
                            <MessageSquare className="mx-auto" size={40} strokeWidth={1} />
                            <p className="font-tech text-xs tracking-[0.5em] font-black uppercase">Archive_Empty</p>
                         </div>
                      )}
                   </div>
                </div>

                {/* Ticket Detail */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-[4rem] border border-black/5 overflow-hidden flex flex-col luxury-shadow relative">
                   {activeSupportChat ? (
                      <>
                         {/* Detailed Header for Support Study */}
                         <div className="p-8 border-b border-black/5 bg-neutral-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-4">
                               <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                     <ShieldCheck size={18} strokeWidth={1.5} />
                                  </div>
                                  <div>
                                     <p className="font-mono text-xs text-black font-black uppercase tracking-tight">{supportChats.find(c => c.id === activeSupportChat)?.userName}</p>
                                     <p className="font-tech text-[9px] text-black/40 tracking-widest uppercase">TICKET_ID: {activeSupportChat.slice(0, 12).toUpperCase()}</p>
                                  </div>
                               </div>
                               <div className="flex flex-wrap gap-4">
                                  <div className="px-4 py-2 bg-white border border-black/5 rounded-full flex items-center space-x-3">
                                     <Mail size={12} className="text-indigo-600" />
                                     <span className="font-tech text-[9px] text-black/60 font-black uppercase">{supportChats.find(c => c.id === activeSupportChat)?.userEmail}</span>
                                  </div>
                                  <div className="px-4 py-2 bg-white border border-black/5 rounded-full flex items-center space-x-3">
                                     <Phone size={12} className="text-emerald-600" />
                                     <span className="font-tech text-[9px] text-black/60 font-black uppercase">{supportChats.find(c => c.id === activeSupportChat)?.userPhone || 'NO_PHONE'}</span>
                                  </div>
                                  {supportChats.find(c => c.id === activeSupportChat)?.orderId && (
                                    <div className="px-4 py-2 bg-indigo-600 text-white rounded-full flex items-center space-x-3 shadow-lg shadow-indigo-600/20">
                                       <ShoppingBag size={12} />
                                       <span className="font-tech text-[9px] font-black uppercase tracking-widest">ORDER: {supportChats.find(c => c.id === activeSupportChat)?.orderId}</span>
                                    </div>
                                  )}
                               </div>
                            </div>
                            <div className="flex gap-4">
                               {supportChats.find(c => c.id === activeSupportChat)?.status !== 'resolved' ? (
                                 <button 
                                    onClick={() => handleResolveSupport(activeSupportChat!)}
                                    className="px-8 py-3 bg-emerald-600 text-white rounded-full font-tech text-[10px] font-black tracking-widest uppercase hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
                                 >
                                    MARK_RESOLVED
                                 </button>
                               ) : (
                                 <button 
                                    disabled
                                    className="px-8 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full font-tech text-[10px] font-black tracking-widest uppercase"
                                 >
                                    TICKET_RESOLVED
                                 </button>
                               )}
                               <button 
                                  onClick={() => handleDeleteSupport(activeSupportChat!)}
                                  className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-full border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                               >
                                  <Trash2 size={18} strokeWidth={1.5} />
                               </button>
                            </div>
                         </div>
                         
                         <div 
                            ref={adminScrollRef}
                            className="flex-grow p-10 overflow-y-auto space-y-8 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
                         >
                            {supportMessages.map(msg => (
                               <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[75%] p-6 rounded-[2.5rem] shadow-sm ${msg.isAdmin ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white border border-black/5 text-black'}`}>
                                     <p className="text-[13px] font-light leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                     <div className={`flex items-center space-x-3 mt-4 opacity-30 ${msg.isAdmin ? 'text-white' : 'text-black'}`}>
                                        <Clock size={10} />
                                        <span className="text-[8px] font-mono tracking-tighter uppercase whitespace-nowrap">
                                          {msg.timestamp ? (
                                            msg.timestamp.toDate 
                                              ? msg.timestamp.toDate().toLocaleTimeString() 
                                              : new Date(msg.timestamp).toLocaleTimeString()
                                          ) : 'PENDING_SYNC'}
                                        </span>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>

                         <form onSubmit={handleSendReply} className="p-8 bg-neutral-50 border-t border-black/5">
                            <div className="relative">
                               <input 
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Type secure transmission to collector..."
                                  className="w-full bg-white border border-black/5 rounded-full py-6 px-10 pr-20 text-sm font-light text-black focus:border-indigo-600 outline-none transition-all shadow-inner"
                               />
                               <button 
                                  type="submit"
                                  disabled={!replyText.trim()}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-20"
                               >
                                  <Send size={20} strokeWidth={2} />
                               </button>
                            </div>
                         </form>
                      </>
                   ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-10 space-y-8">
                         <div className="w-32 h-32 rounded-[4rem] border border-dashed border-black/30 flex items-center justify-center">
                            <Shield size={60} strokeWidth={0.5} />
                         </div>
                         <div className="space-y-4">
                            <h3 className="text-4xl font-display italic">Awaiting Protocol.</h3>
                            <p className="font-tech text-xs tracking-widest uppercase">Select a transmission node to study manifest issue.</p>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          )}
          {view === 'security' && (
            <div className="space-y-20 animate-in fade-in duration-1000">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 md:gap-16">
                  {/* Master Overrides */}
                  <div className="lg:col-span-1 space-y-12">
                    <div className="p-12 rounded-[4rem] border border-black/5 bg-white group hover:bg-neutral-50 transition-all duration-1000 luxury-shadow space-y-12">
                       <div className="flex items-center space-x-6">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-1000 ${maintenanceStatus ? 'bg-red-500/10 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-black/5 text-black'}`}>
                             {maintenanceStatus ? <AlertTriangle size={24} strokeWidth={1} /> : <Lock size={24} strokeWidth={1} />}
                          </div>
                          <div>
                             <p className="font-tech text-[10px] text-black/30 mb-1 tracking-[0.4em] font-black uppercase">SECURITY_OVERRIDE</p>
                             <h3 className="text-3xl font-display italic tracking-tightest text-black">Vault <span className="opacity-10 text-black font-sans italic">Lock.</span></h3>
                          </div>
                       </div>
                       
                       <p className="text-xs font-tech text-black/40 leading-relaxed tracking-wider uppercase">
                         INITIATING THE VAULT LOCK WILL RESTRICT ALL PUBLIC ACCESS TO THE COLLECTIONS. ONLY AUTHORIZED PERSONNEL TERMINALS WILL REMAIN OPERATIONAL.
                       </p>

                       <button 
                         onClick={handleToggleMaintenance} 
                         disabled={isTogglingMaintenance}
                         className={`w-full py-8 rounded-full font-tech text-[10px] tracking-[0.5em] font-black uppercase transition-all duration-1000 active:scale-95 ${maintenanceStatus ? 'bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)]' : 'bg-black text-white hover:bg-neutral-800'}`}
                       >
                         {maintenanceStatus ? 'DEACTIVATE_LOCKDOWN' : 'INITIATE_VAULT_LOCK'}
                       </button>
                    </div>

                    <div className="p-12 rounded-[4rem] border border-black/5 bg-neutral-50 group hover:bg-neutral-100 transition-all duration-1000 shadow-xl">
                       <div className="flex justify-between items-center mb-10">
                          <span className="font-tech text-xs text-black/30 tracking-[0.4em] font-black uppercase">TEST_ISOLATION</span>
                          <div className={`w-3 h-3 rounded-full transition-all duration-1000 shadow-xl ${testMode ? 'bg-green-500 shadow-green-500/40' : 'bg-black/5'}`} />
                       </div>
                       <div className="flex items-center justify-between">
                          <h4 className="font-display italic text-2xl tracking-tighter text-black">Sandbox <span className="opacity-10 text-black font-sans italic">Mode.</span></h4>
                          <button 
                            onClick={handleToggleTestMode} 
                            disabled={isTogglingTestMode}
                            className={`w-20 h-10 rounded-full relative transition-all duration-1000 border border-black/5 ${testMode ? 'bg-black' : 'bg-neutral-100'}`}
                          >
                             <div className={`absolute top-1.5 w-6 h-6 rounded-full transition-all duration-1000 shadow-xl ${testMode ? 'left-12 bg-white' : 'left-1.5 bg-black'}`} />
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* Firewall & Signals */}
                  <div className="lg:col-span-2 p-16 rounded-[5rem] border border-black/10 bg-white shadow-2xl relative overflow-hidden group/firewall flex flex-col h-full text-black">
                     <div className="absolute -top-20 -right-20 opacity-[0.02] group-hover/firewall:opacity-[0.06] transition-all duration-1000 rotate-12 scale-150 pointer-events-none text-black">
                        <Shield size={500} strokeWidth={0.5} />
                     </div>
                     
                     <div className="relative z-10 space-y-16 flex flex-col h-full">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-6">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(34,197,94,1)]" />
                              <span className="font-tech text-black/40 text-[10px] tracking-[0.5em] font-black uppercase">CORE_FIREWALL_TERMINAL // NOMINAL</span>
                           </div>
                           <div className="px-6 py-2 bg-black/5 rounded-full border border-black/5 text-[9px] font-tech font-black tracking-widest text-black/60 uppercase">AES_256_ACTIVE</div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           {[
                             { label: 'ENC_HANDSHAKE', value: 'ECC_PRIME_256', detail: 'SECURE_CHANNEL', icon: <Wifi size={16} /> },
                             { label: 'ACCESS_LIST_RL', value: 'NOMINAL_FLOW', detail: 'AUTO_FILTER_ENABLE', icon: <Activity size={16} /> },
                             { label: 'THREAT_SCAN', value: 'ZERO_BREACH', detail: 'LAST_SCAN: 14MS_AGO', icon: <ShieldCheck size={16} /> },
                             { label: 'LATENCY_SYNC', value: '9MS', detail: 'REGION: APAC_HUB', icon: <Cpu size={16} /> }
                           ].map((s, i) => (
                             <div key={i} className="p-10 rounded-[2.5rem] bg-neutral-50 border border-black/5 group hover:border-black/30 hover:bg-neutral-100 transition-all duration-700 shadow-xl flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                 <p className="font-tech text-xs text-black/30 tracking-[0.3em] font-black uppercase">{s.label}</p>
                                 <div className="text-black/20">{s.icon}</div>
                                </div>
                                <p className="font-mono text-3xl font-black text-black tracking-tightest">{s.value}</p>
                                <p className="font-tech text-[9px] text-black/20 tracking-[0.2em] uppercase">{s.detail}</p>
                             </div>
                           ))}
                        </div>

                        <div className="mt-auto p-10 rounded-[3rem] bg-neutral-100 border border-black/10 relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-black/40" />
                           <div className="flex items-center justify-between mb-6">
                              <span className="font-tech text-[10px] text-black/40 tracking-[0.5em] font-black uppercase">SYSTEM_INTEGRITY</span>
                              <span className="font-mono text-[10px] text-black font-bold">100.00%</span>
                           </div>
                           <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100.00%' }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                                className="h-full bg-black shadow-xl"
                              />
                           </div>
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
