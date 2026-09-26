const fs = require('fs');

// 1. Update scripts/all_santri_final.json
const santriList = JSON.parse(fs.readFileSync('scripts/all_santri_final.json', 'utf8'));
let countHitam = 0;
let countMerah = 0;

for (const s of santriList) {
  if (s.kategoriUtama === 'BIL_GHOIB') {
    s.warnaTiket = 'Hitam Gold';
    countHitam++;
  } else {
    s.warnaTiket = 'Merah Gold';
    countMerah++;
  }
}
fs.writeFileSync('scripts/all_santri_final.json', JSON.stringify(santriList, null, 2), 'utf8');
console.log(`Santri JSON updated: ${countHitam} Hitam Gold (Bil Ghoib), ${countMerah} Merah Gold (Bin Nadzor & Tamatan)`);

// 2. Update scripts/all_undangan_final.json
const undanganList = JSON.parse(fs.readFileSync('scripts/all_undangan_final.json', 'utf8'));
for (const u of undanganList) {
  u.warnaTiket = 'Merah Gold';
}
fs.writeFileSync('scripts/all_undangan_final.json', JSON.stringify(undanganList, null, 2), 'utf8');
console.log(`Undangan JSON updated: ${undanganList.length} Merah Gold (Tamu Undangan Umum)`);

// 3. Update lib/santri-data.ts
let santriTs = fs.readFileSync('lib/santri-data.ts', 'utf8');
santriTs = santriTs.replace(/"warnaTiket":\s*"Hijau[^"]*"/g, '"warnaTiket": "Hitam Gold"');
santriTs = santriTs.replace(/"warnaTiket":\s*"Biru"/g, '"warnaTiket": "Merah Gold"');
santriTs = santriTs.replace(/"warnaTiket":\s*"Kuning"/g, '"warnaTiket": "Merah Gold"');
fs.writeFileSync('lib/santri-data.ts', santriTs, 'utf8');
console.log('lib/santri-data.ts updated!');

// 4. Update lib/undangan-data.ts
let undTs = fs.readFileSync('lib/undangan-data.ts', 'utf8');
undTs = undTs.replace(/warnaTiket:\s*'Putih VIP'/g, "warnaTiket: 'Merah Gold'");
undTs = undTs.replace(/'warnaTiket':\s*'Putih VIP'/g, "'warnaTiket': 'Merah Gold'");
undTs = undTs.replace(/"warnaTiket":\s*"Putih VIP"/g, '"warnaTiket": "Merah Gold"');
fs.writeFileSync('lib/undangan-data.ts', undTs, 'utf8');
console.log('lib/undangan-data.ts updated!');
