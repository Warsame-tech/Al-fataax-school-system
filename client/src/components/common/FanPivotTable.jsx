import EmptyState from './EmptyState';

/**
 * Groups religious books by their Fan and renders a pivot/matrix table:
 * one bold RTL column header per Fan, with that Fan's books listed
 * vertically underneath. Columns are ragged — a Fan with fewer books than
 * the tallest column simply has empty cells below its last book.
 *
 * `books`: array of book-like records, each with a nested `Fan: { id, name_ar }`.
 * `renderCell(book)`: renders a single cell's content (defaults to the book's Arabic name).
 */
export default function FanPivotTable({ books = [], renderCell, emptyMessage = 'No religious books found.' }) {
  if (!books || books.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const groups = [];
  const groupByFanId = new Map();
  books.forEach((book) => {
    const fanId = book.Fan?.id ?? book.fanId ?? 'unknown';
    const fanName = book.Fan?.name_ar ?? '—';
    if (!groupByFanId.has(fanId)) {
      const group = { fanId, fanName, books: [] };
      groupByFanId.set(fanId, group);
      groups.push(group);
    }
    groupByFanId.get(fanId).books.push(book);
  });

  const maxRows = Math.max(0, ...groups.map((g) => g.books.length));

  return (
    <div className="scroll-thin w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <table className="w-full min-w-max text-right text-sm" dir="rtl">
        <thead>
          <tr className="border-b border-gray-200 bg-brand-red/5 dark:border-gray-700 dark:bg-brand-red/10">
            {groups.map((g) => (
              <th
                key={g.fanId}
                className="whitespace-nowrap px-4 py-3 text-right font-bold text-brand-red dark:text-red-400"
              >
                {g.fanName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-gray-100 last:border-0 hover:bg-brand-gold-light/10 transition-colors dark:border-gray-700 dark:hover:bg-brand-gold/10"
            >
              {groups.map((g) => {
                const book = g.books[rowIndex];
                return (
                  <td key={g.fanId} className="px-4 py-2.5 align-middle text-gray-700 dark:text-gray-100">
                    {book ? (renderCell ? renderCell(book) : book.name_ar) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
