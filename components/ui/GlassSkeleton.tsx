'use client';

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface SkeletonTextProps extends SkeletonProps {
  width?: string | number;
  height?: string | number;
}

export interface SkeletonCardProps extends SkeletonProps {
  hasBadge?: boolean;
  hasSubtext?: boolean;
}

export interface SkeletonTableProps extends SkeletonProps {
  rows?: number;
  cols?: number;
  showHeader?: boolean;
}

export interface SkeletonListProps extends SkeletonProps {
  rows?: number;
}

/**
 * Komponen dasar Glassmorphism Skeleton dengan efek kaca transparan,
 * blur, border putih halus, dan denyut animate-pulse.
 */
export function SkeletonBase({ className = '', style, ...props }: SkeletonTextProps) {
  return (
    <div
      className={`bg-blue-900/10 backdrop-blur-sm animate-pulse border border-blue-900/15 rounded-lg relative overflow-hidden ${className}`}
      style={style}
      {...props}
    />
  );
}

/**
 * SkeletonText untuk teks, baris heading, atau paragraf.
 */
export function SkeletonText({
  width = '100%',
  height = '1rem',
  className = '',
  style,
  ...props
}: SkeletonTextProps) {
  const customStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={`bg-blue-900/10 backdrop-blur-sm animate-pulse rounded-md border border-blue-900/15 ${className}`}
      style={customStyle}
      {...props}
    />
  );
}

/**
 * SkeletonCard untuk kartu metrik statistik atau kartu ringkasan.
 */
export function SkeletonCard({
  className = '',
  hasBadge = true,
  hasSubtext = true,
  children,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={`p-5 sm:p-6 rounded-3xl bg-white/35 backdrop-blur-md border border-white/30 shadow-sm animate-pulse flex flex-col justify-between space-y-3 min-h-[140px] ${className}`}
      {...props}
    >
      {children || (
        <>
          <div className="flex items-center justify-between gap-3">
            <SkeletonText width="45%" height="0.875rem" className="rounded-full bg-white/40" />
            {hasBadge && (
              <SkeletonText width="2.25rem" height="2.25rem" className="rounded-full bg-white/40 shrink-0" />
            )}
          </div>
          <div className="py-1">
            <SkeletonText width="60%" height="2rem" className="rounded-xl bg-white/45" />
          </div>
          {hasSubtext && (
            <div className="flex items-center gap-2 pt-1">
              <SkeletonText width="30%" height="0.75rem" className="rounded-full bg-white/30" />
              <SkeletonText width="40%" height="0.75rem" className="rounded-full bg-white/30" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * SkeletonTableRow untuk digunakan langsung di dalam <tbody>.
 */
export function SkeletonTableRow({ cols = 5, className = '' }: { cols?: number; className?: string }) {
  return (
    <tr className={`border-b border-blue-900/10 ${className}`}>
      {Array.from({ length: cols }).map((_, cIdx) => (
        <td key={cIdx} className="py-3.5 px-4">
          <div
            className="h-4 bg-blue-900/10 backdrop-blur-xs animate-pulse rounded-lg border border-blue-900/15"
            style={{ width: `${Math.floor(50 + ((cIdx * 17) % 45))}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

/**
 * SkeletonTable lengkap dengan kontainer tabel kaca transparan.
 */
export function SkeletonTable({
  rows = 5,
  cols = 4,
  showHeader = true,
  className = '',
  ...props
}: SkeletonTableProps) {
  return (
    <div
      className={`w-full bg-white/85 backdrop-blur-md rounded-2xl border border-blue-200/60 shadow-xs overflow-hidden ${className}`}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {showHeader && (
            <thead>
              <tr className="bg-blue-100/60 border-b border-blue-200/50">
                {Array.from({ length: cols }).map((_, idx) => (
                  <th key={idx} className="py-3.5 px-4">
                    <div
                      className="h-3.5 bg-blue-900/15 backdrop-blur-xs animate-pulse rounded-md border border-blue-900/20"
                      style={{ width: `${Math.floor(40 + ((idx * 23) % 45))}%` }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-blue-900/10">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <SkeletonTableRow key={rIdx} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * SkeletonList untuk kartu riwayat / feed list (misal riwayat scan atau notifikasi).
 */
export function SkeletonList({ rows = 3, className = '', ...props }: SkeletonListProps) {
  return (
    <div className={`space-y-2.5 ${className}`} {...props}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-3 rounded-2xl bg-white/30 backdrop-blur-xs border border-white/25 shadow-2xs animate-pulse"
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-white/40 border border-white/25 shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0 pr-2">
              <SkeletonText width="65%" height="0.875rem" className="bg-white/40" />
              <SkeletonText width="40%" height="0.75rem" className="bg-white/30" />
            </div>
          </div>
          <div className="w-16 h-6 rounded-xl bg-white/35 border border-white/25 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default {
  Base: SkeletonBase,
  Text: SkeletonText,
  Card: SkeletonCard,
  Table: SkeletonTable,
  TableRow: SkeletonTableRow,
  List: SkeletonList,
};
