import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { exportJpeg } from '../../utils/exportJpeg'

export default function ExportMenu({ format, slots, customLogos, onImportJson }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const importRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleJpeg() {
    exportJpeg(format, slots, customLogos)
    setOpen(false)
  }

  function handleJson() {
    var data = { version: 1, format: format, slots: slots, exportedAt: Date.now() }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = (format.Code || 'ontwerp') + '_design.json'
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  function handleImportClick() {
    setOpen(false)
    if (importRef.current) importRef.current.click()
  }

  function handleImportFile(e) {
    var file = e.target.files[0]
    if (!file) return
    var reader = new FileReader()
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result)
        if (!data.format || !Array.isArray(data.slots)) throw new Error('Ongeldig formaat')
        onImportJson(data)
      } catch (err) {
        alert('Kon het bestand niet laden: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleCsv() {
    const { Cols, Rows, Code } = format
    function csvCell(val) {
      var s = (val && val !== '') ? val : 'BLANK'
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    // Metadata rows (parseable by Gridzilla via META prefix)
    var meta = []
    meta.push('META,BackgroundColor_Hex,' + (format.BackgroundColor_Hex || '#000000'))
    var c = format.BackgroundColor_C ?? ''
    var m = format.BackgroundColor_M ?? ''
    var y = format.BackgroundColor_Y ?? ''
    var k = format.BackgroundColor_K ?? ''
    if (c !== '' || m !== '' || y !== '' || k !== '') {
      meta.push('META,BackgroundColor_CMYK,' + c + ',' + m + ',' + y + ',' + k)
    }
    var colHeaders = Array.from({ length: Cols }, function(_, i) { return 'C' + (i + 1) })
    var lines = meta.concat([colHeaders.join(',')])
    for (var r = 0; r < Rows; r++) {
      var row = []
      for (var c2 = 0; c2 < Cols; c2++) row.push(csvCell(slots[r * Cols + c2]))
      lines.push(row.join(','))
    }
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = (Code || 'grid') + '_grid.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Exporteren"
        className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold text-sm px-3 py-2 rounded-lg transition-colors shadow-sm"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 1v8M4 6l3 3 3-3M2 11h10"/>
        </svg>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>
      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.12 }}
          className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-white border border-gray-200 rounded-xl shadow-xl py-1"
        >
          <button onClick={handleJpeg}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="1" y="1" width="12" height="12" rx="2"/>
              <path d="M1 9l3-3 2 2 3-4 4 5"/>
            </svg>
            <span className="font-medium">JPEG</span>
            <span className="ml-auto text-xs text-gray-400">beeld</span>
          </button>
          <button onClick={handleCsv}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 1h7l3 3v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
              <path d="M9 1v3h3M4 8h6M4 11h4"/>
            </svg>
            <span className="font-medium">CSV</span>
            <span className="ml-auto text-xs text-gray-400">Gridzilla</span>
          </button>
          <button onClick={handleJson}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 1h7l3 3v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
              <path d="M9 1v3h3"/>
              <path d="M4 7.5c0-1 1.5-1 1.5 0s-1.5 1-1.5 2 1.5 1 1.5 0M8 7h1.5a1 1 0 010 2H8"/>
            </svg>
            <span className="font-medium">JSON</span>
            <span className="ml-auto text-xs text-gray-400">backup</span>
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={handleImportClick}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M7 10V2M4 5l3-3 3 3M2 11h10"/>
            </svg>
            <span className="font-medium">JSON laden</span>
            <span className="ml-auto text-xs text-gray-400">importeer</span>
          </button>
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
