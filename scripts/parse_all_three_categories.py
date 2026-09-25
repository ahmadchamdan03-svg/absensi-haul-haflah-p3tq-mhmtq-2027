# -*- coding: utf-8 -*-
import json
import re

bil_ghoib_raw = """
1;AFIFATUN NISAA; TRENGGALEK;BPK. IMAM SAHRI;081515979544;
2;ANA SHOFIA FUAIDA;KEDIRI;BPK. H. SYAMSUL BASHU'IR;085708633780;
3;AULIA DWI CAHYATI;BOJONEGORO;BPK. SARMIDIN;082154205636;
4;AULIA NUR AFIFAH;TEGAL;BPK. KHUDORI;085327040613;
5;AYU NUR HASANAH;KALIMANTAN;BPK. YATNO;0895393231656;
6;BINTI MAHBUBAH;;;;
7;DALIA HIKMATUL MAULA;BLITAR;BPK. M. ALI MA'RUF;085746908331;
8;DEWI AKHIRUL JANNAH ;JOMBANG;BPK. SOELKANI;081252760020;
9;DEWI MASYITHOH Z.;LUMAJANG;BPK. ZAMROJI ROMLI;082330221287;
10;DEWI MUNGIYAROTUL;TULUNGAGUNG;BPK. SUNARKO;081654985501;
11;DINDA IRMA AINUR;KEDIRI;BPK. MUZAKIR;085604682835;
12;DYAH NAWANG WULAN;SULAWESI;BPK. BAMBANG HARYANTO;08219443995;
13;FITRI NUR FADHILAH;BOJONEGORO;BPK. TOHA;085749851035;
14;GHINA SA'ADAH;CIREBON;BPK. MOH. ISLAHUDDIN ANAS;0895618081778;
15;HANIFATUR ROIFAH  ;TULUNGAGUNG;BPK. SAMSUSI;082228476717;
16;HILMIYATUL MAKIYYAH;KEDIRI;BPK. MOCH. YAHYA BADRUS;081335817882;
17;HILWA AULIA AZZAHRA;;BPK. ISMAIL;082337220020;
18;ILMIYATUL HIKMAH;BATAM;BPK. SUTRIMO;085765452110;
19;IMELDA MARTHA;KEDIRI;BPK. SAMSUDIN;081331223289;
20;INDA PUSPITA SARI;NGANJUK;BPK. JUNARDI;085732922109;
21;INTA ZUHAIRINI;BLITAR;BPK. SALMAN FUADI;081216571173;
22;IZZA NI'MATUL MUDAWAMAH;KEDIRI;BPK. IMAM MAHMUD;085175309399;
23;KAFILLAH ILAH NACHIWA S.;RIAU;BPK. TEGUH HARIYANTO;082173760533;
24;KHAFIDZOTUL FADHILAH;PEKALONGAN;BPK. NASHORI;087738196746;
25;KHALIYA VI AINI;KEDIRI;BPK. MOCH. MUSLICH;08980095900;
26;KHOTIFAH;MADURA;BPK. H. ABU HASAN;081330050958;
27;KUNI FAIZAH;MAGELANG;BPK. ABU QOMARUDIN;081328233385;
28;LAILA MUHIMMATUN NAFI';TRENGGALEK;BPK. H. FAHRUDDIN;085236871296;
29;LILI SURYANI;LAMPUNG;BPK. SLAMET RIYANTO;081991818729;
30;MAR'ATUS SHOLIHAH;KEDIRI;BPK. AHMAD WILDAN;085707093389;
31;MUALIFATUR ROSYIDAH;JAMBI;BPK. AHMAD KHUDLOIRI;085357082599;
32;NABILA QURROTUL AINI;KEDIRI;BPK. MUHAMMAD NASIR;085755506046;
33;NADIA SILVI;;;;
34;NADIYA AL KAFI;KENDAL;BPK. SYAFI'I;081216284616;
35;NAILINA AZKA SHOFIA;BATANG;BPK. AKHMAD FAUZI;085647520370;
36;NAILU FIRHATIN WAFIROH;NGANJUK;BPK. ABU HAMID;085655670690;
37;NASYWA ATHIYATUR ROHMAH;BEKASI;BPK. AGUS MULYANTO;081210691999;
38;NGATIQOTUN KHOIRUN;MADIUN;BPK. IMAM BAWANI;081232790660;
39;NIDA AMALIATUL FAUZIYAH;BREBES;BPK. NUR ARIFIN;085731003692;
40;NIKHA NIHAYATUL HUSNA;KEDIRI;BPK. NAHROWI ;085853577773;
41;NI'MAH ILMIYATUL ULYA;TANGERANG;BPK. H. ABDUL ROUF;081933829792;
42;NI'MATUL HASANAH;SURABAYA;BPK. SURANTO;082333327993;
43;NUFA'AH NUR IZZAH;JEMBER;BPK. M. KHOLILULLOH;082331575670;
44;NUR ANISATUL AZIZAH;NGANJUK;BPK. QOMARUDIN ZUHRI;085736274651;
45;NUR LAILATUL M.;MADURA;BPK. RUDIYANTO;081277257944;
46;NURCAHYATI ZAHRO TUSSHOFIYAH;MOJOKERTO;BPK. FATKAN;085708147917;
47;NURUL FAIZAH AFIFATUL MILLAH;KEDIRI;;08978105277;
48;RODLIYAH KARIM;KEDIRI;BPK. AGUS FATKHUL KARIM;081214157800;
49;RODLIYAH PUTRI;SOLO;BPK. WAHONO SETYONO;081227080368;
50;ROYHANAH;MADURA;BPK. MUTHARI;;
51;SALSABILA FIRDAUSI;LAMONGAN;BPK. RUSMAN AL FIRDAUS;082337558075;
52;SAYYIDAH ATIKAH KHOIROTUN HISAN;JEMBER;BPK. MOH. JAZULI;082234658778;
53;SITI ANISA MULYANA NASYIFA;NGANJUK;BPK. KUSAINI;085808434359;
54;SITI FATIMAH;MOJOKERTO;BPK. SYAMSUL HUDA;081335708933;
55;SITI FATIMATUZ ZAHRO';TRENGGALEK;BPK. IMAM SYAFI'I;081914792249;
56;SITI NAFISAH;CIREBON;BPK. FAUZI;082319854354;
57;SITI NUR HASANAH;RIAU;BPK. HASANUN;085217046144;
58;SITI ZAKIYATUL MISKIYAH;KEDIRI;BPK. MUHAMMAD MUNAWIR;082131561730;
59;SU'DA NABILAH;CILACAP;BPK. KH. SAIFUL ANAM;082121823699;
60;TSINTA NURIYAH ARRIZQA;BOJONEGORO;BPK. BISRI;085232109608;
61;UMAMUL HABIBAH;PROBOLINGGO;BPK. AKSAN;082331512257;
62;VILUNA CHURUL AINI;KENDAL;BPK. M. MUHAJIRIN;085292923868;
63;YULI SULISTIANI;CIREBON;BPK. IMAM SAYUTI;082117723352;
64;ZILLA HUSNA LAILI;BLITAR;BPK. ZAENAL ABIDIN;085645875976;
"""

def clean_phone(hp):
    if not hp:
        return ""
    d = re.sub(r'[^0-9]', '', hp)
    return d

bil_ghoib_list = []
for line in bil_ghoib_raw.strip().split('\n'):
    line = line.strip()
    if not line:
        continue
    parts = line.split(';')
    if len(parts) >= 2 and parts[0].strip().isdigit():
        nama = parts[1].strip()
        alamat = parts[2].strip() if len(parts) > 2 else ""
        wali = parts[3].strip() if len(parts) > 3 else ""
        hp = parts[4].strip() if len(parts) > 4 else ""
        bil_ghoib_list.append({
            "nama": nama,
            "alamat": alamat,
            "namaWali": wali if wali else f"Wali {nama}",
            "noHp": clean_phone(hp),
            "kamar": "Hafidzah"
        })

print(f"Parsed Bil Ghoib: {len(bil_ghoib_list)} santri")

# Load existing 485 santri
with open("C:/Users/user/.gemini/antigravity/scratch/haflah-p3tq/scripts/parsed_santri.json", "r", encoding="utf-8") as f:
    existing_list = json.load(f)

# Gabungkan dengan aturan lintas kategori MAX (§3.1)
# Bil Ghoib ditempatkan di nomor urut pertama SH0001 - SH0064
# Bil Ghoib kuotaDasar = 4, tiketPanggungJatah = 1, warnaTiket = 'Hijau'
final_all_santri = []
sh_num = 1

for bg in bil_ghoib_list:
    code = f"SH{sh_num:04d}"
    sh_num += 1
    final_all_santri.append({
        "code": code,
        "nama": bg["nama"],
        "kategoriUtama": "BIL_GHOIB",
        "subKategori": "Bil Ghoib",
        "kelas": "Bil Ghoib",
        "kamar": bg["kamar"],
        "namaWali": bg["namaWali"],
        "alamat": bg["alamat"],
        "noHp": bg["noHp"],
        "kuotaDasar": 4, # 3 reguler + 1 panggung
        "tiketPanggungJatah": 1,
        "warnaTiket": "Hijau (+Emas Panggung)"
    })

# Tambahkan Bin Nadzori dan Tamatan
for ex in existing_list:
    code = f"SH{sh_num:04d}"
    sh_num += 1
    ex["code"] = code
    ex["tiketPanggungJatah"] = 0
    final_all_santri.append(ex)

print(f"TOTAL FINAL SEMUA SANTRI (3 KATEGORI): {len(final_all_santri)} santri")

with open("C:/Users/user/.gemini/antigravity/scratch/haflah-p3tq/scripts/all_santri_final.json", "w", encoding="utf-8") as f:
    json.dump(final_all_santri, f, ensure_ascii=False, indent=2)

# Generate lib/santri-data.ts
ts_content = """// =====================================================================
// MASTER DATA SANTRI RIIL: HAFLAH & HAUL P3TQ - MHMTQ 2026-2027
// Tiga Kategori Lengkap: Bil Ghoib (64), Bin Nadzori (159), Tamatan (326)
// Total = """ + str(len(final_all_santri)) + """ Santri Riil
// =====================================================================

export interface MasterSantri {
  code: string;
  nama: string;
  kategoriUtama: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';
  subKategori: string;
  kelas: string;
  kamar: string;
  namaWali: string;
  alamat: string;
  noHp: string;
  kuotaDasar: number;
  tiketPanggungJatah: number;
  warnaTiket: string;
}

export const REAL_SANTRI_LIST: MasterSantri[] = """ + json.dumps(final_all_santri, ensure_ascii=False, indent=2) + ";\n"

with open("C:/Users/user/.gemini/antigravity/scratch/haflah-p3tq/lib/santri-data.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Updated lib/santri-data.ts successfully!")
