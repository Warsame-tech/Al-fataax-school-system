import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

/**
 * Generic table.
 * columns: [{ key, header, render?(row) }]
 */
export default function DataTable({
  columns,
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  rowKey = 'id',
}) {
  if (loading) return <LoadingState />;
  if (!data || data.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div className="scroll-thin w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 font-semibold text-brand-red dark:text-red-400"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row[rowKey]}
              className="border-b border-gray-100 last:border-0 hover:bg-brand-gold-light/10 transition-colors dark:border-gray-700 dark:hover:bg-brand-gold/10"
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-100">
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
