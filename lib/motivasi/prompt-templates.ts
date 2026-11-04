// =============================================================================
// TEMPLATE PROMPT MOTIVASI DINAMIS — USTH. HALWAA & HAFLAH P3TQ-MHMTQ
// =============================================================================

export const FALLBACK_MOTIVASI =
  'Setiap langkah perjuangan dan tetes keringat dalam menyukseskan Haul & Haflah P3TQ dan MHMTQ adalah untaian amal jariyah yang bernilai mulia. Tetaplah istiqomah dan ikhlas melayani, sebab keberkahan senantiasa menyertai hati yang tulus berkhidmah.';

export const MOTIVASI_PROMPT_TEMPLATES: string[] = [
  // 1. Dedikasi & Pengabdian
  'Tulis 1 paragraf motivasi islami bertema DEDIKASI dan pengabdian tulus dalam konteks: "{context}". Gunakan 3-4 kalimat yang menenangkan, apresiatif, dan menggugah semangat khidmah tanpa menyebutkan nama orang lain.',

  // 2. Mengatasi Lelah & Kejenuhan
  'Tulis 1 paragraf motivasi islami tentang MENGUBAH LELAH MENJADI LILLAH dalam rangka: "{context}". Susun 3-4 kalimat yang menghibur hati yang penat, mengingatkan pahala kesabaran di balik setiap peluh perjuangan.',

  // 3. Tugas Berat & Tanggung Jawab
  'Tulis 1 paragraf motivasi islami tentang KETANGGUHAN MENGEMBAN AMANAH BERAT terkait: "{context}". Gunakan 3-4 kalimat yang membangkitkan rasa percaya diri, tawakkal, dan keyakinan bahwa Allah tidak membebani di luar kesanggupan.',

  // 4. Rasa Syukur & Keberkahan
  'Tulis 1 paragraf renungan islami bertema SYUKUR atas kelancaran proses: "{context}". Gunakan 3-4 kalimat puitis dan sejuk tentang bagaimana rasa syukur melipatgandakan nikmat serta mendatangkan keberkahan berkelanjutan.',

  // 5. Harapan & Optimisme Masa Depan
  'Tulis 1 paragraf motivasi islami tentang OPTIMISME dan prasangka baik kepada Allah dalam menjalankan: "{context}". Gunakan 3-4 kalimat penuh harapan cerah yang menguatkan langkah para pejuang santri.',

  // 6. Keteguhan Saat Menghadapi Kendala
  'Tulis 1 paragraf motivasi islami tentang KETEGARAN HATI saat menghadapi rintangan teknis pada: "{context}". Gunakan 3-4 kalimat bijak yang menumbuhkan ketenangan, bahwa setiap kesulitan selalu bersanding dengan kemudahan.',

  // 7. Ketenangan Batin di Bawah Tekanan
  'Tulis 1 paragraf motivasi islami bertema THUMA\'NINAH (ketenangan batin) saat padatnya amanah: "{context}". Gunakan 3-4 kalimat syahdu yang mengingatkan pentingnya dzikir dan kelapangan dada.',

  // 8. Menghargai Nilai Diri & Kontribusi di Balik Layar
  'Tulis 1 paragraf apresiasi islami tentang NILAI MULIA KHIDMAH DI BALIK LAYAR untuk: "{context}". Gunakan 3-4 kalimat hangat yang menegaskan bahwa keikhlasan yang tak tampak di mata manusia tetap harum di sisi Allah.',

  // 9. Energi Positif & Keceriaan Bersama
  'Tulis 1 paragraf motivasi islami bertema ENERGI POSITIF dan saling menguatkan dalam: "{context}". Gunakan 3-4 kalimat bersemangat yang menyebarkan kehangatan ukhuwah dan senyum ketulusan.',

  // 10. Keikhlasan & Kemurnian Niat
  'Tulis 1 paragraf renungan islami bertema KEIKHLASAN NIAT semata-mata mengharap ridha Ilahi dalam: "{context}". Gunakan 3-4 kalimat mendalam yang memurnikan tujuan perjuangan dari riya dan pamrih duniawi.',

  // 11. Kebersamaan & Sinergi Jamaah
  'Tulis 1 paragraf motivasi islami tentang KEKUATAN BERJAMAAH dan kerja sama solid menyukseskan: "{context}". Gunakan 3-4 kalimat yang menginspirasi persatuan hati, bagaikan satu bangunan yang saling menopang.',

  // 12. Kesabaran Menanti Buah Manis
  'Tulis 1 paragraf motivasi islami tentang KESABARAN dan ketelatenan dalam merawat detail: "{context}". Gunakan 3-4 kalimat yang meyakinkan bahwa proses yang ditempuh dengan sabar akan berbuah manis tak terhingga.',

  // 13. Ketelitian & Profesionalitas Santri
  'Tulis 1 paragraf motivasi islami tentang ITQAN (profesionalitas dan ketelitian) dalam amanah: "{context}". Gunakan 3-4 kalimat inspiratif bahwa Allah mencintai hamba yang bekerja dengan rapi, teliti, dan tuntas.',

  // 14. Keberkahan Melayani Masyayikh & Tamu
  'Tulis 1 paragraf motivasi islami tentang KEMULIAAN IKRAMUD DLUYUF (memuliakan tamu dan guru) dalam: "{context}". Gunakan 3-4 kalimat takzim yang menegaskan bahwa melayani dhuyufurrahman adalah pintu terbukanya rahmat agung.',

  // 15. Istiqomah Menuju Puncak Kesuksesan
  'Tulis 1 paragraf motivasi islami tentang ISTIQOMAH menjaga ritme semangat hingga akhir acara: "{context}". Gunakan 3-4 kalimat pembakar semangat yang mengokohkan tekad agar tidak kendor sebelum garis akhir.',
];

/**
 * Memilih satu template prompt motivasi secara acak dan menyisipkan konteks dokumen.
 */
export function getRandomMotivasiPrompt(context: string): string {
  const cleanContext = (context || 'Dokumen Resmi Haflah P3TQ & MHMTQ').trim();
  const randomIndex = Math.floor(Math.random() * MOTIVASI_PROMPT_TEMPLATES.length);
  const template = MOTIVASI_PROMPT_TEMPLATES[randomIndex];
  return template.replace(/\{context\}/g, cleanContext);
}
