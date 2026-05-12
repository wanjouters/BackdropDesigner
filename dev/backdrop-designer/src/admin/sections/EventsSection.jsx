import { useState, useEffect, useRef } from 'react'
import { loadEvents, saveEvents, loadEventGroups, saveEventGroups } from '../../utils/db'

function GripIcon() {
  return (
    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

// ─── Enkel event-rij ──────────────────────────────────────────────────────────

function EventItem({ code, index, isReorderOver, isDragging, onDragStartReorder, onDragStartAssign, onDragOver, onDrop, onDragEnd, onDelete, onRename }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(code)
  const inputRef = useRef(null)
  const fromGrip = useRef(false)

  function startEdit() {
    setValue(code)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }
  function commitEdit() {
    const v = value.trim()
    if (v && v !== code) onRename(code, v)
    setEditing(false)
  }

  function handleDragStart(e) {
    if (fromGrip.current) {
      // herordenen binnen de lijst
      e.dataTransfer.setData('reorderidx', String(index))
      e.dataTransfer.effectAllowed = 'move'
      onDragStartReorder(index)
    } else {
      // slepen naar koepel
      e.dataTransfer.setData('eventcode', code)
      e.dataTransfer.effectAllowed = 'copy'
      onDragStartAssign()
    }
  }

  return (
    <div
      draggable={!editing}
      onDragStart={handleDragStart}
      onDragOver={e => {
        if (e.dataTransfer.types.includes('reorderidx')) {
          e.preventDefault()
          onDragOver(index)
        }
      }}
      onDrop={e => {
        if (e.dataTransfer.types.includes('reorderidx')) {
          e.preventDefault()
          onDrop(index)
        }
      }}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 bg-white border rounded-lg px-3 py-2.5 text-sm transition-colors group
        ${isReorderOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
        ${isDragging ? 'opacity-40' : ''}
      `}
    >
      {/* Grip — alleen voor herordenen */}
      <span
        className="cursor-grab active:cursor-grabbing shrink-0"
        onMouseDown={() => { fromGrip.current = true }}
        onMouseUp={() => { fromGrip.current = false }}
      >
        <GripIcon />
      </span>

      {/* Naam / edit */}
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false) }}
          className="flex-1 text-sm font-medium text-gray-700 border border-blue-400 rounded px-1.5 py-0.5 outline-none"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 font-medium text-gray-700 cursor-grab"
          onMouseDown={() => { fromGrip.current = false }}
        >
          {code}
        </span>
      )}

      {/* Acties */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={startEdit} className="p-1 text-gray-300 hover:text-blue-500 transition-colors" title="Hernoemen">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
          </svg>
        </button>
        <button onClick={() => onDelete(code)} className="p-1 text-gray-300 hover:text-red-500 transition-colors" title="Verwijderen">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Events list (links) ──────────────────────────────────────────────────────

function EventsList({ events, onReorder, onDelete, onAdd, onRename }) {
  const [newItem, setNewItem] = useState('')
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const [assignDragging, setAssignDragging] = useState(false)

  function handleDrop(targetIdx) {
    if (dragIdx === null || dragIdx === targetIdx) { reset(); return }
    const next = [...events]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx, 0, moved)
    onReorder(next)
    reset()
  }
  function reset() { setDragIdx(null); setOverIdx(null); setAssignDragging(false) }

  function handleAdd() {
    const v = newItem.trim()
    if (!v || events.includes(v)) return
    onAdd(v)
    setNewItem('')
  }

  return (
    <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="overflow-y-auto flex-1 space-y-1 mb-3 pr-0.5">
        {events.map((code, i) => (
          <EventItem
            key={code}
            code={code}
            index={i}
            isReorderOver={overIdx === i && dragIdx !== null && dragIdx !== i && !assignDragging}
            isDragging={dragIdx === i}
            onDragStartReorder={setDragIdx}
            onDragStartAssign={() => { setAssignDragging(true); setDragIdx(null) }}
            onDragOver={setOverIdx}
            onDrop={handleDrop}
            onDragEnd={reset}
            onDelete={onDelete}
            onRename={onRename}
          />
        ))}
        {events.length === 0 && <p className="text-xs text-gray-400 italic px-1">Nog geen events</p>}
      </div>

      <div className="flex gap-2 shrink-0 pt-2 border-t border-gray-100">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="AGR, BCC, ROAD…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-700 shrink-0"
        >
          Toevoegen
        </button>
      </div>
    </div>
  )
}

// ─── Koepel drop zone (rechts) ────────────────────────────────────────────────

function KoepelCard({ name, eventCodes, onDrop, onRemoveEvent, onDelete, onRename }) {
  const [isOver, setIsOver] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(name)

  function handleDragOver(e) {
    if (e.dataTransfer.types.includes('eventcode')) {
      e.preventDefault()
      setIsOver(true)
    }
  }
  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsOver(false)
  }
  function handleDrop(e) {
    e.preventDefault()
    setIsOver(false)
    const code = e.dataTransfer.getData('eventcode')
    if (code && !eventCodes.includes(code)) onDrop(name, code)
  }
  function commitRename() {
    const v = newName.trim()
    if (v && v !== name) onRename(name, v)
    setRenaming(false)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 rounded-xl p-4 transition-all ${
        isOver ? 'border-teal-400 bg-teal-50 shadow-sm' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {renaming ? (
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false) }}
            autoFocus
            className="flex-1 font-semibold text-sm border-b border-blue-400 outline-none bg-transparent"
          />
        ) : (
          <span className="flex-1 font-semibold text-sm text-gray-800">{name}</span>
        )}
        <span className="text-xs text-gray-400 shrink-0">{eventCodes.length} events</span>
        <button onClick={() => { setNewName(name); setRenaming(true) }}
          className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={() => onDelete(name)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className={`min-h-10 rounded-lg p-2 flex flex-wrap gap-1.5 transition-colors ${
        isOver ? 'bg-teal-100/60' : eventCodes.length === 0 ? 'bg-gray-50 border border-dashed border-gray-200' : 'bg-gray-50'
      }`}>
        {eventCodes.length === 0 ? (
          <p className="text-xs text-center w-full py-1 text-gray-400">
            {isOver ? '↓ Loslaten om toe te voegen' : 'Sleep events hiernaartoe'}
          </p>
        ) : (
          eventCodes.map(code => (
            <span key={code} className="inline-flex items-center gap-1 bg-teal-600 text-white text-xs font-semibold px-2 py-1 rounded-lg">
              {code}
              <button onClick={() => onRemoveEvent(name, code)} className="opacity-60 hover:opacity-100 transition-opacity ml-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))
        )}
      </div>
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
    try { await saveEvents(next); showToast('Events opgeslagen') }
    catch (e) { showToast('Opslaan mislukt', 'error') }
  }

  async function persistGroups(next) {
    setEventGroups(next)
    try { await saveEventGroups(next); showToast('Koepels opgeslagen') }
    catch (e) { showToast('Opslaan mislukt', 'error') }
  }

  function handleRenameEvent(oldCode, newCode) {
    if (events.includes(newCode)) { showToast('Event bestaat al', 'error'); return }
    persistEvents(events.map(e => e === oldCode ? newCode : e))
    // ook bijwerken in koepels
    const next = {}
    for (const [k, v] of Object.entries(eventGroups)) {
      next[k] = v.map(e => e === oldCode ? newCode : e)
    }
    persistGroups(next)
  }

  function handleAddKoepel() {
    const v = newKoepel.trim()
    if (!v || eventGroups[v]) return
    persistGroups({ ...eventGroups, [v]: [] })
    setNewKoepel('')
  }

  function handleDrop(koepelName, code) {
    persistGroups({ ...eventGroups, [koepelName]: [...(eventGroups[koepelName] || []), code] })
  }

  function handleRemoveEvent(koepelName, code) {
    persistGroups({ ...eventGroups, [koepelName]: eventGroups[koepelName].filter(e => e !== code) })
  }

  function handleKoepelDelete(name) {
    const next = { ...eventGroups }
    delete next[name]
    persistGroups(next)
  }

  function handleKoepelRename(oldName, newName) {
    if (eventGroups[newName]) return
    const next = {}
    for (const [k, v] of Object.entries(eventGroups)) next[k === oldName ? newName : k] = v
    persistGroups(next)
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Laden…</div>

  return (
    <div className="p-8 grid grid-cols-2 gap-8 items-start h-full">

      {/* Events */}
      <div className="flex flex-col">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Events</h3>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex-1">
          <EventsList
            events={events}
            onReorder={persistEvents}
            onDelete={code => persistEvents(events.filter(e => e !== code))}
            onAdd={code => persistEvents([...events, code])}
            onRename={handleRenameEvent}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 px-1">
          Grip = herordenen · Naam slepen = aan koepel koppelen · Hover voor bewerken/verwijderen
        </p>
      </div>

      {/* Koepels */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Koepels</h3>
        <div className="space-y-3 mb-3">
          {Object.entries(eventGroups).map(([name, codes]) => (
            <KoepelCard
              key={name}
              name={name}
              eventCodes={codes}
              onDrop={handleDrop}
              onRemoveEvent={handleRemoveEvent}
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
