'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ModalPortalProps {
  isOpen: boolean;
  onClose?: () => void;
  disableClose?: boolean;
  zIndexClass?: string;
  backdropClassName?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

/**
 * Renders a modal overlay via React Portal directly onto document.body so fixed positioning
 * stays centered in the viewport independent of sidebar collapse state and above layout z-index layers.
 */
export default function ModalPortal({
  isOpen,
  onClose,
  disableClose = false,
  zIndexClass = 'z-[70]',
  backdropClassName = 'bg-black/60 backdrop-blur-sm',
  containerClassName = '',
  children,
}: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !onClose || disableClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, disableClose]);

  if (!mounted || !isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose && !disableClose) {
      onClose();
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClass} ${backdropClassName} overflow-y-auto animate-in fade-in`}
      onClick={handleBackdropClick}
    >
      <div
        className={`flex items-center justify-center min-h-screen px-4 py-6 sm:px-6 sm:py-10 ${containerClassName}`}
        onClick={handleBackdropClick}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
