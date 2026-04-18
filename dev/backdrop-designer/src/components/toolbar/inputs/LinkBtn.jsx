export default function LinkBtn({ linked, onToggle, title, vertical }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      className={`flex-shrink-0 p-1 rounded transition-colors ${vertical ? 'self-end mb-1' : 'self-end mb-1'}
        ${linked
          ? 'text-blue-500 bg-blue-50 hover:bg-blue-100'
          : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
        }`}
    >
      {linked ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 17H7A5 5 0 0 1 7 7h2"/>
          <path d="M15 7h2a5 5 0 1 1 0 10h-2"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
      )}
    </button>
  )
}
