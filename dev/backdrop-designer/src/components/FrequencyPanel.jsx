import { useState } from 'react'
import sponsors from '../data/sponsors.json'

const validNames = new Set(sponsors.map(s => s.partner))
validNames.add('BLANK')

const allSponsorNames = ['BLANK', ...sponsors.map(s => s.partner)]

export default function FrequencyPanel({ slots, onBulkReplace }) {
  const [replacing, setReplacing] = useState(null)  // name being replaced
  const [replaceQuery, setReplaceQuery] = useState('')

  const counts = {}
  const invalid = []

  slots.forEach(v => {
    if (!v) return
    counts[v] = (counts[v] || 0) + 1
    if (!validNames.has(v) && v !== 'BLANK') {
      if (!invalid.includes(v)) invalid.push(v)
    }
  })

  const entries = Object.entries(counts)
    .filter(([name]) => name !== 'BLANK')
    .sort((a, b) => b[1] - a[1])

  const filled = slots.filter(v => v && v !== 'BLANK').length
  const total = slots.length

  const filteredReplacements = allSponsorNames.filter(n =>
    n !== replacing && n.toLowerCase().includes(replaceQuery.toLowerCase())
  )

  function handlePickReplacement(to) {
    onBulkReplace(replacing, to)
    setReplacing(null)
    setReplaceQuery('')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
        Frequentie
      </h2>

      <div className="flex gap-3 mb-3 text-xs text-gray-500">
        <span><strong className="text-gray-800">{filled}</strong> / {total} slots gevuld</span>
        <span><strong className="text-gray-800">{entries.length}</strong> sponsors</span>
      </div>

      {invalid.length > 0 && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-red-600 mb-1">Onbekende sponsors ({invalid.length})</p>
          <p className="text-[10px] text-red-400 mb-1.5 leading-relaxed">Deze namen staan niet in de sponsordatabase. Controleer de spelling of voeg ze toe via het CSV-importproces.</p>
          {invalid.map(name => (
            <p key={name} className="text-xs text-red-500 font-mono">{name}</p>
          ))}
        </div>
      )}

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {entries.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-4">Nog geen sponsors toegewezen</p>
        )}
        {entries.map(([name, count]) => {
          const isInvalid = !validNames.has(name)
          const isReplacing = replacing === name
          return (
            <div key={name}>
              <div className="flex items-center gap-2 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      {isInvalid && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" title="Niet in sponsordatabase" />}
                      <span className={`text-xs font-medium truncate ${isInvalid ? 'text-red-500' : 'text-gray-700'}`}>{name}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <span className="text-xs font-mono text-gray-400">{count}×</span>
                      <button
                        onClick={() => { setReplacing(isReplacing ? null : name); setReplaceQuery('') }}
                        title={`Vervang alle ${name}`}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 ${isReplacing ? 'opacity-100 text-blue-500' : 'text-gray-400'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 4h8a4 4 0 010 8H1"/>
                          <path d="M4 1L1 4l3 3"/>
                          <path d="M13 10l-3 3-3-3"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isInvalid ? 'bg-red-300' : 'bg-blue-400'}`}
                      style={{ width: `${Math.min(100, (count / Math.max(...Object.values(counts))) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {isReplacing && (
                <div className="mt-1.5 mb-2 ml-2 border border-blue-200 rounded-lg bg-blue-50 p-2">
                  <p className="text-[10px] text-blue-500 font-semibold mb-1.5 uppercase tracking-wide">Vervangen door:</p>
                  <input
                    autoFocus
                    type="text"
                    value={replaceQuery}
                    onChange={e => setReplaceQuery(e.target.value)}
                    placeholder="Zoek sponsor..."
                    className="w-full text-xs border border-blue-200 rounded-md px-2 py-1 mb-1.5 bg-white focus:outline-none focus:border-blue-400"
                  />
                  <div className="max-h-32 overflow-y-auto space-y-0.5">
                    {filteredReplacements.slice(0, 40).map(n => (
                      <button
                        key={n}
                        onClick={() => handlePickReplacement(n)}
                        className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blue-100 text-gray-700 transition-colors"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
