'use client';

import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

const DEFAULT_FALLBACK_MOTIVASI =
  'Setiap langkah perjuangan dan tetes keringat dalam menyukseskan Haul & Haflah P3TQ dan MHMTQ adalah untaian amal jariyah yang bernilai mulia. Tetaplah istiqomah dan ikhlas melayani, sebab keberkahan senantiasa menyertai hati yang tulus berkhidmah.';

/**
 * Mengambil kalimat motivasi islami segar via endpoint /api/motivasi-fresh
 */
export async function fetchFreshMotivasi(context: string): Promise<string> {
  try {
    const res = await fetch('/api/motivasi-fresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ konteks: context }),
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
 * Membersihkan teks dokumen dari tag sistem dan kalimat penutup wajib yang tidak diperlukan di dokumen
 */
function cleanDocumentText(rawText: string): string {
  return rawText
    .replace(/\[DOWNLOAD_.*?\]/gi, '')
    .replace(/!\[.*?\]\(.*?\)/gi, '')
    .replace(/Ada lagi info kepanitiaan.*?(\n|$)/gi, '')
    .replace(/\bWonten malih ingkang saget kula bantu.*?(\n|$)/gi, '')
    .trim();
}

/**
 * Ekspor teks ke file PDF (.pdf) menggunakan jsPDF dan file-saver
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
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(45, 27, 14);

    // Hapus markdown tag & frasa penutup yang tidak perlu untuk PDF
    const cleanContent = cleanDocumentText(content).replace(/\*\*(.*?)\*\*/g, '$1');

    const splitText = doc.splitTextToSize(cleanContent, 180);
    let y = 38;
    const pageHeight = doc.internal.pageSize.height;

    for (let i = 0; i < splitText.length; i++) {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(splitText[i], 15, y);
      y += 6;
    }

    // Render Kalimat Motivasi Dinamis di Bagian Bawah
    if (motivasiParagraf && motivasiParagraf.trim().length > 0) {
      if (y > pageHeight - 35) {
        doc.addPage();
        y = 20;
      }
      y += 4;
      doc.setDrawColor(213, 196, 180);
      doc.setLineWidth(0.3);
      doc.line(15, y, 195, y);
      y += 6;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(140, 106, 71); // #8C6A47
      const cleanMotivasi = `"${motivasiParagraf.trim()}"`;
      const splitMotivasi = doc.splitTextToSize(cleanMotivasi, 180);

      for (let i = 0; i < splitMotivasi.length; i++) {
        if (y > pageHeight - 15) {
          doc.addPage();
          y = 20;
        }
        doc.text(splitMotivasi[i], 15, y);
        y += 5;
      }
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
