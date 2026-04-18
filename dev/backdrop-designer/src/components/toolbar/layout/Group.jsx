// Horizontal layout helpers

export function Group({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 flex-shrink-0">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-300">{label}</span>
      <div className="flex items-end gap-2">{children}</div>
    </div>
  )
}

export function Sep() {
  return <div className="w-px bg-gray-200 self-stretch mx-1 flex-shrink-0" />
}
