export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  disabled = false,
  min,
  max,
  step,
  autoComplete,
  hint,
  dir,
  inputClassName = '',
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-status-error"> *</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        dir={dir}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm
          transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold
          disabled:bg-gray-100 disabled:text-gray-400
          dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500
          ${error ? 'border-status-error' : 'border-gray-300 focus:border-brand-gold dark:border-gray-600'}
          ${inputClassName}`}
      />
      {hint && !error && <span className="text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
      {error && <span className="text-xs text-status-error">{error}</span>}
    </div>
  );
}
