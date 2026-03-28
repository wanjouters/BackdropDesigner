# Gridzilla Web App — Project Context

## Wat is Gridzilla?

Gridzilla is een workflow-tool voor het automatisch genereren van sponsor-backdrops voor wielerwedstrijden (o.a. Flanders Classics evenementen). De naam "Gridzilla" verwijst naar het Illustrator-script dat een grid-backdrop genereert op basis van een CSV-inputbestand.

## Huidige workflow (Excel-gebaseerd)

```
Flanders Classics vult Excel in
        ↓
Export tab → CSV (handmatig kopiëren/exporteren)
        ↓
Jan importeert CSV in Gridzilla (ExtendScript/JSX in Adobe Illustrator)
        ↓
Illustrator genereert backdrop-bestand met sponsorgrid
```

## Doel van de webapp

De webapp vervangt de Excel-input en maakt de workflow sneller, foutlozer en toegankelijker voor niet-technische gebruikers (Flanders Classics collega's). De CSV-output blijft hetzelfde — Gridzilla (Illustrator script) hoeft niet te veranderen.

---

## Datastructuur

### Logo database

Elke sponsor heeft drie velden:

| Veld         | Voorbeeld                                               |
|--------------|---------------------------------------------------------|
| Partner      | `A WARE`                                                |
| Bestandsnaam | `A_WARE`                                                |
| Link         | `https://flcs-upload.com/content/SPONSORS/A_WARE.png`  |

Huidige database: ~180 sponsors. Opgeslagen in het Excel-tabblad "Logo database". De bestandsnaam is de partnernaam met spaties vervangen door underscores. Lege/BLANK sponsor = placeholder (geen logo).

### Gridformaten

Er zijn momenteel twee gridtypes:

#### 1. Interview Backdrop
- Doel: Achtergrond voor persconferenties / mixed zone interviews
- Grid: 8 rijen × 4 kolommen = **32 sponsorslots**
- Sponsors herhalen zich over de rijen (roterende volgorde)
- Teller rechts toont hoe vaak elke sponsor voorkomt

#### 2. MIXEDZONE_ROAD_10x8
- Formaat: 400 × 220 cm
- Grid: 8 rijen × 10 kolommen = **80 sponsorslots**
- Export tab: C1–C10 (kolommen), R1–R8 (rijen)

### CSV-exportformaat (uit Export tab)

Het huidige exportformaat is een raster van sponsor-namen:

```
C1,C2,C3,C4,C5,C6,C7,C8,C9,C10
PAUWELS SAUZEN,VELUX,VIESSMANN,...
...
```

Lege of niet-ingevulde slots bevatten de waarde `BLANK`.

---

## Gewenste functionaliteiten webapp

### Must-have
- [ ] Selecteer een gridtype (Interview / MixedZone / andere formaten later)
- [ ] Sponsorlijst laden vanuit de logo database (CSV of hardcoded JSON)
- [ ] Sponsors toewijzen aan gridslots (manueel of automatisch verdeeld)
- [ ] Live frequentietelling per sponsor (zoals in Excel)
- [ ] Validatie: sponsor-naam moet bestaan in logo database
- [ ] CSV-export in het formaat dat Gridzilla verwacht

### Nice-to-have
- [ ] Drag-and-drop interface voor slots
- [ ] Logo-preview per sponsor (via de URL in de database)
- [ ] Automatische verdeling op basis van prioriteit/categorie
- [ ] Opslaan en laden van configuraties (per evenement)
- [ ] Meerdere gridformaten in één sessie beheren
- [ ] Spelfout-detectie (bv. STIHLL vs STIHL)

---

## Bekende issues in huidige Excel-template

- `STIHLL` (dubbele L) in tabbladen "Interview Tabor" en "Interview Sardinië" — correcte naam is `STIHL`
- Logo database tabblad heeft 1M+ lege rijen (Excel-artifact, geen data)
- Export tab is altijd leeg bij oplevering — collega's vullen dit manueel in vanuit de grid-tabbladen

---

## Technische aanbevelingen

- **Frontend:** React (Vite) — simpel te hosten, geen backend nodig voor basisfunctionaliteit
- **Styling:** Tailwind CSS
- **Data:** Logo database als JSON-bestand inladen (gegenereerd uit Excel)
- **CSV export:** Client-side genereren met `Blob` + download link
- **Geen backend vereist** voor MVP — alles client-side

---

## Bestaande bestanden

- `FLCS_Template_MIXEDZONE_ROAD_10x8.xlsx` — het originele Excel inputbestand
  - Tabbladen: Interview Tabor, Interview Sardinië, Interview Namen, MIXEDZONE_ROAD_10x8, MIXEDZONE_ROAD_10x8 Export, Logo database

---

## Conventies

- Sponsor-namen altijd in UPPERCASE (zoals in de bestaande data)
- Bestandsnamen: spaties → underscores (bv. `A WARE` → `A_WARE`)
- Lege slots altijd als `BLANK` exporteren, nooit leeg laten
- Grid-indexering: kolommen als C1–Cn, rijen als R1–Rn

---

## Contactpersoon / eigenaar

- **Jan** — freelance grafisch designer, werkt dagelijks met Adobe Illustrator, InDesign, ExtendScript/JSX
- Bouwt en beheert het Gridzilla Illustrator-script
- Flanders Classics zijn de eindgebruikers van de webapp (input-kant)
