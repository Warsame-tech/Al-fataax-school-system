const COLOR_MAP = {
  green:
    'bg-brand-green/10 text-brand-green border border-brand-green/20 dark:bg-brand-green/20 dark:text-green-400 dark:border-brand-green/30',
  gold:
    'bg-brand-gold/15 text-yellow-800 border border-brand-gold/30 dark:bg-brand-gold/20 dark:text-yellow-300 dark:border-brand-gold/40',
  red:
    'bg-status-error/10 text-status-error border border-status-error/20 dark:bg-status-error/20 dark:text-red-400 dark:border-status-error/30',
  neutral: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  blue: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
};

export default function Badge({ color = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${COLOR_MAP[color] || COLOR_MAP.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
