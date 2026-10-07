import { POST } from '../app/api/ai/ask/route';

async function test8Questions() {
  const tests = [
    "Berapa total pengeluaran?",
    "Berapa total pemasukan?",
    "Berapa saldo?",
    "Berapa tamu VVIP?",
    "Berapa tamu VIP?",
    "Berapa total tamu undangan?",
    "Berapa total SH?",
    "Berapa penguji Al-Qur'an?"
  ];

  console.log("=== STARTING 8 MANDATORY VERIFICATION TESTS ===");

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

test8Questions().catch(console.error);
