import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="p-6 sm:p-10 border border-white/5 bg-white/[0.01] flex flex-col h-full animate-pulse">
      {/* Badge Skeletons */}
      <div className="flex flex-col space-y-2 mb-6">
        <div className="h-4 w-16 bg-white/[0.03]" />
      </div>
      
      {/* Image Skeleton */}
      <div className="aspect-square mb-8 sm:mb-12 bg-white/[0.03] rounded-sm" />

      {/* Text Skeletons */}
      <div className="space-y-4 sm:space-y-6 flex-grow flex flex-col justify-end">
        <div className="space-y-3">
          <div className="h-3 w-1/3 bg-white/[0.03] mx-auto" />
          <div className="h-6 w-3/4 bg-white/[0.03] mx-auto" />
        </div>
        
        <div className="pt-6 sm:pt-8 border-t border-white/5 space-y-4 sm:space-y-6">
          <div className="h-6 w-1/3 bg-white/[0.03] mx-auto" />
          <div className="h-10 sm:h-14 w-full bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}
