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
