export default function DesignRow({ d, isLoaded, onLoad, onDelete, onEditMeta, onDuplicate }) {
  return (
    <div className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ml-2 ${isLoaded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <button onClick={() => onLoad(d)} className="flex-1 text-left min-w-0">
        <p className={`text-xs font-medium truncate ${isLoaded ? 'text-blue-700' : 'text-gray-800'}`}>{d.name}</p>
        <p className="text-[10px] text-gray-400">{d.formatCode}{d.formatCode ? ' · ' : ''}{new Date(d.savedAt).toLocaleDateString('nl-BE')}</p>
      </button>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={e => { e.stopPropagation(); onDuplicate(d) }} title="Dupliceren"
          className="p-1 text-gray-300 hover:text-blue-500 rounded transition-colors">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="7" height="7" rx="1"/><path d="M1 8V2a1 1 0 011-1h6"/>
          </svg>
        </button>
        <button onClick={e => { e.stopPropagation(); onEditMeta(d) }} title="Naam / event / editie aanpassen"
          className="p-1 text-gray-300 hover:text-gray-500 rounded transition-colors">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l3 3-7 7H1V8l7-7z"/></svg>
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(d.id) }} title="Verwijderen"
          className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/></svg>
        </button>
      </div>
    </div>
  )
}
