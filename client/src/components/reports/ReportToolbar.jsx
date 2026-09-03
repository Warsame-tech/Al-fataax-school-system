import Button from '../common/Button';

// Print/Download controls shared by every report page. Marked `no-print` so
// it disappears from both the browser print output and the exported files.
export default function ReportToolbar({
  onDownloadPdf,
  onDownloadExcel,
  downloadingPdf = false,
  downloadingExcel = false,
  disabled = false,
}) {
  return (
    <div className="no-print mb-4 flex flex-wrap justify-end gap-3">
      <Button variant="outline" onClick={() => window.print()} disabled={disabled}>
        Print
      </Button>
      <Button variant="outline" onClick={onDownloadExcel} disabled={disabled || downloadingExcel}>
        {downloadingExcel ? 'Generating Excel...' : 'Download Excel'}
      </Button>
      <Button onClick={onDownloadPdf} disabled={disabled || downloadingPdf}>
        {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
      </Button>
    </div>
  );
}
