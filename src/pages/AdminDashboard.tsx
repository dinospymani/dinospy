import React, { useState, useEffect } from 'react';
import { db } from '../context/AuthContext';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { Plus, Trash2, Edit, Save, Package, QrCode, Printer, X, Truck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminDashboard() {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('DINOSPY');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [category, setCategory] = useState('Luxury');
  const [image, setImage] = useState('');
  const [imageFiles, setImageFiles] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isTrending, setIsTrending] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [discount, setDiscount] = useState('0');
  const [isOffer, setIsOffer] = useState(false);
  const [status, setStatus] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [view, setView] = useState<'products' | 'orders' | 'add'>('add');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pSnap = await getDocs(collection(db, 'products'));
        setProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const oSnap = await getDocs(collection(db, 'orders'));
        setOrders(oSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'products', id));
        setProducts(products.filter(p => p.id !== id));
        setStatus('Product removed.');
    } catch (err) {
        console.error(err);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0 && !image) {
      setStatus('Please provide at least one image.');
      return;
    }
    setStatus('Adding...');
    try {
      await addDoc(collection(db, 'products'), {
        name,
        brand,
        price: parseFloat(price),
        discount: parseFloat(discount),
        isOffer,
        category,
        images: imageFiles.length > 0 ? imageFiles : [image],
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
      setStatus('Product added successfully!');
      setName('');
      setPrice('');
      setDiscount('0');
      setImage('');
      setDescription('');
      // Refresh products
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      setStatus('Error adding product.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles: string[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newFiles.push(reader.result as string);
        if (newFiles.length === files.length) {
          setImageFiles(newFiles);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 max-w-6xl mx-auto px-4 w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-display gold-text">Admin Command Center</h1>
            <p className="text-white/40 mt-2">Manage your luxury empire with precision.</p>
          </div>
          <div className="flex space-x-4 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setView('add')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'add' ? 'gold-gradient text-luxury-black' : 'text-white/60 hover:text-white'}`}
            >
              Add Product
            </button>
            <button 
              onClick={() => setView('products')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'products' ? 'gold-gradient text-luxury-black' : 'text-white/60 hover:text-white'}`}
            >
              Products
            </button>
            <button 
              onClick={() => setView('orders')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'orders' ? 'gold-gradient text-luxury-black' : 'text-white/60 hover:text-white'}`}
            >
              Orders
            </button>
          </div>
        </div>
        
        <div className="glass p-8 rounded-3xl border border-white/10">
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
                      className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl px-4 py-3 focus:border-gold outline-none cursor-pointer"
                    >
                      <option value="Luxury" className="bg-[#1A1A1A] text-white">Luxury</option>
                      <option value="Sport" className="bg-[#1A1A1A] text-white">Sport</option>
                      <option value="Smart" className="bg-[#1A1A1A] text-white">Smart</option>
                      <option value="Classic" className="bg-[#1A1A1A] text-white">Classic</option>
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
                </div>

                <button type="submit" className="w-full py-4 gold-gradient text-luxury-black font-bold uppercase tracking-widest rounded-xl hover:scale-[1.01] transition-all">
                  Save to Catalog
                </button>
                
                {status && <p className="text-center text-sm text-gold">{status}</p>}
              </form>
            </>
          )}

          {view === 'products' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-8">Current Inventory</h2>
              <div className="grid grid-cols-1 gap-4">
                {products.length === 0 && <p className="text-white/40 text-center py-20">No products found in catalog.</p>}
                {products.map((p) => (
                  <div key={p.id} className="flex items-center space-x-4 glass p-4 rounded-2xl border border-white/5">
                    <img src={p.images[0]} className="w-16 h-16 object-cover rounded-lg" alt={p.name} />
                    <div className="flex-grow">
                      <h4 className="font-bold">{p.name}</h4>
                      <p className="text-xs text-white/40">₹{p.price.toLocaleString()} • {p.category} • {p.stock} in stock</p>
                    </div>
                    <div className="flex space-x-2">
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
              <h2 className="text-xl font-bold mb-8">Global Sales Manifest</h2>
              <div className="space-y-6">
                {orders.length === 0 && <p className="text-white/40 text-center py-20">No orders received yet.</p>}
                {orders.map((o) => (
                  <div key={o.id} className="glass p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-full ${o.status === 'shipping' ? 'bg-blue-500/20 text-blue-500' : o.status === 'delivered' ? 'bg-green-500/20 text-green-500' : 'bg-gold/20 text-gold'}`}>
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
                         onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                         className="bg-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest text-white border border-white/10 rounded px-2 py-1 focus:border-gold outline-none"
                       >
                         <option value="pending">Pending</option>
                         <option value="processing">Processing</option>
                         <option value="shipping">Shipping</option>
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
                      <button className="flex items-center justify-center space-x-2 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors uppercase tracking-widest text-[10px] font-bold">
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
                    for (const p of demo) {
                        await addDoc(collection(db, 'products'), {
                            ...p, brand: 'DINOSPY', images: [p.img], isTrending: p.trending, isNewArrival: true, stock: 10, rating: 5.0, reviewCount: 0, createdAt: new Date().toISOString(), specs: { Movement: 'Automatic', Case: 'Gold/Steel', Crystal: 'Sapphire' }, description: 'A masterpiece of precision craftsmanship and timeless elegance.'
                        });
                    }
                    setStatus('Demo data seeded!');
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
