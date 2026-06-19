import React from 'react';
import { Watch } from 'lucide-react';

export default function ProductSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse px-2">
      {/* Badge Skeletons */}
      <div className="flex justify-between items-start mb-6">
        <div className="h-2 w-16 bg-text/5" />
      </div>
      
      {/* Image Skeleton */}
      <div className="aspect-[3/4] mb-8 bg-slate hairline flex items-center justify-center relative overflow-hidden">
        <Watch size={32} strokeWidth={1} className="text-text/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/20 to-transparent" />
      </div>

      {/* Text Skeletons */}
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-6">
           <div className="space-y-4">
             <div className="h-2 w-12 bg-text/5" />
             <div className="h-6 w-32 bg-text/5" />
           </div>
           <div className="h-2 w-16 bg-text/10" />
        </div>
        
        <div className="flex items-center justify-between pt-8 border-t border-text/5 mt-auto">
          <div className="h-6 w-24 bg-text/5" />
          <div className="h-8 w-20 bg-text/5" />
        </div>
      </div>
    </div>
  );
}
