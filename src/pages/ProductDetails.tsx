import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, Heart, Star, Shield, Truck, RotateCcw, ArrowLeft, ChevronRight, Play, Share2, ThumbsUp, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
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
        toast.success('Shared successfully');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
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

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', id),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
    <div className="flex flex-col min-h-screen bg-luxury-black">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-32">
          <div className="aspect-square bg-white/[0.02] border border-white/5" />
          <div className="space-y-12">
            <div className="h-4 w-1/4 bg-white/[0.02]" />
            <div className="h-24 w-3/4 bg-white/[0.02]" />
            <div className="h-12 w-1/2 bg-white/[0.02]" />
            <div className="space-y-4 pt-12 border-t border-white/5">
              {[1,2,3,4].map(i => <div key={i} className="h-6 w-full bg-white/[0.02]" />)}
            </div>
            <div className="h-20 w-full bg-white/5" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
  if (!product) return <div className="h-screen flex items-center justify-center">Product not found.</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-white/60 hover:text-gold transition-colors p-2 -ml-2"
            >
              <ArrowLeft size={20} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Back to Gallery</span>
            </button>
          </div>

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-4 text-[10px] uppercase tracking-[0.5em] text-white/30 mb-20 font-bold">
            <Link to="/" className="hover:text-gold transition-colors">Home</Link>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <Link to="/explore" className="hover:text-gold transition-colors">{product.category}</Link>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-white/60">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-32">
            {/* Left: Images */}
            <div className="space-y-12">
              <motion.div 
                layoutId={`image-${product.id}`}
                className="relative aspect-square overflow-hidden bg-luxury-black/30 border border-white/5 cursor-zoom-in group luxury-shadow"
                transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
              >
                <motion.div 
                   key={activeImage}
                   initial={{ opacity: 0, scale: 1.1 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                   className="w-full h-full"
                >
                  <img 
                    src={product.images[activeImage]} 
                    alt={product.name}
                    className="w-full h-full object-contain p-12 group-hover:scale-110 transition-transform duration-[3s] ease-out"
                  />
                </motion.div>
                
                <div className="absolute top-10 left-10">
                   {product.isLimited && (
                     <div className="px-5 py-2 border border-gold/40 bg-luxury-black/50 backdrop-blur-md text-gold text-[9px] font-bold uppercase tracking-[0.4em]">
                        Limited Edition
                     </div>
                   )}
                </div>

                {/* Unique Feature: Precision Heartbeat */}
                <div className="absolute bottom-10 right-10 flex items-center space-x-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] uppercase tracking-[0.5em] text-white/20 font-bold mb-2">Mechanical Pulse</span>
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
                          className="w-[1px] bg-gold"
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
                    className={`relative w-20 aspect-square overflow-hidden border transition-all duration-700 ${activeImage === i ? 'border-gold p-1' : 'border-transparent opacity-20 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex flex-col justify-center">
              <div className="mb-16">
                <span className="text-gold font-sans text-[11px] uppercase tracking-[0.6em] mb-10 block font-bold">
                  The {product.category} Series
                </span>
                <h1 className="text-5xl md:text-8xl font-display mb-10 leading-[0.9] font-light tracking-tight">{product.name}</h1>
                
                <div className="flex items-center space-x-8 mb-16 pb-12 border-b border-white/5">
                   <div className="text-4xl md:text-5xl font-light text-white/90 tracking-tighter">
                     <span className="text-xs text-white/30 mr-4 uppercase tracking-widest align-middle">INR</span>
                     {product.price.toLocaleString()}
                   </div>
                   <div className="h-10 w-[1px] bg-white/10" />
                   <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-gold animate-pulse' : 'bg-red-900'}`} />
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">
                         {product.stock > 0 ? 'Vault Reserved' : 'Archive Only'}
                      </span>
                   </div>
                </div>

                <p className="text-white/40 leading-relaxed text-xl font-light italic mb-16 max-w-xl">
                  "{product.description}"
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-y-12 gap-x-20 mb-20">
                {Object.entries(product.specs || {}).map(([key, val]: [string, any]) => (
                  <div key={key} className="space-y-3">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-gold font-bold block">{key}</span>
                    <span className="text-sm font-light text-white/80 uppercase tracking-widest leading-relaxed">{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col space-y-10">
                <div className="flex items-center space-x-12">
                   <div className="flex items-center space-x-8 border-b border-white/10 pb-4">
                      <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="text-white/30 hover:text-gold transition-colors text-xl font-light"
                      >
                        —
                      </button>
                      <span className="text-xl font-light w-8 text-center">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(q => q < product.stock ? q + 1 : q)}
                        className="text-white/30 hover:text-gold transition-colors text-xl font-light"
                      >
                        +
                      </button>
                   </div>
                   <span className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold italic">Units of Acquisition</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  <button 
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className={`flex-grow py-6 border border-gold/50 text-gold hover:bg-gold hover:text-luxury-black transition-all duration-700 text-[11px] uppercase tracking-[0.5em] font-bold ${product.stock <= 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                  >
                    Acquire Piece
                  </button>
                  <button 
                    onClick={() => {
                      if (!user) {
                        setIsAuthModalOpen(true);
                        return;
                      }
                      toggleWishlist(product.id!);
                    }}
                    className={`px-10 py-6 border border-white/10 transition-all duration-500 hover:border-gold/50 ${isWishlisted ? 'text-gold' : 'text-white/30'}`}
                  >
                    <Heart size={20} strokeWidth={1} fill={isWishlisted ? "currentColor" : "none"} />
                  </button>
                </div>
                
                <button 
                  onClick={handleShare}
                  className="text-[10px] uppercase font-bold tracking-[0.5em] text-white/20 hover:text-gold transition-colors flex items-center group w-fit"
                >
                  Share Asset Details
                  <div className="w-12 h-[1px] bg-white/10 ml-6 group-hover:bg-gold group-hover:w-20 transition-all duration-700" />
                </button>

                {/* Unique Feature: Digital Identity Registry */}
                <div className="pt-20 mt-20 border-t border-white/5">
                  <div className="p-10 border border-white/5 bg-white/[0.01] relative overflow-hidden group luxury-shadow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-all duration-1000" />
                    <Shield className="text-gold/30 mb-8" size={32} strokeWidth={1} />
                    <h4 className="text-[10px] uppercase tracking-[0.5em] text-white/80 font-bold mb-4">Digital Identity Registry</h4>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] leading-relaxed mb-10 max-w-xs font-medium">
                      Each DINOSPY timepiece is issued a unique cryptographic signature, ensuring absolute provenance and archival lineage.
                    </p>
                    <div className="flex items-center space-x-6">
                      <div className="bg-white/5 px-4 py-2 rounded-none border border-white/5">
                        <span className="text-gold font-mono text-[9px] tracking-widest">DS-{product.id?.slice(0, 8).toUpperCase()}-{(new Date().getFullYear())}</span>
                      </div>
                      <span className="text-[8px] uppercase tracking-widest text-white/20 italic">Authenticity Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <section className="mt-32 border-t border-white/5 pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div className="space-y-12">
                <div>
                  <h2 className="text-3xl font-display mb-6">Client Experience</h2>
                  <div className="flex items-center space-x-6 mb-10 p-8 glass rounded-3xl border border-white/5 bg-gradient-to-br from-gold/5 to-transparent">
                    <div className="text-6xl font-mono text-gold tracking-tighter">{product.rating || '5.0'}</div>
                    <div>
                      <div className="flex text-gold mb-2">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={18} fill={i <= Math.floor(product.rating || 5) ? "currentColor" : "none"} strokeWidth={1.5} />
                        ))}
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Consensus of {reviews.length} Signature Reviews</p>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="space-y-4 px-2">
                    {ratingCounts.map((rc) => (
                      <div key={rc.stars} className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 w-10">
                          <span className="text-[10px] font-mono text-white/40">{rc.stars}</span>
                          <Star size={10} className="text-gold/40" fill="currentColor" />
                        </div>
                        <div className="flex-grow h-[2px] bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${rc.percentage}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full bg-gold/40"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-white/20 w-8">{rc.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-10 border-t border-white/5">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] uppercase tracking-[0.4em] text-white/60 font-bold">Review Feed</h3>
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-[10px] uppercase tracking-widest text-gold font-bold outline-none cursor-pointer border-b border-gold/20 pb-1"
                      >
                        <option value="newest" className="bg-luxury-black">Chronological</option>
                        <option value="highest" className="bg-luxury-black">Tier: Prestige</option>
                        <option value="lowest" className="bg-luxury-black">Tier: Critical</option>
                      </select>
                   </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-12">
                <div className={`glass p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden transition-all duration-700 ${user ? 'hover:border-gold/20' : 'opacity-60 grayscale-[0.5]'}`}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] uppercase tracking-[0.5em] text-gold font-black">Elite Review Protocol</h3>
                    {hasPurchased && (
                       <div className="flex items-center space-x-2 text-green-500 bg-green-500/5 px-4 py-2 rounded-full border border-green-500/10 scale-90">
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
                    className="w-full bg-white/[0.02] border border-white/10 rounded-[1.5rem] p-8 text-sm focus:border-gold/30 outline-none min-h-[180px] mb-8 transition-all placeholder:text-white/20"
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
                    <div className="flex space-x-4">
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`hover:scale-110 transition-transform ${star <= reviewRating ? 'text-gold' : 'text-white/10'}`}
                        >
                          <Star size={28} fill={star <= reviewRating ? "currentColor" : "none"} strokeWidth={1} />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || (!reviewComment.trim() && user !== null)}
                      className="w-full sm:w-auto px-12 py-6 gold-gradient text-luxury-black font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl disabled:opacity-30 shadow-[0_20px_40px_rgba(212,175,55,0.1)] hover:scale-105 active:scale-95 transition-all"
                    >
                      {isSubmittingReview ? 'Transmitting Manifest...' : 'Deploy Signature Review'}
                    </button>
                  </div>
                  {!user && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px] cursor-pointer" onClick={() => setIsAuthModalOpen(true)}>
                      <div className="glass px-8 py-5 rounded-2xl border border-white/10 shadow-3xl flex items-center space-x-4 bg-luxury-black/40">
                        <Shield size={24} className="text-gold" />
                        <span className="text-[11px] uppercase tracking-[0.3em] font-bold">Signature Recognition Required</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {sortedReviews.length === 0 ? (
                    <div className="glass p-20 rounded-3xl border border-dashed border-white/10 text-center animate-in fade-in">
                      <p className="text-white/20 uppercase tracking-[0.5em] text-[10px] font-bold">Awaiting first signature legacy</p>
                    </div>
                  ) : (
                    sortedReviews.map((review) => (
                      <motion.div 
                        key={review.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass p-10 rounded-[2rem] border border-white/5 relative group hover:border-white/10 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold text-lg">
                              {review.userName.charAt(0)}
                            </div>
                            <div>
                               <div className="flex items-center space-x-3">
                                 <p className="font-bold text-white/90 text-sm">{review.userName}</p>
                                 {(review.verified || review.isVerified) && (
                                   <div className="flex items-center text-[8px] text-green-500 uppercase font-black tracking-widest bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10">
                                      <CheckCircle2 size={8} className="mr-1" />
                                      Verified Asset
                                   </div>
                                 )}
                               </div>
                               <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium mt-1">
                                 {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                               </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex text-gold">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} size={14} fill={i <= review.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                              ))}
                            </div>
                            <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold">Tier {review.rating}.0 Prestige</span>
                          </div>
                        </div>
                        <p className="text-white/60 leading-relaxed italic text-lg mb-8 font-light max-w-2xl px-4 border-l border-gold/20">
                          "{review.comment}"
                        </p>
                        
                        <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                           <button 
                             onClick={() => handleHelpful(review.id)}
                             className="flex items-center space-x-3 text-white/30 hover:text-gold transition-all group/btn"
                           >
                              <div className="p-2 rounded-full bg-white/5 group-hover/btn:bg-gold/10 transition-colors">
                                <ThumbsUp size={14} className={review.helpfulBy?.includes(user?.uid) ? 'text-gold fill-gold' : ''} />
                              </div>
                              <span className="text-[10px] uppercase tracking-widest font-bold">
                                Appreciation ({review.helpfulCount || 0})
                              </span>
                           </button>
                           
                           <div className="flex space-x-2">
                              <div className="w-1 h-1 rounded-full bg-white/5" />
                              <div className="w-1 h-1 rounded-full bg-white/5" />
                              <div className="w-1 h-1 rounded-full bg-white/5" />
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
      <MobileNav />
    </div>
  );
}
