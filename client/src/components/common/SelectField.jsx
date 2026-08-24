export default function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  placeholder = 'Select...',
  valueKey = 'value',
  labelKey = 'label',
  optionsDir,
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-status-error"> *</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm bg-white
          transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold
          disabled:bg-gray-100 disabled:text-gray-400
          dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700 dark:disabled:text-gray-500
          ${error ? 'border-status-error' : 'border-gray-300 focus:border-brand-gold dark:border-gray-600'}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt[valueKey]} value={opt[valueKey]} dir={optionsDir}>
            {opt[labelKey]}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-status-error">{error}</span>}
    </div>
  );
}
