# Changelog

Nieuwste sessies bovenaan. Bestaande entries **niet** wijzigen — alleen toevoegen.

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
