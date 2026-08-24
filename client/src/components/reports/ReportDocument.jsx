import { MarksheetDocument } from '../results/ResultsMarksheet';

// Thin re-export: every report in this app (results marksheets and the
// Teachers/Students/Books rosters alike) shares the exact same "official
// document" banner + brand-red title bar treatment, so they all reuse the
// one underlying component rather than each inventing their own wrapper.
export default function ReportDocument({ title, children, innerRef }) {
  return (
    <MarksheetDocument title={title} innerRef={innerRef}>
      {children}
    </MarksheetDocument>
  );
}
