'use client';

import React from 'react';
import { TabKategori } from '@/lib/hooks/usePesertaData';

export interface PesertaTabsProps {
  activeTab: TabKategori;
  setActiveTab: (tab: TabKategori) => void;
  setBagianFilter: (val: string) => void;
  setCurrentPage: (page: number) => void;
  stats: {
    totalSantri: number;
    bilGhoibCount: number;
    binNadzorCount: number;
    tamatanCount: number;
    undanganCount: number;
    undanganIstimewaCount: number;
    undanganKehormatanCount: number;
    undanganUmumCount: number;
    totalSemua: number;
    totalKuota: number;
    totalHadir: number;
  };
}

export default function PesertaTabs({
  activeTab,
  setActiveTab,
  setBagianFilter,
  setCurrentPage,
  stats,
}: PesertaTabsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 border-b border-slate-100 pb-4">
      <div
        onClick={() => {
          setActiveTab('SEMUA');
          setBagianFilter('SEMUA');
          setCurrentPage(1);
        }}
        className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
          activeTab === 'SEMUA'
            ? 'border-opera-700 shadow-md ring-2 ring-opera-600/30'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          TOTAL SEMUA
        </div>
        <div className="text-xl font-serif font-black text-slate-900 mt-1">
          {stats.totalSemua}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 truncate">
          {stats.totalSantri} Santri + {stats.undanganCount} Tamu
        </div>
      </div>

      <div
        onClick={() => {
          setActiveTab('BIL_GHOIB');
          setBagianFilter('SEMUA');
          setCurrentPage(1);
        }}
        className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
          activeTab === 'BIL_GHOIB'
            ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center justify-between">
          <span>BIL GHOIB</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <div className="text-xl font-serif font-black text-emerald-950 mt-1">
          {stats.bilGhoibCount}
        </div>
        <div className="text-[10px] text-emerald-700 mt-0.5 truncate">
          4 Kursi · Hitam Gold
        </div>
      </div>

      <div
        onClick={() => {
          setActiveTab('BIN_NADZOR');
          setBagianFilter('SEMUA');
          setCurrentPage(1);
        }}
        className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
          activeTab === 'BIN_NADZOR'
            ? 'border-blue-600 shadow-md ring-2 ring-blue-500/30'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wide flex items-center justify-between">
          <span>BIN NADZORI</span>
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        </div>
        <div className="text-xl font-serif font-black text-blue-950 mt-1">
          {stats.binNadzorCount}
        </div>
        <div className="text-[10px] text-blue-700 mt-0.5 truncate">2 Kursi · Merah Gold</div>
      </div>

      <div
        onClick={() => {
          setActiveTab('TAMATAN');
          setBagianFilter('SEMUA');
          setCurrentPage(1);
        }}
        className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
          activeTab === 'TAMATAN'
            ? 'border-amber-600 shadow-md ring-2 ring-amber-500/30'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide flex items-center justify-between">
          <span>TAMATAN</span>
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        </div>
        <div className="text-xl font-serif font-black text-amber-950 mt-1">
          {stats.tamatanCount}
        </div>
        <div className="text-[10px] text-amber-800 mt-0.5 truncate">2 Kursi · Merah Gold</div>
      </div>

      <div
        onClick={() => {
          setActiveTab('UNDANGAN_ISTIMEWA');
          setBagianFilter('SEMUA');
          setCurrentPage(1);
        }}
        className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
          activeTab === 'UNDANGAN_ISTIMEWA'
            ? 'border-amber-600 shadow-md ring-2 ring-amber-500/30 bg-amber-50/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide flex items-center justify-between">
          <span>🌟 ISTIMEWA</span>
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        </div>
        <div className="text-xl font-serif font-black text-amber-950 mt-1">
          {stats.undanganIstimewaCount}
        </div>
        <div className="text-[10px] text-amber-700 mt-0.5 truncate">VVIP &amp; VIP</div>
      </div>

      <div
        onClick={() => {
          setActiveTab('UNDANGAN_KEHORMATAN');
          setBagianFilter('SEMUA');
          setCurrentPage(1);
        }}
        className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
          activeTab === 'UNDANGAN_KEHORMATAN'
            ? 'border-purple-600 shadow-md ring-2 ring-purple-500/30 bg-purple-50/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="text-[10px] font-bold text-purple-800 uppercase tracking-wide flex items-center justify-between">
          <span>🏛️ KEHORMATAN</span>
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
        </div>
        <div className="text-xl font-serif font-black text-purple-950 mt-1">
          {stats.undanganKehormatanCount}
        </div>
        <div className="text-[10px] text-purple-700 mt-0.5 truncate">Tamu Khusus</div>
      </div>

      <div
        onClick={() => {
          setActiveTab('UNDANGAN_UMUM');
          setBagianFilter('SEMUA');
          setCurrentPage(1);
        }}
        className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
          activeTab === 'UNDANGAN_UMUM'
            ? 'border-cyan-600 shadow-md ring-2 ring-cyan-500/30 bg-cyan-50/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="text-[10px] font-bold text-cyan-800 uppercase tracking-wide flex items-center justify-between">
          <span>👥 UMUM</span>
          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
        </div>
        <div className="text-xl font-serif font-black text-cyan-950 mt-1">
          {stats.undanganUmumCount}
        </div>
        <div className="text-[10px] text-cyan-700 mt-0.5 truncate">Tamu Undangan Umum</div>
      </div>
    </div>
  );
}
