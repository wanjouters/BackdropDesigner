import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { listContainerVariants, listItemVariants } from '../utils/animations'
import { logoUrl } from '../utils/logoUrl'
import { supabase } from '../utils/supabase'

const BLANK = { partner: 'BLANK', filename: 'BLANK' }

export default function LogoLibrary({
  selectedSlots, onAssign, customLogos,
  tags, sponsorCategories, events, categoryList, eventGroups, sponsorGroups,
  customSponsors = [],
}) {
  const [query, setQuery] = useState('')
  const [imgErrors, setImgErrors] = useState({})
  const [storageExtras, setStorageExtras] = useState([])            // alle sponsors uit Supabase Storage
  const [eventFilter, setEventFilter] = useState('ALL')
  const [filterOpen, setFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState('tile')
  const filterRef = useRef(null)

  useEffect(() => {
    async function fetchStorageFiles() {
      const { data } = await supabase.storage.from('logos').list('', { limit: 2000 })
      if (data) {
        // Normaliseer: spaties → underscores, dedupliceer op canonieke sleutel
        const seenKeys = new Map()
        for (const f of data) {
          const raw = f.name.replace(/\.(png|svg)$/i, '')
          if (!raw) continue
          const key = raw.replace(/ /g, '_')
          if (!seenKeys.has(key)) {
            seenKeys.set(key, { partner: key.replace(/_/g, ' '), filename: key, _fromStorage: true })
          }
        }
        setStorageExtras([...seenKeys.values()])
      }
    }
    fetchStorageFiles()
    window.addEventListener('focus', fetchStorageFiles)
    return () => window.removeEventListener('focus', fetchStorageFiles)
  }, [])

  // Alle sponsors komen uit storage; custom sponsors worden er achter geplakt
  const allSponsors = useMemo(() => {
    const customEntries = customSponsors.map(s => ({ ...s, _custom: true }))
    // storageExtras bevat nu alle storage-logos; filter duplicaten met custom
    const extras = storageExtras.filter(e => !customEntries.some(c => c.filename === e.filename))
    extras.sort((a, b) => a.partner.localeCompare(b.partner, 'nl'))
    return [BLANK, ...extras, ...customEntries]
  }, [customSponsors, storageExtras])

  function buildGroups(sponsorList) {
    const placed = new Set()
    const groups = []

    function getInfo(s) {
      const grpAssignments = sponsorGroups[s.partner] || {}
      for (const [groupName, cat] of Object.entries(grpAssignments)) {
        if ((eventGroups[groupName] || []).includes(eventFilter))
          return { tier: 'group', cat: cat || '' }
      }
      const evTags = tags[s.partner] || []
      if (evTags.includes(eventFilter)) {
        const cat = (sponsorCategories[s.partner] || {})[eventFilter] || ''
        return { tier: 'event', cat }
      }
      return { tier: 'untagged', cat: '' }
    }

    for (const cat of categoryList) {
      const matching = sponsorList.filter(s => {
        if (placed.has(s.partner)) return false
        const info = getInfo(s)
        return (info.tier === 'group' || info.tier === 'event') && info.cat === cat
      })
      if (matching.length) {
        groups.push({ key: cat, label: cat, color: 'red', sponsors: matching })
        matching.forEach(s => placed.add(s.partner))
      }
    }

    const uncategorized = sponsorList.filter(s => {
      if (placed.has(s.partner)) return false
      const info = getInfo(s)
      return info.tier === 'group' || info.tier === 'event'
    })
    if (uncategorized.length) {
      groups.push({ key: '__none__', label: 'Zonder categorie', color: 'gray', sponsors: uncategorized })
    }

    return groups
  }

  const searchActive = query.length > 0

  const filtered = useMemo(() => allSponsors.filter(s => {
    if (!s.partner.toLowerCase().includes(query.toLowerCase())) return false
    if (searchActive || eventFilter === 'ALL') return true
    const evTags = tags[s.partner] || []
    const grpAssignments = sponsorGroups[s.partner] || {}
    if (evTags.includes(eventFilter)) return true
    return Object.keys(grpAssignments).some(groupName =>
      (eventGroups[groupName] || []).includes(eventFilter)
    )
  }), [query, searchActive, eventFilter, tags, sponsorGroups, eventGroups, allSponsors])

  const groups = useMemo(
    () => (eventFilter !== 'ALL' && !searchActive) ? buildGroups(filtered) : [],
    [filtered, eventFilter, searchActive, sponsorGroups, eventGroups, tags, sponsorCategories, categoryList]
  )

  const hasSlot = selectedSlots.size > 0
  const count = selectedSlots.size

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return
    function handle(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [filterOpen])

  function handleDragStart(e, sponsorName) {
    e.dataTransfer.setData('sponsor', sponsorName)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full">
      <div className="p-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Logo's</h2>
          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('tile')}
              title="Tegelweergave"
              className={`p-1 transition-colors ${viewMode === 'tile' ? 'bg-gray-800 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Lijstweergave"
              className={`p-1 transition-colors ${viewMode === 'list' ? 'bg-gray-800 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Zoek sponsor..."
            className="w-full text-sm px-3 py-1.5 pr-7 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 2l8 8M10 2L2 10"/>
              </svg>
            </button>
          )}
        </div>
        {searchActive && eventFilter !== 'ALL' && (
          <p className="text-[10px] text-amber-600 mt-1 px-0.5">Zoekt in alle sponsors — eventfilter tijdelijk genegeerd</p>
        )}

        {/* Event filter */}
        <div className="relative mt-2" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors w-full ${eventFilter !== 'ALL' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'}`}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3h10M3 6h6M5 9h2"/>
            </svg>
            <span className="flex-1 text-left">{eventFilter === 'ALL' ? 'Alle events' : eventFilter}</span>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 3.5l3 3 3-3"/>
            </svg>
          </button>
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 overflow-y-auto max-h-48"
              >
                <button
                  onClick={() => { setEventFilter('ALL'); setFilterOpen(false) }}
                  className={`w-full text-left text-xs px-3 py-1.5 font-semibold transition-colors ${eventFilter === 'ALL' ? 'bg-gray-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >Alle events</button>
                {events.map(ev => (
                  <button key={ev}
                    onClick={() => { setEventFilter(ev); setFilterOpen(false) }}
                    className={`w-full text-left text-xs px-3 py-1.5 font-semibold transition-colors ${eventFilter === ev ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'}`}
                  >{ev}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Slot feedback */}
        {hasSlot && (
          <p className="text-xs text-blue-600 font-medium mt-2">{count === 1 ? '1 slot' : `${count} slots`} geselecteerd</p>
        )}
      </div>

      {/* Sponsor grid / list */}
      <div className="overflow-y-auto flex-1 p-2">
        {(() => {
          function SponsorCard({ s }) {
            const customSrc = customLogos && customLogos[s.partner]
            const localSrc = customSrc || s.dataUrl || logoUrl(s.filename)
            const hasError = !customSrc && !s.dataUrl && imgErrors[s.filename]

            return (
              <motion.div
                draggable
                onDragStart={e => handleDragStart(e, s.partner)}
                onClick={() => { if (hasSlot) onAssign(s.partner) }}
                title={s.partner}
                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.10)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative flex flex-col items-center gap-1 p-2 rounded-lg border text-center select-none border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-grab active:cursor-grabbing"
              >
                {localSrc && !hasError ? (
                  <img src={localSrc} alt={s.partner} loading="lazy"
                    className="w-full h-10 object-contain pointer-events-none"
                    onError={() => !s._custom && setImgErrors(prev => ({ ...prev, [s.filename]: true }))}
                  />
                ) : (
                  <div className="w-full h-10 bg-gray-100 rounded flex items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-bold text-gray-400">{s.filename === 'BLANK' ? 'BLANK' : (s.filename || s.partner)}</span>
                  </div>
                )}
                <span className="text-[10px] text-gray-500 leading-tight line-clamp-2 w-full pointer-events-none">{s.partner}</span>
              </motion.div>
            )
          }

          function SponsorRow({ s }) {
            const customSrc = customLogos && customLogos[s.partner]
            const localSrc = customSrc || s.dataUrl || logoUrl(s.filename)
            const hasError = !customSrc && !s.dataUrl && imgErrors[s.filename]

            return (
              <div
                draggable
                onDragStart={e => handleDragStart(e, s.partner)}
                onClick={() => { if (hasSlot) onAssign(s.partner) }}
                title={s.partner}
                className="flex items-center gap-2 px-1.5 py-1 rounded-lg border border-transparent select-none hover:border-blue-300 hover:bg-blue-50 cursor-grab active:cursor-grabbing"
              >
                <div className="w-10 h-7 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded border border-gray-100 pointer-events-none">
                  {localSrc && !hasError ? (
                    <img src={localSrc} alt={s.partner} loading="lazy"
                      className="max-w-full max-h-full object-contain"
                      onError={() => !s._custom && setImgErrors(prev => ({ ...prev, [s.filename]: true }))}
                    />
                  ) : (
                    <span className="text-[8px] font-bold text-gray-400">{s.filename === 'BLANK' ? 'BLANK' : '?'}</span>
                  )}
                </div>
                <span className="text-xs text-gray-700 leading-tight truncate pointer-events-none">{s.partner}</span>
              </div>
            )
          }

          const headerColors = {
            teal: 'text-teal-700 bg-teal-50 border-teal-200',
            red: 'text-blue-700 bg-blue-50 border-blue-200',
            gray: 'text-gray-500 bg-gray-50 border-gray-200',
          }

          if (eventFilter !== 'ALL' && !searchActive) {
            return groups.length === 0 ? (
              <p className="text-xs text-gray-400 text-center mt-4">Geen sponsors voor dit event.</p>
            ) : (
              <div className="space-y-3">
                {groups.map(group => (
                  <div key={group.key}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border mb-1.5 ${headerColors[group.color] || headerColors.gray}`}>
                      {group.label} <span className="font-normal opacity-60">({group.sponsors.length})</span>
                    </div>
                    {viewMode === 'tile' ? (
                      <motion.div
                        className="grid grid-cols-2 gap-1.5"
                        variants={listContainerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {group.sponsors.map(s => (
                          <motion.div key={s.partner} variants={listItemVariants}>
                            <SponsorCard s={s} />
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <div className="space-y-0.5">
                        {group.sponsors.map(s => <SponsorRow key={s.partner} s={s} />)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          }

          return viewMode === 'tile' ? (
            <motion.div
              className="grid grid-cols-2 gap-1.5"
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {filtered.map(s => (
                <motion.div key={s.partner} variants={listItemVariants}>
                  <SponsorCard s={s} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map(s => <SponsorRow key={s.partner} s={s} />)}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
