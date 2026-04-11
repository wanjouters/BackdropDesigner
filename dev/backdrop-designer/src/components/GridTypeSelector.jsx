import { useState, useMemo, useRef, useEffect } from 'react'

export default function GridTypeSelector({ selected, onSelect, formats = [] }) {
  const [activeTag, setActiveTag] = useState('ALL')
  const [query, setQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  // Collect all unique tags across all formats, sorted alphabetically
  const allTags = useMemo(() => {
    const tagSet = new Set()
    formats.forEach(f => (f.tags || []).forEach(t => tagSet.add(t)))
    return [...tagSet].sort()
  }, [formats])

  const filterOptions = useMemo(() => [
    { id: 'ALL', label: 'Alle' },
    ...allTags.map(t => ({ id: t, label: t })),
  ], [allTags])

  const activeCategoryLabel = filterOptions.find(c => c.id === activeTag)?.label || 'Alle'
  const hasFilter = activeTag !== 'ALL'

  const visibleFormats = useMemo(() => {
    const base = activeTag === 'ALL'
      ? formats
      : formats.filter(f => (f.tags || []).includes(activeTag))
    if (!query.trim()) return base
    const q = query.trim().toLowerCase()
    return base.filter(f =>
      (f.Beschrijving || '').toLowerCase().includes(q) ||
      (f.Code || '').toLowerCase().includes(q)
    )
  }, [activeTag, formats, query])

  useEffect(() => {
    if (!filterOpen) return
    function onDown(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [filterOpen])

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Search */}
      <div className="relative mb-2">
        <input
          type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Zoek formaat..."
          className="w-full text-sm px-3 py-1.5 pr-7 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l8 8M10 2L2 10"/>
            </svg>
          </button>
        )}
      </div>

      {/* Tag filter */}
      <div className="relative mb-3" ref={filterRef}>
        <button
          onClick={() => setFilterOpen(v => !v)}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors w-full ${
            hasFilter ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'
          }`}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 3h10M3 6h6M5 9h2"/>
          </svg>
          <span className="flex-1 text-left">{activeCategoryLabel}</span>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 3.5l3 3 3-3"/>
          </svg>
        </button>
        {filterOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 overflow-y-auto max-h-48">
            {filterOptions.map(opt => (
              <button key={opt.id}
                onClick={() => { setActiveTag(opt.id); setFilterOpen(false) }}
                className={`w-full text-left text-xs px-3 py-1.5 font-semibold transition-colors ${
                  activeTag === opt.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Format list */}
      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
        {visibleFormats.length === 0 && (
          <p className="text-xs text-gray-400 italic py-2 text-center">Geen formaten.</p>
        )}
        {visibleFormats.map(f => {
          const isActive = selected?.Code === f.Code
          return (
            <button
              key={f.id || f.Code}
              onClick={() => onSelect(f)}
              title={f.Beschrijving || f.Code}
              className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors overflow-hidden ${
                isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 min-w-0">
                <span className={`font-medium text-xs truncate min-w-0 ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {f.Beschrijving || f.Code}
                </span>
                <span className={`text-[10px] flex-shrink-0 ${isActive ? 'text-blue-200' : 'text-gray-300'}`}>
                  {f.Cols}×{f.Rows}
                </span>
              </div>
              {isActive && f.tags?.length > 0 && (
                <p className="text-[10px] text-blue-200 truncate mt-0.5">
                  {f.tags.join(' · ')}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
