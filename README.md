# BackdropDesigner

Visuele webapp voor het ontwerpen van sponsor-backdrops voor Flanders Classics wielerwedstrijden.

Gebouwd met React + Vite + Tailwind CSS. Geen backend — alles draait lokaal in de browser.

---

## Mapstructuur

```
BackdropDesigner/
  dev/               ← actieve ontwikkeling
    backdrop-designer/   ← de Vite/React app
  stable/            ← productie-klare versies (niet zomaar aanpassen)
  experiments/       ← prototypes en wegwerptests
  archives/          ← oudere versies ter referentie
  templates/         ← herbruikbare opmaak/sjablonen
  input/             ← bronbestanden (sponsors, formaten)
```

---

## Snel starten

```bash
cd dev/backdrop-designer
npm install
npm run dev
```

App beschikbaar op **http://localhost:5173**

---

## Wat doet de app?

BackdropDesigner vervangt een Excel-workflow waarbij sponsors manueel in een grid werden ingevuld. De app biedt:

- **Visuele grideditor** — klik of sleep sponsors naar slots
- **Logo-bibliotheek** — ~180 sponsors met logo-preview
- **Event- en koepelbeheer** — tag sponsors per wedstrijd of groep van wedstrijden
- **Categorie-prioriteiten** — definieer niveaus (Titelsponsor, Partner…) met instelbare volgorde
- **Auto-advance** — selectie springt automatisch door in gekozen richting (↖↑↗ ←·→ ↙↓↘)
- **Opgeslagen ontwerpen** — bewaar en laad ontwerpen lokaal
- **Preview-modus** — schaalbare weergave van het eindresultaat
- **Export** — als JPEG of CSV (voor het Gridzilla Illustrator-script)

---

## Meer info

- Gebruikershandleiding: [`dev/backdrop-designer/README.md`](dev/backdrop-designer/README.md)
- Technische context voor Claude: [`CLAUDE.md`](CLAUDE.md)
