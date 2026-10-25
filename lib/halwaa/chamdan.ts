export function handleChamdanAndRekeningQuery(userQuery: string, history?: any[]): string | null {
  const q = userQuery.toLowerCase().trim();

  const isRekeningQuery =
    q.includes('rekening') ||
    q.includes('transfer') ||
    q.includes('pembayaran') ||
    q.includes('bayar') ||
    q.includes('bank') ||
    q.includes('no rek') ||
    q.includes('nomor rek') ||
    q.includes('a.n.');

  const isChamdanPersonalQuery =
    q.includes('chamdan') ||
    q.includes('hamdan') ||
    q.includes('yuwafi') ||
    q.includes('yuwafin') ||
    q.includes('wakasi sekretariat');

  // PRIORITAS 1: Jika pertanyaan tentang REKENING (meskipun menyebut "Chamdan" / "a.n. siapa")
  if (isRekeningQuery) {
    return `Us, berikut detail rekening resmi panitia untuk pembelian kuota tambahan:\n\n` +
      `Bank         : BRI\n` +
      `No. Rekening : 320701010266508\n` +
      `Atas Nama    : Ahmad Chamdan Yuwafin\n\n` +
      `Silakan transfer ke rekening tersebut, kemudian upload bukti transfer di halaman pembelian kuota.\n\nAda lagi yang bisa saya bantu, Us?`;
  }

  // PRIORITAS 2: Stage 2 Alur Bercanda jika history sebelumnya adalah "Njenengan penasaran sanget?"
  if (Array.isArray(history) && history.length > 0) {
    const lastAssistantMsg = [...history].reverse().find((item: any) => item.role === 'assistant')?.content || '';
    if (lastAssistantMsg.includes('Njenengan penasaran sanget')) {
      const isAffirmative = /^(iya|ya|betul|banget|hooh|yup|yo|ho'oh|iy|nggih|bener|penasaran)\b/i.test(q) ||
        q.includes('iya') || q.includes('betul') || q.includes('penasaran') || q.includes('banget');
      const isNegative = /^(tidak|enggak|nggak|gak|boten|mboten|ndak|nda|kagak|ora)\b/i.test(q) ||
        q.includes('enggak') || q.includes('nggak') || q.includes('tidak') || q.includes('mboten');

      if (isAffirmative && !isNegative) {
        return "Monggo langsung tangklet beliau, mbok menawi beliau nggih penasaran kaliyan njenengan.";
      }
      if (isNegative) {
        return "Monggo, wonten ingkang saget dibantu malih, Us?";
      }
    }
  }

  // PRIORITAS 3: Pertanyaan Personal Chamdan (TANPA kata rekening) -> Stage 1 Alur Bercanda
  if (isChamdanPersonalQuery) {
    return "Njenengan penasaran sanget?";
  }

  return null;
}
