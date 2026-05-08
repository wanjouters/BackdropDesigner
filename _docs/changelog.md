# Changelog

Nieuwste sessies bovenaan. Bestaande entries **niet** wijzigen — alleen toevoegen.

---

## Sessie mei 2026 — FormatEditModal herstructurering: scrollpaneel + schaal + bleed

### Layout: van accordions naar één scrollbaar rechterpaneel
- Alle inklapbare `Section`-accordions vervangen door een vaste scrollbare rechterkolom
- `SectionHeading` component toegevoegd: `label + horizontale lijn` — standaard sectie-scheidingspatroon
- Modal krijgt een vaste hoogte via `style={{ height: 'min(720px, calc(100vh - 48px))' }}` — springt niet meer bij wisselen van inhoud
- Typografie-hiërarchie gecorrigeerd: labels `text-[11px] font-medium`, sectiekoppen `text-[11px] font-semibold tracking-widest`
- Linkerpaneel versmald van `w-72` naar `w-64`

### Linkerpaneel: Code-veld verplaatst
- Code-veld staat nu direct onder Naam (met `(auto)` indicator + inline Reset-knop)
- Achtergrond verplaatst naar de rechterscrollkolom als eigen sectie

### Schaal: 3 vaste knoppen
- `NumField` voor schaal vervangen door 3 segmented knoppen: `[1:1] [1:2] [1:10]`
- Canvas > 5000 mm: 1:1 en 1:2 worden automatisch uitgeschakeld (grijs); amber melding verschijnt
- Auto-enforcement in `set()`, `applyCanvasPreset()`, en nieuwe `applyScale()` functie

### Bleed: toggle in plaats van nummerveld
- Bleed is altijd 10 mm fysiek; artboard-waarde = `10 × schaal` (10 / 5 / 1 mm)
- On/off toggle; subtekst toont actuele waarde (`1 mm rondom` etc.)
- Nieuwe `toggleBleed(enabled)` functie; `bleedEnabled` state
- Standaard aan; initialisatie leest `format.Bleed_mm > 0`

### FixedCellSize default gecorrigeerd
- Default was `false` (toonde "Raster vast, cellen passen") — nu `true` ("Cellen vast, raster past")

---

## Sessie mei 2026 — Compacte form layout in FormatEditModal

### Verticale compactheid
- Section-header padding: `py-3` → `py-2`, sectie-content bodem: `pb-5` → `pb-3`
- Input/select hoogte: `px-2 py-1.5` → `px-2 py-1` (alle velden in de modal)
- Ruimte tussen veldgroepen: `space-y-3` → `space-y-2`, grid-gaps: `gap-3` → `gap-2`

### Horizontale compactheid — field sizing naar content
- `NumField`: vaste `w-20` (80px) i.p.v. `w-full` — past bij mm-waarden en decimalen
- `SelectField`: `min-w-[120px]` wrapper — leesbaar maar niet groter dan nodig
- `TextField`: `flex-1 min-w-[100px]` wrapper — groeit mee in flex-context
- Alle `grid grid-cols-N` → `flex flex-wrap items-end gap-x-3 gap-y-2` — velden staan naast elkaar, wrappen bij gebrek aan ruimte
- Preset-selects in Canvas en Cel: `max-w-[220px]` — nemen niet de volle breedte
- Modal: `max-w-4xl` → `max-w-3xl`

---

## Sessie april 2026 — Option+sleep sweep-selectie + deselect buiten canvas

### Option/Alt + klik/slepen = sweep-selectie
- `App.jsx`: `handleSweepSlot(index)` — voegt een cel toe aan selectie zonder te wissen; doorgegeven als `onSweepSlot` aan beide canvassen
- `PreviewCanvas.jsx`: op `alt+mousedown` start sweep; `mousemove` hit-test converteert screencoördinaten via scroll offset en schaal naar mm, zoekt cel in `cellPositions`; `sweepStateRef` geeft event handlers (stable `useCallback`) altijd toegang tot de actuele `scale` en `cellPositions`; cursor wordt `crosshair` bij alt ingedrukt
- `Cell.jsx`: `onClick` slaat over bij `e.altKey` — voorkomt conflict met sweep
- `GridCanvas.jsx`: `sweepingRef` + global mouseup listener; `handleSweepStart` en `handleSweepEnter` doorgegeven aan `SlotCell`
- `SlotCell.jsx`: `onMouseDown` met `altKey` = sweep start; `onMouseEnter` = sweep enter; `handleClick` en `handleDoubleClick` skippen bij `altKey`

### Hit-test inset — hoek-clipping voorkomen
- Cel is pas actief wanneer cursor minstens **8px** (preview) / **6px** (grid) van de celrand verwijderd is
- Preview: `const inset = 8 / s` (pixel-naar-mm via schaal) in `hitTestCell`
- Grid: `onMouseEnter` controleert `e.clientX/Y` vs `getBoundingClientRect()` + inset

### Deselect bij klik buiten canvas (preview)
- `onClearSelection` prop op `PreviewCanvas`; `handleContainerClick` op de scroll-container
- `hitTestCell` → als geen cel gevonden → `onClearSelection()`, selectie gewist
- `hadSweepRef` voorkomt dat de click die na mouseup volgt (na een sweep) de selectie wist
- Grijze rand, canvas achtergrond én lege ruimte tussen cellen wissen de selectie

---

## Sessie april 2026 — duplicate-fix, delete alle varianten, normalisatie overal

### Oorzaak duplicate sponsors bij sort-toggle (LogosSection)
- **Root cause**: `handleImport` bewaarde de ruwe filename (bv. `"CIRCUIT ZOLDER"` met spatie) als key in `previews`. De bestaanscheck op `allSponsors` (`s.filename === fn`) vond de genormaliseerde `"CIRCUIT_ZOLDER"` niet → dubbele entry in `allSponsors`. Twee entries met dezelfde `partner`-naam → duplicate React keys → bij elke re-sort (toggle) verscheen er één "extra" in de DOM.
- **Fix**: `filenameNoExt` direct normaliseren na strip extensie: `.replace(/ /g, '_')`

### handleBulkDelete probeert nu alle bestandsvarianten
- Voorheen: alleen `filename + '.png'` — bestanden met spaties of `.svg` werden niet verwijderd
- Nu: per geselecteerde sponsor worden 4 varianten geprobeerd: `filename.png`, `filename.svg`, `spaced.png`, `spaced.svg` (Supabase negeert stilletjes niet-bestaande paden)

### Filename-normalisatie (spaties → underscores + deduplicatie) toegepast overal
- `LogoLibrary.jsx` — `fetchStorageFiles`: `seenKeys` Map deduplicatie
- `SponsorPicker.jsx` — `loadSponsorList`: `seenKeys` Map deduplicatie  
- `useAppData.js` — sponsor list builder: `seenKeys` Map deduplicatie
- `LogosSection.jsx` `load()` was al gefixed in de vorige sessie; nu consistent in alle 4 plaatsen

---

## Sessie april 2026 — sorteerknop admin + bulk koepel bij import

### Sorteerknop (LogosSection)
- `sortMode` state: `'alpha'` (standaard) | `'recent'` (nieuwste upload eerst)
- `storageTimestamps` Map (filename → ms): gevuld bij mount vanuit `storage.updated_at`; pas geüploade bestanden krijgen `Date.now()` → staan meteen bovenaan
- `filtered` omgezet naar `useMemo` met ingebakken sortering — reactief bij toggle
- Toolbar: twee knoppen (A↓Z-icoon / klok-icoon) naast de view-toggle, zelfde stijl

### Bulk koepel toewijzen bij import (ImportModal)
- `ImportModal` krijgt `eventGroups` prop; toont dropdown "Toevoegen aan koepel:" boven de bestandenlijst (enkel zichtbaar als er koepels gedefinieerd zijn)
- Standaard `— geen —`; bij selectie verschijnt hint *"bestaande koppelingen blijven behouden"*
- Merge-logica: **nooit overschrijven** — als sponsor de koepel al heeft, wordt die sponsor overgeslagen (categorie blijft intact); ontbrekende koepel wordt toegevoegd met lege categorie
- Opgeslagen via `saveSponsorGroup` per sponsor; `setSponsorGroups` bijgewerkt zodat de koepel-filter meteen actief is
- Toast toont expliciet hoeveel logos geïmporteerd én hoeveel toegevoegd aan de koepel

---

## Sessie april 2026 — logo import modal + cache-busting + storage-auto-detectie

### Folder-gebaseerde logo-import (admin LogosSection)
- Upload-knop opent een **mapkiezer** (`webkitdirectory`) in plaats van een enkelvoudige file-picker
- Na selectie vergelijkt de app de lokale bestanden met de live Supabase Storage-lijst (verse fetch elke keer):
  - **Nieuw** (groen, auto-aangevinkt): filename niet in storage
  - **Bijgewerkt** (oranje, opt-in): `file.lastModified > storage.updated_at`
  - **Al aanwezig** (grijs, opt-in): bestand ongewijzigd
- `ImportModal`: toont de drie groepen, sectie-selecteer-toggle, bestandsgrootte, bevestigingsknop met teller
- Upload via `supabase.storage.upload(..., { upsert: true })` met voortgangsmelding per bestand

### Cache-busting na import (localPreviews + logoVersion)
- Na succesvolle upload: `URL.createObjectURL(file)` opgeslagen als `localPreviews[filename]`
- `SponsorCard` en `SponsorRow` gebruiken `localPreview` als prioriteit boven de Supabase URL — beeldweergave volledig los van CDN/cache
- `logoVersion` (timestamp) triggert key-remount van alle kaarten + `?v=timestamp` suffix op Supabase URLs — dubbele cache-bypass voor updates
- Aanpak lost zowel CDN-gecachte 404s (nieuwe bestanden) als CDN-gecachte oude versies op

### Auto-detectie van sponsors niet in sponsors.json
- Bij mount én na import: storage wordt uitgelezen; filenames zonder matching entry in `sponsors.json` krijgen automatisch een sponsor-entry (`filename.replace(/_/g, ' ')` als naam, `_fromStorage: true`)
- `LogosSection`: `allSponsors = [...sponsors, ...extraFromStorage]`, gesorteerd op `partner` (NL locale)
- `LogoLibrary`: zelfde via `storageExtras` state — ook in de hoofdapp verschijnen nieuwe logos na tab-focus refresh

### Alfabetische sortering admin
- `allSponsors` in LogosSection wordt nu gesorteerd op `partner.localeCompare('nl')`, zowel bij mount als wanneer nieuwe sponsors via import worden toegevoegd

### Focus-refresh LogoLibrary
- `window.addEventListener('focus', fetchStorageFiles)` in LogoLibrary: herlaadt de storage-lijst wanneer de gebruiker terugkeert naar het hoofdtabblad na een upload in admin

---

## Sessie april 2026 — tegel/lijst-weergave + richting-picker verplaatst

### Tegel/lijst-toggle in LogosSection (admin)
- Nieuw: `SponsorRow`-component — compacte rij met klein logo, naam, koepel/event-badges en hover-editknop
- `viewMode` state (`'tile'` | `'list'`), toggle-knoppen (raster-icoon / lijnen-icoon) in de toolbar
- Beide modi ondersteunen delete-mode (checkbox + rode balk onderaan)

### Tegel/lijst-toggle in LogoLibrary (hoofdapp)
- Zelfde toggle naast de "Logo's" titel (kleinere iconen, `rounded-md`)
- Inline `SponsorRow`-component: compact, draggable, klikbaar (assign), laadt logo lazy
- Bij event-filter (grouped view) werkt de toggle ook per categorie-sectie
- Lijstweergave toont geen hover-animatie (geen Framer Motion) — directe feedback via border/bg

### Auto-advance richtingskiezer verplaatst naar canvas-toolbar
- Verwijderd uit `LogoLibrary` (props `advanceDir`, `onAdvanceDirChange`, `DIR_GRID`, `DIR_ARROWS`)
- Toegevoegd aan de toolbar boven het canvas in `App.jsx` — zichtbaar in **beide** views (grid én preview)
- Geen "Richting" label; compact 3×3 grid (`w-2 h-2` knoppen) passend binnen de standaard toolbar-hoogte
- "Klik of sleep een logo" hint-tekst verwijderd; "X slots geselecteerd" feedback blijft (alleen zichtbaar als er slots geselecteerd zijn)
- `DIR_GRID` en `DIR_ARROWS` constanten verhuisd naar `App.jsx` (module-niveau)

---

## Sessie april 2026 — security hardening + Vercel cron ping

### Supabase RLS
RLS ingeschakeld op alle 11 tabellen die nog geen beveiliging hadden:
`designs`, `custom_sponsors`, `logo_overrides`, `sponsor_event_tags`, `sponsor_group_assignments`, `cell_presets`, `canvas_presets`, `design_folders`, `events`, `format_presets`, `settings`

Patroon: public read (`SELECT USING (true)`) + authenticated write (`ALL USING auth.role() = 'authenticated'`).
Ook `event_groups` overly-permissive write policy vervangen door dezelfde authenticated-only policy.

### Vercel cron job — Supabase wake-up ping
- `api/ping.js`: serverless functie die elke 3 dagen een lichte query doet op de `settings` tabel
- `vercel.json`: cron schedule `0 6 */3 * *` toegevoegd + rewrite gefixed (`/((?!api/).*)`  i.p.v. `/(.*))` zodat `/api/` routes niet omgeleid worden)
- Voorkomt dat het Supabase free-plan project pauzeert na 1 week inactiviteit

### ChangePasswordModal uitgebreid
- Veld "Huidig wachtwoord" toegevoegd — geverifieerd via `signInWithPassword` voor de update
- Minimale wachtwoordlengte verhoogd naar 12 tekens
- Maakt "Require current password when updating" in Supabase Auth veilig om in te schakelen

---

## Sessie april 2026 — achtergrond presets + canvas/cel presets in FormatEditModal

### Canvas- en celpresets in FormatEditModal (admin)
- Dropdowns altijd zichtbaar (niet conditioneel op `length > 0`)
- Fallback op `DEFAULT_CELL_PRESETS` / `DEFAULT_CANVAS_PRESETS` als DB leeg is (zelfde logica als hoofdapp)
- `FormatenSection` laadt presets bij mount en geeft ze als props door

### Achtergrond presets — volledig nieuw feature
**Supabase:** nieuwe tabel `background_presets` (`id uuid`, `name`, `color_hex`, `cmyk_c/m/y/k`, `koepel_ids uuid[]`, `event_codes text[]`, `sort_order`, `created_at`) met RLS (public read, authenticated write)

**DB-laag:**
- `loadBackgroundPresets()`, `upsertBackgroundPreset()`, `deleteBackgroundPreset()` in `db/presets.js`
- `loadKoepels()` in `db/events.js` — geeft `[{ id, name }]` terug (nieuw, naast bestaande `loadEventGroups`)

**Admin — Presets → tabblad "Achtergrond":**
- CRUD-lijst met kleurvlak, naam, CMYK-info, koepel/event-badges
- Editor: HEX picker + CMYK-velden + "CMYK van HEX"-knop
- Koppeling via radiobuttons (één koepel óf één event tegelijk)
- Naam vult automatisch in bij selectie van koepel of event

**Admin — FormatEditModal:**
- Preset dropdown in Achtergrond-sectie: selecteren past `BackgroundColor_Hex` + `BackgroundColor_Cmyk` toe

**Hoofdapp — GridToolbar Stijl-blok (BgColorInput):**
- Preset dropdown boven HEX-veld
- Selecteren past `BackgroundColor_Hex`, `BackgroundColor_Cmyk` én losse `BackgroundColor_C/M/Y/K` velden toe
- `backgroundPresets` prop: `useAppData` → `App.jsx` → `GridToolbar` → `BgColorInput`

---

## Sessie april 2026 — settings modal verwijderd + admin hernoemd naar Instellingen (TODO)

### SettingsModal verwijderd
De tandwiel-modal in de hoofdapp was volledig redundant met het admin-paneel:

| Modal-tab (weg) | Admin-equivalent (blijft) |
|---|---|
| Celdimensies | Presets → Cel |
| Canvas | Presets → Canvas |
| Events & Koepels | Events & Koepels |
| Categorieën | Categorieën |

**Verwijderd:**
- `src/components/SettingsModal.jsx`
- `src/components/settings/` (CelDimensiesTab, CanvasTab, EventsKoepelsTab, CategorieenTab, KoepelsList, ManageList, PresetLinkBtn)

**App.jsx opgeruimd:**
- ~145 regels mutatie-handlers verwijderd (events, categorieën, koepels, presets)
- `useAppData` destructuring vereenvoudigd (setters niet meer nodig in hoofdapp)
- `showSettings` state weg
- Tandwiel-knop → `<a href="/admin">` link

**Aspect ratio naar admin verplaatst:**
- `PresetsSection.jsx` Cel-tab krijgt de standaard aspect ratio (lees + schrijf `default_aspect` setting), inclusief snelknoppen voor 5:3, 16:9, 3:2, 4:3
- `useAppData` laadt `default_aspect` niet meer (enkel nog in admin)

**Bundlegrootte:** main bundle 775kB → **745kB** (−30kB)

---

## Sessie april 2026 — design tokens + format fixes

### Design tokens
- `src/design-system/tokens.css` aangemaakt met raw palette + semantische tokens (colors, typography, radius, shadows, z-index, transitions)
- `src/index.css` importeert tokens; body gebruikt `var(--color-bg)` en `var(--font-sans)`
- Geen `@theme` block (conflicteert met Tailwind v4 interne `--color-*` variabelen)

### Format fixes (4)

**Bug fix — canvas preset herberekent cellen niet**
- `GridToolbar.jsx`: canvas preset selector en canvas breedte/hoogte inputs roepen nu `withFittedAndCentered` aan
- Hierdoor worden col/rij-dimensies correct hergberekend wanneer het canvas kleiner wordt

**Opschoning — `PresetsSection.FormatTab` verwijderd**
- Verouderde `FormatTab` in admin → Presets verwijderd: gebruikte destructieve `saveCustomFormats` (DELETE ALL + INSERT) bij verwijderen en verwees incorrect naar "bewerken via de app"
- Formatensbeheer zit volledig in admin → Formaten (`FormatenSection.jsx`)
- Ongebruikte imports (`loadCustomFormats`, `saveCustomFormats`) verwijderd

**UX — FormatPreview aanzetten in admin**
- `FormatEditModal.jsx`: SVG-preview boven de secties getoond zodra canvas-afmetingen beschikbaar zijn
- Geeft directe visuele feedback bij aanmaken/bewerken van een formaat

**Fix — `static_imported` flag zetten na import**
- `FormatenSection.jsx`: na succesvolle bulkimport wordt `saveSetting('static_imported', true)` aangeroepen
- Garandeert correcte lege staat als alle formats later uit Supabase worden verwijderd

---

## Sessie april 2026 — volledige refactor (structuur, geen gedragswijziging)

Structurele opschoning van `dev/backdrop-designer/` zonder functionele wijzigingen. Gesplitst in 8 fases; `npm run build` passeert na elke fase.

### ① Dode code verwijderd
- `FormatPickerModal.jsx`, `CustomFormatModal.jsx`, `SponsorEditModal.jsx`, `App.css` (niet meer geïmporteerd)
- Ongebruikte handlers uit `App.jsx`: `handleCustomLogoChange`, `handleAddCustomSponsor`, `handleDeleteCustomSponsor`, `handleCustomFormat`, `handleSaveCustomFormat`, `handleImportAllFormats`, `handleDeleteCustomFormat`, `handleTagsChange`, `handleCategoryChange`, `handleSponsorGroupsChange` (~84 regels)

### ② App.jsx opgesplitst (1724 → ~1085 regels)
- Nieuwe componenten in `components/designs/`: `SaveModal`, `SavedDesignsPanel`, `DesignRow`
- Nieuwe componenten in `components/shared/`: `Toast`, `ConfirmModal`
- Nieuw component `components/export/ExportMenu.jsx`
- Nieuwe hooks: `hooks/useAuth.js` (auth-sessie + menu), `hooks/useAppData.js` (bulk-load Supabase state)

### ③ SettingsModal.jsx opgesplitst (784 → ~115 regels)
- Tab-componenten in `components/settings/`: `CelDimensiesTab`, `CanvasTab`, `EventsKoepelsTab`, `CategorieenTab`, `KoepelsList`, `ManageList`, `PresetLinkBtn`

### ④ PreviewCanvas.jsx opgesplitst (682 regels)
- `components/preview/Cell.jsx` — één gridvak
- `components/preview/PersonSilhouette.jsx`, `ChairSilhouette.jsx` — floor-aligned overlays
- `components/preview/constants.js` — `ZOOM_STEPS`, `RULER_SIZE`, `getTickSpacing`, viewbox-dimensies

### ⑤ GridToolbar.jsx opgesplitst (637 regels)
- `components/toolbar/inputs/`: `NumInput`, `IntInput`, `SelectInput`, `LinkBtn`, `BgColorInput`
- `components/toolbar/layout/`: `Group` + `Sep` (horizontal), `VSection` + `VRow` (vertical)
- `components/toolbar/constants.js`: option-lijsten, `parseBarPosition`, `serializeBarPosition`, `withFittedAndCentered`

### ⑥ db.js opgesplitst (501 regels)
- `utils/db.js` → `utils/db/` folder met `settings.js`, `events.js`, `sponsors.js`, `presets.js`, `formats.js`, `designs.js`
- `utils/db/index.js` re-exporteert alles — bestaande imports (`import * as db from '../utils/db'`) blijven werken

### ⑦ Bundle splitting via React.lazy
- `main.jsx` laadt `AdminPage` nu dynamisch via `lazy()` + `<Suspense>`
- Main bundle: **860kB → 776kB** (admin chunk apart: ~85kB)

### ⑧ Documentatie bijgewerkt
- `_docs/components.md` geüpdatet met nieuwe folder-structuur (designs/, shared/, export/, preview/, settings/, toolbar/)
- Deze changelog-entry toegevoegd

---

## Sessie april 2026 — accentkleur terug naar blauw

De UI/UX-upgrade (`9f6c450`) had alle accents op rood (`#E30613`, Flanders Classics brand). Dat bleek te overheersen — accentkleur is teruggezet naar **blauw** (`#2563EB` / Tailwind `blue-600`).

- Alle primaire buttons, actieve tabs/nav-items, focus rings, selected states, hover-accents en filter-pills terug naar `blue-*`
- CSS custom properties in `src/index.css` bijgewerkt (`--color-brand: #2563EB`, etc.)
- **Destructieve rood behouden** voor: delete-knoppen, Wissen, toast error, danger-ConfirmModal, bulk-delete-mode in admin, "Onbekende sponsors"-warning en invalid-indicator in `FrequencyPanel`, error messages in login-formulieren
- Animaties (framer-motion), Inter font en overige UX-patronen uit de upgrade blijven ongewijzigd
- `_docs/design-system.md` kleurenpalet-sectie herschreven met blauw-schema + expliciete "rood blijft voor..." lijst

---

## Sessie april 2026 — admin UX, modal fixes, autocomplete

### Admin LogosSection — filter + bulk delete
- **Filter op event/koepel**: dropdown met optgroups ("─ Events ─" / "─ Koepels ─") naast de zoekbalk
  - Event-filter toont sponsors met directe event-tag **of** sponsors in een koepel die dat event bevat (zelfde logica als main app `buildGroups`)
  - Koepel-filter toont sponsors die direct aan die koepel zijn toegewezen
  - Filter en zoekbalk werken samen (stapelbaar)
- **Bulk delete modus**: "Logo's verwijderen" knop (rechts naast uploadknop) activeert selectiemodus
  - Kaarten tonen checkbox; klikken selecteert/deselecteert
  - Rode bevestigingsbalk onderaan toont aantal geselecteerde + "Verwijder X logo's" knop
  - Na verwijderen: modus automatisch uit, kaarten verdwijnen uit grid
  - Verwijderknop van individuele kaarten verwijderd — verwijderen enkel via bulk-modus
- **Kaartopkuis**: event-tags (blauwe chips) verwijderd van sponsor-kaartjes — niet nodig met filter

### FormatEditModal — achtergrond CMYK + tag autocomplete
- **Achtergrondkleur uitgebreid**:
  - HEX-veld op eigen rij (voor online weergave)
  - CMYK-velden C/M/Y/K (0–100) op tweede rij (voor export/druk)
  - "CMYK berekenen van HEX" knop — benaderende conversie via RGB-formule
  - `BackgroundColor_Cmyk: { c, m, y, k }` opgeslagen in `format_presets.data` (JSONB)
  - `hexToCmyk()` hulpfunctie in `FormatEditModal.jsx`
  - `FormatPreview` SVG component aanwezig maar voorlopig verborgen (te groot)
- **Tag autocomplete**:
  - `FormatenSection` berekent `allTags` (deduplicated, gesorteerd) en geeft door als prop
  - Bij focus of typen verschijnt een dropdown met overeenkomende bestaande tags
  - Reeds toegevoegde tags worden uitgefilterd

### Modal bug — tekst selecteren sluit venster
- **Probleem**: bij slepen om tekst te selecteren in een input kon het venster sluiten
- **Oorzaak**: `mousedown` op input + `mouseup` buiten modal → browser vuurt `click` op de backdrop
- **Fix**: `onMouseDown` i.p.v. `onClick` op de backdrop + `onMouseDown={e => e.stopPropagation()}` op de content
- Toegepast in: `FormatEditModal`, `TagEditor` in `LogosSection`

### × wis-knoppen uitgebreid
- Toegevoegd aan `SponsorPicker.jsx` en `FrequencyPanel.jsx`
- `App.jsx`, `LogoLibrary`, `GridTypeSelector`, `FormatenSection` hadden al een × wis-knop

### Documentatie
- `CLAUDE.md` opgesplitst in `_docs/` map met thematische files (architecture, components, design-system, workflows, conventions, changelog, roadmap)

---

## Sessie april 2026 — formaatbeheer naar admin

### Formaatbeheer volledig naar admin verplaatst
- **Admin: nieuwe sectie "Formaten"** (`FormatenSection.jsx` + `FormatEditModal.jsx`)
  - Lijst met drag-to-reorder, zoekbalk, aanmaken/bewerken/verwijderen
  - Eenmalige importknop: laadt alle 32 formaten uit `backdropFormats.json` in Supabase
  - Tags per formaat: vrij te typen labels (chip-weergave), filterbaar in de main app
  - Volledig formulier in inklapbare secties
- **Main app vereenvoudigd**:
  - `GridTypeSelector` toont alleen een lijst — geen potlood-icoon, geen "+ Nieuw formaat" knop
  - Filter werkt nu op `tags` (beheerd via admin) i.p.v. `Categorie`/`EventStyle`
  - `FormatPickerModal` volledig verwijderd
  - `handleSaveCustomFormat`, `handleDeleteCustomFormat`, `handleImportAllFormats`, `handleCustomFormat` verwijderd uit `App.jsx`
- **Supabase**: `sort_order integer` kolom toegevoegd aan `format_presets`
- **db.js**: `loadFormats()`, `upsertFormat()`, `deleteFormat()`, `bulkImportFormats()`, `reorderFormats()`

### Vercel deployment gefixed
- Probleem: Vercel deployde de repo root als lege statische site (`build . [0ms]`) → 404
- Oorzaak: geen `vercel.json` aan de repo root; de config in `dev/backdrop-designer/` werd genegeerd
- Oplossing: `vercel.json` toegevoegd aan de **repo root** met juiste `installCommand` / `buildCommand` / `outputDirectory`
- `routes` vervangen door `rewrites` — voorkomt conflict met Vite framework routing

### Projectopkuis
- `dev/upload-logos.js` verplaatst naar `dev/backdrop-designer/scripts/upload-logos.js`
- Pad bijgewerkt in `batch_export_logos_v1_DEV.jsx`
- Lege mappen (`stable/`, `archives/`, `experiments/`, `templates/`) verwijderd

---

## Sessie april 2026 — tag/logo beheer naar admin

### Tag- en logobeheer volledig naar admin verplaatst
- **`LogoLibrary.jsx` vereenvoudigd tot alleen-lezen browsepaneel**
  - Verwijderd: `AddSponsorModal`, `CheckSection`, tag-icoon op sponsor-kaartjes, delete-mode (prullenbak-toggle + bevestigingsbalk)
  - Verwijderd: props `onTagsChange`, `onCategoryChange`, `onSponsorGroupsChange`, `onCustomLogoChange`, `onAddCustomSponsor`, `onDeleteCustomSponsor`, `onOpenSettings`
  - `SponsorCard` toont enkel logo + naam
- **`SponsorEditModal.jsx`** niet meer geïmporteerd in main app
- **Admin `LogosSection.jsx`**: alle event- en koepel-tagbeheer via `TagEditor` component — per sponsor

### Per-sponsor save functies in `db.js`
Twee nieuwe functies vervangen de gevaarlijke globale `saveSponsorEventData`:
```js
saveSponsorTags(sponsorName, eventCodes, categoryMap)
saveSponsorGroup(sponsorName, groupMap)
```
`saveSponsorEventData` is deprecated maar blijft voor backwards compat.

### Koepel- vs event-logica — datastructuur
- `sponsor_event_tags`: directe event-koppeling
- `sponsor_group_assignments`: koepel-koppeling
- `event_groups`: welke events zitten in welke koepel
- Filterlogica in `LogoLibrary` gebruikt beide tabellen: koepelpartners zijn zichtbaar bij elk event dat in die koepel zit

---

## Sessie april 2026 — custom sponsors & UX polish

### Custom sponsors — in-app logo upload
- `customSponsors` state: `[{ id, partner, dataUrl }]`
- `handleAddCustomSponsor` / `handleDeleteCustomSponsor`
- Auto-fill naam vanuit PNG-bestandsnaam (spaties/underscores genormaliseerd)
- `AddSponsorModal` in `LogoLibrary`: bestandskiezer + naam + `CheckSection` per event/koepel
- `mergedCustomLogos` useMemo: combineert `customLogos` + `customSponsors[].dataUrl`
- `allSponsors` useMemo: fusie van statische + custom sponsors

### Delete-mode voor custom sponsors
- Prullenbak-toggle naast "+"
- Kaarten tonen selectiecirkel, rode bevestigingsbalk onderaan
- `deleteMode` + `toDelete` states

### Tag-icoon voor custom sponsors
- Tag-icoon nu zichtbaar voor alle sponsors (inclusief custom)
- Touch target vergroot: `p-1` padding

### UX-verbeteringen
- Draft banner: van brede amber-balk naar dunne witte strip
- Header toont naam van geladen ontwerp i.p.v. format-code
- Wissen-knop: gedempte rode tekstkleur
- Richting-picker: iconen verkleind, label weggelaten
- Overig-groep hint: "zonder event" label bij koepelgroepen

### Toolbar boven werkveld
- Twee matchende segmenten, zelfde styling
- Bijwerken + Wissen verplaatst naar toolbar (niet meer in header)
- Prullenbak-icoon op Wissen

### Lege staat canvas
- 2×2 grid-illustratie in grijs blok
- Contextuele CTA: instructietekst of knop, afhankelijk van welk panel open is

### Patroonbeslissingen
- `CheckSection` i.p.v. absolute dropdowns in modals met clipping
- Delete-mode bij conflicterende icoon-posities
- `mergedCustomLogos` als `useMemo`-fusie van twee bronnen

---

## Sessie april 2026 — UX herstructurering

### Opgeslagen ontwerpen — Event + Editie model
- Nieuw datamodel: `event` (string) + `edition` (jaar number)
- `SaveModal` apart dialoog
- `SavedDesignsPanel` herschreven: geen kaart-wrapper, gegroepeerd Event → Editie → ontwerpen
- Zoekveld filtert op naam, event, editie
- "Huidig ontwerp opslaan" knop bovenaan (enkel bij geladen formaat)
- Dupliceer-actie per ontwerp
- Mappenstructuur verwijderd uit UI (data blijft in localStorage voor backwards compat)

### Formats panel — vereenvoudigd
- `formatsView` state verwijderd
- Klikken selecteert in-place
- GridToolbar verplaatst naar nieuw "Aanpassen" panel

### Nieuw "Aanpassen" panel
- 4e icoon (schuifregelaars)
- Disabled zolang geen formaat geladen
- GridToolbar (vertical) + Info-blok

### GridToolbar — Grid en Gutter samengevoegd
- Eén VSection "Grid" met `h-px` scheidingslijn
- Labels: "Gutter H" / "Gutter V"

### Scrollfix panelen
- `overflow-y-auto` + `min-h-0`
- GridTypeSelector: `flex-1 min-h-0` i.p.v. `h-full`

---

## Sessie april 2026 — formaatbeheer eerste poging (achterhaald)

> ⚠️ Vervangen door de admin-versie. `FormatPickerModal` bestaat niet meer.

- Potlood-icoon, FormatPickerModal, staticImported flag → verwijderd
- GridTypeSelector volledige hoogte (kaart-wrapper weggehaald)
- Code-veld verwijderd uit UI — `Beschrijving` enige identificatie
- Bugfixes: SponsorEditModal callback signatures, custom formats in "Alle", events gegroepeerd op koepel in SettingsModal

---

## Sessie april 2026 — FormatPickerModal (achterhaald)

- InDesign-stijl modal met twee niveaus (browse + detail)
- Preset bijwerken / duplicate code check / BlankCard
- Later volledig verwijderd toen formaatbeheer naar admin ging

### GridTypeSelector — Formaatpanel sidebar
- Zoekveld met × wis-knop
- Filter-button met ≡-icoon + chevron
- Twee-regelige layout (code + kolom/rij + beschrijving)

### App.jsx — Twee-niveau navigatie in formats-panel
- `formatsView` state: `'browse' | 'detail'`
- Reset naar `'browse'` bij sluiten of panel-wissel

### Custom formats (eerste versie)
- Persistentie in `backdropDesigner_customFormats` localStorage
- Later gemigreerd naar Supabase `format_presets`

---

## Sessie april 2026 — silhouetten, rulers, toolbar

### Silhouet-overlays op PreviewCanvas
- SVG-silhouetten rechtstreeks als JSX-path in `PreviewCanvas.jsx`
- Overlay floor-aligned, horizontaal versleepbaar, mutex via `activeOverlay`
- Reset bij formaatwissel
- Gouden vulling + `feDropShadow`
- `activeOverlay` state in `App.jsx`

### Logo drag — eerste klik fix
- Probleem: logo's vereisten twee klikken voordat slepen werkte
- Oorzaak: `SponsorCard` binnen IIFE in JSX → nieuwe functiereferentie bij state-wijziging → remount
- Fix: `dragging` state volledig verwijderd, CSS `cursor-grab` volstaat

### Horizontale en verticale rulers
- SVG rulers langs boven en links, sync met scroll via `rulerScroll` state
- Adaptieve tick-spacing (1–5000 mm, major ticks ≥ 55 px)
- Tick-formule: `svgX = mm * scale + canvasOff - scrollLeft`
- `RULER_SIZE = 20` px, corner square links bovenaan

### Toolbar-wijzigingen
- "Liniaal" toggle naast Grid/Preview toggle (alleen in preview-view)
- Default view gewijzigd van `'grid'` naar `'preview'`
- Toolbar-rij links uitgelijnd, `ml-auto` op actions-groep

---

## Sessie april 2026 — Supabase migratie

### Database migratie: localStorage → Supabase
- `src/utils/supabase.js` (nieuw): client
- `src/utils/db.js` (nieuw): alle async functies
- `App.jsx`: `useEffect` met `Promise.all` op mount
- `dbLoading` state

### Logo storage: lokale bestanden → Supabase Storage
- Public bucket `logos` met RLS
- `logoUrl.js` centrale resolver
- Migratie van alle componenten
- Initiële upload via `upload-logos-init.js` (193 logo's)

### Illustrator → Supabase upload-pipeline
- `dev/upload-logos.js` Node.js module (upsert)
- `batch_export_logos_v1_DEV.jsx` schrijft `/tmp/bd_upload.command`
- CEP-beperking: eenmalig `chmod +x /tmp/bd_upload.command` nodig

### Vercel deployment
- Env vars via Vercel dashboard
- Auto-deploy bij push naar `main`

---

## Sessie april 2026 — gebruikersbeheer

### Gebruikersnaam en rol
- Edge Function `admin-users` (v3), `verify_jwt: false`, intern `supabaseAdmin.auth.getUser(token)`
- Acties: `list`, `invite`, `delete`, `update`
- `update` slaat `name` in `user_metadata` en `role` in `app_metadata`
- `GebruikersSection.jsx`: inline bewerken, naam-input + roldropdown (`admin`/`gebruiker`), avatar met eerste letter
- `AdminLayout.jsx`: sidebar-footer toont naam, email, Admin-badge bij role `admin`
- `callEdge` frontend: checkt `res.ok`

### Waarom `verify_jwt: false`
- Standaard JWT-verificatielaag gaf 401 zonder `error`-veld → frontend behandelde als lege lijst
- Oplossing: verificatie intern, robuustere foutmeldingen

---

## Sessie maart 2026

- Gutterlink in SettingsModal (chain-knop per preset)
- Mappenstructuur voor opgeslagen ontwerpen (path-based, drag/rename/delete)
- Margelinks in toolbar (links↔rechts, boven↔onder via chain-knoppen)
- Absolute marges (vaste waarden, cellen krimpen, gutters blijven)
- Centrering visueel, toolbar-waarden ongewijzigd
- `TargetCellW_mm`: cellen onthouden beoogde breedte
- Preset apply herberekent kolommen/rijen naar maximum binnen marges
- Icon bar navigatie (VS Code/Figma stijl)
- Formats panel: GridToolbar verticaal bovenaan + GridTypeSelector + Info-blok
- GridToolbar vertical layout (VSection-blokken)
- Canvas afmetingen live aanpasbaar met link-knop en preset dropdown
- Canvas presets in `backdropDesigner_canvasPresets` localStorage
- SettingsModal tab Canvas (apart van Celdimensies)
- Preview centering fix: `needsCenter` ref-patroon wacht op bijgewerkte `baseScale`
- Bijwerken-knop overschrijft zonder kopie
- ExportMenu dropdown (JPEG/CSV/JSON export + JSON laden)
- Bulk replace in FrequencyPanel (vervang sponsor A door B)
- JSON export/import (`{ version: 1, format, slots, exportedAt }`)
- `parseBarPosition` gededupliceerd naar `utils/barPosition.js`
- `buildGroups` gememoized
- Lazy loading logo's (`loading="lazy"`)
- Cmd/Ctrl pan in preview (grab/grabbing cursor)
