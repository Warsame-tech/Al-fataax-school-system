export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500 dark:text-gray-400">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-gold/30 border-t-brand-red" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
