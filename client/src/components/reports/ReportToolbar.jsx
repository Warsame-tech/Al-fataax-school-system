import Button from '../common/Button';

// Print/Download controls shared by every report page. Marked `no-print` so
// it disappears from both the browser print output and the PDF (which
// rasterizes only the report document element, not this toolbar).
export default function ReportToolbar({ onDownload, downloading, disabled = false }) {
  return (
    <div className="no-print mb-4 flex flex-wrap justify-end gap-3">
      <Button variant="outline" onClick={() => window.print()} disabled={disabled}>
        Print
      </Button>
      <Button onClick={onDownload} disabled={disabled || downloading}>
        {downloading ? 'Generating PDF...' : 'Download PDF'}
      </Button>
    </div>
  );
}
