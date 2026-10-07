'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Check,
  Sparkles,
  Edit3,
  UserCheck,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Ticket,
  X,
  RefreshCw,
  Phone,
  Building,
  MapPin,
  Save,
  Trash2,
  Info,
  UserPlus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import { getWarnaTiketUndangan, getDefaultJalurMasuk } from '@/lib/types';
import AuthGuard from '@/components/AuthGuard';

type GolonganUndangan = 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM';

export default function RekonPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [santriList, setSantriList] = useState<any[]>([]);
  const [tamuList, setTamuList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<{ tipe: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [savingWalkin, setSavingWalkin] = useState(false);

  // Walk-in Form State
  const [walkinForm, setWalkinForm] = useState({
    golongan: 'ISTIMEWA' as GolonganUndangan,
    nama: '',
    namaPutra: '',
    namaPutri: '',
    kategori: 'VVIP',
    instansi: '',
    alamat: '',
    noHp: '',
    kuotaDasar: 2,
    jalurMasuk: 'Jalur VIP',
    langsungCheckin: true,
  });

  // Fetch Live Data & Realtime Subscription
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resSantri, resTamu] = await Promise.all([
        supabase.from('peserta_santri').select('*').order('created_at', { ascending: false }),
        supabase.from('tamu_undangan').select('*').order('created_at', { ascending: false }),
      ]);

      if (resSantri.data) setSantriList(resSantri.data);
      if (resTamu.data) setTamuList(resTamu.data);
    } catch (e) {
      console.warn('Error fetching rekon data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('rekon_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_santri' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tamu_undangan' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presensi_log' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pembelian_kuota' }, fetchAllData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showToast = (text: string, tipe: 'success' | 'error' = 'success') => {
    setToastMsg({ tipe, text });
    setTimeout(() => setToastMsg(null), 6000);
  };

  // Filter Hasil Pencarian
  const searchResults = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return [];

    const santriFiltered = santriList
      .filter((s) => {
        return (
          (s.nama && s.nama.toLowerCase().includes(q)) ||
          (s.nama_wali && s.nama_wali.toLowerCase().includes(q)) ||
          (s.kode && s.kode.toLowerCase().includes(q)) ||
          (s.no_hp && s.no_hp.includes(q)) ||
          (s.alamat && s.alamat.toLowerCase().includes(q)) ||
          (s.sub_kategori && s.sub_kategori.toLowerCase().includes(q)) ||
          (s.kelas && s.kelas.toLowerCase().includes(q)) ||
          (s.kamar && s.kamar.toLowerCase().includes(q))
        );
      })
      .map((s) => ({ tipe: 'SANTRI', data: s }));

    const tamuFiltered = tamuList
      .filter((t) => {
        return (
          (t.nama && t.nama.toLowerCase().includes(q)) ||
          (t.nama_putra && t.nama_putra.toLowerCase().includes(q)) ||
          (t.nama_putri && t.nama_putri.toLowerCase().includes(q)) ||
          (t.kode && t.kode.toLowerCase().includes(q)) ||
          (t.no_hp && t.no_hp.includes(q)) ||
          (t.instansi && t.instansi.toLowerCase().includes(q)) ||
          (t.alamat && t.alamat.toLowerCase().includes(q)) ||
          (t.kategori && t.kategori.toLowerCase().includes(q))
        );
      })
      .map((t) => ({ tipe: 'UNDANGAN', data: t }));

    return [...santriFiltered, ...tamuFiltered];
  }, [keyword, santriList, tamuList]);

  // Quick Action: Tandai Hadir / Batalkan Hadir
  const handleToggleHadir = async (item: any) => {
    const isSantri = item.tipe === 'SANTRI';
    const d = item.data;
    const currentTerpakai = Number(d.kuota_terpakai || 0);
    const kBase = isSantri
      ? Number(d.kuota_dasar || 2)
      : ((d.nama_putra && String(d.nama_putra).trim() !== '') ? 1 : 0) +
        ((d.nama_putri && String(d.nama_putri).trim() !== '') ? 1 : 0);
    const kExtra = isSantri ? Number(d.kuota_tambahan || 0) : 0;
    const totalKuota = kBase + kExtra;

    const isHadir = currentTerpakai > 0;
    const targetTable = isSantri ? 'peserta_santri' : 'tamu_undangan';

    try {
      if (isHadir) {
        // Batalkan Hadir (Reset kuota_terpakai = 0)
        const { error } = await supabase
          .from(targetTable)
          .update({ kuota_terpakai: 0, updated_at: new Date().toISOString() })
          .eq('kode', d.kode);

        if (error) throw error;

        // Log audit BATALKAN_HADIR
        await logAudit({
          panitia_id: 'PANITIA_REKONSILIASI',
          panitia_role: 'PENERIMA_TAMU',
          aksi: 'BATALKAN_HADIR',
          tabel: targetTable,
          kode: d.kode,
          nama: d.nama || d.kode,
          field: 'kuota_terpakai',
          nilai_lama: String(currentTerpakai),
          nilai_baru: '0',
          catatan: 'Pembatalan Kehadiran via Meja Rekonsiliasi',
        });

        showToast(`✓ Berhasil membatalkan kehadiran untuk ${d.nama || d.kode}. (kuota_terpakai reset ke 0).`);
      } else {
        // Tandai Hadir (Set kuota_terpakai = 1)
        const newTerpakai = 1;
        const { error } = await supabase
          .from(targetTable)
          .update({ kuota_terpakai: newTerpakai, updated_at: new Date().toISOString() })
          .eq('kode', d.kode);

        if (error) throw error;

        // Insert presensi_log
        await supabase.from('presensi_log').insert([
          {
            kode_qr: d.kode,
            nama_peserta: d.nama,
            tipe_peserta: isSantri ? 'KELUARGA' : 'UNDANGAN',
            jalur: d.jalur_masuk || 'MEJA_REKONSILIASI',
            panitia_id: 'panitia-rekonsiliasi',
            jumlah_l: 1,
            jumlah_p: 0,
            jumlah_balita: 0,
            tiket_panggung: d.tiket_panggung_jatah || 0,
            catatan: 'Hadir via Meja Rekonsiliasi',
            created_at: new Date().toISOString(),
          },
        ]);

        // Log audit TANDAI_HADIR
        await logAudit({
          panitia_id: 'PANITIA_REKONSILIASI',
          panitia_role: 'PENERIMA_TAMU',
          aksi: 'TANDAI_HADIR',
          tabel: targetTable,
          kode: d.kode,
          nama: d.nama || d.kode,
          field: 'kuota_terpakai',
          nilai_lama: '0',
          nilai_baru: String(newTerpakai),
          catatan: 'Tandai Hadir Manual via Meja Rekonsiliasi',
        });

        showToast(`✓ Berhasil menandai HADIR untuk ${d.nama || d.kode} (1/${totalKuota} Kursi).`);
      }

      await fetchAllData();
    } catch (err: any) {
      console.error('Error toggling hadir:', err);
      showToast(`Gagal memperbarui status kehadiran: ${err.message || err}`, 'error');
    }
  };

  // Open Edit Modal (Edit Lengkap)
  const handleOpenEdit = (item: any) => {
    const isSantri = item.tipe === 'SANTRI';
    const d = item.data;

    setEditingItem({
      tipe: item.tipe,
      id: d.id,
      kode: d.kode,
      nama: d.nama || '',
      namaPutra: d.nama_putra || '',
      namaPutri: d.nama_putri || '',
      namaWali: d.nama_wali || '',
      noHp: d.no_hp || '',
      alamat: d.alamat || '',
      kelas: d.kelas || '',
      kamar: d.kamar || '',
      kategoriUtama: d.kategori_utama || 'BIL_GHOIB',
      subKategori: d.sub_kategori || '',
      kategori: d.kategori || 'Tamu Undangan',
      instansi: d.instansi || '',
      kuotaDasar: isSantri
        ? (d.kuota_dasar !== undefined && d.kuota_dasar !== null ? d.kuota_dasar : (d.kategori_utama === 'BIL_GHOIB' ? 4 : 2))
        : ((d.nama_putra && String(d.nama_putra).trim() !== '') ? 1 : 0) +
          ((d.nama_putri && String(d.nama_putri).trim() !== '') ? 1 : 0),
      kuotaTambahan: d.kuota_tambahan || 0,
      kuotaTerpakai: d.kuota_terpakai || 0,
      tiketPanggungJatah: d.tiket_panggung_jatah || 0,
      tiketPanggungDiberi: d.tiket_panggung_diberi || 0,
      kartuHitamGoldDiberi: Boolean(d.kartu_hitam_gold_diberi),
      warnaTiket: d.warna_tiket || (isSantri ? (d.kategori_utama === 'BIL_GHOIB' ? 'Hitam Gold' : 'Merah Gold') : 'Merah Gold'),
      statusKonfirmasi: d.status_konfirmasi || 'BELUM',
      perkiraanL: d.perkiraan_l || 0,
      perkiraanP: d.perkiraan_p || 0,
      statusWa: d.status_wa || 'BELUM',
      jalurMasuk: d.jalur_masuk || (isSantri ? 'Gerbang Selatan (Bola Dunia)' : 'Jalur VIP'),
      catatanKonfirmasi: d.catatan_konfirmasi || '',
    });
  };

  // Save Edit Lengkap to Supabase
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const confirmSave = confirm(
      `Anda akan mengubah data "${editingItem.nama || editingItem.kode}" (${editingItem.kode}).\nPerubahan langsung tersinkron ke seluruh sistem. Lanjutkan?`
    );
    if (!confirmSave) return;

    setSavingEdit(true);

    const isSantri = editingItem.tipe === 'SANTRI';
    const targetTable = isSantri ? 'peserta_santri' : 'tamu_undangan';

    try {
      // 1. Fetch data LAMA (before) dari Supabase sebelum update
      const { data: beforeData } = await supabase
        .from(targetTable)
        .select('*')
        .eq('kode', editingItem.kode)
        .single();

      let payload: any = {};

      if (isSantri) {
        payload = {
          nama: editingItem.nama.trim(),
          nama_wali: editingItem.namaWali.trim() || '-',
          no_hp: editingItem.noHp.trim() || '-',
          alamat: editingItem.alamat.trim() || 'Kediri',
          kelas: editingItem.kelas.trim() || '-',
          kamar: editingItem.kamar.trim() || '-',
          kategori_utama: editingItem.kategoriUtama,
          sub_kategori: editingItem.subKategori.trim() || 'Bil Ghoib',
          kuota_dasar: Math.max(0, Number(editingItem.kuotaDasar)),
          kuota_tambahan: Math.max(0, Number(editingItem.kuotaTambahan)),
          kuota_terpakai: Math.max(0, Number(editingItem.kuotaTerpakai)),
          tiket_panggung_jatah: Math.max(0, Number(editingItem.tiketPanggungJatah)),
          tiket_panggung_diberi: Math.max(0, Number(editingItem.tiketPanggungDiberi)),
          kartu_hitam_gold_diberi: editingItem.kartuHitamGoldDiberi,
          warna_tiket: editingItem.warnaTiket,
          status_konfirmasi: editingItem.statusKonfirmasi,
          perkiraan_l: Math.max(0, Number(editingItem.perkiraanL)),
          perkiraan_p: Math.max(0, Number(editingItem.perkiraanP)),
          status_wa: editingItem.statusWa,
          catatan_konfirmasi: editingItem.catatanKonfirmasi ? editingItem.catatanKonfirmasi.trim() : null,
          updated_at: new Date().toISOString(),
        };
      } else {
        payload = {
          nama: editingItem.nama.trim(),
          nama_putra: editingItem.namaPutra.trim() || null,
          nama_putri: editingItem.namaPutri.trim() || null,
          instansi: editingItem.instansi.trim() || '-',
          alamat: editingItem.alamat.trim() || '-',
          no_hp: editingItem.noHp.trim() || '-',
          kategori: editingItem.kategori.trim() || 'Tamu Undangan',
          sub_kategori: editingItem.subKategori || 'ISTIMEWA',
          kuota_terpakai: Math.max(0, Number(editingItem.kuotaTerpakai)),
          warna_tiket: editingItem.warnaTiket,
          jalur_masuk: editingItem.jalurMasuk.trim() || 'Jalur VIP',
          status_konfirmasi: editingItem.statusKonfirmasi,
          status_wa: editingItem.statusWa,
          catatan_konfirmasi: editingItem.catatanKonfirmasi ? editingItem.catatanKonfirmasi.trim() : null,
          updated_at: new Date().toISOString(),
        };
      }

      // 2. Perform update ke Supabase
      const { error } = await supabase
        .from(targetTable)
        .update(payload)
        .eq('kode', editingItem.kode);

      if (error) throw error;

      // 3. Bandingkan before vs payload untuk deteksi field yang berubah
      const changes: Record<string, { lama: any; baru: any }> = {};
      if (beforeData) {
        Object.keys(payload).forEach((key) => {
          if (key === 'updated_at') return;
          if (beforeData[key] !== payload[key]) {
            changes[key] = {
              lama: beforeData[key] ?? null,
              baru: payload[key] ?? null,
            };
          }
        });
      }

      // 4. Pengecekan Konsistensi kuota_terpakai vs presensi_log
      const { data: presensiLogs } = await supabase
        .from('presensi_log')
        .select('jumlah_l, jumlah_p')
        .eq('kode_qr', editingItem.kode);

      const presensiSum = (presensiLogs || []).reduce(
        (acc: number, curr: any) => acc + (Number(curr.jumlah_l || 0) + Number(curr.jumlah_p || 0)),
        0
      );

      if (payload.kuota_terpakai !== presensiSum && presensiLogs && presensiLogs.length > 0) {
        changes['presensi_sync_note'] = {
          lama: `Presensi Log (${presensiSum} orang)`,
          baru: `Manual Override (${payload.kuota_terpakai} kursi)`,
        };
      }

      // 5. Pengecekan Konsistensi kuota_tambahan vs pembelian_kuota
      const { data: pembelianList } = await supabase
        .from('pembelian_kuota')
        .select('jumlah_kursi')
        .eq('kode_santri', editingItem.kode)
        .eq('status', 'DIVERIFIKASI');

      const verifiedSum = (pembelianList || []).reduce(
        (acc: number, curr: any) => acc + Number(curr.jumlah_kursi || 0),
        0
      );

      if (payload.kuota_tambahan !== verifiedSum && pembelianList && pembelianList.length > 0) {
        changes['pembelian_sync_note'] = {
          lama: `Pembelian Verifikasi (${verifiedSum} kursi)`,
          baru: `Manual Adjustment (${payload.kuota_tambahan} kursi)`,
        };
      }

      // 6. Simpan ke Audit Log jika ada perubahan
      await logAudit({
        panitia_id: 'PANITIA_REKONSILIASI',
        panitia_role: 'PENERIMA_TAMU',
        aksi: isSantri ? 'EDIT_PESERTA' : 'EDIT_TAMU',
        tabel: targetTable,
        kode: editingItem.kode,
        nama: editingItem.nama,
        field: Object.keys(changes).length > 0 ? Object.keys(changes).join(', ') : 'edit_lengkap',
        nilai_lama: JSON.stringify(beforeData || {}),
        nilai_baru: JSON.stringify(payload),
        detail: Object.keys(changes).length > 0 ? changes : payload,
        catatan: editingItem.catatanKonfirmasi ? editingItem.catatanKonfirmasi.trim() : `Koreksi Data ${isSantri ? 'Santri' : 'Tamu'} via Meja Rekonsiliasi`,
      });

      showToast(`✓ Perubahan data "${editingItem.nama}" (${editingItem.kode}) berhasil disimpan & tersinkron ke seluruh sistem.`);
      setEditingItem(null);
      await fetchAllData();
    } catch (err: any) {
      console.error('Error saving edit:', err);
      showToast(`Gagal menyimpan perubahan: ${err.message || err}`, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Tamu Walk-in Baru
  const handleSaveWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWalkin(true);

    let finalNama = '';
    const p = walkinForm.namaPutra.trim().toUpperCase();
    const w = walkinForm.namaPutri.trim().toUpperCase();
    let kuotaBase = walkinForm.kuotaDasar;

    if (walkinForm.golongan === 'ISTIMEWA') {
      if (!p && !w) {
        showToast('Isi minimal salah satu: Nama Putra atau Nama Putri!', 'error');
        setSavingWalkin(false);
        return;
      }
      finalNama = p && w ? `${p} & ${w}` : p || w;
      kuotaBase = p && w ? 2 : 1;
    } else {
      if (!walkinForm.nama.trim()) {
        showToast('Nama Tamu Walk-in wajib diisi!', 'error');
        setSavingWalkin(false);
        return;
      }
      finalNama = walkinForm.nama.trim().toUpperCase();
    }

    const newKode = `UND-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const payload = {
        kode: newKode,
        nama: finalNama,
        nama_putra: p || null,
        nama_putri: w || null,
        instansi: walkinForm.instansi.trim() || walkinForm.alamat.trim() || '-',
        alamat: walkinForm.alamat.trim() || '-',
        kategori: walkinForm.kategori.trim() || 'Tamu Walk-in',
        sub_kategori: walkinForm.golongan,
        no_hp: walkinForm.noHp.trim() || '-',
        kuota_dasar: kuotaBase,
        kuota_tambahan: 0,
        kuota_terpakai: walkinForm.langsungCheckin ? 1 : 0,
        warna_tiket: getWarnaTiketUndangan(walkinForm.golongan, walkinForm.kategori),
        jalur_masuk: walkinForm.jalurMasuk.trim() || getDefaultJalurMasuk(walkinForm.golongan),
      };

      const { error } = await supabase.from('tamu_undangan').insert([payload]);
      if (error) throw error;

      if (walkinForm.langsungCheckin) {
        await supabase.from('presensi_log').insert([
          {
            kode_qr: newKode,
            nama_peserta: finalNama,
            tipe_peserta: 'UNDANGAN',
            jalur: walkinForm.jalurMasuk,
            panitia_id: 'panitia-rekonsiliasi',
            jumlah_l: 1,
            jumlah_p: 0,
            jumlah_balita: 0,
            catatan: 'Walk-in Langsung Hadir',
            created_at: new Date().toISOString(),
          },
        ]);
      }

      await logAudit({
        panitia_id: 'PANITIA_REKONSILIASI',
        panitia_role: 'PENERIMA_TAMU',
        aksi: 'TAMBAH_TAMU',
        tabel: 'tamu_undangan',
        kode: newKode,
        nama: finalNama,
        field: 'tamu_walkin_baru',
        nilai_baru: JSON.stringify(payload),
        detail: payload,
        catatan: `Registrasi Tamu Walk-in ${walkinForm.langsungCheckin ? '(Langsung Hadir)' : ''}`,
      });

      showToast(`✓ Berhasil mendaftarkan Tamu Walk-in: ${finalNama} (${newKode}) ${walkinForm.langsungCheckin ? '· Langsung Hadir' : ''}.`);
      setShowWalkinModal(false);
      setWalkinForm({
        golongan: 'ISTIMEWA',
        nama: '',
        namaPutra: '',
        namaPutri: '',
        kategori: 'VVIP',
        instansi: '',
        alamat: '',
        noHp: '',
        kuotaDasar: 2,
        jalurMasuk: 'Jalur VIP',
        langsungCheckin: true,
      });

      await fetchAllData();
    } catch (err: any) {
      console.error('Error adding walk-in:', err);
      showToast(`Gagal mendaftarkan walk-in: ${err.message || err}`, 'error');
    } finally {
      setSavingWalkin(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['ADMIN', 'PENJAGA_GERBANG']}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 text-[#422F21]">
        {/* HEADER & ACTION BUTTONS */}
        <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] border-2 border-[#8C6A47]/40 flex items-center justify-center font-bold shadow-xs shrink-0">
                <RotateCcw className="w-5 h-5 text-[#8C6A47]" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-black text-[#422F21]">
                  Meja Rekonsiliasi &amp; Kasus Khusus Gerbang
                </h1>
                <p className="text-xs text-[#7A624E]">
                  Gerbang Selatan (Sisi Dalam). Menangani tamu walk-in, barcode bermasalah, koreksi kuota, &amp; audit identitas.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowWalkinModal(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 text-emerald-200" />
                <span>+ Daftarkan Walk-in</span>
              </button>
              <button
                type="button"
                onClick={fetchAllData}
                className="p-2.5 rounded-2xl bg-white hover:bg-stone-100 text-[#8C6A47] border-2 border-[#D5C4B4] shadow-2xs flex items-center justify-center transition-all cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* TOAST / ALERT BOX NOTIFIKASI */}
          {toastMsg && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center space-x-2.5 shadow-xs transition-all animate-in fade-in ${
                toastMsg.tipe === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-2 border-rose-300'
              }`}
            >
              {toastMsg.tipe === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-bold leading-relaxed">{toastMsg.text}</span>
            </div>
          )}

          {/* SEARCH BAR PENCARIAN MASIF */}
          <div className="relative">
            <Search className="w-5 h-5 text-[#8C6A47] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari berdasarkan Nama Santri, Nama Wali, Tamu VIP, No. HP, atau Kode (SH0001 / UND0101)..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-[#D5C4B4] text-xs sm:text-sm focus:outline-none focus:border-[#8C6A47] font-semibold bg-white text-[#422F21] placeholder-[#7A624E]/70"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* LIST HASIL PENCARIAN */}
        {keyword.trim() !== '' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#7A624E]">
              <span>Hasil Pencarian ({searchResults.length} ditemukan):</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-stone-200 text-stone-500 text-xs">
                <p className="font-bold text-sm text-[#422F21]">Data tidak ditemukan</p>
                <p className="mt-1">
                  Tidak ada peserta / tamu yang cocok dengan kata kunci "{keyword}". Gunakan tombol "+ Daftarkan Walk-in" jika tamu hadir tanpa registrasi awal.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {searchResults.map((item: any) => {
                  const isSantri = item.tipe === 'SANTRI';
                  const d = item.data;
                  const currentTerpakai = Number(d.kuota_terpakai || 0);
                  const kBase = isSantri
                    ? Number(d.kuota_dasar || 2)
                    : ((d.nama_putra && String(d.nama_putra).trim() !== '') ? 1 : 0) +
                      ((d.nama_putri && String(d.nama_putri).trim() !== '') ? 1 : 0);
                  const kExtra = isSantri ? Number(d.kuota_tambahan || 0) : 0;
                  const totalKuota = kBase + kExtra;
                  const isHadir = currentTerpakai > 0;

                  return (
                    <div
                      key={d.id || d.kode}
                      className={`p-4 sm:p-5 rounded-3xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                        isHadir ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-[#E8DFD5]'
                      }`}
                    >
                      {/* INFORMASI UTAMA PESERTA */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-[#FAF0E6] text-[#422F21] border border-[#D5C4B4]">
                            {d.kode}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isSantri
                                ? 'bg-blue-100 text-blue-900 border-blue-200'
                                : 'bg-purple-100 text-purple-900 border-purple-200'
                            }`}
                          >
                            {isSantri ? 'PESERTA SANTRI' : 'TAMU UNDANGAN'}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              d.warna_tiket === 'Hitam Gold'
                                ? 'bg-stone-900 text-amber-300 border-stone-800'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            {d.warna_tiket || 'Merah Gold'}
                          </span>
                          {isHadir ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-950 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>HADIR ({currentTerpakai}/{totalKuota} Kursi)</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 text-stone-700 border border-stone-300">
                              BELUM (0/{totalKuota} Kursi)
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
                          {d.nama}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-stone-600">
                          {isSantri ? (
                            <>
                              <div>Wali: <strong>{d.nama_wali || '-'}</strong> ({d.no_hp || '-'})</div>
                              <div>Kategori: <strong>{d.sub_kategori || d.kategori_utama}</strong> (Kamar: {d.kamar || '-'})</div>
                            </>
                          ) : (
                            <>
                              <div>Instansi: <strong>{d.instansi || d.alamat || '-'}</strong> ({d.no_hp || '-'})</div>
                              <div>Golongan: <strong>{d.sub_kategori || 'ISTIMEWA'}</strong> ({d.kategori})</div>
                            </>
                          )}
                          <div>Alamat: <strong>{d.alamat || 'Kediri'}</strong></div>
                          <div>Jalur: <strong>{d.jalur_masuk || (isSantri ? 'Gerbang Selatan' : 'Jalur VIP')}</strong></div>
                        </div>
                      </div>

                      {/* BUTTON REKONSILIASI CEPAT & EDIT LENGKAP */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-stone-200 pt-3 md:pt-0 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleHadir(item)}
                          className={`w-full md:w-auto px-4 py-2 rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                            isHadir
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                              : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                          }`}
                        >
                          {isHadir ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                              <span>Batalkan HADIR</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-200" />
                              <span>Tandai HADIR</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="w-full md:w-auto px-4 py-2 rounded-2xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] border-2 border-[#D5C4B4] font-bold text-xs shadow-2xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#8C6A47]" />
                          <span>Edit Lengkap</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL EDIT LENGKAP (REKONSILIASI KOREKSI MASIF) */}
        {editingItem && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-[#E8DFD5] max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-[#FAF0E6] text-[#8C6A47] text-[10px] font-bold border border-[#D5C4B4]">
                    <Edit3 className="w-3.5 h-3.5 text-[#8C6A47]" />
                    <span>PANEL EDIT LENGKAP REKONSILIASI</span>
                  </div>
                  <h3 className="text-lg font-serif font-black text-[#422F21] mt-1">
                    Edit Data {editingItem.tipe === 'SANTRI' ? 'Peserta Santri' : 'Tamu Undangan'}: {editingItem.kode}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                {/* BLOK 1: IDENTITAS & KONTAK */}
                <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#D5C4B4] space-y-3">
                  <h4 className="font-serif font-black text-sm text-[#422F21]">1. Identitas &amp; Kontak Utama</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Nama Utama:</label>
                      <input
                        type="text"
                        value={editingItem.nama}
                        onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white font-semibold text-xs focus:ring-1 focus:ring-[#8C6A47]"
                        required
                      />
                    </div>

                    {editingItem.tipe === 'SANTRI' ? (
                      <div>
                        <label className="block font-bold text-[#422F21] mb-1">Nama Wali:</label>
                        <input
                          type="text"
                          value={editingItem.namaWali}
                          onChange={(e) => setEditingItem({ ...editingItem, namaWali: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs focus:ring-1 focus:ring-[#8C6A47]"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block font-bold text-[#422F21] mb-1">Instansi / Asal:</label>
                        <input
                          type="text"
                          value={editingItem.instansi}
                          onChange={(e) => setEditingItem({ ...editingItem, instansi: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs focus:ring-1 focus:ring-[#8C6A47]"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Nomor WhatsApp / HP:</label>
                      <input
                        type="text"
                        value={editingItem.noHp}
                        onChange={(e) => setEditingItem({ ...editingItem, noHp: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs focus:ring-1 focus:ring-[#8C6A47]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Alamat Domisili:</label>
                      <input
                        type="text"
                        value={editingItem.alamat}
                        onChange={(e) => setEditingItem({ ...editingItem, alamat: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs focus:ring-1 focus:ring-[#8C6A47]"
                      />
                    </div>
                  </div>
                </div>

                {/* BLOK 2: KATEGORI & KUOTA */}
                <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#D5C4B4] space-y-3">
                  <h4 className="font-serif font-black text-sm text-[#422F21]">2. Kategori, Kuota &amp; Warna Tiket</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {editingItem.tipe === 'SANTRI' ? (
                      <>
                        <div>
                          <label className="block font-bold text-[#422F21] mb-1">Kategori Utama:</label>
                          <select
                            value={editingItem.kategoriUtama}
                            onChange={(e) => setEditingItem({ ...editingItem, kategoriUtama: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-semibold"
                          >
                            <option value="BIL_GHOIB">BIL_GHOIB (Hitam Gold)</option>
                            <option value="BIN_NADZOR">BIN_NADZOR (Merah Gold)</option>
                            <option value="TAMATAN">TAMATAN (Merah Gold)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-[#422F21] mb-1">Sub-Kategori / Kelas:</label>
                          <input
                            type="text"
                            value={editingItem.subKategori}
                            onChange={(e) => setEditingItem({ ...editingItem, subKategori: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-[#422F21] mb-1">Kamar Santri:</label>
                          <input
                            type="text"
                            value={editingItem.kamar}
                            onChange={(e) => setEditingItem({ ...editingItem, kamar: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block font-bold text-[#422F21] mb-1">Golongan Undangan:</label>
                          <select
                            value={editingItem.subKategori}
                            onChange={(e) => setEditingItem({ ...editingItem, subKategori: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-semibold"
                          >
                            <option value="ISTIMEWA">ISTIMEWA (VVIP / VIP)</option>
                            <option value="KEHORMATAN">KEHORMATAN (Masyayikh / Habaib)</option>
                            <option value="UMUM">UMUM (Asatidz / Mustahiq)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-[#422F21] mb-1">Kategori Khusus:</label>
                          <input
                            type="text"
                            value={editingItem.kategori}
                            onChange={(e) => setEditingItem({ ...editingItem, kategori: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-[#422F21] mb-1">Jalur Masuk:</label>
                          <input
                            type="text"
                            value={editingItem.jalurMasuk}
                            onChange={(e) => setEditingItem({ ...editingItem, jalurMasuk: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Kuota Dasar:</label>
                      <input
                        type="number"
                        min="0"
                        value={editingItem.kuotaDasar}
                        onChange={(e) => setEditingItem({ ...editingItem, kuotaDasar: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Kuota Tambahan:</label>
                      <input
                        type="number"
                        min="0"
                        value={editingItem.kuotaTambahan}
                        onChange={(e) => setEditingItem({ ...editingItem, kuotaTambahan: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white font-bold text-xs text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Kuota Terpakai:</label>
                      <input
                        type="number"
                        min="0"
                        value={editingItem.kuotaTerpakai}
                        onChange={(e) => setEditingItem({ ...editingItem, kuotaTerpakai: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white font-bold text-xs text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Warna Tiket:</label>
                      <select
                        value={editingItem.warnaTiket}
                        onChange={(e) => setEditingItem({ ...editingItem, warnaTiket: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white font-bold text-xs"
                      >
                        <option value="Hitam Gold">Hitam Gold</option>
                        <option value="Merah Gold">Merah Gold</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* BLOK 3: RSVP & STATUS */}
                <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#D5C4B4] space-y-3">
                  <h4 className="font-serif font-black text-sm text-[#422F21]">3. RSVP &amp; Catatan</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Status Konfirmasi RSVP:</label>
                      <select
                        value={editingItem.statusKonfirmasi}
                        onChange={(e) => setEditingItem({ ...editingItem, statusKonfirmasi: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold"
                      >
                        <option value="BELUM">BELUM</option>
                        <option value="SUDAH">SUDAH</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Perkiraan Laki-laki:</label>
                      <input
                        type="number"
                        min="0"
                        value={editingItem.perkiraanL}
                        onChange={(e) => setEditingItem({ ...editingItem, perkiraanL: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Perkiraan Perempuan:</label>
                      <input
                        type="number"
                        min="0"
                        value={editingItem.perkiraanP}
                        onChange={(e) => setEditingItem({ ...editingItem, perkiraanP: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Catatan Khusus Rekonsiliasi:</label>
                    <input
                      type="text"
                      value={editingItem.catatanKonfirmasi}
                      onChange={(e) => setEditingItem({ ...editingItem, catatanKonfirmasi: e.target.value })}
                      placeholder="Contoh: Koreksi kuota walk-in di gerbang selatan..."
                      className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs"
                    />
                  </div>
                </div>

                {/* FOOTER ACTION BUTTONS */}
                <div className="pt-3 flex items-center justify-end space-x-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-5 py-2.5 rounded-2xl border border-stone-300 font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-6 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4 text-emerald-200" />
                    <span>{savingEdit ? 'Menyimpan &amp; Menyinkron...' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL WALK-IN GUEST BARU */}
        {showWalkinModal && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-[#E8DFD5] max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="font-serif font-black text-lg text-[#422F21]">
                    Daftarkan Tamu Walk-in Baru
                  </h3>
                  <p className="text-xs text-[#7A624E]">
                    Tamu hadir tanpa bawa barcode / undangan rusak (Auto Kode UND-xxxx)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="p-1 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveWalkin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#422F21] mb-1">Golongan Tamu Walk-in:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['ISTIMEWA', 'KEHORMATAN', 'UMUM'] as GolonganUndangan[]).map((gol) => (
                      <button
                        key={gol}
                        type="button"
                        onClick={() =>
                          setWalkinForm({
                            ...walkinForm,
                            golongan: gol,
                            kategori: gol === 'ISTIMEWA' ? 'VVIP' : gol === 'KEHORMATAN' ? 'Tamu Kehormatan' : 'Asatidz Mhmtq Sekalian',
                            jalurMasuk: getDefaultJalurMasuk(gol),
                          })
                        }
                        className={`py-2 px-1 rounded-xl font-bold border transition-all text-center text-[11px] ${
                          walkinForm.golongan === gol
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-[#FAF7F3] text-[#422F21] border-[#D5C4B4] hover:bg-[#EFE8E1]'
                        }`}
                      >
                        {gol}
                      </button>
                    ))}
                  </div>
                </div>

                {walkinForm.golongan === 'ISTIMEWA' ? (
                  <div className="space-y-3 bg-[#FAF7F3] p-3.5 rounded-2xl border border-[#D5C4B4]">
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Nama Tamu Putra:</label>
                      <input
                        type="text"
                        value={walkinForm.namaPutra}
                        onChange={(e) => setWalkinForm({ ...walkinForm, namaPutra: e.target.value })}
                        placeholder="Contoh: KH. ABDULLOH FAQIHI"
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Nama Tamu Putri:</label>
                      <input
                        type="text"
                        value={walkinForm.namaPutri}
                        onChange={(e) => setWalkinForm({ ...walkinForm, namaPutri: e.target.value })}
                        placeholder="Contoh: NYAI HJ. HINDAH"
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Nama Tamu Walk-in:</label>
                    <input
                      type="text"
                      value={walkinForm.nama}
                      onChange={(e) => setWalkinForm({ ...walkinForm, nama: e.target.value })}
                      placeholder="Contoh: KH. ANWAR MASHADI"
                      className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-xs"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-[#422F21] mb-1">Instansi / Alamat Asal:</label>
                  <input
                    type="text"
                    value={walkinForm.instansi}
                    onChange={(e) => setWalkinForm({ ...walkinForm, instansi: e.target.value, alamat: e.target.value })}
                    placeholder="Contoh: PP. Lirboyo Kediri"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#422F21] mb-1">Masuk Melalui (Jalur):</label>
                  <input
                    type="text"
                    value={walkinForm.jalurMasuk}
                    onChange={(e) => setWalkinForm({ ...walkinForm, jalurMasuk: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-xs"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    id="langsungCheckin"
                    checked={walkinForm.langsungCheckin}
                    onChange={(e) => setWalkinForm({ ...walkinForm, langsungCheckin: e.target.checked })}
                    className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-700 cursor-pointer"
                  />
                  <label htmlFor="langsungCheckin" className="text-xs font-bold text-emerald-950 cursor-pointer">
                    Langsung Tandai HADIR Seketika (Insert Presensi Log)
                  </label>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowWalkinModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingWalkin}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {savingWalkin ? 'Menyimpan...' : 'Daftarkan Walk-in'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
