import React from 'react';
import { SkeletonCard, SkeletonTable } from '@/components/ui/GlassSkeleton';

export default function PesertaLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-blue-900/15 rounded-xl animate-pulse border border-blue-900/20" />
          <div className="h-3.5 w-72 bg-blue-900/10 rounded-md animate-pulse" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-24 bg-white/50 rounded-xl animate-pulse border border-white/60" />
          <div className="h-10 w-32 bg-blue-600/30 rounded-xl animate-pulse border border-blue-600/40" />
        </div>
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-10 w-36 bg-blue-600/30 rounded-2xl animate-pulse border border-blue-600/40" />
        <div className="h-10 w-36 bg-white/40 rounded-2xl animate-pulse border border-white/50" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Table Skeleton */}
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}
