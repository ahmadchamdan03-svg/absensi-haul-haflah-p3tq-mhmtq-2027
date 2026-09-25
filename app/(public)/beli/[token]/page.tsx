'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  CreditCard,
  Clock,
  Upload,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
  Info,
  RotateCcw,
  Camera,
  Image as ImageIcon,
  X,
  Eye,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { store } from '@/lib/mock-data';

export default function BeliKuotaPage() {
  const params = useParams();
  const token = (params?.token as string) || '';
  const kodeSH = token.split('-')[0] || 'SH0042';

  const [item, setItem] = useState<any>(() => store.findByKode(kodeSH) || store.findByKode('SH0042'));
  const [paguInfo, setPaguInfo] = useState(store.getPaguInfo());
  const [jumlahBeli, setJumlahBeli] = useState(1);
  const [orderAktif, setOrderAktif] = useState<any>(null);

  // State Unggah Foto Bukti Transfer (Langsung Foto/Gambar, Bukan URL)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ tipe: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const syncData = () => {
      store.evaluasiBatasWaktu();
      const found = store.findByKode(kodeSH) || store.findByKode('SH0042');
      if (found) {
        setItem(found);
        // Cek pesanan berjalan
        const orders = store.getPembelianList().filter((p) => p.keluargaId === found.entitas.id);
        if (orders.length > 0) {
          setOrderAktif(orders[0]);
        }
      }
      setPaguInfo(store.getPaguInfo());
    };

    syncData();
    const interval = setInterval(syncData, 15000);
    return () => clearInterval(interval);
  }, [kodeSH]);

  const handlePesan = async () => {
    if (!item) return;
    setStatusMsg(null);

    const res = store.pesanKuota(item.entitas.id, jumlahBeli);
    if (!res.ok) {
      setStatusMsg({ tipe: 'error', text: res.pesan || 'Gagal memesan kuota' });
      return;
    }

    setPaguInfo(store.getPaguInfo());
    const orders = store.getPembelianList().filter((p) => p.keluargaId === item.entitas.id);
    const currentOrder = orders[0];
    setOrderAktif(currentOrder);
    setStatusMsg({
      tipe: 'success',
      text: 'Kuota berhasil dikunci selama 6 jam! Silakan lakukan transfer sebelum tenggat waktu berakhir.',
    });

    // Kirim notifikasi WhatsApp otomatis ke Panitia agar segera ditanggapi (§6)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://haflah.p3tq.id';
      const santri = item.santri || item.entitas.santri?.[0];
      const namaSantri = santri?.nama || 'Santri';
      const kategori = santri?.kategoriUtama || '-';
      const kelas = santri?.kelas || '-';
      const namaWali = item.entitas.namaWali || 'Wali Santri';
      const noHpWali = item.entitas.noHp || '-';
      const totalBayarFormatted = (jumlahBeli * 80000).toLocaleString('id-ID');
      const orderId = currentOrder?.id || res.id;

      const pesanPanitia = `🔔 *NOTIFIKASI PESANAN KUOTA TAMBAHAN BARU*\n*Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*\n\n` +
        `Yth. Panitia / Bendahara Haul & Haflah,\n` +
        `Telah masuk pesanan kuota tambahan baru dari wali santri dan membutuhkan tanggapan segera:\n\n` +
        `👤 *Wali Santri*: ${namaWali}\n` +
        `📱 *No. HP Wali*: ${noHpWali}\n` +
        `🧕 *Santri*: ${namaSantri}\n` +
        `📚 *Kategori*: ${kategori} (${kelas})\n` +
        `🎫 *Jumlah Pesanan*: ${jumlahBeli} Kursi Tambahan\n` +
        `💰 *Total Tagihan*: Rp ${totalBayarFormatted}\n` +
        `🆔 *ID Pesanan*: ${orderId}\n` +
        `⏰ *Waktu*: ${new Date().toLocaleString('id-ID')}\n\n` +
        `📌 *Aksi Diperlukan*: Mohon panitia segera mengecek mutasi dan menanggapi/memverifikasi pesanan ini pada Panel Admin:\n` +
        `🔗 ${origin}/admin/verifikasi\n\n` +
        `_Sistem Otomatis Panitia Haul & Haflah P3TQ - MHMTQ_`;

      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: '085181805377',
          message: pesanPanitia,
        }),
      });

      // Jika nomor HP wali tersedia, kirim instruksi transfer ke WhatsApp wali
      if (noHpWali && noHpWali !== '-' && noHpWali.length >= 9) {
        const pesanWali = `*INTRUKSI PEMBAYARAN KUOTA TAMBAHAN*\n*Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*\n\n` +
          `Assalamu'alaikum Wr. Wb. Yth. Bapak/Ibu *${namaWali}*,\n` +
          `Pesanan kuota tambahan sebanyak *${jumlahBeli} kursi* untuk ananda *${namaSantri}* telah berhasil dikunci sementara.\n\n` +
          `💰 *Total Tagihan*: Rp ${totalBayarFormatted}\n` +
          `💳 *Transfer ke*: Bank BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin\n` +
          `⏱️ *Batas Waktu Transfer*: 6 Jam dari sekarang\n\n` +
          `Setelah transfer, mohon upload bukti transfer melalui link berikut:\n` +
          `🔗 ${origin}/beli/${token}\n\n` +
          `_Wassalamu'alaikum Wr. Wb._\n*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*`;

        await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: noHpWali,
            message: pesanWali,
          }),
        });
      }
    } catch (err) {
      console.error('Gagal kirim notifikasi WhatsApp:', err);
    }
  };

  // Handler saat wali santri memilih file foto atau mengambil dari kamera
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file berupa gambar/foto (JPG, PNG, WEBP)!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar! Maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage(result);
      setSelectedFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadBukti = async () => {
    if (!orderAktif) return;
    
    if (!selectedImage && !orderAktif.buktiUrl) {
      alert('Silakan pilih atau ambil foto bukti transfer terlebih dahulu!');
      return;
    }

    const finalImage = selectedImage || orderAktif.buktiUrl;
    setIsUploading(true);

    try {
      store.uploadBuktiBayar(orderAktif.id, finalImage);
      setOrderAktif({ ...orderAktif, buktiUrl: finalImage, status: 'MENUNGGU_VERIFIKASI' });
      setStatusMsg({
        tipe: 'success',
        text: 'Foto bukti transfer berhasil diunggah! Panitia akan segera mencocokkan mutasi rekening.',
      });
      setIsUploading(false);

      // Kirim notifikasi WA ke Panitia bahwa bukti transfer telah dilampirkan
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://haflah.p3tq.id';
      const santri = item.santri || item.entitas.santri?.[0];
      const namaSantri = santri?.nama || 'Santri';
      const namaWali = item.entitas.namaWali || 'Wali Santri';

      const pesanBukti = `📸 *BUKTI PEMBAYARAN TELAH DIUNGGAH*\n*Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*\n\n` +
        `Wali santri *${namaWali}* (Santri: *${namaSantri}*) telah mengunggah foto bukti transfer untuk pesanan *${orderAktif.id}* (${orderAktif.jumlah} Kursi - Rp ${orderAktif.totalBayar.toLocaleString('id-ID')}).\n\n` +
        `Mohon panitia segera mencocokkan mutasi rekening BRI dan melakukan verifikasi di:\n` +
        `🔗 ${origin}/admin/verifikasi\n\n` +
        `_Sistem Otomatis Panitia Haul & Haflah P3TQ - MHMTQ_`;

      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: '085181805377',
          message: pesanBukti,
        }),
      });
    } catch (err) {
      console.error('Gagal kirim notif upload bukti:', err);
      setIsUploading(false);
    }
  };

  const handleBatalkanRefund = () => {
    if (!orderAktif) return;
    if (!confirm('Apakah Anda yakin ingin membatalkan pembelian ini? Kuota akan dilepas kembali dan dana akan dikembalikan penuh.')) {
      return;
    }
    const res = store.batalkanPembelian(orderAktif.id, 'TRANSFER');
    if (res.ok) {
      setOrderAktif({ ...orderAktif, status: 'DIBATALKAN_REFUND' });
      setPaguInfo(store.getPaguInfo());
      setStatusMsg({
        tipe: 'success',
        text: 'Pembelian berhasil dibatalkan. Panitia akan mengembalikan dana ke rekening pengirim.',
      });
    }
  };

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#EFE8E1]">
        <div className="bg-[#FAF7F3] p-6 rounded-2xl shadow text-center max-w-sm border-2 border-[#D5C4B4]">
          <Info className="w-8 h-8 text-[#8C6A47] mx-auto mb-2" />
          <h2 className="font-bold text-[#422F21]">Data Tidak Ditemukan</h2>
        </div>
      </div>
    );
  }

  const hargaTotal = jumlahBeli * paguInfo.hargaPerUnit;

  return (
    <div className="min-h-screen bg-[#EFE8E1] py-6 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Tombol Kembali ke Undangan */}
        <Link
          href={`/u/${token}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#5C3E28] hover:text-[#8C6A47] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#8C6A47]" />
          <span>Kembali ke Undangan & QR Code</span>
        </Link>

        {/* Header Pembelian Kuota */}
        <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] border border-[#D5C4B4] flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5 text-[#8C6A47]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#422F21]">Pembelian Kuota Tambahan</h1>
              <p className="text-xs text-[#7A624E]">
                Untuk keluarga wisudawati <strong>{item.santri?.nama}</strong>
              </p>
            </div>
          </div>

          {/* Indikator Sisa Pagu Global (§6) */}
          <div className="p-4 rounded-2xl bg-[#FCF3E4] border border-[#D49B5B]/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-[#8C6A47] uppercase tracking-wider">
                SISA KUOTA GLOBAL SAAT INI:
              </div>
              <div className="text-2xl font-black text-[#422F21] mt-0.5">
                {paguInfo.sisa} <span className="text-xs font-normal text-[#7A624E]">dari {paguInfo.paguTotal} unit</span>
              </div>
            </div>
            <div className="text-right text-xs text-[#8C6A47]">
              <span className="inline-block px-3 py-1 rounded-full bg-[#FAF7F3] font-bold text-[11px] border border-[#D49B5B]/50">
                Rp 80.000 / orang
              </span>
            </div>
          </div>
        </div>

        {/* Alert Pesan Sukses / Error */}
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center space-x-2.5 ${
              statusMsg.tipe === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMsg.tipe === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{statusMsg.text}</span>
          </div>
        )}

        {/* JIKA PEMBELIAN KUOTA SEDANG DITUTUP OLEH PANITIA (SWITCH OFF) */}
        {!paguInfo.bisaBeli && !orderAktif && (
          <div className="bg-[#FAF7F3] rounded-3xl p-8 shadow-sm border-2 border-[#D5C4B4] text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-serif font-black text-[#422F21]">
                Pembelian Kuota Tambahan Sedang Ditutup
              </h2>
              <p className="text-xs text-[#7A624E] max-w-md mx-auto leading-relaxed">
                Mohon maaf, saat ini panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. belum membuka atau sedang menutup penjualan kuota tambahan. Silakan hubungi panitia atau pantau kembali halaman undangan Anda secara berkala.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href={`/u/${token}`}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white font-bold text-xs shadow-md transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Undangan & QR Code</span>
              </Link>
            </div>
          </div>
        )}

        {/* JIKA KUOTA HABIS TOTAL (§6.3) */}
        {paguInfo.bisaBeli && paguInfo.sisa <= 0 && !orderAktif && (
          <div className="bg-[#FAF7F3] rounded-3xl p-8 shadow-sm border-2 border-[#D5C4B4] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#422F21]">Kuota Tambahan Telah Habis</h2>
            <p className="text-xs text-[#7A624E] max-w-sm mx-auto">
              Seluruh pagu 300 kuota tambahan telah terjual habis demi menjaga kapasitas dan kenyamanan ruang aula.
            </p>
          </div>
        )}

        {/* JIKA BELUM ADA PESANAN & KUOTA TERSEDIA */}
        {paguInfo.bisaBeli && paguInfo.sisa > 0 && (!orderAktif || orderAktif.status === 'DIBATALKAN_REFUND') && (
          <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] space-y-5">
            <div className="space-y-1">
              <h2 className="font-bold text-[#422F21] text-sm">Pilih Jumlah Kuota yang Ingin Dibeli</h2>
              <p className="text-xs text-[#7A624E]">
                Setiap 1 kuota bernilai 1 kursi tambahan & porsi konsumsi, langsung ditambahkan ke QR yang sudah Anda miliki.
              </p>
            </div>

            {/* Stepper Jumlah */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#EFE8E1]/70 border border-[#D5C4B4]">
              <span className="text-sm font-bold text-[#422F21]">Jumlah Kuota:</span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setJumlahBeli(Math.max(1, jumlahBeli - 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-[#D5C4B4] font-bold text-[#422F21] hover:bg-[#FAF7F3]"
                >
                  −
                </button>
                <span className="w-8 text-center font-black text-xl text-[#422F21]">{jumlahBeli}</span>
                <button
                  type="button"
                  onClick={() => setJumlahBeli(Math.min(paguInfo.sisa, jumlahBeli + 1))}
                  className="w-10 h-10 rounded-xl bg-[#8C6A47] text-white font-black text-lg hover:bg-[#735334] border border-[#735334]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total Pembayaran */}
            <div className="p-4 rounded-2xl bg-[#8C6A47] text-white flex items-center justify-between border border-[#735334]">
              <div>
                <div className="text-xs text-[#FAF7F3]/80">Total Biaya Transfer:</div>
                <div className="text-2xl font-black text-[#D49B5B] mt-0.5">
                  Rp {hargaTotal.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="text-right text-xs text-[#FAF7F3]">
                {jumlahBeli} Tiket @ Rp 80.000
              </div>
            </div>

            {/* Peringatan Kunci Kuota 6 Jam (§6.2) */}
            <div className="p-3.5 rounded-2xl bg-[#FCF3E4] border border-[#D49B5B]/50 text-xs text-[#543C28] flex items-start space-x-2">
              <Clock className="w-4 h-4 text-[#D49B5B] shrink-0 mt-0.5" />
              <span>
                Saat Anda menekan <strong>Pesan Sekarang</strong>, kuota langsung dikunci khusus untuk Anda selama{' '}
                <strong>6 jam</strong>.
              </span>
            </div>

            <button
              onClick={handlePesan}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-black text-sm shadow-lg shadow-[#8C6A47]/25 transition-all border border-[#FAF7F3]"
            >
              [ PESAN SEKARANG (KUNCI 6 JAM) ]
            </button>
          </div>
        )}

        {/* STATUS PESANAN AKTIF (§6.1 & ALUR 6-6-12 JAM) */}
        {orderAktif && orderAktif.status !== 'DIBATALKAN_REFUND' && (
          <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5C4B4]/50">
              <div>
                <span className="text-xs font-bold text-[#7A624E] uppercase">STATUS PEMESANAN:</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {orderAktif.status === 'DIPESAN' && (
                    <span className="px-3 py-1 rounded-full bg-[#FCF3E4] text-[#8C6A47] font-bold text-xs border border-[#D49B5B]/50 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D49B5B] animate-pulse" />
                      <span>Pesanan Terkunci — Menunggu Transfer & Upload Bukti</span>
                    </span>
                  )}
                  {orderAktif.status === 'MENUNGGU_VERIFIKASI' && (
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 font-bold text-xs border border-amber-300 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                      <span>Bukti Terkirim — Menunggu Verifikasi Panitia (SLA 6 Jam)</span>
                    </span>
                  )}
                  {orderAktif.status === 'DIVERIFIKASI' && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        ✓ Pembayaran Berhasil — Kuota Aktif (+{orderAktif.jumlah} Kursi)
                      </span>
                    </span>
                  )}
                  {orderAktif.autoApprovedBySystem && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-300">
                      Otomatis Berhasil (Garansi 12 Jam)
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#7A624E]">Total Tagihan:</div>
                <div className="text-base font-black text-[#422F21]">
                  Rp {orderAktif.totalBayar.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Kotak Informasi Khusus Alur 6-6-12 Jam */}
            {orderAktif.status === 'DIPESAN' && (
              <div className="p-3.5 rounded-2xl bg-[#FCF3E4] border border-[#D49B5B]/60 text-xs text-[#543C28] space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-[#8C6A47]">
                  <Clock className="w-4 h-4 text-[#D49B5B]" />
                  <span>Pesanan Kuota Dikunci Selama 6 Jam</span>
                </div>
                <p className="text-[11px] text-[#7A624E] leading-relaxed">
                  Kuota kursi aman terkunci khusus untuk Anda. Mohon segera transfer ke rekening panitia dan unggah foto bukti sebelum batas 6 jam berakhir agar pesanan tidak kedaluwarsa.
                </p>
              </div>
            )}

            {orderAktif.status === 'MENUNGGU_VERIFIKASI' && (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 text-xs text-[#543C28] space-y-1.5">
                <div className="font-bold flex items-center space-x-1.5 text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Tahap Verifikasi Panitia & Garansi Sistem 12 Jam</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Panitia akan memverifikasi mutasi bank dalam target waktu <strong>6 jam</strong>. Apabila panitia berhalangan atau belum sempat memverifikasi dalam waktu <strong>12 jam</strong>, maka sistem akan <strong>secara otomatis menyetujui pesanan Anda</strong> dan kuota tambahan langsung masuk ke kuota utama santri.
                </p>
              </div>
            )}

            {orderAktif.status === 'DIVERIFIKASI' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 space-y-2">
                <div className="font-bold flex items-center space-x-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Kuota Tambahan Telah Ditambahkan ke Kuota Utama</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Alhamdulillah, pesanan kuota tambahan sebanyak <strong>{orderAktif.jumlah} kursi</strong> telah aktif dan terhubung ke QR Code barcode ananda <strong>{item?.santri?.nama}</strong>. Saat hadir di gerbang haflah, panitia akan langsung memindai 1 QR Code yang sama untuk seluruh rombongan.
                </p>
                <div>
                  <Link
                    href={`/u/${token}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
                  >
                    <span>Buka Lembar Undangan & QR Code Utama</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Rincian Rekening Transfer (§6.4) */}
            <div className="p-4 rounded-2xl bg-[#EFE8E1]/60 border border-[#D5C4B4] space-y-2 text-xs">
              <div className="font-bold text-[#422F21] flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-[#8C6A47]" />
                <span>Rekening Tujuan Transfer Panitia:</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#D5C4B4] font-mono text-[#422F21] font-bold text-sm select-all">
                BRI 320701010266508
              </div>
              <div className="text-[#7A624E]">
                Atas Nama: <strong>Ahmad Chamdan Yuwafin (Bendahara Haflah)</strong>
              </div>
            </div>

            {/* Form Unggah Foto Bukti Transfer (Langsung Upload Foto, Bukan URL) */}
            {orderAktif.status === 'DIPESAN' && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-[#422F21]">
                  Unggah Foto Bukti Transfer (Screenshot M-Banking / Struk ATM):
                </label>

                {/* Input File Tersembunyi */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!selectedImage ? (
                  /* Area Pilih Foto / Jepret Kamera */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-[#D49B5B] hover:border-[#8C6A47] bg-[#FAF7F3] hover:bg-[#EFE8E1]/50 rounded-2xl p-6 text-center transition-all group"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-[#EFE8E1] group-hover:bg-white flex items-center justify-center text-[#8C6A47] shadow-sm transition-transform group-hover:scale-105">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="font-serif font-black text-sm text-[#422F21]">
                        Pilih Foto / Ambil Gambar Struk
                      </div>
                      <p className="text-xs text-[#7A624E] max-w-xs">
                        Klik di sini untuk membuka kamera atau memilih foto struk dari galeri HP Anda.
                      </p>
                      <div className="inline-flex items-center space-x-1 text-[10px] text-[#8C6A47] font-semibold bg-[#EFE8E1] px-2.5 py-1 rounded-full border border-[#D5C4B4]">
                        <span>Format: JPG, PNG, WEBP (Maksimal 10MB)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Pratinjau Foto yang Dipilih Sebelum Dikirim */
                  <div className="bg-white rounded-2xl border-2 border-[#8C6A47]/40 p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-[#D5C4B4]/50">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-[#8C6A47]" />
                        <span className="text-xs font-bold text-[#422F21] truncate max-w-[200px]">
                          {selectedFileName || 'Foto Bukti Dipilih'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setSelectedFileName('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>

                    <div className="relative rounded-xl overflow-hidden max-h-60 bg-[#EFE8E1] flex items-center justify-center border border-[#D5C4B4]">
                      <img
                        src={selectedImage}
                        alt="Pratinjau Bukti Transfer"
                        className="max-h-60 w-auto object-contain"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl border border-[#D5C4B4] bg-[#FAF7F3] hover:bg-[#EFE8E1] text-[#422F21] text-xs font-bold transition-colors"
                      >
                        Ganti Foto
                      </button>
                      <button
                        type="button"
                        onClick={handleUploadBukti}
                        disabled={isUploading}
                        className="flex-1 py-2.5 bg-[#8C6A47] hover:bg-[#735334] text-white rounded-xl font-black text-xs shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Mengunggah Foto...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-amber-200" />
                            <span>KIRIM FOTO BUKTI TRANSFER</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Simulasi Cepat (Pengujian) */}
                <div className="flex justify-between items-center text-[11px] text-[#7A624E] pt-1">
                  <span>*Bisa langsung jepret via kamera HP</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage('https://images.unsplash.com/photo-1554415707-9e49fe02020d?w=600&auto=format&fit=crop&q=60');
                      setSelectedFileName('struk-simulasi-bri.jpg');
                    }}
                    className="text-[#8C6A47] font-semibold underline hover:text-[#422F21]"
                  >
                    Gunakan Foto Struk Simulasi
                  </button>
                </div>
              </div>
            )}

            {/* Foto Bukti telah terlampir */}
            {orderAktif.buktiUrl && (
              <div className="p-4 bg-[#FAF7F3] rounded-2xl border-2 border-emerald-500/40 text-xs space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Foto Bukti Transfer Telah Terlampir</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFullImageModal(true)}
                    className="text-xs text-[#8C6A47] hover:text-[#422F21] font-bold underline flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Perbesar Foto</span>
                  </button>
                </div>

                <div
                  onClick={() => setShowFullImageModal(true)}
                  className="cursor-pointer group relative rounded-xl overflow-hidden max-h-48 bg-[#EFE8E1] flex items-center justify-center border border-[#D5C4B4]"
                >
                  <img
                    src={orderAktif.buktiUrl}
                    alt="Foto Bukti Transfer Terlampir"
                    className="max-h-48 w-full object-contain group-hover:scale-102 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                    Klik untuk memperbesar
                  </div>
                </div>

                {orderAktif.status === 'DIPESAN' && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#8C6A47] font-bold hover:underline"
                  >
                    Ingin mengganti foto bukti? Klik di sini
                  </button>
                )}

                {/* Tombol WhatsApp Hubungi Panitia setelah Berhasil Upload Bukti */}
                <div className="pt-2 border-t border-emerald-200">
                  <a
                    href="https://wa.me/6285181805377?text=Us%2C%20saya%20sudah%20transfer%2C%20mohon%20segera%20di%20konfirmasi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 group cursor-pointer"
                    title="Hubungi Panitia via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    <span>Hubungi Panitia: "Us, saya sudah transfer, mohon segera di konfirmasi"</span>
                  </a>
                </div>
              </div>
            )}

            {/* KEBIJAKAN PENGEMBALIAN DANA DUA TINGKAT (§6.5) */}
            <div className="pt-3 border-t border-[#D5C4B4]/50 space-y-2">
              <div className="text-[11px] font-bold text-[#7A624E] uppercase tracking-wide">
                Kebijakan Refund Dua Tingkat (§6.5):
              </div>
              <p className="text-xs text-[#7A624E] leading-relaxed">
                Jika membatalkan aktif sebelum hari-H lewat portal ini, dana dikembalikan penuh via transfer. Namun jika tidak hadir di hari-H tanpa konfirmasi, dana hangus otomatis bersama kuota.
              </p>

              {orderAktif.status !== 'DIBATALKAN_REFUND' && (
                <button
                  type="button"
                  onClick={handleBatalkanRefund}
                  className="mt-2 text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center space-x-1 underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Batalkan Pesanan Ini & Ajukan Pengembalian Dana</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Full Image Preview */}
        {showFullImageModal && orderAktif?.buktiUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setShowFullImageModal(false)}
          >
            <div
              className="relative max-w-2xl w-full bg-[#FAF7F3] rounded-3xl p-4 space-y-3 shadow-2xl border-2 border-[#8C6A47]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#D5C4B4]">
                <div className="font-serif font-black text-sm text-[#422F21]">
                  Foto Bukti Pembayaran Kuota Tambahan
                </div>
                <button
                  onClick={() => setShowFullImageModal(false)}
                  className="p-1 rounded-xl bg-white border border-[#D5C4B4] text-[#7A624E] hover:text-[#422F21]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/5 rounded-2xl p-2">
                <img
                  src={orderAktif.buktiUrl}
                  alt="Bukti Transfer Penuh"
                  className="max-h-[65vh] w-auto object-contain rounded-xl shadow"
                />
              </div>

              <div className="text-right">
                <button
                  onClick={() => setShowFullImageModal(false)}
                  className="px-4 py-2 bg-[#8C6A47] hover:bg-[#735334] text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tombol Hubungi Panitia via WhatsApp di Akhir Halaman Pemesanan */}
        <div className="pt-2 pb-6 text-center">
          <a
            href="https://wa.me/6285181805377?text=Us%20Mau%20Tanya."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 group tracking-wide uppercase cursor-pointer"
            title="Hubungi Panitia via WhatsApp (Us Mau Tanya)"
          >
            <MessageCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span>Hubungi Panitia via WhatsApp (Us Mau Tanya.)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
