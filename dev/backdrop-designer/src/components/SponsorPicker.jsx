import { useState, useRef, useEffect } from 'react'
import sponsors from '../data/sponsors.json'

const BLANK = { partner: 'BLANK', filename: 'BLANK', url: null }
const ALL_SPONSORS = [BLANK, ...sponsors]

export default function SponsorPicker({ onSelect, onClose, anchorRef }) {
  const [query, setQuery] = useState('')
  const [imgErrors, setImgErrors] = useState({})
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const filtered = ALL_SPONSORS.filter(s =>
    s.partner.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div
      ref={panelRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-72"
      style={{ top: '100%', left: 0, marginTop: 4 }}
    >
      <div className="p-2 border-b border-gray-100">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Zoek sponsor..."
          className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="overflow-y-auto max-h-72">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Geen resultaten</p>
        )}
        {filtered.map(s => (
          <button
            key={s.partner}
            onClick={() => { onSelect(s.partner); onClose() }}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-blue-50 text-left transition-colors"
          >
            {s.url && !imgErrors[s.partner] ? (
              <img
                src={s.url}
                alt={s.partner}
                className="w-10 h-6 object-contain flex-shrink-0 bg-gray-50 rounded"
                onError={() => setImgErrors(prev => ({ ...prev, [s.partner]: true }))}
              />
            ) : (
              <div className="w-10 h-6 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-xs text-gray-300">–</span>
              </div>
            )}
            <span className="text-sm font-medium text-gray-800 truncate">{s.partner}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
