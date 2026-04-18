import { supabase } from '../supabase'

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

// ---------------------------------------------------------------------------
// Background presets
// ---------------------------------------------------------------------------

export async function loadBackgroundPresets() {
  const { data, error } = await supabase
    .from('background_presets')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data.map(r => ({
    id: r.id,
    name: r.name,
    BackgroundColor_Hex: r.color_hex,
    BackgroundColor_Cmyk: { c: r.cmyk_c, m: r.cmyk_m, y: r.cmyk_y, k: r.cmyk_k },
    koepelIds: r.koepel_ids || [],
    eventCodes: r.event_codes || [],
    sortOrder: r.sort_order,
  }))
}

export async function upsertBackgroundPreset(preset, sortOrder) {
  const { error } = await supabase
    .from('background_presets')
    .upsert({
      id: preset.id,
      name: preset.name,
      color_hex: preset.BackgroundColor_Hex,
      cmyk_c: preset.BackgroundColor_Cmyk.c,
      cmyk_m: preset.BackgroundColor_Cmyk.m,
      cmyk_y: preset.BackgroundColor_Cmyk.y,
      cmyk_k: preset.BackgroundColor_Cmyk.k,
      koepel_ids: preset.koepelIds || [],
      event_codes: preset.eventCodes || [],
      sort_order: sortOrder,
    }, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteBackgroundPreset(id) {
  const { error } = await supabase.from('background_presets').delete().eq('id', id)
  if (error) throw error
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
