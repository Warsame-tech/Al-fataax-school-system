export default function FilterSelect({
  value,
  onChange,
  options = [],
  placeholder = 'All',
  valueKey = 'value',
  labelKey = 'label',
  className = '',
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm
        focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold
        dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt[valueKey]} value={opt[valueKey]}>
          {opt[labelKey]}
        </option>
      ))}
    </select>
  );
}
