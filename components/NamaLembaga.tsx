'use client';

import React from 'react';

interface NamaLembagaProps {
  className?: string;
  align?: 'left' | 'center' | 'right';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  color?: string;
}

export function NamaLembaga({
  className = '',
  align = 'left',
  size = 'base',
  weight = 'bold',
  color = '',
}: NamaLembagaProps) {
  const textAlign = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  const fontSize = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[size] || 'text-base';

  const fontWeight = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    black: 'font-black',
  }[weight] || 'font-bold';

  return (
    <div className={`space-y-1 ${textAlign} leading-relaxed ${fontSize} ${color} ${className}`}>
      <p className={`font-serif ${fontWeight}`}>
        Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)
      </p>
      <p className={`font-serif ${fontWeight}`}>
        Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at (MHMTQ)
      </p>
    </div>
  );
}

export default NamaLembaga;
