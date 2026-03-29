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

## Recente wijzigingen (sessie maart 2026)

- **Gutterlink in SettingsModal**: chain-knop per preset om GutterX/Y gesynchroniseerd te houden
- **Mappenstructuur voor opgeslagen ontwerpen**: mappen en submappen (path-based model), drag/rename/delete
- **Margelinks in toolbar**: Links↔Rechts en Boven↔Onder gelinkt via chain-knoppen
- **Absolute marges**: MarginLeft/Right/Top/Bottom zijn vaste waarden; cellen krimpen als er te weinig ruimte is (gutters blijven gelijk), maar marges worden nooit auto-aangepast
- **Centrering**: grid wordt visueel gecentreerd binnen de beschikbare ruimte (optische marge groeit bij minder kolommen, maar toolbar-waarden blijven ongewijzigd)
- **TargetCellW_mm**: cellen onthouden hun beoogde breedte; bij minder kolommen springen ze terug naar originele preset-grootte
- **Preset apply**: bij toepassen van een preset worden kolommen/rijen herberekend naar het maximum dat past binnen de marges

---

## Plan van aanpak — Verbeteringen (2026)

### Prioriteit 1 — Robuustheid & dataveiligheid

| # | Punt | Beschrijving |
|---|------|-------------|
| 1.1 | **Auto-save werkstand** | Bij elke wijziging de huidige staat opslaan als "draft" in localStorage. Bij herladen → vragen of je wil herstellen. |
| 1.2 | **Bevestiging bij destructieve acties** | Pop-up bij verwijderen van ontwerp, map, event of categorie. Nu gaat alles direct weg zonder bevestiging. |
| 1.3 | **Negatieve marges en ongeldige waarden blokkeren** | Min=0 op marge-inputs; CellAspect mag nooit 0 worden (deelt door nul). |

### Prioriteit 2 — Gedragsproblemen / bugs

| # | Punt | Beschrijving |
|---|------|-------------|
| 2.1 | **Pan werkt niet correct bij zoom** | In de preview: panning gebruikt ruwe muiscoördinaten zonder zoom-schaal, waardoor beweging niet klopt bij > 100%. |
| 2.2 | **Zoeken negeert eventfilter niet** | Als eventfilter actief is, verschijnen niet-getagde sponsors niet — je kan hen niet toewijzen aan een slot. Aparte "alle sponsors"-modus nodig. |
| 2.3 | **CSV-export escaping ontbreekt** | Sponsornamen met komma's of aanhalingstekens breken het CSV-formaat. |
| 2.4 | **Mapnamen mogen geen `/` bevatten** | Path-based mapmodel breekt als een naam een slash bevat. Validatie bij aanmaken/hernoemen. |

### Prioriteit 3 — UX & feedback

| # | Punt | Beschrijving |
|---|------|-------------|
| 3.1 | **Toastmelding bij opslaan/verwijderen** | Korte bevestiging (2s) bij "Ontwerp opgeslagen", "Map verwijderd", etc. Nu geen feedback. |
| 3.2 | **Markering "onopgeslagen wijzigingen"** | Kleine indicator in de header wanneer het huidige ontwerp gewijzigd is t.o.v. de opgeslagen staat. |
| 3.3 | **Waarschuwing bij formaatwissel met ingevulde slots** | Slots worden nu stilletjes bijgeknipt bij formaatwissel. Korte bevestigingsvraag toevoegen. |
| 3.4 | **Frequentiepaneel: toelichting bij ongeldige sponsors** | Rode markering is onduidelijk zonder uitleg dat de naam niet in sponsors.json staat. |

### Prioriteit 4 — Ontbrekende functies (hoge waarde)

| # | Punt | Beschrijving |
|---|------|-------------|
| 4.1 | **Bulk replace** | "Vervang alle slots met sponsor A door sponsor B." Handig bij late sponsorwijzigingen. |
| 4.2 | **Ontwerp dupliceren** | Snel een kopie maken voor varianten. |
| 4.3 | **Export/import als JSON** | Backup van ontwerp buiten localStorage; overdraagbaar tussen computers. |
| 4.4 | **Sponsor zoeken zonder eventfilter** | Modus om ook niet-getagde sponsors te kunnen toewijzen. |

### Prioriteit 5 — Code & onderhoudbaarheid

| # | Punt | Beschrijving |
|---|------|-------------|
| 5.1 | **`parseBarPosition` dedupliceren** | Staat zowel in `GridToolbar.jsx` als `PreviewCanvas.jsx`. Verplaatsen naar `utils/`. |
| 5.2 | **`buildGroups` memoizen** | In `LogoLibrary.jsx` wordt dit elke render opnieuw berekend. `useMemo` toevoegen. |
| 5.3 | **Lazy loading logo's** | 188 logo's worden allemaal tegelijk geladen. `IntersectionObserver` toevoegen. |

### Bewust niet oppakken

- Undo/redo: zinvol maar complex zonder bugs te introduceren
- Mobiele ondersteuning: buiten scope voor intern gebruik
- i18n / meertaligheid: niet relevant voor interne tool

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
