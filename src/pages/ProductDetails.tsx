import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Heart, Star, Shield, Truck, RotateCcw, ArrowLeft, ChevronRight, Play, Share2, ThumbsUp, CheckCircle2, X, ChevronLeft, Watch } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CountdownTimer } from '../components/CountdownTimer';
import { db } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { doc, onSnapshot, collection, query, where, orderBy, addDoc, serverTimestamp, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

import { toast } from 'sonner';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { user, profile, setIsAuthModalOpen } = useAuth();
  const { addToCart, toggleWishlist, wishlist } = useCart();
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [hasPurchased, setHasPurchased] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  useEffect(() => {
    if (!user || !id) return;
    const checkPurchase = async () => {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        where('status', '==', 'delivered')
      );
      const snap = await getDocs(q);
      const purchasedProduct = snap.docs.some(doc => 
        doc.data().items.some((item: any) => item.id === id)
      );
      setHasPurchased(purchasedProduct);
    };
    checkPurchase();
  }, [user, id]);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    return 0;
  });

  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: reviews.filter(rev => Math.floor(rev.rating) === r).length,
    percentage: reviews.length > 0 ? (reviews.filter(rev => Math.floor(rev.rating) === r).length / reviews.length) * 100 : 0
  }));

  const handleHelpful = async (reviewId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const review = reviews.find(r => r.id === reviewId);
      const helpfulBy = review.helpfulBy || [];
      
      if (helpfulBy.includes(user.uid)) {
        toast.info('You already marked this as helpful');
        return;
      }

      await updateDoc(reviewRef, {
        helpfulCount: (review.helpfulCount || 0) + 1,
        helpfulBy: [...helpfulBy, user.uid]
      });
      toast.success('Appreciation logged');
    } catch (err) {
      toast.error('Sync failed');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `DINOSPY - ${product.name}`,
      text: `Witness the peak of horological engineering: ${product.name}.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully', { id: 'share-action' });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard', { id: 'share-action' });
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const isWishlisted = wishlist.includes(id || '');

  const handleAddToCart = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (product.stock < quantity) {
      toast.error(`Limit exceeded. Only ${product.stock} units available.`);
      return;
    }
    
    addToCart(product, quantity);
  };

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
          stock: 100,
          images: [
              "/src/assets/images/vanguard_carbon_watch_1782293507993.jpg",
              "/src/assets/images/minimalist_marble_watch_1782293522898.jpg",
              "/src/assets/images/hero_skeleton_movement_1782293477542.jpg"
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

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', id),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Review transmission isolated", err);
    });
    return () => unsubscribe();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous Client',
        rating: reviewRating,
        comment: reviewComment,
        createdAt: new Date().toISOString()
      });

      // Update product stats (vulnerable to atomicity issues but okay for now)
      const newReviewCount = (product.reviewCount || 0) + 1;
      const newRating = ((product.rating * (product.reviewCount || 0)) + reviewRating) / newReviewCount;
      
      await updateDoc(doc(db, 'products', id), {
        reviewCount: newReviewCount,
        rating: parseFloat(newRating.toFixed(1))
      });

      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted successfully');
    } catch (err) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-32 animate-pulse">
          <div className="aspect-square bg-neutral-50 rounded-[2rem] flex items-center justify-center relative overflow-hidden">
             <Watch size={64} strokeWidth={1} className="text-black/10" />
             <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
          </div>
          <div className="flex flex-col justify-center space-y-12">
            <div className="space-y-4">
               <div className="h-2 w-32 bg-black/5" />
               <div className="h-20 w-3/4 bg-black/5" />
            </div>
            <div className="h-10 w-48 bg-black/5 border-b border-black/5 pb-12" />
            <div className="space-y-6 pt-12">
              {[1,2,3,4].map(i => <div key={i} className="h-2 w-full bg-black/5" />)}
            </div>
            <div className="h-20 w-full bg-neutral-50 rounded-2xl mt-20" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
  if (!product) return <div className="h-screen flex items-center justify-center text-black">Product not found.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-black/60 hover:text-black transition-colors p-2 -ml-2"
            >
              <ArrowLeft size={20} />
              <span className="text-[10px] uppercase tracking-widest font-bold">Back to Gallery</span>
            </button>
          </div>

          <nav className="flex items-center space-x-2 md:space-x-4 font-mono text-[7px] md:text-[8px] text-black/20 mb-8 md:mb-20 font-bold overflow-hidden whitespace-nowrap">
            <Link to="/" className="hover:text-black transition-colors shrink-0">HOME</Link>
            <div className="w-1 h-[1px] bg-black/10 shrink-0" />
            <Link to="/explore" className="hover:text-black transition-colors shrink-0">{product.category.toUpperCase()}</Link>
            <div className="w-1 h-[1px] bg-black/10 shrink-0" />
            <span className="text-black/60 italic truncate max-w-[100px]">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-32">
            {/* Left: Images */}
            <div className="space-y-12">
              <motion.div 
                layoutId={`image-${product.id}`}
                className="relative aspect-square overflow-hidden bg-neutral-50 rounded-[3rem] border border-black/5 cursor-crosshair group luxury-shadow"
                transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onClick={() => setIsLightboxOpen(true)}
              >
                <motion.div 
                   key={activeImage}
                   initial={{ opacity: 0 }}
                   animate={{ 
                     opacity: 1, 
                     scale: isZoomed ? 1.5 : 1,
                     transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                   }}
                   transition={{ 
                     opacity: { duration: 1.5, ease: [0.19, 1, 0.22, 1] },
                     scale: { duration: 0.6, ease: [0.19, 1, 0.22, 1] }
                   }}
                   className="w-full h-full flex flex-col items-center justify-center bg-white p-0 relative"
                >
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[activeImage]} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <>
                      <div className="font-display text-[15rem] opacity-[0.02] select-none pointer-events-none">
                        {product.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-20 text-center pointer-events-none">
                        <div className="w-1/3 h-[1px] bg-black/10 mb-12" />
                        <span className="font-mono text-[10px] tracking-[1em] text-black/20 uppercase font-black">Archive_Caliber_{activeImage}</span>
                      </div>
                    </>
                  )}
                </motion.div>
                
                {/* Zoom Indicator */}
                {!isZoomed && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="px-6 py-3 border border-black/10 bg-white/60 backdrop-blur-md text-black text-[8px] font-black uppercase tracking-[0.4em] rounded-full">
                      Hover to Inspect Detailing
                    </div>
                  </div>
                )}
                
                <div className="absolute top-10 left-10">
                   {product.isLimited && (
                     <div className="px-5 py-2 bg-black text-white text-[9px] font-bold uppercase tracking-[0.4em] rounded-full">
                        Limited Edition
                     </div>
                   )}
                </div>

                {/* Unique Feature: Precision Pulse */}
                <div className="absolute bottom-10 right-10 flex items-center space-x-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] uppercase tracking-[0.5em] text-black/20 font-bold mb-2">Mechanical Pulse</span>
                    <div className="flex space-x-1 items-end h-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            height: [4, 16, 4],
                            opacity: [0.1, 0.5, 0.1]
                          }}
                          transition={{ 
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut"
                          }}
                          className="w-[1px] bg-black"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <div className="flex justify-center space-x-8 px-4">
                {product.images.map((img: string, i: number) => (
                  <button 
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-20 aspect-square overflow-hidden rounded-2xl border transition-all duration-700 flex items-center justify-center font-mono text-[10px] font-bold outline-none ${activeImage === i ? 'border-black ring-2 ring-black ring-offset-4 ring-offset-white' : 'border-black/5 bg-neutral-50 hover:bg-neutral-100'}`}
                  >
                    {img ? (
                      <img src={img} alt={`Asset ${i}`} className="w-full h-full object-cover" />
                    ) : (
                      <span>0{i + 1}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex flex-col justify-center">
              <div className="mb-16">
                <div className="flex items-center space-x-4 mb-10">
                   <span className="font-mono text-black text-[11px] uppercase tracking-[0.6em] font-bold">
                     {product.category}_SEQUENCE
                   </span>
                   <div className="w-12 h-[1px] bg-black/10" />
                </div>
                <h1 className="text-[clamp(2.5rem,10vw,7rem)] font-display mb-6 md:mb-10 leading-[1] md:leading-[0.9] font-medium text-black break-words">{product.name}</h1>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 md:space-x-8 mb-10 md:mb-16 pb-10 md:pb-12 border-b border-black/5">
                   <div className="flex flex-col">
                      <div className="text-4xl md:text-6xl font-mono tracking-tighter text-black break-all">
                        <span className="text-[10px] text-black/30 mr-2 md:mr-4 font-bold">Rs. </span>
                        {Math.round(product.discount ? product.price * (1 - product.discount / 100) : product.price).toLocaleString()}
                      </div>
                      {product.discount > 0 && (
                        <p className="text-black/60 font-mono text-[8px] md:text-[9px] font-bold mt-2 md:mt-3 uppercase tracking-widest">
                          ACQUISITION_ADVANTAGE: -{product.discount}%
                        </p>
                      )}
                   </div>
                   <div className="hidden md:block h-16 w-[1px] bg-black/5" />
                   <div className="flex flex-col">
                      <span className="font-mono text-center md:text-left text-[9px] md:text-[10px] text-black/20 mb-1 font-bold uppercase tracking-widest">REGISTRY_STATUS</span>
                      <div className="flex items-center justify-center md:justify-start space-x-3">
                         <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-black animate-pulse' : 'bg-red-500'}`} />
                         <span className="font-mono text-[9px] md:text-[10px] font-bold text-black/60 uppercase tracking-widest">
                            {product.stock > 0 ? 'VAULT_LOCKED' : 'NULL_STATE'}
                         </span>
                      </div>
                   </div>
                </div>

                <p className="text-black/40 leading-relaxed text-lg md:text-xl font-light mb-12 md:mb-16 max-w-xl">
                  {product.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 md:gap-y-12 gap-x-12 md:gap-x-20 mb-16 md:mb-20">
                {Object.entries(product.specs || {}).map(([key, val]: [string, any]) => (
                  <div key={key} className="space-y-2 md:space-y-3">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-black/40 font-bold block">{key}</span>
                    <span className="text-sm font-medium text-black uppercase tracking-widest leading-relaxed">{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col space-y-10">
                <div className="flex items-center space-x-12">
                   <div className="flex items-center space-x-8 border-b border-black/10 pb-4">
                      <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="text-black/30 hover:text-black transition-colors text-xl font-light"
                      >
                        —
                      </button>
                      <span className="text-xl font-light w-8 text-center">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(q => q < product.stock ? q + 1 : q)}
                        className="text-black/30 hover:text-black transition-colors text-xl font-light"
                      >
                        +
                      </button>
                   </div>
                   <span className="text-[10px] uppercase tracking-[0.3em] text-black/20 font-bold">Units of Acquisition</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  <button 
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className={`flex-grow py-6 bg-black text-white hover:bg-neutral-800 transition-all duration-700 text-[11px] uppercase tracking-[0.5em] font-bold shadow-2xl ${product.stock <= 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                  >
                    Acquire Piece
                  </button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!user) {
                        setIsAuthModalOpen(true);
                        return;
                      }
                      toggleWishlist(product.id!);
                    }}
                    className={`px-10 py-6 border transition-all duration-500 rounded-none backdrop-blur-sm ${
                      isWishlisted 
                        ? 'bg-black border-black text-white shadow-lg' 
                        : 'border-black/10 text-black/30 hover:border-black hover:text-black hover:bg-black/5'
                    }`}
                  >
                    <Heart size={20} strokeWidth={1} fill={isWishlisted ? "currentColor" : "none"} />
                  </motion.button>
                </div>
                
                <div className="flex items-center space-x-8 pt-4">
                  <motion.button 
                    whileHover={{ x: 10 }}
                    onClick={handleShare}
                    className="text-[10px] uppercase font-bold tracking-[0.5em] text-black/40 hover:text-black transition-all flex items-center group bg-black/5 px-8 py-4 border border-black/10 hover:border-black/30"
                  >
                    <Share2 size={14} className="mr-4 text-black/60" />
                    Share Asset Details
                    <div className="w-8 h-[1px] bg-black/10 ml-6 group-hover:w-16 group-hover:bg-black transition-all duration-700" />
                  </motion.button>
                </div>

                {/* Unique Feature: Digital Identity Registry */}
                <div className="pt-20 mt-20 border-t border-black/5">
                  <div className="p-10 border border-black/5 bg-black/[0.01] relative overflow-hidden group luxury-shadow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 blur-3xl -mr-16 -mt-16 group-hover:bg-black/10 transition-all duration-1000" />
                    <Shield className="text-black/30 mb-8" size={32} strokeWidth={1} />
                    <h4 className="text-[10px] uppercase tracking-[0.5em] text-black/80 font-bold mb-4">Digital Identity Registry</h4>
                    <p className="text-[10px] text-black/30 uppercase tracking-[0.2em] leading-relaxed mb-10 max-w-xs font-medium">
                      Each DINOSPY timepiece is issued a unique cryptographic signature, ensuring absolute provenance and archival lineage.
                    </p>
                    <div className="flex items-center space-x-6">
                      <div className="bg-black/5 px-4 py-2 rounded-none border border-black/5">
                        <span className="text-black font-mono text-[9px] tracking-widest">DS-{product.id?.slice(0, 8).toUpperCase()}-{(new Date().getFullYear())}</span>
                      </div>
                      <span className="text-[8px] uppercase tracking-widest text-black/20 italic">Authenticity Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <section className="mt-32 border-t border-black/5 pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div className="space-y-12">
                <div>
                  <h2 className="text-3xl font-display mb-6">Client Experience</h2>
                  <div className="flex items-center space-x-6 mb-10 p-8 bg-neutral-50 rounded-3xl border border-black/5">
                    <div className="text-6xl font-mono text-black tracking-tighter">{product.rating || '5.0'}</div>
                    <div>
                      <div className="flex text-black mb-2 opacity-20">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={18} fill={i <= Math.floor(product.rating || 5) ? "currentColor" : "none"} strokeWidth={1} />
                        ))}
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 font-bold">Consensus of {reviews.length} Signature Reviews</p>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="space-y-4 px-2">
                    {ratingCounts.map((rc) => (
                      <div key={rc.stars} className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 w-10">
                          <span className="text-[10px] font-mono text-black/40">{rc.stars}</span>
                          <Star size={10} className="text-black/40" fill="currentColor" />
                        </div>
                        <div className="flex-grow h-[2px] bg-black/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${rc.percentage}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full bg-black/40"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-black/20 w-8">{rc.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-10 border-t border-black/5">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] uppercase tracking-[0.4em] text-black/60 font-bold">Review Feed</h3>
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-[10px] uppercase tracking-widest text-black font-bold outline-none cursor-pointer border-b border-black/20 pb-1"
                      >
                        <option value="newest" className="bg-white">Chronological</option>
                        <option value="highest" className="bg-white">Tier: Prestige</option>
                        <option value="lowest" className="bg-white">Tier: Critical</option>
                      </select>
                   </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-12">
                <div className={`bg-white p-10 rounded-[2.5rem] border border-black/5 relative overflow-hidden transition-all duration-700 ${user ? 'hover:border-black/20 shadow-xl' : 'opacity-60 grayscale-[0.5]'}`}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] uppercase tracking-[0.5em] text-black font-black">Elite Review Protocol</h3>
                    {hasPurchased && (
                       <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100 scale-90">
                          <CheckCircle2 size={14} />
                          <span className="text-[9px] uppercase tracking-widest font-bold">Verified Acquisition</span>
                       </div>
                    )}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    onFocus={() => !user && setIsAuthModalOpen(true)}
                    placeholder={user ? "Describe your horological experience with the signature Dinospy craftsmanship..." : "Authorize elite access to publish signature reviews..."}
                    className="w-full bg-black/[0.02] border border-black/10 rounded-[1.5rem] p-8 text-sm focus:border-black/30 outline-none min-h-[180px] mb-8 transition-all placeholder:text-black/20"
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
                    <div className="flex space-x-4">
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`hover:scale-110 transition-transform ${star <= reviewRating ? 'text-black' : 'text-black/10'}`}
                        >
                          <Star size={28} fill={star <= reviewRating ? "currentColor" : "none"} strokeWidth={1} />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || (!reviewComment.trim() && user !== null)}
                      className="w-full sm:w-auto px-12 py-6 bg-black text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl disabled:opacity-30 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                      {isSubmittingReview ? 'Transmitting Manifest...' : 'Deploy Signature Review'}
                    </button>
                  </div>
                  {!user && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[2px] cursor-pointer" onClick={() => setIsAuthModalOpen(true)}>
                      <div className="bg-white px-8 py-5 rounded-2xl border border-black/10 shadow-3xl flex items-center space-x-4">
                        <Shield size={24} className="text-black" />
                        <span className="text-[11px] uppercase tracking-[0.3em] font-bold">Signature Recognition Required</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {sortedReviews.length === 0 ? (
                    <div className="bg-neutral-50 p-20 rounded-3xl border border-dashed border-black/10 text-center animate-in fade-in">
                      <p className="text-black/20 uppercase tracking-[0.5em] text-[10px] font-bold">Awaiting first signature legacy</p>
                    </div>
                  ) : (
                    sortedReviews.map((review) => (
                      <motion.div 
                        key={review.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-10 rounded-[2rem] border border-black/5 relative group hover:border-black/10 transition-colors shadow-sm"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-black/5 border border-black/5 flex items-center justify-center text-black font-bold text-lg">
                              {review.userName.charAt(0)}
                            </div>
                            <div>
                               <div className="flex items-center space-x-3">
                                 <p className="font-bold text-black/90 text-sm">{review.userName}</p>
                                 {(review.verified || review.isVerified) && (
                                   <div className="flex items-center text-[8px] text-green-600 uppercase font-black tracking-widest bg-green px-2 py-0.5 rounded border border-green-100">
                                      <CheckCircle2 size={8} className="mr-1" />
                                      Verified Asset
                                   </div>
                                 )}
                               </div>
                               <p className="text-[10px] text-black/30 uppercase tracking-widest font-medium mt-1">
                                 {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                               </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 text-black">
                            <div className="flex">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} size={14} fill={i <= review.rating ? "currentColor" : "none"} strokeWidth={1} className={i <= review.rating ? 'opacity-100' : 'opacity-10'} />
                                ))}
                            </div>
                            <span className="text-[9px] uppercase tracking-widest text-black/20 font-bold">Tier {review.rating}.0 Prestige</span>
                          </div>
                        </div>
                        <p className="text-black/60 leading-relaxed text-lg mb-8 font-light max-w-2xl px-4 border-l border-black/10">
                          "{review.comment}"
                        </p>
                        
                        <div className="pt-8 border-t border-black/5 flex items-center justify-between">
                           <button 
                             onClick={() => handleHelpful(review.id)}
                             className="flex items-center space-x-3 text-black/30 hover:text-black transition-all group/btn"
                           >
                              <div className="p-2 rounded-full bg-black/5 group-hover/btn:bg-black/10 transition-colors">
                                <ThumbsUp size={14} className={review.helpfulBy?.includes(user?.uid) ? 'text-black fill-black' : ''} />
                              </div>
                              <span className="text-[10px] uppercase tracking-widest font-bold">
                                Appreciation ({review.helpfulCount || 0})
                              </span>
                           </button>
                           
                           <div className="flex space-x-2">
                              <div className="w-1 h-1 rounded-full bg-black/5" />
                              <div className="w-1 h-1 rounded-full bg-black/5" />
                              <div className="w-1 h-1 rounded-full bg-black/5" />
                           </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Immersive Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center"
          >
            {/* Controls */}
            <div className="absolute top-10 w-full px-12 flex justify-between items-center">
               <div className="flex flex-col">
                  <span className="text-black text-[10px] uppercase tracking-[0.6em] font-bold mb-2">Detailed Inspection</span>
                  <span className="text-black/40 text-[9px] uppercase tracking-[0.4em] font-medium">{product.name} — Asset {activeImage + 1} of {product.images.length}</span>
               </div>
               <button 
                 onClick={() => setIsLightboxOpen(false)}
                 className="p-4 rounded-full bg-black/5 border border-black/10 text-black/40 hover:text-black hover:bg-black/10 transition-all group luxury-shadow"
               >
                 <X size={24} strokeWidth={1} />
               </button>
            </div>

            {/* Navigation Left */}
            <button 
              onClick={() => setActiveImage(prev => prev === 0 ? product.images.length - 1 : prev - 1)}
              className="absolute left-10 p-6 rounded-full bg-black/5 border border-black/5 text-black/20 hover:text-black hover:border-black/20 transition-all luxury-shadow hidden md:block"
            >
              <ChevronLeft size={32} strokeWidth={1} />
            </button>

            {/* Navigation Right */}
            <button 
              onClick={() => setActiveImage(prev => prev === product.images.length - 1 ? 0 : prev + 1)}
              className="absolute right-10 p-6 rounded-full bg-black/5 border border-black/5 text-black/20 hover:text-black hover:border-black/20 transition-all luxury-shadow hidden md:block"
            >
              <ChevronRight size={32} strokeWidth={1} />
            </button>

            {/* Main Lightbox Image */}
            <motion.div 
              key={activeImage}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              className="relative w-full max-w-5xl aspect-square flex items-center justify-center cursor-default bg-neutral-50 rounded-[4rem] overflow-hidden"
            >
              {product.images?.[activeImage] ? (
                <img 
                  src={product.images[activeImage]} 
                  alt={product.name} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <>
                  <div className="font-display text-[20rem] opacity-[0.03] select-none pointer-events-none">
                    {product.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="w-1/2 h-[1px] bg-black/10 my-12" />
                  <div className="font-mono text-xs tracking-[1em] text-black/20 uppercase font-black">Macro_Analysis_Core</div>
                </>
              )}
            </motion.div>

            {/* Thumbnail Strip */}
            <div className="absolute bottom-10 flex space-x-6">
               {product.images.map((img: string, i: number) => (
                 <button 
                   key={i}
                   onClick={() => setActiveImage(i)}
                   className={`relative w-16 aspect-square overflow-hidden rounded-xl border transition-all duration-700 flex items-center justify-center font-mono text-[9px] font-bold ${activeImage === i ? 'border-black bg-black text-white scale-110 shadow-xl' : 'border-black/10 bg-white/50 text-black/20 hover:opacity-100 hover:border-black/20'}`}
                 >
                   0{i + 1}
                 </button>
               ))}
            </div>

            {/* Technical Detail Watermark */}
            <div className="absolute bottom-12 right-12 opacity-5 pointer-events-none">
               <span className="text-[60px] font-display text-black uppercase tracking-[0.5em] leading-none select-none">DINOSPY</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
