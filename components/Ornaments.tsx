import React from 'react';

/**
 * Palet Warna Desain Warm Latte & Cinnamon Mocha Coffee:
 * - Aksen Dominan: Cinnamon Mocha #8C6A47
 * - Ambience & Sorotan: Golden Caramel Crema #D49B5B
 * - Tan Sekunder: Biscuit Tan #C4A88E
 * - Dasar: Warm Oat Cream #EFE8E1 / Pure Milk Cream #FAF7F3
 * - Teks Kontras: Deep Roasted Espresso #422F21
 */

/**
 * 1. Sudut Ornamen Tradisional (Traditional Meander / Huiwen Fretwork Corner)
 * Diadopsi dari foto referensi pengguna (media_1790105333561.jpg & media_1790105343176.jpg).
 * Garis ganda dengan simpul geometris siku-siku (回纹 / 拐子角花) bernuansa Cinnamon Mocha & Golden Caramel.
 */
export function TraditionalCorner({
  position = 'top-left',
  className = 'w-8 h-8',
}: {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}) {
  const transformMap = {
    'top-left': '',
    'top-right': 'scale-x-[-1]',
    'bottom-left': 'scale-y-[-1]',
    'bottom-right': 'scale-x-[-1] scale-y-[-1]',
  };

  return (
    <div className={`select-none pointer-events-none ${className} ${transformMap[position]}`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Garis Border Luar Siku */}
        <path d="M 2 38 V 4 A 2 2 0 0 1 4 2 H 38" stroke="#8C6A47" strokeWidth="2.5" strokeLinecap="round" />
        {/* Garis Border Dalam Siku */}
        <path d="M 6 36 V 8 A 2 2 0 0 1 8 6 H 36" stroke="#D49B5B" strokeWidth="1.2" strokeLinecap="round" />

        {/* Motif Simpul Fretwork Geometris Sudut (回纹 / Greek Key) */}
        <path
          d="M 10 28 V 12 A 2 2 0 0 1 12 10 H 28 V 22 H 16 V 16 H 22"
          stroke="#8C6A47"
          strokeWidth="1.8"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />

        {/* Aksen Titik Emas Karamel */}
        <rect x="18" y="18" width="2.5" height="2.5" fill="#D49B5B" />
      </svg>
    </div>
  );
}

/**
 * 2. Bingkai Plakat Bunga Begonia Tradisional (Begonia / Quatrefoil Cartouche)
 * Diadopsi persis dari ornamen sudut kiri atas gambar referensi (media_1790105333561.jpg).
 * Garis ganda dengan 4 lengkung kelopak simetris dan 4 lekuk sudut bertingkat.
 */
export function BegoniaCartouche({
  children,
  className = '',
  title,
  subtitle,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className={`relative flex items-center justify-center p-3 select-none ${className}`}>
      {/* Bingkai SVG Begonia Tradisional */}
      <svg
        viewBox="0 0 240 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full drop-shadow-[0_2px_6px_rgba(140,106,71,0.15)] pointer-events-none"
        preserveAspectRatio="none"
      >
        {/* Latar Belakang Krim Halus */}
        <path
          d="M 40 8 
             C 45 4, 55 4, 60 8
             L 180 8 
             C 185 4, 195 4, 200 8
             C 205 12, 207 18, 212 18
             C 218 18, 224 16, 228 20
             C 234 26, 234 34, 230 40
             C 234 46, 234 54, 228 60
             C 224 64, 218 62, 212 62
             C 207 62, 205 68, 200 72
             L 60 72
             C 55 76, 45 76, 40 72
             C 35 68, 33 62, 28 62
             C 22 62, 16 64, 12 60
             C 6 54, 6 46, 10 40
             C 6 34, 6 26, 12 20
             C 16 16, 22 18, 28 18
             C 33 18, 35 12, 40 8 Z"
          fill="#FAF7F3"
          stroke="#8C6A47"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Garis Ganda Dalam Bernuansa Karamel */}
        <path
          d="M 43 13 
             L 177 13 
             C 181 9, 189 9, 194 13
             C 198 17, 202 21, 207 21
             C 213 21, 217 19, 221 23
             C 226 28, 226 34, 223 40
             C 226 46, 226 52, 221 57
             C 217 61, 213 59, 207 59
             C 202 59, 198 63, 194 67
             L 46 67
             C 41 71, 33 71, 28 67
             C 24 63, 20 59, 15 59
             C 9 59, 5 61, 1 57
             L 1 23
             C 5 19, 9 21, 15 21
             C 20 21, 24 17, 28 13
             C 33 9, 41 9, 46 13 Z"
          stroke="#D49B5B"
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeDasharray="4 2"
        />

        {/* Aksen Sayap Kiri & Kanan */}
        <circle cx="20" cy="40" r="3" fill="#8C6A47" />
        <circle cx="220" cy="40" r="3" fill="#8C6A47" />
        <circle cx="20" cy="40" r="1.5" fill="#FAF7F3" />
        <circle cx="220" cy="40" r="1.5" fill="#FAF7F3" />
      </svg>

      {/* Konten Di Dalam Plakat Begonia */}
      <div className="relative z-10 text-center px-6 py-2">
        {children ? (
          children
        ) : (
          <>
            {title && (
              <div className="text-xs sm:text-sm font-serif font-black text-[#422F21] tracking-widest uppercase">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-[10px] sm:text-xs text-[#7A624E] font-medium mt-0.5">
                {subtitle}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 3. Medali Bundar Kisi-kisi Tradisional (Traditional Lattice Roundel)
 * Diadopsi dari kolom bulat gambar referensi (media_1790105343176.jpg).
 * Menampilkan lingkaran luar berornamen meander (回纹) dengan kisi-kisi jendela klasik di tengah.
 */
export function TraditionalLatticeRoundel({
  className = 'w-14 h-14',
}: {
  className?: string;
}) {
  return (
    <div className={`select-none shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Lingkaran Luar Cokelat Moka */}
        <circle cx="50" cy="50" r="47" stroke="#8C6A47" strokeWidth="2.5" fill="#FAF7F3" />
        {/* Lingkaran Tengah Emas Karamel */}
        <circle cx="50" cy="50" r="41" stroke="#D49B5B" strokeWidth="1.5" strokeDasharray="3 2" />
        {/* Lingkaran Inti */}
        <circle cx="50" cy="50" r="32" stroke="#8C6A47" strokeWidth="2" fill="#EFE8E1" />

        {/* Pola Kisi-kisi Jendela Antik (Traditional Lattice Window Screen) */}
        {/* Palang Horizontal & Vertikal */}
        <line x1="18" y1="50" x2="82" y2="50" stroke="#8C6A47" strokeWidth="2" />
        <line x1="50" y1="18" x2="50" y2="82" stroke="#8C6A47" strokeWidth="2" />

        {/* Pola Meander Tengah */}
        <rect x="38" y="38" width="24" height="24" stroke="#8C6A47" strokeWidth="2" fill="none" />
        <rect x="44" y="44" width="12" height="12" stroke="#D49B5B" strokeWidth="1.5" fill="#FAF7F3" />
        <circle cx="50" cy="50" r="2.5" fill="#8C6A47" />

        {/* 4 Sudut Kisi Luar */}
        <path d="M 28 32 H 38 V 22" stroke="#8C6A47" strokeWidth="1.8" fill="none" />
        <path d="M 72 32 H 62 V 22" stroke="#8C6A47" strokeWidth="1.8" fill="none" />
        <path d="M 28 68 H 38 V 78" stroke="#8C6A47" strokeWidth="1.8" fill="none" />
        <path d="M 72 68 H 62 V 78" stroke="#8C6A47" strokeWidth="1.8" fill="none" />
      </svg>
    </div>
  );
}

/**
 * 4. Header Emblem Klasik Tradisional (Traditional Header Banner / Plaque Accent)
 * Kombinasi garis simetris horizontal dengan medali ornamen kisi-kisi atau begonia di tengah,
 * menggantikan mahkota rococo lama secara harmonis dan elegan.
 */
export function TraditionalHeaderBanner({
  title = "HAUL & HAFLAH 1448 H / 2027 M",
  className = "w-full max-w-xl mx-auto",
}: {
  title?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center space-x-1.5 sm:space-x-3 select-none ${className}`}>
      {/* Sayap Garis Meander Kiri */}
      <div className="flex-1 flex items-center justify-end space-x-1 min-w-[12px]">
        <div className="h-[2px] w-full max-w-[80px] sm:max-w-[120px] bg-gradient-to-r from-transparent to-[#8C6A47]"></div>
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 border-t-2 border-r-2 border-[#8C6A47] rotate-45 shrink-0"></div>
        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#D49B5B] shrink-0"></div>
      </div>

      {/* Plakat Begonia Kecil di Tengah */}
      <div className="inline-flex items-center px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#FAF7F3] border-2 border-[#8C6A47] shadow-sm shrink-0">
        <TraditionalLatticeRoundel className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 shrink-0" />
        <span className="text-[10px] sm:text-xs font-serif font-black tracking-wider sm:tracking-widest text-[#422F21] uppercase whitespace-nowrap">
          {title}
        </span>
        <TraditionalLatticeRoundel className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2 shrink-0" />
      </div>

      {/* Sayap Garis Meander Kanan */}
      <div className="flex-1 flex items-center justify-start space-x-1 min-w-[12px]">
        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#D49B5B] shrink-0"></div>
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 border-b-2 border-l-2 border-[#8C6A47] rotate-45 shrink-0"></div>
        <div className="h-[2px] w-full max-w-[80px] sm:max-w-[120px] bg-gradient-to-l from-transparent to-[#8C6A47]"></div>
      </div>
    </div>
  );
}

/**
 * 5. Kartu Berbingkai Ornamen Sudut Meander (Traditional Border Card Container)
 * Membungkus elemen dengan 4 sudut ukiran tradisional (media_1790105333561.jpg & media_1790105343176.jpg).
 */
export function TraditionalFrameWrapper({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* 4 Sudut Ornamen Tradisional */}
      <div className="absolute top-2 left-2 z-10">
        <TraditionalCorner position="top-left" className="w-6 h-6 text-[#8C6A47]" />
      </div>
      <div className="absolute top-2 right-2 z-10">
        <TraditionalCorner position="top-right" className="w-6 h-6 text-[#8C6A47]" />
      </div>
      <div className="absolute bottom-2 left-2 z-10">
        <TraditionalCorner position="bottom-left" className="w-6 h-6 text-[#8C6A47]" />
      </div>
      <div className="absolute bottom-2 right-2 z-10">
        <TraditionalCorner position="bottom-right" className="w-6 h-6 text-[#8C6A47]" />
      </div>

      {children}
    </div>
  );
}

/**
 * Plakat Klasik untuk Kompatibilitas
 */
export function PorcelainCartouche({ title, subtitle, className = "" }: { title?: string; subtitle?: string; className?: string }) {
  return (
    <div className={`relative inline-flex items-center px-4 py-2 rounded-2xl bg-[#FAF7F3] border-2 border-[#8C6A47] shadow-md shadow-[#8C6A47]/10 ${className}`}>
      <TraditionalCorner position="top-left" className="w-4 h-4 mr-2 shrink-0" />
      <div className="text-center">
        {title && <div className="text-xs font-serif font-black text-[#422F21] tracking-wider uppercase">{title}</div>}
        {subtitle && <div className="text-[10px] text-[#7A624E] font-serif font-medium">{subtitle}</div>}
      </div>
      <TraditionalCorner position="top-right" className="w-4 h-4 ml-2 shrink-0" />
    </div>
  );
}

/**
 * Guci Keramik Klasik
 */
export function PorcelainUrnIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="24" cy="8" r="5" fill="#FAF7F3" stroke="#D49B5B" strokeWidth="1.2" />
      <circle cx="18" cy="11" r="4.5" fill="#EFE8E1" stroke="#D49B5B" strokeWidth="1.2" />
      <circle cx="30" cy="11" r="4.5" fill="#EFE8E1" stroke="#D49B5B" strokeWidth="1.2" />
      <circle cx="24" cy="9" r="2" fill="#D49B5B" />
      <path d="M14 13 C12 9 16 7 18 10 Z" fill="#8C6A47" />
      <path d="M34 13 C36 9 32 7 30 10 Z" fill="#8C6A47" />
      <path d="M19 14 H29 V17 H19 Z" fill="#FAF7F3" stroke="#8C6A47" strokeWidth="1.2" />
      <path d="M17 14 H31" stroke="#D49B5B" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M19 17 C13 20 12 28 15 35 C17 38 20 40 24 40 C28 40 31 38 33 35 C36 28 35 20 29 17 Z"
        fill="#FFFFFF"
        stroke="#8C6A47"
        strokeWidth="1.8"
      />
      <ellipse cx="24" cy="27" rx="6" ry="7" fill="#EFE8E1" stroke="#8C6A47" strokeWidth="1" />
      <circle cx="24" cy="27" r="3" fill="#8C6A47" />
      <circle cx="24" cy="27" r="1.5" fill="#D49B5B" />
      <path d="M18 40 H30 V43 H18 Z" fill="#FAF7F3" stroke="#8C6A47" strokeWidth="1.2" />
      <path d="M16 43 H32" stroke="#D49B5B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Lentera Dinding Klasik
 */
export function StageLantern({ className = "w-6 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 14 H10 V22 H4" stroke="#8C6A47" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4" cy="18" r="2" fill="#D49B5B" />
      <path d="M10 14 V8 C10 6 12 4 15 4" stroke="#8C6A47" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 13 L15 6 L21 13 Z" fill="#8C6A47" stroke="#5C3E28" strokeWidth="1" />
      <circle cx="15" cy="5" r="1.5" fill="#D49B5B" />
      <path d="M10 13 H20 L18 28 H12 Z" fill="#FCF3E4" stroke="#D49B5B" strokeWidth="1.2" />
      <ellipse cx="15" cy="20" rx="3.5" ry="5.5" fill="#D49B5B" filter="drop-shadow(0 0 6px #D49B5B)" />
      <ellipse cx="15" cy="20" rx="1.5" ry="2.5" fill="#FFFFFF" />
      <path d="M11 28 H19 L15 34 Z" fill="#8C6A47" stroke="#5C3E28" strokeWidth="1" />
      <circle cx="15" cy="35" r="1.5" fill="#D49B5B" />
    </svg>
  );
}

/**
 * Bingkai Pilar Sisi
 */
export function StagePillarAccent({ side = "left" }: { side?: "left" | "right" }) {
  return (
    <div className={`hidden lg:flex flex-col items-center justify-between py-6 px-1.5 bg-[#EFE8E1] border-x-2 border-[#8C6A47]/30 shadow-md w-8 shrink-0 select-none ${side === "left" ? "rounded-l-2xl" : "rounded-r-2xl"}`}>
      <div className="w-6 h-4 bg-gradient-to-b from-[#D49B5B] to-[#BE8340] rounded-t-sm border border-[#9E6728] flex items-center justify-center shadow-sm">
        <div className="w-4 h-1 bg-white/70 rounded-full"></div>
      </div>
      <div className="flex-1 flex justify-center space-x-1 my-3 w-full">
        <div className="w-0.5 h-full bg-[#8C6A47]/35 rounded-full"></div>
        <div className="w-0.5 h-full bg-[#D49B5B]/50 rounded-full"></div>
        <div className="w-0.5 h-full bg-[#8C6A47]/35 rounded-full"></div>
      </div>
      <TraditionalLatticeRoundel className="w-5 h-5 my-1" />
      <div className="flex-1 flex justify-center space-x-1 my-3 w-full">
        <div className="w-0.5 h-full bg-[#8C6A47]/35 rounded-full"></div>
        <div className="w-0.5 h-full bg-[#D49B5B]/50 rounded-full"></div>
        <div className="w-0.5 h-full bg-[#8C6A47]/35 rounded-full"></div>
      </div>
      <div className="w-6 h-4 bg-gradient-to-t from-[#BE8340] to-[#D49B5B] rounded-b-sm border border-[#9E6728] flex items-center justify-center shadow-sm">
        <div className="w-4 h-1 bg-white/70 rounded-full"></div>
      </div>
    </div>
  );
}
