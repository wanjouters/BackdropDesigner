const STORAGE_BASE = import.meta.env.VITE_SUPABASE_URL
  + '/storage/v1/object/public/logos/'

/**
 * Geeft de URL van een logo terug.
 * Volgorde: custom override → Supabase Storage → fallback null (BLANK)
 */
export function logoUrl(filename, customSrc) {
  if (customSrc) return customSrc
  if (!filename || filename === 'BLANK') return null
  return STORAGE_BASE + filename + '.png'
}

export { STORAGE_BASE }
