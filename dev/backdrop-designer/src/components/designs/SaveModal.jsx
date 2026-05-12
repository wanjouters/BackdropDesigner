import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalVariants, backdropVariants } from '../../utils/animations'

function toTitleCase(s) {
  if (!s) return s
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function SaveModal({ events, defaults, onConfirm, onCancel }) {
  var currentYear = new Date().getFullYear()
  var [event, setEvent] = useState(defaults && defaults.event ? defaults.event : '')
  var [edition, setEdition] = useState(defaults && defaults.edition ? defaults.edition : currentYear)
  var [name, setName] = useState(defaults && defaults.name ? defaults.name : '')

  function handleConfirm() {
    if (!name.trim()) return
    onConfirm({ event: event || null, edition: edition || null, name: name.trim() })
  }

  return (
    <AnimatePresence>
    <motion.div
      variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
      >
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Ontwerp opslaan</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Event</label>
            <select value={event} onChange={e => setEvent(e.target.value)}
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
              <option value="">Geen event</option>
              {events.map(ev => <option key={ev} value={ev}>{toTitleCase(ev)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Editie (jaar)</label>
            <input type="number" value={edition}
              onChange={e => setEdition(parseInt(e.target.value, 10) || currentYear)}
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              min={2000} max={2100}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Naam *</label>
            <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onCancel() }}
              placeholder="Bijv. Startpodium — Variant A"
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onCancel}
            className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors">
            Annuleren
          </button>
          <button onClick={handleConfirm} disabled={!name.trim()}
            className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Opslaan
          </button>
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  )
}
