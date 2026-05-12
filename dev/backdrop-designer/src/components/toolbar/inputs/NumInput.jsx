export default function NumInput({ label, value, onChange, unit = 'mm', min, step = 1, readOnly, wide }) {
  return (
    <label className={`flex flex-col gap-0.5 ${wide ? 'flex-1 min-w-0' : 'min-w-[52px]'}`}>
      <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none whitespace-nowrap">
        {label}
      </span>
      <div className="flex items-center gap-0.5">
        <input
          type="number"
          value={value ?? ''}
          min={min}
          step={step}
          readOnly={readOnly}
          onChange={e => !readOnly && onChange(parseFloat(e.target.value) || 0)}
          className={`text-xs px-1.5 py-1.5 border rounded text-right tabular-nums
            ${wide ? 'w-full' : 'w-14'}
            ${readOnly
              ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-default'
              : 'border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400'
            }`}
        />
        {unit && <span className="text-[9px] text-gray-300">{unit}</span>}
      </div>
    </label>
  )
}
