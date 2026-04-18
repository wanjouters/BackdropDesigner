import { useState } from 'react'

import NumInput from './toolbar/inputs/NumInput'
import IntInput from './toolbar/inputs/IntInput'
import SelectInput from './toolbar/inputs/SelectInput'
import LinkBtn from './toolbar/inputs/LinkBtn'
import BgColorInput from './toolbar/inputs/BgColorInput'
import { Group, Sep } from './toolbar/layout/Group'
import { VSection, VRow } from './toolbar/layout/VSection'
import {
  parseBarPosition,
  serializeBarPosition,
  HEADER_OPTIONS,
  BAR_TYPE_OPTIONS,
  BAR_POS_OPTIONS,
  PLACE_EMPTY_OPTIONS,
  withFittedAndCentered,
} from './toolbar/constants'

export default function GridToolbar({ format, onChange, cellPresets = [], canvasPresets = [], backgroundPresets = [], layout = 'horizontal' }) {
  const [canvasLinked, setCanvasLinked] = useState(false)
  const [gutterLinked, setGutterLinked] = useState(true)
  const [lastChangedGutter, setLastChangedGutter] = useState('x')
  const [marginLinkedH, setMarginLinkedH] = useState(true)
  const [marginLinkedV, setMarginLinkedV] = useState(true)
  const [lastChangedMarginH, setLastChangedMarginH] = useState('l')
  const [lastChangedMarginV, setLastChangedMarginV] = useState('t')

  const barPos    = parseBarPosition(format.DefaultBarPosition)
  const hasHeader = format.HeaderType && format.HeaderType !== 'NONE'
  const hasBar    = format.DefaultBarType && format.DefaultBarType !== 'NONE'

  const cellH = format.CellW_mm && format.CellAspect
    ? Math.round((format.CellW_mm / format.CellAspect) * 1000) / 1000
    : format.CellH_mm

  function findMatchingPreset() {
    if (!cellPresets || cellPresets.length === 0) return ''
    for (const p of cellPresets) {
      const cellMatch =
        Math.abs((p.CellW_mm || 0) - (format.CellW_mm || 0)) < 0.5 &&
        Math.abs((p.CellAspect || 0) - (format.CellAspect || 0)) < 0.005
      const gutterMatch =
        (p.GutterX_mm == null || Math.abs(p.GutterX_mm - (format.GutterX_mm || 0)) < 0.5) &&
        (p.GutterY_mm == null || Math.abs(p.GutterY_mm - (format.GutterY_mm || 0)) < 0.5)
      if (cellMatch && gutterMatch) return p.id
    }
    return ''
  }

  function applyPreset(presetId) {
    const preset = cellPresets.find(p => p.id === presetId)
    if (!preset) return
    const cw = preset.CellW_mm
    const ch = Math.round(cw / preset.CellAspect * 1000) / 1000
    const gx = preset.GutterX_mm ?? format.GutterX_mm ?? 0
    const gy = preset.GutterY_mm ?? format.GutterY_mm ?? 0
    const ml = format.MarginLeft_mm  || 0
    const mr = format.MarginRight_mm || 0
    const mt = format.MarginTop_mm   || 0
    const mb = format.MarginBottom_mm || 0
    const availW = (format.CanvasWidth_mm  || 0) - ml - mr
    const availH = (format.CanvasHeight_mm || 0) - mt - mb
    const maxCols = Math.max(1, Math.floor((availW + gx) / (cw + gx)))
    const maxRows = Math.max(1, Math.floor((availH + gy) / (ch + gy)))
    const updated = {
      ...format,
      CellW_mm: cw, CellAspect: preset.CellAspect, CellH_mm: ch,
      TargetCellW_mm: cw, Cols: maxCols, Rows: maxRows,
      ...(preset.GutterX_mm != null && { GutterX_mm: preset.GutterX_mm }),
      ...(preset.GutterY_mm != null && { GutterY_mm: preset.GutterY_mm }),
    }
    onChange(withFittedAndCentered(updated))
  }

  function set(key, value) { onChange({ ...format, [key]: value }) }
  function setBarPosType(type) { onChange({ ...format, DefaultBarPosition: serializeBarPosition(type, barPos.row) }) }
  function setBarPosRow(row) { onChange({ ...format, DefaultBarPosition: serializeBarPosition('AFTER_ROW', row) }) }

  function handleColsChange(newCols) { onChange(withFittedAndCentered({ ...format, Cols: Math.max(1, newCols) })) }
  function handleRowsChange(newRows) { onChange(withFittedAndCentered({ ...format, Rows: Math.max(1, newRows) })) }

  function handleCellWChange(v) {
    const newH = Math.round(v / (format.CellAspect || 1.667) * 1000) / 1000
    onChange(withFittedAndCentered({ ...format, CellW_mm: v, CellH_mm: newH, TargetCellW_mm: v }))
  }

  function handleGutterXChange(v) {
    setLastChangedGutter('x')
    onChange(withFittedAndCentered(gutterLinked ? { ...format, GutterX_mm: v, GutterY_mm: v } : { ...format, GutterX_mm: v }))
  }
  function handleGutterYChange(v) {
    setLastChangedGutter('y')
    onChange(withFittedAndCentered(gutterLinked ? { ...format, GutterY_mm: v, GutterX_mm: v } : { ...format, GutterY_mm: v }))
  }
  function handleGutterLinkToggle() {
    if (!gutterLinked) {
      onChange(withFittedAndCentered(lastChangedGutter === 'y' ? { ...format, GutterX_mm: format.GutterY_mm } : { ...format, GutterY_mm: format.GutterX_mm }))
    }
    setGutterLinked(v => !v)
  }

  function handleMarginLChange(v) {
    setLastChangedMarginH('l')
    onChange(withFittedAndCentered(marginLinkedH ? { ...format, MarginLeft_mm: v, MarginRight_mm: v } : { ...format, MarginLeft_mm: v }))
  }
  function handleMarginRChange(v) {
    setLastChangedMarginH('r')
    onChange(withFittedAndCentered(marginLinkedH ? { ...format, MarginRight_mm: v, MarginLeft_mm: v } : { ...format, MarginRight_mm: v }))
  }
  function handleMarginTChange(v) {
    setLastChangedMarginV('t')
    onChange(withFittedAndCentered(marginLinkedV ? { ...format, MarginTop_mm: v, MarginBottom_mm: v } : { ...format, MarginTop_mm: v }))
  }
  function handleMarginBChange(v) {
    setLastChangedMarginV('b')
    onChange(withFittedAndCentered(marginLinkedV ? { ...format, MarginBottom_mm: v, MarginTop_mm: v } : { ...format, MarginBottom_mm: v }))
  }
  function handleMarginLinkHToggle() {
    if (!marginLinkedH) {
      onChange(withFittedAndCentered(lastChangedMarginH === 'r' ? { ...format, MarginLeft_mm: format.MarginRight_mm } : { ...format, MarginRight_mm: format.MarginLeft_mm }))
    }
    setMarginLinkedH(v => !v)
  }
  function handleMarginLinkVToggle() {
    if (!marginLinkedV) {
      onChange(withFittedAndCentered(lastChangedMarginV === 'b' ? { ...format, MarginTop_mm: format.MarginBottom_mm } : { ...format, MarginBottom_mm: format.MarginTop_mm }))
    }
    setMarginLinkedV(v => !v)
  }

  // ─── Vertical layout ─────────────────────────────────────────────────────────
  if (layout === 'vertical') {
    return (
      <div className="flex flex-col gap-2">

        {/* Canvas */}
        <VSection label="Canvas">
          {canvasPresets.length > 0 && (
            <label className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">Preset</span>
              <select
                value={canvasPresets.find(p => p.CanvasWidth_mm === format.CanvasWidth_mm && p.CanvasHeight_mm === format.CanvasHeight_mm)?.id || ''}
                onChange={e => {
                  const p = canvasPresets.find(x => x.id === e.target.value)
                  if (p) onChange(withFittedAndCentered({ ...format, CanvasWidth_mm: p.CanvasWidth_mm, CanvasHeight_mm: p.CanvasHeight_mm }))
                }}
                className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                <option value="">— Aangepast —</option>
                {canvasPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}
          <VRow>
            <NumInput label="Breedte" value={format.CanvasWidth_mm} step={1} min={1} onChange={v => {
              const next = { ...format, CanvasWidth_mm: v }
              if (canvasLinked && format.CanvasWidth_mm) next.CanvasHeight_mm = Math.round(v / format.CanvasWidth_mm * format.CanvasHeight_mm)
              onChange(withFittedAndCentered(next))
            }} wide />
            <LinkBtn linked={canvasLinked} onToggle={() => setCanvasLinked(v => !v)}
              title={canvasLinked ? 'Verhouding vergrendeld' : 'Vrije afmetingen'} />
            <NumInput label="Hoogte" value={format.CanvasHeight_mm} step={1} min={1} onChange={v => {
              const next = { ...format, CanvasHeight_mm: v }
              if (canvasLinked && format.CanvasHeight_mm) next.CanvasWidth_mm = Math.round(v / format.CanvasHeight_mm * format.CanvasWidth_mm)
              onChange(withFittedAndCentered(next))
            }} wide />
          </VRow>
          {/* Aanpassingsmodus bij canvas-wijziging */}
          <label className="flex items-center gap-2 pt-0.5 cursor-pointer select-none">
            <span className="text-[9px] uppercase tracking-wide text-gray-400 flex-1 leading-none">
              {format.FixedCellSize ? 'Cellen vast, raster past' : 'Raster vast, cellen passen'}
            </span>
            <button
              type="button"
              onClick={() => onChange({ ...format, FixedCellSize: !format.FixedCellSize })}
              className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors ${
                format.FixedCellSize ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                format.FixedCellSize ? 'translate-x-3.5' : 'translate-x-0.5'
              }`} />
            </button>
          </label>
        </VSection>

        {/* Grid + Gutter */}
        <VSection label="Grid">
          {cellPresets && cellPresets.length > 0 && (
            <label className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">Preset</span>
              <select
                value={findMatchingPreset()}
                onChange={e => applyPreset(e.target.value)}
                className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                <option value="">— Aangepast —</option>
                {cellPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}
          <VRow>
            <IntInput label="Kolommen" value={format.Cols} min={1} onChange={handleColsChange} wide />
            <IntInput label="Rijen" value={format.Rows} min={1} onChange={handleRowsChange} wide />
          </VRow>
          <VRow>
            <NumInput label="Celbreedte" value={format.CellW_mm} step={0.1} onChange={handleCellWChange} wide />
            <NumInput label="Celhoogte" value={cellH} readOnly wide />
          </VRow>
          <div className="h-px bg-gray-100 -mx-3" />
          <VRow>
            <NumInput label="Gutter H" value={format.GutterX_mm} step={0.5} onChange={handleGutterXChange} wide />
            <LinkBtn linked={gutterLinked} onToggle={handleGutterLinkToggle}
              title={gutterLinked ? 'Gelinkt — klik om los te koppelen' : 'Los — klik om te linken'} />
            <NumInput label="Gutter V" value={format.GutterY_mm} step={0.5} onChange={handleGutterYChange} wide />
          </VRow>
        </VSection>

        {/* Marges */}
        <VSection label="Marges">
          <VRow>
            <NumInput label="Links" value={format.MarginLeft_mm} step={0.5} min={0} onChange={handleMarginLChange} wide />
            <LinkBtn linked={marginLinkedH} onToggle={handleMarginLinkHToggle}
              title={marginLinkedH ? 'Links↔Rechts gelinkt' : 'Los'} />
            <NumInput label="Rechts" value={format.MarginRight_mm} step={0.5} min={0} onChange={handleMarginRChange} wide />
          </VRow>
          <VRow>
            <NumInput label="Boven" value={format.MarginTop_mm} step={0.5} min={0} onChange={handleMarginTChange} wide />
            <LinkBtn linked={marginLinkedV} onToggle={handleMarginLinkVToggle}
              title={marginLinkedV ? 'Boven↔Onder gelinkt' : 'Los'} />
            <NumInput label="Onder" value={format.MarginBottom_mm} step={0.5} min={0} onChange={handleMarginBChange} wide />
          </VRow>
        </VSection>

        {/* Header */}
        <VSection label="Header">
          <SelectInput label="Type" value={format.HeaderType || 'NONE'} options={HEADER_OPTIONS}
            onChange={v => set('HeaderType', v)} wide />
          {hasHeader && (
            <VRow>
              <NumInput label="Hoogte" value={format.HeaderHeight_mm} step={1} onChange={v => set('HeaderHeight_mm', v)} wide />
              <NumInput label="Marge" value={format.HeaderMargin_mm} step={0.5} onChange={v => set('HeaderMargin_mm', v)} wide />
            </VRow>
          )}
        </VSection>

        {/* Divider */}
        <VSection label="Divider">
          <SelectInput label="Type" value={format.DefaultBarType || 'NONE'} options={BAR_TYPE_OPTIONS}
            onChange={v => set('DefaultBarType', v)} wide />
          {hasBar && (
            <>
              <VRow>
                <SelectInput label="Positie" value={barPos.type} options={BAR_POS_OPTIONS}
                  onChange={setBarPosType} wide />
                {barPos.type === 'AFTER_ROW' && (
                  <IntInput label="Na rij" value={barPos.row} min={1} max={format.Rows - 1}
                    onChange={setBarPosRow} wide />
                )}
              </VRow>
              <VRow>
                <NumInput label="Hoogte" value={format.DefaultBarHeight_mm} step={1} onChange={v => set('DefaultBarHeight_mm', v)} wide />
                <NumInput label="Gap ↑" value={format.DefaultBarGapTop_mm} step={0.5} onChange={v => set('DefaultBarGapTop_mm', v)} wide />
                <NumInput label="Gap ↓" value={format.DefaultBarGapBottom_mm} step={0.5} onChange={v => set('DefaultBarGapBottom_mm', v)} wide />
              </VRow>
            </>
          )}
        </VSection>

        {/* Stijl */}
        <VSection label="Stijl">
          <BgColorInput format={format} set={set} onChange={onChange} backgroundPresets={backgroundPresets} />
          <SelectInput label="Leeg slot" value={format.PlaceEmpty || 'blank'} options={PLACE_EMPTY_OPTIONS}
            onChange={v => set('PlaceEmpty', v)} wide />
        </VSection>

      </div>
    )
  }

  // ─── Horizontal layout (original) ────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 overflow-x-auto flex-shrink-0">
      <div className="flex items-end gap-3 min-w-max">

        <Group label="Grid">
          {cellPresets && cellPresets.length > 0 && (
            <label className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">Preset</span>
              <select
                value={findMatchingPreset()}
                onChange={e => applyPreset(e.target.value)}
                className="text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 max-w-[120px]"
              >
                <option value="">— Aangepast —</option>
                {cellPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}
          <IntInput label="Kolommen" value={format.Cols} min={1} onChange={handleColsChange} />
          <IntInput label="Rijen" value={format.Rows} min={1} onChange={handleRowsChange} />
        </Group>

        <Sep />

        <Group label="Cel">
          <NumInput label="Breedte" value={format.CellW_mm} step={0.1} onChange={handleCellWChange} />
          <NumInput label="Hoogte" value={cellH} unit="mm" readOnly />
        </Group>

        <Sep />

        <Group label="Gutter">
          <NumInput label="Horiz" value={format.GutterX_mm} step={0.5} onChange={handleGutterXChange} />
          <LinkBtn linked={gutterLinked} onToggle={handleGutterLinkToggle}
            title={gutterLinked ? 'Horiz en Vert zijn gelinkt' : 'Horiz en Vert zijn los'} />
          <NumInput label="Vert" value={format.GutterY_mm} step={0.5} onChange={handleGutterYChange} />
        </Group>

        <Sep />

        <Group label="Marges">
          <NumInput label="Links" value={format.MarginLeft_mm} step={0.5} min={0} onChange={handleMarginLChange} />
          <LinkBtn linked={marginLinkedH} onToggle={handleMarginLinkHToggle}
            title={marginLinkedH ? 'Links en Rechts gelinkt' : 'Links en Rechts los'} />
          <NumInput label="Rechts" value={format.MarginRight_mm} step={0.5} min={0} onChange={handleMarginRChange} />
          <Sep />
          <NumInput label="Boven" value={format.MarginTop_mm} step={0.5} min={0} onChange={handleMarginTChange} />
          <LinkBtn linked={marginLinkedV} onToggle={handleMarginLinkVToggle}
            title={marginLinkedV ? 'Boven en Onder gelinkt' : 'Boven en Onder los'} />
          <NumInput label="Onder" value={format.MarginBottom_mm} step={0.5} min={0} onChange={handleMarginBChange} />
        </Group>

        <Sep />

        <Group label="Header">
          <SelectInput label="Type" value={format.HeaderType || 'NONE'} options={HEADER_OPTIONS}
            onChange={v => set('HeaderType', v)} />
          {hasHeader && <>
            <NumInput label="Hoogte" value={format.HeaderHeight_mm} step={1} onChange={v => set('HeaderHeight_mm', v)} />
            <NumInput label="Marge" value={format.HeaderMargin_mm} step={0.5} onChange={v => set('HeaderMargin_mm', v)} />
          </>}
        </Group>

        <Sep />

        <Group label="Divider">
          <SelectInput label="Type" value={format.DefaultBarType || 'NONE'} options={BAR_TYPE_OPTIONS}
            onChange={v => set('DefaultBarType', v)} />
          {hasBar && <>
            <SelectInput label="Positie" value={barPos.type} options={BAR_POS_OPTIONS}
              onChange={setBarPosType} />
            {barPos.type === 'AFTER_ROW' && (
              <IntInput label="Na rij" value={barPos.row} min={1} max={format.Rows - 1}
                onChange={setBarPosRow} />
            )}
            <NumInput label="Hoogte" value={format.DefaultBarHeight_mm} step={1} onChange={v => set('DefaultBarHeight_mm', v)} />
            <NumInput label="Gap ↑" value={format.DefaultBarGapTop_mm} step={0.5} onChange={v => set('DefaultBarGapTop_mm', v)} />
            <NumInput label="Gap ↓" value={format.DefaultBarGapBottom_mm} step={0.5} onChange={v => set('DefaultBarGapBottom_mm', v)} />
          </>}
        </Group>

        <Sep />

        <Group label="Stijl">
          <BgColorInput format={format} set={set} onChange={onChange} backgroundPresets={backgroundPresets} />
          <SelectInput label="Leeg slot" value={format.PlaceEmpty || 'blank'} options={PLACE_EMPTY_OPTIONS}
            onChange={v => set('PlaceEmpty', v)} />
        </Group>

      </div>
    </div>
  )
}
