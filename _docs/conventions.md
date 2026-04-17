# Conventies

## Naamgeving

- **Sponsornamen** altijd in UPPERCASE (`A WARE`, `LOTTO`, `JUMBO VISMA`)
- **Bestandsnamen**: spaties → underscores (`A WARE` → `A_WARE`)
- **Lege slots** exporteren als `BLANK`
- **Grid-indexering**: kolommen `C1…Cn`, rijen `R1…Rn`
- **Componenten**: PascalCase (`LogoLibrary.jsx`)
- **Utils**: camelCase (`logoUrl.js`)
- **Bestandsnamen algemeen** in de rest van de studio: kebab-case / lowercase_with_underscores (ExtendScript-regel)

---

## Sponsor / event / koepel model

- Een **sponsor** is een partner met een logo in Supabase Storage
- Een **event** is een wedstrijd (code zoals `AGR`, `BCC`, `CXWC`, `ROAD`)
- Een **koepel** is een groepering van events (bv. "Spring Classics")
- Een sponsor kan tegelijk:
  - Directe event-tag hebben (`sponsor_event_tags`)
  - Koepel-assignment hebben (`sponsor_group_assignments`)
- Koepelpartners zijn zichtbaar bij **elk** event dat in die koepel zit
- Elk event hoort bij max. 1 koepel
- Let op naamgeving: "Spring Classics" ≠ "Classic Series" — beide zijn koepels met eigen events

---

## Database-aanroepen

- Alle `db.js`-functies zijn `async`
- Fire-and-forget met `.catch(console.error)` bij state-wijzigingen
- **Nooit** `saveSponsorEventData` gebruiken in nieuwe code — gebruik `saveSponsorTags` / `saveSponsorGroup` per sponsor (zie [architecture.md](architecture.md))
- Op mount: alles parallel via `Promise.all`, daarna `dbLoading = false`

---

## React-patronen

- Geen TypeScript — bewuste keuze
- `useMemo` voor dure afleidingen (`buildGroups`, `allTags`, `mergedCustomLogos`)
- `useRef + useEffect` voor centering / scroll-sync die wacht op bijgewerkte derived values (zoals `baseScale`)
- State zo hoog mogelijk — `App.jsx` beheert o.a. `activeOverlay`, kinderen ontvangen via props

---

## ExtendScript (`batch_export_logos_v1_DEV.jsx`)

Moet ES3-compatibel blijven:

- Geen `let`, `const`, arrow functions, template literals, destructuring, `import`/`export`
- Alles met `var`
- String concatenation i.p.v. template literals
- IIFE-wrap om globals te voorkomen
- Altijd `app.documents.length` checken vóór `app.activeDocument`
- Prefs in `Folder.userData + "/BackdropDesigner"`, bestand `batch_export.prefs`, key=value-formaat

Zie ook de globale `CLAUDE.md` (repo-root `/Projects/CLAUDE.md`) voor de volledige ExtendScript-standaard.

---

## Git

- Commit messages: concise, `feat:` / `fix:` / `refactor:` / `docs:` prefix
- **Nooit** force-pushen
- **Nooit** secrets of `.env` committen
- Commit en push alleen op expliciete vraag van de gebruiker

---

## Documentatie

- `CLAUDE.md` blijft kort — alleen index en "waar vind ik wat?"
- Thematische documentatie in `_docs/`
- Nieuwe sessies → changelog-entry bovenaan in `_docs/changelog.md`, **nooit** bestaande entries wijzigen
- Nieuwe patronen → toevoegen aan `_docs/design-system.md` zodat ze consistent terugkomen
