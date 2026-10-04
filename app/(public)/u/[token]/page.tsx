'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
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
  XCircle,
  ChevronDown,
  Send,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { store } from '@/lib/mock-data';
import { formatQrPayload, formatQrPayloadSync } from '@/lib/hmac';
import { calculateKuotaDasarSantri } from '@/lib/types';
import DenahModal from '@/components/DenahModal';
import NamaLembaga from '@/components/NamaLembaga';
import HeaderUndanganWali from '@/components/HeaderUndanganWali';
import HeaderUndangan from '@/components/HeaderUndangan';
import PortalBackground from '@/components/PortalBackground';
import GlassCard from '@/components/GlassCard';
import ScrollReveal from '@/components/ScrollReveal';

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

// Helper Ambil Nama Penerima Tamu Undangan
function getNamaPenerima(item: any): string {
  const namaDirect = (item?.nama || item?.entitas?.nama || '').trim();
  const namaPutra = (item?.namaPutra || item?.nama_putra || item?.entitas?.namaPutra || '').trim();
  const namaPutri = (item?.namaPutri || item?.nama_putri || item?.entitas?.namaPutri || '').trim();

  if (namaDirect && namaDirect !== '-' && namaDirect !== 'Tamu Undangan') {
    return namaDirect;
  }

  const hasPutra = namaPutra && namaPutra !== '-';
  const hasPutri = namaPutri && namaPutri !== '-';

  if (hasPutra && hasPutri) {
    return `${namaPutra} & ${namaPutri}`;
  }
  if (hasPutra) {
    return namaPutra;
  }
  if (hasPutri) {
    return namaPutri;
  }

  if (namaDirect && namaDirect !== '-') {
    return namaDirect;
  }

  return 'Tamu Undangan';
}

// Helper Render Nama Tamu Undangan
function renderTamuName(item: any) {
  const namaPenerima = getNamaPenerima(item);
  return (
    <h2 className="text-xl sm:text-2xl font-serif font-black text-[#322116] tracking-wide text-center leading-snug">
      {namaPenerima}
    </h2>
  );
}

// Helper Render Instansi & Alamat Tanpa Duplikasi
function renderInstansiDanAlamat(item: any) {
  const instansi = item?.instansi && item.instansi !== '-' ? item.instansi.trim() : '';
  const alamat = item?.alamat && item.alamat !== '-' ? item.alamat.trim() : '';

  if (instansi && alamat) {
    if (instansi.toLowerCase() === alamat.toLowerCase()) {
      return <p className="text-xs text-[#7A624E] font-medium pt-0.5">{instansi}</p>;
    }
    return (
      <>
        <p className="text-xs text-[#7A624E] font-medium pt-0.5">{instansi}</p>
        <p className="text-xs text-stone-500 font-medium pt-0.5">{alamat}</p>
      </>
    );
  }

  const single = instansi || alamat;
  if (single) {
    return <p className="text-xs text-[#7A624E] font-medium pt-0.5">{single}</p>;
  }

  return null;
}

// Komponen 3 Logo Resmi (P3TQ, Haul & Haflah, MHMTQ)
function HeaderLogos() {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6 my-3">
      <img
        src="/images/logo-p3tq.png"
        alt="Logo P3TQ"
        className="h-14 sm:h-18 object-contain drop-shadow-sm"
      />
      <img
        src="/logo-haul-haflah-transparent.png"
        alt="Logo Haul & Haflah"
        className="h-16 sm:h-20 object-contain drop-shadow-sm"
      />
      <img
        src="/images/logo-mhmtq.png"
        alt="Logo MHMTQ"
        className="h-14 sm:h-18 object-contain drop-shadow-sm"
      />
    </div>
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

  // State Interaktif Undangan
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

  // State RSVP Khusus Tamu Undangan (2 Tombol: HADIR / BERHALANGAN)
  const [tamuRsvpSaved, setTamuRsvpSaved] = useState<boolean>(false);

  // State Modal Denah & Us. Halwaa
  const [isDenahOpen, setIsDenahOpen] = useState(false);
  const [isUsModalOpen, setIsUsModalOpen] = useState(false);

  // State Global Switch Beli Kuota & Nomor WA Panitia (PERBAIKAN 2)
  const [kuotaSwitchAktif, setKuotaSwitchAktif] = useState<boolean>(false);
  const [totalDiverifikasi, setTotalDiverifikasi] = useState<number>(0);
  const [loadingKuotaControl, setLoadingKuotaControl] = useState<boolean>(true);
  const [waPanitiaConfig, setWaPanitiaConfig] = useState<string>('6285181805377');

  // Countdown Timer
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

  // Fetch WA Panitia Config (PERBAIKAN 2)
  useEffect(() => {
    async function fetchWaPanitia() {
      try {
        const { data } = await supabase
          .from('konfigurasi_sistem')
          .select('value')
          .eq('key', 'wa_panitia')
          .maybeSingle();

        if (data && data.value) {
          let val = '';
          if (typeof data.value === 'object' && data.value !== null) {
            val = data.value.nomor || data.value.wa || data.value.no_hp || '';
          } else if (typeof data.value === 'string') {
            val = data.value;
          }
          if (val) setWaPanitiaConfig(val);
        }
      } catch (e) {
        console.warn('Error fetching wa_panitia config:', e);
      }
    }
    fetchWaPanitia();
  }, []);

  // Fetch Live Data dari Supabase
  useEffect(() => {
    async function fetchInvitationData() {
      try {
        setLoadingSantri(true);

        if (isTamuUndangan) {
          const { data: t, error } = await supabase
            .from('tamu_undangan')
            .select('*')
            .eq('kode', kodeSH)
            .maybeSingle();

          if (t && !error) {
            const kDasar = Number(t.kuota_dasar !== undefined && t.kuota_dasar !== null ? t.kuota_dasar : (t.kategori === 'Asatidz Mhmtq Sekalian' ? 2 : 1));
            const mappedTamu = {
              id: t.id,
              kode: t.kode,
              tipe: 'UNDANGAN',
              nama: t.nama || '',
              namaPutra: t.nama_putra || '',
              namaPutri: t.nama_putri || '',
              kategori: t.kategori || 'Tamu Undangan',
              subKategori: t.golongan || 'ISTIMEWA',
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
                perkiraanL: Number(t.perkiraan_l || 1),
                perkiraanP: Number(t.perkiraan_p || 1),
                catatan: t.catatan_konfirmasi || '',
                diisiAt: t.updated_at || t.created_at,
              },
            };
            setItem(mappedTamu);

            formatQrPayload(t.kode).then((payload) => {
              setFullQrPayload(payload);
            });
          }
        } else {
          const { data: s, error } = await supabase
            .from('peserta_santri')
            .select('*')
            .eq('kode', kodeSH)
            .maybeSingle();

          if (s && !error) {
            const calculatedKDasar = calculateKuotaDasarSantri(s.kategori_utama, s.sub_kategori);
            const kDasar = Number(s.kuota_dasar && s.kuota_dasar >= calculatedKDasar ? s.kuota_dasar : calculatedKDasar);
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
            });
          }
        }
      } catch (e) {
        console.warn('Error fetching invitation data:', e);
      } finally {
        setLoadingSantri(false);
      }
    }

    fetchInvitationData();
  }, [kodeSH, isTamuUndangan]);

  // Fetch Beli Kuota Control Status + Realtime Subscription
  useEffect(() => {
    if (isTamuUndangan) return;

    async function fetchKuotaControl() {
      try {
        setLoadingKuotaControl(true);
        const { data: configData } = await supabase
          .from('konfigurasi_sistem')
          .select('value')
          .eq('key', 'kuota_tambahan_status')
          .maybeSingle();

        if (configData && configData.value) {
          let isAktif = false;
          if (typeof configData.value === 'object' && configData.value !== null) {
            isAktif = Boolean(configData.value.aktif);
          } else if (typeof configData.value === 'string') {
            isAktif = configData.value === 'true' || configData.value === 'TRUE';
          } else if (typeof configData.value === 'boolean') {
            isAktif = configData.value;
          }
          setKuotaSwitchAktif(isAktif);
        } else {
          setKuotaSwitchAktif(false);
        }

        const { data: pembelianData } = await supabase
          .from('pembelian_kuota')
          .select('jumlah_kursi, status')
          .in('status', ['DIVERIFIKASI', 'DITERIMA']);

        if (pembelianData) {
          const sumDiverifikasi = pembelianData.reduce((acc: number, p: any) => {
            return acc + Number(p.jumlah_kursi || p.jumlah || 0);
          }, 0);
          setTotalDiverifikasi(sumDiverifikasi);
        }
      } catch (e) {
        console.warn('Error fetching kuota tambahan control:', e);
      } finally {
        setLoadingKuotaControl(false);
      }
    }

    fetchKuotaControl();

    const channel = supabase
      .channel(`u_page_kuota_control_${kodeSH}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'konfigurasi_sistem' }, () => {
        fetchKuotaControl();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pembelian_kuota' }, () => {
        fetchKuotaControl();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kodeSH, isTamuUndangan]);

  // Handler Buka Undangan & Putar Backsound
  const handleOpenInvitation = () => {
    setIsOpened(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch((e) => {
        console.warn('Autoplay blocked by browser policy:', e);
        setIsPlayingMusic(false);
      });
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(console.warn);
    }
  };

  // Handler RSVP Tamu Undangan (2 Tombol: HADIR / BERHALANGAN)
  const handleKonfirmasiTamu = async (status: 'HADIR' | 'BERHALANGAN') => {
    if (!item) return;
    setSavingRsvp(true);
    setRsvpError(null);

    const targetKode = item.kodeQr || item.kode || kodeSH;
    const nowIso = new Date().toISOString();

    const payload = {
      status_konfirmasi: status,
      perkiraan_l: status === 'HADIR' ? 1 : 0,
      perkiraan_p: status === 'HADIR' ? 1 : 0,
      updated_at: nowIso,
    };

    try {
      await supabase
        .from('tamu_undangan')
        .update(payload)
        .eq('kode', targetKode);

      setItem((prev: any) => ({
        ...prev,
        estimasi: {
          ...prev?.estimasi,
          statusKonfirmasi: status,
          perkiraanL: status === 'HADIR' ? 1 : 0,
          perkiraanP: status === 'HADIR' ? 1 : 0,
          diisiAt: nowIso,
        },
      }));

      setTamuRsvpSaved(true);
      setTimeout(() => setTamuRsvpSaved(false), 5000);
    } catch (err: any) {
      setRsvpError(`Gagal menyimpan konfirmasi: ${err.message || err}`);
    } finally {
      setSavingRsvp(false);
    }
  };

  // Handler RSVP Wali Santri (Dengan Batas Maksimal Kuota Total & Non-Negatif)
  const totalKuotaSantri = (item?.kuota?.kuotaDasar || 2) + (item?.kuota?.kuotaTambahan || 0);
  const totalInputWali = Number(estL) + Number(estP);
  const isWaliRsvpExceeded = totalInputWali > totalKuotaSantri || estL < 0 || estP < 0;

  const handleSimpanEstimasiWali = async () => {
    if (!item) return;
    if (isWaliRsvpExceeded) {
      setRsvpError(`Total konfirmasi (${totalInputWali}) melebihi kuota Anda (${totalKuotaSantri} kursi). Mohon kurangi jumlahnya.`);
      return;
    }
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
      await supabase
        .from('peserta_santri')
        .update(payload)
        .eq('kode', targetKode);

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
      setRsvpError(`Terjadi kesalahan sistem: ${err.message || err}`);
    } finally {
      setSavingRsvp(false);
    }
  };

  const santri = item?.santri;
  const kuota = item?.kuota;

  // Custom WA Pre-filled Message untuk Wali Santri (Lengkap dengan Detail Santri)
  const namaSantriTxt = santri?.nama || item?.entitas?.nama || item?.nama || 'Santri';
  const kodeSantriTxt = santri?.kode || item?.kode || kodeSH;
  const kategoriTxt = santri?.subKategori || santri?.kategoriUtama || item?.subKategori || item?.kategori || 'Santri';
  const kamarTxt = santri?.kamar || '-';

  const textUsTanyaWali =
    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
    `Us, Saya Wali Santri dari ${namaSantriTxt} (${kodeSantriTxt}) - ${kategoriTxt} - Kamar ${kamarTxt}.\n\n` +
    `Saya mau bertanya.`;

  const rawWaNo = (waPanitiaConfig || '6285181805377').replace(/[^0-9]/g, '');
  const finalWaNo = rawWaNo.startsWith('0') ? '62' + rawWaNo.slice(1) : rawWaNo || '6285181805377';
  const waUsTanyaLink = `https://wa.me/${finalWaNo}?text=${encodeURIComponent(textUsTanyaWali)}`;

  // Custom WA Pre-filled Message untuk Tamu Undangan (Ringkas Hanya Nama)
  const namaPenerimaTamu = getNamaPenerima(item);

  const textUsTanyaTamu =
    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
    `Us, Saya ${namaPenerimaTamu}.\n\n` +
    `Saya mau bertanya.`;

  const waUsTanyaLinkTamu = `https://wa.me/${finalWaNo}?text=${encodeURIComponent(textUsTanyaTamu)}`;

  const textHalKhusus =
    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
    `Us, Saya Wali Santri dari ${namaSantriTxt} (${kodeSantriTxt}) - ${kategoriTxt} - Kamar ${kamarTxt}.\n\n` +
    `Saya ingin menyampaikan hal khusus:\n\n` +
    `(silakan tulis di sini)`;
  const waHalKhususLink = `https://wa.me/${finalWaNo}?text=${encodeURIComponent(textHalKhusus)}`;

  return (
    <div className="min-h-screen text-[#422F21] selection:bg-[#8C6A47]/20 relative overflow-x-hidden">
      {/* BACKGROUND PANGGUNG RESMI & EFEK VISUAL (PARALLAX + LIGHT RAYS + DEBU EMAS) */}
      <PortalBackground />

      {/* Audio Elemen Tersembunyi */}
      <audio ref={audioRef} src="/audio/backsound-haflah.wav" loop preload="auto" />

      {/* Floating Music Button */}
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
      {/* SKENARIO A: UNDANGAN TAMU UNDANGAN (UNDxxxx)                              */}
      {/* ========================================================================= */}
      {isTamuUndangan ? (
        !isOpened ? (
          /* COVER TAMU UNDANGAN */
          <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center relative z-20">
            <ScrollReveal>
              <GlassCard className="max-w-md w-full p-6 sm:p-10 border-2 border-[#D5C4B4]/80 shadow-2xl space-y-6 relative overflow-hidden">
                <HeaderUndangan titleType="UNDANGAN RESMI" />

                <div className="flex items-center justify-center gap-3 my-2 text-[#8C6A47]/60">
                  <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent flex-1" />
                  <span className="text-xs">❖</span>
                  <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent flex-1" />
                </div>

                <div className="space-y-2 py-1">
                  <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                    Kepada Yth. Bapak/Ibu/Saudara:
                  </span>
                  {renderTamuName(item)}

                  {renderInstansiDanAlamat(item)}
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    onClick={handleOpenInvitation}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-sm tracking-wide shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 border border-amber-200/50 cursor-pointer animate-pulse"
                  >
                    <MailOpen className="w-4 h-4 text-amber-200" />
                    <span>Buka Undangan ✉️</span>
                  </button>

                  <div className="pt-1 flex flex-col items-center space-y-1 text-stone-500 animate-bounce">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6A47]">
                      Scroll ke Bawah ✦
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#8C6A47]" />
                  </div>
                </div>
              </GlassCard>
            </ScrollReveal>
          </div>
        ) : (
          /* KONTEN LENGKAP TAMU UNDANGAN (DENGAN URUTAN KARTU KONSISTEN SEPERTI WALI SANTRI) */
          <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-5 md:space-y-6 animate-in fade-in duration-500 pb-28">
            {/* 1. HEADER KARTU UNDANGAN */}
            <ScrollReveal delay={50}>
              <GlassCard className="p-4 sm:p-6 border-2 border-[#D5C4B4]/80 shadow-md">
                <HeaderUndangan titleType="UNDANGAN RESMI" />
              </GlassCard>
            </ScrollReveal>

            {/* 2. KARTU IDENTITAS TAMU UNDANGAN & SAMBUTAN FORMAL ISLAMI */}
            <ScrollReveal delay={150}>
              <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#D5C4B4]/80 shadow-md space-y-4 relative overflow-hidden">
                <div className="text-center text-base font-serif text-[#8C6A47] font-bold tracking-widest font-arabic">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>

                <div className="flex items-center justify-center gap-3 my-1 text-[#8C6A47]/60">
                  <div className="h-px bg-gradient-to-r from-transparent via-[#8C6A47]/40 to-transparent flex-1" />
                  <span className="text-xs">❖</span>
                  <div className="h-px bg-gradient-to-r from-transparent via-[#8C6A47]/40 to-transparent flex-1" />
                </div>

                <div className="text-center space-y-2">
                  <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold block">
                    Kepada Yth. Bapak/Ibu/Saudara:
                  </span>
                  {renderTamuName(item)}

                  {renderInstansiDanAlamat(item)}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent my-2" />

                <div className="space-y-3 font-serif text-xs sm:text-sm text-[#422F21] leading-relaxed text-center">
                  <h3 className="font-bold text-sm sm:text-base text-[#422F21]">
                    Assalamu'alaikum Warahmatullahi Wabarakatuh
                  </h3>
                  <p className="text-justify sm:text-center">
                    Salam silaturahim kami sampaikan, semoga Bapak/Ibu/Saudara/i senantiasa berada dalam lindungan Allah SWT.
                  </p>
                  <p>
                    Dengan penuh rasa syukur kehadirat Allah SWT, kami mengharap kehadiran Bapak/Ibu/Saudara/i dalam acara <strong>Tasyakuran Takhtiman-Tamatan</strong>:
                  </p>
                  <div className="py-1">
                    <NamaLembaga align="center" size="xs" weight="bold" color="text-[#422F21]" />
                  </div>
                  <p>
                    serta <strong>Dzikrul Haul Al-Maghfur Lahum</strong>:
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#E8DFD5] text-xs font-serif font-bold text-[#5C3E28] space-y-1.5 text-center">
                  <p className="text-sm text-[#8C6A47] font-black">• KH. ABDUL KARIM •</p>
                  <p className="text-sm text-[#8C6A47] font-black">• KH. MAHRUS ALY •</p>
                  <p className="text-sm text-[#8C6A47] font-black">• KH. AHMAD IDRIS MARZUQI •</p>
                  <p className="text-sm text-[#8C6A47] font-black">• IBU NYAI HJ. ADDINIYAH KHODIJAH •</p>
                  <p className="text-[11px] text-stone-500 font-normal pt-1">dan segenap Masyayikh Pon. Pes. Lirboyo Kediri</p>
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* 3. KARTU DETAIL PELAKSANAAN ACARA */}
            <ScrollReveal delay={200}>
              <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A47]">
                    Pelaksanaan Acara
                  </span>
                  <h3 className="font-serif font-black text-lg text-[#422F21]">
                    Haul &amp; Haflah Akhirussanah 1448 H. / 2027 M.
                  </h3>
                </div>

                <div className="space-y-3 pt-2 text-xs sm:text-sm">
                  <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white/80 border border-[#E8DFD5]">
                    <Calendar className="w-5 h-5 text-[#8C6A47] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-stone-500 text-[10px] uppercase font-bold block">HARI / TANGGAL</span>
                      <p className="font-bold text-[#422F21]">Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white/80 border border-[#E8DFD5]">
                    <Clock className="w-5 h-5 text-[#8C6A47] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-stone-500 text-[10px] uppercase font-bold block">WAKTU</span>
                      <p className="font-bold text-[#422F21]">06.30 WIB / 07.00 WIs s.d. Selesai</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white/80 border border-[#E8DFD5]">
                    <MapPin className="w-5 h-5 text-[#8C6A47] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-stone-500 text-[10px] uppercase font-bold block">TEMPAT</span>
                      <p className="font-bold text-[#422F21]">Aula Al-Muktamar Pondok Pesantren Lirboyo Kediri</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* 4. ⬅️ KARTU HITUNG MUNDUR (COUNTDOWN TIMER) — DIPINDAH KE SINI */}
            <ScrollReveal delay={250}>
              <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-5 text-center">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A47]">
                    Waktu &amp; Tempat Pelaksanaan
                  </span>
                  <h3 className="font-serif font-black text-xl text-[#422F21]">
                    Aula Al-Muktamar Pondok Pesantren Lirboyo
                  </h3>
                  <p className="text-xs text-stone-600">
                    Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
                  <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
                    <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">
                      {timeLeft.days}
                    </div>
                    <div className="text-[10px] text-stone-600 font-bold uppercase">Hari</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
                    <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">
                      {timeLeft.hours}
                    </div>
                    <div className="text-[10px] text-stone-600 font-bold uppercase">Jam</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
                    <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">
                      {timeLeft.minutes}
                    </div>
                    <div className="text-[10px] text-stone-600 font-bold uppercase">Menit</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
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
                    className="px-5 py-2.5 rounded-2xl bg-[#FAF7F3] hover:bg-[#EFE8E1] text-[#5C3E28] text-xs font-bold border border-[#D5C4B4] inline-flex items-center space-x-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#8C6A47]" />
                    <span>Buka Denah Lokasi &amp; Parkir</span>
                  </button>
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* 5. KARTU RUNDOWN ACARA (PRA ACARA & ACARA INTI) */}
            <ScrollReveal delay={300}>
              <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-4">
                <h3 className="font-serif font-black text-base text-[#422F21] border-b border-stone-100 pb-2 text-center uppercase tracking-wider text-[#8C6A47]">
                  Rundown Acara
                </h3>

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* PRA ACARA */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <span className="font-serif font-black text-xs sm:text-sm text-[#8C6A47] uppercase tracking-wide block border-b border-amber-200/60 pb-1">
                      ✦ Pra Acara:
                    </span>
                    <ol className="list-decimal list-inside space-y-1.5 text-[#422F21] font-medium pl-1">
                      <li>Senandung Sholawat Nabi</li>
                      <li>Muhafadzoh Alfiyah Ibn Malik &amp; Jauharul Maknun</li>
                      <li>Tartilan</li>
                    </ol>
                  </div>

                  {/* ACARA INTI */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                    <span className="font-serif font-black text-xs sm:text-sm text-emerald-900 uppercase tracking-wide block border-b border-emerald-200/60 pb-1">
                      ✦ Acara Inti:
                    </span>
                    <ol className="list-decimal list-inside space-y-1.5 text-[#422F21] font-medium pl-1">
                      <li>Pembukaan</li>
                      <li>Pembacaan Ayat Al-Qur'an</li>
                      <li>Tahlil</li>
                      <li>Sambutan-sambutan</li>
                      <li>Istirahat</li>
                      <li>Mau'idzoh Hasanah</li>
                      <li>Penutup &amp; Doa</li>
                    </ol>
                  </div>
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* 6a. ⬅️ KARTU QR CODE GERBANG MASUK — DIPINDAH KE SINI */}
            <ScrollReveal delay={350}>
              <div className="bg-white rounded-3xl p-5 sm:p-7 md:p-8 border-2 border-[#8C6A47] shadow-lg text-center space-y-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8C6A47]">
                    KODE AKSES RESMI LOKASI ACARA
                  </span>
                  <h3 className="font-serif font-black text-lg text-[#322116]">
                    Tunjukkan QR Code Ini Kepada Petugas
                  </h3>
                  <p className="text-xs text-[#8C6A47] font-semibold">
                    Mohon QR Code disimpan dan ditunjukkan kepada petugas saat memasuki Lokasi acara.
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Pintu registrasi dibuka mulai pukul <strong>06.30 WIB / 07.00 WIs</strong>
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="p-4 rounded-3xl bg-[#FAF7F3] border-2 border-[#D5C4B4] shadow-inner max-w-[260px] w-full aspect-square flex items-center justify-center">
                    {item?.kode || kodeSH ? (
                      <QRCode
                        value={fullQrPayload || formatQrPayloadSync(item?.kode || kodeSH)}
                        size={220}
                        bgColor="#FAF7F3"
                        fgColor="#422F21"
                        level="M"
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      />
                    ) : (
                      <div className="text-xs font-serif font-bold text-stone-500">Kode tidak tersedia</div>
                    )}
                  </div>
                </div>

              </div>
            </ScrollReveal>

            {/* 6b. ⬅️ KARTU KONFIRMASI KEHADIRAN (RSVP TAMU UNDANGAN) — DIPINDAH KE SINI */}
            <ScrollReveal delay={400}>
              <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-5 text-center">
                <div className="space-y-1">
                  <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
                    Konfirmasi Kehadiran
                  </h3>
                  <p className="text-xs text-[#7A624E]">
                    Mohon konfirmasi kehadiran Anda agar panitia dapat menyiapkan tempat dengan baik.
                  </p>
                </div>

                {item?.estimasi?.statusKonfirmasi === 'HADIR' || item?.estimasi?.statusKonfirmasi === 'SUDAH' ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-2">
                    <div className="font-serif font-black text-sm text-emerald-900 flex items-center justify-center space-x-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                      <span>✓ Terkonfirmasi Hadir</span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      Terima kasih! Anda telah mengonfirmasi untuk <strong>HADIR</strong> pada Haul &amp; Haflah P3TQ - MHMTQ 2027.
                    </p>
                  </div>
                ) : item?.estimasi?.statusKonfirmasi === 'BERHALANGAN' ? (
                  <div className="p-4 rounded-2xl bg-stone-100 border-2 border-stone-300 text-stone-800 space-y-2">
                    <div className="font-serif font-black text-sm text-stone-900 flex items-center justify-center space-x-1.5">
                      <XCircle className="w-5 h-5 text-stone-600" />
                      <span>✗ Berhalangan Hadir</span>
                    </div>
                    <p className="text-xs text-stone-700">
                      Terima kasih atas konfirmasi Anda. Doa restu Bapak/Ibu/Saudara sangat bermakna bagi kami.
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleKonfirmasiTamu('HADIR')}
                    disabled={savingRsvp}
                    className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95 ${
                      item?.estimasi?.statusKonfirmasi === 'HADIR' || item?.estimasi?.statusKonfirmasi === 'SUDAH'
                        ? 'bg-emerald-800 text-white ring-2 ring-emerald-400'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>✓ Saya Hadir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleKonfirmasiTamu('BERHALANGAN')}
                    disabled={savingRsvp}
                    className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm border shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95 ${
                      item?.estimasi?.statusKonfirmasi === 'BERHALANGAN'
                        ? 'bg-stone-300 text-stone-900 border-stone-400 ring-2 ring-stone-400'
                        : 'bg-stone-200 hover:bg-stone-300 text-stone-800 border-stone-300'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-stone-600" />
                    <span>✗ Saya Berhalangan Hadir</span>
                  </button>
                </div>

                {rsvpError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                    ⚠️ {rsvpError}
                  </div>
                )}

                {tamuRsvpSaved && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-center font-bold animate-in fade-in">
                    ✓ Konfirmasi berhasil disimpan ke sistem panitia.
                  </div>
                )}
              </GlassCard>
            </ScrollReveal>

            {/* 8. FOOTER TANDA TANGAN PANITIA (SEJAJAR HORIZONTAL) */}
            <ScrollReveal delay={450}>
              <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm text-center space-y-5 text-xs font-serif text-[#422F21]">
                <p className="italic text-stone-600 leading-relaxed text-center">
                  Atas perhatian dan kehadiran Bapak/Ibu/Saudara/i, kami sampaikan terima kasih.<br />
                  Jazakumullahu khairan katsiran.
                </p>

                <div className="pt-4 border-t border-[#E8DFD5] grid grid-cols-2 gap-3 md:gap-6 max-w-md mx-auto text-center">
                  <div className="text-center space-y-1">
                    <p className="text-[10px] md:text-xs font-serif uppercase tracking-widest text-[#8C6A47] font-semibold">
                      KETUA UMUM
                    </p>
                    <p className="pt-3 font-serif font-bold text-sm md:text-base text-[#422F21]">
                      (Sinta Maelani)
                    </p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] md:text-xs font-serif uppercase tracking-widest text-[#8C6A47] font-semibold">
                      SEKRETARIS UMUM
                    </p>
                    <p className="pt-3 font-serif font-bold text-sm md:text-base text-[#422F21]">
                      (Refi Al Izzatul Kholifah)
                    </p>
                  </div>
                </div>

                <div className="pt-3 text-[#8C6A47] font-serif italic text-xs md:text-sm font-bold text-center">
                  Wassalamu'alaikum Warahmatullahi Wabarakatuh
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <NamaLembaga align="center" size="xs" weight="medium" color="text-stone-500" />
                  <p className="text-[10px] text-stone-400 mt-0.5 font-semibold">Lirboyo Kediri</p>
                </div>
              </GlassCard>
            </ScrollReveal>
          </div>
        )
      ) : (
        /* ========================================================================= */
        /* SKENARIO B: UNDANGAN WALI SANTRI (SHxxxx)                                 */
        /* Format Resmi Sesuai Undangan Tahun Lalu dengan Tema Krem-Coklat-Emas      */
        /* ========================================================================= */
        !isOpened ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center relative z-20">
            <ScrollReveal>
              <GlassCard className="max-w-md w-full p-6 sm:p-10 border-2 border-[#D5C4B4]/80 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="text-[10px] sm:text-xs font-serif font-black tracking-widest text-[#8C6A47] uppercase text-center">
                  UNDANGAN RESMI WALI SANTRI
                </div>

                <HeaderUndanganWali />

                <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent my-2" />

                <div className="space-y-2 py-1">
                  <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                    Kepada Yth. Bapak/Ibu Wali Santri dari:
                  </span>
                  <h2 className="text-lg sm:text-xl font-serif font-black text-[#422F21]">
                    {santri?.nama || item?.entitas?.nama || 'Wali Santri'}
                  </h2>
                  <div className="inline-block px-3 py-1 rounded-full bg-[#FAF0E6]/90 text-[#8C6A47] text-xs font-bold border border-[#D5C4B4]">
                    {santri ? `${santri.subKategori} · Kamar ${santri.kamar || '-'}` : 'Wali Santri'}
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    onClick={handleOpenInvitation}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-sm tracking-wide shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 border border-amber-200/50 cursor-pointer animate-pulse"
                  >
                    <MailOpen className="w-4 h-4 text-amber-200" />
                    <span>Buka Undangan ✉️</span>
                  </button>

                  <div className="pt-1 flex flex-col items-center space-y-1 text-stone-500 animate-bounce">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6A47]">
                      Scroll ke Bawah ✦
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#8C6A47]" />
                  </div>
                </div>
              </GlassCard>
            </ScrollReveal>
          </div>
        ) : (
          /* KONTEN LENGKAP UNDANGAN WALI SANTRI (TEKS FORMAT ISLAMI FORMAL TAHUN LALU) */
          <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-4 md:space-y-5 animate-in fade-in duration-500 pb-28">
            {/* 1. HEADER KARTU UNDANGAN WALI */}
            <ScrollReveal delay={50}>
              <GlassCard className="p-4 sm:p-6 border-2 border-[#D5C4B4]/80 shadow-md">
                <div className="text-[10px] sm:text-xs font-serif font-black tracking-widest text-[#8C6A47] uppercase text-center mb-1">
                  UNDANGAN RESMI WALI SANTRI
                </div>
                <HeaderUndanganWali />
              </GlassCard>
            </ScrollReveal>

            {/* 2. PROFIL SANTRIWATI & WALI SANTRI (PERBAIKAN 3 & 5: RAPIKAN GRID MOBILE) */}
            <ScrollReveal delay={100}>
              <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-3 border-t border-stone-100 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-xs border border-[#E8DFD5] space-y-0.5">
                    <span className="text-stone-500 text-[10px] uppercase font-bold block">Nama Wali:</span>
                    <p className="font-bold text-[#422F21] leading-snug">{item?.entitas?.namaWali || item?.entitas?.nama}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-xs border border-[#E8DFD5] space-y-0.5">
                    <span className="text-stone-500 text-[10px] uppercase font-bold block">Asal / Alamat:</span>
                    <p className="font-bold text-[#422F21] leading-snug">{item?.entitas?.alamat || 'Kediri'}</p>
                  </div>
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* 3. KALIMAT SAMBUTAN FORMAL ISLAMI & INFO MAHSYAYIKH */}
            <ScrollReveal delay={150}>
              <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#D5C4B4]/80 shadow-sm space-y-4 text-[#422F21]">
                <div className="text-center text-base font-serif text-[#8C6A47] font-bold tracking-widest font-arabic">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>

                <h3 className="font-serif font-bold text-center text-sm sm:text-base text-[#422F21]">
                  Assalamu'alaikum Warahmatullahi Wabarakatuh
                </h3>

                <p className="font-serif text-xs sm:text-sm text-[#422F21] leading-relaxed text-justify sm:text-center">
                  Salam silaturahim kami sampaikan, semoga Bapak/Ibu/Saudara/i senantiasa berada dalam lindungan Allah SWT.
                </p>

                <div className="space-y-2 font-serif text-xs sm:text-sm text-[#422F21] leading-relaxed text-center">
                  <p>
                    Dengan penuh rasa syukur kehadirat Allah SWT, kami mengharap kehadiran Bapak/Ibu/Saudara/i Wali Santri dalam acara <strong>Tasyakuran Takhtiman-Tamatan</strong>:
                  </p>
                  <div className="py-1">
                    <NamaLembaga align="center" size="xs" weight="bold" color="text-[#422F21]" />
                  </div>
                  <p>
                    serta <strong>Dzikrul Haul Al-Maghfur Lahum</strong>:
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#E8DFD5] text-xs font-serif font-bold text-[#5C3E28] space-y-1.5 text-center">
                  <p className="text-sm text-[#8C6A47] font-black">• KH. ABDUL KARIM •</p>
                  <p className="text-sm text-[#8C6A47] font-black">• KH. MAHRUS ALY •</p>
                  <p className="text-sm text-[#8C6A47] font-black">• KH. AHMAD IDRIS MARZUQI •</p>
                  <p className="text-sm text-[#8C6A47] font-black">• IBU NYAI HJ. ADDINIYAH KHODIJAH •</p>
                  <p className="text-[11px] text-stone-500 font-normal pt-1">dan segenap Masyayikh Pon. Pes. Lirboyo Kediri</p>
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* RANGKAIAN ADICARA UTAMA & TATA TERTIB SAMBANGAN */}
            <ScrollReveal delay={200}>
              <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-5">
                <div className="space-y-3">
                  <h3 className="font-serif font-black text-base text-[#422F21] border-b border-stone-100 pb-2">
                    Rangkaian Acara Haflah Akhirussanah P3TQ dan MHMTQ 1448 H. / 2027 M.
                  </h3>
                  <div className="space-y-2.5 text-xs md:text-sm leading-relaxed">
                    <div className="flex items-start space-x-3">
                      <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">05.30 WIs</span>
                      <p className="text-stone-700">Persiapan Shohibul Hajat diberangkatkan ke Aula Al-Muktamar.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">06.00 WIs</span>
                      <p className="text-stone-700">Lalaran Tamatan Aliyah &amp; Senandung Sholawat Syauqul Ahibba'.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">06.30 WIs</span>
                      <p className="text-stone-700">
                        <strong>Registrasi Gerbang Masuk Dibuka</strong> (06.30 WIB / 07.00 WIs) &amp; Tartilan Khotmil Qur'an.
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">07.30 WIs</span>
                      <p className="text-stone-700">Pembukaan, Qiro'at, Tahlil, dan Sambutan-Sambutan Masyayikh.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">08.52 WIs</span>
                      <p className="text-stone-700">Pembagian Syahadah Takhtiman Bil Ghoibi &amp; Bin Nadzori.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">10.12 WIs</span>
                      <p className="text-stone-700">Mau'idzoh Hasanah, Do'a Masyayikh, &amp; Pembagian Ijazah Tamatan.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">13.01 WIs</span>
                      <p className="text-stone-700">Penayangan Video Closing "Sajak Akhirussanah" dan Sesi Foto.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <h4 className="font-serif font-black text-sm text-[#422F21]">
                    Tata Tertib &amp; Ketentuan Sambangan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                      <span className="font-bold text-amber-900 block">🚫 Larangan Selama Acara:</span>
                      <ul className="text-amber-800 leading-relaxed text-[11px] md:text-xs space-y-1">
                        <li>• Dilarang membawa <strong>buket</strong> ke aula.</li>
                        <li>• Dilarang memakai kutek, hena, &amp; nail art.</li>
                        <li>• Dilarang membawa fotografer dari luar.</li>
                        <li>• Wali dilarang memasuki area steril santriwati saat acara.</li>
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                      <span className="font-bold text-emerald-900 block">📍 Jadwal &amp; Lokasi Sambangan:</span>
                      <ul className="text-emerald-800 leading-relaxed text-[11px] md:text-xs space-y-1">
                        <li>• Dibuka <strong>setelah acara s.d. 18.00 WIs</strong>.</li>
                        <li>• <strong>Halaman Al-Khodijah:</strong> Bil Ghoibi &amp; Bin Nadzori.</li>
                        <li>• <strong>Gedung Rusunawa Baru:</strong> Tamatan Aliyah.</li>
                        <li>• Wajib mahrom sah (bawa KKS/KTP).</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* 4. ⬅️ KARTU QR CODE GERBANG MASUK (DIPINDAH KE SEBELUM RSVP - PERBAIKAN 3) */}
            <ScrollReveal delay={250}>
              <div className="bg-white rounded-3xl p-5 sm:p-7 md:p-8 border-2 border-[#8C6A47] shadow-lg text-center space-y-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8C6A47]">
                    KODE AKSES RESMI LOKASI ACARA
                  </span>
                  <h3 className="font-serif font-black text-lg text-[#322116]">
                    Tunjukkan QR Code Ini Kepada Petugas
                  </h3>
                  <p className="text-xs text-[#8C6A47] font-semibold">
                    Mohon QR Code disimpan dan ditunjukkan kepada petugas saat memasuki Lokasi acara.
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Pintu registrasi dibuka mulai pukul <strong>06.30 WIB / 07.00 WIs</strong>
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="p-4 rounded-3xl bg-[#FAF7F3] border-2 border-[#D5C4B4] shadow-inner max-w-[260px] w-full aspect-square flex items-center justify-center">
                    {item?.kode || kodeSH ? (
                      <QRCode
                        value={fullQrPayload || formatQrPayloadSync(item?.kode || kodeSH)}
                        size={220}
                        bgColor="#FAF7F3"
                        fgColor="#422F21"
                        level="M"
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      />
                    ) : (
                      <div className="text-xs font-serif font-bold text-stone-500">Kode tidak tersedia</div>
                    )}
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
                    <span className="text-[10px] text-stone-500 uppercase font-bold">TOTAL KUOTA</span>
                    <p className="font-serif font-black text-lg text-stone-700">{totalKuotaSantri} Kursi</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* 5. KARTU RSVP (KONFIRMASI KEHADIRAN WALI SANTRI - STACK VERTIKAL & VALIDASI KETAT) */}
            <ScrollReveal delay={300}>
              <GlassCard className="p-4 sm:p-6 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-4 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-serif font-black text-base text-[#422F21]">
                      Konfirmasi Kehadiran (RSVP)
                    </h3>
                    <p className="text-xs md:text-sm text-[#7A624E] text-left">
                      Bantu panitia menyiapkan kursi Anda dengan mengisi perkiraan jumlah kehadiran di bawah ini.
                    </p>
                  </div>
                  {item?.estimasi?.statusKonfirmasi === 'SUDAH' && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                      ✓ Terkonfirmasi
                    </span>
                  )}
                </div>

                {/* STACK VERTIKAL (PUTRA & PUTRI) */}
                <div className="space-y-4 md:space-y-5 pt-1">
                  {/* WALI SANTRI PUTRA */}
                  <div>
                    <p className="text-sm md:text-base font-semibold text-[#422F21] mb-2 text-left">
                      WALI SANTRI PUTRA
                    </p>
                    <div className="grid grid-cols-3 gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => setEstL((p) => Math.max(0, p - 1))}
                        disabled={estL === 0}
                        className="h-10 rounded-lg bg-[#8C6A47] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
                        title="Kurangi Wali Santri Putra"
                      >
                        −
                      </button>
                      <div className="h-10 rounded-lg bg-white border border-[#8C6A47]/30 flex items-center justify-center text-lg font-bold text-[#422F21]">
                        {estL}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEstL((p) => (totalInputWali < totalKuotaSantri ? p + 1 : p))}
                        disabled={totalInputWali >= totalKuotaSantri}
                        className="h-10 rounded-lg bg-[#8C6A47] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
                        title="Tambah Wali Santri Putra"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[10px] md:text-xs italic text-stone-500 mt-1">
                      Zona Putra
                    </p>
                  </div>

                  {/* WALI SANTRI PUTRI */}
                  <div>
                    <p className="text-sm md:text-base font-semibold text-[#422F21] mb-2 text-left">
                      WALI SANTRI PUTRI
                    </p>
                    <div className="grid grid-cols-3 gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => setEstP((p) => Math.max(0, p - 1))}
                        disabled={estP === 0}
                        className="h-10 rounded-lg bg-[#8C6A47] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
                        title="Kurangi Wali Santri Putri"
                      >
                        −
                      </button>
                      <div className="h-10 rounded-lg bg-white border border-[#8C6A47]/30 flex items-center justify-center text-lg font-bold text-[#422F21]">
                        {estP}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEstP((p) => (totalInputWali < totalKuotaSantri ? p + 1 : p))}
                        disabled={totalInputWali >= totalKuotaSantri}
                        className="h-10 rounded-lg bg-[#8C6A47] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
                        title="Tambah Wali Santri Putri"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[10px] md:text-xs italic text-stone-500 mt-1">
                      Zona Putri
                    </p>
                  </div>


                </div>

                {/* ERROR INLINE SAAT JUMLAH MELEBIHI KUOTA */}
                {isWaliRsvpExceeded && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold text-center">
                    ⚠️ Jumlah konfirmasi ({totalInputWali} orang) melebihi kuota Anda ({totalKuotaSantri} kursi). Mohon kurangi jumlahnya.
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSimpanEstimasiWali}
                  disabled={savingRsvp || isWaliRsvpExceeded}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] hover:brightness-105 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
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

                <a
                  href={waHalKhususLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl bg-white border-2 border-[#8C6A47] text-[#422F21] hover:bg-[#FAF7F3] font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                  title="Hubungi Panitia via WhatsApp untuk Menyampaikan Hal Khusus"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ada Hal Khusus? Hubungi Panitia</span>
                </a>

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
              </GlassCard>
            </ScrollReveal>

            {/* 6. KARTU WAKTU, LOKASI & COUNTDOWN TIMER WALI */}
            <ScrollReveal delay={350}>
              <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-5 text-center">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A47]">
                    Waktu &amp; Tempat Pelaksanaan
                  </span>
                  <h3 className="font-serif font-black text-xl text-[#422F21]">
                    Aula Al-Muktamar Pondok Pesantren Lirboyo
                  </h3>
                  <p className="text-xs text-stone-600">
                    Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
                  <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
                    <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">{timeLeft.days}</div>
                    <div className="text-[10px] text-stone-600 font-bold uppercase">Hari</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
                    <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">{timeLeft.hours}</div>
                    <div className="text-[10px] text-stone-600 font-bold uppercase">Jam</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
                    <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">{timeLeft.minutes}</div>
                    <div className="text-[10px] text-stone-600 font-bold uppercase">Menit</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
                    <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">{timeLeft.seconds}</div>
                    <div className="text-[10px] text-stone-600 font-bold uppercase">Detik</div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDenahOpen(true)}
                    className="px-5 py-2.5 rounded-2xl bg-[#FAF7F3] hover:bg-[#EFE8E1] text-[#5C3E28] text-xs font-bold border border-[#D5C4B4] inline-flex items-center space-x-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#8C6A47]" />
                    <span>Buka Denah Lokasi &amp; Parkir</span>
                  </button>
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* 7. FOOTER TANDA TANGAN PANITIA (KETUA & SEKRETARIS SEJAJAR HORIZONTAL - PERBAIKAN 2) */}
            <ScrollReveal delay={400}>
              <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm text-center space-y-5 text-xs font-serif text-[#422F21]">
                <p className="italic text-stone-600 leading-relaxed text-center">
                  Atas perhatian dan kehadiran Bapak/Ibu/Saudara/i, kami sampaikan terima kasih.<br />
                  Jazakumullahu khairan katsiran.
                </p>

                <div className="pt-4 border-t border-[#E8DFD5] grid grid-cols-2 gap-3 md:gap-6 max-w-md mx-auto text-center">
                  <div className="text-center space-y-1">
                    <p className="text-[10px] md:text-xs font-serif uppercase tracking-widest text-[#8C6A47] font-semibold">
                      KETUA UMUM
                    </p>
                    <p className="pt-3 font-serif font-bold text-sm md:text-base text-[#422F21]">
                      (Sinta Maelani)
                    </p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] md:text-xs font-serif uppercase tracking-widest text-[#8C6A47] font-semibold">
                      SEKRETARIS UMUM
                    </p>
                    <p className="pt-3 font-serif font-bold text-sm md:text-base text-[#422F21]">
                      (Refi Al Izzatul Kholifah)
                    </p>
                  </div>
                </div>

                <div className="pt-3 text-[#8C6A47] font-serif italic text-xs md:text-sm font-bold text-center">
                  Wassalamu'alaikum Warahmatullahi Wabarakatuh
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* 8. ⬅️ KARTU PEMBELIAN KUOTA TAMBAHAN (DIPINDAH KE PALING BAWAH - PERBAIKAN 4) */}
            <ScrollReveal delay={450}>
              <GlassCard className="p-5 sm:p-7 border-2 border-[#E8DFD5]/80 shadow-sm space-y-3.5">
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
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3]/90 border border-[#E8DFD5] text-center text-xs text-stone-500 flex items-center justify-center space-x-2 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-[#8C6A47]" />
                    <span>Sedang memuat status kuota tambahan...</span>
                  </div>
                ) : kuotaSwitchAktif && totalDiverifikasi < 300 ? (
                  <div className="space-y-2.5 text-center">
                    <p className="text-xs text-stone-600 leading-relaxed font-medium">
                      Panitia membuka kesempatan pembelian kuota tambahan kursi untuk wali santri.
                    </p>
                    <Link
                      href={`/beli/${kodeSH}`}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-xs sm:text-sm tracking-wide shadow-md flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer border border-amber-200/40"
                    >
                      <ShoppingBag className="w-4.5 h-4.5 text-amber-200" />
                      <span>Beli Kuota Tambahan</span>
                      <ArrowRight className="w-4.5 h-4.5 text-amber-200" />
                    </Link>
                    <p className="text-[11px] text-stone-500 font-semibold">
                      Harga Rp 80.000 / kursi · Sisa kuota: <strong>{Math.max(0, 300 - totalDiverifikasi)} unit</strong>
                    </p>
                  </div>
                ) : !kuotaSwitchAktif ? (
                  <div className="p-3.5 rounded-2xl bg-slate-100/90 border border-slate-200 text-slate-700 text-xs flex items-center space-x-2.5 font-medium">
                    <Info className="w-4.5 h-4.5 text-slate-500 shrink-0" />
                    <span>Pembelian kuota tambahan sedang ditutup.</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2.5 font-medium">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                    <span>Kuota tambahan sudah habis (300/300 terisi).</span>
                  </div>
                )}
              </GlassCard>
            </ScrollReveal>

            {/* FOOTER WALI SANTRI */}
            <ScrollReveal delay={500}>
              <GlassCard className="p-5 text-center text-[11px] text-stone-500 space-y-1">
                <div className="pt-1">
                  <NamaLembaga align="center" size="xs" weight="bold" color="text-[#422F21]" />
                  <p className="text-[10px] text-stone-500 font-semibold mt-0.5">Lirboyo Kediri</p>
                </div>
                <p>Web Resmi Haflah P3TQ dan MHMTQ 2027</p>
              </GlassCard>
            </ScrollReveal>
          </div>
        )
      )}

      {/* FLOATING "US TANYA" BUTTON */}
      <a
        href={isTamuUndangan ? waUsTanyaLinkTamu : waUsTanyaLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-[#422F21] hover:bg-[#322116] text-white font-serif font-bold text-xs shadow-2xl flex items-center space-x-2 border-2 border-[#D49B5B] transition-all hover:scale-105 active:scale-95 cursor-pointer group"
        title="Hubungi Panitia via WhatsApp"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <MessageCircle className="w-4.5 h-4.5 text-[#D49B5B] group-hover:scale-110 transition-transform" />
        <span>Us Tanya</span>
      </a>

      {/* MODAL DENAH LOKASI */}
      <DenahModal isOpen={isDenahOpen} onClose={() => setIsDenahOpen(false)} />
    </div>
  );
}
