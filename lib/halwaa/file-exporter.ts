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
 * Membersihkan teks dokumen dari tag sistem dan kalimat penutup basa-basi (misal "Semoga susunan ini...", "Demikian...", "Semoga bermanfaat...")
 */
export function cleanDocumentText(rawText: string): string {
  let cleaned = rawText
    .replace(/\[DOWNLOAD_.*?\]/gi, '')
    .replace(/!\[.*?\]\(.*?\)/gi, '')
    .replace(/Ada lagi info kepanitiaan.*?(\n|$)/gi, '')
    .replace(/\bWonten malih ingkang saget kula bantu.*?(\n|$)/gi, '')
    .trim();

  // Pisahkan per paragraf (blok teks dipisahkan oleh 2 baris baru atau lebih)
  const paragraphs = cleaned.split(/\n\s*\n/);

  // Buang paragraf terakhir jika merupakan kalimat penutup basa-basi
  while (paragraphs.length > 1) {
    const lastP = paragraphs[paragraphs.length - 1].trim();
    const isClosing =
      /^(semoga\s+(?:susunan|informasi|data|jawaban|bantuan|jadwal|berkas|hal|ini|bermanfaat|membantu)|demikian\b|apabila\s+ada|jika\s+ada|silakan\s+(?:tanyakan|hubungi)|ada\s+lagi\s+info|wonten\s+malih)/i.test(
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
      /\n\s*(?:semoga\s+(?:susunan|informasi|data|jawaban|bantuan|jadwal|berkas|hal|ini|bermanfaat|membantu)|demikian\b|apabila\s+ada|jika\s+ada|ada\s+lagi\s+info|wonten\s+malih)[\s\S]*$/i,
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
            .map((cell) => cell.trim().replace(/\*\*(.*?)\*\*/g, '$1'));
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

    const cleanTitle = title || 'Dokumen Haflah P3TQ & MHMTQ';
    const cleanFilename = (filename || cleanTitle.replace(/[^a-zA-Z0-9_-]/g, '_')) + '.pdf';

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

    // Body content
    const cleanContent = cleanDocumentText(content);
    const blocks = parseMarkdownContent(cleanContent);

    let y = 38;
    const pageHeight = doc.internal.pageSize.height;

    for (const block of blocks) {
      if (block.type === 'text' && block.text) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(45, 27, 14);

        const cleanText = block.text.replace(/\*\*(.*?)\*\*/g, '$1');
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
      // Spasi 5 baris kosong (setara y += 30) dari teks/tabel terakhir
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
      const cleanMotivasi = `"${motivasiParagraf.trim()}"`;

      // Render motivasi dengan rata kanan-kiri (justify) dan maxWidth 180
      doc.text(cleanMotivasi, 15, y, { align: 'justify', maxWidth: 180 });
    }

    doc.save(cleanFilename);
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
    const cleanFilename = (filename || 'Rekap_Data_Haflah') + '.xlsx';
    saveAs(blob, cleanFilename);
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
    const cleanTitle = title || 'Dokumen Haflah P3TQ & MHMTQ';
    const cleanFilename = (filename || cleanTitle.replace(/[^a-zA-Z0-9_-]/g, '_')) + '.docx';

    // Hapus markdown tag & kalimat penutup yang tidak perlu
    const cleanContent = cleanDocumentText(content);

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
    saveAs(blob, cleanFilename);
  } catch (err) {
    console.error('Error exporting DOCX:', err);
    alert('Gagal mengunduh file Word.');
  }
}
