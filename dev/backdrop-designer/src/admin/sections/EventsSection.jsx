import { useState, useEffect } from 'react'
import { loadEvents, saveEvents, loadEventGroups, saveEventGroups } from '../../utils/db'

function GripIcon() {
  return (
    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

// ─── Eenvoudige sorteerbare lijst met HTML5 drag ──────────────────────────────

function SortableList({ items, onReorder, onDelete, onAdd, placeholder }) {
  const [newItem, setNewItem] = useState('')
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  function handleDragStart(i) { setDragIdx(i) }
  function handleDragOver(e, i) { e.preventDefault(); setOverIdx(i) }
  function handleDrop(i) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...items]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    onReorder(next)
    setDragIdx(null)
    setOverIdx(null)
  }

  function handleAdd() {
    const v = newItem.trim().toUpperCase()
    if (!v || items.includes(v)) return
    onAdd(v)
    setNewItem('')
  }

  return (
    <div>
      <div className="space-y-1 mb-3">
        {items.map((item, i) => (
          <div
            key={item}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={e => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
            className={`flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm cursor-grab active:cursor-grabbing transition-colors ${
              overIdx === i ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <span className="cursor-grab"><GripIcon /></span>
            <span className="flex-1 font-medium text-gray-700">{item}</span>
            <button
              onClick={() => onDelete(item)}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-400 italic px-1">Nog geen items</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-700"
        >
          Toevoegen
        </button>
      </div>
    </div>
  )
}

// ─── Koepel editor ────────────────────────────────────────────────────────────

function KoepelEditor({ name, eventCodes, allEvents, onChange, onDelete, onRename }) {
  const [expanded, setExpanded] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(name)

  function toggleEvent(code) {
    const next = eventCodes.includes(code)
      ? eventCodes.filter(e => e !== code)
      : [...eventCodes, code]
    onChange(name, next)
  }

  function handleRename() {
    const v = newName.trim()
    if (v && v !== name) onRename(name, v)
    setRenaming(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => setExpanded(e => !e)} className="flex-1 flex items-center gap-2 text-left">
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {renaming ? (
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => { if (e.key === 'Enter') handleRename() }}
              onClick={e => e.stopPropagation()}
              autoFocus
              className="font-medium text-sm border-b border-blue-400 outline-none bg-transparent"
            />
          ) : (
            <span className="font-medium text-sm text-gray-800">{name}</span>
          )}
          <span className="text-xs text-gray-400">({eventCodes.length} events)</span>
        </button>
        <button onClick={() => setRenaming(true)} className="text-gray-300 hover:text-gray-600 p-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={() => onDelete(name)} className="text-gray-300 hover:text-red-500 p-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400 mb-3">Klik op een event om het toe te voegen of te verwijderen.</p>
          <div className="flex flex-wrap gap-2">
            {allEvents.map(code => {
              const active = eventCodes.includes(code)
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleEvent(code)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-200 text-gray-300 hover:border-blue-300 hover:text-blue-600 bg-white'
                  }`}
                >
                  {active && '✓ '}{code}
                </button>
              )
            })}
            {allEvents.length === 0 && (
              <p className="text-xs text-gray-400">Voeg eerst events toe in de linkerkolom.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function EventsSection({ showToast }) {
  const [events, setEvents] = useState([])
  const [eventGroups, setEventGroups] = useState({})
  const [newKoepel, setNewKoepel] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadEvents(), loadEventGroups()]).then(([ev, gr]) => {
      setEvents(ev)
      setEventGroups(gr)
      setLoading(false)
    }).catch(e => {
      showToast('Laden mislukt: ' + e.message, 'error')
      setLoading(false)
    })
  }, [])

  async function persistEvents(next) {
    setEvents(next)
    try { await saveEvents(next) } catch (e) { showToast('Opslaan mislukt', 'error') }
    showToast('Events opgeslagen')
  }

  async function persistGroups(next) {
    setEventGroups(next)
    try { await saveEventGroups(next) } catch (e) { showToast('Opslaan mislukt', 'error') }
    showToast('Koepels opgeslagen')
  }

  function handleAddKoepel() {
    const v = newKoepel.trim()
    if (!v || eventGroups[v]) return
    const next = { ...eventGroups, [v]: [] }
    persistGroups(next)
    setNewKoepel('')
  }

  function handleKoepelChange(name, codes) {
    persistGroups({ ...eventGroups, [name]: codes })
  }

  function handleKoepelDelete(name) {
    const next = { ...eventGroups }
    delete next[name]
    persistGroups(next)
  }

  function handleKoepelRename(oldName, newName) {
    if (eventGroups[newName]) return
    const next = {}
    for (const [k, v] of Object.entries(eventGroups)) {
      next[k === oldName ? newName : k] = v
    }
    persistGroups(next)
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Laden…</div>

  return (
    <div className="p-8 grid grid-cols-2 gap-8 items-start">
      {/* Events */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Events</h3>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <SortableList
            items={events}
            placeholder="AGR, BCC, ROAD…"
            onReorder={persistEvents}
            onDelete={code => persistEvents(events.filter(e => e !== code))}
            onAdd={code => persistEvents([...events, code])}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 px-1">
          Volgorde bepaalt de weergave in de app. Nieuwe code wordt automatisch in hoofdletters gezet.
        </p>
      </div>

      {/* Koepels */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Koepels</h3>
        <div className="space-y-2 mb-3">
          {Object.entries(eventGroups).map(([name, codes]) => (
            <KoepelEditor
              key={name}
              name={name}
              eventCodes={codes}
              allEvents={events}
              onChange={handleKoepelChange}
              onDelete={handleKoepelDelete}
              onRename={handleKoepelRename}
            />
          ))}
          {Object.keys(eventGroups).length === 0 && (
            <p className="text-xs text-gray-400 italic">Nog geen koepels</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKoepel}
            onChange={e => setNewKoepel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddKoepel()}
            placeholder="Nieuwe koepel…"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAddKoepel}
            disabled={!newKoepel.trim()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-700"
          >
            Toevoegen
          </button>
        </div>
      </div>
    </div>
  )
}
