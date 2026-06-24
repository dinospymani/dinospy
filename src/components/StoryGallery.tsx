import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db } from '../context/AuthContext';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export default function StoryGallery() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'story_banners'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.warn("Story banners restricted:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return null;
  if (banners.length === 0) return null;

  return (
    <div className="w-full space-y-12 md:space-y-24 py-12 md:py-24 bg-white overflow-hidden">
      {banners.map((banner, index) => (
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="container mx-auto px-6 md:px-12"
        >
          {banner.link ? (
            <Link to={banner.link} className="block group">
              <BannerImage imageUrl={banner.imageUrl} mobileImageUrl={banner.mobileImageUrl} />
            </Link>
          ) : (
            <BannerImage imageUrl={banner.imageUrl} mobileImageUrl={banner.mobileImageUrl} />
          )}
        </motion.div>
      ))}
    </div>
  );
}

const BannerImage = ({ imageUrl, mobileImageUrl }: { imageUrl: string; mobileImageUrl?: string }) => (
  <div className="relative aspect-[4/5] md:aspect-[21/9] w-full rounded-[2.5rem] md:rounded-[5rem] overflow-hidden shadow-2xl border border-black/5 group">
    <picture>
      {mobileImageUrl && <source media="(max-width: 768px)" srcSet={mobileImageUrl} />}
      <img 
        src={imageUrl} 
        alt="Story Visual" 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" 
      />
    </picture>
    <div className="absolute inset-0 bg-black/5 group-hover:opacity-0 transition-opacity duration-1000" />
    
    {/* Decorative element to ensure premium feel */}
    <div className="absolute bottom-10 left-10 md:bottom-20 md:left-20 flex items-center space-x-6 opacity-0 group-hover:opacity-100 transition-all duration-1000 translate-y-4 group-hover:translate-y-0">
       <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
       <span className="font-tech text-white text-[10px] tracking-[0.5em] uppercase font-black">EXPAND_PERSPECTIVE</span>
    </div>
  </div>
);
