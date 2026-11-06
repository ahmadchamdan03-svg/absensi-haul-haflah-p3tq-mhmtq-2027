'use client';

import QRCode from 'react-qr-code';
import { Calendar, Clock, MapPin, Compass, Users, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatQrPayloadSync } from '@/lib/hmac';
import NamaLembaga from '@/components/NamaLembaga';
import HeaderUndanganWali from '@/components/HeaderUndanganWali';
import HeaderUndangan from '@/components/HeaderUndangan';
import { cleanKategoriTamatan } from '@/lib/types';
import GlassCard from '@/components/GlassCard';
import ScrollReveal from '@/components/ScrollReveal';
import {
  renderTamuName,
  renderAlamatTamu,
  EventCountdownGrid,
} from './UndanganEffects';

export function TamuHeroAndEventSections({
  item,
  onOpenDenah,
  onOpenDaftarPeserta,
}: {
  item: any;
  onOpenDenah: () => void;
  onOpenDaftarPeserta: () => void;
}) {
  return (
    <>
      {/* 1. HEADER RESMI MELAYANG (FLOATING) */}
      <ScrollReveal delay={50}>
        <div className="w-full max-w-2xl lg:max-w-3xl mx-auto p-2 sm:p-4 md:px-6 text-center">
          <HeaderUndangan titleType="UNDANGAN RESMI" />
        </div>
      </ScrollReveal>

      {/* INDIKATOR SCROLL HANYA TAMPIL SETELAH UNDANGAN DIBUKA */}
      <div className="flex flex-col items-center justify-center space-y-1 text-stone-500 animate-bounce py-1 select-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1D4ED8]">
          Scroll ke Bawah ✦
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#1D4ED8]" />
      </div>

      {/* 2. KARTU IDENTITAS TAMU UNDANGAN & SAMBUTAN FORMAL ISLAMI */}
      <ScrollReveal delay={150} variant="zoom-in">
        <GlassCard className="p-5 sm:p-7 md:p-8 space-y-4 relative overflow-hidden">
          <div
            dir="rtl"
            lang="ar"
            className="text-center text-xl sm:text-2xl text-[#1D4ED8] font-normal tracking-normal leading-loose font-arabic"
          >
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </div>

          <div className="flex items-center justify-center gap-3 my-1 text-[#1D4ED8]/60">
            <div className="h-px bg-gradient-to-r from-transparent via-[#1D4ED8]/40 to-transparent flex-1" />
            <span className="text-xs">❖</span>
            <div className="h-px bg-gradient-to-r from-transparent via-[#1D4ED8]/40 to-transparent flex-1" />
          </div>

          <div className="text-center space-y-1.5">
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold block">
              Kepada Yth. Bapak/Ibu/Saudara:
            </span>
            {renderTamuName(item)}

            {renderAlamatTamu(item)}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[#BAE6FD] to-transparent my-2" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-3 font-serif text-xs sm:text-sm text-[#0F2C59] leading-relaxed text-center"
          >
            <h3 className="font-bold text-sm sm:text-base text-[#0F2C59]">
              Assalamu'alaikum Warahmatullahi Wabarakatuh
            </h3>
            <p className="text-justify sm:text-center">
              Salam silaturahim kami sampaikan, semoga Bapak/Ibu/Saudara/i senantiasa berada dalam lindungan Allah SWT.
            </p>
            <p>
              Dengan penuh rasa syukur kehadirat Allah SWT, kami mengharap kehadiran Bapak/Ibu/Saudara/i dalam acara <strong>Tasyakuran Takhtiman-Tamatan</strong>:
            </p>
            <div className="py-1">
              <NamaLembaga align="center" size="xs" weight="bold" color="text-[#0F2C59]" />
            </div>
            <p>
              serta <strong>Dzikrul Haul Al-maghfur Lahum</strong>:
            </p>
          </motion.div>

          <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/80 text-xs font-serif font-bold text-[#1E3A8A] space-y-1.5 text-center">
            <p className="text-sm text-[#1D4ED8] font-black">• KH. ABDUL KARIM •</p>
            <p className="text-sm text-[#1D4ED8] font-black">• KH. MARZUQI DAHLAN •</p>
            <p className="text-sm text-[#1D4ED8] font-black">• KH. MAHRUS ALY •</p>
            <p className="text-sm text-[#1D4ED8] font-black">• KH. AHMAD IDRIS MARZUQI •</p>
            <p className="text-sm text-[#1D4ED8] font-black">• IBU NYAI HJ. ADDINIYAH KHODIJAH •</p>
            <p className="text-[11px] text-stone-500 font-normal pt-1">dan segenap Masyayikh Pon. Pes. Lirboyo Kediri</p>
          </div>
        </GlassCard>
      </ScrollReveal>

      {/* 3. KARTU DETAIL PELAKSANAAN ACARA */}
      <ScrollReveal delay={200} variant="zoom-in">
        <GlassCard className="p-5 sm:p-7 md:p-8 space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8]">
              Pelaksanaan Acara
            </span>
            <h3 className="font-serif font-black text-lg text-[#0F2C59]">
              Haul &amp; Haflah Akhirussanah 1448 H. / 2027 M.
            </h3>
          </div>

          <div className="space-y-3 pt-2 text-xs sm:text-sm">
            <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white/80 border border-[#E8DFD5]">
              <Calendar className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
              <div>
                <span className="text-stone-500 text-[10px] uppercase font-bold block">HARI / TANGGAL</span>
                <p className="font-bold text-[#0F2C59]">Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white/80 border border-[#E8DFD5]">
              <Clock className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
              <div>
                <span className="text-stone-500 text-[10px] uppercase font-bold block">WAKTU</span>
                <p className="font-bold text-[#0F2C59]">06.30 WIB / 07.00 WIs s.d. Selesai</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white/80 border border-[#E8DFD5]">
              <MapPin className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
              <div>
                <span className="text-stone-500 text-[10px] uppercase font-bold block">TEMPAT</span>
                <p className="font-bold text-[#0F2C59]">Aula Al-Muktamar Pondok Pesantren Lirboyo Kediri</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </ScrollReveal>

      {/* 4. ⬅️ KARTU HITUNG MUNDUR (COUNTDOWN TIMER) — DIPINDAH KE SINI */}
      <ScrollReveal delay={250} variant="zoom-in">
        <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-5 text-center">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8]">
              Waktu &amp; Tempat Pelaksanaan
            </span>
            <h3 className="font-serif font-black text-xl text-[#0F2C59]">
              Aula Al-Muktamar Pondok Pesantren Lirboyo
            </h3>
            <p className="text-xs text-stone-600">
              Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
            </p>
          </div>

          <EventCountdownGrid targetDate="2027-01-02T06:30:00+07:00" />

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              type="button"
              onClick={onOpenDenah}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#1E3A8A] text-xs font-bold border border-[#BAE6FD] inline-flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xs"
            >
              <Compass className="w-4 h-4 text-[#1D4ED8]" />
              <span>Buka Denah Lokasi &amp; Parkir</span>
            </button>
            <button
              type="button"
              onClick={onOpenDaftarPeserta}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white hover:bg-stone-50 text-[#1D4ED8] text-xs font-bold border border-[#BAE6FD] inline-flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xs"
            >
              <Users className="w-4 h-4 text-[#1D4ED8]" />
              <span>Lihat Daftar Peserta</span>
            </button>
          </div>
        </GlassCard>
      </ScrollReveal>

      {/* 5. KARTU RUNDOWN ACARA (PRA ACARA & ACARA INTI) */}
      <ScrollReveal delay={300}>
        <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-4">
          <h3 className="font-serif font-black text-base text-[#0F2C59] border-b border-stone-100 pb-2 text-center uppercase tracking-wider text-[#1D4ED8]">
            Rundown Acara
          </h3>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* PRA ACARA */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2">
              <span className="font-serif font-black text-xs sm:text-sm text-[#1D4ED8] uppercase tracking-wide block border-b border-sky-200/60 pb-1">
                ✦ Pra Acara:
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-[#0F2C59] font-medium pl-1">
                <li>Senandung Sholawat Nabi</li>
                <li>Muhafadzoh Alfiyah Ibn Malik &amp; Jauharul Maknun</li>
                <li>Tartilan</li>
              </ol>
            </div>

            {/* ACARA INTI */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
              <span className="font-serif font-black text-xs sm:text-sm text-blue-900 uppercase tracking-wide block border-b border-blue-200/60 pb-1">
                ✦ Acara Inti:
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-[#0F2C59] font-medium pl-1">
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
    </>
  );
}

export function WaliHeroAndIdentitySections({
  item,
  santri,
  kuota,
  kodeSH,
  fullQrPayload,
  totalKuotaSantri,
}: {
  item: any;
  santri: any;
  kuota: any;
  kodeSH: string;
  fullQrPayload: string;
  totalKuotaSantri: number;
}) {
  return (
    <>
      {/* 1. HEADER RESMI WALI MELAYANG (FLOATING) */}
      <ScrollReveal delay={50}>
        <div className="w-full max-w-2xl lg:max-w-3xl mx-auto p-2 sm:p-4 md:px-6 text-center">
          <div className="text-[10px] sm:text-xs font-serif font-black tracking-widest text-[#1D4ED8] uppercase text-center mb-1">
            UNDANGAN RESMI WALI SANTRI
          </div>
          <HeaderUndanganWali />
        </div>
      </ScrollReveal>

      {/* INDIKATOR SCROLL HANYA TAMPIL SETELAH UNDANGAN DIBUKA */}
      <div className="flex flex-col items-center justify-center space-y-1 text-stone-500 animate-bounce py-1 select-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1D4ED8]">
          Scroll ke Bawah ✦
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#1D4ED8]" />
      </div>

      {/* 2. PROFIL SANTRIWATI & WALI SANTRI (PERBAIKAN 3 & 5: RAPIKAN GRID MOBILE) */}
      <ScrollReveal delay={100} variant="zoom-in">
        <GlassCard className="p-5 sm:p-7 md:p-8 space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8]">
              Shohibul Hajat
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#0F2C59]">
              {santri?.nama || item?.entitas?.nama}
            </h2>
            <p className="text-xs text-stone-600 font-medium max-w-full leading-relaxed break-words">
              {santri?.kamar && santri.kamar !== '-' ? (
                <>
                  {cleanKategoriTamatan(santri.subKategori) || 'Santri'} · <strong>{santri.kamar}</strong>
                </>
              ) : (
                cleanKategoriTamatan(santri?.subKategori) || 'Santri'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-3 border-t border-stone-100 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/80 space-y-0.5">
              <span className="text-stone-500 text-[10px] uppercase font-bold block">Nama Wali:</span>
              <p className="font-bold text-[#0F2C59] leading-snug">{item?.entitas?.namaWali || item?.entitas?.nama}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/80 space-y-0.5">
              <span className="text-stone-500 text-[10px] uppercase font-bold block">Asal / Alamat:</span>
              <p className="font-bold text-[#0F2C59] leading-snug">{item?.entitas?.alamat || 'Kediri'}</p>
            </div>
          </div>
        </GlassCard>
      </ScrollReveal>

      {/* 3. KALIMAT SAMBUTAN FORMAL ISLAMI & INFO MAHSYAYIKH */}
      <ScrollReveal delay={150} variant="zoom-in">
        <GlassCard className="p-5 sm:p-7 md:p-8 space-y-4 text-[#0F2C59]">
          <div
            dir="rtl"
            lang="ar"
            className="text-center text-xl sm:text-2xl text-[#1D4ED8] font-normal tracking-normal leading-loose font-arabic"
          >
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-3 font-serif text-xs sm:text-sm text-[#0F2C59] leading-relaxed text-center"
          >
            <h3 className="font-serif font-bold text-center text-sm sm:text-base text-[#0F2C59]">
              Assalamu'alaikum Warahmatullahi Wabarakatuh
            </h3>

            <p className="font-serif text-xs sm:text-sm text-[#0F2C59] leading-relaxed text-justify sm:text-center">
              Salam silaturahim kami sampaikan, semoga Bapak/Ibu/Saudara/i senantiasa berada dalam lindungan Allah SWT.
            </p>

            <div className="space-y-2 font-serif text-xs sm:text-sm text-[#0F2C59] leading-relaxed text-center">
              <p>
                Dengan penuh rasa syukur kehadirat Allah SWT, kami mengharap kehadiran Bapak/Ibu/Saudara/i Wali Santri dalam acara <strong>Tasyakuran Takhtiman-Tamatan</strong>:
              </p>
              <div className="py-1">
                <NamaLembaga align="center" size="xs" weight="bold" color="text-[#0F2C59]" />
              </div>
              <p>
                serta <strong>Dzikrul Haul Al-maghfur Lahum</strong>:
              </p>
            </div>
          </motion.div>

          <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/80 text-xs font-serif font-bold text-[#1E3A8A] space-y-1.5 text-center">
            <p className="text-sm text-[#1D4ED8] font-black">• KH. ABDUL KARIM •</p>
            <p className="text-sm text-[#1D4ED8] font-black">• KH. MARZUQI DAHLAN •</p>
            <p className="text-sm text-[#1D4ED8] font-black">• KH. MAHRUS ALY •</p>
            <p className="text-sm text-[#1D4ED8] font-black">• KH. AHMAD IDRIS MARZUQI •</p>
            <p className="text-sm text-[#1D4ED8] font-black">• IBU NYAI HJ. ADDINIYAH KHODIJAH •</p>
            <p className="text-[11px] text-stone-500 font-normal pt-1">dan segenap Masyayikh Pon. Pes. Lirboyo Kediri</p>
          </div>
        </GlassCard>
      </ScrollReveal>

      {/* RANGKAIAN ADICARA UTAMA & TATA TERTIB SAMBANGAN */}
      <ScrollReveal delay={200} variant="zoom-in">
        <GlassCard className="p-5 sm:p-7 md:p-8 space-y-5">
          <div className="space-y-3">
            <h3 className="font-serif font-black text-base text-[#0F2C59] border-b border-stone-100 pb-2">
              Rangkaian Acara Haflah Akhirussanah P3TQ dan MHMTQ 1448 H. / 2027 M.
            </h3>
            <div className="space-y-2.5 text-xs md:text-sm leading-relaxed">
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#1D4ED8] shrink-0 min-w-[70px]">05.30 WIs</span>
                <p className="text-stone-700">Persiapan Shohibul Hajat diberangkatkan ke Aula Al-Muktamar.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#1D4ED8] shrink-0 min-w-[70px]">06.00 WIs</span>
                <p className="text-stone-700">Lalaran Tamatan Aliyah &amp; Senandung Sholawat Syauqul Ahibba'.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#1D4ED8] shrink-0 min-w-[70px]">06.30 WIs</span>
                <p className="text-stone-700">
                  <strong>Registrasi Gerbang Masuk Dibuka</strong> (06.30 WIB / 07.00 WIs) &amp; Tartilan Khotmil Qur'an.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#1D4ED8] shrink-0 min-w-[70px]">07.30 WIs</span>
                <p className="text-stone-700">Pembukaan, Qiro'at, Tahlil, dan Sambutan-Sambutan Masyayikh.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#1D4ED8] shrink-0 min-w-[70px]">08.52 WIs</span>
                <p className="text-stone-700">Pembagian Syahadah Takhtiman Bil Ghoibi &amp; Bin Nadzori.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#1D4ED8] shrink-0 min-w-[70px]">10.12 WIs</span>
                <p className="text-stone-700">Mau'idzoh Hasanah, Do'a Masyayikh, &amp; Pembagian Ijazah Tamatan.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#1D4ED8] shrink-0 min-w-[70px]">13.01 WIs</span>
                <p className="text-stone-700">Penayangan Video Closing "Sajak Akhirussanah" dan Sesi Foto.</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 space-y-3">
            <h4 className="font-serif font-black text-sm text-[#0F2C59]">
              Tata Tertib &amp; Ketentuan Sambangan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1.5">
                <span className="font-bold text-blue-950 block">🚫 Larangan Selama Acara:</span>
                <ul className="text-blue-900 leading-relaxed text-[11px] md:text-xs space-y-1">
                  <li>• Dilarang membawa <strong>buket</strong> ke aula.</li>
                  <li>• Dilarang memakai kutek, hena, &amp; nail art.</li>
                  <li>• Dilarang membawa fotografer dari luar.</li>
                  <li>• Wali dilarang memasuki area steril santriwati saat acara.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                <span className="font-bold text-blue-900 block">📍 Jadwal &amp; Lokasi Sambangan:</span>
                <ul className="text-blue-800 leading-relaxed text-[11px] md:text-xs space-y-1">
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
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-5 sm:p-7 md:p-8 border-2 border-[#1D4ED8]/70 shadow-[0_8px_32px_0_rgba(140,106,71,0.08)] text-center space-y-4">
          <p className="text-xs sm:text-sm font-semibold text-[#0F2C59]">
            Mohon tunjukkan QR Code kepada petugas saat memasuki lokasi acara.
          </p>

          <div className="flex flex-col items-center justify-center">
            <div className="p-4 rounded-3xl bg-white/70 backdrop-blur-xs border-2 border-[#BAE6FD] shadow-inner max-w-[260px] w-full aspect-square flex items-center justify-center">
              {item?.kode || kodeSH ? (
                <QRCode
                  value={fullQrPayload || formatQrPayloadSync(item?.kode || kodeSH)}
                  size={220}
                  bgColor="#F0F9FF"
                  fgColor="#0F2C59"
                  level="M"
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
              ) : (
                <div className="text-xs font-serif font-bold text-stone-500">Kode tidak tersedia</div>
              )}
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-[#7A624E]">
            Pintu registrasi dibuka mulai pukul <strong>06.30 WIB / 07.00 WIs</strong>.
          </p>

          <div className="grid grid-cols-3 gap-2 bg-white/50 backdrop-blur-xs p-3 rounded-2xl border border-white/80 text-xs">
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-bold">KUOTA DASAR</span>
              <p className="font-serif font-black text-lg text-[#0F2C59]">{kuota?.kuotaDasar || 2}</p>
            </div>
            <div className="border-x border-stone-200">
              <span className="text-[10px] text-stone-500 uppercase font-bold">TAMBAHAN</span>
              <p className="font-serif font-black text-lg text-blue-700">+{kuota?.kuotaTambahan || 0}</p>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-bold">TOTAL KUOTA</span>
              <p className="font-serif font-black text-lg text-stone-700">{totalKuotaSantri} Kursi</p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </>
  );
}
