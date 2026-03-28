# BackdropDesigner

Visuele tool voor het ontwerpen van sponsor-backdrops voor Flanders Classics wielerwedstrijden.

---

## Starten

```bash
cd apps/BackdropDesigner/dev/backdrop-designer
npm install
npm run dev
```

Opent op **http://localhost:5173**

---

## Wat doet de app?

1. **Kies een gridformaat** — links uit de lijst (bv. MIXEDZONE_ROAD_10x8, FLASH_ROAD_16x13…)
2. **Wijs sponsors toe** — klik een slot aan, klik dan een logo in het rechterpaneel. Of sleep een logo rechtstreeks op een slot.
3. **Meerdere slots tegelijk** — Shift+klik om meerdere slots te selecteren, dan één logo toewijzen aan alle geselecteerde slots tegelijk.
4. **Auto-advance** — na elke toewijzing springt de selectie automatisch door. Kies de richting (↖↑↗ ←·→ ↙↓↘) rechtsonder in het logo-paneel.
5. **Preview** — schakel bovenaan naar "Preview" voor een schaalbare weergave.
6. **Exporteer** — als JPEG of CSV (voor het Gridzilla Illustrator-script).
7. **Sla op** — bewaar het huidige ontwerp via "Opslaan" in de header. Laad het later terug via het "Opgeslagen" paneel links.

---

## Sponsorbeheer (tandwiel-icoon rechtsboven in logo-paneel)

### Events
Voeg events toe (bv. AGR, BCC, ROAD) en tag elke sponsor aan een of meerdere events via het ⚙-icoon per logo.

### Koepels
Groepeer events onder een koepel (bv. "Vlaamse klassiekers"). Een event kan maar aan één koepel worden toegewezen.

### Categorieën
Definieer niveaus (bv. Titelsponsor, Co-sponsor, Partner…). De volgorde bepaalt de prioriteit bij het filteren: hogere categorieën verschijnen bovenaan.

### Eventfilter
De dropdown bovenaan het logo-paneel filtert de zichtbare sponsors per event. Bij een actieve filter worden sponsors gegroepeerd per categorie, met categoriekoppen erboven.

---

## Opgeslagen ontwerpen

- **Opslaan**: klik "Opslaan" in de header → geef een naam → bevestig
- **Laden**: open het "Opgeslagen" paneel links → klik een ontwerp
- **Hernoemen**: hover over een ontwerp → potlood-icoon
- **Verwijderen**: hover over een ontwerp → prullenbak-icoon
- Ontwerpen worden lokaal opgeslagen in de browser (localStorage)

---

## Sneltoetsen

| Actie | Toets |
|---|---|
| Geselecteerde slots leegmaken | Backspace / Delete |
| Meerdere slots selecteren | Shift + klik |

---

## Technisch

- **React 19** + **Vite** + **Tailwind CSS v4**
- Geen backend — alle data in `localStorage`
- Sponsors: `src/data/sponsors.json`
- Formaten: `src/data/formats.json`
- Persistentie: `src/utils/sponsorTags.js`

---

## Build

```bash
npm run build
```

Uitvoer in `dist/` — statische bestanden, direct te hosten.
