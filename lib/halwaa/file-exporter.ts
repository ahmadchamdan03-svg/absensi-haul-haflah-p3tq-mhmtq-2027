'use client';

import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

/**
 * Ekspor teks ke file PDF (.pdf) menggunakan jsPDF dan file-saver
 */
export function exportTextToPdf(title: string, content: string, filename?: string) {
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

    // Hapus markdown tag yang tidak perlu untuk PDF
    const cleanContent = content
      .replace(/\[DOWNLOAD_.*?\]/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1');

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

    doc.save(cleanFilename);
  } catch (err) {
    console.error('Error exporting PDF:', err);
    alert('Gagal mengunduh file PDF.');
  }
}

/**
 * Ekspor data tabel ke file Excel (.xlsx) menggunakan SheetJS (xlsx) dan file-saver
 */
export function exportTableToExcel(headers: string[], rows: (string | number)[][], filename?: string) {
  try {
    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...rows];
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
export async function exportTextToDocx(title: string, content: string, filename?: string) {
  try {
    const cleanTitle = title || 'Dokumen Haflah P3TQ & MHMTQ';
    const cleanFilename = (filename || cleanTitle.replace(/[^a-zA-Z0-9_-]/g, '_')) + '.docx';

    // Hapus markdown tag yang tidak perlu untuk docx
    const cleanContent = content
      .replace(/\[DOWNLOAD_.*?\]/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '');

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
