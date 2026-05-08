# Design System & UX Patronen

Deze file legt de terugkerende UX-patronen vast die over de hele app consistent toegepast worden. Bij UI-werk altijd eerst hier checken.

---

## Modals

### Click-to-close backdrop — veilig patroon

Backdrop sluit op klik buiten de modal. **Altijd `onMouseDown` gebruiken, niet `onClick`**, en `onMouseDown` stoppen op de content.

```jsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
  onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
>
  <div
    className="bg-white rounded-2xl shadow-2xl …"
    onMouseDown={e => e.stopPropagation()}
  >
    …
  </div>
</div>
```

**Waarom**: bij `onClick` op de backdrop sluit de modal ongewenst wanneer de gebruiker tekst sleept in een input: `mousedown` op input + `mouseup` buiten modal → browser vuurt `click` op de backdrop → `e.target === e.currentTarget` → `onClose()`. `onMouseDown` + `stopPropagation` op de content voorkomt dit.

**Toegepast in**: `FormatEditModal`, `TagEditor` in `LogosSection`, `SaveModal`, delete-confirm in `FormatenSection`.

### Vaste modalhoogte — geen springende modals

Modals met variabele inhoud (tabs, conditionele velden) krijgen een vaste hoogte zodat ze niet springen:

```jsx
<div
  style={{ height: 'min(720px, calc(100vh - 48px))' }}
  className="… flex flex-col overflow-hidden"
>
```

De content-zone binnen de modal heeft `flex-1 overflow-y-auto` zodat de inhoud scrollt. **Toegepast in**: `FormatEditModal`.

### SectionHeading — sectie-scheidingspatroon

Voor modals en panelen met meerdere inhoudsgroepen (zonder accordion):

```jsx
function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}
```

Label links, dunne lijn loopt door tot rechts. Secties worden gescheiden door `space-y-8` op de container.

### Segmented scale-knoppen

Voor opties die een kleine, gesloten set vormen en waarbij de actieve waarde altijd zichtbaar moet zijn — gebruik pill-knoppen in een rij, niet een dropdown:

```jsx
{[{ label: '1:1', value: 1 }, { label: '1:2', value: 0.5 }, { label: '1:10', value: 0.1 }].map(s => (
  <button
    className={active ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}
  >
    {s.label}
  </button>
))}
```

Disabled knoppen krijgen `border-gray-100 text-gray-300 cursor-not-allowed`. **Toegepast in**: Schaal-selector in `FormatEditModal`.

---

### Inklapbare secties in plaats van dropdowns

Binnen modals met `overflow-hidden` of beperkte hoogte: gebruik inline inklapbare secties (zie `CheckSection`-patroon) in plaats van absolute-positioned dropdowns — die worden geclipt.

---

## Zoekvelden — × wis-knop

Elk zoekveld in de app krijgt een × wis-knop rechts wanneer er tekst in staat. Klikken leegt het veld volledig.

```jsx
<div className="relative">
  <input
    value={query}
    onChange={e => setQuery(e.target.value)}
    className="… pr-9"
    placeholder="Zoeken…"
  />
  {query && (
    <button
      onClick={() => setQuery('')}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 2l8 8M10 2L2 10"/>
      </svg>
    </button>
  )}
</div>
```

**Toegepast in**: `App.jsx`, `LogoLibrary`, `GridTypeSelector`, `SponsorPicker`, `FrequencyPanel` (zowel hoofdzoekbalk als vervang-paneel), `FormatenSection`, `LogosSection` (admin).

---

## Admin form — field sizing patroon

In admin-modals met meerdere numerieke en tekstvelden worden inputs gesized naar hun inhoud, niet naar de beschikbare containerruimte.

### Componentregels

| Component | Breedte | Reden |
|---|---|---|
| `NumField` | `w-20` (80px) vast | Voldoende voor 4-cijferige mm-waarden en decimalen |
| `SelectField` | `min-w-[120px]` op wrapper | Leesbaar voor korte opties (NONE/BAR/LOGO) |
| `TextField` | `flex-1 min-w-[100px]` op wrapper | Vult beschikbare ruimte, wrapat bij gebrek aan ruimte |
| Preset-selects | `max-w-[220px]` | Nemen niet de volle breedte van de sectie |

### Layout binnen secties

Gebruik `flex flex-wrap items-end gap-x-3 gap-y-2` in plaats van `grid grid-cols-N`:
- Velden staan naast elkaar zolang er ruimte is
- Wrappen automatisch zonder vaste kolombreedte af te dwingen
- Samen met `NumField`'s vaste breedte: logische groepering zonder verspilde ruimte

```jsx
<div className="flex flex-wrap items-end gap-x-3 gap-y-2">
  <NumField label="Breedte" unit="mm" ... />
  <LinkBtn ... />
  <NumField label="Hoogte" unit="mm" ... />
  <NumField label="Schaal" ... />
  <NumField label="Bleed" unit="mm" ... />
</div>
```

**Toegepast in**: `FormatEditModal.jsx` (alle secties in rechterkolom).

---

## Bulk delete patroon

Bij conflict tussen per-kaart delete-knop en andere per-kaart acties (tag-icoon, bewerk-icoon, etc.) → gebruik een **toggle-modus** in plaats van per-item acties.

- Toggle-knop bovenaan (prullenbak-icoon)
- In delete-mode: kaarten tonen een selectiecirkel / checkbox; klikken selecteert
- Rode bevestigingsbalk onderaan met aantal geselecteerde + "Verwijder X …" knop
- Na verwijderen: modus automatisch uit

**States**:
```jsx
const [deleteMode, setDeleteMode] = useState(false)
const [selected, setSelected] = useState(new Set())
```

**Toegepast in**: `LogosSection` (admin — bulk logo delete). Vroeger ook in `LogoLibrary` voor custom sponsors (inmiddels naar admin verplaatst).

---

## Autocomplete / memory

Tag-velden met memory (autocomplete op basis van bestaande waardes):

- Parent component berekent `allTags = [...new Set(items.flatMap(i => i.tags || []))].sort()` en geeft door als prop
- Bij focus of typen: dropdown toont overeenkomende bestaande tags (max 8)
- Tags die al toegevoegd zijn, worden uitgefilterd
- Klik op suggestie voegt direct toe; Enter voegt vrije tekst toe
- Sluiten via `onBlur` + `setTimeout` zodat klik op suggestie nog doorkomt

**Toegepast in**: `FormatEditModal` tag-veld. Patroon herbruikbaar voor andere tag-achtige inputs.

---

## Kleurnotatie

Achtergrondkleur in formaten heeft twee rijen:
- **HEX** — voor online weergave (preview, browser)
- **CMYK** — voor export / druk. Benaderende conversie via RGB-formule (zonder ICC-profiel) met knop "CMYK berekenen van HEX".

Opgeslagen als:
```js
BackgroundColor: '#RRGGBB',
BackgroundColor_Cmyk: { c, m, y, k }  // 0–100
```

Helper `hexToCmyk(hex)` staat in `FormatEditModal.jsx`.

---

## Icon bar (links)

VS Code / Figma stijl, donkere balk (`bg-gray-900`). Panels:
- `'designs'` — opgeslagen ontwerpen
- `'formats'` — formaatkeuze (standaard)
- `'adjust'` — GridToolbar (vertical); uitgeschakeld (grijs) zolang geen formaat geladen
- `'frequency'` — sponsor-frequentie

Wisselen van panel sluit eventuele sub-views (zoals `formatsView`).

---

## Toolbar boven het werkveld

Twee matchende segmenten, zelfde padding en kleuren:

```
bg-white border border-gray-200 rounded-xl p-1 flex gap-1
```

- **Links**: Grid / Preview view-toggle + Liniaal-toggle + Overlay-toggles (alleen in preview-view)
- **Rechts**: Bijwerken (conditioneel, blauw filled `bg-blue-600`) + Wissen (grijs, rood on hover, met prullenbak-icoon)

Alle knoppen: `px-3 py-1.5 rounded-lg text-xs font-medium` — zelfde grootte en padding.

Wissen is **niet in de header** — header toont enkel naam/info + ExportMenu.

---

## Lege staat (canvas zonder formaat)

- Visuele illustratie: 2×2 grid-icoon in grijs blok (`w-20 h-20 bg-gray-100 rounded-2xl`)
- **Contextuele CTA**:
  - Als formats-panel al open is → instructietekst "← Selecteer een formaat uit de lijst"
  - Anders → klikbare knop "Formaten bekijken →"
- Voorkomt dat een CTA-knop "niets doet" wanneer het bijbehorende panel al actief is

---

## Overige patronen

- **Draft banner**: dunne witte strip (niet amber) — minder visueel lawaai
- **Header naam**: toont naam van geladen ontwerp i.p.v. altijd de format-code
- **Wissen-knop**: gedempte rode tekstkleur (`text-gray-300 hover:text-red-400`) — minder prominent
- **Richting-picker**: iconen verkleind (`w-4 h-4`), label weggelaten
- **Overig-groep hint**: klein label "zonder event" naast koepelgroepen zonder event-koppeling
- **Chain-link knoppen**: voor gekoppelde invoervelden (breedte↔hoogte, gutterX↔Y, marge-links↔rechts, marge-boven↔onder)
- **mergedCustomLogos**: wanneer twee bronnen hetzelfde doel dienen (`customLogos` + `customSponsors[].dataUrl`), combineer via `useMemo` vóór doorgeven aan child-components
- **CheckSection**: inline inklapbare lijst met checkbox per item + select per item, voor complexe keuzes in modals

---

---

## Kleurenpalet

Primaire accentkleur is **blauw** (`#2563EB` ≈ Tailwind `blue-600`). Rood is voorbehouden aan destructieve acties (verwijderen, wissen), error states en warnings.

| Rol | Kleur | Tailwind klasse |
|---|---|---|
| Achtergrond | `#F9F9F9` | `bg-gray-50` |
| Surface / kaart | `#FFFFFF` | `bg-white` |
| Primair accent | `#2563EB` | `bg-blue-600` |
| Primair hover | `#1D4ED8` | `hover:bg-blue-700` |
| Secundair / donker | `#111111` | `bg-gray-900` |
| Tekst | `#1A1A1A` | `text-gray-900` |
| Lichte accent bg | `#EFF6FF` | `bg-blue-50` |
| Lichte accent border | `#BFDBFE` | `border-blue-200` |
| Destructief / error | Tailwind red | `bg-red-600`, `text-red-500`, enz. |

**CSS custom properties** (gedefinieerd in `src/index.css`):
```css
--color-brand: #2563EB;
--color-brand-hover: #1D4ED8;
--color-brand-light: #EFF6FF;
--color-brand-border: #BFDBFE;
--color-surface: #FFFFFF;
--color-bg: #F9F9F9;
--color-text: #1A1A1A;
```

**Vuistregel voor klassekeuze**:
- Primaire knoppen: `bg-blue-600 hover:bg-blue-700 text-white`
- Actieve tab / nav-item: `bg-blue-600 text-white`
- Actieve inline toggle: `text-blue-500 bg-blue-50`
- Focus rings: `focus:ring-1 focus:ring-blue-400` of `focus:ring-2 focus:ring-blue-300`
- Geselecteerde staat (kaart, slot, rij): `border-blue-500 ring-2 ring-blue-300 bg-blue-50`
- Checked row bg: `bg-blue-50`, checked text: `text-blue-700`, checked border: `border-blue-200`

**Rood blijft voor**:
- Delete / verwijder / wissen knoppen (vaak `hover:text-red-500`, confirm `bg-red-600 hover:bg-red-700`)
- Error messages (`text-red-500`)
- Toast error (`bg-red-600`)
- Warnings (bv. "Onbekende sponsors" in FrequencyPanel: `bg-red-50 border-red-200 text-red-600`)
- Bulk-delete modus in admin (geselecteerde rijen, bevestigingsbalk)

---

## Animaties — framer-motion

`framer-motion` is de standaard animatiebibliotheek. Altijd importeren vanuit het project-eigen variants-bestand:

```js
import { motion, AnimatePresence } from 'framer-motion'
import { modalVariants, backdropVariants, slideFromRightVariants, listItemVariants, listContainerVariants } from '../utils/animations'
```

### Reusable variants (`src/utils/animations.js`)

```js
// Modal content: scale + fade + licht omhoog
export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
  exit:    { opacity: 0, scale: 0.95, y: 8, transition: { duration: 0.15 } },
}

// Modal backdrop: fade
export const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
}

// Slide-in vanuit rechts (toasts, notificaties)
export const slideFromRightVariants = {
  hidden:  { x: 48, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit:    { x: 48, opacity: 0, transition: { duration: 0.15 } },
}

// Lijstitems: stagger entrance
export const listItemVariants    = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }
export const listContainerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
```

### Modals — standaard animatiepatroon

Elke modal (backdrop + content) gebruikt `AnimatePresence` + twee geneste `motion.div`s:

```jsx
<AnimatePresence>
  {open && (
    <motion.div
      variants={backdropVariants}
      initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden" animate="visible" exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* inhoud */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Toegepast in**: `FormatPickerModal`, `SettingsModal`, `CustomFormatModal`, `SaveModal` (in `App.jsx`).

### Side panel — breedte-animatie

Het linkerpaneel (naast de icon bar) animeert op **width**, niet op `x`. Een `x`-translatie verschuift het element visueel over de icon bar heen; breedte-animatie houdt het element binnen zijn flex-ruimte.

```jsx
<AnimatePresence initial={false}>
  {leftPanel && (
    <motion.div
      key="side-panel"
      initial={{ width: 0 }}
      animate={{ width: 256 }}
      exit={{ width: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden"
    >
      {/* Inner div met vaste breedte zodat content niet uitrekt */}
      <AnimatePresence mode="wait">
        <motion.div
          key={leftPanel}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="w-64 flex flex-col h-full"
        >
          {/* panel content */}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )}
</AnimatePresence>
```

De binnenste `AnimatePresence mode="wait"` zorgt voor een snelle fade bij wisselen tussen panelen (formats → adjust etc.) zonder dat de breedte opnieuw animeert.

### Toasts — slide vanuit rechts

```jsx
// In App.jsx: toast-state heeft een `key` zodat AnimatePresence de exit detecteert
<AnimatePresence>
  {toast && (
    <Toast key={toast.message + toast.type} message={toast.message} type={toast.type} />
  )}
</AnimatePresence>

// Toast component gebruikt slideFromRightVariants
<motion.div
  variants={slideFromRightVariants}
  initial="hidden" animate="visible" exit="exit"
  className="fixed bottom-6 right-6 …"
>
```

**Toegepast in**: `App.jsx`, `AdminLayout.jsx`.

### Lijsten — stagger entrance

Gebruik `listContainerVariants` op de wrapper en `listItemVariants` op elk item voor een getrapt inkomst-effect. Reset de stagger bij verandering van zoekopdracht/filter via een `key` op de container.

```jsx
<motion.div
  key={searchQuery}                   // reset stagger bij nieuwe query
  variants={listContainerVariants}
  initial="hidden" animate="visible"
>
  {items.map(item => (
    <motion.div key={item.id} variants={listItemVariants}>
      …
    </motion.div>
  ))}
</motion.div>
```

**Toegepast in**: `LogoLibrary` (sponsor-grid), `FrequencyPanel` (frequentie-rijen).

### VSection collapse — hoogte-animatie

Inklapbare secties in `GridToolbar` gebruiken `AnimatePresence` met een `height` animatie:

```jsx
<AnimatePresence initial={false}>
  {open && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-2 px-3 pb-3 pt-1 border-t border-gray-100 bg-white">
        {children}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

### Micro-interactions — knoppen en kaarten

- **SlotCell**: `whileHover={{ scale: 1.03 }}` + `whileTap={{ scale: 0.97 }}` op de inner `motion.div`
- **LogoLibrary sponsor-kaarten**: `whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}`
- Animeer niet de buitenste wrapper-div (die `@dnd-kit` aanraakt), maar altijd een inner `motion.div`

### FrequencyPanel — geanimeerde voortgangsbalk

```jsx
<motion.div
  className="h-full bg-blue-400 rounded-full"
  initial={{ width: 0 }}
  animate={{ width: `${pct}%` }}
  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
/>
```

---

## SponsorPicker — keyboard navigatie

`SponsorPicker` ondersteunt volledige toetsenbord-navigatie op de suggestielijst:

- `ArrowDown` / `ArrowUp` — navigeer door de lijst; scrollt het actieve item automatisch in beeld (`scrollIntoView`)
- `Enter` — selecteer het actieve item
- `Escape` — sluit de picker
- Actief item: `bg-blue-50` highlight
- State: `activeIndex` (number | null)

```jsx
const handleKeyDown = e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min((i ?? -1) + 1, items.length - 1)) }
  if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max((i ?? items.length) - 1, 0)) }
  if (e.key === 'Enter' && activeIndex !== null) selectItem(items[activeIndex])
  if (e.key === 'Escape') onClose()
}
```

---

## Silhouet-overlays (preview)

- Professionele SVG-silhouetten (persoon, stoel) als JSX-path in `PreviewCanvas.jsx`
- Floor-aligned, horizontaal versleepbaar (muis-drag op het silhouet, window-level listeners)
- **Mutex**: slechts één actief via `activeOverlay: null | 'person' | 'chair'`
- State in `App.jsx`, doorgegeven als props aan `PreviewCanvas`
- Reset naar horizontaal midden bij elke `Code`-wijziging (formaatwissel)
- Gouden vulling `rgba(255,215,100,0.6)` + `feDropShadow` glow-filter
- Toggle-knoppen alleen zichtbaar bij `view === 'preview'`
