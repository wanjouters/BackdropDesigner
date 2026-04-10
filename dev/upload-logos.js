/**
 * upload-logos.js — Upload geëxporteerde logo's naar Supabase Storage
 *
 * Gebruik vanuit Illustrator export-script:
 *   app.system('node /pad/naar/upload-logos.js "/pad/naar/exportmap"');
 *
 * Of manueel:
 *   node upload-logos.js "/pad/naar/exportmap"
 */
import { createClient } from '@supabase/supabase-js'
import { readdir, readFile } from 'fs/promises'
import { join, extname, basename } from 'path'
import { existsSync } from 'fs'

const SUPABASE_URL = 'https://holypriabntrbxpnsjfe.supabase.co'
const SUPABASE_KEY = 'sb_publishable_lfKt3J7hnJMRvbb45PecUw_ZW2Sgh5L'

const MIME = {
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  const folder = process.argv[2]

  if (!folder || !existsSync(folder)) {
    console.error('Gebruik: node upload-logos.js "/pad/naar/exportmap"')
    process.exit(1)
  }

  const files = await readdir(folder)
  const logos = files.filter(f => MIME[extname(f).toLowerCase()])

  if (logos.length === 0) {
    console.log('Geen logo-bestanden gevonden in: ' + folder)
    process.exit(0)
  }

  console.log(logos.length + ' bestand(en) uploaden naar Supabase Storage...')

  let ok = 0, err = 0

  for (const file of logos) {
    const data = await readFile(join(folder, file))
    const mime = MIME[extname(file).toLowerCase()]
    const name = basename(file)

    const { error } = await supabase.storage
      .from('logos')
      .upload(name, data, { contentType: mime, upsert: true })

    if (error) {
      console.error('FOUT ' + name + ': ' + error.message)
      err++
    } else {
      console.log('OK ' + name)
      ok++
    }
  }

  console.log('\n' + ok + ' geupload, ' + err + ' fouten.')

  if (err > 0) process.exit(1)
}

main().catch(function (e) {
  console.error('Fout: ' + e.message)
  process.exit(1)
})
