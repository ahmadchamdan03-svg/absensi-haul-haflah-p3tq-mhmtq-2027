import { POST } from '../app/api/ai/ask/route';

async function testAll() {
  const tests = [
    "Siapa protokoler?",
    "Siapa ketua konsumsi?",
    "Siapa ketua keamanan?",
    "Siapa sekretaris umum?",
    "Apa seksi di bawah Ketua II?",
    "Kapan gladi kotor?",
    "Kapan gladi bersih?",
    "Dimana sambangan?",
    "Jam berapa registrasi buka?",
    "Apa larangan Shohibul Hajat?",
    "Berapa harga kuota tambahan?",
    "Berapa total pemasukan?",
    "Berapa total pengeluaran?",
    "Berapa saldo?",
    "Berapa biaya santri Bil Ghoib?",
    "Berapa biaya santri Bin Nadzori?",
    "Berapa biaya santri Tamatan?",
    "Berapa biaya santri P3TQ?",
    "Apakah tamu undangan bayar?",
    "Total SH sekarang?",
    "Total tamu undangan?",
    "Berapa persen kehadiran?"
  ];

  console.log("=== STARTING TEST OF 22 US. HALWAA QUESTIONS ===");

  for (let i = 0; i < tests.length; i++) {
    const q = tests[i];
    const req = new Request('http://localhost:3000/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ prompt: q, history: [] })
    });
    // @ts-ignore
    const res = await POST(req);
    const json = await res.json();
    console.log(`\n--- TEST #${i + 1}: "${q}" ---`);
    console.log(json.reply);
    
    if (json.reply.includes('1.102.000')) {
      console.error(`❌ ERROR: Found 1.102.000 in response for "${q}"!`);
    }
  }
}

testAll().catch(console.error);
