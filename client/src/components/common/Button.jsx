const VARIANTS = {
  primary:
    'bg-brand-red text-white hover:bg-brand-red-dark focus-visible:ring-brand-gold disabled:bg-brand-red/50',
  secondary:
    'bg-brand-green text-white hover:bg-brand-green-dark focus-visible:ring-brand-gold disabled:bg-brand-green/50',
  outline:
    'bg-white text-brand-red border border-brand-red hover:bg-brand-red/5 focus-visible:ring-brand-gold dark:bg-gray-800 dark:text-red-400 dark:border-red-400 dark:hover:bg-brand-red/10',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-brand-gold dark:text-gray-300 dark:hover:bg-gray-700',
  danger:
    'bg-status-error text-white hover:bg-red-700 focus-visible:ring-red-400 disabled:bg-status-error/50',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-60
        ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    />
  );
}
