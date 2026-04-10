/**
 * db.js — Supabase-backed persistence layer
 * Vervangt de localStorage-functies in sponsorTags.js
 * Alle functies zijn async en gooien bij een fout (caller mag zelf catch doen).
 */
import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Settings (key-value store voor lijsten zoals category_list, group_categories)
// ---------------------------------------------------------------------------

export async function loadSetting(key, fallback = null) {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  if (error) throw error
  return data ? data.value : fallback
}

export async function saveSetting(key, value) {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function loadEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('code')
    .order('sort_order')
  if (error) throw error
  return data.map(r => r.code)
}

export async function saveEvents(codes) {
  // Vervang volledige lijst: delete all, dan insert
  const { error: delErr } = await supabase.from('events').delete().neq('code', '')
  if (delErr) throw delErr
  if (codes.length === 0) return
  const rows = codes.map((code, i) => ({ code, sort_order: i }))
  const { error } = await supabase.from('events').insert(rows)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Event groups
// ---------------------------------------------------------------------------

export async function loadEventGroups() {
  const { data, error } = await supabase
    .from('event_groups')
    .select('name, event_codes')
    .order('name')
  if (error) throw error
  // Omzetten naar { [name]: string[] }
  return Object.fromEntries(data.map(r => [r.name, r.event_codes]))
}

export async function saveEventGroups(groups) {
  const { error: delErr } = await supabase.from('event_groups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) throw delErr
  const rows = Object.entries(groups).map(([name, event_codes]) => ({ name, event_codes }))
  if (rows.length === 0) return
  const { error } = await supabase.from('event_groups').insert(rows)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Sponsor event tags + categories (gedeelde tabel sponsor_event_tags)
// tags = { [sponsorName]: string[] }
// sponsorCategories = { [sponsorName]: { [eventCode]: string } }
// ---------------------------------------------------------------------------

export async function loadTags() {
  const { data, error } = await supabase
    .from('sponsor_event_tags')
    .select('sponsor_name, event_code')
  if (error) throw error
  const result = {}
  for (const row of data) {
    if (!result[row.sponsor_name]) result[row.sponsor_name] = []
    result[row.sponsor_name].push(row.event_code)
  }
  return result
}

export async function loadSponsorCategories() {
  const { data, error } = await supabase
    .from('sponsor_event_tags')
    .select('sponsor_name, event_code, category')
    .not('category', 'is', null)
  if (error) throw error
  const result = {}
  for (const row of data) {
    if (!result[row.sponsor_name]) result[row.sponsor_name] = {}
    result[row.sponsor_name][row.event_code] = row.category
  }
  return result
}

/**
 * Gecombineerde save: herplaatst alle (sponsor, event, category) rijen in één keer.
 * Gebruik dit altijd wanneer tags OF categorieën wijzigen, zodat er niets verloren gaat.
 */
export async function saveSponsorEventData(tags, sponsorCategories) {
  const { error: delErr } = await supabase.from('sponsor_event_tags').delete().neq('sponsor_name', '')
  if (delErr) throw delErr
  const rows = []
  for (const [sponsor_name, event_codes] of Object.entries(tags)) {
    for (const event_code of event_codes) {
      rows.push({
        sponsor_name,
        event_code,
        category: sponsorCategories?.[sponsor_name]?.[event_code] || null,
      })
    }
  }
  if (rows.length === 0) return
  const { error } = await supabase.from('sponsor_event_tags').insert(rows)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Sponsor group assignments  { [sponsorName]: { [groupName]: category } }
// ---------------------------------------------------------------------------

export async function loadSponsorGroups() {
  const { data, error } = await supabase
    .from('sponsor_group_assignments')
    .select('sponsor_name, group_name, category')
  if (error) throw error
  const result = {}
  for (const row of data) {
    if (!result[row.sponsor_name]) result[row.sponsor_name] = {}
    result[row.sponsor_name][row.group_name] = row.category
  }
  return result
}

export async function saveSponsorGroups(groups) {
  const { error: delErr } = await supabase.from('sponsor_group_assignments').delete().neq('sponsor_name', '')
  if (delErr) throw delErr
  const rows = []
  for (const [sponsor_name, groupMap] of Object.entries(groups)) {
    for (const [group_name, category] of Object.entries(groupMap)) {
      rows.push({ sponsor_name, group_name, category })
    }
  }
  if (rows.length === 0) return
  const { error } = await supabase.from('sponsor_group_assignments').insert(rows)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Custom sponsors  [{ name, logo_data_url }]
// ---------------------------------------------------------------------------

export async function loadCustomSponsors() {
  const { data, error } = await supabase
    .from('custom_sponsors')
    .select('name, logo_data_url')
    .order('name')
  if (error) throw error
  // Terugbrengen naar het formaat dat de app verwacht: [{ id, partner, dataUrl }]
  return data.map(r => ({ id: r.name, partner: r.name, dataUrl: r.logo_data_url }))
}

export async function addCustomSponsor({ partner, dataUrl }) {
  const { error } = await supabase
    .from('custom_sponsors')
    .upsert({ name: partner, logo_data_url: dataUrl }, { onConflict: 'name' })
  if (error) throw error
}

export async function deleteCustomSponsor(partner) {
  const { error } = await supabase
    .from('custom_sponsors')
    .delete()
    .eq('name', partner)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Logo overrides  { [sponsorName]: dataUrl }
// ---------------------------------------------------------------------------

export async function loadCustomLogos() {
  const { data, error } = await supabase
    .from('logo_overrides')
    .select('sponsor_name, logo_data_url')
  if (error) throw error
  return Object.fromEntries(data.map(r => [r.sponsor_name, r.logo_data_url]))
}

export async function saveCustomLogos(logos) {
  const { error: delErr } = await supabase.from('logo_overrides').delete().neq('sponsor_name', '')
  if (delErr) throw delErr
  const rows = Object.entries(logos).map(([sponsor_name, logo_data_url]) => ({
    sponsor_name,
    logo_data_url,
    updated_at: new Date().toISOString(),
  }))
  if (rows.length === 0) return
  const { error } = await supabase.from('logo_overrides').insert(rows)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Cell presets
// ---------------------------------------------------------------------------

export async function loadCellPresets() {
  const { data, error } = await supabase
    .from('cell_presets')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data.map(r => ({
    id: r.id,
    name: r.name,
    CellW_mm: r.cell_w_mm,
    CellAspect: r.cell_aspect,
    GutterX_mm: r.gutter_x_mm,
    GutterY_mm: r.gutter_y_mm,
  }))
}

export async function saveCellPresets(list) {
  const { error: delErr } = await supabase.from('cell_presets').delete().eq('is_default', false)
  if (delErr) throw delErr
  const rows = list.map(p => ({
    id: p.id,
    name: p.name,
    cell_w_mm: p.CellW_mm,
    cell_aspect: p.CellAspect,
    gutter_x_mm: p.GutterX_mm ?? 0,
    gutter_y_mm: p.GutterY_mm ?? 0,
    is_default: false,
  }))
  if (rows.length === 0) return
  const { error } = await supabase.from('cell_presets').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Canvas presets
// ---------------------------------------------------------------------------

export async function loadCanvasPresets() {
  const { data, error } = await supabase
    .from('canvas_presets')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data.map(r => ({
    id: r.id,
    name: r.name,
    CanvasWidth_mm: r.canvas_width_mm,
    CanvasHeight_mm: r.canvas_height_mm,
  }))
}

export async function saveCanvasPresets(list) {
  const rows = list.map(p => ({
    id: p.id,
    name: p.name,
    canvas_width_mm: p.CanvasWidth_mm,
    canvas_height_mm: p.CanvasHeight_mm,
    is_default: false,
  }))
  const { error } = await supabase.from('canvas_presets').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Format presets (custom backdrop-formaten)
// ---------------------------------------------------------------------------

export async function loadCustomFormats() {
  const { data, error } = await supabase
    .from('format_presets')
    .select('id, data')
    .order('created_at')
  if (error) throw error
  return data.map(r => ({ ...r.data, id: r.id }))
}

export async function saveCustomFormats(list) {
  const { error: delErr } = await supabase.from('format_presets').delete().neq('id', '')
  if (delErr) throw delErr
  if (list.length === 0) return
  const rows = list.map(f => ({ id: f.id, data: f }))
  const { error } = await supabase.from('format_presets').insert(rows)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Design folders
// ---------------------------------------------------------------------------

export async function loadDesignFolders() {
  const { data, error } = await supabase
    .from('design_folders')
    .select('name')
    .order('name')
  if (error) throw error
  return data.map(r => r.name)
}

export async function saveDesignFolders(folders) {
  const { error: delErr } = await supabase.from('design_folders').delete().neq('name', '')
  if (delErr) throw delErr
  if (folders.length === 0) return
  const { error } = await supabase.from('design_folders').insert(folders.map(name => ({ name })))
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Designs
// ---------------------------------------------------------------------------

export async function loadDesigns() {
  const { data, error } = await supabase
    .from('designs')
    .select('id, name, format_code, format, slots, folder, saved_at, updated_at')
    .order('saved_at', { ascending: false })
  if (error) throw error
  return data.map(r => ({
    id: r.id,
    name: r.name,
    formatCode: r.format_code,
    format: r.format,
    slots: r.slots,
    folder: r.folder,
    savedAt: r.saved_at,
  }))
}

export async function saveDesign({ id, name, formatCode, format, slots, folder }) {
  const { data, error } = await supabase
    .from('designs')
    .insert({
      id: id || undefined,
      name,
      format_code: formatCode,
      format,
      slots,
      folder: folder || null,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateDesign({ id, name, formatCode, format, slots, folder }) {
  const { error } = await supabase
    .from('designs')
    .update({
      name,
      format_code: formatCode,
      format,
      slots,
      folder: folder || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteDesign(id) {
  const { error } = await supabase.from('designs').delete().eq('id', id)
  if (error) throw error
}

export async function renameDesign(id, name) {
  const { error } = await supabase
    .from('designs')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function duplicateDesign(id) {
  const { data: src, error: fetchErr } = await supabase
    .from('designs')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr
  const { data, error } = await supabase
    .from('designs')
    .insert({
      name: src.name + ' (kopie)',
      format_code: src.format_code,
      format: src.format,
      slots: src.slots,
      folder: src.folder,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function moveDesignToFolder(id, folder) {
  const { error } = await supabase
    .from('designs')
    .update({ folder: folder || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
