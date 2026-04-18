import { useState, useEffect } from 'react'
import allStaticFormats from '../../data/backdropFormats.json'
import { loadFormats, upsertFormat, deleteFormat, bulkImportFormats, reorderFormats, saveSetting } from '../../utils/db'
import FormatEditModal from './FormatEditModal'

function GripIcon() {
  return (
    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

export default function FormatenSection({ showToast }) {
  const [formats, setFormats] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [editingFormat, setEditingFormat] = useState(null) // null | 'new' | format object
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // format to delete
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    loadFormats()
      .then(setFormats)
      .catch(e => showToast('Laden mislukt: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  // ─── Drag reorder ─────────────────────────────────────────────────────────
  function handleDragStart(i) { setDragIdx(i) }
  function handleDragOver(e, i) { e.preventDefault(); setOverIdx(i) }
  async function handleDrop(i) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...formats]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    setFormats(next)
    setDragIdx(null)
    setOverIdx(null)
    try {
      await reorderFormats(next)
    } catch (e) {
      showToast('Volgorde opslaan mislukt', 'error')
    }
  }

  // ─── Save (create or update) ──────────────────────────────────────────────
  async function handleSave(format) {
    const isNew = !formats.find(f => f.id === format.id)
    try {
      const sortOrder = isNew ? formats.length : formats.findIndex(f => f.id === format.id)
      await upsertFormat(format, sortOrder)
      setFormats(prev => {
        const idx = prev.findIndex(f => f.id === format.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = format
          return next
        }
        return [...prev, format]
      })
      setEditingFormat(null)
      showToast(isNew ? 'Formaat aangemaakt' : 'Formaat opgeslagen')
    } catch (e) {
      showToast('Opslaan mislukt: ' + e.message, 'error')
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete(format) {
    try {
      await deleteFormat(format.id)
      setFormats(prev => prev.filter(f => f.id !== format.id))
      setConfirmDelete(null)
      showToast('Formaat verwijderd', 'info')
    } catch (e) {
      showToast('Verwijderen mislukt: ' + e.message, 'error')
    }
  }

  // ─── Import all static formats ────────────────────────────────────────────
  async function handleImport() {
    setImporting(true)
    try {
      await bulkImportFormats(allStaticFormats)
      const imported = await loadFormats()
      setFormats(imported)
      await saveSetting('static_imported', true)
      showToast(`${imported.length} formaten geïmporteerd`)
    } catch (e) {
      showToast('Importeren mislukt: ' + e.message, 'error')
    } finally {
      setImporting(false)
    }
  }

  // ─── Filtered list ────────────────────────────────────────────────────────
  const visible = query.trim()
    ? formats.filter(f =>
        (f.Beschrijving || '').toLowerCase().includes(query.toLowerCase()) ||
        (f.Code || '').toLowerCase().includes(query.toLowerCase()) ||
        (f.tags || []).some(t => t.toLowerCase().includes(query.toLowerCase()))
      )
    : formats

  if (loading) return <div className="p-8 text-sm text-gray-400">Laden…</div>

  return (
    <div className="p-8 space-y-6">

      {/* Import banner */}
      {formats.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Geen formaten in database</p>
            <p className="text-xs text-amber-600 mt-1">
              Er staan nog geen formaten in Supabase. Importeer de {allStaticFormats.length} standaard formaten om te beginnen.
              Daarna kan je ze bewerken, tags toevoegen en nieuwe formaten aanmaken.
            </p>
            <button
              onClick={handleImport}
              disabled={importing}
              className="mt-3 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60"
            >
              {importing ? 'Bezig met importeren…' : `Importeer ${allStaticFormats.length} standaard formaten`}
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {formats.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Zoek op naam, code of tag…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-9"
            />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 2l8 8M10 2L2 10"/>
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setEditingFormat('new')}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 1v10M1 6h10"/>
            </svg>
            Nieuw formaat
          </button>
        </div>
      )}

      {/* Count */}
      {formats.length > 0 && (
        <p className="text-xs text-gray-400">
          {visible.length === formats.length
            ? `${formats.length} formaten`
            : `${visible.length} van ${formats.length} formaten`
          }
          {' · '}volgorde aanpassen via slepen
        </p>
      )}

      {/* List */}
      {visible.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {visible.map((f, i) => (
            <div
              key={f.id}
              draggable={!query}
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 group transition-colors ${
                overIdx === i ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              {/* Grip */}
              {!query && (
                <span className="cursor-grab flex-shrink-0">
                  <GripIcon />
                </span>
              )}

              {/* Name + tags */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {f.Beschrijving || f.Code}
                  </span>
                  <span className="text-xs text-gray-300 flex-shrink-0">{f.Cols}×{f.Rows}</span>
                </div>
                {f.tags && f.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {f.tags.map(t => (
                      <span key={t} className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => setEditingFormat(f)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Bewerken"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 1l4 4-8 8H1V9l8-8z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setConfirmDelete(f)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Verwijderen"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 3.5h10M5 3.5V2.5h4v1M4 3.5v7h6v-7"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty search result */}
      {formats.length > 0 && visible.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">Geen formaten gevonden voor "{query}"</p>
      )}

      {/* Edit modal */}
      {editingFormat && (
        <FormatEditModal
          format={editingFormat === 'new' ? null : editingFormat}
          allTags={[...new Set(formats.flatMap(f => f.tags || []))].sort()}
          onSave={handleSave}
          onClose={() => setEditingFormat(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-bold text-gray-800 mb-2">Formaat verwijderen?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-semibold text-gray-700">{confirmDelete.Beschrijving || confirmDelete.Code}</span> wordt permanent verwijderd.
              Opgeslagen ontwerpen die dit formaat gebruiken blijven bewaard.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                Annuleren
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
