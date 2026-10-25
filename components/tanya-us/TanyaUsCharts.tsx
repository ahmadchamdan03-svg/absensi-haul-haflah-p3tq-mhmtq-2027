'use client';

import React from 'react';
import { PieChartData } from './tanya-us-helpers';

export function SingleDonutChart({
  title,
  hadir,
  kuota,
  persen,
  colorHadir,
  labelHadir,
}: {
  title: string;
  hadir: number;
  kuota: number;
  persen: number;
  colorHadir: string;
  labelHadir: string;
}) {
  const belum = Math.max(0, kuota - hadir);
  const persenBelum = Math.max(0, 100 - persen);

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 24;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  const strokeDashHadir = (persen / 100) * circumference;
  const strokeDashBelum = circumference - strokeDashHadir;

  return (
    <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-[#8C6A47]/20 flex flex-col justify-between shadow-xs w-full">
      <h4 className="text-xs sm:text-sm font-serif font-black text-[#422F21] mb-2 text-center uppercase tracking-wider flex items-center justify-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorHadir }}></span>
        {title}
      </h4>

      {/* Donut Chart SVG */}
      <div className="relative w-36 h-36 mx-auto my-1 flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-xs">
          {/* Background Circle (Belum Hadir) */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="transparent"
            stroke="#E5E0D8"
            strokeWidth={strokeWidth}
          />
          {/* Foreground Circle (Hadir) */}
          {hadir > 0 && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="transparent"
              stroke={colorHadir}
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeDashHadir} ${strokeDashBelum}`}
              strokeDashoffset={0}
              className="transition-all duration-500 ease-out"
            />
          )}
        </svg>

        {/* Donut Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-black text-[#422F21] leading-none">
            {hadir.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] font-bold text-stone-600 mt-1">
            Hadir ({persen}%)
          </span>
        </div>
      </div>

      {/* Legends */}
      <div className="w-full mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#E8DFD5]">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#422F21]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorHadir }} />
            {labelHadir}
          </span>
          <span className="font-bold text-[11px] text-[#422F21]">
            {hadir.toLocaleString('id-ID')} ({persen}%)
          </span>
        </div>
        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#E8DFD5]">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#E5E0D8]" />
            Belum Hadir
          </span>
          <span className="font-bold text-[11px] text-stone-600">
            {belum.toLocaleString('id-ID')} ({persenBelum}%)
          </span>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="w-full mt-3 pt-2.5 border-t border-[#8C6A47]/15 flex items-center justify-between text-[11px] text-stone-500 font-semibold">
        <span>Kuota: <strong className="text-[#422F21]">{kuota.toLocaleString('id-ID')} kursi</strong></span>
        <span>Hadir: <strong style={{ color: colorHadir }}>{hadir.toLocaleString('id-ID')} ({persen}%)</strong></span>
      </div>
    </div>
  );
}

export function PieChartWidget({ chart }: { chart: PieChartData }) {
  const { title, wali, tamu, data, summary } = chart;

  if (wali && tamu) {
    return (
      <div className="bg-[#FAF6F0] border border-[#E8DFD5] rounded-2xl p-3 sm:p-4 my-3 shadow-xs w-full max-w-full md:max-w-2xl mx-auto text-[#422F21]">
        <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2 mb-3">
          <h4 className="font-serif font-black text-xs sm:text-sm text-[#422F21] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8C6A47]"></span>
            {title || 'KEHADIRAN HAFLAH 2027'}
          </h4>
          <span className="text-[10px] font-bold text-[#8C6A47] bg-[#EFE8E1] px-2 py-0.5 rounded-full border border-[#D5C4B4]">
            Realtime Chart
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <SingleDonutChart
            title={wali.title || 'WALI SANTRI'}
            hadir={wali.totalHadir}
            kuota={wali.totalKuota}
            persen={wali.persenHadir}
            colorHadir={wali.color || '#8C6A47'}
            labelHadir="Wali Santri Hadir"
          />
          <SingleDonutChart
            title={tamu.title || 'TAMU UNDANGAN'}
            hadir={tamu.totalHadir}
            kuota={tamu.totalKuota}
            persen={tamu.persenHadir}
            colorHadir={tamu.color || '#D49B5B'}
            labelHadir="Tamu Undangan Hadir"
          />
        </div>
      </div>
    );
  }

  // Fallback for single chart legacy format
  if (!data || !summary) return null;
  const radius = 60;
  const cx = 80;
  const cy = 80;
  let cumulativeAngle = -Math.PI / 2;
  const totalPercent = data.reduce((acc, slice) => acc + slice.percent, 0) || 100;

  const slices = data.map((slice) => {
    const angle = (slice.percent / totalPercent) * (2 * Math.PI);
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      ...slice,
      pathData,
    };
  });

  const percentHadirTotal = summary.totalKuota > 0 ? Math.round((summary.totalHadir / summary.totalKuota) * 100) : 0;

  return (
    <div className="bg-[#FAF6F0] border border-[#E8DFD5] rounded-2xl p-3 sm:p-4 my-3 shadow-xs max-w-full sm:max-w-md mx-auto text-[#422F21]">
      <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2 mb-3">
        <h4 className="font-serif font-black text-xs sm:text-sm text-[#422F21] uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8C6A47]"></span>
          {title || 'Kehadiran Haflah 2027'}
        </h4>
        <span className="text-[10px] font-bold text-[#8C6A47] bg-[#EFE8E1] px-2 py-0.5 rounded-full border border-[#D5C4B4]">
          Realtime Chart
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="relative shrink-0 w-36 h-36 flex items-center justify-center">
          <svg viewBox="0 0 160 160" className="w-36 h-36 drop-shadow-xs">
            {slices.map((slice, i) => (
              <path
                key={i}
                d={slice.pathData}
                fill={slice.color}
                className="transition-all duration-300 hover:opacity-90"
              />
            ))}
            <circle cx={cx} cy={cy} r={32} fill="#FAF6F0" />
            <text x={cx} y={cy - 2} textAnchor="middle" className="text-[11px] font-black fill-[#422F21]">
              {summary.totalHadir.toLocaleString('id-ID')}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" className="text-[8px] font-bold fill-[#8C6A47]">
              Hadir ({percentHadirTotal}%)
            </text>
          </svg>
        </div>

        <div className="flex-1 w-full space-y-2 text-xs">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/80 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-[#E8DFD5]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: item.color }} />
                <span className="font-semibold text-[11px] sm:text-xs text-[#422F21] truncate">{item.label}</span>
              </div>
              <span className="font-bold text-[11px] sm:text-xs text-[#8C6A47] shrink-0">
                {item.value.toLocaleString('id-ID')} ({item.percent}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-[#E8DFD5] flex items-center justify-between text-[11px] font-semibold text-[#7A624E]">
        <span>Total Kuota: <strong className="text-[#422F21]">{summary.totalKuota.toLocaleString('id-ID')} kursi</strong></span>
        <span>Total Hadir: <strong className="text-[#8C6A47]">{summary.totalHadir.toLocaleString('id-ID')} ({percentHadirTotal}%)</strong></span>
      </div>
    </div>
  );
}
