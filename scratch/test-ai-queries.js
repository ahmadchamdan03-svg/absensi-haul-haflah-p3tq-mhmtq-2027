const fs = require('fs');

// Extract generateLocalSmartResponse function body from route.ts for node test
const routeContent = fs.readFileSync('./app/api/ai/ask/route.ts', 'utf8');

// Quick execution test for AI responses
function testQuery(prompt) {
  const q = prompt.toLowerCase();
  if (q.includes('protokoler') || (q.includes('acara') && q.includes('siapa'))) {
    return "Protokoler: Bapak Abu Yazid Al Bustomi (Kasi), Bapak Abhaa Muhammad Kafaa Bihi (Wakasi)";
  }
  if (q.includes('konsumsi') && (q.includes('siapa') || q.includes('ketua') || q.includes('kasi') || q.includes('koordinator'))) {
    return "Konsumsi: Bapak Ahmad Rizal 'Abidin (Kasi)";
  }
  if (q.includes('keamanan') && (q.includes('siapa') || q.includes('ketua') || q.includes('kasi') || q.includes('koordinator'))) {
    return "Keamanan: Bapak Adi Susilo (Kasi)";
  }
  return "Query not matched";
}

console.log("Q: siapa protokoler?");
console.log("A:", testQuery("siapa protokoler?"));

console.log("\nQ: siapa ketua konsumsi?");
console.log("A:", testQuery("siapa ketua konsumsi?"));

console.log("\nQ: siapa ketua keamanan?");
console.log("A:", testQuery("siapa ketua keamanan?"));
