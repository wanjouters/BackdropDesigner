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
| `backdropDesigner_customLogos` | `{ [sponsorName]: dataUrl }` — custom geüploade logo's |
| `backdropDesigner_savedDesigns` | `[{ id, name, formatCode, format, slots, savedAt }]` |
| `backdropDesigner_advanceDir` | `'r' \| 'l' \| 'd' \| 'u' \| 'dr' \| 'dl' \| 'ur' \| 'ul' \| 'none'` |

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
- `SavedDesignsPanel`: ingebouwde component voor opslaan/laden/hernoemen/verwijderen van ontwerpen

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
- Lijst van alle gridformaten uit `formats.json`
- Filters: categorie (dropdown) + event (dropdown)

### `GridToolbar.jsx`
- Inline-bewerkbare velden: kolommen, rijen, celbreedte, aspect ratio, celhoogte, gutter horiz/vert

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

## Nog te doen / Ideeën

- Exporteren naar Gridzilla CSV-formaat (deels al aanwezig via `ExportButton`)
- Undo/redo
- Importeren vanuit bestaand CSV
- Koepels visueel anders weergeven in het grid (kleurcode?)
- Mobiele ondersteuning (niet prioritair)
- Overstap van PNG naar SVG voor logo's

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
