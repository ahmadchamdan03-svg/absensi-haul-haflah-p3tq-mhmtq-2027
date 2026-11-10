import React from 'react';
import { SkeletonCard, SkeletonTable } from '@/components/ui/GlassSkeleton';

export default function VerifikasiLoading() {
  return (
    <div className="w-full px-6 lg:px-8 pt-6 pb-12 space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#F0F9FF]/85 backdrop-blur-md border border-[#BAE6FD]/80 shadow-md rounded-3xl p-6">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-blue-900/10 rounded-full animate-pulse border border-blue-900/15" />
          <div className="h-7 w-72 bg-blue-900/15 rounded-xl animate-pulse border border-blue-900/20" />
          <div className="h-3.5 w-96 max-w-full bg-blue-900/10 rounded-md animate-pulse" />
        </div>
        <div className="h-11 w-52 bg-blue-600/30 rounded-2xl animate-pulse border border-blue-600/40" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Table Skeleton */}
      <SkeletonTable rows={7} cols={8} />
    </div>
  );
}
