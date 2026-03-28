export default function ExportButton({ format, slots }) {
  const { Cols, Rows, Code } = format

  function handleExport() {
    const colHeaders = Array.from({ length: Cols }, (_, i) => `C${i + 1}`)
    const lines = [colHeaders.join(',')]

    for (let r = 0; r < Rows; r++) {
      const row = []
      for (let c = 0; c < Cols; c++) {
        const val = slots[r * Cols + c]
        row.push(val && val !== '' ? val : 'BLANK')
      }
      lines.push(row.join(','))
    }

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${Code}_grid.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
      </svg>
      CSV exporteren
    </button>
  )
}
