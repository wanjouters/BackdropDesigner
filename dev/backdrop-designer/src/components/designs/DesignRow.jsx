export default function DesignRow({ d, renamingDesign, isLoaded, onLoad, onDelete, onRename, onStartRename, onDuplicate }) {
  const inputRef = { current: null }
  return (
    <div className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ml-2 ${isLoaded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      {renamingDesign === d.id ? (
        <div className="flex items-center gap-1 flex-1">
          <input
            ref={el => { inputRef.current = el }}
            autoFocus
            defaultValue={d.name}
            onKeyDown={e => {
              if (e.key === 'Enter') onRename(d.id, inputRef.current.value)
              if (e.key === 'Escape') onStartRename(null)
            }}
            className="flex-1 text-xs px-2 py-0.5 border border-blue-400 rounded focus:outline-none"
          />
          <button onMouseDown={e => { e.preventDefault(); onRename(d.id, inputRef.current.value) }} className="text-[10px] text-blue-600 font-semibold">OK</button>
          <button onMouseDown={() => onStartRename(null)} className="text-[10px] text-gray-400">✕</button>
        </div>
      ) : (
        <>
          <button onClick={() => onLoad(d)} className="flex-1 text-left min-w-0">
            <p className={`text-xs font-medium truncate ${isLoaded ? 'text-blue-700' : 'text-gray-800'}`}>{d.name}</p>
            <p className="text-[10px] text-gray-400">{d.formatCode}{d.formatCode ? ' · ' : ''}{new Date(d.savedAt).toLocaleDateString('nl-BE')}</p>
          </button>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={e => { e.stopPropagation(); onDuplicate(d) }} title="Dupliceren"
              className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="7" height="7" rx="1"/><path d="M1 8V2a1 1 0 011-1h6"/>
              </svg>
            </button>
            <button onClick={e => { e.stopPropagation(); onStartRename(d.id) }} title="Hernoemen"
              className="p-1 text-gray-300 hover:text-gray-500 rounded transition-colors">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l3 3-7 7H1V8l7-7z"/></svg>
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(d.id) }} title="Verwijderen"
              className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/></svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
