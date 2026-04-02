import { useState, useMemo } from 'react'
import formats from '../data/backdropFormats.json'

const STATIC_CATEGORIES = [...new Set(formats.map(f => f.Categorie))].sort()

export default function GridTypeSelector({ selected, onSelect, onCustom, customFormats = [], onDeleteCustomFormat }) {
  const [activeCategory, setActiveCategory] = useState(null) // null = level 1

  const allCategories = useMemo(() => {
    const cats = STATIC_CATEGORIES.map(cat => ({
      id: cat,
      label: cat,
      count: formats.filter(f => f.Categorie === cat).length,
      custom: false,
    }))
    if (customFormats.length > 0) {
      cats.push({ id: 'OPGESLAGEN', label: 'Opgeslagen', count: customFormats.length, custom: true })
    }
    return cats
  }, [customFormats.length])

  const visibleFormats = useMemo(() => {
    if (!activeCategory) return []
    if (activeCategory === 'OPGESLAGEN') return customFormats
    return formats.filter(f => f.Categorie === activeCategory)
  }, [activeCategory, customFormats])

  // ── Level 1: category list ──────────────────────────────────────────────────
  if (!activeCategory) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Backdrop formaat
        </h2>

        <div className="space-y-0.5">
          {allCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group ${
                cat.custom
                  ? 'hover:bg-amber-50 text-amber-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="font-medium">{cat.label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs tabular-nums ${cat.custom ? 'text-amber-400' : 'text-gray-300'}`}>
                  {cat.count}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  className="text-gray-300 group-hover:text-gray-400 transition-colors">
                  <path d="M4 2l4 4-4 4"/>
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <button onClick={onCustom}
            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
            + Nieuw formaat aanmaken
          </button>
        </div>
      </div>
    )
  }

  // ── Level 2: format list for chosen category ────────────────────────────────
  const catLabel = allCategories.find(c => c.id === activeCategory)?.label || activeCategory
  const isCustomCategory = activeCategory === 'OPGESLAGEN'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Back header */}
      <button
        onClick={() => setActiveCategory(null)}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mb-3 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 2L5 7l4 5"/>
        </svg>
        Terug
      </button>

      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
        {catLabel}
      </h2>

      {/* Format list */}
      <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
        {visibleFormats.length === 0 && (
          <p className="text-xs text-gray-400 italic py-2 text-center">Geen formaten.</p>
        )}
        {visibleFormats.map(f => {
          const isActive = selected?.Code === f.Code
          return (
            <div key={f.Code} className="flex items-center group">
              <button
                onClick={() => onSelect(f)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="font-mono font-medium">{f.Code}</span>
                {f.Beschrijving && (
                  <span className={`ml-2 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                    {f.Beschrijving}
                  </span>
                )}
                <span className={`ml-2 text-xs ${isActive ? 'text-blue-200' : 'text-gray-300'}`}>
                  {f.Cols}×{f.Rows}
                </span>
              </button>
              {isCustomCategory && onDeleteCustomFormat && (
                <button onClick={() => onDeleteCustomFormat(f)} title="Verwijderen"
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

      <div className="mt-3 pt-3 border-t border-gray-100">
        <button onClick={onCustom}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
          + Nieuw formaat aanmaken
        </button>
      </div>
    </div>
  )
}
