export default function ConfirmModal({ message, confirmLabel = 'Verwijderen', variant = 'danger', onConfirm, onCancel }) {
  const btnClass = variant === 'warning'
    ? 'bg-orange-500 hover:bg-orange-600 text-white'
    : 'bg-red-600 hover:bg-red-700 text-white'
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <p className="text-sm text-gray-700 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors">
            Annuleren
          </button>
          <button onClick={() => { onConfirm(); onCancel() }}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${btnClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
