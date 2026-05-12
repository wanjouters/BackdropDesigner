export default function SelectInput({ label, value, options, onChange, wide }) {
  return (
    <label className={`flex flex-col gap-0.5 ${wide ? 'flex-1 min-w-0' : ''}`}>
      <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">{label}</span>
      <select
        value={value ?? 'NONE'}
        onChange={e => onChange(e.target.value)}
        className={`text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 ${wide ? 'w-full' : ''}`}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}
