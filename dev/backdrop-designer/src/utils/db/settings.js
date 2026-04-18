import { supabase } from '../supabase'

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
