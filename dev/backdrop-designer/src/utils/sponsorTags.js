const TAGS_KEY = 'backdropDesigner_sponsorTags'
const CATEGORIES_KEY = 'backdropDesigner_sponsorCategories'
const EVENTS_KEY = 'backdropDesigner_events'
const CAT_LIST_KEY = 'backdropDesigner_categoryList'

const DEFAULT_EVENTS = ['AGR', 'BCC', 'CXWC', 'ROAD', 'TSP']
const DEFAULT_CATEGORIES = ['Titelsponsor', 'Co-sponsor', 'Partner', 'Leverancier', 'Mediapartner']

// --- Events ---
export function loadTags() {
  try { return JSON.parse(localStorage.getItem(TAGS_KEY)) || {} } catch { return {} }
}
export function saveTags(tags) {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags))
}

// --- Per-sponsor, per-event categories ---
// Structure: { [sponsorName]: { [eventCode]: string } }
export function loadSponsorCategories() {
  try { return JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || {} } catch { return {} }
}
export function saveSponsorCategories(data) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(data))
}

// --- Events list ---
export function loadEvents() {
  try {
    const stored = JSON.parse(localStorage.getItem(EVENTS_KEY))
    if (Array.isArray(stored) && stored.length > 0) return stored
  } catch {}
  return [...DEFAULT_EVENTS]
}
export function saveEvents(events) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

// --- Category list ---
export function loadCategoryList() {
  try {
    const stored = JSON.parse(localStorage.getItem(CAT_LIST_KEY))
    if (Array.isArray(stored) && stored.length > 0) return stored
  } catch {}
  return [...DEFAULT_CATEGORIES]
}
export function saveCategoryList(list) {
  localStorage.setItem(CAT_LIST_KEY, JSON.stringify(list))
}

const CUSTOM_LOGOS_KEY = 'backdropDesigner_customLogos'

export function loadCustomLogos() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_LOGOS_KEY)) || {} } catch { return {} }
}
export function saveCustomLogos(logos) {
  localStorage.setItem(CUSTOM_LOGOS_KEY, JSON.stringify(logos))
}

// --- Event groups ---
// Structure: { [groupName]: string[] }  e.g. { "Spring Classics": ["OHN", "DDV", "RVV"] }
const EVENT_GROUPS_KEY = 'backdropDesigner_eventGroups'

export function loadEventGroups() {
  try { return JSON.parse(localStorage.getItem(EVENT_GROUPS_KEY)) || {} } catch { return {} }
}
export function saveEventGroups(groups) {
  localStorage.setItem(EVENT_GROUPS_KEY, JSON.stringify(groups))
}

// --- Group-level categories ---
// e.g. ["Top partner", "Main partner", "Official partner", "Official supplier"]
const GROUP_CAT_KEY = 'backdropDesigner_groupCategories'
const DEFAULT_GROUP_CATS = ['Top partner', 'Main partner', 'Official partner', 'Official supplier']

export function loadGroupCategories() {
  try {
    const stored = JSON.parse(localStorage.getItem(GROUP_CAT_KEY))
    if (Array.isArray(stored) && stored.length > 0) return stored
  } catch {}
  return [...DEFAULT_GROUP_CATS]
}
export function saveGroupCategories(list) {
  localStorage.setItem(GROUP_CAT_KEY, JSON.stringify(list))
}

// --- Sponsor group assignments ---
// Structure: { [sponsorName]: { [groupName]: categoryString } }
const SPONSOR_GROUPS_KEY = 'backdropDesigner_sponsorGroups'

export function loadSponsorGroups() {
  try { return JSON.parse(localStorage.getItem(SPONSOR_GROUPS_KEY)) || {} } catch { return {} }
}
export function saveSponsorGroups(data) {
  localStorage.setItem(SPONSOR_GROUPS_KEY, JSON.stringify(data))
}

// --- Saved designs ---
// Structure: [{ id, name, formatCode, format, slots, savedAt, folder?: string }]
const SAVED_DESIGNS_KEY = 'backdropDesigner_savedDesigns'

export function loadSavedDesigns() {
  try { return JSON.parse(localStorage.getItem(SAVED_DESIGNS_KEY)) || [] } catch { return [] }
}
export function saveDesignsList(list) {
  localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(list))
}

// --- Design folders ---
// Structure: string[]
const DESIGN_FOLDERS_KEY = 'backdropDesigner_designFolders'

export function loadDesignFolders() {
  try {
    const stored = JSON.parse(localStorage.getItem(DESIGN_FOLDERS_KEY))
    if (Array.isArray(stored)) return stored
  } catch {}
  return []
}
export function saveDesignFolders(list) {
  localStorage.setItem(DESIGN_FOLDERS_KEY, JSON.stringify(list))
}

// --- Cell size presets ---
// Structure: [{ id, name, CellW_mm, CellAspect }]
const CELL_PRESETS_KEY = 'backdropDesigner_cellPresets'

const DEFAULT_CELL_PRESETS = [
  { id: 'default_1', name: 'Mixed Zone', CellW_mm: 356, CellAspect: 1.667, GutterX_mm: 80, GutterY_mm: 80 },
  { id: 'default_2', name: 'Flash Interview', CellW_mm: 200, CellAspect: 1.667, GutterX_mm: 40, GutterY_mm: 40 },
]

export function loadCellPresets() {
  try {
    const stored = JSON.parse(localStorage.getItem(CELL_PRESETS_KEY))
    if (Array.isArray(stored)) return stored
  } catch {}
  return [...DEFAULT_CELL_PRESETS]
}

export function saveCellPresets(list) {
  localStorage.setItem(CELL_PRESETS_KEY, JSON.stringify(list))
}

// --- Canvas presets ---
const CANVAS_PRESETS_KEY = 'backdropDesigner_canvasPresets'

const DEFAULT_CANVAS_PRESETS = [
  { id: 'canvas_1', name: 'Mixed Zone (7900×2300)', CanvasWidth_mm: 7900, CanvasHeight_mm: 2300 },
  { id: 'canvas_2', name: 'Flash (4000×2300)', CanvasWidth_mm: 4000, CanvasHeight_mm: 2300 },
]

export function loadCanvasPresets() {
  try {
    const stored = JSON.parse(localStorage.getItem(CANVAS_PRESETS_KEY))
    if (Array.isArray(stored)) return stored
  } catch {}
  return [...DEFAULT_CANVAS_PRESETS]
}

export function saveCanvasPresets(list) {
  localStorage.setItem(CANVAS_PRESETS_KEY, JSON.stringify(list))
}

// --- Custom format presets ---
// Structure: [{ id, _custom: true, Code, Beschrijving, Cols, Rows, CanvasWidth_mm, ... }]
const CUSTOM_FORMATS_KEY = 'backdropDesigner_customFormats'

export function loadCustomFormats() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_FORMATS_KEY)) || [] } catch { return [] }
}
export function saveCustomFormats(list) {
  localStorage.setItem(CUSTOM_FORMATS_KEY, JSON.stringify(list))
}

// --- Draft (auto-save werkstand) ---
const DRAFT_KEY = 'backdropDesigner_draft'

export function saveDraft(data) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)) } catch {}
}
export function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) } catch { return null }
}
export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

// --- Default aspect ratio ---
const DEFAULT_ASPECT_KEY = 'backdropDesigner_defaultAspect'

export function loadDefaultAspect() {
  const v = parseFloat(localStorage.getItem(DEFAULT_ASPECT_KEY))
  return isNaN(v) ? 1.667 : v
}

export function saveDefaultAspect(val) {
  localStorage.setItem(DEFAULT_ASPECT_KEY, String(val))
}
