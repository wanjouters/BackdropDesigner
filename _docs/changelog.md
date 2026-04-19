# Changelog

Nieuwste sessies bovenaan. Bestaande entries **niet** wijzigen — alleen toevoegen.

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
