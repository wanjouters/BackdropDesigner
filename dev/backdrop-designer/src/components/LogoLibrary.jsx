import { useState, useRef, useEffect } from 'react'
import sponsors from '../data/sponsors.json'
import {
  loadTags, saveTags,
  loadEvents, saveEvents,
  loadSponsorCategories, saveSponsorCategories,
  loadCategoryList, saveCategoryList,
  loadEventGroups, saveEventGroups,
  loadSponsorGroups, saveSponsorGroups,
} from '../utils/sponsorTags'
import SponsorEditModal from './SponsorEditModal'

const BLANK = { partner: 'BLANK', filename: 'BLANK' }
const ALL_SPONSORS = [BLANK, ...sponsors]

function ManageList({ title, color, items, onRename, onDelete, onAdd, onReorder, defaultCollapsed = true }) {
  const [newVal, setNewVal] = useState('')
  const [renaming, setRenaming] = useState(null)
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const renameRef = useRef(null)

  const colors = {
    orange: {
      bg: 'bg-orange-50', border: 'border-orange-100', title: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-800', btn: 'text-orange-400 hover:text-orange-600',
      del: 'text-orange-300 hover:text-red-500', input: 'border-orange-200 focus:ring-orange-400',
      add: 'bg-orange-500 hover:bg-orange-600', over: 'border-orange-400',
    },
    purple: {
      bg: 'bg-purple-50', border: 'border-purple-100', title: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800', btn: 'text-purple-400 hover:text-purple-600',
      del: 'text-purple-300 hover:text-red-500', input: 'border-purple-200 focus:ring-purple-400',
      add: 'bg-purple-500 hover:bg-purple-600', over: 'border-purple-400',
    },
    indigo: {
      bg: 'bg-indigo-50', border: 'border-indigo-100', title: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-800', btn: 'text-indigo-400 hover:text-indigo-600',
      del: 'text-indigo-300 hover:text-red-500', input: 'border-indigo-200 focus:ring-indigo-400',
      add: 'bg-indigo-500 hover:bg-indigo-600', over: 'border-indigo-400',
    },
    teal: {
      bg: 'bg-teal-50', border: 'border-teal-100', title: 'text-teal-700',
      badge: 'bg-teal-100 text-teal-800', btn: 'text-teal-400 hover:text-teal-600',
      del: 'text-teal-300 hover:text-red-500', input: 'border-teal-200 focus:ring-teal-400',
      add: 'bg-teal-500 hover:bg-teal-600', over: 'border-teal-400',
    },
  }
  const c = colors[color]

  function doAdd() {
    const val = newVal.trim()
    if (!val || items.includes(val)) return
    onAdd(val)
    setNewVal('')
  }

  function handleDrop(i) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const a = [...items]
    const [item] = a.splice(dragIdx, 1)
    a.splice(i, 0, item)
    onReorder(a)
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <div className={`px-3 py-2 border-b ${c.border} ${c.bg} flex-shrink-0`}>
      <button
        onClick={() => setCollapsed(v => !v)}
        className={`flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-wide ${c.title} ${collapsed ? 'mb-0' : 'mb-2'}`}
      >
        <span>{title} <span className="font-normal opacity-50">({items.length})</span></span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>
      {!collapsed && <><div className="space-y-1 mb-2">
        {items.map((item, i) => (
          <div
            key={item}
            onDragOver={onReorder ? e => { e.preventDefault(); setOverIdx(i) } : undefined}
            onDrop={onReorder ? () => handleDrop(i) : undefined}
            onDragLeave={onReorder ? () => setOverIdx(null) : undefined}
            className={`flex items-center gap-1.5 rounded transition-all ${overIdx === i && dragIdx !== i ? `border-2 ${c.over} bg-white` : ''}`}
          >
            {renaming?.old === item ? (
              <>
                <input
                  ref={renameRef}
                  autoFocus
                  defaultValue={item}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { onRename(item, renameRef.current.value); setRenaming(null) }
                    if (e.key === 'Escape') setRenaming(null)
                  }}
                  className={`flex-1 text-xs px-2 py-0.5 border border-blue-400 rounded focus:outline-none`}
                />
                <button
                  onMouseDown={e => { e.preventDefault(); onRename(item, renameRef.current.value); setRenaming(null) }}
                  className="text-[10px] text-blue-600 font-semibold"
                >OK</button>
                <button onMouseDown={() => setRenaming(null)} className="text-[10px] text-gray-400">✕</button>
              </>
            ) : (
              <>
                {onReorder && (
                  <div
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                    className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 px-0.5 flex-shrink-0"
                    title="Slepen om te herordenen"
                  >
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                      <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
                      <circle cx="2" cy="6" r="1.2"/><circle cx="6" cy="6" r="1.2"/>
                      <circle cx="2" cy="10" r="1.2"/><circle cx="6" cy="10" r="1.2"/>
                    </svg>
                  </div>
                )}
                <span className={`flex-1 text-[11px] font-semibold px-2 py-0.5 rounded ${c.badge} ${dragIdx === i ? 'opacity-40' : ''}`}>
                  {onReorder && <span className="opacity-40 mr-1">{i+1}.</span>}{item}
                </span>
                <button onClick={() => setRenaming({ old: item })} title="Hernoemen" className={c.btn}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 1l3 3-7 7H1V8l7-7z"/>
                  </svg>
                </button>
                <button onClick={() => onDelete(item)} title="Verwijderen" className={c.del}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={newVal}
          onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doAdd()}
          placeholder="Nieuw..."
          className={`flex-1 text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 bg-white ${c.input}`}
        />
        <button onClick={doAdd} className={`text-xs px-2 py-1 text-white rounded font-semibold transition-colors ${c.add}`}>+</button>
      </div></>}
    </div>
  )
}

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

export default function LogoLibrary({ selectedSlots, onAssign, customLogos, onCustomLogoChange, advanceDir = 'r', onAdvanceDirChange }) {
  const [query, setQuery] = useState('')
  const [imgErrors, setImgErrors] = useState({})
  const [dragging, setDragging] = useState(null)
  const [eventFilter, setEventFilter] = useState('ALL')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const [tags, setTags] = useState(() => loadTags())
  const [sponsorCategories, setSponsorCategories] = useState(() => loadSponsorCategories())
  const [editingSponsor, setEditingSponsor] = useState(null)
  const [events, setEvents] = useState(() => loadEvents())
  const [categoryList, setCategoryList] = useState(() => loadCategoryList())
  const [managingEvents, setManagingEvents] = useState(false)
  const [eventGroups, setEventGroups] = useState(() => loadEventGroups())
  const [sponsorGroups, setSponsorGroups] = useState(() => loadSponsorGroups())
  const [newGroupVal, setNewGroupVal] = useState('')
  const [eventKoepelFilter, setEventKoepelFilter] = useState('ALL')
  const [renamingEvent, setRenamingEvent] = useState(null)
  const renamingEventRef = useRef(null)
  const [editingKoepelEvent, setEditingKoepelEvent] = useState(null)
  const [eventsCollapsed, setEventsCollapsed] = useState(false)

  function updateTags(sponsorName, event, checked) {
    const current = tags[sponsorName] || []
    const next = checked
      ? [...new Set([...current, event])]
      : current.filter(e => e !== event)
    // If unchecked, also remove the category for that event
    if (!checked) {
      const catCopy = { ...sponsorCategories }
      if (catCopy[sponsorName]) {
        catCopy[sponsorName] = { ...catCopy[sponsorName] }
        delete catCopy[sponsorName][event]
        setSponsorCategories(catCopy)
        saveSponsorCategories(catCopy)
      }
    }
    const newTags = { ...tags, [sponsorName]: next }
    setTags(newTags)
    saveTags(newTags)
  }

  function updateCategory(sponsorName, event, category) {
    const catCopy = {
      ...sponsorCategories,
      [sponsorName]: { ...(sponsorCategories[sponsorName] || {}), [event]: category },
    }
    setSponsorCategories(catCopy)
    saveSponsorCategories(catCopy)
  }

  // Modal callbacks
  function handleModalTagsChange(sponsorName, eventsArray) {
    const newTags = { ...tags, [sponsorName]: eventsArray }
    setTags(newTags)
    saveTags(newTags)
  }

  function handleModalCategoryChange(sponsorName, event, category) {
    const catCopy = {
      ...sponsorCategories,
      [sponsorName]: { ...(sponsorCategories[sponsorName] || {}), [event]: category },
    }
    if (category === '') delete catCopy[sponsorName][event]
    setSponsorCategories(catCopy)
    saveSponsorCategories(catCopy)
  }

  // Events management
  function addEvent(val) {
    const v = val.trim().toUpperCase()
    if (!v || events.includes(v)) return
    const next = [...events, v]
    setEvents(next); saveEvents(next)
  }
  function deleteEvent(ev) {
    const next = events.filter(e => e !== ev)
    setEvents(next); saveEvents(next)
    const newTags = {}
    Object.entries(tags).forEach(([name, evs]) => { newTags[name] = evs.filter(e => e !== ev) })
    setTags(newTags); saveTags(newTags)
    const catCopy = {}
    Object.entries(sponsorCategories).forEach(([name, evMap]) => {
      catCopy[name] = { ...evMap }; delete catCopy[name][ev]
    })
    setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
    if (eventFilter === ev) setEventFilter('ALL')
  }
  function renameEvent(oldName, newName) {
    const val = newName.trim().toUpperCase()
    if (!val || val === oldName || events.includes(val)) return
    const next = events.map(e => e === oldName ? val : e)
    setEvents(next); saveEvents(next)
    const newTags = {}
    Object.entries(tags).forEach(([name, evs]) => { newTags[name] = evs.map(e => e === oldName ? val : e) })
    setTags(newTags); saveTags(newTags)
    const catCopy = {}
    Object.entries(sponsorCategories).forEach(([name, evMap]) => {
      catCopy[name] = {}
      Object.entries(evMap).forEach(([ev, cat]) => { catCopy[name][ev === oldName ? val : ev] = cat })
    })
    setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
    if (eventFilter === oldName) setEventFilter(val)
  }

  // Categories management
  function addCategory(val) {
    if (!val || categoryList.includes(val)) return
    const next = [...categoryList, val]
    setCategoryList(next); saveCategoryList(next)
  }
  function deleteCategory(cat) {
    const next = categoryList.filter(c => c !== cat)
    setCategoryList(next); saveCategoryList(next)
    // Remove from all sponsors
    const catCopy = {}
    Object.entries(sponsorCategories).forEach(([name, evMap]) => {
      catCopy[name] = {}
      Object.entries(evMap).forEach(([ev, c]) => { if (c !== cat) catCopy[name][ev] = c })
    })
    setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
  }
  function renameCategory(oldCat, newCat) {
    const val = newCat.trim()
    if (!val || val === oldCat || categoryList.includes(val)) return
    const next = categoryList.map(c => c === oldCat ? val : c)
    setCategoryList(next); saveCategoryList(next)
    const catCopy = {}
    Object.entries(sponsorCategories).forEach(([name, evMap]) => {
      catCopy[name] = {}
      Object.entries(evMap).forEach(([ev, c]) => { catCopy[name][ev] = c === oldCat ? val : c })
    })
    setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
  }

  function handleSponsorGroupsChange(sponsorName, groupData) {
    const next = { ...sponsorGroups, [sponsorName]: groupData }
    setSponsorGroups(next)
    saveSponsorGroups(next)
  }

  function addEventGroup(name) {
    const v = name.trim()
    if (!v || v in eventGroups) return
    const next = { ...eventGroups, [v]: [] }
    setEventGroups(next); saveEventGroups(next)
  }

  function deleteEventGroup(name) {
    const next = { ...eventGroups }
    delete next[name]
    setEventGroups(next); saveEventGroups(next)
    const sg = {}
    Object.entries(sponsorGroups).forEach(([sp, groups]) => {
      const g = { ...groups }
      delete g[name]
      sg[sp] = g
    })
    setSponsorGroups(sg); saveSponsorGroups(sg)
  }

  function renameEventGroup(oldName, newName) {
    const val = newName.trim()
    if (!val || val === oldName || val in eventGroups) return
    const next = {}
    Object.entries(eventGroups).forEach(([k, v]) => { next[k === oldName ? val : k] = v })
    setEventGroups(next); saveEventGroups(next)
    const sg = {}
    Object.entries(sponsorGroups).forEach(([sp, groups]) => {
      const g = {}
      Object.entries(groups).forEach(([k, v]) => { g[k === oldName ? val : k] = v })
      sg[sp] = g
    })
    setSponsorGroups(sg); saveSponsorGroups(sg)
  }

  function toggleGroupEvent(groupName, eventCode, checked) {
    const current = eventGroups[groupName] || []
    const next = checked ? [...new Set([...current, eventCode])] : current.filter(e => e !== eventCode)
    const ng = { ...eventGroups, [groupName]: next }
    setEventGroups(ng); saveEventGroups(ng)
  }

  function getEventKoepel(eventCode) {
    for (const [grp, evs] of Object.entries(eventGroups)) {
      if (evs.includes(eventCode)) return grp
    }
    return ''
  }

  function setEventKoepelAssign(eventCode, koepelName) {
    const next = {}
    Object.entries(eventGroups).forEach(([grp, evs]) => { next[grp] = evs.filter(e => e !== eventCode) })
    if (koepelName && koepelName in next) next[koepelName] = [...next[koepelName], eventCode]
    setEventGroups(next); saveEventGroups(next)
  }

  function reorderCategoryList(newOrder) {
    setCategoryList(newOrder); saveCategoryList(newOrder)
  }

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

  const filtered = ALL_SPONSORS.filter(s => {
    if (!s.partner.toLowerCase().includes(query.toLowerCase())) return false
    if (eventFilter === 'ALL') return true

    const evTags = tags[s.partner] || []
    const grpAssignments = sponsorGroups[s.partner] || {}

    // Local partner: directly tagged to this event
    if (evTags.includes(eventFilter)) return true

    // Koepelpartner: member of a group that contains this event
    return Object.keys(grpAssignments).some(groupName =>
      (eventGroups[groupName] || []).includes(eventFilter)
    )
  })

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
            onClick={() => { setManagingEvents(v => !v); setEditingSponsor(null) }}
            title="Events & categorieën beheren"
            className={`p-1 rounded transition-colors ${managingEvents ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
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

      {/* Beheer paneel — full frame when open */}
      {managingEvents ? (
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Koepels beheren */}
          <ManageList
            title="Koepels beheren"
            color="teal"
            items={Object.keys(eventGroups)}
            onAdd={val => addEventGroup(val)}
            onRename={(old, nw) => renameEventGroup(old, nw)}
            onDelete={name => deleteEventGroup(name)}
          />

          {/* Events beheren */}
          <div className="px-3 py-2 border-b border-orange-100 bg-orange-50 flex-shrink-0">
            <button
              onClick={() => setEventsCollapsed(v => !v)}
              className={`flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-wide text-orange-700 ${eventsCollapsed ? 'mb-0' : 'mb-2'}`}
            >
              <span>Events beheren <span className="font-normal opacity-50">({events.length})</span></span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ transform: eventsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                <path d="M2 3.5l3 3 3-3"/>
              </svg>
            </button>

            {!eventsCollapsed && <>
            {/* Koepel filter chips */}
            {Object.keys(eventGroups).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                <button
                  onClick={() => setEventKoepelFilter('ALL')}
                  className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold transition-colors ${eventKoepelFilter === 'ALL' ? 'bg-orange-500 text-white border-orange-500' : 'border-orange-200 text-orange-600 hover:border-orange-400'}`}
                >Alle</button>
                {Object.keys(eventGroups).map(grp => (
                  <button key={grp}
                    onClick={() => setEventKoepelFilter(eventKoepelFilter === grp ? 'ALL' : grp)}
                    className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold transition-colors ${eventKoepelFilter === grp ? 'bg-teal-500 text-white border-teal-500' : 'border-teal-200 text-teal-600 hover:border-teal-400'}`}
                  >{grp}</button>
                ))}
              </div>
            )}

            <div className="space-y-1 mb-2">
              {(eventKoepelFilter === 'ALL' ? events : events.filter(ev => (eventGroups[eventKoepelFilter] || []).includes(ev))).map(ev => (
                <div key={ev} className="flex items-center gap-1.5">
                  {renamingEvent === ev ? (
                    <>
                      <input
                        ref={renamingEventRef}
                        autoFocus
                        defaultValue={ev}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { renameEvent(ev, renamingEventRef.current.value); setRenamingEvent(null) }
                          if (e.key === 'Escape') setRenamingEvent(null)
                        }}
                        className="flex-1 text-xs px-2 py-0.5 border border-blue-400 rounded focus:outline-none"
                      />
                      <button onMouseDown={e => { e.preventDefault(); renameEvent(ev, renamingEventRef.current.value); setRenamingEvent(null) }} className="text-[10px] text-blue-600 font-semibold">OK</button>
                      <button onMouseDown={() => setRenamingEvent(null)} className="text-[10px] text-gray-400">✕</button>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800 flex-1">{ev}</span>
                      {Object.keys(eventGroups).length > 0 && (
                        editingKoepelEvent === ev ? (
                          <select
                            autoFocus
                            value={getEventKoepel(ev)}
                            onChange={e => { setEventKoepelAssign(ev, e.target.value); setEditingKoepelEvent(null) }}
                            onBlur={() => setEditingKoepelEvent(null)}
                            className="flex-1 text-[10px] px-1.5 py-0.5 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white text-gray-700"
                          >
                            <option value="">— geen koepel —</option>
                            {Object.keys(eventGroups).map(grp => <option key={grp} value={grp}>{grp}</option>)}
                          </select>
                        ) : (
                          <button onClick={() => setEditingKoepelEvent(ev)} title="Koepel instellen" className={`text-teal-300 hover:text-teal-500 transition-colors ${getEventKoepel(ev) ? 'text-teal-500' : ''}`}>
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 6h3l2-4 2 8 2-4h1"/>
                            </svg>
                          </button>
                        )
                      )}
                      <button onClick={() => setRenamingEvent(ev)} title="Hernoemen" className="text-orange-400 hover:text-orange-600 flex-shrink-0">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l3 3-7 7H1V8l7-7z"/></svg>
                      </button>
                      <button onClick={() => deleteEvent(ev)} title="Verwijderen" className="text-orange-300 hover:text-red-500 flex-shrink-0">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/></svg>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              <input
                type="text"
                value={newGroupVal}
                onChange={e => setNewGroupVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { addEvent(newGroupVal); setNewGroupVal('') } }}
                placeholder="Nieuw event..."
                className="flex-1 text-xs px-2 py-1 border border-orange-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
              />
              <button
                onClick={() => { addEvent(newGroupVal); setNewGroupVal('') }}
                className="text-xs px-2 py-1 bg-orange-500 text-white rounded font-semibold hover:bg-orange-600 transition-colors"
              >+</button>
            </div>
            </>}
          </div>

          <ManageList
            title="Categorieën beheren"
            color="purple"
            items={categoryList}
            onAdd={val => addCategory(val)}
            onRename={(old, nw) => renameCategory(old, nw)}
            onDelete={cat => deleteCategory(cat)}
            onReorder={reorderCategoryList}
          />

        </div>
      ) : (
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
                    onClick={e => { e.stopPropagation(); setManagingEvents(false); setEditingSponsor(s.partner) }}
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
                  <img src={localSrc} alt={s.partner}
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

          if (eventFilter !== 'ALL') {
            const groups = buildGroups(filtered)
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
      )}

      {editingSponsor && (
        <SponsorEditModal
          sponsorName={editingSponsor}
          events={events}
          categoryList={categoryList}
          tags={tags}
          sponsorCategories={sponsorCategories}
          customLogos={customLogos || {}}
          onTagsChange={handleModalTagsChange}
          onCategoryChange={handleModalCategoryChange}
          onCustomLogoChange={onCustomLogoChange}
          onClose={() => setEditingSponsor(null)}
          eventGroups={eventGroups}
          groupCategories={categoryList}
          sponsorGroups={sponsorGroups}
          onSponsorGroupsChange={handleSponsorGroupsChange}
        />
      )}

    </div>
  )
}
