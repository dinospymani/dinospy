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
