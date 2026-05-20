import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, Heart, Star, Shield, Truck, RotateCcw, ArrowLeft, ChevronRight, Play } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { db } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToCart, toggleWishlist, wishlist } = useCart();

  const isWishlisted = wishlist.includes(id || '');

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    const docRef = doc(db, 'products', id);
    
    // Real-time listener for current product
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Mock data if not found
        setProduct({
          id,
          name: 'Ouroboros Gold',
          brand: 'DINOSPY',
          price: 125000,
          stock: 5,
          images: [
              'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=2070',
              'https://images.unsplash.com/photo-1508685096489-7aac29a23fce?auto=format&fit=crop&q=80&w=1978',
              'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1974'
            ],
            category: 'Luxury',
            rating: 4.9,
            reviewCount: 124,
            description: 'The Ouroboros Gold represents the infinite cycle of excellence. Featuring a 18k gold case, sapphire crystal, and an in-house automatic movement with a 72-hour power reserve. This masterpiece is limited to only 500 pieces worldwide.',
            specs: {
              Movement: 'Automatic Self-Winding',
              Case: '18k Yellow Gold',
              Size: '40mm',
              Crystal: 'Scratch-resistant Sapphire',
              'Water Resistance': '100 Meters'
            }
          });
        }
        setLoading(false);
      }, (err) => {
        console.error(err);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Product not found.</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-white/40 mb-12">
            <Link to="/" className="hover:text-gold">Home</Link>
            <ChevronRight size={10} />
            <span className="hover:text-gold cursor-pointer">{product.category}</span>
            <ChevronRight size={10} />
            <span className="text-white">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left: Images */}
            <div className="space-y-6">
              <motion.div 
                layoutId={`image-${product.id}`}
                className="relative aspect-square rounded-3xl overflow-hidden glass border border-white/5 cursor-zoom-in"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <motion.div 
                   key={activeImage}
                   initial={{ opacity: 0, scale: 1.1 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 0.8, ease: "easeOut" }}
                   className="w-full h-full"
                >
                  <motion.img 
                    src={product.images[activeImage]} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-150"
                    style={{ originX: 0.5, originY: 0.5 }}
                  />
                </motion.div>
                
                <div className="absolute top-6 left-6 flex space-x-2">
                   {product.isLimited && <span className="bg-gold text-luxury-black text-[8px] font-bold px-2 py-1 uppercase tracking-widest">Limited Edition</span>}
                   {product.isOffer && <span className="bg-red-600 text-white text-[8px] font-bold px-2 py-1 uppercase tracking-widest">DINOSPY Exclusive</span>}
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 lg:hidden">
                   {product.images.map((_: any, i: number) => (
                     <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${activeImage === i ? 'bg-gold w-4' : 'bg-white/20'}`} />
                   ))}
                </div>
              </motion.div>
              
              <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                {product.images.map((img: string, i: number) => (
                  <button 
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative flex-shrink-0 w-24 aspect-square rounded-xl overflow-hidden border-2 transition-all snap-start ${activeImage === i ? 'border-gold' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex flex-col">
              <div className="mb-10">
            <span className="text-gold font-mono text-sm uppercase tracking-[0.2em] mb-4 block underline underline-offset-8">
              DINOSPY • {product.category}
            </span>
                <h1 className="text-5xl md:text-6xl font-display mb-6 leading-tight">{product.name}</h1>
                <div className="flex items-center space-x-6 mb-8">
                  <div className="flex items-center text-gold space-x-2">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} fill={i <= Math.floor(product.rating) ? "currentColor" : "none"} />
                    ))}
                    <span className="text-sm font-bold ml-2">{product.rating}</span>
                  </div>
                  <span className="text-white/40 text-sm">({product.reviewCount} Reviews)</span>
                  <div className="h-4 w-[1px] bg-white/10" />
                  <div className="flex items-center space-x-2">
                     <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                     <span className={`text-[10px] uppercase tracking-widest font-bold ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {product.stock > 0 ? `${product.stock} Units Available` : 'Out of Stock'}
                     </span>
                  </div>
                </div>
                
                <div className="flex items-end space-x-4 mb-10">
                   {product.discount && product.discount > 0 ? (
                     <>
                       <div className="text-4xl font-mono text-gold">
                         ₹{(product.price * (1 - product.discount / 100)).toLocaleString()}
                       </div>
                       <div className="text-xl font-mono text-white/30 line-through pb-1">
                         ₹{product.price.toLocaleString()}
                       </div>
                       <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase mb-2">
                         {product.discount}% OFF
                       </div>
                     </>
                   ) : (
                     <div className="text-4xl font-mono text-gold">
                       ₹{product.price.toLocaleString()}
                     </div>
                   )}
                </div>

                <p className="text-white/60 leading-relaxed text-lg mb-12">
                  {product.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-12 py-8 border-y border-white/5">
                {Object.entries(product.specs || {}).map(([key, val]: [string, any]) => (
                  <div key={key}>
                    <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">{key}</span>
                    <span className="text-sm font-medium">{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4 mb-12">
                <button 
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`flex-grow py-5 gold-gradient text-luxury-black font-bold uppercase tracking-widest transition-all flex items-center justify-center ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  <ShoppingBag className="mr-3" size={20} />
                  {product.stock > 0 ? 'Add to Collection' : 'Sold Out'}
                </button>
                <button 
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-5 glass border border-white/20 transition-colors rounded-xl ${isWishlisted ? 'text-red-500 fill-red-500' : 'hover:text-red-500'}`}
                >
                  <Heart size={24} />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center p-4 glass rounded-2xl">
                  <Truck className="text-gold mb-3" size={20} />
                  <span className="text-[10px] uppercase font-bold tracking-tighter text-white/70 leading-none">India Dispatch</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 glass rounded-2xl">
                  <Shield className="text-gold mb-3" size={20} />
                  <span className="text-[10px] uppercase font-bold tracking-tighter text-white/70 leading-none">Insured Logistics</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 glass rounded-2xl">
                  <RotateCcw className="text-gold mb-3" size={20} />
                  <span className="text-[10px] uppercase font-bold tracking-tighter text-white/70 leading-none">Returns Policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
