import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalVariants, backdropVariants } from '../utils/animations'
import sponsors from '../data/sponsors.json'

const BLANK = { partner: 'BLANK', filename: 'BLANK', url: null }
const ALL_SPONSORS = [BLANK, ...sponsors]

export default function SponsorPicker({ onSelect, onClose, anchorRef }) {
  const [query, setQuery] = useState('')
  const [imgErrors, setImgErrors] = useState({})
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const listRef = useRef(null)

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

  useEffect(() => {
    setActiveIndex(-1)
  }, [query])

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && filtered[activeIndex]) {
        onSelect(filtered[activeIndex].partner)
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-item]')
      items[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-72"
        style={{ top: '100%', left: 0, marginTop: 4 }}
      >
        <div className="p-2 border-b border-gray-100">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Zoek sponsor..."
              className="w-full text-sm px-3 py-1.5 pr-7 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
              </button>
            )}
          </div>
        </div>
        <div ref={listRef} className="overflow-y-auto max-h-72">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Geen resultaten</p>
          )}
          {filtered.map((s, i) => (
            <button
              key={s.partner}
              data-item
              onClick={() => { onSelect(s.partner); onClose() }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-left transition-colors ${
                i === activeIndex ? 'bg-blue-50' : 'hover:bg-blue-50'
              }`}
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
      </motion.div>
    </AnimatePresence>
  )
}
