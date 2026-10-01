'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ShoppingBag,
  Info,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Volume2,
  VolumeX,
  MailOpen,
  ArrowRight,
  Copy,
  Check,
  Compass,
  AlertCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { store } from '@/lib/mock-data';
import { formatQrPayload } from '@/lib/hmac';
import DenahModal from '@/components/DenahModal';
import TanyaUsModal from '@/components/TanyaUsModal';

// Helper Kategori Tamu Undangan
function getTamuCategoryLabel(item: any): string {
  const gol = (item?.subKategori || item?.golongan || item?.entitas?.golongan || '').toUpperCase();
  const kat = (item?.kategori || item?.entitas?.kategori || '').toUpperCase();

  if (
    gol === 'ISTIMEWA' ||
    kat.includes('VVIP') ||
    kat.includes('VIP') ||
    kat.includes('BANI') ||
    kat.includes('MAHRUS') ||
    kat.includes('KUNIR') ||
    kat.includes('BANDAR')
  ) {
    return 'TAMU UNDANGAN ISTIMEWA';
  } else if (
    gol === 'KEHORMATAN' ||
    kat.includes('MASYAYIKH') ||
    kat.includes('HABAIB') ||
    kat.includes('PEJABAT') ||
    kat.includes('ULAMA')
  ) {
    return 'TAMU UNDANGAN KEHORMATAN';
  }
  return 'TAMU UNDANGAN UMUM';
}

// Helper Render Nama Tamu Undangan (Persis dari DB, tanpa penambahan gelar frontend)
function renderTamuName(item: any) {
  const namaDirect = (item?.nama || item?.entitas?.nama || '').trim();
  const namaPutra = (item?.namaPutra || item?.nama_putra || item?.entitas?.namaPutra || '').trim();
  const namaPutri = (item?.namaPutri || item?.nama_putri || item?.entitas?.namaPutri || '').trim();

  // 1. Jika kolom 'nama' terisi dan bukan '-'
  if (namaDirect && namaDirect !== '-') {
    return (
      <h2 className="text-xl sm:text-2xl font-serif font-black text-[#322116] tracking-wide text-center leading-snug">
        {namaDirect}
      </h2>
    );
  }

  // 2. Jika kolom 'nama' kosong/'-' tapi namaPutra & namaPutri terisi
  if (namaPutra || namaPutri) {
    return (
      <div className="space-y-1 text-center">
        {namaPutra && (
          <h2 className="text-lg sm:text-xl font-serif font-black text-[#322116] tracking-wide">
            {namaPutra}
          </h2>
        )}
        {namaPutri && (
          <h2 className="text-lg sm:text-xl font-serif font-black text-[#322116] tracking-wide">
            {namaPutri}
          </h2>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <h2 className="text-xl sm:text-2xl font-serif font-black text-[#322116] tracking-wide text-center">
      Tamu Undangan
    </h2>
  );
}

export default function UndanganWaliPage() {
  const params = useParams();
  const token = (params?.token as string) || '';
  const kodeSH = (token.split('-')[0] || 'SH0001').toUpperCase();
  const isTamuUndangan = kodeSH.startsWith('UND');

  // State Item & Data Initializer
  const [item, setItem] = useState<any>(() => {
    if (kodeSH.startsWith('UND')) {
      const found = store.getUndanganList().find((u) => u.kode === kodeSH);
      if (found) {
        return {
          id: found.id,
          kode: found.kode,
          tipe: 'UNDANGAN',
          nama: found.nama || '',
          namaPutra: found.namaPutra || '',
          namaPutri: found.namaPutri || '',
          kategori: found.kategori || 'VIP IDS',
          subKategori: found.golongan || 'ISTIMEWA',
          instansi: found.instansi || '',
          alamat: found.alamat || '',
          noHp: found.noHp || '',
          kuota: {
            id: found.id,
            kodeQr: found.kode,
            kuotaDasar: found.kuota.kuotaDasar || 2,
            kuotaTambahan: 0,
            terpakai: found.kuota.terpakai || 0,
          },
          estimasi: {
            statusKonfirmasi: 'BELUM',
            perkiraanL: 1,
            perkiraanP: 1,
            catatan: '',
          },
        };
      }
      return {
        kode: kodeSH,
        tipe: 'UNDANGAN',
        nama: 'Tamu Undangan',
        kategori: 'Tamu Kehormatan',
        subKategori: 'KEHORMATAN',
        instansi: '-',
        alamat: 'Kediri',
        kuota: { kodeQr: kodeSH, kuotaDasar: 2, kuotaTambahan: 0, terpakai: 0 },
        estimasi: { statusKonfirmasi: 'BELUM', perkiraanL: 1, perkiraanP: 1, catatan: '' },
      };
    }
    return store.findByKode(kodeSH) || store.findByKode('SH0001');
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [fullQrPayload, setFullQrPayload] = useState<string>('');
  const [loadingSantri, setLoadingSantri] = useState(true);

  // State Interaktif Undangan Pernikahan Style
  const [isOpened, setIsOpened] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State Estimasi Kehadiran (RSVP)
  const [estL, setEstL] = useState(1);
  const [estP, setEstP] = useState(1);
  const [catatanRsvp, setCatatanRsvp] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [estimasiSaved, setEstimasiSaved] = useState(false);
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  // State Modal Denah & Ustadzah AI
  const [isDenahOpen, setIsDenahOpen] = useState(false);
  const [isUsModalOpen, setIsUsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // State Global Switch Beli Kuota & Hitungan Pagu Diverifikasi
  const [kuotaSwitchAktif, setKuotaSwitchAktif] = useState<boolean>(false);
  const [totalDiverifikasi, setTotalDiverifikasi] = useState<number>(0);
  const [loadingKuotaControl, setLoadingKuotaControl] = useState<boolean>(true);

  // Countdown Timer ke Sabtu, 02 Januari 2027 06:30:00 WIB
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date('2027-01-02T06:30:00+07:00').getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Live Data dari Supabase (Deteksi SH vs UND)
  useEffect(() => {
    async function fetchInvitationData() {
      try {
        setLoadingSantri(true);

        if (isTamuUndangan) {
          // Query ke tabel 'tamu_undangan'
          const { data: t, error } = await supabase
            .from('tamu_undangan')
            .select('*')
            .eq('kode', kodeSH)
            .maybeSingle();

          if (t && !error) {
            const kDasar = Number(t.kuota_dasar !== undefined && t.kuota_dasar !== null ? t.kuota_dasar : (t.kategori === 'Asatidz Mhmtq Sekalian' ? 2 : 1));
            const mappedItem = {
              id: t.id,
              kode: t.kode,
              tipe: 'UNDANGAN',
              nama: t.nama || '',
              namaPutra: t.nama_putra || '',
              namaPutri: t.nama_putri || '',
              kategori: t.kategori || 'Tamu Kehormatan',
              subKategori: t.sub_kategori || 'KEHORMATAN',
              instansi: t.instansi || '',
              alamat: t.alamat || '',
              noHp: t.no_hp || '',
              kuota: {
                id: t.id,
                kodeQr: t.kode,
                kuotaDasar: kDasar,
                kuotaTambahan: 0,
                terpakai: Number(t.kuota_terpakai || 0),
              },
              estimasi: {
                statusKonfirmasi: t.status_konfirmasi || 'BELUM',
                perkiraanL: Number(t.perkiraan_l || 0),
                perkiraanP: Number(t.perkiraan_p || 0),
                catatan: t.catatan_konfirmasi || '',
                diisiAt: t.updated_at || t.created_at,
              },
            };

            setItem(mappedItem);

            if (t.status_konfirmasi === 'SUDAH') {
              setEstL(Number(t.perkiraan_l || 0));
              setEstP(Number(t.perkiraan_p || 0));
              setCatatanRsvp(t.catatan_konfirmasi || '');
              setLastSavedTime(t.updated_at ? new Date(t.updated_at).toLocaleTimeString('id-ID') : '');
            } else {
              setEstL(Math.min(1, kDasar));
              setEstP(Math.max(0, Math.min(1, kDasar - 1)));
            }

            formatQrPayload(t.kode).then((payload) => {
              setFullQrPayload(payload);
              QRCode.toDataURL(payload, {
                width: 360,
                margin: 1.5,
                color: {
                  dark: '#422F21',
                  light: '#FAF7F3',
                },
              }).then(setQrDataUrl);
            });
          } else {
            // Fallback to store if not found in DB
            const found = store.getUndanganList().find((u) => u.kode === kodeSH);
            if (found) {
              const kDasar = found.kuota?.kuotaDasar || 2;
              const mappedItem = {
                id: found.id,
                kode: found.kode,
                tipe: 'UNDANGAN',
                nama: found.nama || '',
                namaPutra: found.namaPutra || '',
                namaPutri: found.namaPutri || '',
                kategori: found.kategori || 'Tamu Kehormatan',
                subKategori: found.golongan || 'KEHORMATAN',
                instansi: found.instansi || '',
                alamat: found.alamat || '',
                noHp: found.noHp || '',
                kuota: {
                  id: found.id,
                  kodeQr: found.kode,
                  kuotaDasar: kDasar,
                  kuotaTambahan: 0,
                  terpakai: found.kuota?.terpakai || 0,
                },
                estimasi: {
                  statusKonfirmasi: 'BELUM',
                  perkiraanL: 1,
                  perkiraanP: 1,
                  catatan: '',
                },
              };
              setItem(mappedItem);
              formatQrPayload(found.kode).then((payload) => {
                setFullQrPayload(payload);
                QRCode.toDataURL(payload, {
                  width: 360,
                  margin: 1.5,
                  color: { dark: '#422F21', light: '#FAF7F3' },
                }).then(setQrDataUrl);
              });
            }
          }
        } else {
          // Query ke tabel 'peserta_santri' (Wali Santri)
          const { data: s, error } = await supabase
            .from('peserta_santri')
            .select('*')
            .eq('kode', kodeSH)
            .single();

          if (s && !error) {
            const kDasar = Number(s.kuota_dasar || 2);
            const kTambahan = Number(s.kuota_tambahan || 0);
            const totKuota = kDasar + kTambahan;

            const mappedItem = {
              id: s.id,
              kode: s.kode,
              tipe: 'WALI',
              entitas: {
                id: s.id,
                nama: s.nama,
                namaWali: s.nama_wali || '-',
                alamat: s.alamat || 'Kediri',
                noHp: s.no_hp || '',
              },
              santri: {
                id: s.id,
                nama: s.nama,
                kategoriUtama: s.kategori_utama || 'BIL_GHOIB',
                subKategori: s.sub_kategori || 'Bil Ghoib',
                kelas: s.kelas || '-',
                kamar: s.kamar || '-',
              },
              kuota: {
                id: s.id,
                kodeQr: s.kode,
                kuotaDasar: kDasar,
                kuotaTambahan: kTambahan,
                terpakai: Number(s.kuota_terpakai || 0),
              },
              estimasi: {
                statusKonfirmasi: s.status_konfirmasi || 'BELUM',
                perkiraanL: Number(s.perkiraan_l || 0),
                perkiraanP: Number(s.perkiraan_p || 0),
                catatan: s.catatan_konfirmasi || '',
                diisiAt: s.updated_at || s.created_at,
              },
            };

            setItem(mappedItem);

            if (s.status_konfirmasi === 'SUDAH') {
              setEstL(Number(s.perkiraan_l || 0));
              setEstP(Number(s.perkiraan_p || 0));
              setCatatanRsvp(s.catatan_konfirmasi || '');
              setLastSavedTime(s.updated_at ? new Date(s.updated_at).toLocaleTimeString('id-ID') : '');
            } else {
              setEstL(Math.min(1, totKuota));
              setEstP(Math.max(0, Math.min(1, totKuota - 1)));
            }

            formatQrPayload(s.kode).then((payload) => {
              setFullQrPayload(payload);
              QRCode.toDataURL(payload, {
                width: 360,
                margin: 1.5,
                color: {
                  dark: '#422F21',
                  light: '#FAF7F3',
                },
              }).then(setQrDataUrl);
            });
          } else {
            // Fallback to store if not found in DB
            const found = store.findByKode(kodeSH) || store.findByKode('SH0001');
            if (found) {
              setItem(found);
              const totalK = found.kuota.kuotaDasar + found.kuota.kuotaTambahan;
              if (found.estimasi && found.estimasi.statusKonfirmasi === 'SUDAH') {
                const initL = Math.min(totalK, found.estimasi.perkiraanL);
                const initP = Math.min(totalK - initL, found.estimasi.perkiraanP);
                setEstL(initL);
                setEstP(initP);
                if (found.estimasi.diisiAt) {
                  setLastSavedTime(found.estimasi.diisiAt);
                }
              } else {
                setEstL(Math.min(1, totalK));
                setEstP(Math.max(0, Math.min(1, totalK - 1)));
              }

              formatQrPayload(found.kuota.kodeQr).then((payload) => {
                setFullQrPayload(payload);
                QRCode.toDataURL(payload, {
                  width: 360,
                  margin: 1.5,
                  color: {
                    dark: '#422F21',
                    light: '#FAF7F3',
                  },
                }).then(setQrDataUrl);
              });
            }
          }
        }
      } catch (e) {
        console.warn('Error loading invitation data from Supabase:', e);
      } finally {
        setLoadingSantri(false);
      }
    }

    fetchInvitationData();
  }, [kodeSH, isTamuUndangan]);

  // Fetch Status Kontrol Beli Kuota (Khusus Wali Santri)
  useEffect(() => {
    if (isTamuUndangan) return; // Skip untuk tamu undangan

    const fetchKuotaControlStatus = async () => {
      try {
        setLoadingKuotaControl(true);
        const { data: configData } = await supabase
          .from('konfigurasi_sistem')
          .select('*')
          .eq('key', 'kuota_tambahan_status')
          .maybeSingle();

        if (configData && configData.value) {
          setKuotaSwitchAktif(Boolean(configData.value.aktif));
        } else {
          setKuotaSwitchAktif(false);
        }

        const { data: pembelianData } = await supabase
          .from('pembelian_kuota')
          .select('*')
          .in('status', ['DIVERIFIKASI', 'DITERIMA']);

        if (pembelianData) {
          const sumDiverifikasi = pembelianData.reduce((acc: number, p: any) => {
            return acc + Number(p.jumlah_kursi || p.jumlah || 0);
          }, 0);
          setTotalDiverifikasi(sumDiverifikasi);
        }
      } catch (err) {
        console.warn('Error fetching kuota control status:', err);
      } finally {
        setLoadingKuotaControl(false);
      }
    };

    fetchKuotaControlStatus();

    const channel = supabase
      .channel('kuota_control_realtime_u')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'konfigurasi_sistem' },
        () => {
          fetchKuotaControlStatus();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pembelian_kuota' },
        () => {
          fetchKuotaControlStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isTamuUndangan]);

  // Handler Buka Undangan & Putar Musik
  const handleOpenInvitation = () => {
    setIsOpened(true);
    try {
      if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlayingMusic(true);
          })
          .catch(() => {});
      }
    } catch (e) {}
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingMusic(true);
        })
        .catch(() => {});
    }
  };

  // Simpan RSVP Konfirmasi Kehadiran ke Supabase
  const handleSimpanEstimasi = async () => {
    if (!item) return;
    setSavingRsvp(true);
    setRsvpError(null);

    const targetKode = item.kuota?.kodeQr || item.kode || kodeSH;
    const nowIso = new Date().toISOString();

    const payload = {
      status_konfirmasi: 'SUDAH',
      perkiraan_l: Number(estL),
      perkiraan_p: Number(estP),
      catatan_konfirmasi: catatanRsvp ? catatanRsvp.trim() : null,
      updated_at: nowIso,
    };

    try {
      const table = isTamuUndangan ? 'tamu_undangan' : 'peserta_santri';
      const { error } = await supabase
        .from(table)
        .update(payload)
        .eq('kode', targetKode);

      if (error) {
        console.warn(`Note updating RSVP in Supabase (${table}):`, error.message);
      }

      // Sync local store fallback
      if (item.kuota?.id) {
        store.simpanEstimasi(item.kuota.id, estL, estP, 'WALI_MANDIRI');
      }

      setItem((prev: any) => ({
        ...prev,
        estimasi: {
          ...prev?.estimasi,
          statusKonfirmasi: 'SUDAH',
          perkiraanL: Number(estL),
          perkiraanP: Number(estP),
          catatan: catatanRsvp ? catatanRsvp.trim() : '',
          diisiAt: nowIso,
        },
      }));

      setEstimasiSaved(true);
      setLastSavedTime(new Date().toLocaleTimeString('id-ID') + ' WIB');
      setTimeout(() => setEstimasiSaved(false), 5000);
    } catch (err: any) {
      console.error('Exception updating RSVP:', err);
      setRsvpError(`Terjadi kesalahan sistem: ${err.message || err}`);
    } finally {
      setSavingRsvp(false);
    }
  };

  const handleCopyKode = () => {
    if (!item) return;
    navigator.clipboard.writeText(item.kuota?.kodeQr || item.kode || kodeSH);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const santri = item?.santri;
  const kuota = item?.kuota;
  const isBilGhoib = santri?.kategoriUtama === 'BIL_GHOIB';

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#422F21] selection:bg-[#8C6A47]/20 relative overflow-x-hidden">
      {/* Audio Elemen Tersembunyi */}
      <audio ref={audioRef} src="/audio/backsound-haflah.wav" loop preload="auto" />

      {/* Floating Music Button (Tampil Setelah Undangan Dibuka) */}
      {isOpened && (
        <button
          onClick={toggleMusic}
          type="button"
          className="fixed top-4 right-4 z-40 w-11 h-11 rounded-full bg-white/90 backdrop-blur-md border-2 border-[#D5C4B4] text-[#8C6A47] shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title={isPlayingMusic ? 'Jeda Musik' : 'Putar Musik'}
        >
          {isPlayingMusic ? (
            <Volume2 className="w-5 h-5 text-[#8C6A47] animate-pulse" />
          ) : (
            <VolumeX className="w-5 h-5 text-stone-400" />
          )}
        </button>
      )}

      {/* ========================================================================= */}
      {/* SKENARIO A: UNDANGAN KHUSUS TAMU UNDANGAN (UNDxxxx)                       */}
      {/* Layout Formal, Hormat, dan Elegan                                          */}
      {/* ========================================================================= */}
      {isTamuUndangan ? (
        !isOpened ? (
          /* LAYAR 1: COVER AMPLOP PEMBUKA (TAMU UNDANGAN) */
          <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center relative z-20 bg-[#FAF7F3]">
            <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-10 border-2 border-[#D5C4B4] shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-[#FAF0E6] text-[#8C6A47] mx-auto flex items-center justify-center font-bold border-2 border-[#8C6A47] shadow-sm">
                <Sparkles className="w-8 h-8 text-[#8C6A47]" />
              </div>

              <div className="space-y-1">
                <div className="text-[10px] sm:text-xs font-serif font-black tracking-widest text-[#8C6A47] uppercase">
                  UNDANGAN KEHORMATAN
                </div>
                <h1 className="font-serif font-black text-xl sm:text-2xl text-[#322116] leading-tight">
                  Haul & Haflah Akhirussanah 1448 H. / 2027 M.
                </h1>
                <p className="text-xs text-[#7A624E] font-medium pt-0.5">
                  Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) & MHMTQ Lirboyo Kediri
                </p>
              </div>

              {/* Ornamen Pemisah Geometris Tipis */}
              <div className="flex items-center justify-center gap-3 my-2 text-[#8C6A47]/60">
                <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent flex-1" />
                <span className="text-xs">❖</span>
                <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent flex-1" />
              </div>

              {/* Penerima Undangan */}
              <div className="space-y-2 py-1">
                <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                  Kepada Yth. Bapak/Ibu/Saudara:
                </span>
                {renderTamuName(item)}

                <div className="inline-block px-3 py-1 rounded-full bg-[#FAF0E6] text-[#8C6A47] text-xs font-bold border border-[#D5C4B4] uppercase tracking-wider">
                  {getTamuCategoryLabel(item)}
                </div>

                {item?.instansi && item.instansi !== '-' && (
                  <p className="text-xs text-[#7A624E] font-medium pt-1">
                    Instansi / Asal: <strong className="text-[#422F21]">{item.instansi}</strong>
                  </p>
                )}
                {item?.alamat && item.alamat !== '-' && (!item?.instansi || item.instansi === '-') && (
                  <p className="text-xs text-[#7A624E] font-medium pt-1">{item.alamat}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenInvitation}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-sm tracking-wide shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 border border-amber-200/50 cursor-pointer animate-pulse"
                >
                  <MailOpen className="w-4 h-4 text-amber-200" />
                  <span>Buka Undangan ✉️</span>
                </button>
              </div>

              <p className="text-[10px] text-stone-400">
                Platform Berbasis Web Murni · Dibuka langsung di browser HP
              </p>
            </div>
          </div>
        ) : (
          /* LAYAR 2: KONTEN LENGKAP UNDANGAN TAMU UNDANGAN */
          <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-in fade-in duration-500 pb-28">
            {/* HEADER KARTU UNDANGAN KEHORMATAN */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF0E6] border border-[#D5C4B4] text-[#8C6A47] text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#8C6A47]" />
                <span>Haul & Haflah P3TQ - MHMTQ 2027</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#322116] leading-tight">
                Undangan Kehormatan
              </h1>
              <p className="text-xs text-[#7A624E]">
                Pondok Pesantren Putri Tahfizhil Qur-an & MHMTQ Lirboyo Kediri
              </p>
            </div>

            {/* KARTU IDENTITAS TAMU UNDANGAN (FORMAL & ELEGAN) */}
            <div className="bg-[#FAF7F3] rounded-3xl p-6 sm:p-8 border-2 border-[#D5C4B4] shadow-md space-y-4 relative overflow-hidden">
              {/* Kaligrafi Arab Basmalah Header */}
              <div className="text-center text-sm font-serif text-[#8C6A47] tracking-widest pb-1 font-arabic">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>

              {/* Divider Ornamen Geometris */}
              <div className="flex items-center justify-center gap-3 my-1 text-[#8C6A47]/60">
                <div className="h-px bg-gradient-to-r from-transparent via-[#8C6A47]/40 to-transparent flex-1" />
                <span className="text-xs">❖</span>
                <div className="h-px bg-gradient-to-r from-transparent via-[#8C6A47]/40 to-transparent flex-1" />
              </div>

              <div className="text-center space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#8C6A47]">
                  {getTamuCategoryLabel(item)}
                </span>

                {renderTamuName(item)}
              </div>

              <div className="pt-3 border-t border-[#D5C4B4]/60 text-xs space-y-1.5 text-center">
                {item?.instansi && item.instansi !== '-' && (
                  <div className="p-2.5 rounded-2xl bg-white border border-[#E8DFD5]">
                    <span className="text-stone-500 text-[10px] uppercase font-bold block">
                      Instansi / Asal:
                    </span>
                    <p className="font-bold text-[#422F21]">{item.instansi}</p>
                  </div>
                )}
                {item?.alamat && item.alamat !== '-' && (
                  <div className="p-2.5 rounded-2xl bg-white border border-[#E8DFD5]">
                    <span className="text-stone-500 text-[10px] uppercase font-bold block">
                      Alamat:
                    </span>
                    <p className="font-bold text-[#422F21]">{item.alamat}</p>
                  </div>
                )}
              </div>
            </div>

            {/* KALIMAT SAMBUTAN HORMATH & KHIDMAT */}
            <div className="bg-[#FAF0E6] p-5 sm:p-6 rounded-3xl border-2 border-[#D5C4B4] text-center space-y-2 shadow-xs">
              <p className="font-serif text-xs sm:text-sm text-[#422F21] leading-relaxed italic">
                "Dengan penuh hormat dan khidmat, kami mengundang Bapak/Ibu/Saudara untuk menghadiri Haul & Haflah Akhirussanah P3TQ & MHMTQ 1448 H./2027 M."
              </p>
            </div>

            {/* KARTU QR CODE GERBANG MASUK */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#8C6A47] shadow-lg text-center space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#8C6A47]">
                  KODE AKSES RESMI GERBANG MASUK
                </span>
                <h3 className="font-serif font-black text-lg text-[#322116]">
                  Tunjukkan QR Code Ini Kepada Petugas Gerbang
                </h3>
                <p className="text-xs text-stone-500">
                  Pintu registrasi dibuka mulai pukul <strong>06.30 WIB / 07.00 WIs</strong>
                </p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="p-3 rounded-3xl bg-[#FAF7F3] border-2 border-[#D5C4B4] shadow-inner max-w-[260px] w-full aspect-square flex items-center justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code ${kuota?.kodeQr}`}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-xs font-mono text-stone-400">Menyiapkan QR...</div>
                  )}
                </div>

                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-xl font-mono font-black text-[#422F21] tracking-widest bg-[#FAF0E6] px-4 py-1.5 rounded-xl border border-[#D5C4B4]">
                    {kuota?.kodeQr || item?.kode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKode}
                    className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs shadow-xs transition-colors cursor-pointer"
                    title="Salin Kode"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#FAF7F3] rounded-2xl border border-[#D5C4B4] text-xs text-center">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">
                  HAK KUOTA KURSI
                </span>
                <p className="font-serif font-black text-xl text-[#422F21]">
                  {kuota?.kuotaDasar || 2} Kursi Undangan
                </p>
              </div>
            </div>

            {/* WAKTU, LOKASI & COUNTDOWN TIMER */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E8DFD5] shadow-sm space-y-5 text-center">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A47]">
                  Waktu & Tempat Pelaksanaan
                </span>
                <h3 className="font-serif font-black text-xl text-[#422F21]">
                  Aula Al-Muktamar Pondok Pesantren Lirboyo
                </h3>
                <p className="text-xs text-stone-600">
                  Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
                <div className="p-3 rounded-2xl bg-[#FAF0E6] border border-[#D5C4B4]">
                  <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">
                    {timeLeft.days}
                  </div>
                  <div className="text-[10px] text-stone-600 font-bold uppercase">Hari</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF0E6] border border-[#D5C4B4]">
                  <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">
                    {timeLeft.hours}
                  </div>
                  <div className="text-[10px] text-stone-600 font-bold uppercase">Jam</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF0E6] border border-[#D5C4B4]">
                  <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">
                    {timeLeft.minutes}
                  </div>
                  <div className="text-[10px] text-stone-600 font-bold uppercase">Menit</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF0E6] border border-[#D5C4B4]">
                  <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">
                    {timeLeft.seconds}
                  </div>
                  <div className="text-[10px] text-stone-600 font-bold uppercase">Detik</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsDenahOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-[#FAF7F3] hover:bg-[#EFE8E1] text-[#5C3E28] text-xs font-bold border border-[#D5C4B4] inline-flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-[#8C6A47]" />
                  <span>Buka Denah Lokasi & Parkir VIP</span>
                </button>
              </div>
            </div>

            {/* RANGKAIAN ADICARA UTAMA */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E8DFD5] shadow-sm space-y-4">
              <h3 className="font-serif font-black text-base text-[#422F21] border-b border-stone-100 pb-2">
                Rangkaian Acara Hari H (02 Januari 2027)
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">
                    06.30 WIs
                  </span>
                  <p className="text-stone-700">
                    <strong>Registrasi Gerbang Masuk Dibuka</strong> (06.30 WIB / 07.00 WIs) & Tartilan Khotmil Qur'an.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">
                    07.30 WIs
                  </span>
                  <p className="text-stone-700">Pembukaan, Qiro'at, Tahlil, dan Sambutan-Sambutan Masyayikh.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">
                    08.52 WIs
                  </span>
                  <p className="text-stone-700">Pembagian Syahadah Takhtiman Bil Ghoibi & Bin Nadzori.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">
                    10.12 WIs
                  </span>
                  <p className="text-stone-700">Mau'idzoh Hasanah, Do'a Masyayikh, & Pembagian Ijazah Tamatan.</p>
                </div>
              </div>
            </div>

            {/* SECTION KONFIRMASI KEHADIRAN (RSVP) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E8DFD5] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-serif font-black text-base text-[#422F21]">
                    Konfirmasi Kehadiran (RSVP)
                  </h3>
                  <p className="text-xs text-[#7A624E]">
                    Mohon mengonfirmasi estimasi kehadiran rombongan untuk kelancaran tempat & konsumsi.
                  </p>
                </div>
                {item?.estimasi?.statusKonfirmasi === 'SUDAH' && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    ✓ Terkonfirmasi
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#422F21]">Tamu Laki-Laki</div>
                    <div className="text-[10px] text-stone-500">Zona Putra</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEstL(Math.max(0, estL - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-stone-300 font-bold text-xs cursor-pointer hover:bg-stone-100"
                    >
                      −
                    </button>
                    <span className="font-black text-sm w-4 text-center">{estL}</span>
                    <button
                      type="button"
                      onClick={() => setEstL(estL + 1)}
                      className="w-8 h-8 rounded-lg bg-[#8C6A47] text-white font-bold text-xs cursor-pointer hover:bg-[#735334]"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#422F21]">Tamu Perempuan</div>
                    <div className="text-[10px] text-stone-500">Zona Putri</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEstP(Math.max(0, estP - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-stone-300 font-bold text-xs cursor-pointer hover:bg-stone-100"
                    >
                      −
                    </button>
                    <span className="font-black text-sm w-4 text-center">{estP}</span>
                    <button
                      type="button"
                      onClick={() => setEstP(estP + 1)}
                      className="w-8 h-8 rounded-lg bg-[#8C6A47] text-white font-bold text-xs cursor-pointer hover:bg-[#735334]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#422F21] mb-1">
                  Catatan Rombongan / Permohonan Khusus (Opsional):
                </label>
                <input
                  type="text"
                  value={catatanRsvp}
                  onChange={(e) => setCatatanRsvp(e.target.value)}
                  placeholder="Contoh: Bawa pendamping, mohon tempat duduk baris depan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5C4B4] text-xs bg-[#FAF7F3] focus:bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8C6A47]"
                />
              </div>

              <button
                type="button"
                onClick={handleSimpanEstimasi}
                disabled={savingRsvp}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] hover:brightness-105 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {savingRsvp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                    <span>Menyimpan Konfirmasi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-200" />
                    <span>Simpan Konfirmasi Kehadiran</span>
                  </>
                )}
              </button>

              {rsvpError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-bold">
                  ⚠️ {rsvpError}
                </div>
              )}

              {estimasiSaved && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-center font-bold animate-in fade-in">
                  ✓ Konfirmasi kehadiran Anda berhasil disimpan{lastSavedTime ? ` pada ${lastSavedTime}` : ''}.
                </div>
              )}
            </div>

            {/* TOMBOL HUBUNGI PANITIA */}
            <div className="pt-2 space-y-3">
              <a
                href={`https://wa.me/6281234567890?text=Assalamu%27alaikum%20Panitia%20Haflah%2C%20saya%20tamu%20undangan%20kehormatan%20dengan%20kode%20${item?.kode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:brightness-105 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <MessageCircle className="w-4.5 h-4.5 text-emerald-200" />
                <span>Hubungi Panitia (WhatsApp)</span>
              </a>
            </div>

            {/* FOOTER INFORMASI TAMU UNDANGAN */}
            <div className="text-center text-xs text-stone-600 space-y-3 pt-6 border-t border-[#D5C4B4]/60">
              <div className="space-y-1">
                <p className="font-serif font-bold text-[#422F21]">
                  Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
                </p>
                <p className="font-serif text-[#7A624E]">
                  Aula Al-Muktamar, Pondok Pesantren Lirboyo Kediri
                </p>
              </div>

              <div className="py-2 text-[11px] font-serif text-[#422F21] leading-relaxed italic max-w-md mx-auto">
                "Atas kehadiran dan doa restu Bapak/Ibu/Saudara, kami sampaikan terima kasih.<br />
                Jazakumullahu khairan katsiran.<br />
                Wassalamu'alaikum warahmatullahi wabarakatuh."
              </div>

              <p className="text-[10px] text-stone-400">
                Pondok Pesantren Putri Tahfizhil Qur-an & MHMTQ Lirboyo Kediri
              </p>
            </div>
          </div>
        )
      ) : (
        /* ========================================================================= */
        /* SKENARIO B: UNDANGAN WALI SANTRI (SHxxxx)                                 */
        /* Layout Wali Santri yang Sudah Ada (Tidak Diubah)                          */
        /* ========================================================================= */
        !isOpened ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center relative z-20">
            <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-10 border-2 border-[#D5C4B4] shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-[#FAF0E6] text-[#8C6A47] mx-auto flex items-center justify-center font-bold border-2 border-[#8C6A47] shadow-sm">
                <Sparkles className="w-8 h-8 text-[#8C6A47]" />
              </div>

              <div className="space-y-1">
                <div className="text-[10px] sm:text-xs font-serif font-black tracking-widest text-[#8C6A47] uppercase">
                  UNDANGAN RESMI KHIDMAT
                </div>
                <h1 className="font-serif font-black text-xl sm:text-2xl text-[#322116] leading-tight">
                  Haul & Haflah Akhirussanah 1448 H. / 2027 M.
                </h1>
                <p className="text-xs text-[#7A624E] font-medium pt-0.5">
                  P3TQ & MHMTQ Lirboyo Kota Kediri
                </p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent my-2" />

              <div className="space-y-2 py-1">
                <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                  Kepada Yth. Bapak/Ibu Wali Santri dari:
                </span>
                <h2 className="text-lg sm:text-xl font-serif font-black text-[#422F21]">
                  {santri?.nama || item?.entitas?.nama || 'Wali Santri'}
                </h2>
                <div className="inline-block px-3 py-1 rounded-full bg-[#FAF0E6] text-[#8C6A47] text-xs font-bold border border-[#D5C4B4]">
                  {santri ? `${santri.subKategori} · Kamar ${santri.kamar || '-'}` : (item?.entitas?.kategori || 'Tamu Undangan')}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenInvitation}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-sm tracking-wide shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 border border-amber-200/50 cursor-pointer animate-pulse"
                >
                  <MailOpen className="w-4 h-4 text-amber-200" />
                  <span>Buka Undangan ✉️</span>
                </button>
              </div>

              <p className="text-[10px] text-stone-400">
                Platform Berbasis Web Murni · Dibuka langsung di browser HP
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-in fade-in duration-500 pb-28">
            {/* HEADER KARTU UNDANGAN WALI */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF0E6] border border-[#D5C4B4] text-[#8C6A47] text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#8C6A47]" />
                <span>Haul & Haflah P3TQ - MHMTQ 2027</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#322116] leading-tight">
                Undangan Resmi Khidmat
              </h1>
              <p className="text-xs text-[#7A624E]">
                Pondok Pesantren Putri Tahfizhil Qur-an & MHMTQ Lirboyo Kediri
              </p>
            </div>

            {/* PROFIL SANTRIWATI & WALI SANTRI */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E8DFD5] shadow-sm space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A47]">
                  Shohibul Hajat
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-[#422F21]">
                  {santri?.nama || item?.entitas?.nama}
                </h2>
                <p className="text-xs text-stone-600 font-medium">
                  {santri?.subKategori} · Kamar: <strong>{santri?.kamar || '-'}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-xs">
                <div className="p-3 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-0.5">
                  <span className="text-stone-500 text-[10px] uppercase font-bold">Nama Wali:</span>
                  <p className="font-bold text-[#422F21] truncate">{item?.entitas?.namaWali || item?.entitas?.nama}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-0.5">
                  <span className="text-stone-500 text-[10px] uppercase font-bold">Asal / Alamat:</span>
                  <p className="font-bold text-[#422F21] truncate">{item?.entitas?.alamat || 'Kediri'}</p>
                </div>
              </div>
            </div>

            {/* QR CODE & KODE MASUK WALI SANTRI */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#8C6A47] shadow-lg text-center space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#8C6A47]">
                  KODE AKSES RESMI GERBANG MASUK
                </span>
                <h3 className="font-serif font-black text-lg text-[#322116]">
                  Tunjukkan QR Code Ini Kepada Petugas Gerbang
                </h3>
                <p className="text-xs text-stone-500">
                  Pintu registrasi dibuka mulai pukul <strong>06.30 WIB / 07.00 WIs</strong>
                </p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="p-3 rounded-3xl bg-[#FAF7F3] border-2 border-[#D5C4B4] shadow-inner max-w-[260px] w-full aspect-square flex items-center justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code ${kuota?.kodeQr}`}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-xs font-mono text-stone-400">Menyiapkan QR...</div>
                  )}
                </div>

                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-xl font-mono font-black text-[#422F21] tracking-widest bg-[#FAF0E6] px-4 py-1.5 rounded-xl border border-[#D5C4B4]">
                    {kuota?.kodeQr || item?.kode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKode}
                    className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs shadow-xs transition-colors cursor-pointer"
                    title="Salin Kode"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[#FAF7F3] p-3 rounded-2xl border border-[#D5C4B4] text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-bold">KUOTA DASAR</span>
                  <p className="font-serif font-black text-lg text-[#422F21]">{kuota?.kuotaDasar || 2}</p>
                </div>
                <div className="border-x border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">TAMBAHAN</span>
                  <p className="font-serif font-black text-lg text-emerald-700">+{kuota?.kuotaTambahan || 0}</p>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-bold">TERPAKAI</span>
                  <p className="font-serif font-black text-lg text-stone-700">{kuota?.terpakai || 0}</p>
                </div>
              </div>
            </div>

            {/* SECTION KONTROL BELI KUOTA TAMBAHAN (WALI SANTRI ONLY) */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-[#E8DFD5] shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-sm sm:text-base text-[#422F21]">
                      Pembelian Kuota Tambahan Kursi
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Sisa Kuota Pagu: <strong>{Math.max(0, 300 - totalDiverifikasi)} unit</strong> ({totalDiverifikasi}/300 terisi)
                    </p>
                  </div>
                </div>
              </div>

              {loadingKuotaControl ? (
                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] text-center text-xs text-stone-500 flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8C6A47]" />
                  <span>Memeriksa status kuota tambahan...</span>
                </div>
              ) : kuotaSwitchAktif && totalDiverifikasi < 300 ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Panitia membuka kesempatan pembelian kuota tambahan kursi untuk wali santri.
                  </p>
                  <Link
                    href={`/beli/${kuota?.kodeQr || item?.kode || kodeSH}`}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:brightness-105 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <ShoppingBag className="w-4.5 h-4.5 text-emerald-200" />
                    <span>Beli Kuota Tambahan</span>
                    <ArrowRight className="w-4.5 h-4.5 text-emerald-200" />
                  </Link>
                </div>
              ) : !kuotaSwitchAktif ? (
                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center space-x-2.5 font-medium">
                  <Info className="w-4.5 h-4.5 text-slate-500 shrink-0" />
                  <span>Pembelian kuota tambahan sedang ditutup.</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2.5 font-medium">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                  <span>Kuota tambahan sudah habis (300/300 terisi).</span>
                </div>
              )}
            </div>

            {/* WAKTU, LOKASI & COUNTDOWN TIMER WALI */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E8DFD5] shadow-sm space-y-5 text-center">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A47]">
                  Waktu & Tempat Pelaksanaan
                </span>
                <h3 className="font-serif font-black text-xl text-[#422F21]">
                  Aula Al-Muktamar Pondok Pesantren Lirboyo
                </h3>
                <p className="text-xs text-stone-600">
                  Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
                <div className="p-3 rounded-2xl bg-[#FAF0E6] border border-[#D5C4B4]">
                  <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">{timeLeft.days}</div>
                  <div className="text-[10px] text-stone-600 font-bold uppercase">Hari</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF0E6] border border-[#D5C4B4]">
                  <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">{timeLeft.hours}</div>
                  <div className="text-[10px] text-stone-600 font-bold uppercase">Jam</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF0E6] border border-[#D5C4B4]">
                  <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">{timeLeft.minutes}</div>
                  <div className="text-[10px] text-stone-600 font-bold uppercase">Menit</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF0E6] border border-[#D5C4B4]">
                  <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">{timeLeft.seconds}</div>
                  <div className="text-[10px] text-stone-600 font-bold uppercase">Detik</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsDenahOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-[#FAF7F3] hover:bg-[#EFE8E1] text-[#5C3E28] text-xs font-bold border border-[#D5C4B4] inline-flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-[#8C6A47]" />
                  <span>Buka Denah Lokasi & Parkir</span>
                </button>
              </div>
            </div>

            {/* RANGKAIAN ADICARA UTAMA */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E8DFD5] shadow-sm space-y-4">
              <h3 className="font-serif font-black text-base text-[#422F21] border-b border-stone-100 pb-2">
                Rangkaian Acara Hari H (02 Januari 2027)
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">05.30 WIs</span>
                  <p className="text-stone-700">Persiapan Shohibul Hajat diberangkatkan ke Aula Al-Muktamar.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">06.00 WIs</span>
                  <p className="text-stone-700">Lalaran Tamatan Aliyah & Senandung Sholawat Syauqul Ahibba'.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">06.30 WIs</span>
                  <p className="text-stone-700">
                    <strong>Registrasi Gerbang Masuk Dibuka</strong> (06.30 WIB / 07.00 WIs) & Tartilan Khotmil Qur'an.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">07.30 WIs</span>
                  <p className="text-stone-700">Pembukaan, Qiro'at, Tahlil, dan Sambutan-Sambutan Masyayikh.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">08.52 WIs</span>
                  <p className="text-stone-700">Pembagian Syahadah Takhtiman Bil Ghoibi & Bin Nadzori.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">10.12 WIs</span>
                  <p className="text-stone-700">Mau'idzoh Hasanah, Do'a Masyayikh, & Pembagian Ijazah Tamatan.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">13.01 WIs</span>
                  <p className="text-stone-700">Penayangan Video Closing "Sajak Akhirussanah" dan Sesi Foto.</p>
                </div>
              </div>
            </div>

            {/* TATA TERTIB & KETENTUAN SAMBANGAN WALI SANTRI */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E8DFD5] shadow-sm space-y-4">
              <h3 className="font-serif font-black text-base text-[#422F21] border-b border-stone-100 pb-2">
                Tata Tertib & Ketentuan Sambangan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-900 block">🚫 Larangan Selama Acara:</span>
                  <p className="text-amber-800 leading-relaxed text-[11px]">
                    • Dilarang membawa <strong>buket</strong> ke aula.<br />
                    • Dilarang memakai kutek, hena, & nail art.<br />
                    • Dilarang membawa fotografer dari luar.<br />
                    • Wali dilarang memasuki area steril santriwati saat acara.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <span className="font-bold text-emerald-900 block">📍 Jadwal & Lokasi Sambangan:</span>
                  <p className="text-emerald-800 leading-relaxed text-[11px]">
                    • Dibuka <strong>setelah acara s.d. 18.00 WIs</strong>.<br />
                    • <strong>Halaman Al-Khodijah:</strong> Bil Ghoibi & Bin Nadzori.<br />
                    • <strong>Gedung Rusunawa Baru:</strong> Tamatan Aliyah.<br />
                    • Wajib mahrom sah (bawa KKS/KTP).
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION KONFIRMASI KEHADIRAN WALI SANTRI (RSVP) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E8DFD5] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-serif font-black text-base text-[#422F21]">
                    Konfirmasi Kehadiran (RSVP)
                  </h3>
                  <p className="text-xs text-[#7A624E]">
                    Bantu panitia menyiapkan tempat duduk dan konsumsi dengan mengisi perkiraan jumlah yang hadir.
                  </p>
                </div>
                {item?.estimasi?.statusKonfirmasi === 'SUDAH' && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    ✓ Terkonfirmasi
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#422F21]">Wali Laki-Laki</div>
                    <div className="text-[10px] text-stone-500">Zona Putra</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEstL(Math.max(0, estL - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-stone-300 font-bold text-xs cursor-pointer hover:bg-stone-100"
                    >
                      −
                    </button>
                    <span className="font-black text-sm w-4 text-center">{estL}</span>
                    <button
                      type="button"
                      onClick={() => setEstL(estL + 1)}
                      className="w-8 h-8 rounded-lg bg-[#8C6A47] text-white font-bold text-xs cursor-pointer hover:bg-[#735334]"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#422F21]">Wali Perempuan</div>
                    <div className="text-[10px] text-stone-500">Zona Putri</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEstP(Math.max(0, estP - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-stone-300 font-bold text-xs cursor-pointer hover:bg-stone-100"
                    >
                      −
                    </button>
                    <span className="font-black text-sm w-4 text-center">{estP}</span>
                    <button
                      type="button"
                      onClick={() => setEstP(estP + 1)}
                      className="w-8 h-8 rounded-lg bg-[#8C6A47] text-white font-bold text-xs cursor-pointer hover:bg-[#735334]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#422F21] mb-1">
                  Catatan Rombongan / Permohonan Khusus (Opsional):
                </label>
                <input
                  type="text"
                  value={catatanRsvp}
                  onChange={(e) => setCatatanRsvp(e.target.value)}
                  placeholder="Contoh: Datang bersama 1 balita, atau mohon jalur lansia..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D5C4B4] text-xs bg-[#FAF7F3] focus:bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8C6A47]"
                />
              </div>

              <button
                type="button"
                onClick={handleSimpanEstimasi}
                disabled={savingRsvp}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] hover:brightness-105 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {savingRsvp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                    <span>Menyimpan ke Sistem Panitia...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-200" />
                    <span>Simpan Konfirmasi Kehadiran</span>
                  </>
                )}
              </button>

              {rsvpError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-bold">
                  ⚠️ {rsvpError}
                </div>
              )}

              {estimasiSaved && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-center font-bold animate-in fade-in">
                  ✓ Konfirmasi kehadiran Anda berhasil disimpan ke sistem panitia Supabase{lastSavedTime ? ` pada ${lastSavedTime}` : ''}.
                </div>
              )}
            </div>

            {/* FOOTER WALI SANTRI */}
            <div className="text-center text-[11px] text-stone-500 space-y-1 pt-4">
              <p className="font-serif font-bold text-[#422F21]">
                Pondok Pesantren Putri Tahfizhil Qur-an & MHMTQ Lirboyo
              </p>
              <p>Platform Berbasis Web Murni · Dibuka langsung di browser tanpa perlu instalasi aplikasi</p>
            </div>
          </div>
        )
      )}

      {/* FLOATING USTADZAH AI BUTTON */}
      <button
        type="button"
        onClick={() => setIsUsModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#D49B5B] hover:brightness-110 text-white font-serif font-bold text-xs shadow-2xl flex items-center space-x-2 border-2 border-amber-200/60 transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span>Tanya Ustadzah AI</span>
        <Sparkles className="w-4 h-4 text-amber-200" />
      </button>

      {/* MODAL USTADZAH AI */}
      {isUsModalOpen && (
        <TanyaUsModal
          isOpen={isUsModalOpen}
          onClose={() => setIsUsModalOpen(false)}
          role="WALI"
        />
      )}

      {/* MODAL DENAH LOKASI */}
      <DenahModal isOpen={isDenahOpen} onClose={() => setIsDenahOpen(false)} />
    </div>
  );
}
