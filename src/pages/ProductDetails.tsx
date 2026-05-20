import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, Heart, Star, Shield, Truck, RotateCcw, ArrowLeft, ChevronRight, Play, Share2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileNav from '../components/MobileNav';
import { db } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { doc, onSnapshot, collection, query, where, orderBy, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
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

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
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
                className="relative aspect-square rounded-[2rem] sm:rounded-3xl overflow-hidden glass border border-white/5 cursor-zoom-in group shadow-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <motion.div 
                   key={activeImage}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   drag="x"
                   dragConstraints={{ left: 0, right: 0 }}
                   onDragEnd={(_, info) => {
                     if (info.offset.x < -50 && activeImage < product.images.length - 1) setActiveImage(activeImage + 1);
                     if (info.offset.x > 50 && activeImage > 0) setActiveImage(activeImage - 1);
                   }}
                   transition={{ duration: 0.4, ease: "easeOut" }}
                   className="w-full h-full cursor-grab active:cursor-grabbing"
                >
                  <img 
                    src={product.images[activeImage]} 
                    alt={product.name}
                    className="w-full h-full object-contain bg-luxury-black/40 transition-transform duration-700 md:group-hover:scale-125"
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
                     <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? (product.stock <= 5 ? 'bg-orange-500 animate-pulse' : 'bg-green-500') : 'bg-red-500'}`} />
                     <span className={`text-[10px] uppercase tracking-widest font-black ${product.stock > 0 ? (product.stock <= 5 ? 'text-orange-500' : 'text-green-500') : 'text-red-500'}`}>
                        {product.stock > 0 
                          ? (product.stock <= 5 ? `Urgent: Only ${product.stock} Units Remaining` : `${product.stock} Units In Vault`) 
                          : 'Sold Out • Heritage Piece Only'}
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

              <div className="flex flex-col space-y-4 mb-12">
                {product.stock > 0 && (
                   <div className="flex items-center space-x-4">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Select Quantity</span>
                      <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                         <button 
                           onClick={() => setQuantity(q => Math.max(1, q - 1))}
                           className="p-3 hover:bg-white/5 transition-colors"
                         >
                           -
                         </button>
                         <div className="px-6 font-mono text-gold">{quantity}</div>
                         <button 
                           onClick={() => setQuantity(q => q < product.stock ? q + 1 : q)}
                           className="p-3 hover:bg-white/5 transition-colors"
                         >
                           +
                         </button>
                      </div>
                   </div>
                )}

                <div className="flex flex-col space-y-4">
                  <div className="flex space-x-3 sm:space-x-4">
                    <button 
                      onClick={handleAddToCart}
                      disabled={product.stock <= 0}
                      className={`flex-grow py-5 gold-gradient text-luxury-black font-bold uppercase tracking-[0.25em] text-[10px] sm:text-xs transition-all flex items-center justify-center rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.15)] ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                      <ShoppingBag className="mr-3" size={18} />
                      {product.stock > 0 ? 'Acquire Piece' : 'Sold Out'}
                    </button>
                    <button 
                      onClick={() => {
                        if (!user) {
                          setIsAuthModalOpen(true);
                          return;
                        }
                        toggleWishlist(product.id);
                      }}
                      className={`p-5 glass border border-white/10 transition-all rounded-2xl active:scale-[0.95] ${isWishlisted ? 'text-red-500 fill-red-500' : 'hover:text-red-500 text-white/60'}`}
                    >
                      <Heart size={20} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleShare}
                    className="w-full glass py-4 rounded-2xl border border-white/5 text-white/40 hover:text-white flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                  >
                    <Share2 size={14} />
                    <span className="uppercase tracking-[0.3em] text-[8px] font-black">Share with Associates</span>
                  </button>
                </div>
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

          {/* Reviews Section */}
          <section className="mt-32 border-t border-white/5 pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div>
                <h2 className="text-3xl font-display mb-6">Client Experience</h2>
                <div className="flex items-center space-x-4 mb-8">
                  <div className="text-5xl font-mono text-gold">{product.rating || '5.0'}</div>
                  <div>
                    <div className="flex text-gold mb-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={16} fill={i <= Math.floor(product.rating || 5) ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Based on {reviews.length} reviews</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className={`glass p-8 rounded-3xl border border-white/5 relative overflow-hidden transition-all ${user ? '' : 'opacity-60 grayscale-[0.5]'}`}>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold mb-6 font-black">Elite Review Protocol</h3>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    onFocus={() => !user && setIsAuthModalOpen(true)}
                    placeholder={user ? "Describe your horological experience..." : "Authorize elite access to publish reviews..."}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] p-6 text-sm focus:border-gold/50 outline-none min-h-[150px] mb-6 transition-all"
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex space-x-3">
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`hover:scale-110 transition-transform ${star <= reviewRating ? 'text-gold' : 'text-white/10'}`}
                        >
                          <Star size={24} fill={star <= reviewRating ? "currentColor" : "none"} strokeWidth={1} />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || (!reviewComment.trim() && user !== null)}
                      className="w-full sm:w-auto px-10 py-5 gold-gradient text-luxury-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl disabled:opacity-30 shadow-xl"
                    >
                      {isSubmittingReview ? 'Transmitting...' : 'Post Signature Review'}
                    </button>
                  </div>
                  {!user && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px] cursor-pointer" onClick={() => setIsAuthModalOpen(true)}>
                      <div className="glass px-6 py-4 rounded-2xl border border-white/10 shadow-3xl flex items-center space-x-3">
                        <Shield size={20} className="text-gold" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Unlocking Required</span>
                      </div>
                    </div>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div className="glass p-12 rounded-3xl border border-white/5 text-center">
                    <p className="text-white/40 italic">No reviews yet. Be the first to share your experience with this timepiece.</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <motion.div 
                      key={review.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="glass p-8 rounded-2xl border border-white/5"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-white/90">{review.userName}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="flex text-gold">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={12} fill={i <= review.rating ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-white/70 leading-relaxed italic">"{review.comment}"</p>
                    </motion.div>
                  ))
                )}
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
