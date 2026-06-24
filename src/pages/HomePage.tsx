import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import StoryGallery from '../components/StoryGallery';
import WatchCard from '../components/WatchCard';
import ProductSkeleton from '../components/ProductSkeleton';
import Footer from '../components/Footer';
import { Marquee } from '../components/Marquee';
import { MagneticButton } from '../components/MagneticButton';
import { db } from '../context/AuthContext';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { ArrowRight, ShieldCheck, Zap, Droplets, Truck, Star, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';

const WhyCard = ({ icon: Icon, title, desc, i }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: i * 0.1 }}
    className="group relative p-12 bg-white rounded-[3rem] border border-black/5 luxury-shadow overflow-hidden"
  >
    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-[0.02] transition-opacity duration-1000" />
    <div className="absolute -inset-px border-2 border-black opacity-0 group-hover:opacity-10 transition-opacity duration-1000 rounded-[3rem]" />
    
    <div className="relative z-10">
      <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-black flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
        <Icon size={32} className="text-white" strokeWidth={1} />
      </div>
      <h3 className="font-display text-xl md:text-2xl mb-4 text-black">{title}</h3>
      <p className="text-black/40 text-[13px] md:text-sm leading-relaxed font-light">{desc}</p>
    </div>
  </motion.div>
);

const TestimonialCard = ({ text, author, title }) => (
  <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] w-[280px] sm:w-[400px] md:w-[500px] border border-black/5 luxury-shadow relative overflow-hidden group flex-shrink-0">
    <Quote className="absolute top-4 right-4 md:top-8 md:right-8 opacity-5 text-black group-hover:opacity-10 transition-opacity duration-1000" size={120} />
    <div className="relative z-10 space-y-6 md:space-y-8">
      <div className="flex space-x-1 opacity-20">
        {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-black fill-black" />)}
      </div>
      <p className="text-lg md:text-2xl font-display font-medium text-black/80 leading-relaxed max-w-sm">"{text}"</p>
      <div className="flex flex-col">
        <span className="font-mono text-[10px] md:text-xs tracking-widest text-black font-bold uppercase">{author}</span>
        <span className="font-mono text-[8px] md:text-[9px] tracking-widest text-black/30 uppercase mt-1">{title}</span>
      </div>
    </div>
  </div>
);

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const q = query(collection(db, 'products'), limit(6));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeatured(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });

    const qGallery = query(collection(db, 'gallery'), limit(12));
    const unsubGallery = onSnapshot(qGallery, (snap) => {
      setGalleryItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.warn("Gallery sync restricted:", error);
    });

    return () => {
      unsubscribe();
      unsubGallery();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      
      <main>
        <Hero />

        {/* Featured Collection: Grid & Infinite Flow */}
        <section className="py-40 md:py-64 container mx-auto px-6 md:px-12 overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-24 md:mb-40 gap-12">
            <div className="space-y-8">
              <div className="flex items-center space-x-6 opacity-40">
                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                <span className="font-tech text-xs tracking-[0.6em] uppercase">CURATED COLLECTION</span>
              </div>
              <h2 className="text-6xl md:text-8xl lg:text-[10rem] font-display font-medium leading-[0.8] tracking-tightest">
                The New <br /> <span className="opacity-10 text-black">Horizon.</span>
              </h2>
            </div>
            
            <Link to="/explore">
               <MagneticButton>
                  <div className="flex items-center space-x-6 group">
                     <span className="font-tech text-[10px] tracking-[0.6em] text-black/40 group-hover:text-black transition-colors uppercase">VIEW ALL CALIBERS</span>
                     <div className="w-16 h-16 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-700">
                        <ArrowRight size={20} />
                     </div>
                  </div>
               </MagneticButton>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-16">
            {loading ? [...Array(3)].map((_, i) => <ProductSkeleton key={i} />) : 
             featured.slice(0, 3).map((product, i) => (
               <motion.div
                 key={product.id}
                 initial={{ opacity: 0, y: 100 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
               >
                 <WatchCard product={product} />
               </motion.div>
            ))}
          </div>
        </section>

        <StoryGallery />

        {/* Why DINOSPY: Interactive Grid */}
        <section className="py-40 bg-white w-full">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col items-center text-center mb-24 max-w-2xl mx-auto">
               <div className="flex items-center space-x-6 mb-8 opacity-40">
                 <div className="w-1.5 h-1.5 bg-black rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" />
                 <span className="font-tech text-xs tracking-widest uppercase text-black">CORE_ADVANTAGES</span>
                 <div className="w-1.5 h-1.5 bg-black rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" />
               </div>
               <h2 className="text-4xl md:text-7xl font-display font-medium text-black mb-8">Engineered for the elite.</h2>
               <p className="text-black/40 font-light text-base md:text-lg">Every detail optimized for peak performance and structural integrity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <WhyCard i={0} icon={Zap} title="Platinum Integrity" desc="Aerospace-grade Grade 5 titanium and platinum, heat-treated for extreme durability." />
              <WhyCard i={1} icon={ShieldCheck} title="Master Warranty" desc="A comprehensive 5-year global warranty on all DINOSPY movements." />
              <WhyCard i={2} icon={Droplets} title="Fluid Defense" desc="Pressure-tested up to 300M, ensuring absolute water resistance." />
              <WhyCard i={3} icon={Truck} title="Direct Transit" desc="Insured rapid delivery within 48 hours for our global vault members." />
            </div>
          </div>
        </section>

        {/* Testimonials: Infinite Marquee */}
        <section className="py-40 bg-white overflow-hidden border-y border-black/5">
           <div className="container mx-auto px-6 md:px-12 mb-24">
              <div className="flex items-center space-x-6 mb-8 opacity-40">
                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                <span className="font-tech text-xs tracking-widest uppercase text-black">COMMUNITY_PULSE</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-medium text-black">Voices of the vault.</h2>
           </div>

           <Marquee speed={60}>
              <TestimonialCard 
                text="The Archetype 01 is more than a watch; it's a technical marvel on my wrist." 
                author="Alexander Vaughn" 
                title="Horology Enthusiast" 
              />
              <TestimonialCard 
                text="Never seen titanium finished with such clinical precision. Absolutely masterful." 
                author="Marcus Chen" 
                title="Industrial Designer" 
              />
              <TestimonialCard 
                text="A radical departure from tradition that I didn't know I needed." 
                author="Elena Petrov" 
                title="Creative Director" 
              />
              <TestimonialCard 
                text="The movement is silent, yet its presence is unmistakable." 
                author="James Stirling" 
                title="Swiss Collector" 
              />
           </Marquee>
        </section>

        {/* Instagram Gallery Masonry */}
        <section className="py-40 bg-white">
           <div className="container mx-auto px-6 md:px-12">
              <div className="grid grid-cols-12 gap-8">
                 <div className="col-span-12 lg:col-span-4 space-y-8 self-center mb-20 lg:mb-0">
                    <div className="flex items-center space-x-6 mb-8 opacity-40">
                      <div className="w-1.5 h-1.5 bg-black rounded-full" />
                      <span className="font-tech text-xs tracking-widest uppercase text-black">VISUAL_INDEX</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-display font-medium text-black leading-[0.8]">Global <br /> <span className="opacity-10">Presence.</span></h2>
                    <p className="text-black/40 text-xl font-light max-w-sm">Join the mechanical elite. Tag your moments with #DINOSPY_CORE</p>
                    <button className="btn-luxury px-12">FOLLOW_VAULT</button>
                 </div>
                 
                 <div className="col-span-12 lg:col-span-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                       {galleryItems.length > 0 ? (
                         galleryItems.map((item, i) => (
                           <GalleryItem 
                             key={item.id}
                             initials={item.label}
                             imageUrl={item.imageUrl}
                             aspect={item.aspect}
                             delay={i}
                             className={i === 3 ? "md:-mt-20" : ""}
                           />
                         ))
                       ) : (
                         <>
                           <GalleryItem initials="DS" aspect="aspect-square" delay={0} />
                           <GalleryItem initials="AX" aspect="aspect-[3/4]" delay={1} />
                           <GalleryItem initials="CT" aspect="aspect-square" delay={2} />
                           <GalleryItem initials="MN" aspect="aspect-[3/4]" className="md:-mt-20" delay={3} />
                           <GalleryItem initials="VA" aspect="aspect-square" delay={4} />
                           <GalleryItem initials="LT" aspect="aspect-[4/5]" delay={5} />
                         </>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const GalleryItem = ({ aspect, className = "", delay, initials, imageUrl = undefined }: { aspect: string, className?: string, delay: number, initials: string, imageUrl?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay: delay * 0.1, duration: 1 }}
    className={`relative group overflow-hidden rounded-[2rem] ${aspect} ${className} bg-neutral-50 border border-black/5 flex items-center justify-center`}
  >
    {imageUrl ? (
      <>
        <img src={imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" alt={initials} />
        <div className="absolute top-6 left-6 font-tech text-[10px] tracking-[0.4em] font-black uppercase text-black/10 group-hover:text-black/40 transition-colors pointer-events-none z-10">{initials}</div>
      </>
    ) : (
      <div className="font-display text-6xl opacity-[0.03] select-none group-hover:opacity-[0.08] transition-opacity duration-1000 uppercase">{initials}</div>
    )}
    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    <div className="absolute bottom-6 right-6 font-mono text-[8px] text-black/10 group-hover:text-black/40 transition-colors uppercase font-black">Asset_{delay}</div>
  </motion.div>
);
