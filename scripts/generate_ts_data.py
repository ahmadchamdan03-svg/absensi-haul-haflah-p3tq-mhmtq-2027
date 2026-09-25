# -*- coding: utf-8 -*-
import json

with open("C:/Users/user/.gemini/antigravity/scratch/haflah-p3tq/scripts/parsed_santri.json", "r", encoding="utf-8") as f:
    santri_list = json.load(f)

print(f"Loaded {len(santri_list)} santri")

# 1. Generate lib/santri-data.ts
ts_content = """// =====================================================================
// MASTER DATA SANTRI RIIL: HAFLAH & HAUL P3TQ - MHMTQ 2026-2027
// Bin Nadzori (159 Santri) & Tamatan (326 Santri) = Total 485 Santri
// =====================================================================

export interface MasterSantri {
  code: string;
  nama: string;
  kategoriUtama: 'BIN_NADZOR' | 'TAMATAN';
  subKategori: string;
  kelas: string;
  kamar: string;
  namaWali: string;
  alamat: string;
  noHp: string;
  kuotaDasar: number;
  warnaTiket: 'Biru' | 'Kuning';
}

export const REAL_SANTRI_LIST: MasterSantri[] = """ + json.dumps(santri_list, ensure_ascii=False, indent=2) + ";\n"

with open("C:/Users/user/.gemini/antigravity/scratch/haflah-p3tq/lib/santri-data.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Generated lib/santri-data.ts successfully!")
