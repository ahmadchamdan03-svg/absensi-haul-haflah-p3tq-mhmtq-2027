import React from 'react';
import { SkeletonCard, SkeletonTable } from '@/components/ui/GlassSkeleton';

export default function DasborLoading() {
  return (
    <div className="min-h-screen text-[#0F2C59] p-4 sm:p-6 pb-24 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-blue-900/10 rounded-full animate-pulse border border-blue-900/15" />
          <div className="h-7 w-64 bg-blue-900/15 rounded-xl animate-pulse border border-blue-900/20" />
          <div className="h-3.5 w-48 bg-blue-900/10 rounded-md animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-white/50 rounded-xl animate-pulse border border-white/60" />
          <div className="h-10 w-28 bg-white/50 rounded-xl animate-pulse border border-white/60" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Main Content / Table Skeleton */}
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
