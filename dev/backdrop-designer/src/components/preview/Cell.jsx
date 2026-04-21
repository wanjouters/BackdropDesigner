import { useState } from 'react'
import { logoUrl } from '../../utils/logoUrl'

export default function Cell({ x, y, width, height, value, index, isSelected, canvasBg, onSelect, onDropSponsor, customLogos }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [imgError, setImgError] = useState(false)

  const isBlank = !value || value === 'BLANK'
  const customSrc = customLogos && customLogos[value]
  // Leid filename af van partner-naam (spaties → underscores) — zelfde patroon als alle logos
  const localSrc = customSrc || (!isBlank ? logoUrl(value.replace(/ /g, '_')) : null)

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
      onClick={e => { if (e.altKey) return; onSelect(index, e.shiftKey) }}
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
