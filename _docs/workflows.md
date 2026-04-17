# Workflows — Logo & Format Pipeline

## Logo-update workflow (Illustrator → Supabase Storage)

```
Logo aanpassen in Illustrator
        ↓
Batch export script runnen (1 klik)
        ↓
PNG's lokaal opgeslagen in exportmap
        ↓
upload-logos.js uploadt naar Supabase Storage (upsert)
        ↓
App laadt logo's via Supabase Storage URL
```

---

## Batch Export Script

**Locatie:** `dev/batch_export_logos_v1_DEV.jsx`
**Runnen:** Illustrator → `File > Scripts > Other Script…`

### Wat het doet
1. Itereert alle artboards in het actieve AI-document
2. Exporteert elk artboard als PNG of SVG naar een lokale map (bv. `public/logos/`)
3. Gebruikt de artboard-naam exact als bestandsnaam (= zelfde naam als Gridzilla verwacht)
4. Leest `sponsors.json` en voegt ontbrekende sponsors toe (bestaande entries nooit gewijzigd)
5. Probeert na export automatisch `/tmp/bd_upload.command` te starten voor upload naar Supabase

### Regels
- Artboard `BLANK` wordt altijd overgeslagen (hardcoded in app)
- Bestandsnaam = artboard-naam → `A_WARE.png`
- Partner-naam = artboard-naam met underscores → spaties → `A WARE`
- Prefs worden opgeslagen in `~/Library/Application Support/BackdropDesigner/batch_export.prefs`

### Auto-upload naar Supabase Storage

Na de export schrijft het script `/tmp/bd_upload.command` en probeert het via `File.execute()` te starten. Dit vereist **eenmalig** in Terminal:
```
chmod +x /tmp/bd_upload.command
```
Daarna blijft de execute-bit bewaard (Unix-rechten op bestandsinhoud overschrijven).

**Let op**: auto-upload werkt **niet** vanuit CEP-extensies (bv. LoaderScriptPanel). In dat geval toont het script een melding met het handmatige commando:
```
node "dev/backdrop-designer/scripts/upload-logos.js" "/pad/naar/exportmap"
```

---

## upload-logos.js

Node.js ES module (`dev/backdrop-designer/scripts/upload-logos.js`).

- Neemt de exportmap als argument
- Leest alle PNG/SVG-bestanden
- Uploadt naar de `logos` bucket in Supabase Storage met `upsert: true`
- Vereist `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` als omgevingsvariabelen (of in `.env` in de `dev/` map)

### Initiële bulk-upload

`scripts/upload-logos-init.js` — eenmalig gebruikt om alle 193 bestaande logo's in één keer naar Supabase te uploaden.

---

## logoUrl.js — URL resolver

Centrale URL-resolver voor alle logo-bronnen:

```js
logoUrl(filename, customSrc)
// → customSrc als aanwezig
// → Supabase Storage URL: VITE_SUPABASE_URL + '/storage/v1/object/public/logos/' + filename + '.png'
// → null als filename leeg of 'BLANK'
```

Gebruikt in: `PreviewCanvas.jsx`, `LogoLibrary.jsx`, `SponsorEditModal.jsx`, `exportJpeg.js`.

**URL-patroon**:
```
https://holypriabntrbxpnsjfe.supabase.co/storage/v1/object/public/logos/<FILENAME>.png
```

**Supabase Storage bucket `logos`**: public, RLS policies voor SELECT/INSERT/UPDATE.

---

## SVG vs PNG

- Huidig formaat: **PNG**
- SVG is ondersteund in het script (aanbevolen voor toekomstige overstap)
- Overstap = enkel andere radiobutton aanvinken in het dialoogvenster

---

## Export uit de webapp

Via `ExportMenu`-dropdown in de toolbar:

| Formaat | Gebruik |
|---|---|
| **CSV** | Input voor Gridzilla Illustrator-script (downstream) |
| **JPEG** | Snelle visuele preview / mockup |
| **JSON** | `{ version: 1, format, slots, exportedAt }` — rijker alternatief voor CSV (toekomstig Gridzilla-formaat) |
| **JSON laden** | Importeert een eerder geëxporteerde JSON terug in de app |

---

## Gridzilla downstream (huidige situatie)

```
BackdropDesigner (browser)  →  CSV  →  Gridzilla (ExtendScript in Illustrator)
```

Gridzilla leest de CSV in en bouwt de Illustrator-backdrop. Zie [roadmap.md](roadmap.md) voor de geplande overstap naar JSON en eventueel UXP.

---

## Vercel deployment

- **Auto-deploy** bij git push naar `main` via GitHub-integratie
- Env vars ingesteld in Vercel dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Repo-root `vercel.json`:
  ```json
  {
    "installCommand": "cd dev/backdrop-designer && npm install",
    "buildCommand": "cd dev/backdrop-designer && npm run build",
    "outputDirectory": "dev/backdrop-designer/dist",
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- `rewrites` (niet `routes`) — voorkomt conflict met Vite framework routing

---

## Admin-only Edge Function `admin-users`

`verify_jwt: false` — verificatie gebeurt intern via `supabaseAdmin.auth.getUser(token)`.

Acties:
- `list` — geeft users + `name` (user_metadata) + `role` (app_metadata, default `'gebruiker'`)
- `invite` — stuurt magic-link uitnodiging
- `update` — slaat `name` op in `user_metadata`, `role` in `app_metadata`
- `delete` — verwijdert user

`callEdge` frontend-helper checkt `res.ok` zodat HTTP-fouten altijd als error gegooid worden.
