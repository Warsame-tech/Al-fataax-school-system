import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// html2canvas's CSS color parser predates modern CSS Color 4 syntax and
// cannot parse `oklch(...)`/`color-mix(...)` — which is exactly what
// Tailwind v4 emits for its default palette (grays, the badge colors, etc.)
// and for any `/opacity` utility (e.g. `bg-brand-red/5`). Left alone, this
// makes html2canvas hang indefinitely with no error. The fix: resolve every
// computed color to a plain rgb/rgba string (via a scratch <canvas> context,
// which *does* understand modern color syntax and normalizes it back out as
// rgb/rgba) and bake that in as an inline style — but only on html2canvas's
// *cloned*, offscreen copy of the DOM, so the real on-screen page is never
// touched.
let scratchCtx = null;
function resolveToRgb(value) {
  if (!value || value === 'transparent' || value === 'none') return value;
  try {
    if (!scratchCtx) scratchCtx = document.createElement('canvas').getContext('2d');
    scratchCtx.fillStyle = '#000000';
    scratchCtx.fillStyle = value;
    return scratchCtx.fillStyle;
  } catch {
    return value;
  }
}

const COLOR_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
];

function neutralizeModernColors(rootEl) {
  const elements = [rootEl, ...rootEl.querySelectorAll('*')];
  elements.forEach((el) => {
    const computed = window.getComputedStyle(el);
    COLOR_PROPS.forEach((prop) => {
      const value = computed[prop];
      if (value) el.style[prop] = resolveToRgb(value);
    });
    // box-shadow tokens can also carry oklch/color-mix stops; shadows are
    // purely decorative on these report documents, so just drop them rather
    // than trying to parse/rewrite the shadow color individually.
    if (computed.boxShadow && computed.boxShadow !== 'none') {
      el.style.boxShadow = 'none';
    }
  });
}

// Rasterizes a DOM element (the report block: banner + title bar + table)
// with html2canvas — this correctly captures Arabic text exactly as the
// browser rendered it, sidestepping any RTL text-shaping issues a text-based
// PDF API would run into — then places that image into an A4-sized jsPDF
// document, slicing across multiple pages if the content is taller than one
// page. Triggers a browser download via `.save()`.
//
// `foreignObjectRendering: true` opts into html2canvas's SVG-<foreignObject>
// rendering path instead of its default DOM-clone-into-hidden-iframe path.
// The default path reliably hangs forever (no error, no timeout) on current
// Chromium — it relies on the cloned iframe receiving paint/rAF callbacks,
// which Chromium's iframe visibility throttling no longer guarantees for an
// offscreen iframe. The foreignObject path renders through the browser's
// normal SVG pipeline instead and isn't subject to that.
export async function exportElementToPdf(element, filename = 'report.pdf') {
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    imageTimeout: 8000,
    foreignObjectRendering: true,
    onclone: (_clonedDoc, clonedElement) => {
      neutralizeModernColors(clonedElement);
    },
  });

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Scale the canvas to fill the PDF's page width, preserving aspect ratio.
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Slice the tall image across additional A4 pages by shifting it upward
  // (negative y) on each new page — the standard html2canvas+jsPDF pattern.
  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

export default exportElementToPdf;
