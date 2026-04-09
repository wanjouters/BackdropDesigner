# BackdropDesigner — Project Context voor Claude

## Wat is BackdropDesigner?

BackdropDesigner is een React-webapp (Vite + Tailwind CSS v4) voor het visueel ontwerpen van sponsor-backdrops voor Flanders Classics wielerwedstrijden. De gebruiker wijst sponsors toe aan gridslots, bekijkt een live preview, en exporteert het resultaat als CSV voor het Gridzilla Illustrator-script, of als JPEG.

---

## Stack & Omgeving

| | |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| State | `useState` + `localStorage` (geen backend) |
| Taal | JSX (geen TypeScript) |
| Dev server | `npm run dev` → `http://localhost:5173` |
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
        GridTypeSelector.jsx   — Linkerpaneel: formatenlijst + filters
        GridToolbar.jsx        — Kolommen/rijen/cel-instellingen boven het grid
        SponsorEditModal.jsx   — Popup voor per-sponsor event/categorie-instellingen
        SlotCell.jsx           — Individueel gridvak
        FrequencyPanel.jsx     — Frequentietelling sponsors
        ExportButton.jsx       — CSV-export knop
        CustomFormatModal.jsx  — Modal voor nieuw aangepast formaat
      utils/
        sponsorTags.js         — Alle localStorage load/save functies
        exportJpeg.js          — JPEG-export logica
      data/
        sponsors.json          — Sponsordatabase (~188 sponsors, velden: partner + filename)
        formats.json           — Alle gridformaten
    batch_export_logos_v1_DEV.jsx  — ExtendScript: batch export vanuit Illustrator
```

### sponsors.json formaat

```json
{ "partner": "A WARE", "filename": "A_WARE" }
```

- `partner`: weergavenaam (met spaties), sleutel voor alle tags/data in localStorage
- `filename`: bestandsnaam zonder extensie → `public/logos/FILENAME.png`
- Geen `url`-veld meer (was FTP-pad uit oude Excel-workflow, niet meer nodig)
- `BLANK` staat **niet** in de JSON — die is hardcoded in `App.jsx`

---

## State & Persistentie (localStorage)

Alle state wordt opgeslagen in `localStorage` via `src/utils/sponsorTags.js`.

| Key | Inhoud |
|---|---|
| `backdropDesigner_tags` | `{ [sponsorName]: string[] }` — welke events een sponsor heeft |
| `backdropDesigner_sponsorCategories` | `{ [sponsorName]: { [event]: categoryName } }` |
| `backdropDesigner_categoryList` | `string[]` — volgorde van categorieën (prioriteit) |
| `backdropDesigner_events` | `string[]` — lijst van events (AGR, BCC, ROAD…) |
| `backdropDesigner_eventGroups` | `{ [koepelName]: string[] }` — welke events onder een koepel vallen |
| `backdropDesigner_sponsorGroups` | `{ [sponsorName]: { [koepelName]: categoryName } }` — koepelpartner-assignments |
| `backdropDesigner_customLogos` | `{ [sponsorName]: dataUrl }` — logo-overrides voor bestaande sponsors |
| `backdropDesigner_customSponsors` | `[{ id, partner, dataUrl }]` — volledig nieuwe (custom) sponsors met eigen logo |
| `backdropDesigner_savedDesigns` | `[{ id, name, event, edition, formatCode, format, slots, savedAt, folder }]` — `event` en `edition` zijn nieuw; oude ontwerpen zonder deze velden verschijnen onder "Overig" |
| `backdropDesigner_advanceDir` | `'r' \| 'l' \| 'd' \| 'u' \| 'dr' \| 'dl' \| 'ur' \| 'ul' \| 'none'` |
| `backdropDesigner_staticImported` | `'true'` zodra alle statische presets zijn omgezet naar custom |
| `backdropDesigner_customFormats` | `[{ ...format, _custom: true, id }]` — bewerkbare formaatpresets |

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
- Enkelvoudige lijst van alle gridformaten (statisch + custom)
- Zoekveld + categoriefilter (dropdown met ≡-icoon)
- Geselecteerde rij toont subtitel: `Categorie · EventStyle`
- Potlood-icoon op hover opent FormatPickerModal in editMode
- `+ Nieuw formaat aanmaken` footer-knop

### `GridToolbar.jsx`
- Twee layouts: `horizontal` (boven het grid) en `vertical` (in het "Aanpassen" paneel)
- Vertical: VSection-blokken (inklapbaar) voor Canvas, Grid, Gutter, Marges, Header, Divider, Stijl
- **Grid en Gutter zijn samengevoegd** in één VSection — gescheiden door een subtiele lijn
- `withFittedAndCentered`: herberekent celgroottes en centrering na elke wijziging

---

## Ontwerpbeslissingen

- **Geen backend**: alles client-side, persistentie via `localStorage`
- **Geen TypeScript**: bewuste keuze voor snelheid en leesbaarheid
- **Één `categoryList`**: vroeger waren er twee aparte lijsten (per-event en per-koepel) — samengevoegd tot één
- **ManageList defaultCollapsed**: nieuw toegevoegde prop zodat elk blok een eigen standaardtoestand heeft
- **`editingKoepelEvent` state**: koepeldropdown per event is alleen zichtbaar na klikken op een icoon (edit-mode), nooit inline
- **`advanceDir` in localStorage**: de gekozen richting blijft bewaard tussen sessies

---

## Batch Export Script (Illustrator → App)

**Locatie:** `dev/batch_export_logos_v1_DEV.jsx`
**Runnen:** Illustrator → File > Scripts > Other Script...

### Wat het doet
1. Itereert alle artboards in het actieve AI-document
2. Exporteert elk artboard als PNG of SVG naar `public/logos/`
3. Gebruikt de artboard-naam exact als bestandsnaam (= zelfde naam als Gridzilla verwacht)
4. Leest `sponsors.json` en voegt ontbrekende sponsors toe
5. Bestaande entries worden **nooit** gewijzigd — tags en event-data blijven intact

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
public/logos/NAAM.png overschreven
App toont direct nieuw logo
Alle tags/events/categorieën intact
```

### SVG vs PNG
- Huidig formaat: **PNG**
- SVG is ondersteund in het script (aanbevolen voor toekomstige overstap)
- Overstap = enkel andere radiobutton aanvinken in het dialoogvenster

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

## Recente wijzigingen (sessie april 2026 — formaatbeheer)

### Formaatbeheer — statische JSON vervangen door bewerkbare presets
- **Override-systeem**: custom format met zelfde Code als statisch preset verdringt de statische versie in alle lijsten (deduplicatie op Code)
- **Potlood-icoon** op hover in GridTypeSelector — opent FormatPickerModal direct op level 2 (edit-modus)
- **`editMode` prop** in FormatPickerModal: Code altijd bewerkbaar, "Opslaan als preset" voor statische presets, "Preset bijwerken" voor custom
- **Eenmalige import**: "Importeer alle presets als bewerkbaar" converteert de volledige statische JSON naar custom presets in één klik; na import verdwijnt de statische lijst volledig
- **`staticImported` flag** in localStorage (`backdropDesigner_staticImported`); als gezet, ontvangt GridTypeSelector en FormatPickerModal een lege `staticFormats=[]`
- **`staticFormats` prop**: App.jsx importeert `backdropFormats.json` als `allStaticFormats` en geeft lege array door na import — componenten zijn niet meer hardgekoppeld aan de JSON

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

## Openstaande verbeterpunten

| Punt | Beschrijving |
|------|-------------|
| **Toekomstig: backend/sync** | Designs staan nu in localStorage (apparaat-gebonden). Op termijn migratie naar Supabase voor gedeelde toegang. |
| **CSV-export escaping** | Sponsornamen met komma's of aanhalingstekens breken het CSV-formaat. |
| **FormatPickerModal UI** | "Annuleren" krijgt focus-ring bij klikken (lichte blauwe gloed). |

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

### Fase 1 — Online hosting (kort termijn)
- App hosten via **Vercel** (gratis, automatische deploy bij git push)
- Vereist: logo's in de repo aanwezig (`public/logos/`)
- Geen backend nodig — app blijft puur client-side met localStorage

### Fase 2 — Login & gedeelde data (middellange termijn)
- Authenticatie + database via **Supabase** (gratis tier, PostgreSQL)
- Ontwerpen opgeslagen in de cloud i.p.v. localStorage
- Collega's kunnen elkaars ontwerpen zien en bewerken
- Hosting blijft op Vercel

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
