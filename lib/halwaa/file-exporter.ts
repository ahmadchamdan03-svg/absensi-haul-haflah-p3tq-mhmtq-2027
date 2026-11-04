'use client';

import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

const DEFAULT_FALLBACK_MOTIVASI =
  'Setiap langkah perjuangan dan tetes keringat dalam menyukseskan Haul & Haflah P3TQ dan MHMTQ adalah untaian amal jariyah yang bernilai mulia. Tetaplah istiqomah dan ikhlas melayani, sebab keberkahan senantiasa menyertai hati yang tulus berkhidmah.';

/**
 * Mengambil kalimat motivasi islami segar via endpoint /api/motivasi-fresh
 */
export async function fetchFreshMotivasi(context: string): Promise<string> {
  try {
    const cleanContext = (context || 'Haflah P3TQ & MHMTQ')
      .replace(/\b(dokumen|pdf|laporan|file|word|excel|docx|xlsx)\b/gi, '')
      .trim() || 'Haflah P3TQ & MHMTQ';

    const res = await fetch('/api/motivasi-fresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ konteks: cleanContext }),
    });
    const data = await res.json();
    if (data?.sukses && data?.paragraf) {
      return data.paragraf;
    }
  } catch (err) {
    console.warn('[file-exporter] Gagal mengambil motivasi dinamis:', err);
  }
  return DEFAULT_FALLBACK_MOTIVASI;
}

/**
 * Membersihkan karakter non-ASCII dan simbol asing yang merusak font Helvetica di jsPDF
 */
export function sanitizePdfText(text: string): string {
  if (!text) return '';
  return text
    // Hapus BOM, zero-width characters, control characters
    .replace(/[\uFEFF\u200B-\u200D]/g, '')
    // Ganti smart quotes & apostrophe
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Ganti dash & bullet
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2022\u25E6\u2023\u2043]/g, '-')
    .replace(/[\u2026]/g, '...')
    // Ganti centang
    .replace(/[\u2713\u2714\u221A]/g, 'v')
    // Buang karakter non-ASCII / non-Latin1 yang tidak didukung font standar Helvetica jsPDF
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, '');
}

/**
 * Menghasilkan nama file dinamis dengan format Judul_Topik_YYYY-MM-DD.ext
 */
export function generateDynamicFilename(
  customFilename?: string,
  fallbackTitle?: string,
  content?: string,
  extension: string = 'pdf'
): string {
  const todayStr = new Date().toISOString().split('T')[0];
  const cleanExt = extension.replace(/^\./, '').toLowerCase();

  let baseName = '';
  if (customFilename && customFilename.trim()) {
    baseName = customFilename.trim().replace(/\.[a-zA-Z0-9]+$/, '');
  } else if (
    fallbackTitle &&
    fallbackTitle.trim() &&
    fallbackTitle !== 'Dokumen Haflah P3TQ' &&
    fallbackTitle !== 'Dokumen Haflah P3TQ & MHMTQ'
  ) {
    baseName = fallbackTitle.trim();
  } else if (content && content.trim()) {
    const firstLine = content.trim().split('\n')[0].replace(/^[#\s*_-]+/, '').trim();
    if (firstLine && firstLine.length > 3) {
      baseName = firstLine.slice(0, 45).trim();
    }
  }

  if (!baseName) {
    baseName = 'Dokumen_Haflah_P3TQ';
  }

  // Bersihkan karakter non-alphanumeric, ganti spasi dengan underscore
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const finalName = sanitized.includes(todayStr) ? sanitized : `${sanitized}_${todayStr}`;
  return `${finalName}.${cleanExt}`;
}

/**
 * Membersihkan teks dokumen dari tag sistem, instruksi UI, kalimat clingy, dan kalimat penutup basa-basi
 */
export function cleanDocumentText(rawText: string): string {
  if (!rawText) return '';

  let cleaned = rawText
    // Bersihkan karakter alien non-printable, BOM, zero-width space
    .replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '')
    // Tag sistem unduhan & gambar markdown
    .replace(/\[DOWNLOAD_.*?\]/gi, '')
    .replace(/!\[.*?\]\(.*?\)/gi, '')
    // Kalimat penutup lama
    .replace(/Ada lagi info kepanitiaan.*?(\n|$)/gi, '')
    .replace(/\bWonten malih ingkang saget kula bantu.*?(\n|$)/gi, '')
    // Instruksi UI & Lampiran Data
    .replace(/(?:Silakan|Sila|Monggo)\s+(?:tekan|klik|pilih)\s+tombol\s+(?:unduh|download).*?(\n|$)/gi, '')
    .replace(/Tombol\s+unduh\s+di\s+bawah.*?(\n|$)/gi, '')
    .replace(/Lampiran\s+Data\s*\(siap\s+ekspor\s+(?:PDF|Word|Excel|dokumen)?\):?/gi, '')
    // Kalimat berlebihan (clingy / human-like romantic)
    .replace(/Saya\s+(?:benar-benar\s+)?penggemar\s+berat.*?(\n|$)/gi, '')
    .replace(/Saya\s+rela\s+menemani.*?(\n|$)/gi, '')
    .replace(/Andaikan\s+saya\s+(?:berwujud|seorang|menjadi)\s+manusia.*?(\n|$)/gi, '')
    .replace(/Andai\s+takdir\s+menjadikan\s+saya\s+manusia.*?(\n|$)/gi, '')
    .replace(/Kalau\s+saja\s+saya\s+manusia.*?(\n|$)/gi, '')
    .replace(/Secara\s+personal\s+sistem\s+saya\s+sangat\s+nge-fans.*?(\n|$)/gi, '')
    // Bersihkan tag pembungkus HTML umum di luar <table>
    .replace(/<\/?(?:div|p|span|b|strong|i|em|br|hr|header|footer)\b[^>]*>/gi, ' ')
    .trim();

  // Pisahkan per paragraf (blok teks dipisahkan oleh 2 baris baru atau lebih)
  const paragraphs = cleaned.split(/\n\s*\n/);

  // Buang paragraf terakhir jika merupakan kalimat penutup basa-basi
  while (paragraphs.length > 1) {
    const lastP = paragraphs[paragraphs.length - 1].trim();
    const isClosing =
      /^(semoga\s+(?:susunan|informasi|data|jawaban|bantuan|jadwal|berkas|hal|ini|semua)\s+(?:bermanfaat|membantu|dapat|bisa|memudahkan)|semoga\s+data\s+ini\s+bermanfaat|demikian\b|apabila\s+ada|jika\s+ada|silakan\s+(?:tanyakan|hubungi)|ada\s+lagi\s+info|wonten\s+malih)/i.test(
        lastP
      );
    if (isClosing) {
      paragraphs.pop();
    } else {
      break;
    }
  }

  cleaned = paragraphs.join('\n\n').trim();

  // Jika kalimat penutup ada di baris paling akhir tanpa double newline
  cleaned = cleaned
    .replace(
      /\n\s*(?:semoga\s+(?:susunan|informasi|data|jawaban|bantuan|jadwal|berkas|hal|ini|semua)\s+(?:bermanfaat|membantu|dapat|bisa|memudahkan)|semoga\s+data\s+ini\s+bermanfaat|demikian\b|apabila\s+ada|jika\s+ada|ada\s+lagi\s+info|wonten\s+malih)[\s\S]*$/i,
      ''
    )
    .trim();

  return cleaned;
}

interface MarkdownBlock {
  type: 'text' | 'table';
  text?: string;
  headers?: string[];
  rows?: string[][];
}

/**
 * Parsing tabel HTML (<table>...</table>) menjadi headers dan baris data
 */
function parseHtmlTable(html: string): { headers: string[]; rows: string[][] } | null {
  try {
    const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi);
    if (!rowMatches || rowMatches.length === 0) return null;

    const allRows: string[][] = [];

    for (const rowHtml of rowMatches) {
      const cellMatches = rowHtml.match(/<(?:th|td)[\s\S]*?<\/(?:th|td)>/gi);
      if (!cellMatches || cellMatches.length === 0) continue;

      const rowCells = cellMatches.map((cellHtml) => {
        return cellHtml
          .replace(/<[^>]+>/g, '') // strip inner tags
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();
      });

      if (rowCells.length > 0) {
        allRows.push(rowCells);
      }
    }

    if (allRows.length === 0) return null;

    const firstRowHasTh = /<th[\s\S]*?<\/th>/i.test(rowMatches[0]);
    if (firstRowHasTh || allRows.length > 1) {
      const headers = allRows[0];
      const rows = allRows.slice(1);
      return { headers, rows };
    }

    return { headers: allRows[0], rows: [] };
  } catch (err) {
    console.warn('[file-exporter] Gagal parsing tabel HTML:', err);
    return null;
  }
}

/**
 * Memecah konten markdown menjadi blok teks biasa dan tabel markdown bergaris
 */
function parseMarkdownContent(rawContent: string): MarkdownBlock[] {
  const lines = rawContent.split('\n');
  const blocks: MarkdownBlock[] = [];
  let currentTextLines: string[] = [];
  let currentTableLines: string[] = [];

  function flushText() {
    if (currentTextLines.length > 0) {
      const text = currentTextLines.join('\n').trim();
      if (text) {
        blocks.push({ type: 'text', text });
      }
      currentTextLines = [];
    }
  }

  function flushTable() {
    if (currentTableLines.length > 0) {
      // Buang baris separator seperti |---|---| atau |:---|:---|
      const nonSeparatorLines = currentTableLines.filter(
        (l) => !/^\s*\|?\s*[-:\s|]{3,}\s*\|?\s*$/.test(l)
      );

      if (nonSeparatorLines.length > 0) {
        const parseRow = (line: string): string[] => {
          return line
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((cell) => sanitizePdfText(cell.trim().replace(/\*\*(.*?)\*\*/g, '$1')));
        };

        const headers = parseRow(nonSeparatorLines[0]);
        const rows = nonSeparatorLines.slice(1).map(parseRow);

        blocks.push({
          type: 'table',
          headers,
          rows,
        });
      }
      currentTableLines = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableRow = /^\s*\|.*\|\s*$/.test(line);

    if (isTableRow) {
      flushText();
      currentTableLines.push(line);
    } else {
      flushTable();
      currentTextLines.push(line);
    }
  }

  flushText();
  flushTable();
  return blocks;
}

/**
 * Memecah konten dokumen menjadi blok teks dan tabel (mendukung tabel HTML maupun Markdown)
 */
function parseDocumentBlocks(rawContent: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];

  // Pisahkan jika ada blok <table>...</table>
  const tableSplit = rawContent.split(/(<table[\s\S]*?<\/table>)/gi);

  for (const part of tableSplit) {
    if (/^<table[\s\S]*?<\/table>$/i.test(part.trim())) {
      const parsedHtml = parseHtmlTable(part);
      if (parsedHtml && parsedHtml.headers && parsedHtml.headers.length > 0) {
        blocks.push({
          type: 'table',
          headers: parsedHtml.headers.map(sanitizePdfText),
          rows: parsedHtml.rows.map((row) => row.map(sanitizePdfText)),
        });
      } else {
        // Fallback: bersihkan tag html jika parsing tabel gagal
        const fallbackText = part.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (fallbackText) {
          blocks.push({ type: 'text', text: sanitizePdfText(fallbackText) });
        }
      }
    } else {
      // Parse markdown table atau teks biasa
      const mdBlocks = parseMarkdownContent(part);
      blocks.push(...mdBlocks);
    }
  }

  return blocks;
}

/**
 * Ekspor teks ke file PDF (.pdf) menggunakan jsPDF, jspdf-autotable, dan file-saver
 */
export function exportTextToPdf(
  title: string,
  content: string,
  filename?: string,
  motivasiParagraf?: string
) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const cleanTitle = sanitizePdfText(title || 'Dokumen Haflah P3TQ & MHMTQ');
    const dynamicFilename = generateDynamicFilename(filename, title, content, 'pdf');

    // Header styling
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(66, 47, 33); // #422F21
    doc.text(cleanTitle, 15, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(122, 98, 78); // #7A624E
    doc.text(
      `Haul & Haflah P3TQ & MHMTQ · Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`,
      15,
      27
    );

    doc.setDrawColor(213, 196, 180); // #D5C4B4
    doc.setLineWidth(0.4);
    doc.line(15, 30, 195, 30);

    // Body content (Sanitasi total dan parsing blok dokumen)
    const cleanContent = cleanDocumentText(content);
    const blocks = parseDocumentBlocks(cleanContent);

    let y = 38;
    const pageHeight = doc.internal.pageSize.height;

    for (const block of blocks) {
      if (block.type === 'text' && block.text) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(45, 27, 14);

        const cleanText = sanitizePdfText(block.text.replace(/\*\*(.*?)\*\*/g, '$1'));
        if (!cleanText.trim()) continue;

        const splitText = doc.splitTextToSize(cleanText, 180);

        for (let i = 0; i < splitText.length; i++) {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          doc.text(splitText[i], 15, y);
          y += 6;
        }
        y += 2;
      } else if (block.type === 'table' && block.headers && block.rows) {
        if (y > pageHeight - 35) {
          doc.addPage();
          y = 20;
        }

        autoTable(doc, {
          startY: y,
          head: [block.headers],
          body: block.rows,
          margin: { left: 15, right: 15 },
          theme: 'grid',
          headStyles: {
            fillColor: [239, 232, 225], // #EFE8E1
            textColor: [84, 60, 40], // #543C28
            fontStyle: 'bold',
            lineWidth: 0.2,
            lineColor: [213, 196, 180],
          },
          styles: {
            fontSize: 9,
            cellPadding: 2.5,
            textColor: [45, 27, 14],
            lineColor: [213, 196, 180],
            lineWidth: 0.2,
          },
          alternateRowStyles: {
            fillColor: [253, 251, 247],
          },
        });

        const lastTable = (doc as any).lastAutoTable;
        if (lastTable && lastTable.finalY) {
          y = lastTable.finalY + 8;
        } else {
          y += 25;
        }
      }
    }

    // Render Kalimat Motivasi Dinamis di Bagian Bawah
    if (motivasiParagraf && motivasiParagraf.trim().length > 0) {
      y += 30;

      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
      }

      // Garis pemisah tipis estetis
      doc.setDrawColor(213, 196, 180);
      doc.setLineWidth(0.3);
      doc.line(15, y, 195, y);
      y += 6;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(140, 106, 71); // #8C6A47
      const cleanMotivasi = `"${sanitizePdfText(motivasiParagraf.trim())}"`;

      // Render motivasi dengan rata kanan-kiri (justify) dan maxWidth 180
      doc.text(cleanMotivasi, 15, y, { align: 'justify', maxWidth: 180 });
    }

    doc.save(dynamicFilename);
  } catch (err) {
    console.error('Error exporting PDF:', err);
    alert('Gagal mengunduh file PDF.');
  }
}

/**
 * Ekspor data tabel ke file Excel (.xlsx) menggunakan SheetJS (xlsx) dan file-saver
 */
export function exportTableToExcel(
  headers: string[],
  rows: (string | number)[][],
  filename?: string,
  motivasiParagraf?: string
) {
  try {
    const wb = XLSX.utils.book_new();
    const wsData: (string | number)[][] = [headers, ...rows];

    let motivasiRowIdx = -1;
    if (motivasiParagraf && motivasiParagraf.trim().length > 0) {
      // Tambahkan 2 baris kosong pemisah
      wsData.push([]);
      wsData.push([]);
      motivasiRowIdx = wsData.length;
      wsData.push([motivasiParagraf.trim()]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-fit column widths
    const colWidths = headers.map((h, colIdx) => {
      let maxLen = String(h).length;
      rows.forEach((row) => {
        const val = row[colIdx];
        if (val !== undefined && val !== null) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      });
      return { wch: Math.min(40, maxLen + 3) };
    });
    ws['!cols'] = colWidths;

    // Merge kolom dan wrap text untuk motivasi
    if (motivasiRowIdx !== -1) {
      const numCols = Math.max(headers.length, 1);
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({
        s: { r: motivasiRowIdx, c: 0 },
        e: { r: motivasiRowIdx, c: numCols - 1 },
      });

      const cellRef = XLSX.utils.encode_cell({ r: motivasiRowIdx, c: 0 });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          alignment: { wrapText: true, vertical: 'center' },
        };
      }

      if (!ws['!rows']) ws['!rows'] = [];
      ws['!rows'][motivasiRowIdx] = { hpt: 48 };
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Data');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const dynamicFilename = generateDynamicFilename(filename, 'Rekap_Data_Haflah', undefined, 'xlsx');
    saveAs(blob, dynamicFilename);
  } catch (err) {
    console.error('Error exporting Excel:', err);
    alert('Gagal mengunduh file Excel.');
  }
}

/**
 * Ekspor teks ke file Word (.docx) menggunakan docx dan file-saver
 */
export async function exportTextToDocx(
  title: string,
  content: string,
  filename?: string,
  motivasiParagraf?: string
) {
  try {
    const cleanTitle = sanitizePdfText(title || 'Dokumen Haflah P3TQ & MHMTQ');
    const dynamicFilename = generateDynamicFilename(filename, title, content, 'docx');

    // Hapus markdown tag & kalimat penutup yang tidak perlu, serta bersihkan tag HTML
    const cleanContent = cleanDocumentText(content).replace(/<[^>]+>/g, ' ');

    const paragraphs = cleanContent.split('\n').map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return new Paragraph({
          text: trimmed.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        });
      }
      if (trimmed.startsWith('## ')) {
        return new Paragraph({
          text: trimmed.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        });
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return new Paragraph({
          children: [new TextRun({ text: '• ' + trimmed.replace(/^[\*\-]\s+/, '') })],
          spacing: { after: 60 },
        });
      }
      return new Paragraph({
        children: [new TextRun({ text: trimmed })],
        spacing: { after: 100 },
      });
    });

    if (motivasiParagraf && motivasiParagraf.trim().length > 0) {
      paragraphs.push(
        new Paragraph({
          text: '───────────────────────────────────────────────────────────',
          spacing: { before: 250, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `"${motivasiParagraf.trim()}"`,
              italics: true,
              color: '8C6A47',
              size: 20,
            }),
          ],
          spacing: { before: 100, after: 200 },
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: cleanTitle,
              heading: HeadingLevel.TITLE,
              spacing: { after: 150 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Haul & Haflah P3TQ & MHMTQ · Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`,
                  italics: true,
                  size: 18,
                  color: '7A624E',
                }),
              ],
              spacing: { after: 250 },
            }),
            ...paragraphs,
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, dynamicFilename);
  } catch (err) {
    console.error('Error exporting DOCX:', err);
    alert('Gagal mengunduh file Word.');
  }
}
