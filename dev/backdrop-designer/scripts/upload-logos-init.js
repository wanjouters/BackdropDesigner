/**
 * Eenmalig init-script: upload alle bestaande logo's uit public/logos/ naar Supabase Storage.
 * Gebruik: node scripts/upload-logos-init.js
 */
import { createClient } from '@supabase/supabase-js'
import { readdir, readFile } from 'fs/promises'
import { join, extname } from 'path'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://holypriabntrbxpnsjfe.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_lfKt3J7hnJMRvbb45PecUw_ZW2Sgh5L'
const LOGOS_DIR = new URL('../public/logos', import.meta.url).pathname

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const MIME = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }

async function main() {
  const files = await readdir(LOGOS_DIR)
  const logos = files.filter(f => MIME[extname(f).toLowerCase()])

  console.log(`${logos.length} logo's gevonden, uploaden naar Supabase Storage...`)

  let ok = 0, skip = 0, err = 0

  for (const file of logos) {
    const data = await readFile(join(LOGOS_DIR, file))
    const mime = MIME[extname(file).toLowerCase()]

    const { error } = await supabase.storage
      .from('logos')
      .upload(file, data, { contentType: mime, upsert: true })

    if (error) {
      console.error(`  ✗ ${file}: ${error.message}`)
      err++
    } else {
      process.stdout.write(`  ✓ ${file}\n`)
      ok++
    }
  }

  console.log(`\nKlaar: ${ok} geüpload, ${skip} overgeslagen, ${err} fouten.`)
}

main().catch(console.error)
