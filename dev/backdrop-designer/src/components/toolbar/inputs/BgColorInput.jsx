import { useState, useEffect } from 'react'

export default function BgColorInput({ format, set, onChange, backgroundPresets = [] }) {
  const [hexText, setHexText] = useState(format.BackgroundColor_Hex || '#000000')

  useEffect(() => {
    setHexText(format.BackgroundColor_Hex || '#000000')
  }, [format.BackgroundColor_Hex])

  function handleColorPicker(val) {
    set('BackgroundColor_Hex', val)
    setHexText(val)
  }

  function handleHexInput(val) {
    setHexText(val)
    var norm = val.startsWith('#') ? val : '#' + val
    if (/^#[0-9a-fA-F]{6}$/.test(norm)) set('BackgroundColor_Hex', norm.toLowerCase())
  }

  function handleHexBlur() {
    var norm = hexText.startsWith('#') ? hexText : '#' + hexText
    if (/^#[0-9a-fA-F]{6}$/.test(norm)) setHexText(norm.toLowerCase())
    else setHexText(format.BackgroundColor_Hex || '#000000')
  }

  function handleCmyk(ch, val) {
    var n = Math.max(0, Math.min(100, parseInt(val) || 0))
    set('BackgroundColor_' + ch, n)
  }

  function findMatchingPreset() {
    if (!backgroundPresets.length) return ''
    return backgroundPresets.find(p =>
      p.BackgroundColor_Hex === (format.BackgroundColor_Hex || '#000000')
    )?.id || ''
  }

  function applyPreset(presetId) {
    const p = backgroundPresets.find(x => x.id === presetId)
    if (!p || !onChange) return
    onChange({
      ...format,
      BackgroundColor_Hex: p.BackgroundColor_Hex,
      BackgroundColor_Cmyk: p.BackgroundColor_Cmyk,
      BackgroundColor_C: p.BackgroundColor_Cmyk.c,
      BackgroundColor_M: p.BackgroundColor_Cmyk.m,
      BackgroundColor_Y: p.BackgroundColor_Cmyk.y,
      BackgroundColor_K: p.BackgroundColor_Cmyk.k,
    })
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Preset dropdown */}
      <label className="flex flex-col gap-0.5">
        <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">Preset</span>
        <select
          value={findMatchingPreset()}
          onChange={e => applyPreset(e.target.value)}
          disabled={backgroundPresets.length === 0}
          className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:bg-gray-50 disabled:text-gray-300"
        >
          <option value="">{backgroundPresets.length === 0 ? '— Geen presets —' : '— Aangepast —'}</option>
          {backgroundPresets.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>

      {/* HEX */}
      <label className="flex flex-col gap-0.5">
        <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">Achtergrond</span>
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={format.BackgroundColor_Hex || '#000000'}
            onChange={e => handleColorPicker(e.target.value)}
            className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
          />
          <input
            type="text"
            value={hexText}
            onChange={e => handleHexInput(e.target.value)}
            onBlur={handleHexBlur}
            spellCheck={false}
            maxLength={7}
            className="text-xs font-mono px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 w-20"
          />
        </div>
      </label>

      {/* CMYK */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">CMYK</span>
        <div className="grid grid-cols-4 gap-1">
          {['C', 'M', 'Y', 'K'].map(function(ch) {
            return (
              <label key={ch} className="flex flex-col gap-0.5">
                <span className="text-[9px] text-gray-400 text-center">{ch}</span>
                <input
                  type="number" min={0} max={100} step={1}
                  value={format['BackgroundColor_' + ch] ?? ''}
                  onChange={e => handleCmyk(ch, e.target.value)}
                  className="text-xs px-1 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 w-full text-right tabular-nums"
                />
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
