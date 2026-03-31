import { useRef, useEffect, useState, useCallback } from 'react'
import sponsors from '../data/sponsors.json'

import { parseBarPosition } from '../utils/barPosition'

const sponsorMap = Object.fromEntries(sponsors.map(s => [s.partner, s]))

function Cell({ x, y, width, height, value, index, isSelected, canvasBg, onSelect, onDropSponsor, customLogos }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [imgError, setImgError] = useState(false)

  const sponsor = sponsorMap[value]
  const isBlank = !value || value === 'BLANK'
  const customSrc = customLogos && customLogos[value]
  const localSrc = customSrc || (sponsor ? `/logos/${sponsor.filename}.png` : null)

  function handleDragOver(e) {
    if (!e.dataTransfer.types.includes('sponsor')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const name = e.dataTransfer.getData('sponsor')
    if (name) onDropSponsor(index, name)
  }

  return (
    <div
      onClick={e => onSelect(index, e.shiftKey)}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: isBlank
          ? 'rgba(255,255,255,0.06)'
          : 'transparent',
        border: isDragOver
          ? '2px solid #60a5fa'
          : isSelected
            ? '2px solid #3b82f6'
            : isBlank
              ? '1px dashed rgba(255,255,255,0.18)'
              : 'none',
        outline: isSelected ? '2px solid rgba(59,130,246,0.4)' : 'none',
        outlineOffset: 1,
        transition: 'border-color 0.1s',
      }}
    >
      {!isBlank && localSrc && !imgError ? (
        <img
          src={localSrc}
          alt={value}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          onError={() => setImgError(true)}
        />
      ) : !isBlank ? (
        <span style={{
          fontSize: Math.max(8, Math.min(width * 0.12, 14)),
          fontWeight: 700,
          color: '#333',
          textAlign: 'center',
          padding: '4px',
          lineHeight: 1.2,
          wordBreak: 'break-word',
        }}>
          {value}
        </span>
      ) : null}
    </div>
  )
}

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4]

export default function PreviewCanvas({ format, slots, selectedSlots, onSelectSlot, onDropSponsor, customLogos }) {
  const containerRef = useRef(null)
  const [baseScale, setBaseScale] = useState(0) // 0 = not yet measured by ResizeObserver
  const [zoomLevel, setZoomLevel] = useState(1)

  const {
    Cols, Rows,
    CellW_mm, CellAspect, CellH_mm,
    GutterX_mm, GutterY_mm,
    MarginLeft_mm, MarginTop_mm, MarginRight_mm, MarginBottom_mm,
    CanvasWidth_mm, CanvasHeight_mm,
    BackgroundColor_Hex,
    HeaderType, HeaderHeight_mm, HeaderMargin_mm,
    DefaultBarType, DefaultBarPosition,
    DefaultBarHeight_mm, DefaultBarGapTop_mm, DefaultBarGapBottom_mm,
    Code,
  } = format

  const cellH = CellH_mm || (CellW_mm && CellAspect ? CellW_mm / CellAspect : 100)
  const hasHeader = HeaderType && HeaderType !== 'NONE'
  const hasBar = DefaultBarType && DefaultBarType !== 'NONE'
  const barPos = parseBarPosition(DefaultBarPosition)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const sx = (width - 48) / (CanvasWidth_mm || 1)
        const sy = (height - 48) / (CanvasHeight_mm || 1)
        setBaseScale(Math.min(sx, sy))
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [CanvasWidth_mm, CanvasHeight_mm])

  const scale = baseScale * zoomLevel
  const pct = Math.round(zoomLevel * 100)

  function zoomIn() {
    setZoomLevel(prev => {
      const next = ZOOM_STEPS.find(s => s > prev)
      return next ?? prev
    })
  }

  function zoomOut() {
    setZoomLevel(prev => {
      const next = [...ZOOM_STEPS].reverse().find(s => s < prev)
      return next ?? prev
    })
  }

  const needsCenter = useRef(false)

  // Mark for re-centering on mount and whenever format or canvas size changes
  useEffect(() => {
    needsCenter.current = true
  }, [Code, CanvasWidth_mm, CanvasHeight_mm])

  // Center once baseScale is current (ResizeObserver has caught up with new dimensions)
  // Using baseScale here guarantees the inner div is already sized correctly
  useEffect(() => {
    if (!needsCenter.current || baseScale <= 0) return
    needsCenter.current = false
    const el = containerRef.current
    if (!el) return
    const s = baseScale * zoomLevel
    el.scrollLeft = Math.max(0, ((CanvasWidth_mm || 0) * s + 800 - el.clientWidth) / 2)
    el.scrollTop  = Math.max(0, ((CanvasHeight_mm || 0) * s + 800 - el.clientHeight) / 2)
  }, [baseScale])

  function fitScreen() {
    setZoomLevel(1)
    // Re-centre scroll on fit — use computed values, not DOM scrollWidth
    const el = containerRef.current
    if (!el) return
    setTimeout(() => {
      const s = baseScale * 1  // zoomLevel will be 1 after setZoomLevel
      const sW = (CanvasWidth_mm || 0) * s
      const sH = (CanvasHeight_mm || 0) * s
      const innerW = sW + 800
      const innerH = sH + 800
      el.scrollLeft = Math.max(0, (innerW - el.clientWidth) / 2)
      el.scrollTop  = Math.max(0, (innerH - el.clientHeight) / 2)
    }, 0)
  }

  // Pan (drag-to-scroll) — only active while Cmd (Mac) / Ctrl (Win) is held
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [panModifier, setPanModifier] = useState(false)

  useEffect(() => {
    function onKey(e) { setPanModifier(e.metaKey || e.ctrlKey) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [])

  const handleMouseDown = useCallback(e => {
    if (e.button !== 0) return
    if (!e.metaKey && !e.ctrlKey) return   // require Cmd (Mac) or Ctrl (Win/Linux)
    const el = containerRef.current
    if (!el) return
    isPanning.current = true
    panStart.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
    setIsDragging(true)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback(e => {
    if (!isPanning.current) return
    const el = containerRef.current
    if (!el) return
    el.scrollLeft = panStart.current.scrollLeft - (e.clientX - panStart.current.x)
    el.scrollTop = panStart.current.scrollTop - (e.clientY - panStart.current.y)
  }, [])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
    setIsDragging(false)
  }, [])

  // Build cell positions — grid is centered within the margin-bounded area
  const headerOffset = hasHeader ? (HeaderHeight_mm || 0) + (HeaderMargin_mm || 0) : 0

  const ml = MarginLeft_mm || 0
  const mr = MarginRight_mm || 0
  const mt = MarginTop_mm  || 0
  const mb = MarginBottom_mm || 0
  const gx = GutterX_mm || 0
  const gy = GutterY_mm || 0

  const totalGridW = Cols * CellW_mm + (Cols - 1) * gx
  const totalGridH = Rows * cellH   + (Rows - 1) * gy
  const availW = (CanvasWidth_mm  || 0) - ml - mr
  const availH = (CanvasHeight_mm || 0) - mt - mb - headerOffset
  const gridLeft = ml + Math.max(0, (availW - totalGridW) / 2)
  const gridTop  = mt + headerOffset + Math.max(0, (availH - totalGridH) / 2)

  const cellPositions = slots.map((value, i) => {
    const col = i % Cols
    const row = Math.floor(i / Cols)

    const x = gridLeft + col * (CellW_mm + gx)
    let y = gridTop + row * (cellH + gy)

    if (hasBar && barPos.type === 'AFTER_ROW' && row >= barPos.row) {
      y += (DefaultBarGapTop_mm || 0) + (DefaultBarHeight_mm || 0) + (DefaultBarGapBottom_mm || 0)
    }

    return { x, y, value, index: i }
  })

  // Bar position
  let barY = null
  if (hasBar) {
    if (barPos.type === 'TOP') {
      barY = gridTop
    } else if (barPos.type === 'BOTTOM') {
      barY = (CanvasHeight_mm || 0) - mb - (DefaultBarHeight_mm || 0)
    } else if (barPos.type === 'AFTER_ROW') {
      barY = gridTop
        + barPos.row * (cellH + gy)
        + (DefaultBarGapTop_mm || 0)
    }
  }

  const scaledW = (CanvasWidth_mm || 0) * scale
  const scaledH = (CanvasHeight_mm || 0) * scale

  return (
    <div className="flex-1 rounded-xl bg-gray-400 relative" style={{ minHeight: 0 }}>
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, overflow: 'auto', cursor: isDragging ? 'grabbing' : panModifier ? 'grab' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Scrollable inner area — explicit size gives reliable scroll range in all directions */}
      <div style={{
        width: scaledW + 800,
        height: scaledH + 800,
        position: 'relative',
        flexShrink: 0,
      }}>
      {/* Outer clipping wrapper — exact scaled pixel size, offset 400px from inner edge */}
      <div style={{ position: 'absolute', left: 400, top: 400, width: scaledW, height: scaledH, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.35)' }}>
        {/* Canvas scaled to natural mm units */}
        <div style={{
          width: CanvasWidth_mm,
          height: CanvasHeight_mm,
          background: BackgroundColor_Hex || '#111',
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}>
          {/* Header band */}
          {hasHeader && (
            <div style={{
              position: 'absolute',
              left: MarginLeft_mm,
              top: MarginTop_mm,
              width: CanvasWidth_mm - MarginLeft_mm - MarginRight_mm,
              height: HeaderHeight_mm || 0,
              background: 'rgba(255,255,255,0.08)',
              border: '1px dashed rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'system-ui', letterSpacing: 2 }}>
                {HeaderType}
              </span>
            </div>
          )}

          {/* Divider/bar band */}
          {hasBar && barY !== null && (
            <div style={{
              position: 'absolute',
              left: MarginLeft_mm,
              top: barY,
              width: CanvasWidth_mm - MarginLeft_mm - MarginRight_mm,
              height: DefaultBarHeight_mm || 0,
              background: 'rgba(255,255,255,0.1)',
              border: '1px dashed rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'system-ui', letterSpacing: 2 }}>
                {DefaultBarType} BAR
              </span>
            </div>
          )}

          {/* Cells */}
          {cellPositions.map(({ x, y, value, index }) => (
            <Cell
              key={index}
              x={x}
              y={y}
              width={CellW_mm}
              height={cellH}
              value={value}
              index={index}
              isSelected={selectedSlots.has(index)}
              canvasBg={BackgroundColor_Hex}
              onSelect={onSelectSlot}
              onDropSponsor={onDropSponsor}
              customLogos={customLogos}
            />
          ))}
        </div>
      </div>
      </div>
    </div>

      {/* Floating zoom controls */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: 'rgba(30,30,30,0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: 10,
        padding: '5px 8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        userSelect: 'none',
        zIndex: 10,
      }}>
        <button
          onClick={zoomOut}
          title="Uitzoomen"
          style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ccc', fontSize: 18, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >−</button>

        <span style={{
          minWidth: 44, textAlign: 'center',
          fontSize: 12, fontWeight: 600, color: '#e5e5e5',
          fontFamily: 'system-ui', tabularNums: true,
        }}>{pct}%</span>

        <button
          onClick={zoomIn}
          title="Inzoomen"
          style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ccc', fontSize: 18, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >+</button>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />

        <button
          onClick={fitScreen}
          title="Schermvullend"
          style={{
            height: 26, padding: '0 8px', borderRadius: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ccc', fontSize: 11, fontWeight: 600, fontFamily: 'system-ui',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >Fit</button>
      </div>
    </div>
  )
}

