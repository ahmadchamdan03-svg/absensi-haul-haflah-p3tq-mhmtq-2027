import React from 'react';
import { SkeletonTable } from '@/components/ui/GlassSkeleton';

export default function WhatsAppLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Tab Switcher Utama */}
      <div className="flex items-center gap-3 border-b border-white/50 pb-3">
        <div className="h-11 w-44 bg-blue-600/30 rounded-2xl animate-pulse border border-blue-600/40" />
        <div className="h-11 w-44 bg-white/40 rounded-2xl animate-pulse border border-white/60" />
      </div>

      {/* Header Panel Gateway */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-lg rounded-3xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100/60 animate-pulse border border-white/60" />
            <div className="space-y-1.5">
              <div className="h-6 w-64 bg-blue-900/15 rounded-lg animate-pulse" />
              <div className="h-3.5 w-72 bg-blue-900/10 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-32 bg-white/60 rounded-xl animate-pulse" />
        </div>

        {/* Sub-tabs Skeleton */}
        <div className="pt-3 border-t border-white/50 flex gap-2">
          <div className="h-9 w-32 bg-blue-600/30 rounded-xl animate-pulse" />
          <div className="h-9 w-32 bg-white/50 rounded-xl animate-pulse" />
          <div className="h-9 w-32 bg-white/50 rounded-xl animate-pulse" />
        </div>

        {/* Preview Box Skeleton */}
        <div className="mt-4 p-4 rounded-2xl bg-white/40 border border-white/50 space-y-2">
          <div className="h-4 w-52 bg-blue-900/15 rounded animate-pulse" />
          <div className="h-24 bg-white/30 rounded-xl animate-pulse border border-white/40" />
        </div>
      </div>

      {/* Recipient Table Skeleton */}
      <SkeletonTable rows={8} cols={7} />
    </div>
  );
}
