export default function EmptyState({ message = 'No records found', icon = null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400 dark:text-gray-500">
      {icon || (
        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 13h6m-6-4h6m2 9H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V18a2 2 0 01-2 2z"
          />
        </svg>
      )}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
