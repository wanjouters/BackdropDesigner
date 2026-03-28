import { useState } from 'react'
import formats from '../data/backdropFormats.json'

const CATEGORIES = [...new Set(formats.map(f => f.Categorie))].sort()
const EVENT_STYLES = [...new Set(formats.map(f => f.EventStyle))].sort()

export default function GridTypeSelector({ selected, onSelect, onCustom }) {
  const [category, setCategory] = useState('ALL')
  const [eventStyle, setEventStyle] = useState('ALL')

  const filtered = formats.filter(f =>
    (category === 'ALL' || f.Categorie === category) &&
    (eventStyle === 'ALL' || f.EventStyle === eventStyle)
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
        Backdrop formaat
      </h2>

      <div className="flex gap-2 mb-3 flex-wrap">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Alle categorieën</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={eventStyle}
          onChange={e => setEventStyle(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Alle events</option>
          {EVENT_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {filtered.map(f => {
          const isActive = selected?.Code === f.Code
          return (
            <button
              key={f.Code}
              onClick={() => onSelect(f)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
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
          )
        })}
      </div>

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
