import React from 'react';
import { SkeletonTable } from '@/components/ui/GlassSkeleton';

export default function AuditLogLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="p-6 rounded-3xl bg-white/40 backdrop-blur-md border border-white/50 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-blue-900/15 rounded-xl animate-pulse" />
          <div className="h-3.5 w-64 bg-blue-900/10 rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-white/60 rounded-xl animate-pulse" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-64 bg-white/40 rounded-xl animate-pulse border border-white/50" />
        <div className="h-10 w-36 bg-white/40 rounded-xl animate-pulse border border-white/50" />
      </div>

      {/* Table Skeleton */}
      <SkeletonTable rows={9} cols={6} />
    </div>
  );
}
