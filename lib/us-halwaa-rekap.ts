// =============================================================================
// MODUL REKAP KEHADIRAN REALTIME — USTH. HALWAA AI ASSISTANT
// Haul & Haflah P3TQ & MHMTQ 1448 H. / 2027 M.
// =============================================================================

import { supabase } from './supabase';

export function detectRekapKehadiranIntent(query: string): boolean {
  const q = query.toLowerCase().trim().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ');

  const exactMatches = [
    'rekap kehadiran',
    'rekap hari ini',
    'berapa yang hadir',
    'sudah berapa hadir',
    'total kehadiran',
    'statistik kehadiran',
    'jumlah tamu hadir',
    'berapa sh yang hadir',
    'berapa tamu yang sudah datang',
    'rekap presensi',
    'laporan kehadiran',
  ];

  if (exactMatches.some((phrase) => q.includes(phrase))) {
    return true;
  }

  // Regex patterns
  if (
    /\brekap\s+(kehadiran|presensi|hari\s+ini|tamu|santri|sh)\b/i.test(q) ||
    /\b(laporan|statistik|total)\s+kehadiran\b/i.test(q) ||
    /\bberapa\s+(yang\s+)?(hadir|datang|masuk|scan)\b/i.test(q) ||
    /\bsudah\s+berapa\s+(yang\s+)?(hadir|datang|masuk|scan)\b/i.test(q) ||
    /\bberapa\s+(tamu|sh|santri|undangan)\s+(yang\s+)?(sudah\s+)?(datang|hadir|masuk)\b/i.test(q) ||
    /\bjumlah\s+(tamu|sh|santri|undangan)\s+(yang\s+)?(hadir|datang)\b/i.test(q)
  ) {
    return true;
  }

  return false;
}

export interface LiveRekapResult {
  text: string;
  totalScan: number;
}

export async function getLiveRekapKehadiran(isFirstTurn: boolean = false): Promise<string> {
  const greetingPrefix = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";

  // 1. Dapatkan jam server dalam WIB (contoh: 18.15 WIB)
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  });
  const jamWIB = timeFormatter.format(now).replace(':', '.') + ' WIB';

  try {
    // 2. Query LIVE dari Supabase (bukan hardcode)
    const [resSantri, resUndangan, resLogs] = await Promise.all([
      supabase.from('peserta_santri').select('id, kuota_terpakai, kuota_dasar, kuota_tambahan'),
      supabase.from('tamu_undangan').select('id, status_konfirmasi, kuota_terpakai'),
      supabase.from('presensi_log').select('*'),
    ]);

    const santriData = resSantri.data || [];
    const undanganData = resUndangan.data || [];
    const logsData = resLogs.data || [];

    // Total SH (Shohibul Hajat) LIVE dari Supabase
    const totalSH = santriData.length;

    // Total Tamu Undangan LIVE dari Supabase
    const totalTamu = undanganData.length;

    // Total Shohibul Hajat yang sudah scan
    const shLogs = logsData.filter((r) => {
      const tipe = (r.tipe_peserta || '').toUpperCase();
      const qr = (r.kode_qr || '').toUpperCase();
      return tipe === 'SANTRI' || tipe === 'WALI' || qr.startsWith('SH');
    });

    const shScannedSet = new Set(shLogs.map((r) => r.kode_qr));
    let shScanned = shScannedSet.size;

    // Fallback jika log belum ada tapi kuota_terpakai sudah disinkron
    if (shScanned === 0) {
      shScanned = santriData.filter((s) => (s.kuota_terpakai || 0) > 0).length;
    }

    // Total Tamu Undangan yang sudah RSVP HADIR
    const tamuRsvpHadir = undanganData.filter(
      (u) => (u.status_konfirmasi || '').toUpperCase() === 'HADIR'
    ).length;

    const tamuLogs = logsData.filter((r) => {
      const tipe = (r.tipe_peserta || '').toUpperCase();
      const qr = (r.kode_qr || '').toUpperCase();
      return tipe === 'TAMU' || tipe === 'UNDANGAN' || qr.startsWith('UND');
    });
    const tamuScannedSet = new Set(tamuLogs.map((r) => r.kode_qr));

    const tamuHadir = Math.max(tamuRsvpHadir, tamuScannedSet.size);

    // Total scan hari ini
    let totalScan = logsData.length;
    if (totalScan === 0 && (shScanned > 0 || tamuHadir > 0)) {
      totalScan = shScanned + tamuHadir;
    }

    // 3. JIKA DATA KOSONG
    if (totalScan === 0 && shScanned === 0 && tamuHadir === 0) {
      return `${greetingPrefix}Berikut rekap kehadiran Haul & Haflah per pukul ${jamWIB}:

📊 **Shohibul Hajat:**
- Sudah scan: 0 dari ${totalSH.toLocaleString('id-ID')}
- Persentase: 0.0%

📊 **Tamu Undangan:**
- Sudah RSVP Hadir: 0 dari ${totalTamu.toLocaleString('id-ID')}
- Persentase: 0.0%

📊 **Total Scan Hari Ini:** 0 kali

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
    }

    // 4. HITUNG PERSENTASE
    const persenSH = totalSH > 0 ? ((shScanned / totalSH) * 100).toFixed(1) : '0.0';
    const persenTamu = totalTamu > 0 ? ((tamuHadir / totalTamu) * 100).toFixed(1) : '0.0';

    return `${greetingPrefix}Berikut rekap kehadiran Haul & Haflah per pukul ${jamWIB}:

📊 **Shohibul Hajat:**
- Sudah scan: ${shScanned.toLocaleString('id-ID')} dari ${totalSH.toLocaleString('id-ID')}
- Persentase: ${persenSH}%

📊 **Tamu Undangan:**
- Sudah RSVP Hadir: ${tamuHadir.toLocaleString('id-ID')} dari ${totalTamu.toLocaleString('id-ID')}
- Persentase: ${persenTamu}%

📊 **Total Scan Hari Ini:** ${totalScan.toLocaleString('id-ID')} kali

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  } catch (err) {
    console.error('Error fetching live rekap kehadiran:', err);
    return `${greetingPrefix}Mohon maaf Us, saat ini saya tidak bisa mengakses data kehadiran karena koneksi ke sistem sedang terganggu. Mohon coba beberapa saat lagi. Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }
}
