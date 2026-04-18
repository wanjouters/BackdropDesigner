export default function IntInput({ label, value, onChange, min = 1, max, wide }) {
  return (
    <label className={`flex flex-col gap-0.5 ${wide ? 'flex-1 min-w-0' : 'min-w-[44px]'}`}>
      <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">{label}</span>
      <input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        step={1}
        onChange={e => {
          const v = parseInt(e.target.value) || min
          const clamped = max !== undefined ? Math.min(v, max) : v
          onChange(Math.max(min, clamped))
        }}
        className={`text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 text-right tabular-nums ${wide ? 'w-full' : 'w-12'}`}
      />
    </label>
  )
}
