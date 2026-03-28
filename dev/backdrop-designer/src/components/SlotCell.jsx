import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SponsorPicker from './SponsorPicker'

export default function SlotCell({ id, index, value, onAssign, onDropSponsor, colLabel, rowLabel, isSelected, onSelect }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isBlank = !value || value === 'BLANK'

  function handleClick(e) {
    if (e.target.closest('[data-drag-handle]')) return
    onSelect(index, e.shiftKey)
  }

  function handleDoubleClick(e) {
    if (e.target.closest('[data-drag-handle]')) return
    setPickerOpen(true)
  }

  function handleDragOver(e) {
    if (!e.dataTransfer.types.includes('sponsor')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const sponsorName = e.dataTransfer.getData('sponsor')
    if (sponsorName) onDropSponsor(index, sponsorName)
  }

  return (
    <div
      ref={node => setNodeRef(node)}
      style={style}
      className="relative"
    >
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border rounded-lg cursor-pointer select-none transition-all
          flex flex-col items-center justify-center gap-1 p-1
          min-h-[72px]
          ${isDragOver
            ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-400 scale-105'
            : isSelected
              ? 'border-blue-500 ring-2 ring-blue-300 bg-blue-50'
              : isBlank
                ? 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
                : 'border-gray-200 bg-gray-100 hover:border-blue-300'
          }
          ${isDragging ? 'shadow-lg' : ''}
        `}
      >
        {/* Drag handle */}
        <div
          data-drag-handle
          {...attributes}
          {...listeners}
          className="absolute top-1 right-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-0.5"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <circle cx="3" cy="3" r="1.2"/><circle cx="7" cy="3" r="1.2"/>
            <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
          </svg>
        </div>

        {/* Slot label */}
        <span className="absolute top-1 left-1.5 text-[9px] font-mono text-gray-300">
          {colLabel}{rowLabel}
        </span>

        {/* Content */}
        {isBlank ? (
          <span className="text-xs text-gray-300 mt-2">BLANK</span>
        ) : (
          <span className="text-[10px] font-bold text-gray-600 text-center leading-tight px-1 mt-3">
            {value}
          </span>
        )}
      </div>

      {pickerOpen && (
        <SponsorPicker
          onSelect={name => onAssign(index, name)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
