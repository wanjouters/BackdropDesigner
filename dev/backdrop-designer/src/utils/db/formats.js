import { supabase } from '../supabase'

// ---------------------------------------------------------------------------
// Format presets (custom backdrop-formaten)
// ---------------------------------------------------------------------------

export async function loadFormats() {
  const { data, error } = await supabase
    .from('format_presets')
    .select('id, data, sort_order')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data.map(r => ({ ...r.data, id: r.id, sort_order: r.sort_order }))
}

export async function upsertFormat(format, sortOrder) {
  const id = format.id || format.Code || `format_${Date.now()}`
  const dataToStore = { ...format, id, tags: format.tags || [] }
  const { error } = await supabase.from('format_presets').upsert(
    { id, data: dataToStore, sort_order: sortOrder ?? 0 },
    { onConflict: 'id' }
  )
  if (error) throw error
  return id
}

export async function deleteFormat(id) {
  const { error } = await supabase.from('format_presets').delete().eq('id', id)
  if (error) throw error
}

export async function bulkImportFormats(formats) {
  const { error: delErr } = await supabase.from('format_presets').delete().neq('id', '')
  if (delErr) throw delErr
  if (formats.length === 0) return
  const rows = formats.map((f, i) => {
    const id = f.Code || `format_${i}`
    const data = { ...f, id, tags: f.tags || [], _custom: true }
    return { id, data, sort_order: i }
  })
  const { error } = await supabase.from('format_presets').insert(rows)
  if (error) throw error
}

export async function reorderFormats(orderedFormats) {
  // orderedFormats: array of { id } in new order
  const updates = orderedFormats.map((f, i) => ({ id: f.id, sort_order: i }))
  for (const u of updates) {
    const { error } = await supabase.from('format_presets').update({ sort_order: u.sort_order }).eq('id', u.id)
    if (error) throw error
  }
}

// Legacy — still used by App.jsx until full migration
export async function loadCustomFormats() {
  return loadFormats()
}

export async function saveCustomFormats(list) {
  const { error: delErr } = await supabase.from('format_presets').delete().neq('id', '')
  if (delErr) throw delErr
  if (list.length === 0) return
  const rows = list.map((f, i) => ({ id: f.id, data: { ...f, tags: f.tags || [] }, sort_order: i }))
  const { error } = await supabase.from('format_presets').insert(rows)
  if (error) throw error
}
