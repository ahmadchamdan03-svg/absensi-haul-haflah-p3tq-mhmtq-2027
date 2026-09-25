'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  MessageSquare,
  Settings,
  Filter,
  Clock,
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Check,
  ShoppingBag,
} from 'lucide-react';
import { store, INITIAL_EVENT } from '@/lib/mock-data';
import { normalkanNomorHp, buatPesanPengingatKonfirmasi } from '@/lib/hmac';
import { BAGIAN_TAMATAN_LIST, extractBagianTamatan } from '@/lib/types';

export default function WhatsAppPage() {
  const [gelombang, setGelombang] = useState<1 | 2 | 3>(1);
  const [kuotaTambahanBuka, setKuotaTambahanBuka] = useState(false);
  const [linkGrupWa, setLinkGrupWa] = useState(INITIAL_EVENT.linkGrupWa);
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [filterKonfirmasi, setFilterKonfirmasi] = useState<'SEMUA' | 'BELUM' | 'SUDAH'>('SEMUA');
  const [filterKategori, setFilterKategori] = useState<string>('SEMUA');
  const [filterBagian, setFilterBagian] = useState<string>('SEMUA');
  const [search, setSearch] = useState('');
  const [sentRecords, setSentRecords] = useState<Record<string, { waktu: string; metode: 'FONNTE' | 'MANUAL' }>>({
    SH0001: { waktu: '14:02 WIB', metode: 'FONNTE' },
    SH0002: { waktu: '14:05 WIB', metode: 'FONNTE' },
  });

  // Fonnte device status state
  const [fonnteStatus, setFonnteStatus] = useState<{
    connected: boolean;
    name?: string;
    device?: string;
    quota?: string;
    loading: boolean;
    error?: string;
  }>({
    connected: true,
    name: 'Ahmad Chamdan Yuwafin',
    device: '085790633812',
    quota: '1000',
    loading: false,
  });

  // Sending state per item
  const [sendingKode, setSendingKode] = useState<string | null>(null);

  // Batch Blasting state
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastProgress, setBlastProgress] = useState<{ current: number; total: number; success: number; failed: number }>({
    current: 0,
    total: 0,
    success: 0,
    failed: 0,
  });
  const stopBlastingRef = useRef(false);

  const keluargaList = store.getKeluargaList();

  // Handle URL Query Params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const g = params.get('gelombang');
      const fk = params.get('filterKonfirmasi');
      const tipe = params.get('tipe');
      if (g === '3' || tipe === 'pengingat') {
        setGelombang(3);
        setFilterKonfirmasi('BELUM');
      } else if (g === '2') {
        setGelombang(2);
      }
      if (fk === 'BELUM') {
        setFilterKonfirmasi('BELUM');
      } else if (fk === 'SUDAH') {
        setFilterKonfirmasi('SUDAH');
      }
    }
  }, []);

  // Sinkronisasi status switch Beli Kuota Tambahan
  useEffect(() => {
    setKuotaTambahanBuka(store.isKuotaTambahanBuka());
    const handleUpdate = () => {
      setKuotaTambahanBuka(store.isKuotaTambahanBuka());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('kuota_tambahan_toggle', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('kuota_tambahan_toggle', handleUpdate);
    };
  }, []);

  const handleToggleKuotaTambahan = () => {
    const nextVal = !kuotaTambahanBuka;
    store.setKuotaTambahanBuka(nextVal);
    setKuotaTambahanBuka(nextVal);
  };

  // Cek Status Perangkat Fonnte saat halaman dibuka
  useEffect(() => {
    async function checkDevice() {
      try {
        setFonnteStatus((prev) => ({ ...prev, loading: true }));
        const res = await fetch('/api/whatsapp/device');
        const json = await res.json();
        if (json.ok && json.data) {
          setFonnteStatus({
            connected: json.data.device_status === 'connect' || json.data.status === true,
            name: json.data.name || 'Ahmad Chamdan Yuwafin',
            device: json.data.device || '085790633812',
            quota: json.data.quota || '1000',
            loading: false,
          });
        } else {
          setFonnteStatus((prev) => ({ ...prev, loading: false }));
        }
      } catch (err: any) {
        setFonnteStatus((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    }
    checkDevice();
  }, []);

  // Template Teks Resmi v4.2 §7.3 & Template Pengingat Konfirmasi
  const getTeksPesan = (kel: any, gel: 1 | 2 | 3) => {
    const santri = kel.santri?.[0];
    const totalKuota = kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://haflah.p3tq.id';
    const linkPortal = `${origin}/u/${kel.kode}`;
    const linkPembelian = `${origin}/beli/${kel.kode}`;

    const katText =
      santri?.kategoriUtama === 'BIL_GHOIB'
        ? 'Bil Ghoib'
        : santri?.kategoriUtama === 'BIN_NADZOR'
        ? 'Bin Nadzori'
        : santri?.kategoriUtama === 'TAMATAN'
        ? `Tamatan (Bagian ${extractBagianTamatan(santri?.kelas || santri?.subKategori)})`
        : 'Sohibul Hajat';

    if (gel === 1) {
      return `Yth. Bapak/Ibu Wali Santri
*${kel.namaWali}*

Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu untuk menghadiri:

*HAUL & HAFLAH P3TQ DAN MHMTQ 1448 H./ 2027 M.*
*Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)*
*Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at (MHMTQ)*

Hari/Tanggal : Sabtu, 02 Januari 2027 M. / 24 Rajab 1448 H.
Waktu : 06.30 WIB - Selesai
Tempat : Aula Muktamar Pondok Pesantren Lirboyo Kediri
Masuk melalui: Gerbang Selatan (Bola Dunia)

Sohibul hajat : *${santri?.nama || '-'}*
Kategori : ${katText}
Kamar : ${santri?.kamar || '-'}
Hak Kuota Masuk : *${totalKuota} orang*

Undangan digital resmi, konfirmasi kehadiran, dan QR Code gerbang masuk dapat diakses pada tautan berikut:
${linkPortal}

_Mohon QR Code disimpan dan ditunjukkan kepada petugas di gerbang pada hari acara._

Untuk informasi dan pengumuman terbaru, silakan bergabung di grup WhatsApp resmi wali santri:
${linkGrupWa}

Atas perhatian dan kehadirannya kami sampaikan terima kasih.
Jazakumullahu khairan katsiran.

Wassalamu'alaikum warahmatullahi wabarakatuh
*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*`;
    } else if (gel === 2) {
      return `Yth. Bapak/Ibu Wali Santri
*${kel.namaWali}*

Menindaklanjuti undangan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., kami membuka kesempatan penambahan kuota kehadiran bagi keluarga yang ingin mengajak lebih banyak sanak saudara.

Biaya : *Rp 80.000 / orang*
Rekening Tujuan : *BRI 320701010266508* a.n. Ahmad Chamdan Yuwafin

Ketentuan:
• Berlaku selama kuota masih tersedia (pagu terbatas 300 kuota)
• Pembatalan sebelum hari-H dana dikembalikan penuh
• Pendaftaran ditutup otomatis bila kuota habis
• Kuota otomatis ditambahkan ke QR Code Anda

Pemesanan dan konfirmasi pembayaran:
${linkPembelian}

Wassalamu'alaikum warahmatullahi wabarakatuh
*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*`;
    } else {
      // Template Pengingat Konfirmasi Kehadiran Wali Santri (Sesuai Permintaan Pengguna)
      return buatPesanPengingatKonfirmasi(santri?.nama || kel.namaWali, kel.kode, origin);
    }
  };

  // Handler Kirim Otomatis via API Fonnte
  const handleKirimFonnte = async (kel: any) => {
    const rawHp = kel.noHp;
    if (!rawHp || rawHp.trim() === '') {
      alert(`Nomor HP untuk ${kel.namaWali} tidak terdaftar!`);
      return false;
    }

    setSendingKode(kel.kode);

    try {
      const teks = getTeksPesan(kel, gelombang);
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: rawHp,
          message: teks,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        const nowStr = new Date().toTimeString().split(' ')[0] + ' WIB';
        setSentRecords((prev) => ({
          ...prev,
          [kel.kode]: { waktu: nowStr, metode: 'FONNTE' },
        }));
        setSendingKode(null);
        return true;
      } else {
        alert(`Gagal mengirim via Fonnte: ${json.data?.reason || json.message || 'Error'}`);
        setSendingKode(null);
        return false;
      }
    } catch (err: any) {
      alert(`Gagal menghubungi server: ${err.message}`);
      setSendingKode(null);
      return false;
    }
  };

  // Handler Kirim Manual (Direct WhatsApp Web)
  const handleKirimManualWA = (kel: any) => {
    const rawHp = kel.noHp;
    if (!rawHp || rawHp.trim() === '') {
      alert('Nomor HP tidak terdaftar atau kosong!');
      return;
    }

    const nomorBersih = normalkanNomorHp(rawHp);
    const teks = getTeksPesan(kel, gelombang);
    const url = `https://wa.me/${nomorBersih}?text=${encodeURIComponent(teks)}`;

    window.open(url, '_blank');

    const nowStr = new Date().toTimeString().split(' ')[0] + ' WIB';
    setSentRecords((prev) => ({
      ...prev,
      [kel.kode]: { waktu: nowStr, metode: 'MANUAL' },
    }));
  };

  // Filter list
  const filteredList = useMemo(() => {
    return keluargaList.filter((kel) => {
      const isSent = !!sentRecords[kel.kode];
      const isProblem = !kel.noHp || kel.noHp.trim().length < 8;
      const santri = kel.santri?.[0];
      const kat = santri?.kategoriUtama || 'BIN_NADZOR';
      const bagian = kat === 'TAMATAN' ? extractBagianTamatan(santri?.kelas || santri?.subKategori) : '';

      if (filterStatus === 'BELUM' && isSent) return false;
      if (filterStatus === 'TERKIRIM' && !isSent) return false;
      if (filterStatus === 'BERMASALAH' && !isProblem) return false;

      // Filter Status Konfirmasi Kehadiran (Khusus Pengingat Konfirmasi)
      if (filterKonfirmasi === 'BELUM' && kel.estimasi?.statusKonfirmasi === 'SUDAH') {
        return false;
      }
      if (filterKonfirmasi === 'SUDAH' && kel.estimasi?.statusKonfirmasi !== 'SUDAH') {
        return false;
      }

      // Filter Kategori Utama (Bil Ghoib, Bin Nadzor, Tamatan)
      if (filterKategori !== 'SEMUA' && kat !== filterKategori) {
        return false;
      }

      // Filter Sub / Bagian (Bil Ghoib, Bin Nadzor, Tamatan Semua & Bagian A.01 - B.03)
      if (filterBagian === 'BIL_GHOIB') {
        if (kat !== 'BIL_GHOIB') return false;
      } else if (filterBagian === 'BIN_NADZOR') {
        if (kat !== 'BIN_NADZOR') return false;
      } else if (filterBagian === 'TAMATAN_SEMUA') {
        if (kat !== 'TAMATAN') return false;
      } else if (filterBagian !== 'SEMUA') {
        if (kat !== 'TAMATAN' || bagian !== filterBagian) {
          return false;
        }
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          kel.namaWali.toLowerCase().includes(q) ||
          santri?.nama.toLowerCase().includes(q) ||
          kel.kode.toLowerCase().includes(q) ||
          kel.alamat.toLowerCase().includes(q) ||
          kel.noHp.includes(q) ||
          bagian.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [keluargaList, sentRecords, filterStatus, filterKonfirmasi, filterKategori, filterBagian, search]);

  // Handler Batch Blasting via Fonnte Otomatis
  const handleStartBatchBlast = async () => {
    const unsentList = filteredList.filter(
      (k) => !sentRecords[k.kode] && k.noHp && k.noHp.trim().length >= 8
    );

    if (unsentList.length === 0) {
      alert('Semua nomor pada filter saat ini sudah terkirim!');
      return;
    }

    const judulPesan =
      gelombang === 1
        ? 'Undangan Resmi & QR'
        : gelombang === 2
        ? 'Penawaran Kuota Tambahan'
        : 'PENGINGAT KONFIRMASI KEHADIRAN (Wali Belum Isi)';

    if (
      !window.confirm(
        `Mulai pengiriman otomatis [${judulPesan}] via Fonnte untuk ${unsentList.length} wali santri?\nPesan akan dikirim dengan jeda 1.5 detik per pesan agar aman.`
      )
    ) {
      return;
    }

    setIsBlasting(true);
    stopBlastingRef.current = false;
    setBlastProgress({ current: 0, total: unsentList.length, success: 0, failed: 0 });

    for (let i = 0; i < unsentList.length; i++) {
      if (stopBlastingRef.current) {
        break;
      }

      const kel = unsentList[i];
      setBlastProgress((prev) => ({ ...prev, current: i + 1 }));

      const ok = await handleKirimFonnte(kel);
      if (ok) {
        setBlastProgress((prev) => ({ ...prev, success: prev.success + 1 }));
      } else {
        setBlastProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
      }

      // Delay 1500ms
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setIsBlasting(false);
  };

  const handleStopBatchBlast = () => {
    stopBlastingRef.current = true;
    setIsBlasting(false);
  };

  const sentForCurrentList = keluargaList.filter((k) => sentRecords[k.kode] || sentRecords[k.id]);
  const totalTerkirim = sentForCurrentList.length;
  const pctTerkirim = keluargaList.length > 0 ? Math.min(100, Math.round((totalTerkirim / keluargaList.length) * 100)) : 0;

  const countBilGhoib = keluargaList.filter((k) => k.santri?.[0]?.kategoriUtama === 'BIL_GHOIB').length;
  const countBinNadzor = keluargaList.filter((k) => k.santri?.[0]?.kategoriUtama === 'BIN_NADZOR').length;
  const countTamatan = keluargaList.filter((k) => k.santri?.[0]?.kategoriUtama === 'TAMATAN').length;

  const countPerBagian = useMemo(() => {
    const map: Record<string, number> = {
      'A.01': 0,
      'A.02': 0,
      'A.03': 0,
      'A.04': 0,
      'B.01': 0,
      'B.02': 0,
      'B.03': 0,
    };
    for (const k of keluargaList) {
      const santri = k.santri?.[0];
      if (santri?.kategoriUtama === 'TAMATAN') {
        const bg = extractBagianTamatan(santri?.kelas || santri?.subKategori);
        if (bg && map[bg] !== undefined) {
          map[bg]++;
        }
      }
    }
    return map;
  }, [keluargaList]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Panel WhatsApp: Warm Latte & Cinnamon Mocha Aesthetic */}
      <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] flex items-center justify-center font-bold border border-[#D5C4B4] shadow-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-black text-[#422F21]">
                Panel WhatsApp & Fonnte Gateway
              </h1>
              <p className="text-xs text-[#7A624E] font-normal">
                Kirim undangan, penawaran kuota, dan pengingat konfirmasi kehadiran otomatis lewat Fonnte untuk <strong>{keluargaList.length} Santri Terdaftar</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Pemilih Tipe Pesan / Gelombang & Switch Kontrol Beli Kuota - Bar Terpisah Rapi & Lega */}
        <div className="mt-4 pt-4 border-t border-[#D5C4B4] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Segmented Gelombang Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-[#EFE8E1] p-1.5 rounded-2xl border border-[#D5C4B4] shadow-inner">
            <button
              type="button"
              onClick={() => {
                setGelombang(1);
                setFilterKonfirmasi('SEMUA');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                gelombang === 1
                  ? 'bg-[#8C6A47] text-white shadow-md border border-[#735334]'
                  : 'text-[#422F21] hover:text-[#8C6A47] hover:bg-white/70'
              }`}
            >
              <span>1. Undangan & QR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setGelombang(2);
                setFilterKonfirmasi('SEMUA');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                gelombang === 2
                  ? 'bg-[#8C6A47] text-white shadow-md border border-[#735334]'
                  : 'text-[#422F21] hover:text-[#8C6A47] hover:bg-white/70'
              }`}
            >
              <span>2. Kuota Tambahan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setGelombang(3);
                setFilterKonfirmasi('BELUM');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                gelombang === 3
                  ? 'bg-amber-800 text-white shadow-md border border-amber-900'
                  : 'text-[#422F21] hover:text-amber-800 hover:bg-white/70'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>3. Pengingat Konfirmasi (Belum Isi)</span>
            </button>
          </div>

          {/* Tombol Switch Pengatur Beli Kuota Tambahan Manual */}
          <div className="flex items-center space-x-2.5 px-3.5 py-2 bg-white rounded-xl border border-[#D5C4B4] shadow-xs shrink-0 self-start lg:self-auto">
            <span className="text-xs font-bold text-[#422F21] flex items-center space-x-1.5">
              <ShoppingBag className="w-4 h-4 text-[#8C6A47]" />
              <span>Beli Kuota Tambahan:</span>
            </span>
            <button
              type="button"
              onClick={handleToggleKuotaTambahan}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                kuotaTambahanBuka ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
              title={
                kuotaTambahanBuka
                  ? 'Status: BUKA (Aktif). Klik untuk MENUTUP penjualan kuota tambahan di portal wali'
                  : 'Status: TUTUP (Mati). Klik untuk MEMBUKA penjualan kuota tambahan di portal wali'
              }
            >
              <span className="sr-only">Toggle Kuota Tambahan</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  kuotaTambahanBuka ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                kuotaTambahanBuka
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {kuotaTambahanBuka ? 'ON (Buka)' : 'OFF (Tutup)'}
            </span>
          </div>
        </div>

        {/* Fonnte Live Status Widget */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] border-2 border-[#8C6A47]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm">
              <Wifi className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-serif font-black text-[#422F21]">
                  FONNTE GATEWAY TERHUBUNG
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-400">
                  ONLINE
                </span>
              </div>
              <div className="text-xs text-[#7A624E] mt-0.5 font-medium">
                Pengirim: <strong>{fonnteStatus.name}</strong> ({fonnteStatus.device}) · Sisa Kuota API: <strong>{fonnteStatus.quota} Pesan</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isBlasting ? (
              <button
                onClick={handleStartBatchBlast}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-xs shadow-md flex items-center space-x-1.5 transition-all border border-[#FAF7F3]"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>
                  {gelombang === 3
                    ? 'Blast Pengingat Konfirmasi (Fonnte)'
                    : 'Kirim Massal Otomatis (Fonnte)'}
                </span>
              </button>
            ) : (
              <button
                onClick={handleStopBatchBlast}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg flex items-center space-x-1.5 transition-all"
              >
                <Pause className="w-4 h-4" />
                <span>Hentikan Blasting ({blastProgress.current}/{blastProgress.total})</span>
              </button>
            )}
          </div>
        </div>

        {/* Info Banner Khusus Gelombang 2 (Status Switch Kuota Tambahan) */}
        {gelombang === 2 && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
              kuotaTambahanBuka
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  kuotaTambahanBuka ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold flex items-center space-x-1.5">
                  <span>Status Pembelian Kuota Tambahan:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      kuotaTambahanBuka
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-700 text-white'
                    }`}
                  >
                    {kuotaTambahanBuka ? 'ON (DIBUKA)' : 'OFF (DITUTUP)'}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {kuotaTambahanBuka
                    ? '✓ Tombol "Ingin menambah kuota untuk kerabat? Beli Kuota Tambahan" AKTIF dan TAMPIL di portal wali santri.'
                    : '⚠️ Tombol pembelian kuota DIKUNCI / TERSEMBUNYI di portal wali santri. Aktifkan switch di atas sebelum mengirim broadcast kuota tambahan.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleKuotaTambahan}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm shrink-0 transition-all ${
                kuotaTambahanBuka
                  ? 'bg-white border border-emerald-400 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {kuotaTambahanBuka ? 'Tutup Penjualan (OFF)' : 'Buka Penjualan (ON)'}
            </button>
          </div>
        )}

        {/* Box Preview Template Pesan */}
        <div className="mt-4 p-4 rounded-2xl bg-white border border-[#D5C4B4] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#8C6A47]" />
              <span className="font-bold text-xs text-[#422F21]">
                Preview Template Pesan:{' '}
                <span className="text-[#8C6A47]">
                  {gelombang === 1
                    ? 'Gelombang 1 - Undangan Resmi & QR'
                    : gelombang === 2
                    ? 'Gelombang 2 - Info Kuota Tambahan'
                    : 'Pesan Pengingat Konfirmasi Kehadiran (Khusus Belum Isi)'}
                </span>
              </span>
            </div>
            {gelombang === 3 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Template Resmi Pengingat Kehadiran
              </span>
            )}
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF7F3] border border-[#D5C4B4]/70 font-mono text-[11px] text-[#422F21] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {getTeksPesan(
              keluargaList[0] || {
                kode: 'SH0001',
                namaWali: 'Bpk. Moh. Toha',
                santri: [{ nama: 'AFIFATUN NISAA', kategoriUtama: 'BIL_GHOIB', kamar: 'A.01' }],
                kuota: { kuotaDasar: 4, kuotaTambahan: 0 },
              },
              gelombang
            )}
          </div>
        </div>

        {/* Progress Bar Blasting jika aktif */}
        {isBlasting && (
          <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs text-amber-950">
            <div className="flex items-center justify-between font-bold">
              <span>Sedang Mengirim Pesan WhatsApp Massal...</span>
              <span>
                {blastProgress.current} dari {blastProgress.total} wali ({blastProgress.success} berhasil, {blastProgress.failed} gagal)
              </span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#8C6A47] h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((blastProgress.current / blastProgress.total) * 100) || 0}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Pengaturan Link Grup WA */}
        <div className="mt-4 p-4 rounded-2xl bg-[#FAF7F3] border border-[#D5C4B4] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[#422F21] mb-1">
              Link Grup WhatsApp Resmi Wali Santri:
            </label>
            <input
              type="text"
              value={linkGrupWa}
              onChange={(e) => setLinkGrupWa(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] text-xs font-mono bg-white"
            />
          </div>
          <div className="flex items-center p-3 rounded-xl bg-white border border-[#D5C4B4]">
            <div className="text-[11px] text-[#7A624E] leading-relaxed">
              <strong className="text-[#8C6A47]">Otomasi Fonnte:</strong> Panitia tidak perlu mengetik atau membuka browser WhatsApp satu per satu. Klik tombol <strong>Kirim via Fonnte</strong> dan pesan langsung terkirim dari nomor panitia!
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Pengiriman & Filter Lanjutan */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D5C4B4] space-y-4">
        {/* Bar Kontrol & Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              PROGRES PENGIRIMAN ({gelombang === 1 ? 'UNDANGAN MASUK' : gelombang === 2 ? 'KUOTA TAMBAHAN' : 'PENGINGAT KONFIRMASI'}):
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              Terkirim {totalTerkirim} / {keluargaList.length}{' '}
              <span className="text-sm font-semibold text-emerald-700">({pctTerkirim}%)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Status Konfirmasi Kehadiran */}
            <select
              value={filterKonfirmasi}
              onChange={(e) => setFilterKonfirmasi(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-amber-300 text-xs font-semibold focus:outline-none bg-amber-50 text-amber-950 font-bold"
            >
              <option value="SEMUA">Semua Status Konfirmasi</option>
              <option value="BELUM">Belum Konfirmasi Kehadiran</option>
              <option value="SUDAH">Sudah Konfirmasi Kehadiran</option>
            </select>

            {/* Filter Kategori Utama */}
            <select
              value={filterKategori}
              onChange={(e) => {
                setFilterKategori(e.target.value);
                setFilterBagian('SEMUA');
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
            >
              <option value="SEMUA">Semua Kategori ({keluargaList.length})</option>
              <option value="BIL_GHOIB">Bil Ghoib ({countBilGhoib})</option>
              <option value="BIN_NADZOR">Bin Nadzori ({countBinNadzor})</option>
              <option value="TAMATAN">Tamatan ({countTamatan})</option>
            </select>

            {/* Filter Sub / Bagian (Bil Ghoib, Bin Nadzor, Bagian A.01–B.03) */}
            <select
              value={filterBagian}
              onChange={(e) => {
                const val = e.target.value;
                setFilterBagian(val);
                if (val === 'BIL_GHOIB') setFilterKategori('BIL_GHOIB');
                else if (val === 'BIN_NADZOR') setFilterKategori('BIN_NADZOR');
                else if (val === 'TAMATAN_SEMUA' || val.startsWith('A.') || val.startsWith('B.')) setFilterKategori('TAMATAN');
                else if (val === 'SEMUA') setFilterKategori('SEMUA');
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
            >
              <option value="SEMUA">Semua Kategori & Bagian ({keluargaList.length})</option>
              <option value="BIL_GHOIB">Bil Ghoib ({countBilGhoib})</option>
              <option value="BIN_NADZOR">Bin Nadzori ({countBinNadzor})</option>
              <option value="TAMATAN_SEMUA">Semua Bagian Tamatan ({countTamatan})</option>
              {BAGIAN_TAMATAN_LIST.map((bg) => (
                <option key={bg} value={bg}>
                  Bagian {bg} ({countPerBagian[bg] || 0})
                </option>
              ))}
            </select>

            {/* Filter Status Terkirim */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
            >
              <option value="SEMUA">Semua Pengiriman</option>
              <option value="BELUM">Belum Terkirim</option>
              <option value="TERKIRIM">Sudah Terkirim</option>
              <option value="BERMASALAH">Nomor Bermasalah / Kosong</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari wali / santri / HP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#8C6A47] w-44"
              />
            </div>
          </div>
        </div>

        {/* Tabel Antrean */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EFE8E1] text-[#5C3E28] font-bold border-b border-[#D5C4B4] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3">Kode</th>
                <th className="py-3 px-4">Nama Wali Santri & HP</th>
                <th className="py-3 px-4">Sohibul Hajat & Kategori</th>
                <th className="py-3 px-3 text-center">Hak Kuota</th>
                <th className="py-3 px-3 text-center">Konfirmasi Hadir</th>
                <th className="py-3 px-3 text-center">Status Kirim</th>
                <th className="py-3 px-4 text-center">Aksi Kirim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data wali yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((kel) => {
                  const sent = sentRecords[kel.kode];
                  const santri = kel.santri?.[0];
                  const isProblem = !kel.noHp || kel.noHp.trim().length < 8;
                  const isSendingThis = sendingKode === kel.kode;

                  const isBilGhoib = santri?.kategoriUtama === 'BIL_GHOIB';
                  const isBinNadzor = santri?.kategoriUtama === 'BIN_NADZOR';
                  const isTamatan = santri?.kategoriUtama === 'TAMATAN';
                  const bagian = isTamatan ? extractBagianTamatan(santri?.kelas || santri?.subKategori) : '';
                  const isConfirmed = kel.estimasi?.statusKonfirmasi === 'SUDAH';

                  return (
                    <tr key={kel.kode} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-opera-900">
                        {kel.kode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{kel.namaWali}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {kel.noHp || <span className="text-rose-500 font-bold">Tidak ada nomor</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{santri?.nama}</div>
                        <div className="text-[11px] flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`font-semibold ${
                              isBilGhoib
                                ? 'text-emerald-700'
                                : isBinNadzor
                                ? 'text-blue-700'
                                : 'text-amber-800'
                            }`}
                          >
                            {isBilGhoib ? 'Bil Ghoib' : isBinNadzor ? 'Bin Nadzori' : 'Tamatan'}
                          </span>
                          {isTamatan && bagian && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                              Bagian {bagian}
                            </span>
                          )}
                          <span className="text-slate-400">· Kamar: {santri?.kamar || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-700">
                          {kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan} Kursi
                        </span>
                        {isBilGhoib && (
                          <div className="text-[10px] text-emerald-700 font-bold">+1 Emas ★</div>
                        )}
                      </td>
                      {/* Status Konfirmasi Kehadiran */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isConfirmed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Sudah (L:{kel.estimasi?.perkiraanL} P:{kel.estimasi?.perkiraanP})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ⏳ Belum Mengisi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {sent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {sent.waktu}
                          </span>
                        ) : isProblem ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            No. HP Kosong
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Tombol 1-Click Fonnte */}
                          <button
                            onClick={() => handleKirimFonnte(kel)}
                            disabled={isProblem || isSendingThis || isBlasting}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 shadow-sm transition-all ${
                              sent
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-opera-850 hover:bg-opera-900 text-gold-300 border border-gold-500/40'
                            } disabled:opacity-40 disabled:pointer-events-none`}
                            title="Kirim otomatis lewat WhatsApp Fonnte"
                          >
                            <Zap className="w-3 h-3 fill-current text-gold-400" />
                            <span>{isSendingThis ? 'Mengirim...' : sent ? 'Kirim Ulang' : 'Kirim Fonnte'}</span>
                          </button>

                          {/* Tombol Manual WA Web Fallback */}
                          <button
                            onClick={() => handleKirimManualWA(kel)}
                            disabled={isProblem}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors disabled:opacity-40"
                            title="Buka via WhatsApp Web / App manual"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
