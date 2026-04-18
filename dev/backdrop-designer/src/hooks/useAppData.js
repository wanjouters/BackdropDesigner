import { useState, useEffect } from 'react'
import * as db from '../utils/db'

const DEFAULT_CATEGORIES = ['Titelsponsor', 'Co-sponsor', 'Partner', 'Leverancier', 'Mediapartner']
const DEFAULT_CELL_PRESETS = [
  { id: 'default_1', name: 'Mixed Zone', CellW_mm: 356, CellAspect: 1.667, GutterX_mm: 80, GutterY_mm: 80 },
  { id: 'default_2', name: 'Flash Interview', CellW_mm: 200, CellAspect: 1.667, GutterX_mm: 40, GutterY_mm: 40 },
]
const DEFAULT_CANVAS_PRESETS = [
  { id: 'canvas_1', name: 'Mixed Zone (7900×2300)', CanvasWidth_mm: 7900, CanvasHeight_mm: 2300 },
  { id: 'canvas_2', name: 'Flash (4000×2300)', CanvasWidth_mm: 4000, CanvasHeight_mm: 2300 },
]
const DEFAULT_BACKGROUND_PRESETS = []

/**
 * Loads all persisted app data from Supabase on mount. Exposes every piece
 * of state with its setter so App.jsx can still mutate individual slices
 * after load-time (inline edits, admin changes, etc.).
 */
export function useAppData() {
  const [savedDesigns, setSavedDesigns] = useState([])
  const [designFolders, setDesignFolders] = useState([])
  const [tags, setTags] = useState({})
  const [sponsorCategories, setSponsorCategories] = useState({})
  const [events, setEvents] = useState([])
  const [categoryList, setCategoryList] = useState(DEFAULT_CATEGORIES)
  const [eventGroups, setEventGroups] = useState({})
  const [sponsorGroups, setSponsorGroups] = useState({})
  const [cellPresets, setCellPresets] = useState(DEFAULT_CELL_PRESETS)
  const [canvasPresets, setCanvasPresets] = useState(DEFAULT_CANVAS_PRESETS)
  const [backgroundPresets, setBackgroundPresets] = useState(DEFAULT_BACKGROUND_PRESETS)
  const [customFormats, setCustomFormats] = useState([])
  const [customSponsors, setCustomSponsors] = useState([])
  const [customLogos, setCustomLogos] = useState({})
  const [staticImported, setStaticImported] = useState(false)
  const [dbLoading, setDbLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      try {
        const [
          designs, eventsVal, eventGroupsVal, tagsVal, cats, sponsorGroupsVal,
          catList, customSponsorsVal, logos, cellPresetsVal, canvasPresetsVal,
          backgroundPresetsVal, customFormatsVal, staticImportedVal,
        ] = await Promise.all([
          db.loadDesigns(),
          db.loadEvents(),
          db.loadEventGroups(),
          db.loadTags(),
          db.loadSponsorCategories(),
          db.loadSponsorGroups(),
          db.loadSetting('category_list', DEFAULT_CATEGORIES),
          db.loadCustomSponsors(),
          db.loadCustomLogos(),
          db.loadCellPresets(),
          db.loadCanvasPresets(),
          db.loadBackgroundPresets(),
          db.loadCustomFormats(),
          db.loadSetting('static_imported', false),
        ])
        setSavedDesigns(designs)
        setEvents(eventsVal.length ? eventsVal : [])
        setEventGroups(eventGroupsVal)
        setTags(tagsVal)
        setSponsorCategories(cats)
        setSponsorGroups(sponsorGroupsVal)
        setCategoryList(catList)
        setCustomSponsors(customSponsorsVal)
        setCustomLogos(logos)
        setCellPresets(cellPresetsVal.length ? cellPresetsVal : DEFAULT_CELL_PRESETS)
        setCanvasPresets(canvasPresetsVal.length ? canvasPresetsVal : DEFAULT_CANVAS_PRESETS)
        setBackgroundPresets(backgroundPresetsVal)
        setCustomFormats(customFormatsVal)
        setStaticImported(staticImportedVal)
      } catch (err) {
        console.error('Supabase load error:', err)
      } finally {
        setDbLoading(false)
      }
    }
    loadAll()
  }, [])

  return {
    savedDesigns, setSavedDesigns,
    designFolders, setDesignFolders,
    tags, setTags,
    sponsorCategories, setSponsorCategories,
    events, setEvents,
    categoryList, setCategoryList,
    eventGroups, setEventGroups,
    sponsorGroups, setSponsorGroups,
    cellPresets, setCellPresets,
    canvasPresets, setCanvasPresets,
    backgroundPresets, setBackgroundPresets,
    customFormats, setCustomFormats,
    customSponsors, setCustomSponsors,
    customLogos, setCustomLogos,
    staticImported, setStaticImported,
    dbLoading,
  }
}

export { DEFAULT_CATEGORIES, DEFAULT_CELL_PRESETS, DEFAULT_CANVAS_PRESETS, DEFAULT_BACKGROUND_PRESETS }
