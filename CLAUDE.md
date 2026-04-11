# BackdropDesigner — Project Context voor Claude

## Wat is BackdropDesigner?

BackdropDesigner is een React-webapp (Vite + Tailwind CSS v4) voor het visueel ontwerpen van sponsor-backdrops voor Flanders Classics wielerwedstrijden. De gebruiker wijst sponsors toe aan gridslots, bekijkt een live preview, en exporteert het resultaat als CSV voor het Gridzilla Illustrator-script, of als JPEG.

---

## Stack & Omgeving

| | |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| State | `useState` + **Supabase** (PostgreSQL + Storage) |
| Taal | JSX (geen TypeScript) |
| Dev server | `npm run dev` → `http://localhost:5173` |
| Hosting | Vercel (auto-deploy bij git push naar `main`) |
| Database | Supabase — project `holypriabntrbxpnsjfe`, EU West |
| Locatie | `apps/BackdropDesigner/dev/backdrop-designer/` |

---

## Projectstructuur

```
apps/BackdropDesigner/
  dev/
    backdrop-designer/           — de Vite/React webapp
      src/
        App.jsx                  — Hoofdcomponent, state-beheer, layout
      components/
        LogoLibrary.jsx        — Rechterpaneel: sponsorbibliotheek, filters, instellingen
        GridCanvas.jsx         — Rasterweergave met klikbare slots
        PreviewCanvas.jsx      — Schaalbare JPEG-achtige preview
        GridTypeSelector.jsx   — Linkerpaneel: formatenlijst + tag-filter (alleen lezen)
        GridToolbar.jsx        — Kolommen/rijen/cel-instellingen boven het grid
        SponsorEditModal.jsx   — Popup voor per-sponsor event/categorie-instellingen
        SlotCell.jsx           — Individueel gridvak
        FrequencyPanel.jsx     — Frequentietelling sponsors
        ExportButton.jsx       — CSV-export knop
      admin/
        AdminPage.jsx          — Auth-guard: toont AdminLogin of AdminLayout
        AdminLogin.jsx         — Magic link login-formulier
        AdminLayout.jsx        — Sidebar-nav + sectie-routing
        sections/
          LogosSection.jsx     — Logo-beheer: upload, tags, event-koppeling
          FormatenSection.jsx  — Formaatbeheer: CRUD, tags, drag-reorder, import
          FormatEditModal.jsx  — Volledig formulier voor formaatbeheer (alle velden)
          EventsSection.jsx    — Events + Koepels beheren
          CategorieenSection.jsx — Categorie-volgorde beheren
          PresetsSection.jsx   — Cel/Canvas presets beheren
          GebruikersSection.jsx — Gebruikers uitnodigen/beheren via Edge Function
      utils/
        supabase.js            — Supabase client (createClient met env vars)
        db.js                  — Alle async DB-functies (vervangt localStorage)
        logoUrl.js             — Logo URL resolver: custom → Supabase Storage → null
        sponsorTags.js         — Legacy localStorage functies (nog aanwezig, niet meer primair)
        exportJpeg.js          — JPEG-export logica
        barPosition.js         — Gedeelde barPosition parser
      data/
        sponsors.json          — Sponsordatabase (velden: partner + filename)
        backdropFormats.json   — Statische fallback-formaten (32 stuks); na admin-import niet meer actief
      scripts/
        upload-logos-init.js   — Eenmalig bulk-upload script (193 logos → Supabase Storage)
        upload-logos.js        — Node.js script: uploadt geëxporteerde logos naar Supabase Storage
    batch_export_logos_v1_DEV.jsx  — ExtendScript: batch export vanuit Illustrator
  vercel.json                      — Vercel-configuratie: buildCommand, outputDirectory, SPA-rewrites
```

### sponsors.json formaat

```json
{ "partner": "A WARE", "filename": "A_WARE" }
```

- `partner`: weergavenaam (met spaties), sleutel voor alle tags/data in localStorage
- `filename`: bestandsnaam zonder extensie → Supabase Storage URL via `logoUrl(filename)`
- Geen `url`-veld meer (was FTP-pad uit oude Excel-workflow, niet meer nodig)
- `BLANK` staat **niet** in de JSON — die is hardcoded in `App.jsx`

---

## State & Persistentie (Supabase)

Alle persistente state wordt opgeslagen in **Supabase (PostgreSQL)** via `src/utils/db.js`. Alle functies zijn `async` en worden fire-and-forget aangeroepen met `.catch(console.error)`.

### Supabase tabellen

| Tabel | Inhoud |
|---|---|
| `designs` | Opgeslagen ontwerpen — `id, name, format_code, format, slots, folder, saved_at, updated_at` |
| `events` | Eventcodes — `code, sort_order` |
| `event_groups` | Koepels — `name, event_codes` |
| `sponsor_event_tags` | Event-tags + categorie per sponsor per event — `sponsor_name, event_code, category` |
| `sponsor_group_assignments` | Koepel-assignments — `sponsor_name, group_name, category` |
| `settings` | Key-value opslag — `key, value` (o.a. `category_list`, `static_imported`, `default_aspect`) |
| `custom_sponsors` | Sponsors toegevoegd via de app — `name, logo_data_url` |
| `logo_overrides` | Custom logo-overrides voor bestaande sponsors — `sponsor_name, logo_data_url` |
| `cell_presets` | Celdimensie-presets — `id, data` |
| `canvas_presets` | Canvas-presets — `id, data` |
| `format_presets` | Gridformaten — `id (text), data (jsonb), sort_order (int)` — `data` bevat alle formaatsvelden incl. `tags: []` |

Alle tabellen hebben een nullable `user_id uuid` kolom voor toekomstige multi-user migratie (RLS).

### Kritisch patroon — gecombineerde tags + categorieën

`sponsor_event_tags` slaat zowel event-tags als per-event categorieën op in dezelfde tabel. Gebruik altijd `saveSponsorEventData(tags, sponsorCategories)` — deze functie verwijdert alle bestaande rijen en herbouwt de tabel in één operatie. Nooit tags en categorieën apart opslaan.

### Mount — parallel laden

In `App.jsx` laadt een `useEffect` op mount alle 14 databronnen parallel via `Promise.all`. Pas daarna wordt `dbLoading` op `false` gezet.

### Env vars (niet gecommit)

```
VITE_SUPABASE_URL=https://holypriabntrbxpnsjfe.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable anon key>
```

Instellen via `.env.local` (lokaal) en Vercel environment variables (productie).

---

## Kernconcepten

### Sponsors & Slots

- `slots`: `string[]` — platte array van sponsornamen (lengte = cols × rows)
- `BLANK` = leeg slot (speciale ingebouwde sponsor)
- Sponsors worden toegewezen via klikken of drag-and-drop

### Events & Koepels

- **Events**: codes zoals AGR, BCC, CXWC, ROAD, TSP
- **Koepels**: groeperingen van events (bv. "Grote Rondes")
- Een sponsor kan getagd worden op event-niveau (directe tag) of koepel-niveau (via `sponsorGroups`)
- Elke event kan maar aan 1 koepel worden toegewezen

### Categorieën

- Eén gedeelde `categoryList` voor zowel event- als koepel-niveau
- Volgorde bepaalt de prioriteit bij het groeperen van logo's
- Categorieën zijn zichtbaar als headers boven de logo's wanneer een event-filter actief is

### Filterlogica (`buildGroups`)

Wanneer een eventfilter actief is, groepeert `buildGroups()` sponsors per categorie:
1. Koepelpartners (via `sponsorGroups` + `eventGroups`) komen eerst
2. Dan directe event-partners (via `tags`)
3. `categoryList` bepaalt de volgorde van categoriegroepen
4. Sponsors zonder categorie komen onderaan als "Zonder categorie"

### Auto-advance richting

Na het toewijzen van een logo aan een slot springt de selectie automatisch naar het volgende slot. De richting is instelbaar via een 3×3 pijltjeskiezer in het logo-paneel:
- `r` (rechts, standaard), `l`, `d`, `u`, `dr`, `dl`, `ur`, `ul`, `none`

---

## Componentoverzicht

### `App.jsx`
- Beheert alle hoofd-state: `slots`, `selectedFormat`, `editedFormat`, `selectedSlots`, `view`, `savedDesigns`, `advanceDir`
- `handleAssignFromLibrary`: wijst sponsor toe + berekent volgend slot op basis van `advanceDir` en grid-dimensies
- `handleFormatChange`: herberekent slots bij wijziging kolommen/rijen (behoudt bestaande waarden)
- `handleDuplicateDesign`: kopieert een ontwerp met "(kopie)" suffix
- `handleSaveDesign({ event, edition, name })`: slaat huidig ontwerp op via SaveModal
- **Icon bar**: 4 panels — `'designs'`, `'formats'`, `'adjust'`, `'frequency'`; `'adjust'` uitgeschakeld wanneer geen formaat geladen
- **`SaveModal`**: ingebouwde component — dialoog met Event (dropdown vanuit `events`), Editie (jaar, default huidig jaar), Naam
- **`SavedDesignsPanel`**: ingebouwde component — gegroepeerd op event → editie, zoekveld, dupliceer/hernoem/verwijder per rij; "Huidig ontwerp opslaan" knop bovenaan (enkel als formaat geladen)

### `LogoLibrary.jsx`
- Rechterpaneel: zoekbalk (met × wis-knop), event-filter dropdown, richtingskiezer
- `ManageList`: herbruikbare component voor CRUD + drag-and-drop herordening van lijsten
  - Props: `title`, `color`, `items`, `onRename`, `onDelete`, `onAdd`, `onReorder`, `defaultCollapsed`
  - Kleuren: `orange`, `purple`, `indigo`, `teal`
  - Drag-handle: 6-dots grip SVG, drop-target highlight
  - Collapse/expand per sectie via interne state
- Beheerpaneel (tandwiel): toont Koepels / Events / Categorieën als inklappende secties
  - Koepels: standaard ingeklapt
  - Events: standaard uitgeklapt
  - Categorieën: standaard ingeklapt
- Events-sectie heeft koepelfilter-chips + per-event koepeldropdown (alleen in edit-mode)
- `buildGroups()`: groepeert gefilterde sponsors per categorie
- Wanneer beheerpaneel open is, verbergt het logo-grid (mutueel exclusief)

### `SponsorEditModal.jsx`
- Popup voor per-sponsor instellingen
- Toont event-checkboxes + categorie-dropdown per event
- Scroll-safe: `maxHeight: calc(100vh - 48px)`
- Ontvangt `groupCategories` (= `categoryList`)

### `GridTypeSelector.jsx`
- Enkelvoudige lijst van alle formaten (geladen vanuit Supabase via `customFormats` prop)
- Gebruikers kunnen **alleen kiezen** — geen bewerken, aanmaken of verwijderen
- Zoekveld + **tag-filter** (dropdown met ≡-icoon) — tags worden beheerd via admin
- Geselecteerde rij toont tags als subtitel
- Fallback: toont statische `backdropFormats.json` zolang Supabase nog geen formaten bevat
- Props: `selected`, `onSelect`, `formats` (unified array)

### `GridToolbar.jsx`
- Twee layouts: `horizontal` (boven het grid) en `vertical` (in het "Aanpassen" paneel)
- Vertical: VSection-blokken (inklapbaar) voor Canvas, Grid, Gutter, Marges, Header, Divider, Stijl
- **Grid en Gutter zijn samengevoegd** in één VSection — gescheiden door een subtiele lijn
- `withFittedAndCentered`: herberekent celgroottes en centrering na elke wijziging

---

## Ontwerpbeslissingen

- **Supabase als backend**: alle data in PostgreSQL + Storage; `localStorage` enkel nog voor `advanceDir`
- **Geen TypeScript**: bewuste keuze voor snelheid en leesbaarheid
- **Één `categoryList`**: vroeger waren er twee aparte lijsten (per-event en per-koepel) — samengevoegd tot één
- **ManageList defaultCollapsed**: nieuw toegevoegde prop zodat elk blok een eigen standaardtoestand heeft
- **`editingKoepelEvent` state**: koepeldropdown per event is alleen zichtbaar na klikken op een icoon (edit-mode), nooit inline
- **`advanceDir` in localStorage**: de gekozen richting blijft bewaard tussen sessies

---

## Batch Export Script (Illustrator → Supabase Storage)

**Locatie:** `dev/batch_export_logos_v1_DEV.jsx`
**Runnen:** Illustrator → File > Scripts > Other Script...

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

### Logo-update workflow
```
Logo aanpassen in Illustrator
        ↓
Batch export script runnen (1 klik)
        ↓
PNG's lokaal opgeslagen
        ↓
upload-logos.js uploadt naar Supabase Storage
        ↓
App laadt logo's via Supabase Storage URL
```

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

### upload-logos.js
Node.js ES module (`dev/backdrop-designer/scripts/upload-logos.js`). Neemt de exportmap als argument, leest alle PNG/SVG-bestanden en uploadt ze naar de `logos` bucket in Supabase Storage met `upsert: true`. Vereist `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` als omgevingsvariabelen (of in `.env` in de `dev/` map).

### logoUrl.js
Centrale URL-resolver voor alle logo-bronnen:
```js
logoUrl(filename, customSrc)
// → customSrc als aanwezig
// → Supabase Storage URL: VITE_SUPABASE_URL + '/storage/v1/object/public/logos/' + filename + '.png'
// → null als filename leeg of 'BLANK'
```
Gebruikt in: `PreviewCanvas.jsx`, `LogoLibrary.jsx`, `SponsorEditModal.jsx`, `exportJpeg.js`.

### SVG vs PNG
- Huidig formaat: **PNG**
- SVG is ondersteund in het script (aanbevolen voor toekomstige overstap)
- Overstap = enkel andere radiobutton aanvinken in het dialoogvenster

---

## Recente wijzigingen (sessie april 2026 — formaatbeheer naar admin)

### Formaatbeheer volledig naar admin verplaatst

- **Admin: nieuwe sectie "Formaten"** (`FormatenSection.jsx` + `FormatEditModal.jsx`)
  - Lijst van alle formaten met drag-to-reorder, zoekbalk, aanmaken/bewerken/verwijderen
  - Eenmalige importknop: laadt alle 32 formaten uit `backdropFormats.json` in Supabase
  - Tags per formaat: vrij te typen labels (chip-weergave), filterbaar in de main app
  - Volledig formulier met alle velden in inklapbare secties: Naam & Tags / Canvas / Grid / Cel / Gutter / Marges / Header / Divider / Illustrator / Notities
- **Main app vereenvoudigd**:
  - `GridTypeSelector` toont alleen een lijst — geen potlood-icoon, geen "+ Nieuw formaat" knop
  - Filter werkt nu op `tags` (beheerd via admin) i.p.v. `Categorie`/`EventStyle`
  - `FormatPickerModal` volledig verwijderd uit main app
  - `handleSaveCustomFormat`, `handleDeleteCustomFormat`, `handleImportAllFormats`, `handleCustomFormat` verwijderd uit `App.jsx`
- **Supabase**: `sort_order integer` kolom toegevoegd aan `format_presets`
- **db.js**: nieuwe functies `loadFormats()`, `upsertFormat()`, `deleteFormat()`, `bulkImportFormats()`, `reorderFormats()`

### Vercel deployment gefixed

- **Probleem**: Vercel deployde de repo root als lege statische site (`build . [0ms]`) → 404
- **Oorzaak**: geen `vercel.json` aan de repo root; de config in `dev/backdrop-designer/` werd genegeerd
- **Oplossing**: `vercel.json` toegevoegd aan de **repo root** met:
  ```json
  {
    "installCommand": "cd dev/backdrop-designer && npm install",
    "buildCommand": "cd dev/backdrop-designer && npm run build",
    "outputDirectory": "dev/backdrop-designer/dist",
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- `routes` vervangen door `rewrites` — voorkomt conflict met Vite framework routing

### Projectopkuis

- `dev/upload-logos.js` verplaatst naar `dev/backdrop-designer/scripts/upload-logos.js`
- Pad bijgewerkt in `batch_export_logos_v1_DEV.jsx`
- Lege mappen (`stable/`, `archives/`, `experiments/`, `templates/`) verwijderd (stonden niet in git)

---

## Recente wijzigingen (sessie april 2026 — custom sponsors & UX polish)

### Custom sponsors — in-app logo upload
- **Nieuw `customSponsors` state**: `[{ id, partner, dataUrl }]` — opgeslagen in `backdropDesigner_customSponsors` localStorage
- **`handleAddCustomSponsor({ partner, dataUrl, eventSelections, groupSelections })`**: voegt custom sponsor toe + kent meteen events/koepels + categorieën toe
- **`handleDeleteCustomSponsor(partner)`**: verwijdert custom sponsor uit lijst
- **Auto-fill naam**: sponsornaam wordt automatisch ingevuld vanuit de PNG-bestandsnaam bij upload (spaties en underscores genormaliseerd); naam blijft aanpasbaar
- **`AddSponsorModal`** in `LogoLibrary.jsx`:
  - Bestandskiezer + naam-inputveld
  - **`CheckSection`** component: inline inklapbare lijst met checkbox per event/koepel + categorie-select per item
  - Twee secties: "Koepels" en "Events" — elk apart inklapbaar
  - Geen absolute-positioned dropdowns (voorkomt overflow-clipping in modal)
- **`mergedCustomLogos` useMemo**: combineert `customLogos` (overrides) + `customSponsors[].dataUrl` — doorgegeven aan `SponsorEditModal` zodat preview ook voor custom sponsors werkt
- **`allSponsors` useMemo**: fusie van statische sponsors (`STATIC_SPONSORS`) + custom sponsors

### Delete-mode voor custom sponsors
- **Geen per-kaart delete-knop** meer (conflicteerde met tag-icoon op zelfde positie)
- **Prullenbak-toggle** naast "+" in LogoLibrary header (enkel zichtbaar als custom sponsors bestaan)
- In delete-mode: kaarten tonen een selectiecirkel; klikken selecteert/deselecteert
- **Rode bevestigingsbalk** onderaan met aantal geselecteerde + "Verwijder" knop
- `deleteMode` + `toDelete` states in `LogoLibrary.jsx`

### Tag-icoon voor custom sponsors
- Eerder was tag-icoon alleen zichtbaar voor niet-custom sponsors
- Nu tonen **alle sponsors** (inclusief custom) het tag-icoon om events/koepels te bewerken
- Tag-icoon touch target vergroot: `p-1` padding + `absolute top-0.5 right-0.5`

### UX-verbeteringen (UI review)
- **Draft banner**: van brede amber-balk naar dunne witte strip — minder visueel lawaai
- **Header naam**: toont naam van geladen ontwerp i.p.v. altijd de format-code
- **Wissen-knop**: gedempte rode tekstkleur (`text-gray-300 hover:text-red-400`) — minder prominent
- **Richting-picker**: iconen verkleind (`w-4 h-4`), label "RICHTING" verwijderd
- **Overig-groep hint**: klein label "zonder event" naast koepelgroepen zonder event-koppeling

### Toolbar boven het werkveld
- **Twee matchende segmenten**: `bg-white border border-gray-200 rounded-xl p-1 flex gap-1`
  - Links: Grid / Preview view-toggle
  - Rechts: Bijwerken (conditioneel, blauw filled) + Wissen (grijs, rood on hover)
- Alle knoppen: `px-3 py-1.5 rounded-lg text-xs font-medium` — zelfde grootte en padding
- Bijwerken en Wissen zijn **niet meer in de header** — header toont enkel naam/info + ExportMenu
- Wissen heeft een prullenbak-icoon voor visuele consistentie met de andere knoppen

### Lege staat (canvas zonder formaat)
- **Visuele illustratie**: 2×2 grid-icoon in grijs blok (`w-20 h-20 bg-gray-100 rounded-2xl`)
- **Contextuele CTA**: als formats-panel al open is → instructietekst "← Selecteer een formaat uit de lijst"; anders → klikbare knop "Formaten bekijken →"
- Voorkomt dat een CTA-knop "niets doet" wanneer het bijbehorende panel al actief is

### Ontwerpbeslissingen (patroon)
- **`CheckSection`**: gebruik inline inklapbare secties (geen absolute dropdowns) in modals met `overflow-hidden` of beperkte hoogte
- **Delete-mode patroon**: bij conflicterende icoon-posities → gebruik een toggle-mode in plaats van per-item acties
- **`mergedCustomLogos`**: wanneer twee bronnen hetzelfde doel dienen (`customLogos` + `customSponsors[].dataUrl`), combineer ze via `useMemo` vóór doorgeven aan child-components

---

## Recente wijzigingen (sessie april 2026 — UX herstructurering)

### Opgeslagen ontwerpen — Event + Editie model
- **Nieuw datamodel**: elk ontwerp heeft nu `event` (string, uit events-lijst) en `edition` (jaar als number); bestaande ontwerpen zonder deze velden verschijnen onder "Overig"
- **`SaveModal`**: apart opslaan-dialoog (niet meer inline in de header) met Event dropdown, Editie-jaar, Naam; Event dropdown gevuld vanuit dezelfde `events`-lijst als sponsortags
- **`SavedDesignsPanel`** volledig herschreven:
  - Geen inklapbare kaart-wrapper meer — inhoud direct zichtbaar
  - Gegroepeerd: Event → Editie (jaar, aflopend) → ontwerpen (op datum)
  - Events gesorteerd op positie in `events`-array; ontwerpen zonder event onder "Overig"
  - Zoekveld filtert op naam, event én editie
  - "Huidig ontwerp opslaan" knop bovenaan (enkel zichtbaar als formaat geladen)
  - Dupliceer-actie per ontwerp (kopie-icoon op hover)
- **"Bijwerken" knop** blijft in de header voor snelle updates van het actieve ontwerp
- **Mappenstructuur** verwijderd uit de UI (data blijft in localStorage voor backwards compat)

### Formats panel — vereenvoudigd
- **`formatsView` state verwijderd** — geen browse/detail navigatie meer
- Klikken op een formaat selecteert het in-place (blauwe highlight + subtitel)
- Geen "← Terug" knop meer
- **GridToolbar verplaatst** naar een nieuw "Aanpassen" panel (4e icoon)

### Nieuw "Aanpassen" panel
- 4e icoon in de icon bar: schuifregelaars-symbool
- Uitgeschakeld (grijs, `disabled`) zolang geen formaat geladen
- Bevat `GridToolbar` (vertical) + Info-blok (Categorie, EventStyle, Variant, Canvas)
- Duidelijke scheiding: Formaten = kiezen, Aanpassen = finetunen

### GridToolbar — Grid en Gutter samengevoegd
- Grid (kolommen, rijen, celbreedte) en Gutter (H/V) staan nu in één VSection "Grid"
- Subtiele `h-px` scheidingslijn tussen rij 3 (celbreedte) en gutter-rij
- Labels aangepast: "Gutter H" en "Gutter V"

### Scrollfix panelen
- Content div gewijzigd van `overflow-hidden` naar `overflow-y-auto` + `min-h-0`
- GridTypeSelector root gewijzigd van `h-full` naar `flex-1 min-h-0` — correcte flex-hoogteketting

---

## Recente wijzigingen (sessie april 2026 — formaatbeheer, vervangen)

> ⚠️ Deze sectie is achterhaald. Formaatbeheer is volledig verplaatst naar de admin (zie sectie hierboven). `FormatPickerModal` en de bijbehorende edit-UI in de main app bestaan niet meer.

### Formaatbeheer — statische JSON vervangen door bewerkbare presets ~~(vervangen door admin)~~
- ~~Potlood-icoon, FormatPickerModal, staticImported flag~~ → verwijderd
- `backdropFormats.json` blijft als fallback als Supabase nog geen formaten bevat

### GridTypeSelector — volledige hoogte
- Kaart-wrapper (`rounded-xl border`) verwijderd — component vult de volledige panelhoogte
- Formaatlijst is nu `flex-1 overflow-y-auto` (groeit mee) ipv vaste `max-h-64`
- "Nieuw formaat aanmaken" blijft onderaan geplakt via `flex-shrink-0`
- Importknop volledig verwijderd

### Code-veld verwijderd uit UI
- Code niet meer zichtbaar in FormatPickerModal of GridTypeSelector
- **Naam** (`Beschrijving`) is de enige gebruikersidentificatie; Code wordt automatisch gegenereerd uit de naam bij opslaan (slugify)
- Duplicate check op Code verwijderd; `canConfirm` gebaseerd op `Beschrijving.trim()`
- Preview strip en kaarttitel tonen `Beschrijving || Code`

### Bugfixes
- **SponsorEditModal callbacks**: signature mismatch opgelost — `onTagsChange(next)`, `onCategoryChange(ev, cat)`, `onSponsorGroupsChange(current)` zonder redundante `sponsorName` prefix (LogoLibrary bindt die al via wrappers)
- **Custom formats niet zichtbaar in "Alle"**: `[...staticFormats, ...customFormats]` ipv enkel statische lijst
- **Events gegroepeerd op koepel** in SettingsModal (Events & Koepels tab): sectiekoppen per koepel, alfabetisch gesorteerd binnen elke groep; events zonder koepel onderaan

---

## Recente wijzigingen (sessie april 2026)

### FormatPickerModal — Nieuw formaat aanmaken (popup)
- **Nieuw component** `FormatPickerModal.jsx` — InDesign-stijl modal met twee niveaus:
  - **Level 1 (browse)**: categorietabs als pills + preset-kaartgrid met visuele thumbnails (`FormatThumbnail`) + `BlankCard` als eerste kaart
  - **Level 2 (detail)**: formulier met ← Terug, live preview strip, Identificatie / Canvas / Grid / Cel / Gutter / Marges
- **Preset bijwerken**: knop alleen zichtbaar voor `_custom: true` formats; geeft ✓-feedback na opslaan
- **Code readonly** voor statische presets (niet-custom); rood + foutmelding bij duplicate code
- **Duplicate code check**: `isDuplicateCode` via `useMemo` — vergelijkt met statische én custom codes, exclusief de huidige editeer-ID
- **BlankCard**: gestippeld kaartje met `+` icoon als eerste item in het grid; vervangt de ambigue "Leeg beginnen →" footer-knop
- **Footer**: "Annuleren" + "Aanmaken" rechts; "Preset bijwerken" + ✓ links (alleen voor custom)
- Link-knoppen voor Canvas (breedte↔hoogte) en Gutter (X↔Y)
- `saveAsPreset` checkbox voor nieuwe lege formaten

### GridTypeSelector — Formaatpanel sidebar
- **Zoekveld** bovenaan met ×-wis-knop — filtert op code én beschrijving
- **Filter-button** met ≡-icoontje, actieve categorienaam als label en chevron — identiek aan sponsorblok
  - Kleurt blauw bij actief filter
  - Floating dropdown sluit bij buitenklik (`useRef` + `useEffect`)
  - "Opgeslagen" krijgt amber-styling in dropdown
- **Twee-regelige layout** per format-rij: code + kolom/rij-telling op rij 1 (code truncate + `min-w-0`), beschrijving op rij 2
- `title` tooltip op elke rij met volledige code

### App.jsx — Twee-niveau navigatie in formats-panel
- `formatsView` state: `'browse' | 'detail'`
  - `'browse'`: toont `GridTypeSelector` (lijst + filter)
  - `'detail'`: toont `GridToolbar` + info-blok
- `handleSelectFormat` zet `formatsView` naar `'detail'`
- "← Terug" knop in panel-header terug naar `'browse'`
- Reset naar `'browse'` bij sluiten panel (× knop) én bij wisselen van panel (icon bar)

### Custom formats
- Persistentie via `backdropDesigner_customFormats` localStorage (`loadCustomFormats` / `saveCustomFormats`)
- `handleSaveCustomFormat(format, editingId)`: upsert met `_custom: true, id`
- `handleDeleteCustomFormat(format)`: filtert op `id` of `Code`
- Custom formats zichtbaar als "Opgeslagen" tab in zowel GridTypeSelector als FormatPickerModal

---

## Recente wijzigingen (sessie maart 2026)

- **Gutterlink in SettingsModal**: chain-knop per preset om GutterX/Y gesynchroniseerd te houden
- **Mappenstructuur voor opgeslagen ontwerpen**: mappen en submappen (path-based model), drag/rename/delete
- **Margelinks in toolbar**: Links↔Rechts en Boven↔Onder gelinkt via chain-knoppen
- **Absolute marges**: MarginLeft/Right/Top/Bottom zijn vaste waarden; cellen krimpen als er te weinig ruimte is (gutters blijven gelijk), maar marges worden nooit auto-aangepast
- **Centrering**: grid wordt visueel gecentreerd binnen de beschikbare ruimte (optische marge groeit bij minder kolommen, maar toolbar-waarden blijven ongewijzigd)
- **TargetCellW_mm**: cellen onthouden hun beoogde breedte; bij minder kolommen springen ze terug naar originele preset-grootte
- **Preset apply**: bij toepassen van een preset worden kolommen/rijen herberekend naar het maximum dat past binnen de marges
- **Icon bar navigatie**: links icon bar (VS Code/Figma stijl, `bg-gray-900`) met Ontwerpen / Formaten / Frequentie panels; standaard `'formats'`
- **Formats panel**: GridToolbar verticaal bovenaan, gevolgd door GridTypeSelector en Info-blok
- **GridToolbar vertical layout**: `layout="vertical"` prop geeft ingeklapbare kaartblokken (VSection) voor Canvas, Grid, Gutter, Marges, Header, Divider, Stijl
- **Canvas afmetingen live aanpasbaar**: CanvasWidth_mm / CanvasHeight_mm rechtstreeks in het formaten-paneel, met link-knop voor proportionele schaling en preset dropdown
- **Canvas presets**: opgeslagen in `backdropDesigner_canvasPresets` localStorage; beheerbaar via Instellingen → tab "Canvas"
- **SettingsModal: tab Canvas**: apart tabblad voor canvas presets (losgekoppeld van Celdimensies)
- **Preview centering fix**: canvas hercentreert bij formaatwissel, canvas preset wissel én canvas maatwijziging; `needsCenter` ref-patroon wacht op bijgewerkte `baseScale` voor correcte scroll bij groot→klein overgangen
- **Bijwerken knop**: overschrijft bestaand opgeslagen ontwerp zonder kopie
- **ExportMenu dropdown**: JPEG, CSV, JSON export + JSON laden gecombineerd in één knop
- **Bulk replace in FrequencyPanel**: vervang alle slots van sponsor A door sponsor B via inline zoekpaneel
- **JSON export/import**: `{ version: 1, format, slots, exportedAt }` structuur
- **`parseBarPosition` gededupliceerd**: verplaatst naar `utils/barPosition.js`, geïmporteerd in PreviewCanvas en exportJpeg
- **`buildGroups` gememoized**: `useMemo` in LogoLibrary.jsx
- **Lazy loading logo's**: `loading="lazy"` op SponsorCard img-tags
- **Cmd/Ctrl pan**: panning in preview vereist ingedrukte Cmd (Mac) of Ctrl (Win); cursor toont grab/grabbing indicator

---

## Recente wijzigingen (sessie april 2026 — silhouetten, rulers, toolbar)

### Silhouet-overlays op PreviewCanvas

- **Professionele SVG-silhouetten**: `SILHOUETTE_PERSON.svg` en `SILHOUETTE_CHAIR.svg` (geëxporteerd vanuit Adobe Illustrator) zijn rechtstreeks als JSX-path-elementen geïntegreerd in `PreviewCanvas.jsx` als `<PersonSilhouette>` en `<ChairSilhouette>` subcomponenten.
- **Overlay op canvas**: silhouetten worden over de backdrop heen gerenderd (niet ernaast), floor-aligned: `top = 400 + scaledH - SILHOUETTE_H_MM * scale`.
- **Horizontaal versleepbaar**: muisknop op silhouet start een drag-sessie (window-level `mousemove`/`mouseup`). Positie opgeslagen als `personX_mm` / `chairX_mm` in mm.
- **Mutex**: slechts één silhouet tegelijk actief via `activeOverlay: null | 'person' | 'chair'`. Toggle-logica: `v === type ? null : type`.
- **Reset bij formaatwissel**: posities worden herberekend naar horizontaal midden bij elke `Code`-wijziging.
- **Stijl**: gouden vulling `rgba(255,215,100,0.6)`, `feDropShadow` glow-filter per silhouet.
- **Constanten** (bovenaan `PreviewCanvas.jsx`):
  ```js
  const PERSON_H_MM = 1800, PERSON_W_MM = 583
  const PERSON_VB_W = 1653.519, PERSON_VB_H = 5102.362
  const CHAIR_H_MM = 1327, CHAIR_W_MM = 691
  const CHAIR_VB_W = 1959.463, CHAIR_VB_H = 3761.352
  ```
- **`activeOverlay` state gelift naar App.jsx**: PreviewCanvas ontvangt `activeOverlay` en `onOverlayChange` als props; beheert de state niet meer zelf.
- **Toggle-knoppen**: aparte knoppengroep in de App.jsx-werkbalk (naast Liniaal), iconen alleen — ✕ / persoon / stoel. ✕ is grijs in off-state, persoon/stoel blauw wanneer actief. Knoppen zijn alleen zichtbaar bij `view === 'preview'`.

### Logo drag — eerste klik fix

- **Probleem**: logo's in `LogoLibrary` vereisten twee muisklikken voordat slepen werkte.
- **Oorzaak**: `SponsorCard` was gedefinieerd binnenin een IIFE in de JSX-render. Bij elke state-wijziging (o.a. `setDragging`) maakte React een nieuwe functiereferentie aan → onmount + remount van alle kaart-DOM-nodes → HTML5 drag onmiddellijk afgebroken.
- **Oplossing**: `dragging` state volledig verwijderd uit `LogoLibrary`. `setDragging` werd enkel gebruikt voor visuele feedback op de gesleepte kaart; de `cursor-grab / active:cursor-grabbing` CSS-klassen zijn voldoende. Hierdoor veroorzaakt `handleDragStart` geen re-render meer en blijft het DOM-element intact gedurende de drag.

### Horizontale en verticale rulers

- **Rendering**: SVG-gebaseerde rulers langs de boven- en linkerkant van het werkblad, alleen zichtbaar wanneer `showRuler === true`.
- **Sync met scroll**: `rulerScroll` state (`{ left, top }`) wordt bijgewerkt via `onScroll` op de container én expliciet in de centering `useEffect` en `fitScreen` (anders tonen rulers foute waarden bij programmatisch centreren).
- **Adaptieve tick-spacing**: `getTickSpacing(scale)` kiest de kleinste "nette" stapgrootte (1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000 mm) waarbij major ticks ≥ 55px uit elkaar liggen. Minor ticks = majorMM / 5.
- **Tick-formule**: `svgX = mm * scale + canvasOff - scrollLeft` (canvasOff = 400 px padding).
- **Constante**: `const RULER_SIZE = 20` (px breedte/hoogte van rulers).
- **Corner square**: klein grijs vierkant (20×20 px) in de linkerbovenhoek waar H- en V-ruler samenkomen.

### Toolbar-wijzigingen (App.jsx)

- **"Liniaal" toggle**: nieuw knopje naast de Grid/Preview toggle, alleen zichtbaar bij `view === 'preview'`. Staat standaard **uit** (`showRuler` default = `false`).
- **Default view**: gewijzigd van `'grid'` naar `'preview'`.
- **Links uitlijnen**: toolbar-rij van `justify-between` naar `flex items-center gap-2 w-full`; "Wissen"-knop blijft rechts via `ml-auto` op de actions-groep.
- **`showRuler` prop**: doorgegeven vanuit `App.jsx` aan `<PreviewCanvas showRuler={showRuler} />`.

---

## Recente wijzigingen (sessie april 2026 — Supabase migratie)

### Database migratie: localStorage → Supabase

- **`src/utils/supabase.js`** (nieuw): Supabase client — `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`
- **`src/utils/db.js`** (nieuw): alle async functies die `sponsorTags.js` vervangen — `loadDesigns`, `saveDesign`, `updateDesign`, `deleteDesign`, `loadEvents`, `saveEvents`, `loadEventGroups`, `saveEventGroups`, `loadTags`, `loadSponsorCategories`, `saveSponsorEventData` (gecombineerd!), `loadSponsorGroups`, `saveSponsorGroups`, `loadCustomSponsors`, `addCustomSponsor`, `deleteCustomSponsor`, `loadCustomLogos`, `saveCustomLogos`, `loadCellPresets`, `saveCellPresets`, `loadCanvasPresets`, `saveCanvasPresets`, `loadCustomFormats`, `saveCustomFormats`, `loadDesignFolders`, `saveDesignFolders`, `loadSetting`, `saveSetting`
- **`App.jsx`**: state-initialisatie van `useState(() => loadXxx())` naar lege defaults + `useEffect` met `Promise.all` op mount; alle save-handlers async fire-and-forget
- **`dbLoading` state**: `true` tijdens initieel laden, `false` erna

### Logo storage: lokale bestanden → Supabase Storage

- **Supabase Storage bucket `logos`**: public, RLS policies voor SELECT/INSERT/UPDATE
- **URL-patroon**: `https://holypriabntrbxpnsjfe.supabase.co/storage/v1/object/public/logos/<FILENAME>.png`
- **`src/utils/logoUrl.js`** (nieuw): centrale URL-resolver — `logoUrl(filename, customSrc)`
- **Migratie van componenten**: `PreviewCanvas.jsx`, `LogoLibrary.jsx`, `SponsorEditModal.jsx`, `exportJpeg.js` — allemaal bijgewerkt van `/logos/${filename}.png` naar `logoUrl(filename)`
- **Initiële upload**: `scripts/upload-logos-init.js` heeft alle 193 logo's eenmalig geüpload

### Illustrator → Supabase upload-pipeline

- **`dev/upload-logos.js`** (nieuw): Node.js ES module — neemt exportmap als argument, uploadt alle PNG/SVG naar Supabase Storage (`upsert: true`)
- **`batch_export_logos_v1_DEV.jsx`**: schrijft na export `/tmp/bd_upload.command` en probeert het te starten via `File.execute()`
- **Beperking**: auto-upload werkt enkel bij directe scriptrun (File > Scripts). Via CEP-extensies (LoaderScriptPanel) werkt `File.execute()` niet op niet-executeerbare bestanden. Eenmalige fix: `chmod +x /tmp/bd_upload.command` in Terminal

### Vercel deployment

- Env vars ingesteld via Vercel CLI / dashboard: `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY`
- Auto-deploy bij push naar `main` via GitHub-integratie

---

## Openstaande verbeterpunten

| Punt | Beschrijving |
|------|-------------|
| **Auto-upload vanuit CEP** | `File.execute()` werkt niet voor `.command` bestanden vanuit CEP-extensies (bv. LoaderScriptPanel). Handmatig commando als fallback. Te bekijken: alternatieve aanpak. |
| **CSV-export escaping** | Sponsornamen met komma's of aanhalingstekens breken het CSV-formaat. |
| **FormatPickerModal UI** | "Annuleren" krijgt focus-ring bij klikken (lichte blauwe gloed). |
| **Multi-user / login** | Alle tabellen hebben al `user_id uuid` (nullable). RLS + authenticatie toe te voegen wanneer nodig. |

---

## Conventies

- Sponsornamen altijd in UPPERCASE
- Bestandsnamen: spaties → underscores (`A WARE` → `A_WARE`)
- Lege slots exporteren als `BLANK`
- Grid-indexering: kolommen C1–Cn, rijen R1–Rn
- Componenten: PascalCase, utils: camelCase, bestanden: kebab-case

---

## Eigenaar / Context

- **Jan Wouters** — freelance grafisch ontwerper, Flanders Classics
- Eindgebruikers: collega's van Flanders Classics (niet-technisch)
- Downstream: Gridzilla Illustrator-script (JSX/ExtendScript) dat de CSV omzet naar een Illustrator-backdrop

---

## Toekomstvisie — Hosting, login & Gridzilla-integratie

### Fase 1 — Online hosting ✅ GEDAAN
- App gehost via **Vercel** (automatische deploy bij git push naar `main`)
- Logo's via **Supabase Storage** (public bucket `logos`) — niet meer in de repo

### Fase 2 — Database & gedeelde data ✅ GEDAAN (single-user)
- Alle data via **Supabase PostgreSQL** (`db.js`)
- Logo's via **Supabase Storage** (`logoUrl.js`)
- Ontwerpen, events, tags, categorieën, presets — alles in de cloud
- Multi-user / login: structuur aanwezig (`user_id` kolom), authenticatie nog niet geïmplementeerd

### Fase 3 — Gridzilla rechtstreeks gekoppeld aan de app (lange termijn)

**Huidige situatie:**
```
BackdropDesigner (browser)  →  CSV  →  Gridzilla (ExtendScript in Illustrator)
```

**Tussenstap (Optie A — na fase 1):**
CSV vervangen door een rijkere JSON-export. Gridzilla leest het JSON-bestand in via `File.openDialog()`. Geen CSV-beperkingen meer, alle info beschikbaar (marges, kleuren, header-type, presets...).

**Einddoel (Optie C — na fase 2):**
Gridzilla omzetten van ExtendScript naar een **UXP-plugin** (Unified Extensibility Platform — Adobe's moderne vervanging voor ExtendScript).

```
Illustrator UXP-plugin  →  fetch()  →  Supabase  →  bouwt grid rechtstreeks
```

Voordelen UXP:
- Rechtstreekse verbinding met de app/database via `fetch()`
- Moderne JavaScript (geen ES3-beperkingen meer)
- Dezelfde React-kennis als BackdropDesigner
- Adobe's officiële toekomstrichting (ExtendScript wordt afgebouwd)
- Geen bestanden, geen CSV, geen manuele exportstap

**Migratieplan:**
| Nu | Na fase 1 | Na fase 2 |
|---|---|---|
| CSV-export | JSON-export | UXP-plugin met live Supabase-verbinding |
| ExtendScript | ExtendScript | Moderne JS/React in Illustrator |
| Manueel bestand laden | Manueel bestand laden | Volledig automatisch |

De UXP-omzetting is eenmalig werk, maar daarna is BackdropDesigner volledig geïntegreerd met Illustrator — geen tussenbestanden meer.
