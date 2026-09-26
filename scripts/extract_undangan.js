const fs = require('fs');
let code = fs.readFileSync('lib/undangan-data.ts', 'utf8');

// remove typescript export/interface
code = code.replace(/export\s+interface\s+MasterUndangan[\s\S]*?\}/, '');
code = code.replace('export const MASTER_UNDANGAN_LIST: MasterUndangan[] =', 'const list =');
code += '\nmodule.exports = list;\n';

fs.writeFileSync('scripts/temp_undangan.js', code);
const list = require('./temp_undangan.js');
console.log('Total Undangan extracted:', list.length);
console.log('First:', list[0]);
console.log('Last:', list[list.length - 1]);
fs.writeFileSync('scripts/all_undangan_final.json', JSON.stringify(list, null, 2), 'utf8');
console.log('Saved to scripts/all_undangan_final.json');
try { fs.unlinkSync('scripts/temp_undangan.js'); } catch(e){}
