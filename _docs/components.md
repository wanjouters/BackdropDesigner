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
- Bouwt `sponsors` state uit Supabase Storage (geen `sponsors.json`): `seenKeys` Map normaliseert en dedupliceert; gesorteerd op NL locale

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
- `storageExtras` state: alle sponsors uit Supabase Storage (geen `sponsors.json` meer); `seenKeys` Map normaliseert en dedupliceert bij fetch
- `window.addEventListener('focus', fetchStorageFiles)`: herlaadt storage-lijst bij tab-focus na admin-upload
- Richtingskiezer verwijderd — staat nu in de canvas-toolbar van `App.jsx`
- Alle tag/koepel/categorieën-beheer is verplaatst naar de **admin** (`LogosSection.jsx`)

### `components/GridCanvas.jsx`
- Rasterweergave met klikbare slots (grid-view, niet preview)
- `onSweepSlot` prop; `sweepingRef` + global mouseup listener; `handleSweepStart`/`handleSweepEnter` doorgegeven aan `SlotCell`

### `components/PreviewCanvas.jsx` + `components/preview/`
- `onSweepSlot` prop: cel toevoegen aan selectie (Option+drag)
- `onClearSelection` prop: selectie wissen bij klik buiten cellen
- `sweepStateRef`: geeft stabiele event handlers altijd toegang tot actuele `scale` en `cellPositions`
- `hitTestCell(e)`: screencoördinaat → mm → cel; met 8px inset (pixel-to-mm via schaal) voor hoek-tolerantie
- `hadSweepRef`: click die volgt op een sweep wordt genegeerd zodat selectie niet gewist wordt
- Cursor: `crosshair` bij alt ingedrukt, `grab`/`grabbing` bij cmd/ctrl
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
- Module-level cache (`_cache`/`_pending`): laadt storage één keer voor alle instanties; `seenKeys` Map normaliseert en dedupliceert

### `components/preview/Cell.jsx`
- `onClick` slaat over bij `e.altKey` — sweep-selectie wordt afgehandeld door `PreviewCanvas`

### `components/SlotCell.jsx`
- Individueel gridvak
- `onSweepStart` / `onSweepEnter` props voor Option+sleep selectie; 6px inset-check in `onMouseEnter`; `handleClick`/`handleDoubleClick` skippen bij `altKey`

### `components/FrequencyPanel.jsx`
- Frequentietelling sponsors met ongeldig-detectie (t.o.v. `sponsors` prop uit `useAppData`)
- Accepteert `sponsors = []` prop — geen `sponsors.json` import meer
- Bulk replace: vervang alle slots van sponsor A door sponsor B via inline zoekpaneel (× wis-knop)

### `components/ExportButton.jsx` / `ExportMenu.jsx`
- Dropdown: JPEG, CSV, JSON export + JSON laden

*(SettingsModal verwijderd — alle beheer zit in admin/instellingen)*

---

## Admin (`src/admin/`)

### `AdminPage.jsx`
- Auth-guard: toont `AdminLogin`, `PasswordResetForm`, `UserProfilePage` of `AdminLayout`
- Rolcheck op `session.user.app_metadata?.role === 'admin'` — niet-admins krijgen `UserProfilePage`

### `UserProfilePage` (inline in `AdminPage.jsx`)
- Toegankelijk voor alle ingelogde gebruikers via `/instellingen`
- Naam wijzigen via `supabase.auth.updateUser({ data: { name } })`
- Wachtwoord wijzigen via `supabase.auth.updateUser({ password })`
- Uitloggen + redirect naar `/`

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
- **Folder-import**: `ImportModal` met drie secties (Nieuw / Bijgewerkt / Al aanwezig), detectie via `file.lastModified` vs `storage.updated_at`
- `ImportModal` accepteert `eventGroups` prop: toont koepel-dropdown voor bulk-toewijzing na import (merge-logica — bestaande koepels nooit overschreven)
- `localPreviews` state: objectURLs van net geüploade bestanden → directe weergave los van CDN; `logoVersion` timestamp als key-remount + URL cache-buster
- `allSponsors` = volledig uit Supabase Storage (geen `sponsors.json` meer); `seenKeys` Map normaliseert filenames (spaties → underscores) en dedupliceert bij load
- `handleImport`: normaliseert `filenameNoExt` naar underscores voor de bestaanscheck op `allSponsors` — voorkomt duplicate entries bij bestanden met spaties in de naam
- `handleBulkDelete`: probeert 4 varianten per sponsor (`filename.png`, `filename.svg`, spatie-variant × 2) — verwijdert oude uploads met spaties én svg's
- `sortMode` state (`'alpha'` | `'recent'`): toggle in toolbar; `storageTimestamps` Map voor "recent"-sortering; `filtered` via `useMemo`

### `sections/FormatenSection.jsx`
- CRUD, tags, drag-reorder, eenmalige import uit `backdropFormats.json`
- Berekent `allTags` (deduplicated, gesorteerd) en geeft ze door aan `FormatEditModal`

### `sections/FormatEditModal.jsx`
- Twee-kolom layout: links identiteit (Naam, Code, Tags, Preview SVG, Stats), rechts één scrollbare instellingenkolom
- Secties rechts (vaste volgorde, geen accordions): Canvas → Grid & Cel → Gutter & Marges → Achtergrond → Header → Divider bar → Illustrator & Metadata → Notities
- `SectionHeading` component: `label + h-px bg-gray-100` horizontale lijn — herbruikbaar sectie-scheidingspatroon
- Modal heeft vaste hoogte `min(720px, calc(100vh-48px))` — springt niet bij scrollpositie
- **Schaal**: 3 knoppen `[1:1] [1:2] [1:10]`; auto-enforcement 1:10 bij canvas > 5000 mm via `applyScale()` en in `set()` voor canvas-wijzigingen; ook in `applyCanvasPreset()`
- **Bleed**: on/off toggle; altijd 10 mm fysiek → `Bleed_mm = 10 × Scale`; `bleedEnabled` state; `toggleBleed(enabled)` functie
- **FixedCellSize default**: `true` ("Cellen vast, raster past")
- HEX + CMYK voor achtergrondkleur (`hexToCmyk()`); `→ CMYK` knop inline naast HEX-input
- Tag autocomplete op basis van `allTags` prop
- Code-veld in linkerpaneel met `(auto)` indicator en inline Reset-knop

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
