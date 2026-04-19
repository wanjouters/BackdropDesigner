# Componentoverzicht

## Main app (`src/`)

### `App.jsx`
- Beheert alle hoofd-state voor slots, selectie, formaat, view, advanceDir, overlay, ruler
- Auth-state en remote data zijn verplaatst naar custom hooks (`useAuth`, `useAppData`)
- `handleAssignFromLibrary`: wijst sponsor toe + berekent volgend slot op basis van `advanceDir` en grid-dimensies
- `handleFormatChange`: herberekent slots bij wijziging kolommen/rijen (behoudt bestaande waarden)
- `handleDuplicateDesign`: kopieert een ontwerp met "(kopie)" suffix
- `handleSaveDesign({ name })`: slaat huidig ontwerp op via SaveModal
- **Icon bar**: 4 panels — `'designs'`, `'formats'`, `'adjust'`, `'frequency'`; `'adjust'` uitgeschakeld wanneer geen formaat geladen
- **Canvas-toolbar**: richtingskiezer (3×3 grid, `DIR_GRID`/`DIR_ARROWS` op module-niveau) zichtbaar in beide views; liniaal + silhouet-toggle alleen in preview-view

### `hooks/useAuth.js`
- Beheert Supabase auth-sessie + auth-menu UI (`authSession`, `authMenuOpen`, `signOut()`)
- Luistert op `onAuthStateChange` en sluit het menu bij klik buiten

### `hooks/useAppData.js`
- Laadt alle persistente Supabase-data bij mount via `Promise.all` (savedDesigns, tags, categorieën, events, koepels, presets, custom sponsors/logos, …)
- Exporteert defaults: `DEFAULT_CATEGORIES`, `DEFAULT_CELL_PRESETS`, `DEFAULT_CANVAS_PRESETS`, `DEFAULT_BACKGROUND_PRESETS`
- Laadt ook `backgroundPresets` (geen fallback defaults — lege array als DB leeg is)

### `components/designs/` — opgesplitste ontwerpen-UI
- `SaveModal.jsx`: dialoog voor opslaan (naam)
- `SavedDesignsPanel.jsx`: paneel dat ontwerpen groepeert en filter+zoek biedt
- `DesignRow.jsx`: één ontwerp-rij met hernoem/dupliceer/verwijder acties

### `components/shared/`
- `Toast.jsx`: auto-dismiss notificatie (success/info/warning/error)
- `ConfirmModal.jsx`: bevestigingsdialoog (danger/warning)

### `components/export/ExportMenu.jsx`
- Export-dropdown: JPEG, CSV (Gridzilla), JSON backup, JSON import

### `components/LogoLibrary.jsx`
- Rechterpaneel: **alleen-lezen sponsorbibliotheek** — geen beheer meer
- Zoekbalk (met × wis-knop), event-filter dropdown
- **Tegel/lijst-toggle** naast de "Logo's" titel — `viewMode` state (`'tile'` | `'list'`)
- `SponsorCard`: klikbaar/sleepbaar logo-kaartje in tegel-layout (Framer Motion hover)
- `SponsorRow`: compacte rij-layout (klein logo + naam), ook draggable/klikbaar
- `buildGroups()`: groepeert gefilterde sponsors per categorie wanneer event-filter actief is (gememoized via `useMemo`); toggle werkt ook in grouped view
- `storageFilenames` check: enkel sponsors tonen waarvan het logo-bestand in Supabase Storage staat
- Richtingskiezer verwijderd — staat nu in de canvas-toolbar van `App.jsx`
- Alle tag/koepel/categorieën-beheer is verplaatst naar de **admin** (`LogosSection.jsx`)

### `components/GridCanvas.jsx`
- Rasterweergave met klikbare slots (grid-view, niet preview)

### `components/PreviewCanvas.jsx` + `components/preview/`
- Shell-component voor de schaalbare preview met logo's uit Supabase Storage
- Subcomponenten leven in `components/preview/`:
  - `Cell.jsx`: één gridvak met drop-target + fallback-tekst
  - `PersonSilhouette.jsx` / `ChairSilhouette.jsx`: floor-aligned overlays
  - `constants.js`: `ZOOM_STEPS`, `RULER_SIZE`, `getTickSpacing()`, person/chair viewbox-constanten
- **Rulers**: SVG H+V rulers langs boven- en linkerkant, adaptieve tick-spacing
- **Cmd/Ctrl pan**: panning vereist Cmd (Mac) of Ctrl (Win) ingedrukt

### `components/GridTypeSelector.jsx`
- Linkerpaneel: alleen-lezen lijst van alle formaten
- Zoekveld + tag-filter (dropdown met ≡-icoon)
- Fallback: statische `backdropFormats.json` zolang Supabase nog geen formaten bevat
- Props: `selected`, `onSelect`, `formats` (unified array)

### `components/GridToolbar.jsx` + `components/toolbar/`
- Twee layouts: `horizontal` (boven het grid) en `vertical` (in het "Aanpassen" paneel)
- Vertical: VSection-blokken (inklapbaar) voor Canvas, Grid, Gutter, Marges, Header, Divider, Stijl
- Grid en Gutter zijn samengevoegd in één VSection, gescheiden door een subtiele lijn
- Subcomponenten leven in `components/toolbar/`:
  - `inputs/`: `NumInput`, `IntInput`, `SelectInput`, `LinkBtn`, `BgColorInput`
  - `layout/`: `Group` + `Sep` (horizontal), `VSection` + `VRow` (vertical)
  - `constants.js`: option-lijsten (`HEADER_OPTIONS`, `BAR_TYPE_OPTIONS`, …), `parseBarPosition`, `withFittedAndCentered`

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

*(SettingsModal verwijderd — alle beheer zit in admin/instellingen)*

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
- **Tegel/lijst-toggle** in de toolbar (`viewMode` state, `SponsorCard` / `SponsorRow`)
- `SponsorRow`: rij met logo-thumbnail, naam, koepel/event-badges, hover-editknop
- Bulk delete modus met checkbox-selectie en rode bevestigingsbalk onderaan (werkt in beide views)

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
| `db/` | Alle async DB-functies, opgesplitst per thema: `settings.js`, `events.js`, `sponsors.js`, `presets.js`, `formats.js`, `designs.js` — re-export via `db/index.js` |
| `logoUrl.js` | Logo URL resolver: custom → Supabase Storage → null |
| `sponsorTags.js` | Legacy localStorage functies (nog aanwezig, niet meer primair) |
| `exportJpeg.js` | JPEG-export logica |
| `barPosition.js` | Gedeelde `parseBarPosition` parser |

---

## Bundle splitting

De admin-route wordt via `React.lazy()` dynamisch geladen in `main.jsx`, waardoor `AdminPage.*.js` een eigen chunk is en niet in de main bundle zit. Zichtbaar in de build-output als `dist/assets/AdminPage-*.js`.
