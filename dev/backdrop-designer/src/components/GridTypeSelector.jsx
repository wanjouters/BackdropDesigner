import { useState, useMemo, useRef, useEffect } from 'react'

export default function GridTypeSelector({ selected, onSelect, onCustom, onEdit, staticFormats = [], customFormats = [], onDeleteCustomFormat }) {
  const STATIC_CATEGORIES = useMemo(() => [...new Set(staticFormats.map(f => f.Categorie))].sort(), [staticFormats])
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [query, setQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  const allCategories = useMemo(() => {
    const cats = [{ id: 'ALL', label: 'Alle' }]
    if (STATIC_CATEGORIES.length > 0) cats.push(...STATIC_CATEGORIES.map(c => ({ id: c, label: c })))
    if (customFormats.length > 0) cats.push({ id: 'OPGESLAGEN', label: `Opgeslagen (${customFormats.length})` })
    return cats
  }, [STATIC_CATEGORIES, customFormats.length])

  const activeCategoryLabel = allCategories.find(c => c.id === activeCategory)?.label || 'Alle'

  const visibleFormats = useMemo(() => {
    const customCodes = new Set(customFormats.map(f => f.Code))
    const dedupedStatic = staticFormats.filter(f => !customCodes.has(f.Code))
    const base = activeCategory === 'OPGESLAGEN'
      ? customFormats
      : activeCategory === 'ALL'
        ? [...dedupedStatic, ...customFormats]
        : dedupedStatic.filter(f => f.Categorie === activeCategory)
    if (!query.trim()) return base
    const q = query.trim().toLowerCase()
    return base.filter(f =>
      (f.Code || '').toLowerCase().includes(q) ||
      (f.Beschrijving || '').toLowerCase().includes(q)
    )
  }, [activeCategory, staticFormats, customFormats, query])

  const isCustomCategory = activeCategory === 'OPGESLAGEN'
  const hasFilter = activeCategory !== 'ALL'

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

      {/* Category filter */}
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
            {allCategories.map(cat => (
              <button key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setFilterOpen(false) }}
                className={`w-full text-left text-xs px-3 py-1.5 font-semibold transition-colors ${
                  activeCategory === cat.id
                    ? cat.id === 'OPGESLAGEN' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                    : cat.id === 'OPGESLAGEN' ? 'text-amber-600 hover:bg-amber-50' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Format list — fills remaining space */}
      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
        {visibleFormats.length === 0 && (
          <p className="text-xs text-gray-400 italic py-2 text-center">Geen formaten.</p>
        )}
        {visibleFormats.map(f => {
          const isActive = selected?.Code === f.Code
          return (
            <div key={f.id || f.Code} className="flex items-center group">
              <button
                onClick={() => onSelect(f)}
                title={f.Beschrijving || f.Code}
                className={`flex-1 text-left px-3 py-1.5 rounded-lg transition-colors overflow-hidden ${
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
                {isActive && (f.Categorie || f.EventStyle) && (
                  <p className="text-[10px] text-blue-200 truncate mt-0.5">
                    {[f.Categorie, f.EventStyle].filter(Boolean).join(' · ')}
                  </p>
                )}
              </button>
              {onEdit && (
                <button onClick={e => { e.stopPropagation(); onEdit(f) }} title="Preset aanpassen"
                  className="ml-1 flex-shrink-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-blue-500 rounded">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 1l3 3-7 7H1V8l7-7z"/>
                  </svg>
                </button>
              )}
              {isCustomCategory && onDeleteCustomFormat && (
                <button onClick={e => { e.stopPropagation(); onDeleteCustomFormat(f) }} title="Verwijderen"
                  className="ml-1 flex-shrink-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 rounded">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/>
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 mt-3 border-t border-gray-100 flex-shrink-0">
        <button onClick={onCustom}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
          + Nieuw formaat aanmaken
        </button>
      </div>
    </div>
  )
}
