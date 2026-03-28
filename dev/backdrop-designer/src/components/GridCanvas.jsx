import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import SlotCell from './SlotCell'

export default function GridCanvas({ format, slots, onSlotsChange, selectedSlots, onSelectSlot, onDropSponsor }) {
  const { Cols, Rows } = format

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = parseInt(active.id.replace('slot-', ''))
    const newIndex = parseInt(over.id.replace('slot-', ''))
    onSlotsChange(arrayMove(slots, oldIndex, newIndex))
  }

  const ids = slots.map((_, i) => `slot-${i}`)
  const colLabels = Array.from({ length: Cols }, (_, i) => `C${i + 1}`)
  const rowLabels = Array.from({ length: Rows }, (_, i) => `R${i + 1}`)

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-1 mb-1"
        style={{ gridTemplateColumns: `repeat(${Cols}, minmax(0, 1fr))` }}
      >
        {colLabels.map(label => (
          <div key={label} className="text-center text-[10px] font-mono text-gray-400 font-medium">
            {label}
          </div>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${Cols}, minmax(0, 1fr))` }}
          >
            {slots.map((value, i) => {
              const col = i % Cols
              const row = Math.floor(i / Cols)
              return (
                <SlotCell
                  key={`slot-${i}`}
                  id={`slot-${i}`}
                  index={i}
                  value={value}
                  colLabel={colLabels[col]}
                  rowLabel={rowLabels[row]}
                  isSelected={selectedSlots.has(i)}
                  onSelect={onSelectSlot}
                  onDropSponsor={onDropSponsor}
                  onAssign={(idx, name) => {
                    const next = [...slots]
                    next[idx] = name
                    onSlotsChange(next)
                  }}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
