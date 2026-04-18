import { supabase } from '../supabase'

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

export async function loadKoepels() {
  const { data, error } = await supabase
    .from('event_groups')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data.map(r => ({ id: r.id, name: r.name }))
}

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
