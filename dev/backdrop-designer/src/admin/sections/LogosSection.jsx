import { useState, useEffect, useRef, useMemo } from 'react'
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

function SponsorCard({ sponsor, onEdit, deleteMode, isSelected, onToggleSelect, logoVersion, localPreview }) {
  const [hover, setHover] = useState(false)
  const base = logoUrl(sponsor.filename)
  const src = localPreview || (base && logoVersion ? `${base}?v=${logoVersion}` : base)

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

// ─── Sponsor rij (lijstweergave) ──────────────────────────────────────────────

function SponsorRow({ sponsor, tags, sponsorGroups, onEdit, deleteMode, isSelected, onToggleSelect, logoVersion, localPreview }) {
  const base = logoUrl(sponsor.filename)
  const src = localPreview || (base && logoVersion ? `${base}?v=${logoVersion}` : base)
  const eventCount = (tags[sponsor.partner] || []).length
  const koepelCount = Object.keys(sponsorGroups[sponsor.partner] || {}).length

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 group transition-colors cursor-pointer
        ${deleteMode && isSelected ? 'bg-red-50' : 'hover:bg-gray-50'}
        ${deleteMode ? 'cursor-pointer' : ''}`}
      onClick={() => { if (deleteMode) onToggleSelect(sponsor.partner) }}
    >
      {/* Delete checkbox */}
      {deleteMode && (
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          isSelected ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      {/* Logo */}
      <div className="w-12 h-8 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded border border-gray-100">
        {src
          ? <img src={src} alt={sponsor.partner} className="max-w-full max-h-full object-contain" />
          : <span className="text-gray-300 text-[10px]">—</span>
        }
      </div>

      {/* Naam */}
      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{sponsor.partner}</span>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {koepelCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 bg-teal-50 text-teal-600 rounded-full font-medium">
            {koepelCount} koepel{koepelCount !== 1 ? 's' : ''}
          </span>
        )}
        {eventCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
            {eventCount} event{eventCount !== 1 ? 's' : ''}
          </span>
        )}
        {koepelCount === 0 && eventCount === 0 && (
          <span className="text-[10px] text-gray-300 italic">Geen koppeling</span>
        )}
      </div>

      {/* Edit knop */}
      {!deleteMode && (
        <button
          onClick={() => onEdit(sponsor)}
          className="flex-shrink-0 p-1.5 text-gray-300 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
          title="Bewerken"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

// ─── Import modal ─────────────────────────────────────────────────────────────

function ImportModal({ files, eventGroups, onImport, onClose }) {
  const newFiles = files.filter(f => f.status === 'new')
  const changedFiles = files.filter(f => f.status === 'changed')
  const existingFiles = files.filter(f => f.status === 'existing')

  const [selected, setSelected] = useState(() => new Set(newFiles.map(f => f.file.name)))
  const [bulkKoepel, setBulkKoepel] = useState('')
  const koepelNames = Object.keys(eventGroups || {})

  function toggle(name) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function toggleSection(list) {
    const allSel = list.every(f => selected.has(f.file.name))
    setSelected(prev => {
      const next = new Set(prev)
      for (const { file } of list) allSel ? next.delete(file.name) : next.add(file.name)
      return next
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 48px)' }}
        onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">Logo's importeren</h2>
            <p className="text-xs text-gray-400 mt-0.5">{files.length} bestanden gevonden in de map</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l12 12M14 2L2 14"/>
            </svg>
          </button>
        </div>

        {/* Bulk koepel-toewijzing */}
        {koepelNames.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <span className="text-xs text-gray-500 flex-shrink-0">Toevoegen aan koepel:</span>
            <select
              value={bulkKoepel}
              onChange={e => setBulkKoepel(e.target.value)}
              className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
            >
              <option value="">— geen —</option>
              {koepelNames.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            {bulkKoepel && (
              <span className="text-[10px] text-gray-400 italic">bestaande koppelingen blijven behouden</span>
            )}
          </div>
        )}

        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">

          {/* Nieuw */}
          {newFiles.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700">
                  Nieuw · {newFiles.length}
                </span>
                <button onClick={() => toggleSection(newFiles)} className="text-xs text-gray-400 hover:text-gray-600">
                  {newFiles.every(f => selected.has(f.file.name)) ? 'Deselecteer' : 'Selecteer alles'}
                </button>
              </div>
              <div className="space-y-0.5">
                {newFiles.map(({ file }) => (
                  <label key={file.name} className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input type="checkbox" checked={selected.has(file.name)} onChange={() => toggle(file.name)}
                      className="w-4 h-4 accent-green-600 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 font-mono truncate">{file.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatSize(file.size)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Bijgewerkt */}
          {changedFiles.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700">
                  Bijgewerkt · {changedFiles.length}
                </span>
                <button onClick={() => toggleSection(changedFiles)} className="text-xs text-gray-400 hover:text-gray-600">
                  {changedFiles.every(f => selected.has(f.file.name)) ? 'Deselecteer' : 'Selecteer alles'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mb-2">Lokaal bestand is nieuwer dan de laatste upload.</p>
              <div className="space-y-0.5">
                {changedFiles.map(({ file }) => (
                  <label key={file.name} className={`flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${selected.has(file.name) ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selected.has(file.name)} onChange={() => toggle(file.name)}
                      className="w-4 h-4 accent-orange-500 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 font-mono truncate">{file.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatSize(file.size)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Al aanwezig */}
          {existingFiles.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500">
                  Al aanwezig · {existingFiles.length}
                </span>
                <button onClick={() => toggleSection(existingFiles)} className="text-xs text-gray-400 hover:text-gray-600">
                  {existingFiles.every(f => selected.has(f.file.name)) ? 'Deselecteer' : 'Selecteer alles'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mb-2">Selecteer bestanden die je wil overschrijven.</p>
              <div className="space-y-0.5">
                {existingFiles.map(({ file }) => (
                  <label key={file.name} className={`flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${selected.has(file.name) ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selected.has(file.name)} onChange={() => toggle(file.name)}
                      className="w-4 h-4 accent-orange-500 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-600 font-mono truncate">{file.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatSize(file.size)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Niets te doen */}
          {newFiles.length === 0 && changedFiles.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              Alle logo's in deze map staan al in de storage en zijn niet gewijzigd.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Annuleren
          </button>
          <button
            onClick={() => onImport(selected, bulkKoepel)}
            disabled={selected.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
          >
            {selected.size === 0
              ? 'Niets geselecteerd'
              : `Importeer ${selected.size} logo${selected.size !== 1 ? "'s" : ''}`}
          </button>
        </div>
      </div>
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
  const [deleteMode, setDeleteMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('tile')
  const [sortMode, setSortMode] = useState('alpha')            // 'alpha' | 'recent'
  const [storageTimestamps, setStorageTimestamps] = useState({}) // filename → upload ms
  const [importFiles, setImportFiles] = useState(null)        // null = modal dicht
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 })
  const [logoVersion, setLogoVersion] = useState(null)        // cache-buster na import
  const [localPreviews, setLocalPreviews] = useState({})     // filename → objectURL na import
  const fileRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const [tagsData, catsData, eventsData, catList, groupsData, eventGroupsData, storageData] = await Promise.all([
          loadTags(),
          loadSponsorCategories(),
          loadEvents(),
          loadSetting('category_list', DEFAULT_CATEGORIES),
          loadSponsorGroups(),
          loadEventGroups(),
          supabase.storage.from('logos').list('', { limit: 2000 }),
        ])
        setTags(tagsData)
        setSponsorCategories(catsData)
        setSponsorGroups(groupsData)
        setEventGroups(eventGroupsData)
        setEvents(eventsData)
        setCategoryList(catList)

        // Voeg storage-only logo's toe als sponsor-entry ontbreekt in sponsors.json
        const storageFiles = storageData?.data || []
        const timestamps = {}
        for (const f of storageFiles) {
          const fn = f.name.replace(/\.(png|svg)$/i, '')
          if (fn) timestamps[fn] = f.updated_at ? new Date(f.updated_at).getTime() : 0
        }
        setStorageTimestamps(timestamps)

        const extraFromStorage = storageFiles
          .map(f => f.name.replace(/\.(png|svg)$/i, ''))
          .filter(fn => fn && !sponsors.some(s => s.filename === fn))
          .map(fn => ({ partner: fn.replace(/_/g, ' '), filename: fn, _fromStorage: true }))

        setAllSponsors([...sponsors, ...extraFromStorage])
      } catch (e) {
        showToast('Fout bij laden: ' + e.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const result = allSponsors.filter(s => {
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

    if (sortMode === 'recent') {
      // Nieuwste upload eerst; onbekende timestamps onderaan
      result.sort((a, b) => (storageTimestamps[b.filename] || 0) - (storageTimestamps[a.filename] || 0))
    } else {
      result.sort((a, b) => a.partner.localeCompare(b.partner, 'nl'))
    }
    return result
  }, [allSponsors, search, filterValue, tags, eventGroups, sponsorGroups, sortMode, storageTimestamps])

  async function handleFolderSelect(e) {
    const files = Array.from(e.target.files)
      .filter(f => !f.name.startsWith('.') && /\.(png|svg)$/i.test(f.name))
    fileRef.current.value = ''
    if (!files.length) return

    // Vers ophalen: naam → upload-timestamp (ms)
    const { data: stData } = await supabase.storage.from('logos').list('', { limit: 2000 })
    const inStorage = new Map()
    if (stData) {
      for (const f of stData) {
        inStorage.set(f.name, f.updated_at ? new Date(f.updated_at).getTime() : 0)
      }
    }

    const categorized = files.map(file => {
      if (!inStorage.has(file.name)) return { file, status: 'new' }
      // Lokaal bestand nieuwer dan laatste upload → waarschijnlijk gewijzigd
      return file.lastModified > inStorage.get(file.name)
        ? { file, status: 'changed' }
        : { file, status: 'existing' }
    })

    const order = { new: 0, changed: 1, existing: 2 }
    categorized.sort((a, b) =>
      order[a.status] !== order[b.status]
        ? order[a.status] - order[b.status]
        : a.file.name.localeCompare(b.file.name)
    )

    setImportFiles(categorized)
  }

  async function handleImport(selectedNames, bulkKoepel) {
    const toUpload = importFiles.filter(f => selectedNames.has(f.file.name))
    setImportFiles(null)
    setImporting(true)
    setImportProgress({ done: 0, total: toUpload.length })

    let ok = 0, fail = 0
    const previews = {}
    const successPartners = []   // partner-namen van geslaagde uploads (voor bulk koepel)
    const newTimestamps = {}
    const now = Date.now()

    for (const { file } of toUpload) {
      const { error } = await supabase.storage.from('logos').upload(file.name, file, { upsert: true })
      if (error) { fail++; console.error(error) } else {
        ok++
        const filenameNoExt = file.name.replace(/\.(png|svg)$/i, '')
        // Sla lokale objectURL op — toon het logo direct vanuit geheugen, los van CDN
        previews[filenameNoExt] = URL.createObjectURL(file)
        newTimestamps[filenameNoExt] = now
        // Bepaal partner-naam (bestaand of auto-gegenereerd)
        const existing = allSponsors.find(s => s.filename === filenameNoExt)
        successPartners.push(existing ? existing.partner : filenameNoExt.replace(/_/g, ' '))
      }
      setImportProgress(prev => ({ ...prev, done: prev.done + 1 }))
    }

    setImporting(false)
    if (ok > 0) {
      // Voeg nieuwe sponsors toe die nog niet in allSponsors staan
      const newEntries = Object.keys(previews)
        .filter(fn => !allSponsors.some(s => s.filename === fn))
        .map(fn => ({ partner: fn.replace(/_/g, ' '), filename: fn, _fromStorage: true }))
      if (newEntries.length > 0) {
        setAllSponsors(prev => [...prev, ...newEntries])
      }

      setLocalPreviews(prev => ({ ...prev, ...previews }))
      setStorageTimestamps(prev => ({ ...prev, ...newTimestamps }))
      setLogoVersion(Date.now())

      // Bulk koepel toewijzen (merge: nooit bestaande categorie overschrijven)
      if (bulkKoepel && successPartners.length > 0) {
        const updates = {}
        for (const partner of successPartners) {
          const existing = sponsorGroups[partner] || {}
          // Sla over als deze koepel al bij de sponsor hoort — bestaande categorie behouden
          if (bulkKoepel in existing) continue
          updates[partner] = { ...existing, [bulkKoepel]: '' }
        }
        const updateEntries = Object.entries(updates)
        if (updateEntries.length > 0) {
          try {
            await Promise.all(updateEntries.map(([p, g]) => saveSponsorGroup(p, g)))
            setSponsorGroups(prev => ({ ...prev, ...updates }))
            showToast(`${ok} logo${ok > 1 ? "'s" : ''} geïmporteerd · ${updateEntries.length} toegevoegd aan ${bulkKoepel}`)
          } catch (e) {
            showToast('Koepel-toewijzing gedeeltelijk mislukt: ' + e.message, 'error')
          }
        } else {
          showToast(`${ok} logo${ok > 1 ? "'s" : ''} geïmporteerd · allemaal al in ${bulkKoepel}`)
        }
      } else {
        showToast(`${ok} logo${ok > 1 ? "'s" : ''} geïmporteerd`)
      }
    }
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
          {/* Sort toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setSortMode('alpha')}
              title="Alfabetisch sorteren"
              className={`p-2 transition-colors ${sortMode === 'alpha' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 7h12M3 12h9M3 17h6M17 5v14m0 0l-3-3m3 3l3-3" />
              </svg>
            </button>
            <button
              onClick={() => setSortMode('recent')}
              title="Laatst toegevoegd"
              className={`p-2 transition-colors ${sortMode === 'recent' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('tile')}
              title="Tegelweergave"
              className={`p-2 transition-colors ${viewMode === 'tile' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Lijstweergave"
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Verborgen map-picker */}
          <input
            ref={el => { fileRef.current = el; if (el) el.webkitdirectory = true }}
            type="file"
            className="hidden"
            onChange={handleFolderSelect}
          />

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
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {importing
              ? `Uploaden ${importProgress.done}/${importProgress.total}…`
              : "Logo's uploaden"}
          </button>
        </div>
      </div>

      {/* Tegel- of lijstweergave */}
      {viewMode === 'tile' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
          {filtered.map(sponsor => (
            <SponsorCard
              key={`${sponsor.partner}-${logoVersion || 0}`}
              sponsor={sponsor}
              onEdit={setEditingSponsor}
              deleteMode={deleteMode}
              isSelected={selected.has(sponsor.partner)}
              onToggleSelect={toggleSelect}
              logoVersion={logoVersion}
              localPreview={localPreviews[sponsor.filename]}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {filtered.map(sponsor => (
            <SponsorRow
              key={`${sponsor.partner}-${logoVersion || 0}`}
              sponsor={sponsor}
              tags={tags}
              sponsorGroups={sponsorGroups}
              onEdit={setEditingSponsor}
              deleteMode={deleteMode}
              isSelected={selected.has(sponsor.partner)}
              onToggleSelect={toggleSelect}
              logoVersion={logoVersion}
              localPreview={localPreviews[sponsor.filename]}
            />
          ))}
        </div>
      )}

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

      {/* Import modal */}
      {importFiles && (
        <ImportModal
          files={importFiles}
          eventGroups={eventGroups}
          onImport={handleImport}
          onClose={() => setImportFiles(null)}
        />
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
