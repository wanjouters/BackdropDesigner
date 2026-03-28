import { useState } from 'react'

export default function CustomFormatModal({ onConfirm, onClose }) {
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [cols, setCols] = useState(10)
  const [rows, setRows] = useState(8)

  function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim()) return
    onConfirm({
      Code: code.trim().toUpperCase(),
      Beschrijving: description.trim() || code.trim(),
      Categorie: 'CUSTOM',
      EventStyle: 'CUSTOM',
      Variant: null,
      Cols: parseInt(cols),
      Rows: parseInt(rows),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Nieuw formaat</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Code (naam)
            </label>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="bv. MIJN_BACKDROP_10x6"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Beschrijving (optioneel)
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="bv. Backstage custom"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Kolommen
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={cols}
                onChange={e => setCols(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Rijen
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={e => setRows(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="text-xs text-gray-400 text-center">
            {cols * rows} slots in totaal
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
            >
              Aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
