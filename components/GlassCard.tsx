'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-black/5 rounded-3xl ${className}`}
    >
      {children}
    </div>
  );
}

export default GlassCard;
