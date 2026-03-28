import sponsors from '../data/sponsors.json'

const validNames = new Set(sponsors.map(s => s.partner))
validNames.add('BLANK')

export default function FrequencyPanel({ slots }) {
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
          <p className="text-xs font-semibold text-red-600 mb-1">Onbekende sponsors:</p>
          {invalid.map(name => (
            <p key={name} className="text-xs text-red-500 font-mono">{name}</p>
          ))}
        </div>
      )}

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {entries.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-4">Nog geen sponsors toegewezen</p>
        )}
        {entries.map(([name, count]) => (
          <div key={name} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-gray-700 truncate">{name}</span>
                <span className="text-xs font-mono text-gray-400 ml-2 flex-shrink-0">{count}×</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (count / Math.max(...Object.values(counts))) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
