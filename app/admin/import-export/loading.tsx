import React from 'react';

export default function ImportExportLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="p-6 rounded-3xl bg-white/40 backdrop-blur-md border border-white/50 shadow-sm">
        <div className="space-y-2">
          <div className="h-7 w-60 bg-blue-900/15 rounded-xl animate-pulse" />
          <div className="h-3.5 w-80 bg-blue-900/10 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white/40 backdrop-blur-md border border-white/50 shadow-sm space-y-4">
          <div className="h-6 w-48 bg-blue-900/15 rounded animate-pulse" />
          <div className="h-28 bg-white/30 rounded-2xl animate-pulse border border-white/40" />
          <div className="h-10 w-full bg-blue-600/30 rounded-xl animate-pulse" />
        </div>
        <div className="p-6 rounded-3xl bg-white/40 backdrop-blur-md border border-white/50 shadow-sm space-y-4">
          <div className="h-6 w-48 bg-blue-900/15 rounded animate-pulse" />
          <div className="h-28 bg-white/30 rounded-2xl animate-pulse border border-white/40" />
          <div className="h-10 w-full bg-blue-600/30 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
