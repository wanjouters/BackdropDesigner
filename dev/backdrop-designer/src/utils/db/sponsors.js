import { supabase } from '../supabase'

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
 * Per-sponsor save: verwijdert en herplaatst de rijen voor ÉÉN sponsor.
 * Veilig te gebruiken vanuit de main app zonder risico op het wissen van andere sponsordata.
 */
export async function saveSponsorTags(sponsorName, eventCodes, categoryMap) {
  const { error: delErr } = await supabase
    .from('sponsor_event_tags')
    .delete()
    .eq('sponsor_name', sponsorName)
  if (delErr) throw delErr
  if (!eventCodes || eventCodes.length === 0) return
  const rows = eventCodes.map(event_code => ({
    sponsor_name: sponsorName,
    event_code,
    category: categoryMap?.[event_code] || null,
  }))
  const { error } = await supabase.from('sponsor_event_tags').insert(rows)
  if (error) throw error
}

/**
 * Gecombineerde save: herplaatst alle (sponsor, event, category) rijen in één keer.
 * Gebruik dit alleen vanuit de admin waar de volledige state geladen is.
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

/**
 * Per-sponsor group save: verwijdert en herplaatst de groepsrijen voor ÉÉN sponsor.
 */
export async function saveSponsorGroup(sponsorName, groupMap) {
  const { error: delErr } = await supabase
    .from('sponsor_group_assignments')
    .delete()
    .eq('sponsor_name', sponsorName)
  if (delErr) throw delErr
  const rows = Object.entries(groupMap || {}).map(([group_name, category]) => ({
    sponsor_name: sponsorName,
    group_name,
    category,
  }))
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
