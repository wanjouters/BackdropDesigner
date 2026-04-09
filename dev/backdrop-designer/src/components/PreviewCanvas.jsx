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
const RULER_SIZE = 20  // px — thickness of both rulers

function getTickSpacing(scale) {
  const nice = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]
  return nice.find(n => n * scale >= 55) || 5000
}
const PERSON_H_MM = 1800
const PERSON_W_MM = 583
const PERSON_VB_W = 1653.519
const PERSON_VB_H = 5102.362

const CHAIR_H_MM = 1327
const CHAIR_W_MM = 691
const CHAIR_VB_W = 1959.463
const CHAIR_VB_H = 3761.352

function PersonSilhouette({ scale }) {
  const w = PERSON_W_MM * scale
  const h = PERSON_H_MM * scale
  const fill = 'rgba(255,215,100,0.6)'

  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      {/* Professional Illustrator silhouette */}
      <svg
        viewBox={`0 0 ${PERSON_VB_W} ${PERSON_VB_H}`}
        width={w}
        height={h}
        style={{ display: 'block', position: 'absolute', left: 0, top: 0 }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="personGlow" x="-10%" y="-2%" width="120%" height="104%">
            <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="rgba(255,200,80,0.5)" />
          </filter>
        </defs>
        <path
          fill={fill}
          filter="url(#personGlow)"
          d="M1648.621,1821.452c-5.994-15.269-17.731-28.118-21.56-44.068-13.558-56.477-21.613-117.647-36.899-173.681-30.992-113.603-65.419-227.697-99.531-340.402-2.074-6.853-3.925-18.843-5.07-25.911-8.85-54.632-10.958-112.074-36.923-160.949-10.109-19.029-8.88-51.731-18.355-71.083-11.43-23.344-32.676-41.684-57.439-49.581-12.873-4.105-26.54-5.493-39.188-10.247-3.091-1.162-6.124-2.529-8.871-4.364-65.307-43.605-143.462-72.019-212.975-108.547-19.273-10.128-39.111-21.843-58.86-31.008-27.944-12.969-44.945-24.93-67.928-45.445-11.214-10.01-34.54-24.795-38.748-39.226q-5.152-17.671-6.276-50.197c-.545-15.769,4.548-57.103,6.797-72.607,3.266-22.52,5.809-45.022,13.281-66.653,6.242,7.838,15.025,4.625,23.272-1.065,8.248-5.69,13.075-15.021,17.578-23.972,4.154-8.257,8.308-16.513,12.462-24.77,8.806-17.503,10.606-33.334,16.745-51.94,4.45-13.487,8.824-28.617,2.672-41.417-5.399-11.233-19.031-17.816-31.186-15.059-8.28,1.878-15.259,7.438-21.046,13.65,7.213-33.477,8.438-78.758,15.396-112.289,4.516-21.762,7.709-26.308,11.057-49.748,1.541-10.785.552-19.956,3.211-30.521,2.659-10.565,2.675-22.111-1.906-31.995-4.542-9.801-13.334-17.566-15.913-28.056-1.478-6.008-.744-12.319-1.312-18.48-1.589-17.22-15.711-34.374-32.275-39.342-7.014-15.444-19.734-30.033-36.568-32.112-4.074-.503-8.394-.292-12.031-2.194-3.227-1.687-5.419-4.785-7.846-7.499-13.394-14.979-38.676-22.155-56.086-12.122-21.282-9.298-44.532-18.792-67.067-13.175-4.708,1.173-9.3,3-14.139,3.337-11.821.824-22.5-7.244-34.28-8.527-13.307-1.449-25.834,5.822-37.243,12.824-9.123,5.599-14.22,4.916-23.342,10.515-16.924-.655-34.019,4.565-47.691,14.561-11.166,8.165-19.855,19.184-29.662,28.938-10.653,10.595-22.695,19.757-32.93,30.756-10.235,10.999-21.047,23.326-25.25,37.75-10.598,36.37-11.744,75.45-3.296,112.378,4.198,18.348,2.949,35.004,2.371,53.817-.715,23.289-2.732,45.62-1.385,68.881-3.403-9.199-14.051-14.244-23.784-15.459-3.629-.453-7.448-.129-10.687,1.568-4.882,2.558-7.735,7.777-9.738,12.911-6.843,17.546-6.845,37.66-.006,55.208,12.75,32.713,24.713,64.292,50.24,88.397,2.988,2.822,6.207,5.638,10.157,6.771,3.951,1.134,8.825.087,10.929-3.443,2.498,11.492,7.388,24.418,9.886,35.91,5.769,26.536,8.114,53.529,12.24,80.37,2.397,15.596,7.924,26.448,10.128,42.073.816,5.785.74,11.653.661,17.494-.219,16.445-.439,32.891-.659,49.336-46.968,29.82-93.056,65.599-135.871,101.126-67.475,55.99-161.418,95.565-242.744,128.336-18.318,7.381-37.429,14.558-51.541,28.373-14.112,13.815-21.795,36.441-12.3,53.757-7.02,5.313-9.069,16.951-8.962,25.755.338,27.664-9.174,54.376-14.1,81.601-4.739,26.191-5.224,53.146-1.431,79.491,7.724,53.645-1.745,119.841-2.718,174.031-.336,18.718-.687,37.567-4.503,55.896-5.206,25.005-16.672,48.193-25.18,72.275-17.521,49.597-22.382,102.625-27.108,155.013-4.748,52.645-9.345,112.589-17.516,164.813-5.32,34.001-20.894,63.604-30.005,96.791-5.064,18.447-10.149,37.005-11.974,56.046-4.268,44.538,9.436,90.034.375,133.849-13.896,67.193-3.18,134.768,20.509,199.164,8.819,23.974,6.417,51.124,7.674,76.638,1.036,21.039,1.934,38.327,3.616,59.324,2.098,26.184,17.25,52.343,41.739,61.845,23.983,9.305,43.422,38.632,58.51,59.468,14.312,19.764,26.972,38.02,39.187,59.145,16.052,27.759,32.625,56.145,57.366,76.545,6.582,86.945,15.792,179.218,19.17,266.347,1.891,48.779,1.319,82.764,5.939,131.361,7.121,74.892,15.049,149.708,23.782,224.429,11.429,97.785,37.673,184.684,36.945,283.132-.613,82.97-39.144,160.7-53.188,242.474-8.157,47.494-7.978,95.974-7.777,144.163.911,218.203,11.724,430.216-9.266,647.409-2.528,26.157-12.426,50.817-2.958,75.331,4.445,11.508,11.742,21.7,19.712,31.117-30.621,43.893-66.76,84.71-102.575,124.477-7.059,7.837-13.411,18.952-18.528,28.175-13.769,24.82-24.687,51.22-32.469,78.516-4.628,16.233-4.191,39.096,3.805,53.962,6.797,12.636,19.934,20.89,33.702,24.93,13.767,4.04,28.309,4.378,42.654,4.686,12.461.268,24.923.536,37.385.804,46.396.998,84.564-27.477,117.114-60.554,13.496-13.715,17.677-30.006,29.125-45.471,9.185-12.408,15.52-24.413,25.905-35.836,12.101,5.675,21.114,5.622,33.786,1.371,12.672-4.251,24.022-11.626,35.218-18.926,7.855-5.121,15.709-10.242,23.564-15.363,2.466-1.607,5.023-3.309,6.485-5.864,1.894-3.307,1.599-7.388,1.124-11.17-1.483-11.813-4.172-23.474-8.012-34.743-3.408-10.002,3.058-20.963,4.1-31.478,2.103-21.217-.802-47.108-6.5-67.653,13.437-11.01,29.333-21.845,36.538-37.653,2.901-6.365,3.35-13.534,3.754-20.518,2.221-38.342,4.437-76.907.137-115.071-15.242-135.272,22.976-271.854,32.049-407.68,7.289-109.128,18.515-221.417,30.671-330.11,22.925-28.524,40.056-66.902,48.033-102.616,6.305-28.232,7.457-57.325,8.585-86.23,1.688-43.259,3.376-86.518,5.064-129.777,3.055-78.282,16.465-158.828,33.984-235.186,28.028-122.158,48.315-246.091,60.7-370.81,2.926-29.466,8.321-53.389,20.03-80.586.623-1.447,1.298-2.932,2.475-3.979,4.05-3.603,10.418.219,13.676,4.552,6.987,9.294,9.825,20.977,12.323,32.332,6.961,31.642,12.573,63.582,16.818,95.702,17.158,129.855,46.55,255.296,76.346,382.846,9.792,41.915,2.666,65.485,4.886,108.471,2.793,54.077-1.61,108.469,3.899,162.337,2.184,21.35,5.922,42.541,11.176,63.35,22.339,88.478,34.23,180.973,45.008,271.588,9.494,79.818,21.406,153.208,36.799,232.101,5.973,30.612,12.772,59.93,23.079,89.368,4.934,14.092,10.599,28.1,12.557,42.901,4.533,34.27-11.197,92.377-3.815,126.147,18.828,86.13,17.05,173.879,33.227,260.546,1.595,8.543.112,13.28,1.46,21.865.765,4.87,1.534,9.762,3.023,14.462,4.127,13.034,13.485,23.773,18.757,36.386-7.078,21.131-10.651,43.862-6.974,65.842,1.763,10.539,6.31,19.913,6.185,30.598-.063,5.408-.707,10.791-.949,16.194-.246,5.492-.077,11.001.505,16.468,1.947,18.269,27.511,21.857,45.51,25.541,22.662,4.638,45.764,7.126,68.894,7.421,8.977.115,14.997,3.946,22.749,8.474,25.849,15.096,48.808,37.875,70.169,58.846,31.047,30.48,72.204,47.836,115.139,54.87,14.35,2.351,28.901,3.207,43.43,3.793,23.845.963,48.782.984,70.145-9.653,10.694-5.325,17.403-11.667,24.475-21.295,5.525-7.521,3.64-18.568,1.697-27.696-5.131-24.1-13.844-49.222-29.553-68.206-15.708-18.984-35.542-34.192-56.483-47.178-39.732-24.639-76.536-51.476-109.829-84.298-18.961-18.693-33.006-36.56-51.085-56.106,6.588,2.558,11.767,1.219,18.448-1.083,2.279-.785,4.546-1.909,6.024-3.814,2.228-2.87,2.213-6.833,2.059-10.463-.713-16.774-2.25-33.513-4.602-50.136-5.172-36.545-7.176-73.264-8.469-110.15-.918-26.196-3.742-52.324-8.442-78.111-16.132-88.513-4.371-206.983-6.013-296.938-1.959-107.382,7.975-230.931-14.726-335.904-6.419-29.684-16.951-58.614-19.652-88.864-8.97-100.476-22.982-194.996-13.837-295.456,5.485-60.251,25.65-133.526,37.912-192.77,11.605-56.071,13.886-113.045,21.781-169.574,8.493-60.81,26.101-120.588,25.014-182.465-.949-54.019-16.107-107.562-11.766-161.415,2.033-25.219,15.553-48.56,25.731-71.723,8.763-19.942,22.438-29.952,30.014-50.375,3.249-8.759,5.836-17.818,10.219-26.068,4.966-9.348,12.087-17.365,19.508-24.914,11.803-12.006,24.551-23.083,38.087-33.096,14.587-10.79,14.984-25.524,27.382-38.77,15.339,4.394,24.129,4.741,39.85,2.014,5.207-.903,10.767-2.461,13.954-6.676,3.622-4.789,3.064-11.41,2.599-17.396-4.843-62.401,18.875-123.079,42.168-181.172,29.609-73.845,42.449-161.257,46.548-240.711,3.313-64.231,14.457-129.491,16.625-193.77.552-16.374,13.468-29.281,16.671-45.349s3.236-33.153-2.75-48.404ZM335.792,1871.704c-9.621,62.706-23.955,124.226-27.111,187.587-3.324,66.743-19.519,136.088-19.537,202.913-.005,19.811.609,39.628-.033,59.429-1.241,38.276-.972,69.104-2.293,107.377-.577,16.733.383,36.246.383,52.989-16.936-16.832-38.58-28.876-61.811-34.396-1.894-44.935,1.128-95.625,2.843-140.568,1.375-36.039,16.065-62.435,13.826-98.431-.993-15.96-5.652-31.597-5.719-47.588-.037-8.999,1.384-17.934,2.802-26.82,2.255-14.138,4.51-28.277,6.765-42.415,7.575-47.492,29.368-92.324,33.854-140.207,2.68-28.602-.561-57.457,1.077-86.138,1.608-28.162,7.896-55.821,14.161-83.324,13.332-58.527,25.335-112.773,40.88-170.751,5.698,84.81,12.805,176.327-.086,260.344ZM1394.287,2116.066c1.521,21.871-9.061,37.898-13.816,59.301-3.699,16.65-8.143,33.274-8.896,50.313-.655,14.818,1.423,30.203-3.771,44.096-8.657,23.158-6.211,49.017-8.922,73.59-4.169,37.79-12.546,75.286-18.149,112.89-1.382,9.278-5.483,14.751-3.615,23.944-15.254,13.423-25.959,28.896-35.07,47.057,1.001-41.131,2.049-80.536,3.05-121.667,2.238-91.981-13.921-187.465-32.26-277.628-17.416-85.626-25.676-171.299-17.039-258.25,7.295-73.442,13.309-147.594,13.947-221.395.247-28.575,2.836-58.358,2.629-86.933-.119-16.497-2.193-32.91-4.263-49.277-1.595-12.612.263-16.872,7.482-27.335,7.051,36.964,16.768,73.42,29.051,108.99,12.942,37.479,40.435,75.331,45.009,114.716,1.931,16.629-.573,33.523,1.206,50.169,3.953,36.984,28.365,68.732,36.587,105.007,6.791,29.963,7.28,61.057,7.732,91.777.119,8.055-.197,7.241-.769,15.276-3.446,48.37-3.487,96.983-.121,145.359Z"
        />
      </svg>
    </div>
  )
}

function ChairSilhouette({ scale }) {
  const w = CHAIR_W_MM * scale
  const h = CHAIR_H_MM * scale
  const fill = 'rgba(255,215,100,0.6)'
  return (
    <svg
      viewBox={`0 0 ${CHAIR_VB_W} ${CHAIR_VB_H}`}
      width={w}
      height={h}
      style={{ display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="chairGlow" x="-10%" y="-2%" width="120%" height="104%">
          <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="rgba(255,200,80,0.5)" />
        </filter>
      </defs>
      <path
        fill={fill}
        filter="url(#chairGlow)"
        d="M1770.364,3262.457c9.209-17.877,19.115-41.398,29.422-72.319,48.316-144.948,122.986-320.642,105.417-439.235-17.569-118.594-65.885-298.68-114.201-303.073l-48.316-4.392s-4.877-44.732-24.279-44.732-46.564-1.293-46.564-1.293l-2.587-103.476s-5.174-33.63-24.575-42.684c0,0,151.334-243.168,85.368-497.332-65.966-254.163-122.231-411.317-128.052-459.822-5.821-48.505-29.103-141.633,23.282-170.736,52.385-29.103,124.171-54.325,124.171-54.325,0,0,38.803-17.462,32.983-118.351-5.821-100.889-13.581-201.778-64.026-242.522s-254.163-155.214-283.266-192.078c-29.103-36.863-73.727-122.231-102.829-316.249C1303.209,5.821,1186.798,9.701,1186.798,9.701L1010.242,0h-105.488l-176.556,9.701s-116.411-3.88-145.513,190.137c-29.103,194.018-73.727,279.385-102.829,316.249s-232.821,151.334-283.266,192.078c-50.445,40.744-58.205,141.633-64.026,242.522-5.821,100.889,32.983,118.351,32.983,118.351,0,0,71.787,25.222,124.171,54.325,52.385,29.103,29.103,122.231,23.282,170.736-5.82,48.504-62.086,205.659-128.052,459.822-65.966,254.164,85.368,497.332,85.368,497.332-19.402,9.054-24.576,42.684-24.576,42.684l-2.587,103.476s-27.162,1.293-46.564,1.293-24.279,44.732-24.279,44.732l-48.316,4.392c-48.316,4.393-96.632,184.479-114.201,303.073-17.569,118.593,57.101,294.288,105.417,439.235,10.307,30.921,20.214,54.441,29.422,72.319H0v498.896h1959.463v-498.896h-189.099ZM1464.855,816.815l7.761,62.086s-157.801,31.043-212.126,18.108c-54.325-12.934-116.411-36.217-116.411-36.217l-5.174-116.411,325.95,72.433ZM450.142,827.162l325.95-72.433-5.174,116.411s-62.086,23.282-116.411,36.217-212.126-18.108-212.126-18.108l7.761-62.085Z"
      />
    </svg>
  )
}

export default function PreviewCanvas({ format, slots, selectedSlots, onSelectSlot, onDropSponsor, customLogos, showRuler, activeOverlay, onOverlayChange }) {
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
      onScroll={e => setRulerScroll({ left: e.target.scrollLeft, top: e.target.scrollTop })}
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
          onMouseLeave={e => e.currentTarget.style.background = showPerson ? 'rgba(255,180,0,0.18)' : 'none'}
        >Fit</button>

      </div>
    </div>
  )
}

