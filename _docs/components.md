# Componentoverzicht

## Main app (`src/`)

### `App.jsx`
- Beheert alle hoofd-state: `slots`, `selectedFormat`, `editedFormat`, `selectedSlots`, `view`, `savedDesigns`, `advanceDir`, `activeOverlay`, `showRuler`
- `handleAssignFromLibrary`: wijst sponsor toe + berekent volgend slot op basis van `advanceDir` en grid-dimensies
- `handleFormatChange`: herberekent slots bij wijziging kolommen/rijen (behoudt bestaande waarden)
- `handleDuplicateDesign`: kopieert een ontwerp met "(kopie)" suffix
- `handleSaveDesign({ event, edition, name })`: slaat huidig ontwerp op via SaveModal
- **Icon bar**: 4 panels — `'designs'`, `'formats'`, `'adjust'`, `'frequency'`; `'adjust'` uitgeschakeld wanneer geen formaat geladen
- **`SaveModal`** (ingebouwd): dialoog met Event (dropdown vanuit `events`), Editie (jaar, default huidig jaar), Naam
- **`SavedDesignsPanel`** (ingebouwd): gegroepeerd op event → editie, zoekveld, dupliceer/hernoem/verwijder per rij; "Huidig ontwerp opslaan" knop bovenaan (enkel als formaat geladen)

### `components/LogoLibrary.jsx`
- Rechterpaneel: **alleen-lezen sponsorbibliotheek** — geen beheer meer
- Zoekbalk (met × wis-knop), event-filter dropdown, richtingskiezer
- `buildGroups()`: groepeert gefilterde sponsors per categorie wanneer event-filter actief is (gememoized via `useMemo`)
- `SponsorCard`: klikbaar/sleepbaar logo-kaartje — geen tag-icoon, geen delete-checkbox
- `storageFilenames` check: enkel sponsors tonen waarvan het logo-bestand in Supabase Storage staat
- Alle tag/koepel/categorieën-beheer is verplaatst naar de **admin** (`LogosSection.jsx`)

### `components/GridCanvas.jsx`
- Rasterweergave met klikbare slots (grid-view, niet preview)

### `components/PreviewCanvas.jsx`
- Schaalbare preview met logo's uit Supabase Storage
- **Silhouet-overlays**: `<PersonSilhouette>` en `<ChairSilhouette>` subcomponenten, floor-aligned
- **Rulers**: SVG H+V rulers langs boven- en linkerkant, adaptieve tick-spacing
- **Cmd/Ctrl pan**: panning vereist Cmd (Mac) of Ctrl (Win) ingedrukt

### `components/GridTypeSelector.jsx`
- Linkerpaneel: alleen-lezen lijst van alle formaten
- Zoekveld + tag-filter (dropdown met ≡-icoon)
- Fallback: statische `backdropFormats.json` zolang Supabase nog geen formaten bevat
- Props: `selected`, `onSelect`, `formats` (unified array)

### `components/GridToolbar.jsx`
- Twee layouts: `horizontal` (boven het grid) en `vertical` (in het "Aanpassen" paneel)
- Vertical: VSection-blokken (inklapbaar) voor Canvas, Grid, Gutter, Marges, Header, Divider, Stijl
- Grid en Gutter zijn samengevoegd in één VSection, gescheiden door een subtiele lijn
- `withFittedAndCentered`: herberekent celgroottes en centrering na elke wijziging

### `components/SponsorPicker.jsx`
- Popup bij slot-klik om sponsor te kiezen/wissen
- Zoekveld met × wis-knop

### `components/SlotCell.jsx`
- Individueel gridvak

### `components/FrequencyPanel.jsx`
- Frequentietelling sponsors met ongeldig-detectie (t.o.v. `sponsors.json`)
- Bulk replace: vervang alle slots van sponsor A door sponsor B via inline zoekpaneel (× wis-knop)

### `components/ExportButton.jsx` / `ExportMenu.jsx`
- Dropdown: JPEG, CSV, JSON export + JSON laden

### `components/SponsorEditModal.jsx` — ⚠️ inactief
- Niet meer geïmporteerd in main app
- Beheer van event-tags en categorieën verloopt nu via `TagEditor` in `LogosSection.jsx` (admin)
- Component bestaat nog in de codebase

---

## Admin (`src/admin/`)

### `AdminPage.jsx`
- Auth-guard: toont `AdminLogin` of `AdminLayout`

### `AdminLogin.jsx`
- Magic link login-formulier (Supabase Auth)

### `AdminLayout.jsx`
- Sidebar-nav + sectie-routing
- Footer toont naam (wit), email (grijs) en Admin-badge als `app_metadata.role === 'admin'`

### `sections/LogosSection.jsx`
- Logo-beheer: upload, per-sponsor tags (via `TagEditor`), event/koepel-koppeling
- Filter op event/koepel (optgroups) + zoekbalk (stapelbaar)
- Bulk delete modus met checkbox-selectie en rode bevestigingsbalk onderaan

### `sections/FormatenSection.jsx`
- CRUD, tags, drag-reorder, eenmalige import uit `backdropFormats.json`
- Berekent `allTags` (deduplicated, gesorteerd) en geeft ze door aan `FormatEditModal`

### `sections/FormatEditModal.jsx`
- Volledig formulier in inklapbare secties: Naam & Tags / Canvas / Grid / Cel / Gutter / Marges / Header / Divider / Illustrator / Notities
- HEX + CMYK voor achtergrondkleur ("CMYK berekenen van HEX" knop via `hexToCmyk()`)
- Tag autocomplete op basis van `allTags` prop
- `FormatPreview` SVG component aanwezig maar voorlopig verborgen

### `sections/EventsSection.jsx`
- Events + Koepels beheren

### `sections/CategorieenSection.jsx`
- Categorie-volgorde beheren

### `sections/PresetsSection.jsx`
- Cel/Canvas presets beheren

### `sections/GebruikersSection.jsx`
- Gebruikers uitnodigen/beheren via Edge Function `admin-users`
- Inline bewerken per rij (naam + rol: `admin` / `gebruiker`)

---

## Utilities (`src/utils/`)

| Bestand | Doel |
|---|---|
| `supabase.js` | Supabase client (`createClient` met env vars) |
| `db.js` | Alle async DB-functies (vervangt localStorage) |
| `logoUrl.js` | Logo URL resolver: custom → Supabase Storage → null |
| `sponsorTags.js` | Legacy localStorage functies (nog aanwezig, niet meer primair) |
| `exportJpeg.js` | JPEG-export logica |
| `barPosition.js` | Gedeelde `parseBarPosition` parser |
