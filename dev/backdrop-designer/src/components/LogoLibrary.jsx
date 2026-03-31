import { useState, useRef, useEffect, useMemo } from 'react'
import sponsors from '../data/sponsors.json'
import SponsorEditModal from './SponsorEditModal'

const BLANK = { partner: 'BLANK', filename: 'BLANK' }
const ALL_SPONSORS = [BLANK, ...sponsors]

const DIR_GRID = [
  ['ul','u','ur'],
  ['l','none','r'],
  ['dl','d','dr'],
]
const DIR_ARROWS = {
  ul:'↖', u:'↑', ur:'↗',
  l:'←', none:'·', r:'→',
  dl:'↙', d:'↓', dr:'↘',
}

export default function LogoLibrary({
  selectedSlots, onAssign, customLogos, onCustomLogoChange,
  advanceDir = 'r', onAdvanceDirChange,
  onOpenSettings,
  tags, sponsorCategories, events, categoryList, eventGroups, sponsorGroups,
  onTagsChange, onCategoryChange, onSponsorGroupsChange,
}) {
  const [query, setQuery] = useState('')
  const [imgErrors, setImgErrors] = useState({})
  const [dragging, setDragging] = useState(null)
  const [eventFilter, setEventFilter] = useState('ALL')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const [editingSponsor, setEditingSponsor] = useState(null)

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
      if (matching.length) { groups.push({ key: cat, label: cat, color: 'blue', sponsors: matching }); matching.forEach(s => placed.add(s.partner)) }
    }

    const uncategorized = sponsorList.filter(s => {
      if (placed.has(s.partner)) return false
      const info = getInfo(s)
      return info.tier === 'group' || info.tier === 'event'
    })
    if (uncategorized.length) { groups.push({ key: '__none__', label: 'Zonder categorie', color: 'gray', sponsors: uncategorized }) }

    return groups
  }

  const searchActive = query.length > 0

  const filtered = useMemo(() => ALL_SPONSORS.filter(s => {
    if (!s.partner.toLowerCase().includes(query.toLowerCase())) return false
    if (searchActive || eventFilter === 'ALL') return true
    const evTags = tags[s.partner] || []
    const grpAssignments = sponsorGroups[s.partner] || {}
    if (evTags.includes(eventFilter)) return true
    return Object.keys(grpAssignments).some(groupName =>
      (eventGroups[groupName] || []).includes(eventFilter)
    )
  }), [query, searchActive, eventFilter, tags, sponsorGroups, eventGroups])

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
    setDragging(sponsorName)
  }
  function handleDragEnd() { setDragging(null) }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full">
      <div className="p-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Logo's</h2>
          <button
            onClick={() => onOpenSettings()}
            title="Events & categorieën beheren"
            className="p-1 rounded transition-colors text-gray-400 hover:text-gray-600"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="2.5"/>
              <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06"/>
            </svg>
          </button>
        </div>

        <div className="relative">
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Zoek sponsor..."
            className="w-full text-sm px-3 py-1.5 pr-7 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {filterOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 overflow-y-auto max-h-48">
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
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          {hasSlot ? (
            <p className="text-xs text-blue-600 font-medium">{count === 1 ? '1 slot' : `${count} slots`} geselecteerd</p>
          ) : (
            <p className="text-xs text-gray-400">Klik of sleep een logo</p>
          )}
          {/* Direction picker */}
          {onAdvanceDirChange && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[9px] text-gray-400 uppercase tracking-wide">Richting</span>
              <div className="grid grid-cols-3 gap-px">
                {DIR_GRID.map(row => row.map(dir => (
                  <button
                    key={dir}
                    onClick={() => onAdvanceDirChange(dir)}
                    title={dir === 'none' ? 'Geen vooruitgang' : dir}
                    className={`w-5 h-5 flex items-center justify-center rounded text-[11px] transition-colors leading-none
                      ${advanceDir === dir
                        ? 'bg-blue-600 text-white'
                        : dir === 'none'
                          ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                  >{DIR_ARROWS[dir]}</button>
                )))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-2">
        {(() => {
          function SponsorCard({ s }) {
            const customSrc = customLogos && customLogos[s.partner]
            const localSrc = customSrc || (s.filename === 'BLANK' ? null : `/logos/${s.filename}.png`)
            const hasError = !customSrc && imgErrors[s.filename]
            const isDraggingThis = dragging === s.partner
            const isBeingEdited = editingSponsor === s.partner
            const sponsorTags = tags[s.partner] || []
            const hasEventTags = sponsorTags.length > 0
            const hasGroupTags = Object.keys(sponsorGroups[s.partner] || {}).length > 0
            return (
              <div
                draggable
                onDragStart={e => handleDragStart(e, s.partner)}
                onDragEnd={handleDragEnd}
                onClick={() => hasSlot && onAssign(s.partner)}
                title={s.partner}
                className={`
                  relative flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all select-none group
                  cursor-grab active:cursor-grabbing
                  ${isDraggingThis ? 'border-blue-400 bg-blue-50 opacity-60'
                    : isBeingEdited ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}
                `}
              >
                {s.partner !== 'BLANK' && (
                  <button
                    onClick={e => { e.stopPropagation(); setEditingSponsor(s.partner) }}
                    title="Events & categorie instellen"
                    className={`absolute top-1 right-1 transition-opacity ${
                      isBeingEdited || hasEventTags || hasGroupTags
                        ? 'opacity-100'
                        : 'opacity-25 group-hover:opacity-70 hover:!opacity-100'
                    }`}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className={hasGroupTags ? 'text-teal-500' : hasEventTags ? 'text-blue-500' : 'text-gray-400'}>
                      <path d="M1 1h5.5L11 5.5 6.5 10 1 10V1z"/>
                      <circle cx="3.5" cy="3.5" r="1" fill="white"/>
                    </svg>
                  </button>
                )}
                {localSrc && !hasError ? (
                  <img src={localSrc} alt={s.partner} loading="lazy"
                    className="w-full h-10 object-contain pointer-events-none"
                    onError={() => setImgErrors(prev => ({ ...prev, [s.filename]: true }))}
                  />
                ) : (
                  <div className="w-full h-10 bg-gray-100 rounded flex items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-bold text-gray-400">{s.filename === 'BLANK' ? 'BLANK' : s.filename}</span>
                  </div>
                )}
                <span className="text-[10px] text-gray-500 leading-tight line-clamp-2 w-full pointer-events-none">{s.partner}</span>
              </div>
            )
          }

          if (eventFilter !== 'ALL' && !searchActive) {
            const headerColors = { teal: 'text-teal-700 bg-teal-50 border-teal-200', blue: 'text-blue-700 bg-blue-50 border-blue-200', gray: 'text-gray-500 bg-gray-50 border-gray-200' }
            return groups.length === 0 ? (
              <p className="text-xs text-gray-400 text-center mt-4">Geen sponsors voor dit event.</p>
            ) : (
              <div className="space-y-3">
                {groups.map(group => (
                  <div key={group.key}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border mb-1.5 ${headerColors[group.color]}`}>
                      {group.label} <span className="font-normal opacity-60">({group.sponsors.length})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.sponsors.map(s => <SponsorCard key={s.partner} s={s} />)}
                    </div>
                  </div>
                ))}
              </div>
            )
          }

          return (
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map(s => <SponsorCard key={s.partner} s={s} />)}
            </div>
          )
        })()}
      </div>

      {editingSponsor && (
        <SponsorEditModal
          sponsorName={editingSponsor}
          events={events}
          categoryList={categoryList}
          tags={tags}
          sponsorCategories={sponsorCategories}
          customLogos={customLogos || {}}
          onTagsChange={(eventsArray) => onTagsChange(editingSponsor, eventsArray)}
          onCategoryChange={(event, category) => onCategoryChange(editingSponsor, event, category)}
          onCustomLogoChange={onCustomLogoChange}
          onClose={() => setEditingSponsor(null)}
          eventGroups={eventGroups}
          groupCategories={categoryList}
          sponsorGroups={sponsorGroups}
          onSponsorGroupsChange={(groupData) => onSponsorGroupsChange(editingSponsor, groupData)}
        />
      )}

    </div>
  )
}
