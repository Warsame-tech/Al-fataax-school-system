// Native, data-driven report export (PDF + Excel) — replaces the old
// html2canvas-based "screenshot the DOM" approach entirely.
//
// WHY: the previous PDF export rasterized the visible report element with
// html2canvas. That approach failed in two different ways across two
// configurations:
//   1. html2canvas's default DOM-clone-into-hidden-iframe renderer reliably
//      hangs forever on current Chromium (no error) — the offscreen iframe
//      never receives the paint/rAF callbacks html2canvas waits on, because
//      Chromium throttles rendering for iframes it considers not visible.
//   2. Switching to `foreignObjectRendering: true` (the previous fix for #1)
//      avoids the hang but is a well-known source of blank/white output:
//      browsers restrict what an SVG <foreignObject> capture can actually
//      rasterize (external stylesheets/fonts, certain layouts), so the
//      resulting canvas — and therefore the PDF — comes out empty.
// Both are upstream html2canvas limitations, not something fixable with a
// styling tweak. And an Excel export can never be produced by screenshotting
// a DOM element at all — it has to come from structured data regardless.
//
// So both problems share one real fix: build the PDF directly from the
// report's data using jsPDF's native drawing (vector text + jspdf-autotable
// for tables) instead of rasterizing anything, and build the Excel file
// from that same data with ExcelJS. No DOM, no CSS parsing, no iframe, no
// oklch/color-mix — none of those failure modes can occur.
//
// The one real complication native jsPDF text introduces: jsPDF has no
// Arabic text shaping (no bidi/ligature engine), and this app's stage/book
// names are Arabic (`name_ar`). Rendered as plain jsPDF text they'd come out
// as disconnected/reversed glyphs. So any Arabic string is instead rendered
// to a small canvas (the browser's own Canvas2D text layout *does* shape
// Arabic correctly) and embedded as an image at that cell's position —
// narrowly scoped to just that text run, not the whole page, so none of the
// html2canvas-era failure modes apply here either. Excel needs no such
// trick: spreadsheet apps render Unicode/Arabic text natively.
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import logoBannerUrl from '../assets/logo-banner.png';

const BRAND_RED = '#9E1B32';
const BRAND_RED_ARGB = 'FF9E1B32';
const TEXT_DARK = '#111827';
const LINE_GRAY = '#d1d5db';

// Loaded once and cached — this is the exact same banner image shown at the
// top of every report on screen (see MarksheetDocument in
// ResultsMarksheet.jsx). Re-rasterized through a canvas rather than used
// as-is so both jsPDF (needs a data URL or raw bytes) and ExcelJS (needs a
// base64 string) can embed it without a second network/import round trip.
let bannerImagePromise = null;
function loadBannerImage() {
  if (!bannerImagePromise) {
    bannerImagePromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = logoBannerUrl;
    });
  }
  return bannerImagePromise;
}

const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
function isArabic(value) {
  return typeof value === 'string' && ARABIC_RE.test(value);
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

// Rasterizes one short text run using the browser's own Canvas2D text
// layout (which shapes Arabic correctly, unlike jsPDF's vector text) at a
// supersampled resolution so it stays crisp when placed into the PDF.
const SCALE = 4;
function renderTextToImage(text, { fontSize = 10, bold = false, color = TEXT_DARK } = {}) {
  const font = `${bold ? 'bold ' : ''}${fontSize * SCALE}px "Segoe UI", Tahoma, Arial, sans-serif`;
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = font;
  const textWidth = Math.max(1, measure.measureText(text).width);

  const paddingX = 4 * SCALE;
  const widthPx = Math.ceil(textWidth) + paddingX * 2;
  const heightPx = Math.ceil(fontSize * SCALE * 1.7);

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, widthPx - paddingX, heightPx / 2);

  return { dataUrl: canvas.toDataURL('image/png'), widthPx, heightPx };
}

// Draws `text` at (x, y) — as real vector text if it's plain/Latin, or as a
// rasterized image if it contains Arabic (positioned per `align` the same
// way jsPDF's own text() alignment would: 'left' starts at x, 'right' ends
// at x, 'center' is centered on x).
function drawText(doc, text, x, y, { fontSize = 10, bold = false, color = TEXT_DARK, align = 'left' } = {}) {
  const str = displayValue(text);
  if (isArabic(str)) {
    const img = renderTextToImage(str, { fontSize, bold, color });
    const heightMm = fontSize / 2.5;
    const widthMm = (img.widthPx / img.heightPx) * heightMm;
    const drawX = align === 'right' ? x - widthMm : align === 'center' ? x - widthMm / 2 : x;
    doc.addImage(img.dataUrl, 'PNG', drawX, y - heightMm / 2, widthMm, heightMm);
    return widthMm;
  }
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color);
  doc.text(str, x, y, { align });
  return doc.getTextWidth(str);
}

/**
 * A "report" for export purposes — the single shape every report page
 * builds from its already-loaded state, consumed by both export functions
 * below:
 *   {
 *     title: string,
 *     meta?: [{ label, value }],                 // key/value block, e.g. student info
 *     sections: [{
 *       heading?: string,                         // e.g. "Ahmed Hassan (STD001)" — plain/English
 *       meta?: [{ label, value }],                 // e.g. Stage name — kept as separate label/value
 *                                                    // pairs (like the top-level `meta`) so an Arabic
 *                                                    // value is never concatenated into the same string
 *                                                    // as English text (that would defeat the per-run
 *                                                    // Arabic detection below).
 *       columns: [{ key, label }],                 // label may be Arabic or English
 *       rows: [{ [key]: value }],
 *       summary?: [{ label, value }],               // e.g. Total/Average/Grade
 *     }],
 *   }
 */
export async function exportReportToPdf(report, filename) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const bottomLimit = pageHeight - 16;
  let y = 0;

  const ensureSpace = (needed) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = 16;
    }
  };

  // Mirrors MarksheetDocument on screen exactly: the full-width banner
  // image, then a solid brand-red bar with the report title centered in
  // white — only on the first page, same as the single on-screen instance.
  const banner = await loadBannerImage().catch(() => null);
  if (banner) {
    const bannerHeightMm = (banner.height / banner.width) * pageWidth;
    doc.addImage(banner.dataUrl, 'PNG', 0, 0, pageWidth, bannerHeightMm);
    y = bannerHeightMm;
  }

  const titleBarHeight = 10;
  doc.setFillColor(BRAND_RED);
  doc.rect(0, y, pageWidth, titleBarHeight, 'F');
  drawText(doc, report.title, pageWidth / 2, y + titleBarHeight / 2 + 1.5, {
    fontSize: 13,
    bold: true,
    color: '#ffffff',
    align: 'center',
  });
  y += titleBarHeight + 10;

  const drawMetaBlock = (meta) => {
    meta.forEach((m) => {
      ensureSpace(7);
      const labelWidth = drawText(doc, `${m.label}: `, marginX, y, { fontSize: 10, bold: true, color: '#374151' });
      drawText(doc, m.value, marginX + labelWidth + 1, y, { fontSize: 10, color: TEXT_DARK });
      y += 6;
    });
  };

  if (report.meta?.length) {
    drawMetaBlock(report.meta);
    y += 3;
  }

  (report.sections || []).forEach((section) => {
    if (section.heading) {
      ensureSpace(10);
      drawText(doc, section.heading, marginX, y, { fontSize: 11, bold: true, color: BRAND_RED });
      y += 7;
    }
    if (section.meta?.length) {
      drawMetaBlock(section.meta);
      y += 2;
    }

    const columns = section.columns || [];
    const body = (section.rows || []).map((row) => columns.map((c) => row[c.key]));

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [columns.map((c) => c.label)],
      body,
      styles: { font: 'helvetica', fontSize: 9, textColor: TEXT_DARK, lineColor: LINE_GRAY, lineWidth: 0.1, cellPadding: 2.2 },
      headStyles: { fillColor: BRAND_RED, textColor: '#ffffff', fontStyle: 'bold' },
      alternateRowStyles: { fillColor: '#f9fafb' },
      didParseCell: (data) => {
        if (data.section !== 'body') return;
        if (isArabic(displayValue(data.cell.raw))) {
          data.cell.text = []; // suppress jsPDF's own (unshaped) glyph drawing
        }
      },
      didDrawCell: (data) => {
        if (data.section !== 'body') return;
        const raw = displayValue(data.cell.raw);
        if (!isArabic(raw)) return;
        const img = renderTextToImage(raw, { fontSize: 9 });
        const cellHeightMm = data.cell.height;
        const heightMm = Math.min(cellHeightMm - 2, 4.2);
        const widthMm = (img.widthPx / img.heightPx) * heightMm;
        const x = data.cell.x + data.cell.width - widthMm - 2;
        const imgY = data.cell.y + (cellHeightMm - heightMm) / 2;
        doc.addImage(img.dataUrl, 'PNG', x, imgY, widthMm, heightMm);
      },
    });

    y = doc.lastAutoTable.finalY + 6;

    if (section.summary?.length) {
      ensureSpace(9);
      let x = marginX;
      section.summary.forEach((s) => {
        const labelWidth = drawText(doc, `${s.label}: `, x, y, { fontSize: 10, bold: true, color: '#374151' });
        x += labelWidth;
        const valueWidth = drawText(doc, s.value, x, y, { fontSize: 10, bold: true, color: TEXT_DARK });
        x += valueWidth + 8;
      });
      y += 10;
    }
  });

  doc.save(filename);
}

export async function exportReportToExcel(report, filename) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Report', { views: [{ rightToLeft: false }] });

  // Column count is needed up front to merge the banner/title bar across
  // the full table width, so it's computed before any rows are added.
  let maxCols = 2;
  (report.sections || []).forEach((section) => {
    maxCols = Math.max(maxCols, (section.columns || []).length);
  });
  const lastColLetter = sheet.getColumn(maxCols).letter;

  // Mirrors MarksheetDocument on screen: the same banner image, then a
  // solid brand-red bar with the report title centered in white.
  const banner = await loadBannerImage().catch(() => null);
  if (banner) {
    const targetWidthPx = 760;
    const heightPx = (banner.height / banner.width) * targetWidthPx;
    const imageId = workbook.addImage({ base64: banner.dataUrl, extension: 'png' });
    sheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: targetWidthPx, height: heightPx } });
    const bannerRows = Math.max(1, Math.ceil(heightPx / 20));
    for (let i = 0; i < bannerRows; i += 1) sheet.addRow([]);
  }

  const titleRow = sheet.addRow([report.title]);
  sheet.mergeCells(`A${titleRow.number}:${lastColLetter}${titleRow.number}`);
  titleRow.height = 22;
  titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_RED_ARGB } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.addRow([]);

  if (report.meta?.length) {
    report.meta.forEach((m) => {
      const row = sheet.addRow([m.label, displayValue(m.value)]);
      row.getCell(1).font = { bold: true };
    });
    sheet.addRow([]);
  }

  (report.sections || []).forEach((section) => {
    if (section.heading) {
      const headingRow = sheet.addRow([section.heading]);
      headingRow.font = { bold: true, size: 12, color: { argb: 'FF9E1B32' } };
    }
    if (section.meta?.length) {
      section.meta.forEach((m) => {
        const row = sheet.addRow([m.label, displayValue(m.value)]);
        row.getCell(1).font = { bold: true };
      });
    }

    const columns = section.columns || [];

    const headerRow = sheet.addRow(columns.map((c) => c.label));
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9E1B32' } };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    (section.rows || []).forEach((row) => {
      const dataRow = sheet.addRow(columns.map((c) => displayValue(row[c.key])));
      dataRow.eachCell((cell) => {
        cell.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
      });
    });

    if (section.summary?.length) {
      section.summary.forEach((s) => {
        const row = sheet.addRow([s.label, s.value]);
        row.getCell(1).font = { bold: true };
        row.getCell(2).font = { bold: true };
      });
    }

    sheet.addRow([]);
  });

  sheet.columns = Array.from({ length: maxCols }, () => ({ width: 22 }));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
