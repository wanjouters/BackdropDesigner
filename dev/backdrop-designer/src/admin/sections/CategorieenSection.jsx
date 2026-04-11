import { useState, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { loadSetting, saveSetting } from '../../utils/db'

const DEFAULT_CATEGORIES = ['Titel', 'Goud', 'Zilver', 'Brons', 'Partner', 'Leverancier', 'Media']

function SortableItem({ id, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>
      <span className="flex-1 text-sm font-medium text-gray-700">{id}</span>
      <button
        onClick={() => onDelete(id)}
        className="text-gray-300 hover:text-red-500 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function CategorieenSection({ showToast }) {
  const [categories, setCategories] = useState([])
  const [newCat, setNewCat] = useState('')
  const [loading, setLoading] = useState(true)

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    loadSetting('category_list', DEFAULT_CATEGORIES).then(list => {
      setCategories(list)
      setLoading(false)
    }).catch(e => {
      showToast('Laden mislukt: ' + e.message, 'error')
      setLoading(false)
    })
  }, [])

  async function persist(next) {
    setCategories(next)
    try {
      await saveSetting('category_list', next)
      showToast('Categorieën opgeslagen')
    } catch (e) {
      showToast('Opslaan mislukt: ' + e.message, 'error')
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIdx = categories.indexOf(active.id)
      const newIdx = categories.indexOf(over.id)
      persist(arrayMove(categories, oldIdx, newIdx))
    }
  }

  function handleAdd() {
    const v = newCat.trim()
    if (!v || categories.includes(v)) return
    persist([...categories, v])
    setNewCat('')
  }

  function handleDelete(cat) {
    persist(categories.filter(c => c !== cat))
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Laden…</div>

  return (
    <div className="p-8 max-w-md">
      <p className="text-sm text-gray-500 mb-6">
        Categorieën bepalen de prioriteitsvolgorde van sponsors. Sleep om te herordenen.
        Wijzigingen zijn meteen zichtbaar in de app.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-4">
            {categories.map(cat => (
              <SortableItem key={cat} id={cat} onDelete={handleDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {categories.length === 0 && (
        <p className="text-xs text-gray-400 italic mb-4">Nog geen categorieën</p>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nieuwe categorie…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={!newCat.trim()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-700"
        >
          Toevoegen
        </button>
      </div>
    </div>
  )
}
