'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function PaymentCountdownTimer({ lockedUntil, onExpire }: { lockedUntil: string; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = new Date(lockedUntil).getTime() - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(lockedUntil).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        onExpire();
      } else {
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  return (
    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-center space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
        SISA WAKTU MENGUNCI PESANAN (6 JAM)
      </span>
      <div className="flex items-center justify-center space-x-2 font-mono font-black text-2xl text-amber-900">
        <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
        <span>
          {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.minutes).padStart(2, '0')} :{' '}
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
      <p className="text-[11px] text-amber-800">
        Pesanan akan otomatis dibatalkan jika transfer &amp; unggah bukti tidak dilakukan dalam 6 jam.
      </p>
    </div>
  );
}
