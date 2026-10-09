'use client';

import { useEffect, useState } from 'react';

interface CountdownBadgeProps {
  targetDate: string;
  label?: string;
  className?: string;
  showLabels?: boolean;
}

function calculate(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  const totalSec = Math.max(0, Math.floor(diff / 1000));
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

export function CountdownBadge({ targetDate, label, className = '', showLabels = true }: CountdownBadgeProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculate(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculate(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {label && <span className="font-semibold">{label}</span>}
      <div className="flex items-center gap-1 font-mono font-bold">
        <span className="bg-amber-900/10 px-1.5 py-0.5 rounded text-amber-900">{timeLeft.days}d</span>
        <span>:</span>
        <span className="bg-amber-900/10 px-1.5 py-0.5 rounded text-amber-900">{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>:</span>
        <span className="bg-amber-900/10 px-1.5 py-0.5 rounded text-amber-900">{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>:</span>
        <span className="bg-amber-900/10 px-1.5 py-0.5 rounded text-amber-900">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    </div>
  );
}

export default CountdownBadge;
