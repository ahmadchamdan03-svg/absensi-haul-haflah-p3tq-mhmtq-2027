export interface ZoneCoordinate {
  /** Posisi horizontal pada gambar denah (0.0 = tepi kiri, 0.5 = tengah, 1.0 = tepi kanan) */
  pctX: number;
  /** Posisi vertikal pada gambar denah (0.0 = tepi atas, 0.5 = tengah, 1.0 = tepi bawah) */
  pctY: number;
  /** Skala perbesaran (zoom) saat kartu lokasi dipilih */
  scale: number;
}

export const DENAH_COORDINATES: Record<string, ZoneCoordinate> = {
  // Area Dalam Aula
  'panggung-utama': { pctX: 0.415, pctY: 0.355, scale: 2.3 },
  'vvip-putra-sofa': { pctX: 0.32, pctY: 0.465, scale: 2.6 },
  'vip-putra': { pctX: 0.32, pctY: 0.465, scale: 2.6 },
  'vvip-putri-sofa': { pctX: 0.485, pctY: 0.458, scale: 2.6 },
  'vip-putri': { pctX: 0.485, pctY: 0.458, scale: 2.6 },
  'vip-kursi-elephant': { pctX: 0.41, pctY: 0.495, scale: 2.4 },
  'takhtiman-bil-ghoibi': { pctX: 0.475, pctY: 0.528, scale: 2.6 },
  'wali-santri-bil-ghoibi': { pctX: 0.485, pctY: 0.55, scale: 2.6 },
  'takhtiman-bin-nazhri': { pctX: 0.465, pctY: 0.60, scale: 2.4 },
  'tamatan-aliyah': { pctX: 0.465, pctY: 0.685, scale: 2.4 },
  'wali-santri-sh-putra': { pctX: 0.285, pctY: 0.625, scale: 2.4 },
  'wali-santri-sh-putri': { pctX: 0.69, pctY: 0.69, scale: 2.2 },
  'tamu-umum-pa': { pctX: 0.165, pctY: 0.53, scale: 2.4 },
  'tamu-umum-pi': { pctX: 0.69, pctY: 0.53, scale: 2.4 },
  'santri-aula': { pctX: 0.32, pctY: 0.88, scale: 2.2 },
  'operator-center': { pctX: 0.52, pctY: 0.775, scale: 2.7 },
  'booking-shooting-center': { pctX: 0.415, pctY: 0.568, scale: 2.8 },
  'berkatan-dz-pa': { pctX: 0.425, pctY: 0.305, scale: 2.3 },
  'pos-peladen-dz-pa': { pctX: 0.162, pctY: 0.36, scale: 2.5 },

  // Fasilitas & Area Luar
  'parkir-vvip': { pctX: 0.195, pctY: 0.14, scale: 2.5 },
  'parkiran-vip': { pctX: 0.825, pctY: 0.22, scale: 2.2 },
  'prasmanan-lobi': { pctX: 0.415, pctY: 0.14, scale: 2.2 },
  'kamar-vvip': { pctX: 0.41, pctY: 0.175, scale: 2.1 },
  'prasmanan-sh-pa': { pctX: 0.165, pctY: 0.73, scale: 2.4 },
  'prasmanan-sh-pi': { pctX: 0.695, pctY: 0.375, scale: 2.4 },
  'mck-tamu': { pctX: 0.065, pctY: 0.345, scale: 2.5 },
  'markas-plp': { pctX: 0.065, pctY: 0.585, scale: 2.3 },
  'basecamp-pel-pi': { pctX: 0.675, pctY: 0.135, scale: 2.5 },
  'basecamp-pel-pa': { pctX: 0.145, pctY: 0.88, scale: 2.5 },
  'kantin-dekorasi': { pctX: 0.67, pctY: 0.135, scale: 2.2 },
  'pos-keamanan': { pctX: 0.85, pctY: 0.15, scale: 2.2 },

  // Jalur Akses
  'jalur-masuk-pi': { pctX: 0.815, pctY: 0.255, scale: 2.4 },
  'jalur-masuk-pa': { pctX: 0.88, pctY: 0.855, scale: 2.2 },
  'jalur-vvip-vip': { pctX: 0.92, pctY: 0.52, scale: 2.0 },
  'jalur-keluar-undangan': { pctX: 0.065, pctY: 0.85, scale: 2.4 },
};

export interface ZoneInfo {
  id: string;
  nama: string;
  kategori: 'area_dalam' | 'area_luar' | 'jalur' | 'pos_peladen';
  deskripsi: string;
  lokasiSpesifik: string;
  aksesTamu?: string;
  posPeladen?: string;
}

export const DENAH_HAFLAH_2027 = {
  judul: 'Denah Resmi Haul & Haflah P3TQ dan MHMTQ 1448 H. / 2027 M.',
  tahun: 2027,
  hijriah: '1448 H.',
  orientasi: 'Utara (U) di sisi Kanan denah (← U)',
  gambarUrl: '/images/denah-haflah-2027.jpg',
  gambarPngUrl: '/images/denah-haflah-2027.png',

  areaDalam: [
    {
      id: 'panggung-utama',
      nama: 'Panggung Utama',
      kategori: 'area_dalam',
      deskripsi: 'Pusat prosesi Haul, Khotmil Qur\'an Bil Ghoib, Bin Nadzri, dan Tamatan Aliyah.',
      lokasiSpesifik: 'Tengah Aula (Sisi Depan Utam)',
    },
    {
      id: 'vvip-putra-sofa',
      nama: 'VVIP Putra (SOFA)',
      kategori: 'area_dalam',
      deskripsi: 'Area duduk kehormatan VVIP Putra dengan fasilitas Sofa.',
      lokasiSpesifik: 'Depan Panggung Utama Sisi Kiri (Barat)',
      aksesTamu: 'Masyayikh, Habaib, Pengasuh, Tamu Khusus VVIP Putra',
    },
    {
      id: 'vvip-putri-sofa',
      nama: 'VVIP Putri (SOFA)',
      kategori: 'area_dalam',
      deskripsi: 'Area duduk kehormatan VVIP Putri dengan fasilitas Sofa.',
      lokasiSpesifik: 'Depan Panggung Utama Sisi Kanan (Timur)',
      aksesTamu: 'Ibu Nyai, Habaib Putri, Tamu Khusus VVIP Putri',
    },
    {
      id: 'vip-kursi-elephant',
      nama: 'VIP (Kursi Elephant)',
      kategori: 'area_dalam',
      deskripsi: 'Area tempat duduk VIP menggunakan Kursi Elephant.',
      lokasiSpesifik: 'Tengah Aula Depan (Belakang VVIP Sofa)',
      aksesTamu: 'Tamu VIP Putra & Putri',
    },
    {
      id: 'takhtiman-bil-ghoibi',
      nama: 'Takhtiman Bil-Ghoibi',
      kategori: 'area_dalam',
      deskripsi: 'Area Khotimat Bil Ghoib panggung utama.',
      lokasiSpesifik: 'Depan Panggung Utama Sisi Tengah',
    },
    {
      id: 'wali-santri-bil-ghoibi',
      nama: 'Wali Santri Takhtiman Bil-Ghoibi',
      kategori: 'area_dalam',
      deskripsi: 'Tempat duduk khusus Wali Santri Khotimat Bil Ghoib.',
      lokasiSpesifik: 'Depan Panggung Tengah (Nomor 4 & 5)',
      posPeladen: 'PEL PA.4 & PEL PI.4',
    },
    {
      id: 'takhtiman-bin-nazhri',
      nama: 'Takhtiman Bin-Nazhri',
      kategori: 'area_dalam',
      deskripsi: 'Area Khotimat Bin-Nazhri.',
      lokasiSpesifik: 'Tengah Aula Utama (Nomor 5)',
    },
    {
      id: 'tamatan-aliyah',
      nama: 'Tamatan Aliyah',
      kategori: 'area_dalam',
      deskripsi: 'Area khusus Wisudawati Tamatan Aliyah.',
      lokasiSpesifik: 'Sisi Tengah-Belakang Aula (Nomor 6 & 8 Syaoqul Ahibba)',
    },
    {
      id: 'wali-santri-sh-putra',
      nama: 'Wali Santri Shohibul Hajat (SH) Putra',
      kategori: 'area_dalam',
      deskripsi: 'Tempat duduk Wali Santri Putra.',
      lokasiSpesifik: 'Sayap Kiri / Barat Aula Utama (Nomor 6 & 7)',
      posPeladen: 'PEL PA.1, PEL PA.5, PEL PA.6',
    },
    {
      id: 'wali-santri-sh-putri',
      nama: 'Wali Santri Shohibul Hajat (SH) Putri',
      kategori: 'area_dalam',
      deskripsi: 'Tempat duduk Wali Santri Putri.',
      lokasiSpesifik: 'Sayap Kanan / Timur Aula Utama (Nomor 10 & 11)',
      posPeladen: 'PEL PI.2, PEL PI.3',
    },
    {
      id: 'tamu-umum-pa',
      nama: 'Tamu Undangan Umum Putra',
      kategori: 'area_dalam',
      deskripsi: 'Tempat duduk Tamu Undangan Umum Putra.',
      lokasiSpesifik: 'Sisi Barat Lapangan Depan (Nomor 10)',
      posPeladen: 'PEL PA.1, PEL PA.2',
    },
    {
      id: 'tamu-umum-pi',
      nama: 'Tamu Undangan Umum Putri',
      kategori: 'area_dalam',
      deskripsi: 'Tempat duduk Tamu Undangan Umum Putri.',
      lokasiSpesifik: 'Sisi Timur Lapangan Depan',
      posPeladen: 'PEL PI.1, PEL PI.3',
    },
    {
      id: 'santri-aula',
      nama: 'Area Santri',
      kategori: 'area_dalam',
      deskripsi: 'Area tempat duduk santri aktif.',
      lokasiSpesifik: 'Sisi Selatan Belakang Aula (Nomor 2, 3, 11)',
    },
    {
      id: 'operator-center',
      nama: 'Operator / Sound Center',
      kategori: 'area_dalam',
      deskripsi: 'Ruang Operator Live Streaming, Sound System, dan Multimedia.',
      lokasiSpesifik: 'Sisi Selatan Aula Depan',
    },
    {
      id: 'booking-shooting-center',
      nama: 'Booking Center / Shooting Center',
      kategori: 'area_dalam',
      deskripsi: 'Pusat Dokumentasi Video, Kamera Utama & Shooting.',
      lokasiSpesifik: 'Tengah Aula Depan VIP',
    },
    {
      id: 'berkatan-dz-pa',
      nama: 'Berkatan Dz Pa & Berkatan Depi',
      kategori: 'area_dalam',
      deskripsi: 'Pos distribusi berkatan Dzurriyah Putra & Putri.',
      lokasiSpesifik: 'Sisi Utara Panggung Utama (Nomor 8 & Foto Syahadah)',
    },
    {
      id: 'pos-peladen-dz-pa',
      nama: 'Pos Peladen Dz Pa',
      kategori: 'area_dalam',
      deskripsi: 'Pos Peladen Dzurriyah Putra (PEL PA.2).',
      lokasiSpesifik: 'Sisi Barat-Utara Panggung Utama',
    }
  ] as ZoneInfo[],

  areaLuar: [
    {
      id: 'parkir-vvip',
      nama: 'Parkir Mobil VVIP',
      kategori: 'area_luar',
      deskripsi: 'Lahan Parkir Khusus Kendaraan Masyayikh & Tamu VVIP.',
      lokasiSpesifik: 'Sisi Barat-Utara (Dekat Ruang LAB & Kamar VVIP)',
    },
    {
      id: 'parkiran-vip',
      nama: 'Parkiran VIP',
      kategori: 'area_luar',
      deskripsi: 'Lahan Parkir Kendaraan Tamu VIP Putra & Putri.',
      lokasiSpesifik: 'Sisi Timur (Dekat Gerbang Selatan & Pos Keamanan 4)',
    },
    {
      id: 'prasmanan-lobi',
      nama: 'Prasmanan Lobi (PA & PI)',
      kategori: 'area_luar',
      deskripsi: 'Area jamuan prasmanan tamu VVIP/VIP Putra & Putri.',
      lokasiSpesifik: 'Gedung Lobi Utama Sisi Utara (Dipisah Satir PA & PI)',
    },
    {
      id: 'kamar-vvip',
      nama: 'Kamar VVIP (PA & PI)',
      kategori: 'area_luar',
      deskripsi: 'Ruang Transit & Istirahat Masyayikh / Tamu VVIP.',
      lokasiSpesifik: 'Sisi Utara Lobi Utama',
    },
    {
      id: 'prasmanan-sh-pa',
      nama: 'Prasmanan SH PA',
      kategori: 'area_luar',
      deskripsi: 'Area Konsumsi / Prasmanan Wali Santri Putra.',
      lokasiSpesifik: 'Sisi Barat Aula (Dekat Basecamp Peladen PA)',
    },
    {
      id: 'prasmanan-sh-pi',
      nama: 'Prasmanan Wali Santri SH PI',
      kategori: 'area_luar',
      deskripsi: 'Area Konsumsi / Prasmanan Wali Santri Putri.',
      lokasiSpesifik: 'Sisi Timur Aula (Sisi Basecamp Konsumsi)',
    },
    {
      id: 'mck-tamu',
      nama: 'MCK Tamu & MCK Santri',
      kategori: 'area_luar',
      deskripsi: 'Fasilitas Kamar Mandi & Wudhu Tamu dan Santri.',
      lokasiSpesifik: 'Sisi Barat (Dekat Kantor Pesma & Ruang LAB)',
    },
    {
      id: 'markas-plp',
      nama: 'Markas PLP',
      kategori: 'area_luar',
      deskripsi: 'Posko Komando Pasukan Lapangan & Keamanan.',
      lokasiSpesifik: 'Sisi Barat Belakang MCK Santri',
    },
    {
      id: 'basecamp-pel-pi',
      nama: 'Basecamp Peladen PI & Akomodasi PI',
      kategori: 'area_luar',
      deskripsi: 'Posko Akomodasi & Tim Peladen Putri.',
      lokasiSpesifik: 'Sisi Utara-Timur (Dekat Kantin)',
    },
    {
      id: 'basecamp-pel-pa',
      nama: 'Basecamp Akomodasi & Peladen PA',
      kategori: 'area_luar',
      deskripsi: 'Posko Akomodasi & Tim Peladen Putra.',
      lokasiSpesifik: 'Sisi Barat-Selatan (Dekat Korah-Korah PA)',
    },
    {
      id: 'kantin-dekorasi',
      nama: 'Kantin, Dekorasi & Korah-Korah',
      kategori: 'area_luar',
      deskripsi: 'Area Kantin Acara, Gudang Dekorasi, dan Dapur Masak Air.',
      lokasiSpesifik: 'Sisi Utara & Barat Daya',
    },
    {
      id: 'pos-keamanan',
      nama: 'POS KEAM (Pos Keamanan PA & PI)',
      kategori: 'area_luar',
      deskripsi: 'Pos Penjagaan Keamanan Tersebar.',
      lokasiSpesifik: 'Pos 1 (Gerbang Info 03), Pos 2 (Gerbang Bola Dunia), Pos 4 (Gerbang Selatan), Pos 6 (Gerbang Timur/Utara)',
    }
  ] as ZoneInfo[],

  jalurAkses: [
    {
      id: 'jalur-masuk-pi',
      nama: 'Gerbang Selatan → Pintu Masuk Undangan (PI)',
      kategori: 'jalur',
      deskripsi: 'Akses alur masuk khusus Ibu Nyai, Tamu Undangan Putri, dan Wali Santri Putri.',
      lokasiSpesifik: 'Gerbang Selatan (Sisi Timur Denah)',
    },
    {
      id: 'jalur-masuk-pa',
      nama: 'Gerbang Info 03 & Gerbang Bola Dunia → Pintu Masuk Undangan (PA)',
      kategori: 'jalur',
      deskripsi: 'Akses alur masuk khusus Masyayikh, Tamu Undangan Putra, dan Wali Santri Putra.',
      lokasiSpesifik: 'Gerbang Info 03 / Gerbang Bola Dunia (Sisi Tenggara)',
    },
    {
      id: 'jalur-vvip-vip',
      nama: 'Jalur Masuk & Keluar Dz VVIP / VIP',
      kategori: 'jalur',
      deskripsi: 'Alur khusus drop-off dan mobil transit VVIP / VIP.',
      lokasiSpesifik: 'Gerbang Timur → Drop Point Dz → Parkir VVIP',
    },
    {
      id: 'jalur-keluar-undangan',
      nama: 'Jalur Keluar Undangan',
      kategori: 'jalur',
      deskripsi: 'Alur kepulangan tamu undangan setelah acara selesai.',
      lokasiSpesifik: 'Gerbang Utara / Barat Daya',
    }
  ] as ZoneInfo[]
};
