import { useRef, useEffect, useState, useCallback } from 'react'

import { parseBarPosition } from '../utils/barPosition'
import Cell from './preview/Cell'
import PersonSilhouette from './preview/PersonSilhouette'
import ChairSilhouette from './preview/ChairSilhouette'
import {
  ZOOM_STEPS,
  RULER_SIZE,
  getTickSpacing,
  PERSON_H_MM,
  PERSON_W_MM,
  CHAIR_H_MM,
  CHAIR_W_MM,
} from './preview/constants'

export default function PreviewCanvas({ format, slots, selectedSlots, onSelectSlot, onSweepSlot, onClearSelection, onDropSponsor, customLogos, showRuler, activeOverlay, onOverlayChange }) {
  const containerRef = useRef(null)
  const [baseScale, setBaseScale] = useState(0) // 0 = not yet measured by ResizeObserver
  const [zoomLevel, setZoomLevel] = useState(1)
  const [rulerScroll, setRulerScroll] = useState({ left: 0, top: 0 })
  const [personX_mm, setPersonX_mm] = useState(0)
  const [chairX_mm, setChairX_mm] = useState(0)
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false)
  const overlayDragRef = useRef({ startMouseX: 0, startX: 0, target: null })

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
    const sl = Math.max(0, ((CanvasWidth_mm || 0) * s + 800 - el.clientWidth) / 2)
    const st = Math.max(0, ((CanvasHeight_mm || 0) * s + 800 - el.clientHeight) / 2)
    el.scrollLeft = sl
    el.scrollTop  = st
    setRulerScroll({ left: sl, top: st })
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
      const sl = Math.max(0, (innerW - el.clientWidth) / 2)
      const st = Math.max(0, (innerH - el.clientHeight) / 2)
      el.scrollLeft = sl
      el.scrollTop  = st
      setRulerScroll({ left: sl, top: st })
    }, 0)
  }

  // Reset overlay positions to canvas center on format change
  useEffect(() => {
    const cx = (CanvasWidth_mm || 0)
    setPersonX_mm((cx - PERSON_W_MM) / 2)
    setChairX_mm((cx - CHAIR_W_MM) / 2)
  }, [Code])

  // Overlay drag (horizontal only, no modifier needed)
  useEffect(() => {
    if (!isDraggingOverlay) return
    const s = baseScale * zoomLevel
    function onMove(e) {
      const dx = e.clientX - overlayDragRef.current.startMouseX
      const newX = overlayDragRef.current.startX + dx / s
      if (overlayDragRef.current.target === 'person') setPersonX_mm(newX)
      else setChairX_mm(newX)
    }
    function onUp() { setIsDraggingOverlay(false) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDraggingOverlay, baseScale, zoomLevel])

  function handleOverlayMouseDown(target, currentX) {
    return function(e) {
      e.stopPropagation()
      e.preventDefault()
      overlayDragRef.current = { startMouseX: e.clientX, startX: currentX, target }
      setIsDraggingOverlay(true)
    }
  }

  // Pan (drag-to-scroll) — only active while Cmd (Mac) / Ctrl (Win) is held
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [panModifier, setPanModifier] = useState(false)

  // Sweep-selectie — Option/Alt ingedrukt houden en slepen
  const isSweepingRef = useRef(false)
  const lastSweepIndexRef = useRef(-1)
  const hadSweepRef = useRef(false)     // voorkomt dat click-na-sweep de selectie wist
  const [altModifier, setAltModifier] = useState(false)

  // Ref naar altijd-actuele waarden voor gebruik in stabiele event handlers
  const sweepStateRef = useRef({ scale: 0, cellPositions: [], CellW_mm: 0, cellH: 0 })
  const onSweepSlotRef = useRef(onSweepSlot)
  useEffect(() => { onSweepSlotRef.current = onSweepSlot }, [onSweepSlot])

  useEffect(() => {
    function onKey(e) {
      setPanModifier(e.metaKey || e.ctrlKey)
      setAltModifier(e.altKey)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [])

  // Helper: welke cel zit onder de muis? Retourneert het cell-object of null.
  // Inset van 8px (omgezet naar mm) zodat de cursor duidelijk BINNEN de cel
  // moet zijn — voorkomt hoek-clipping bij diagonaal slepen.
  function hitTestCell(e) {
    const el = containerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const { scale: s, cellPositions: cp, CellW_mm: cw, cellH: ch } = sweepStateRef.current
    if (!s) return null
    const mmX = ((e.clientX - rect.left) + el.scrollLeft - 400) / s
    const mmY = ((e.clientY - rect.top)  + el.scrollTop  - 400) / s
    const inset = 8 / s   // 8px inset in mm-eenheden (schaalonafhankelijk)
    return cp.find(({ x, y }) =>
      mmX >= x + inset && mmX < x + cw - inset &&
      mmY >= y + inset && mmY < y + ch - inset
    ) ?? null
  }

  const handleMouseDown = useCallback(e => {
    if (e.button !== 0) return

    // Option/Alt → sweep-selectie
    if (e.altKey) {
      e.preventDefault()
      isSweepingRef.current = true
      hadSweepRef.current = true
      lastSweepIndexRef.current = -1
      const cell = hitTestCell(e)
      if (cell) {
        lastSweepIndexRef.current = cell.index
        onSweepSlotRef.current(cell.index)
      }
      return
    }

    // Cmd/Ctrl → pan (bestaand gedrag)
    if (!e.metaKey && !e.ctrlKey) return
    const el = containerRef.current
    if (!el) return
    isPanning.current = true
    panStart.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
    setIsDragging(true)
    e.preventDefault()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseMove = useCallback(e => {
    // Sweep
    if (isSweepingRef.current) {
      const cell = hitTestCell(e)
      if (cell && cell.index !== lastSweepIndexRef.current) {
        lastSweepIndexRef.current = cell.index
        onSweepSlotRef.current(cell.index)
      }
      return
    }
    // Pan
    if (!isPanning.current) return
    const el = containerRef.current
    if (!el) return
    el.scrollLeft = panStart.current.scrollLeft - (e.clientX - panStart.current.x)
    el.scrollTop = panStart.current.scrollTop - (e.clientY - panStart.current.y)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
    isSweepingRef.current = false
    lastSweepIndexRef.current = -1
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

  // Sweep state ref bijwerken — event handlers hebben altijd actuele waarden
  sweepStateRef.current = { scale, cellPositions, CellW_mm, cellH }

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

  // Klik buiten alle cellen → selectie wissen
  function handleContainerClick(e) {
    if (e.altKey || e.metaKey || e.ctrlKey) return
    // Negeer de click die volgt op een sweep (mouseup → click)
    if (hadSweepRef.current) { hadSweepRef.current = false; return }
    const cell = hitTestCell(e)
    if (!cell) onClearSelection?.()
  }

  return (
    <div className="flex-1 rounded-xl bg-gray-400 relative" style={{ minHeight: 0 }}>
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, overflow: 'auto', cursor: isDragging ? 'grabbing' : altModifier ? 'crosshair' : panModifier ? 'grab' : 'default' }}
      onScroll={e => setRulerScroll({ left: e.target.scrollLeft, top: e.target.scrollTop })}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleContainerClick}
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

      {/* Overlays — person or chair, floor-aligned, horizontally draggable */}
      {activeOverlay === 'person' && scale > 0 && (
        <div
          onMouseDown={handleOverlayMouseDown('person', personX_mm)}
          style={{
            position: 'absolute',
            left: 400 + personX_mm * scale,
            top: 400 + scaledH - PERSON_H_MM * scale,
            pointerEvents: 'auto',
            userSelect: 'none',
            cursor: isDraggingOverlay ? 'ew-resize' : 'grab',
            zIndex: 5,
          }}
        >
          <PersonSilhouette scale={scale} />
        </div>
      )}
      {activeOverlay === 'chair' && scale > 0 && (
        <div
          onMouseDown={handleOverlayMouseDown('chair', chairX_mm)}
          style={{
            position: 'absolute',
            left: 400 + chairX_mm * scale,
            top: 400 + scaledH - CHAIR_H_MM * scale,
            pointerEvents: 'auto',
            userSelect: 'none',
            cursor: isDraggingOverlay ? 'ew-resize' : 'grab',
            zIndex: 5,
          }}
        >
          <ChairSilhouette scale={scale} />
        </div>
      )}

      </div>
    </div>

      {/* Rulers — overlaid on the scroll area, zero = canvas top-left */}
      {showRuler && scale > 0 && (() => {
        const sl = rulerScroll.left
        const st = rulerScroll.top
        const majorMM = getTickSpacing(scale)
        const minorMM = majorMM / 5
        const canvasOff = 400  // inner-div offset where canvas starts

        // Range with generous padding so ticks render past both edges
        const hMinMM = Math.floor((sl - canvasOff) / scale / minorMM) * minorMM - minorMM
        const hMaxMM = hMinMM + 4000 / scale + minorMM * 2
        const vMinMM = Math.floor((st - canvasOff) / scale / minorMM) * minorMM - minorMM
        const vMaxMM = vMinMM + 3000 / scale + minorMM * 2

        const rulerBg = 'rgba(28,28,28,0.92)'
        const rulerBorder = 'rgba(255,255,255,0.08)'
        const tickColor = 'rgba(255,255,255,0.35)'
        const labelColor = 'rgba(255,255,255,0.5)'
        const originLine = 'rgba(255,200,80,0.5)'
        const fontSize = 9

        // Build H ticks
        const hTicks = []
        for (let mm = hMinMM; mm <= hMaxMM; mm = Math.round((mm + minorMM) * 1e6) / 1e6) {
          const x = mm * scale + canvasOff - sl
          const major = Math.abs(mm % majorMM) < 0.001
          hTicks.push({ x, mm, major })
        }
        // Build V ticks
        const vTicks = []
        for (let mm = vMinMM; mm <= vMaxMM; mm = Math.round((mm + minorMM) * 1e6) / 1e6) {
          const y = mm * scale + canvasOff - st
          const major = Math.abs(mm % majorMM) < 0.001
          vTicks.push({ y, mm, major })
        }

        return (
          <>
            {/* Horizontal ruler */}
            <div style={{
              position: 'absolute', top: 0, left: RULER_SIZE, right: 0, height: RULER_SIZE,
              background: rulerBg, borderBottom: `1px solid ${rulerBorder}`,
              overflow: 'hidden', zIndex: 8, pointerEvents: 'none',
            }}>
              <svg width="100%" height={RULER_SIZE} style={{ display: 'block', overflow: 'visible' }}>
                {hTicks.map(({ x, mm, major }) => (
                  <g key={mm}>
                    <line x1={x} y1={major ? 0 : RULER_SIZE * 0.55} x2={x} y2={RULER_SIZE}
                      stroke={mm === 0 ? originLine : tickColor}
                      strokeWidth={mm === 0 ? 1.5 : 1} />
                    {major && (
                      <text x={x + 2} y={RULER_SIZE - 3}
                        fontSize={fontSize} fill={mm === 0 ? originLine : labelColor}
                        fontFamily="system-ui" style={{ userSelect: 'none' }}>
                        {mm}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            {/* Vertical ruler */}
            <div style={{
              position: 'absolute', top: RULER_SIZE, left: 0, width: RULER_SIZE, bottom: 0,
              background: rulerBg, borderRight: `1px solid ${rulerBorder}`,
              overflow: 'hidden', zIndex: 8, pointerEvents: 'none',
            }}>
              <svg width={RULER_SIZE} height="100%" style={{ display: 'block', overflow: 'visible' }}>
                {vTicks.map(({ y, mm, major }) => (
                  <g key={mm}>
                    <line x1={major ? 0 : RULER_SIZE * 0.55} y1={y} x2={RULER_SIZE} y2={y}
                      stroke={mm === 0 ? originLine : tickColor}
                      strokeWidth={mm === 0 ? 1.5 : 1} />
                    {major && (
                      <text
                        x={RULER_SIZE / 2} y={y - 2}
                        fontSize={fontSize} fill={mm === 0 ? originLine : labelColor}
                        fontFamily="system-ui" textAnchor="middle"
                        transform={`rotate(-90, ${RULER_SIZE / 2}, ${y - 2})`}
                        style={{ userSelect: 'none' }}>
                        {mm}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            {/* Corner square */}
            <div style={{
              position: 'absolute', top: 0, left: 0, width: RULER_SIZE, height: RULER_SIZE,
              background: rulerBg,
              borderRight: `1px solid ${rulerBorder}`, borderBottom: `1px solid ${rulerBorder}`,
              zIndex: 9, pointerEvents: 'none',
            }} />
          </>
        )
      })()}

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
