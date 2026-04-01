import { useState, useMemo } from 'react'
import formats from '../data/backdropFormats.json'

const STATIC_CATEGORIES = [...new Set(formats.map(f => f.Categorie))].sort()

export default function GridTypeSelector({ selected, onSelect, onCustom, customFormats = [], onDeleteCustomFormat }) {
  const [category, setCategory] = useState('ALL')

  const allCategories = useMemo(() => {
    const cats = ['ALL', ...STATIC_CATEGORIES]
    if (customFormats.length > 0) cats.push('OPGESLAGEN')
    return cats
  }, [customFormats.length])

  const filtered = useMemo(() => {
    if (category === 'OPGESLAGEN') return customFormats
    if (category === 'ALL') return formats
    return formats.filter(f => f.Categorie === category)
  }, [category, customFormats])

  const isCustomCategory = category === 'OPGESLAGEN'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
        Backdrop formaat
      </h2>

      {/* Category filter — pill tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
              category === cat
                ? 'bg-blue-600 text-white'
                : cat === 'OPGESLAGEN'
                  ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {cat === 'ALL' ? 'Alle' : cat === 'OPGESLAGEN' ? `Opgeslagen (${customFormats.length})` : cat}
          </button>
        ))}
      </div>

      {/* Format list */}
      <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 italic py-2 text-center">Geen opgeslagen formaten.</p>
        )}
        {filtered.map(f => {
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
                <span className={`ml-2 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                  {f.Beschrijving}
                </span>
                <span className={`ml-2 text-xs ${isActive ? 'text-blue-200' : 'text-gray-300'}`}>
                  {f.Cols}×{f.Rows}
                </span>
              </button>
              {isCustomCategory && onDeleteCustomFormat && (
                <button
                  onClick={() => onDeleteCustomFormat(f)}
                  title="Verwijderen"
                  className="ml-1 flex-shrink-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 rounded"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/>
                  </svg>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={onCustom}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          + Nieuw formaat aanmaken
        </button>
      </div>
    </div>
  )
}
