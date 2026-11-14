'use client';

import React from 'react';

/**
 * Minimalist sold-out view displayed when extra quota pagu is exhausted.
 */
export default function QuotaSoldOutCardContent() {
  return (
    <div data-testid="quota-sold-out-card-content">
      <button
        type="button"
        disabled
        className="w-full bg-slate-300 text-slate-500 cursor-not-allowed rounded-xl py-3 font-bold text-center"
      >
        Kuota Habis
      </button>
      <p className="text-sm text-slate-500 mt-3 text-center">
        Terima kasih atas antusiasme Bapak/Ibu Wali Santri.
      </p>
    </div>
  );
}
