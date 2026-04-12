import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { logoUrl, STORAGE_BASE } from '../../utils/logoUrl'
import {
  loadTags, loadSponsorCategories,
  saveSponsorTags, saveSponsorGroup,
  loadEvents, loadSetting, loadEventGroups, loadSponsorGroups,
} from '../../utils/db'
import sponsors from '../../data/sponsors.json'

const DEFAULT_CATEGORIES = ['Titel', 'Goud', 'Zilver', 'Brons', 'Partner', 'Leverancier', 'Media']

// ─── Sponsor tag editor modal ────────────────────────────────────────────────

function TagEditor({ sponsor, events, categoryList, tags, sponsorCategories, eventGroups, sponsorGroups, onSave, onClose }) {
  const [selectedEvents, setSelectedEvents] = useState(tags[sponsor.partner] || [])
  const [categories, setCategories] = useState(sponsorCategories[sponsor.partner] || {})
  const [groupData, setGroupData] = useState(sponsorGroups[sponsor.partner] || {})

  function toggleEvent(code, checked) {
    setSelectedEvents(prev => checked ? [...new Set([...prev, code])] : prev.filter(e => e !== code))
    if (!checked) setCategories(prev => { const n = { ...prev }; delete n[code]; return n })
  }

  async function handleSave() {
    const cleanedCats = {}
    for (const ev of selectedEvents) {
      if (categories[ev]) cleanedCats[ev] = categories[ev]
    }
    await onSave(sponsor.partner, selectedEvents, cleanedCats, groupData)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 48px)' }}
        onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">{sponsor.partner}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sponsor bewerken</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l12 12M14 2L2 14"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Koepels */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Koepels (koepelpartner)</p>
            {Object.keys(eventGroups || {}).length === 0 ? (
              <p className="text-xs text-gray-400">Geen koepels gedefinieerd. Voeg koepels toe via de app-instellingen.</p>
            ) : (
              <div className="space-y-2">
                {Object.keys(eventGroups).map(groupName => {
                  const checked = groupName in groupData
                  const cat = groupData[groupName] || ''
                  return (
                    <div key={groupName} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${checked ? 'bg-teal-50' : 'bg-gray-50'}`}>
                      <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            setGroupData(prev => {
                              const n = { ...prev }
                              if (e.target.checked) n[groupName] = ''
                              else delete n[groupName]
                              return n
                            })
                          }}
                          className="w-4 h-4 accent-teal-600"
                        />
                        <span className={`text-xs font-bold ${checked ? 'text-teal-700' : 'text-gray-400'}`}>{groupName}</span>
                      </label>
                      <select
                        value={cat}
                        onChange={e => setGroupData(prev => ({ ...prev, [groupName]: e.target.value }))}
                        disabled={!checked}
                        className={`flex-1 text-xs px-2 py-1 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition-colors ${
                          checked ? 'border-teal-200 bg-white text-gray-700' : 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <option value="">— categorie —</option>
                        {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Events */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Events & categorie</p>
            {events.length === 0 ? (
              <p className="text-xs text-gray-400">Geen events beschikbaar. Voeg eerst events toe.</p>
            ) : (
              <div className="space-y-2">
                {events.map(ev => {
                  const checked = selectedEvents.includes(ev)
                  const cat = categories[ev] || ''
                  return (
                    <div key={ev} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${checked ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => toggleEvent(ev, e.target.checked)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className={`text-xs font-bold shrink-0 ${checked ? 'text-blue-700' : 'text-gray-400'}`}>{ev}</span>
                      </label>
                      <select
                        value={cat}
                        onChange={e => setCategories(prev => ({ ...prev, [ev]: e.target.value }))}
                        disabled={!checked}
                        className={`flex-1 text-xs px-2 py-1 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors ${
                          checked ? 'border-blue-200 bg-white text-gray-700' : 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <option value="">— categorie —</option>
                        {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-3">Sponsors zonder events zijn zichtbaar bij alle events.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Annuleren
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            Opslaan
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sponsor card ─────────────────────────────────────────────────────────────

function SponsorCard({ sponsor, onEdit, deleteMode, isSelected, onToggleSelect }) {
  const [hover, setHover] = useState(false)
  const src = logoUrl(sponsor.filename)

  return (
    <div
      className={`relative bg-white rounded-xl border overflow-hidden group ${
        deleteMode ? 'cursor-pointer' : ''
      } ${deleteMode && isSelected ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'}`}
      onMouseEnter={() => { if (!deleteMode) setHover(true) }}
      onMouseLeave={() => { if (!deleteMode) setHover(false) }}
      onClick={() => { if (deleteMode) onToggleSelect(sponsor.partner) }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center bg-gray-50 p-3" style={{ height: 80 }}>
        {src
          ? <img src={src} alt={sponsor.partner} className="max-w-full max-h-full object-contain" />
          : <div className="text-gray-300 text-xs text-center">Geen logo</div>
        }
      </div>

      {/* Name */}
      <div className="px-2 pb-2 pt-1">
        <p className="text-xs font-medium text-gray-700 truncate" title={sponsor.partner}>
          {sponsor.partner}
        </p>
      </div>

      {/* Delete mode: checkbox */}
      {deleteMode && (
        <div className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isSelected ? 'bg-red-500 border-red-500' : 'bg-white/90 border-gray-300'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      {/* Hover actions (normale modus) */}
      {!deleteMode && hover && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <button
            onClick={() => onEdit(sponsor)}
            className="p-2 bg-white rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            title="Events bewerken"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function LogosSection({ showToast }) {
  const [allSponsors, setAllSponsors] = useState([])
  const [tags, setTags] = useState({})
  const [sponsorCategories, setSponsorCategories] = useState({})
  const [sponsorGroups, setSponsorGroups] = useState({})
  const [eventGroups, setEventGroups] = useState({})
  const [events, setEvents] = useState([])
  const [categoryList, setCategoryList] = useState(DEFAULT_CATEGORIES)
  const [search, setSearch] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [editingSponsor, setEditingSponsor] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [deleteMode, setDeleteMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const fileRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const [tagsData, catsData, eventsData, catList, groupsData, eventGroupsData] = await Promise.all([
          loadTags(),
          loadSponsorCategories(),
          loadEvents(),
          loadSetting('category_list', DEFAULT_CATEGORIES),
          loadSponsorGroups(),
          loadEventGroups(),
        ])
        setTags(tagsData)
        setSponsorCategories(catsData)
        setSponsorGroups(groupsData)
        setEventGroups(eventGroupsData)
        setEvents(eventsData)
        setCategoryList(catList)
        // Merge sponsors.json with Storage
        setAllSponsors(sponsors)
      } catch (e) {
        showToast('Fout bij laden: ' + e.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = allSponsors.filter(s => {
    const matchesSearch = s.partner.toLowerCase().includes(search.toLowerCase()) ||
      s.filename.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (!filterValue) return true
    if (filterValue.startsWith('event:')) {
      const ev = filterValue.slice(6)
      // Directe event-tag
      if ((tags[s.partner] || []).includes(ev)) return true
      // Via koepel: welke koepels bevatten dit event?
      const koepelsMetEvent = Object.keys(eventGroups).filter(grp =>
        (eventGroups[grp] || []).includes(ev)
      )
      return koepelsMetEvent.some(grp => grp in (sponsorGroups[s.partner] || {}))
    }
    if (filterValue.startsWith('koepel:')) {
      const grp = filterValue.slice(7)
      return grp in (sponsorGroups[s.partner] || {})
    }
    return true
  })

  async function handleUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    let ok = 0, fail = 0
    for (const file of files) {
      // Bestandsnaam zonder extensie = sponsor filename
      const name = file.name.replace(/\.(png|svg)$/i, '')
      const path = file.name
      const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
      if (error) { fail++; console.error(error) } else { ok++ }
    }
    setUploading(false)
    fileRef.current.value = ''
    if (ok > 0) showToast(`${ok} logo${ok > 1 ? "'s" : ''} geüpload`)
    if (fail > 0) showToast(`${fail} upload${fail > 1 ? 's' : ''} mislukt`, 'error')
  }

  function toggleDeleteMode() {
    setDeleteMode(prev => !prev)
    setSelected(new Set())
  }

  function toggleSelect(partnerName) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(partnerName) ? next.delete(partnerName) : next.add(partnerName)
      return next
    })
  }

  async function handleBulkDelete() {
    const filenames = [...selected].flatMap(partnerName => {
      const s = allSponsors.find(sp => sp.partner === partnerName)
      return s ? [s.filename + '.png'] : []
    })
    const { error } = await supabase.storage.from('logos').remove(filenames)
    if (error) { showToast('Verwijderen mislukt: ' + error.message, 'error'); return }
    setAllSponsors(prev => prev.filter(s => !selected.has(s.partner)))
    showToast(`${selected.size} logo${selected.size !== 1 ? "'s" : ''} verwijderd`)
    setSelected(new Set())
    setDeleteMode(false)
  }


  async function handleSaveTags(sponsorName, evCodes, catMap, grpData) {
    try {
      await Promise.all([
        saveSponsorTags(sponsorName, evCodes, catMap),
        saveSponsorGroup(sponsorName, grpData),
      ])
      setTags(prev => ({ ...prev, [sponsorName]: evCodes }))
      setSponsorCategories(prev => ({ ...prev, [sponsorName]: catMap }))
      setSponsorGroups(prev => ({ ...prev, [sponsorName]: grpData }))
      setEditingSponsor(null)
      showToast('Opgeslagen')
    } catch (e) {
      showToast('Opslaan mislukt: ' + e.message, 'error')
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-gray-400">Laden…</div>
  }

  return (
    <div className="p-8">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Zoeken…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
            </button>
          )}
        </div>
        {/* Event / koepel filter */}
        <select
          value={filterValue}
          onChange={e => setFilterValue(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white text-gray-700"
        >
          <option value="">Alle sponsors</option>
          {events.length > 0 && (
            <optgroup label="─ Events ─">
              {events.map(ev => (
                <option key={ev} value={'event:' + ev}>{ev}</option>
              ))}
            </optgroup>
          )}
          {Object.keys(eventGroups).length > 0 && (
            <optgroup label="─ Koepels ─">
              {Object.keys(eventGroups).map(grp => (
                <option key={grp} value={'koepel:' + grp}>{grp}</option>
              ))}
            </optgroup>
          )}
        </select>

        <span className="text-sm text-gray-400">{filtered.length} sponsors</span>

        <div className="ml-auto flex items-center gap-2">
          <input ref={fileRef} type="file" multiple accept=".png,.svg" className="hidden" onChange={handleUpload} />
          <button
            onClick={toggleDeleteMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              deleteMode
                ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleteMode ? 'Annuleren' : "Logo's verwijderen"}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? 'Uploaden…' : "Logo's uploaden"}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
        {filtered.map(sponsor => (
          <SponsorCard
            key={sponsor.partner}
            sponsor={sponsor}
            onEdit={setEditingSponsor}
            deleteMode={deleteMode}
            isSelected={selected.has(sponsor.partner)}
            onToggleSelect={toggleSelect}
          />
        ))}
      </div>

      {/* Bulk delete bevestigingsbalk */}
      {deleteMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-6 py-3 flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {selected.size === 0
              ? 'Klik op logo\'s om ze te selecteren'
              : `${selected.size} logo${selected.size !== 1 ? "'s" : ''} geselecteerd`}
          </span>
          {selected.size > 0 && (
            <>
              <button onClick={() => setSelected(new Set())} className="text-sm text-gray-400 hover:text-gray-600 underline">
                Deselecteer alles
              </button>
              <button
                onClick={handleBulkDelete}
                className="ml-auto flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Verwijder {selected.size} logo{selected.size !== 1 ? "'s" : ''}
              </button>
            </>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Geen sponsors gevonden voor "{search}"
        </div>
      )}

      {/* Tag editor modal */}
      {editingSponsor && (
        <TagEditor
          sponsor={editingSponsor}
          events={events}
          categoryList={categoryList}
          tags={tags}
          sponsorCategories={sponsorCategories}
          eventGroups={eventGroups}
          sponsorGroups={sponsorGroups}
          onSave={handleSaveTags}
          onClose={() => setEditingSponsor(null)}
        />
      )}

    </div>
  )
}
