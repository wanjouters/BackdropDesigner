import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { logoUrl, STORAGE_BASE } from '../../utils/logoUrl'
import {
  loadTags, loadSponsorCategories, saveSponsorEventData,
  loadEvents, loadSetting, loadEventGroups, loadSponsorGroups, saveSponsorGroups,
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
    const newTags = { ...tags, [sponsor.partner]: selectedEvents }
    const cleanedCats = {}
    for (const ev of selectedEvents) {
      if (categories[ev]) cleanedCats[ev] = categories[ev]
    }
    const newCats = { ...sponsorCategories, [sponsor.partner]: cleanedCats }
    const newGroups = { ...sponsorGroups, [sponsor.partner]: groupData }
    await onSave(newTags, newCats, newGroups)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 48px)' }}>

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
                        <span className={`text-xs font-bold w-12 ${checked ? 'text-blue-700' : 'text-gray-400'}`}>{ev}</span>
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

function SponsorCard({ sponsor, tags, onEdit, onDelete }) {
  const [hover, setHover] = useState(false)
  const src = logoUrl(sponsor.filename)
  const eventTags = tags[sponsor.partner] || []

  return (
    <div
      className="relative bg-white rounded-xl border border-gray-200 overflow-hidden group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
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
        {eventTags.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-1">
            {eventTags.slice(0, 3).map(ev => (
              <span key={ev} className="text-xs bg-blue-100 text-blue-700 rounded px-1 py-0.5 leading-none">
                {ev}
              </span>
            ))}
            {eventTags.length > 3 && (
              <span className="text-xs text-gray-400">+{eventTags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {hover && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
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
          <button
            onClick={() => onDelete(sponsor)}
            className="p-2 bg-white rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600"
            title="Logo verwijderen uit Storage"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
  const [editingSponsor, setEditingSponsor] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
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

  const filtered = allSponsors.filter(s =>
    s.partner.toLowerCase().includes(search.toLowerCase()) ||
    s.filename.toLowerCase().includes(search.toLowerCase())
  )

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

  async function handleDeleteLogo(sponsor) {
    const filename = sponsor.filename + '.png'
    const { error } = await supabase.storage.from('logos').remove([filename])
    if (error) { showToast('Verwijderen mislukt: ' + error.message, 'error'); return }
    showToast(`Logo van ${sponsor.partner} verwijderd`)
    setDeleteConfirm(null)
    setAllSponsors(prev => prev.filter(s => s.partner !== sponsor.partner))
  }

  async function handleSaveTags(newTags, newCats, newGroups) {
    try {
      await Promise.all([
        saveSponsorEventData(newTags, newCats),
        saveSponsorGroups(newGroups),
      ])
      setTags(newTags)
      setSponsorCategories(newCats)
      setSponsorGroups(newGroups)
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
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-sm text-gray-400">{filtered.length} sponsors</span>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".png,.svg"
          className="hidden"
          onChange={handleUpload}
        />
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

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
        {filtered.map(sponsor => (
          <SponsorCard
            key={sponsor.partner}
            sponsor={sponsor}
            tags={tags}
            onEdit={setEditingSponsor}
            onDelete={setDeleteConfirm}
          />
        ))}
      </div>

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

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Logo verwijderen?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Logo van <strong>{deleteConfirm.partner}</strong> wordt verwijderd uit Supabase Storage.
              De sponsornaam blijft bestaan in de app.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Annuleren
              </button>
              <button onClick={() => handleDeleteLogo(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
