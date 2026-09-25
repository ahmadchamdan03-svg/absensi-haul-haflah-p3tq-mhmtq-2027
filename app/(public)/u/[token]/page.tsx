'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  Users,
  CheckCircle2,
  ShoppingBag,
  Info,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Compass,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { formatQrPayload } from '@/lib/hmac';
import { TraditionalCorner, BegoniaCartouche } from '@/components/Ornaments';
import DenahModal from '@/components/DenahModal';

export default function PortalWaliPage() {
  const params = useParams();
  const token = (params?.token as string) || '';
  const kodeSH = token.split('-')[0] || 'SH0001';

  const [item, setItem] = useState<any>(() => store.findByKode(kodeSH) || store.findByKode('SH0001'));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [fullQrPayload, setFullQrPayload] = useState<string>('');

  const [estL, setEstL] = useState(1);
  const [estP, setEstP] = useState(1);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [estimasiSaved, setEstimasiSaved] = useState(false);
  const [kuotaTambahanBuka, setKuotaTambahanBuka] = useState(false);
  const [isDenahOpen, setIsDenahOpen] = useState(false);

  useEffect(() => {
    setKuotaTambahanBuka(store.isKuotaTambahanBuka());
    const handleSync = () => {
      setKuotaTambahanBuka(store.isKuotaTambahanBuka());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('kuota_tambahan_toggle', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('kuota_tambahan_toggle', handleSync);
    };
  }, []);

  useEffect(() => {
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
        // Default awal: 1 Laki-laki dan sisa untuk Perempuan (maks totalK)
        setEstL(Math.min(1, totalK));
        setEstP(Math.max(0, Math.min(1, totalK - 1)));
      }

      formatQrPayload(found.kuota.kodeQr).then((payload) => {
        setFullQrPayload(payload);
        QRCode.toDataURL(payload, {
          width: 380,
          margin: 2,
          color: {
            dark: '#422F21',
            light: '#FAF7F3',
          },
        }).then(setQrDataUrl);
      });
    }
  }, [kodeSH]);

  const handleSimpanEstimasi = () => {
    if (!item) return;
    const res = store.simpanEstimasi(item.kuota.id, estL, estP, 'WALI_MANDIRI');
    if (res.ok && res.estimasi) {
      setLastSavedTime(res.estimasi.diisiAt);
    }
    setEstimasiSaved(true);
    setTimeout(() => setEstimasiSaved(false), 4000);
  };

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#EFE8E1]">
        <div className="bg-[#FAF7F3] p-6 rounded-3xl shadow text-center max-w-sm border-2 border-[#D5C4B4]">
          <Info className="w-8 h-8 text-[#8C6A47] mx-auto mb-2" />
          <h2 className="font-bold text-[#422F21]">Undangan Tidak Ditemukan</h2>
        </div>
      </div>
    );
  }

  const santri = item.santri;
  const kuota = item.kuota;
  const totalKuota = kuota.kuotaDasar + kuota.kuotaTambahan;

  return (
    <div className="min-h-screen bg-[#EFE8E1] py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header Resmi: Warm Latte & Cinnamon Mocha Aesthetic dengan Ornamen Tradisional */}
        {/* Warna Dasar: Warm Oat Cream #EFE8E1 · Aksen: Cinnamon Mocha #8C6A47 · Ambience: Golden Caramel Crema #D49B5B */}
        <div className="bg-gradient-to-b from-[#FAF7F3] via-[#EFE8E1] to-[#E5DCD2] rounded-3xl p-6 sm:p-8 text-[#422F21] text-center shadow-xl border-2 border-[#8C6A47]/40 relative overflow-hidden">
          {/* 4 Sudut Ornamen Tradisional Fretwork */}
          <div className="absolute top-2.5 left-2.5 z-10 opacity-70">
            <TraditionalCorner position="top-left" className="w-8 h-8" />
          </div>
          <div className="absolute top-2.5 right-2.5 z-10 opacity-70">
            <TraditionalCorner position="top-right" className="w-8 h-8" />
          </div>
          <div className="absolute bottom-2.5 left-2.5 z-10 opacity-70">
            <TraditionalCorner position="bottom-left" className="w-8 h-8" />
          </div>
          <div className="absolute bottom-2.5 right-2.5 z-10 opacity-70">
            <TraditionalCorner position="bottom-right" className="w-8 h-8" />
          </div>

          {/* Ornamen Plakat Begonia Tradisional */}
          <div className="flex justify-center mb-3">
            <BegoniaCartouche
              title="UNDANGAN RESMI WALI SANTRI"
              subtitle="Pondok Pesantren Putri Tahfizhil Qur-an & Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at Lirboyo"
              className="w-full max-w-sm sm:max-w-md"
            />
          </div>

          {/* Logo Kembar P3TQ & MHMTQ */}
          <div className="flex justify-center items-center space-x-3 mb-3">
            <div className="w-14 h-14 p-1 rounded-full bg-white border-2 border-[#8C6A47] shadow-sm">
              <img src="/images/logo-p3tq.png" alt="P3TQ" className="w-full h-full object-contain" />
            </div>
            <div className="w-14 h-14 p-1 rounded-full bg-white border-2 border-[#8C6A47] shadow-sm">
              <img src="/images/logo-mhmtq.png" alt="MHMTQ" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Kaligrafi Haul Haflah Emas */}
          <div className="my-2 flex justify-center">
            <img
              src="/images/logo-haul-gold.png"
              alt="Kaligrafi Haul Haflah"
              className="h-12 sm:h-14 object-contain drop-shadow-[0_4px_8px_rgba(212,155,91,0.55)]"
            />
          </div>

          <div className="text-[11px] font-serif font-black text-[#8C6A47] tracking-widest uppercase">
            UNDANGAN RESMI WALI SANTRI
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-black mt-1 tracking-tight text-[#422F21]">
            HAUL & HAFLAH P3TQ DAN MHMTQ 1448 H./ 2027 M.
          </h1>
          <p className="text-xs text-[#7A624E] mt-1 font-medium">
            Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) & Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at (MHMTQ) Lirboyo Kediri
          </p>
          <div className="mt-1.5 text-[11px] text-[#8C6A47] flex items-center justify-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#D49B5B] shrink-0" />
            <span>Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kabupaten Kediri, Jawa Timur 64117</span>
          </div>

          <div className="mt-4 pt-4 border-t-2 border-[#8C6A47]/25 flex justify-center items-center gap-4 text-xs text-[#5C3E28]">
            <span className="flex items-center gap-1 font-bold">
              <Calendar className="w-3.5 h-3.5 text-[#D49B5B]" />
              Sabtu, 02 Januari 2027
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 font-bold">
              <Clock className="w-3.5 h-3.5 text-[#D49B5B]" />
              06.30 WIB - Selesai
            </span>
          </div>
        </div>

        {/* BAGIAN 1: DETAIL SOHIBUL HAJAT (§7.2) */}
        <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] space-y-4">
          <div className="text-center pb-4 border-b border-[#D5C4B4]/50">
            <div className="text-xs text-[#8C6A47] font-bold uppercase tracking-wider">
              SOHIBUL HAJAT / SANTRI:
            </div>
            <h2 className="text-2xl font-serif font-black text-[#422F21] mt-1">
              {santri?.nama}
            </h2>
            <div className="inline-block mt-2 px-3.5 py-1 rounded-full bg-[#EFE8E1] text-[#422F21] font-bold text-xs border border-[#D5C4B4]">
              {santri?.subKategori} {santri?.kamar ? `· Kamar: ${santri.kamar}` : ''}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#EFE8E1]/60 border border-[#D5C4B4]">
              <div className="text-[#7A624E] font-medium">Nama Wali Santri</div>
              <div className="font-bold text-[#422F21] mt-0.5">{item.entitas.namaWali}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#EFE8E1]/60 border border-[#D5C4B4]">
              <div className="text-[#7A624E] font-medium">Jatah Kuota Masuk</div>
              <div className="font-bold text-[#8C6A47] mt-0.5">
                {totalKuota} Kursi {kuota.kuotaTambahan > 0 && `(+${kuota.kuotaTambahan} Beli)`}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FCF3E4] border border-[#D49B5B]/50 text-xs text-[#543C28] flex items-start space-x-2.5">
            <MapPin className="w-4 h-4 text-[#D49B5B] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lokasi Acara & Gerbang Masuk:</span>
              <p className="mt-0.5 text-[#7A4D15]">
                Aula Muktamar Pondok Pesantren Lirboyo Kediri. Seluruh tamu masuk melalui{' '}
                <strong>Gerbang Selatan (Bola Dunia)</strong>.
              </p>
            </div>
          </div>

          {/* PESAN / TOMBOL BELI KUOTA TAMBAHAN (Hanya muncul jika panitia sudah meng-ON-kan tombol switch) */}
          {kuotaTambahanBuka && (
            <Link
              href={`/beli/${token}`}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-black text-xs shadow-md shadow-[#8C6A47]/25 flex items-center justify-between border border-[#735334] animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-white" />
                <span>Ingin menambah kuota untuk kerabat? Beli Kuota Tambahan</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* BAGIAN 3: KODE QR STATIS (§7.2 & §4) */}
        <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] text-center space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-[#EFE8E1] text-[#422F21] text-[11px] font-bold border border-[#D5C4B4]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8C6A47]" />
              <span>QR RESMI MULTI-PAKAI STATIS</span>
            </div>
            <h3 className="text-lg font-serif font-black text-[#422F21]">
              Tunjukkan QR Ini di Gerbang Masuk
            </h3>
            <p className="text-xs text-[#7A624E] max-w-sm mx-auto font-normal">
              QR ini statis dan aman disimpan ke galeri ponsel Anda. Boleh di-screenshot dan digunakan berulang kali untuk rombongan yang datang bertahap sampai kuota habis.
            </p>
          </div>

          <div className="p-4 bg-[#EFE8E1] rounded-3xl border-2 border-[#8C6A47]/30 inline-block shadow-inner">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code Undangan" className="w-64 h-64 mx-auto rounded-2xl border border-[#D5C4B4]" />
            ) : (
              <div className="w-64 h-64 bg-[#EFE8E1] animate-pulse rounded-2xl flex items-center justify-center text-xs text-[#7A624E]">
                Membuat Kode QR...
              </div>
            )}
            <div className="mt-2 font-mono text-xs font-bold text-[#422F21] tracking-wider">
              {fullQrPayload || kuota.kodeQr}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5">
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`QR_Undangan_${santri?.nama?.replace(/\s+/g, '_')}_${kuota.kodeQr}.png`}
                className="px-4 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white font-bold text-xs flex items-center space-x-2 shadow-md border border-[#735334] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan Gambar QR</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setIsDenahOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#5C3E28] font-bold text-xs flex items-center space-x-2 shadow-xs border border-[#D5C4B4] transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#8C6A47]" />
              <span>Lihat Denah &amp; Posisi Duduk</span>
            </button>
          </div>
        </div>

        {/* BAGIAN 2: ESTIMASI KEHADIRAN (§7.2 & §8) */}
        <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] space-y-4">
          <div>
            <div className="text-xs text-[#8C6A47] font-bold uppercase tracking-wider">
              BANTU PANITIA MENYIAPKAN KURSI & KONSUMSI
            </div>
            <h3 className="text-base font-serif font-black text-[#422F21] mt-0.5">
              Konfirmasi Perkiraan Kehadiran
            </h3>
            <p className="text-xs text-[#7A624E] mt-0.5 font-normal">
              Zona duduk laki-laki dan perempuan dipisah. Mohon isi perkiraan rombongan yang akan hadir:
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#EFE8E1]/60 border border-[#D5C4B4]">
              <div>
                <div className="text-xs font-bold text-[#422F21]">Wali Santri Laki-laki</div>
                <div className="text-[10px] text-[#7A624E]">Zona Duduk Sayap Barat</div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  disabled={estL <= 0}
                  onClick={() => setEstL(Math.max(0, estL - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-[#D5C4B4] font-bold text-[#422F21] hover:bg-[#FAF7F3] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  −
                </button>
                <span className="w-6 text-center font-black text-[#422F21] text-base">{estL}</span>
                <button
                  type="button"
                  disabled={estL + estP >= totalKuota}
                  onClick={() => {
                    if (estL + estP < totalKuota) setEstL(estL + 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-[#D5C4B4] font-bold text-[#422F21] hover:bg-[#FAF7F3] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#EFE8E1]/60 border border-[#D5C4B4]">
              <div>
                <div className="text-xs font-bold text-[#422F21]">Wali Santri Perempuan</div>
                <div className="text-[10px] text-[#7A624E]">Zona Duduk Sayap Timur</div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  disabled={estP <= 0}
                  onClick={() => setEstP(Math.max(0, estP - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-[#D5C4B4] font-bold text-[#422F21] hover:bg-[#FAF7F3] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  −
                </button>
                <span className="w-6 text-center font-black text-[#422F21] text-base">{estP}</span>
                <button
                  type="button"
                  disabled={estL + estP >= totalKuota}
                  onClick={() => {
                    if (estL + estP < totalKuota) setEstP(estP + 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-[#D5C4B4] font-bold text-[#422F21] hover:bg-[#FAF7F3] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-[#D5C4B4]/70 text-xs font-bold text-[#7A624E]">
              <span>Total Estimasi Rombongan:</span>
              <span className="text-[#8C6A47] font-black text-sm">
                {estL + estP} / {totalKuota} Kursi
              </span>
            </div>

            {estL + estP >= totalKuota && (
              <div className="text-[11px] text-amber-900 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 font-medium text-center">
                🔒 Kuota maksimal ({totalKuota} orang) telah terisi penuh.
              </div>
            )}

            <button
              type="button"
              onClick={handleSimpanEstimasi}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-black text-xs shadow-md border-2 border-white transition-all uppercase tracking-wider"
            >
              {lastSavedTime ? '[ PERBARUI KONFIRMASI ]' : '[ SIMPAN KONFIRMASI ]'}
            </button>

            {estimasiSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs border border-emerald-300 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Konfirmasi Kehadiran Berhasil Disimpan & Diperbarui!</div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Data kehadiran ({estL} Laki-laki + {estP} Perempuan) telah diperbarui di sistem panitia. Anda dapat mengisi ulang sewaktu-waktu.
                  </div>
                </div>
              </div>
            )}

            {lastSavedTime && !estimasiSaved && (
              <div className="text-center text-[11px] text-[#7A624E]">
                Terakhir dikonfirmasi: <span className="font-semibold text-[#422F21]">{new Date(lastSavedTime).toLocaleString('id-ID')}</span>
              </div>
            )}

            {/* Tombol Hubungi Panitia via WhatsApp */}
            <div className="pt-3 border-t border-[#D5C4B4]/60">
              <a
                href="https://wa.me/6285181805377?text=Us%20Mau%20Tanya."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 group tracking-wide uppercase"
                title="Hubungi Panitia via WhatsApp (Us Mau Tanya)"
              >
                <MessageCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>Hubungi Panitia via WhatsApp (Us Mau Tanya.)</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Denah Interaktif */}
      <DenahModal
        isOpen={isDenahOpen}
        onClose={() => setIsDenahOpen(false)}
        initialLocationId={
          santri?.kategoriUtama === 'BIL_GHOIB'
            ? 'bil_ghoib'
            : santri?.kategoriUtama === 'BIN_NADZOR'
            ? 'bin_nadzori'
            : santri?.kategoriUtama === 'TAMATAN'
            ? 'tamatan'
            : 'gerbang_bola_dunia'
        }
      />
    </div>
  );
}
