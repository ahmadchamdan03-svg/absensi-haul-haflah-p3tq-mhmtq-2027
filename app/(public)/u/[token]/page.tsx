'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactLenis } from 'lenis/react';
import { supabase } from '@/lib/supabase/client';
import { store } from '@/lib/mock-data';
import { formatQrPayload } from '@/lib/hmac';
import { calculateKuotaDasarSantri, cleanKategoriTamatan } from '@/lib/types';
import {
  normalizePortalToken,
  isValidKodeUndangan,
  getAmbiguousKodeVariants,
} from '@/lib/utils';
import DenahModal from '@/components/DenahModal';
import UndanganStageBackdrop from '@/components/public/undangan/UndanganStageBackdrop';
import CanvasRevealMask from '@/components/landing/CanvasRevealMask';
import DaftarShohibulHajatModal from '@/components/DaftarShohibulHajatModal';
import { getNamaPenerima } from '@/components/public/undangan/types';
import {
  MusicToggle,
  FloatingUsthTanyaButton,
} from '@/components/public/undangan/UndanganEffects';
import UndanganCoverOverlay, {
  UndanganNotFoundView,
} from '@/components/public/undangan/UndanganCoverOverlay';
import {
  TamuHeroAndEventSections,
  WaliHeroAndIdentitySections,
} from '@/components/public/undangan/UndanganHeroAndIdentity';
import UndanganWaliRsvpSection from '@/components/public/undangan/UndanganWaliRsvpSection';
import UndanganAcaraAndFooter from '@/components/public/undangan/UndanganAcaraAndFooter';
import UndanganTamuRsvpAndFooter from '@/components/public/undangan/UndanganTamuRsvpAndFooter';
import UndanganParallaxOrnaments from '@/components/public/undangan/UndanganParallaxOrnaments';
import { SkeletonCard } from '@/components/ui/GlassSkeleton';

export default function UndanganWaliPage() {
  const params = useParams();
  const rawToken = (params?.token as string) || '';

  // 1. Validasi & normalisasi format token (dukung kode acak alfanumerik & legacy UND-12345)
  const cleanToken = normalizePortalToken(rawToken);
  const isValidFormat = isValidKodeUndangan(cleanToken);
  const kodeSH = cleanToken;
  const isTamuUndangan = kodeSH.startsWith('UND');

  const [itemNotFound, setItemNotFound] = useState(!isValidFormat);

  // Helper: ambil data dari cache store lokal jika ada
  const buildItemFromLocalStore = (): any => {
    if (!isValidFormat || !kodeSH) return null;

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
            kuotaDasar: found.kuota?.kuotaDasar || 2,
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
      }
      return null;
    }

    const foundSantri = store.findByKode(kodeSH);
    return foundSantri || null;
  };

  const [item, setItem] = useState<any>(() => ({
    kode: kodeSH,
    tipe: isTamuUndangan ? 'UNDANGAN' : 'KELUARGA',
    nama: '',
    kuota: { kodeQr: kodeSH, kuotaDasar: isTamuUndangan ? 1 : 2, kuotaTambahan: 0, terpakai: 0 },
    estimasi: { statusKonfirmasi: 'BELUM', perkiraanL: 1, perkiraanP: 1, catatan: '' },
  }));

  useEffect(() => {
    if (!isValidFormat || !kodeSH) {
      setItemNotFound(true);
      return;
    }
    const cached = buildItemFromLocalStore();
    if (cached) {
      setItem((prev: any) => (prev?.nama ? prev : cached));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kodeSH]);

  const [fullQrPayload, setFullQrPayload] = useState<string>('');
  const [loadingSantri, setLoadingSantri] = useState(true);

  // State Interaktif Undangan
  const [isOpened, setIsOpened] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  // State Estimasi Kehadiran (RSVP)
  const [estL, setEstL] = useState(1);
  const [estP, setEstP] = useState(1);
  const [catatanRsvp, setCatatanRsvp] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [estimasiSaved, setEstimasiSaved] = useState(false);
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  // State RSVP Khusus Tamu Undangan
  const [tamuRsvpSaved, setTamuRsvpSaved] = useState<boolean>(false);

  // State Modal Denah & Daftar Shohibul Hajat
  const [isDenahOpen, setIsDenahOpen] = useState(false);
  const [isDaftarPesertaOpen, setIsDaftarPesertaOpen] = useState(false);

  // State Global Switch Beli Kuota & Nomor WA Panitia
  const [kuotaSwitchAktif, setKuotaSwitchAktif] = useState<boolean>(false);
  const [totalDiverifikasi, setTotalDiverifikasi] = useState<number>(0);
  const [loadingKuotaControl, setLoadingKuotaControl] = useState<boolean>(true);
  const [waPanitiaConfig, setWaPanitiaConfig] = useState<string>('6285181805377');

  // Fetch WA Panitia Config
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

  // Fetch Live Data dari Supabase (Dual-Table Query + API Fallback + Ambiguous Lookup Fallback)
  useEffect(() => {
    async function fetchInvitationData() {
      if (!isValidFormat || !kodeSH) {
        setItemNotFound(true);
        setLoadingSantri(false);
        return;
      }

      try {
        setLoadingSantri(true);

        let rawDataSantri: any = null;
        let rawDataTamu: any = null;

        if (isTamuUndangan) {
          let resTamu = await supabase
            .from('tamu_undangan')
            .select('*')
            .eq('kode', kodeSH)
            .maybeSingle();

          // Part A Fallback: Toleransi ambiguitas 0/O dan 1/I
          if (!resTamu.data && !resTamu.error) {
            const variants = getAmbiguousKodeVariants(kodeSH);
            if (variants.length > 1) {
              resTamu = await supabase
                .from('tamu_undangan')
                .select('*')
                .in('kode', variants)
                .limit(1)
                .maybeSingle();
            }
          }
          rawDataTamu = resTamu.data;
        } else {
          let resSantri = await supabase
            .from('peserta_santri')
            .select('*')
            .eq('kode', kodeSH)
            .maybeSingle();

          // Part A Fallback: Toleransi ambiguitas 0/O dan 1/I (mis. SH80X7 -> SH8OX7)
          if (!resSantri.data && !resSantri.error) {
            const variants = getAmbiguousKodeVariants(kodeSH);
            if (variants.length > 1) {
              resSantri = await supabase
                .from('peserta_santri')
                .select('*')
                .in('kode', variants)
                .limit(1)
                .maybeSingle();
            }
          }
          rawDataSantri = resSantri.data;
        }

        // 3. Fallback API route jika kedua query Supabase kosong
        if (!rawDataSantri && !rawDataTamu) {
          try {
            const apiRes = await fetch(`/api/sync?kode=${encodeURIComponent(kodeSH)}`);
            if (apiRes.ok) {
              const apiJson = await apiRes.json();
              if (apiJson?.tamu) {
                rawDataTamu = apiJson.tamu;
              } else if (apiJson?.santri) {
                rawDataSantri = apiJson.santri;
              }
            }
          } catch (errApi) {
            console.warn('[Undangan] API fallback fetch error:', errApi);
          }
        }

        // Handle Tamu Undangan
        if (rawDataTamu) {
          let t = rawDataTamu;
          if (t.merged_group_id) {
            const { data: groupTamu } = await supabase
              .from('tamu_undangan')
              .select('*')
              .eq('merged_group_id', t.merged_group_id);
            if (groupTamu && groupTamu.length > 1) {
              const getPriority = (g: string) => {
                const up = String(g || '').toUpperCase();
                if (up.includes('ISTIMEWA')) return 3;
                if (up.includes('KEHORMATAN')) return 2;
                return 1;
              };
              groupTamu.sort((a, b) => getPriority(b.sub_kategori || b.kategori) - getPriority(a.sub_kategori || a.kategori));
              t = groupTamu[0];
            }
          }
          setItemNotFound(false);
          const countL = t.nama_putra && String(t.nama_putra).trim() ? 1 : 0;
          const countP = t.nama_putri && String(t.nama_putri).trim() ? 1 : 0;
          const kDasar = t.kuota_dasar ? Number(t.kuota_dasar) : Math.max(1, countL + countP);
          const mappedTamu = {
            id: t.id,
            kode: t.kode,
            tipe: 'UNDANGAN',
            nama: t.nama || '',
            namaPutra: t.nama_putra || '',
            namaPutri: t.nama_putri || '',
            kategori: t.kategori || 'Tamu Undangan',
            subKategori: t.sub_kategori || (t as any).golongan || 'ISTIMEWA',
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
              hariKonfirmasi: t.hari_konfirmasi || 'SABTU',
              jamKonfirmasi: t.jam_konfirmasi || '06:30',
              catatan: t.catatan_konfirmasi || '',
              diisiAt: t.updated_at || t.created_at,
            },
          };
          setItem(mappedTamu);

          formatQrPayload(t.kode).then((payload) => {
            setFullQrPayload(payload);
          });
        }
        // Handle Peserta Santri (Wali Santri)
        else if (rawDataSantri) {
          let s = rawDataSantri;
          if (s.merged_group_id) {
            const { data: groupSantri } = await supabase
              .from('peserta_santri')
              .select('*')
              .eq('merged_group_id', s.merged_group_id);
            if (groupSantri && groupSantri.length > 1) {
              const getPrioritySantri = (kat: string) => {
                const up = String(kat || '').toUpperCase();
                if (up.includes('BIL_GHOIB') || up.includes('GHOIB')) return 3;
                if (up.includes('BIN_NADZOR') || up.includes('NADZOR')) return 2;
                return 1;
              };
              groupSantri.sort((a, b) => getPrioritySantri(b.kategori_utama) - getPrioritySantri(a.kategori_utama));
              s = groupSantri[0];
            }
          }
          setItemNotFound(false);
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
              subKategori:
                cleanKategoriTamatan(s.sub_kategori) ||
                (s.kategori_utama === 'TAMATAN'
                  ? 'Tamatan'
                  : s.kategori_utama === 'BIN_NADZOR'
                  ? 'Bin Nadzori'
                  : 'Bil Ghoib'),
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
        } else {
          const local = buildItemFromLocalStore();
          if (local) {
            setItem(local);
            setItemNotFound(false);
          } else {
            setItemNotFound(true);
          }
        }
      } catch (e) {
        console.warn('Error fetching invitation data:', e);
        const local = buildItemFromLocalStore();
        if (local) {
          setItem(local);
          setItemNotFound(false);
        } else {
          setItemNotFound(true);
        }
      } finally {
        setLoadingSantri(false);
      }
    }

    fetchInvitationData();
  }, [kodeSH, isValidFormat]);

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

  // Kunci scroll body dan nonaktifkan interaksi konten utama saat cover belum dibuka
  useEffect(() => {
    if (!isOpened) {
      document.body.style.overflow = 'hidden';
      mainContentRef.current?.setAttribute('inert', '');
    } else {
      document.body.style.overflow = 'unset';
      mainContentRef.current?.removeAttribute('inert');
    }
    return () => {
      document.body.style.overflow = 'unset';
      mainContentRef.current?.removeAttribute('inert');
    };
  }, [isOpened, item?.tipe, itemNotFound]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(console.warn);
    }
  };

  // Handler RSVP Tamu Undangan
  const handleKonfirmasiTamu = async (status: 'HADIR' | 'BERHALANGAN') => {
    if (!item) return;
    setSavingRsvp(true);
    setRsvpError(null);

    const targetKode = String(item.kodeQr || item.kode || kodeSH).toUpperCase().trim();
    const nowIso = new Date().toISOString();

    const payload = {
      status_konfirmasi: status,
      updated_at: nowIso,
    };

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TAMU',
          kode: targetKode,
          status_konfirmasi: status,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal menyimpan konfirmasi');
      }

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

  // Handler RSVP Wali Santri
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

    const targetKode = String(item.kuota?.kodeQr || item.kode || kodeSH).toUpperCase().trim();
    const nowIso = new Date().toISOString();

    const payload = {
      status_konfirmasi: 'SUDAH',
      perkiraan_l: Number(estL),
      perkiraan_p: Number(estP),
      catatan_konfirmasi: catatanRsvp ? catatanRsvp.trim() : null,
      updated_at: nowIso,
    };

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SANTRI',
          kode: targetKode,
          perkiraan_l: Number(estL),
          perkiraan_p: Number(estP),
          catatan_konfirmasi: catatanRsvp ? catatanRsvp.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal menyimpan konfirmasi');
      }

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

  // Custom WA Pre-filled Message untuk Wali Santri
  const namaSantriTxt = santri?.nama || item?.entitas?.nama || item?.nama || 'Santri';
  const kodeSantriTxt = santri?.kode || item?.kode || kodeSH;
  const kategoriTxt = santri?.subKategori || santri?.kategoriUtama || item?.subKategori || item?.kategori || 'Santri';
  const kamarTxt = santri?.kamar || '-';

  const textUsTanyaWali =
    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
    `Usth., Saya Wali Santri dari ${namaSantriTxt} (${kodeSantriTxt}) - ${kategoriTxt} - Kamar ${kamarTxt}.\n\n` +
    `Saya mau bertanya.`;

  const rawWaNo = (waPanitiaConfig || '6285181805377').replace(/[^0-9]/g, '');
  const finalWaNo = rawWaNo.startsWith('0') ? '62' + rawWaNo.slice(1) : rawWaNo || '6285181805377';
  const waUsTanyaLink = `https://wa.me/${finalWaNo}?text=${encodeURIComponent(textUsTanyaWali)}`;

  // Custom WA Pre-filled Message untuk Tamu Undangan
  const namaPenerimaTamu = getNamaPenerima(item);
  const textUsTanyaTamu =
    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
    `Usth., Saya ${namaPenerimaTamu}.\n\n` +
    `Saya mau bertanya.`;
  const waUsTanyaLinkTamu = `https://wa.me/${finalWaNo}?text=${encodeURIComponent(textUsTanyaTamu)}`;

  const textHalKhusus =
    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
    `Usth., Saya Wali Santri dari ${namaSantriTxt} (${kodeSantriTxt}) - ${kategoriTxt} - Kamar ${kamarTxt}.\n\n` +
    `Saya ingin menyampaikan hal khusus:\n\n` +
    `(silakan tulis di sini)`;
  const waHalKhususLink = `https://wa.me/${finalWaNo}?text=${encodeURIComponent(textHalKhusus)}`;

  // Jika kode tidak valid atau tidak ditemukan di database & store lokal
  if (!loadingSantri && itemNotFound) {
    return <UndanganNotFoundView finalWaNo={finalWaNo} />;
  }

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      <div
        className={`min-h-[100dvh] bg-[#0F2C59] text-white selection:bg-amber-400/30 selection:text-white relative ${
          !isOpened ? 'h-[100dvh] overflow-hidden' : 'overflow-x-hidden overflow-y-auto'
        }`}
      >
        {/* 1. LAYER BACKGROUND PANGGUNG AULA TETAP (FIXED INSET-0 Z-0) */}
        <UndanganStageBackdrop className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none" />

        {/* 2. LAYER CANVAS REVEAL MASK (RIAK AIR DI SELURUH HALAMAN Z-10) */}
        <CanvasRevealMask
          renderImage={false}
          className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-10"
        />

        {/* 3. ASET VISUAL DARI FILE CDR & ORNAMEN PARALLAX FLOATING (Z-20) */}
        <UndanganParallaxOrnaments isOpened={isOpened} />

        {/* Audio Elemen Tersembunyi */}
        <audio
          ref={audioRef}
          src="/audio/bgm-hubbun-nabi.mp3"
          loop
          preload="metadata"
          onPlay={() => setIsPlayingMusic(true)}
          onPause={() => setIsPlayingMusic(false)}
        />

        {/* Floating Music Button */}
        <MusicToggle
          isOpened={isOpened}
          isPlayingMusic={isPlayingMusic}
          toggleMusic={toggleMusic}
        />

        {/* LAYAR COVER CINEMATIC (SLIDE-UP MEWAH DENGAN FRAMER MOTION) */}
        <AnimatePresence>
          {!isOpened && (
            <motion.div
              key="cinematic-cover-slideup"
              initial={{ y: 0, opacity: 1 }}
              exit={{
                y: '-100%',
                opacity: 0.98,
                transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
              }}
              className="fixed inset-0 z-30 overflow-hidden bg-transparent"
            >
              <UndanganCoverOverlay
                isTamu={isTamuUndangan || item?.tipe === 'UNDANGAN'}
                item={item}
                santri={santri}
                onOpen={handleOpenInvitation}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* KONTEN PORTAL UNDANGAN (TAMPIL DI BAWAH COVER DENGAN TRANSISI ELEGAN)     */}
        {/* ========================================================================= */}
        {item?.tipe === 'UNDANGAN' || isTamuUndangan ? (
          <div
            ref={mainContentRef}
            data-portal-content="true"
            aria-hidden={!isOpened}
            className={`relative z-20 max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-5 md:space-y-6 pb-28 ${
              !isOpened ? 'hidden' : 'animate-in fade-in duration-500'
            }`}
          >
            <TamuHeroAndEventSections
              item={item}
              onOpenDenah={() => setIsDenahOpen(true)}
              onOpenDaftarPeserta={() => setIsDaftarPesertaOpen(true)}
            />

            {loadingSantri ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <SkeletonCard className="h-44" />
                <SkeletonCard className="h-64" />
              </div>
            ) : (
              <UndanganTamuRsvpAndFooter
                item={item}
                kodeSH={kodeSH}
                fullQrPayload={fullQrPayload}
                savingRsvp={savingRsvp}
                rsvpError={rsvpError}
                tamuRsvpSaved={tamuRsvpSaved}
                onKonfirmasiTamu={handleKonfirmasiTamu}
              />
            )}
          </div>
        ) : (
          <div
            ref={mainContentRef}
            data-portal-content="true"
            aria-hidden={!isOpened}
            className={`relative z-20 max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-4 md:space-y-5 pb-28 ${
              !isOpened ? 'hidden' : 'animate-in fade-in duration-500'
            }`}
          >
            <WaliHeroAndIdentitySections
              item={item}
              santri={santri}
              kuota={kuota}
              kodeSH={kodeSH}
              fullQrPayload={fullQrPayload}
              totalKuotaSantri={totalKuotaSantri}
            />

            {loadingSantri ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <SkeletonCard className="h-48" />
                <SkeletonCard className="h-64" />
              </div>
            ) : (
              <UndanganWaliRsvpSection
                item={item}
                totalKuotaSantri={totalKuotaSantri}
                estL={estL}
                setEstL={setEstL}
                estP={estP}
                setEstP={setEstP}
                savingRsvp={savingRsvp}
                isWaliRsvpExceeded={isWaliRsvpExceeded}
                handleSimpanEstimasiWali={handleSimpanEstimasiWali}
                waHalKhususLink={waHalKhususLink}
                rsvpError={rsvpError}
                estimasiSaved={estimasiSaved}
                lastSavedTime={lastSavedTime}
              />
            )}

            <UndanganAcaraAndFooter
              kodeSH={kodeSH}
              onOpenDenah={() => setIsDenahOpen(true)}
              onOpenDaftarPeserta={() => setIsDaftarPesertaOpen(true)}
              loadingKuotaControl={loadingKuotaControl}
              kuotaSwitchAktif={kuotaSwitchAktif}
              totalDiverifikasi={totalDiverifikasi}
            />
          </div>
        )}

        {/* FLOATING "USTH TANYA" BUTTON */}
        {isOpened && (
          <FloatingUsthTanyaButton
            href={isTamuUndangan ? waUsTanyaLinkTamu : waUsTanyaLink}
          />
        )}

        {/* MODAL DENAH LOKASI */}
        <DenahModal isOpen={isDenahOpen} onClose={() => setIsDenahOpen(false)} />

        {/* MODAL DAFTAR SHOHIBUL HAJAT */}
        <DaftarShohibulHajatModal
          isOpen={isDaftarPesertaOpen}
          onClose={() => setIsDaftarPesertaOpen(false)}
        />
      </div>
    </ReactLenis>
  );
}
