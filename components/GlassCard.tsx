'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`bg-white/85 backdrop-blur-md border border-white/80 shadow-[0_8px_32px_0_rgba(140,106,71,0.08)] rounded-3xl ${className}`}
    >
      {children}
    </div>
  );
}

export default GlassCard;
