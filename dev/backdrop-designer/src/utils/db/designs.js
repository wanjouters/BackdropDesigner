import { supabase } from '../supabase'

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
    .select('id, name, format_code, format, slots, folder, event, edition, user_id, created_by_name, saved_at, updated_at')
    .order('saved_at', { ascending: false })
  if (error) throw error
  return data.map(r => ({
    id: r.id,
    name: r.name,
    formatCode: r.format_code,
    format: r.format,
    slots: r.slots,
    folder: r.folder,
    event: r.event ?? null,
    edition: r.edition ?? null,
    userId: r.user_id ?? null,
    createdByName: r.created_by_name ?? null,
    savedAt: r.saved_at,
    updatedAt: r.updated_at ?? null,
  }))
}

export async function saveDesign({ id, name, formatCode, format, slots, folder, event, edition, userId, createdByName }) {
  const { data, error } = await supabase
    .from('designs')
    .insert({
      id: id || undefined,
      name,
      format_code: formatCode,
      format,
      slots,
      folder: folder || null,
      event: event || null,
      edition: edition || null,
      user_id: userId || null,
      created_by_name: createdByName || null,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateDesign({ id, name, formatCode, format, slots, folder, event, edition }) {
  const { error } = await supabase
    .from('designs')
    .update({
      name,
      format_code: formatCode,
      format,
      slots,
      folder: folder || null,
      event: event || null,
      edition: edition || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function updateDesignMeta(id, { name, event, edition }) {
  const { error } = await supabase
    .from('designs')
    .update({
      name,
      event: event || null,
      edition: edition || null,
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

export async function duplicateDesign(id, { userId, createdByName } = {}) {
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
      event: src.event || null,
      edition: src.edition || null,
      user_id: userId || null,
      created_by_name: createdByName || null,
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
