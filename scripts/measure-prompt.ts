import {
  BASE_PERSONA_PROMPT,
  KATA_GANTI_PROMPT,
  SECTION_KEPANITIAAN,
  SECTION_KEUANGAN,
  SECTION_ACARA_JADWAL,
  SECTION_MULTIMEDIA_DOC,
  HAFLAH_KNOWLEDGE_SYSTEM_PROMPT,
} from '../lib/halwaa/knowledge-base';
import { getLiveSupabaseGuestPrompt } from '../lib/halwaa/live-context';

function estimateTokens(val: number | string): number {
  const len = typeof val === 'number' ? val : val.length;
  return Math.round(len / 4);
}

async function simulatePrompt(prompt: string, isFirstTurn: boolean = true) {
  const qLower = prompt.toLowerCase().trim();

  const isGreetingOnly = /^(halo|hai|hi|hey|assalamu'alaikum|assalamualaikum|ass|pagi|siang|malam|selamat pagi|selamat siang|selamat malam|terima kasih|makasih|syukron|matur nuwun|tes|test|ping|p)[\s.!,?]*$/i.test(prompt.trim());

  const isPronounIntent =
    /siapa saya|saya siapa|kamu siapa|siapa kamu|siapa dia|dia siapa|halwa siapa|siapa halwa/i.test(prompt);

  const isKepanitiaanIntent =
    /\b(panitia|seksi|ketua|sekretaris|bendahara|kasi|wakasi|koor|pengasuh|pembimbing|pleno|gus|ning|ustadz|ustadzah|bapak|profil|tugas|jabatan|dewan)\b/i.test(prompt) ||
    /\bsiapa\b/i.test(prompt);

  const isKeuanganIntent =
    /\b(biaya|bayar|uang|saldo|transfer|rekening|anggaran|dana|donasi|subsidi|nominal|rupiah|pos|pengeluaran|pemasukan|bri)\b/i.test(prompt);

  const isAcaraJadwalIntent =
    /\b(acara|tanggal|jadwal|kapan|waktu|jam|lokasi|tempat|aula|muktamar|tiket|kartu|sambang|sambangan|gladi|kotor|bersih|rundown|tata tertib|tertib|aturan|larangan|syarat)\b/i.test(prompt);

  const isLiveGuestOrStatsIntent =
    /\b(tamu|undangan|santri|shohibul|hajat|kuota|kursi|statistik|kehadiran|hadir|datang|presensi|rekap|dobel|cekin|checkin|vvip|vip|ids|kehormatan|penguji|asatidz|perwakilan)\b/i.test(prompt);

  const isDocMediaIntent =
    /\b(gambar|foto|ilustrasi|link|tautan|website|download|unduh|pdf|word|docx|doc|excel|xlsx|xls|tabel|table|csv|file|berkas|ekspor)\b/i.test(prompt);

  const promptParts: string[] = [BASE_PERSONA_PROMPT];
  promptParts.push("[PANDUAN SESI]");

  if (isPronounIntent) {
    promptParts.push(KATA_GANTI_PROMPT);
  }
  if (isKepanitiaanIntent) {
    promptParts.push(SECTION_KEPANITIAAN);
  }
  if (isKeuanganIntent) {
    promptParts.push(SECTION_KEUANGAN);
  }
  if (isAcaraJadwalIntent) {
    promptParts.push(SECTION_ACARA_JADWAL);
  }
  if (isDocMediaIntent) {
    promptParts.push(SECTION_MULTIMEDIA_DOC);
  }

  if (isLiveGuestOrStatsIntent) {
    const livePrompt = await getLiveSupabaseGuestPrompt(prompt);
    promptParts.push(livePrompt);
  }

  if (
    !isGreetingOnly &&
    !isPronounIntent &&
    !isKepanitiaanIntent &&
    !isKeuanganIntent &&
    !isAcaraJadwalIntent &&
    !isLiveGuestOrStatsIntent &&
    !isDocMediaIntent
  ) {
    promptParts.push(HAFLAH_KNOWLEDGE_SYSTEM_PROMPT);
  }

  const fullPrompt = promptParts.join('\n\n');
  return {
    chars: fullPrompt.length,
    tokens: estimateTokens(fullPrompt),
  };
}

async function main() {
  console.log('=================================================================');
  console.log('           AUDIT & PERBANDINGAN TOKEN SYSTEM PROMPT              ');
  console.log('=================================================================');

  const beforeKB = 25965; // original HAFLAH_KNOWLEDGE_SYSTEM_PROMPT
  const beforeLive = 2376; // original live context
  const beforeTotalChars = beforeKB + beforeLive;
  const beforeTokens = estimateTokens(beforeTotalChars);

  console.log(`\n[SEBELUM OPTIMASI (MONOLITHIC ALL-IN-ONE)]:`);
  console.log(`- Base Knowledge Base Prompt : ${beforeKB} chars (~${estimateTokens(beforeKB)} tokens)`);
  console.log(`- Live Supabase Context      : ${beforeLive} chars (~${estimateTokens(beforeLive)} tokens)`);
  console.log(`- Total Input System Prompt  : ${beforeTotalChars} chars (~${beforeTokens} tokens)`);
  console.log(`- Estimasi Input + History   : ~13.400 tokens`);

  console.log(`\n[SETELAH OPTIMASI (CONDITIONAL & STREAMLINED)]:`);
  
  const scenarios = [
    { label: '1. Sapaan Ringan ("Halo")', query: 'Halo' },
    { label: '2. Kata Ganti ("Kamu siapa?")', query: 'Kamu siapa?' },
    { label: '3. Data Kepanitiaan ("Siapa ketua panitia?")', query: 'Siapa ketua panitia?' },
    { label: '4. Data Keuangan ("Berapa saldo?")', query: 'Berapa saldo?' },
    { label: '5. Jadwal & Lokasi ("Kapan acara haflah?")', query: 'Kapan acara haflah?' },
    { label: '6. Live Data Tamu ("Berapa tamu yang hadir?")', query: 'Berapa tamu yang hadir?' },
    { label: '7. Pertanyaan Umum / Fikih ("Apa hukum puasa?")', query: 'Apa hukum puasa?' },
  ];

  for (const s of scenarios) {
    const res = await simulatePrompt(s.query);
    const dropPercent = Math.round(((beforeTokens - res.tokens) / beforeTokens) * 100);
    console.log(`- ${s.label.padEnd(48)} : ${res.chars.toString().padStart(5)} chars | ~${res.tokens.toString().padStart(4)} tokens (Hemat: ${dropPercent}%)`);
  }
}

main().catch(console.error);
