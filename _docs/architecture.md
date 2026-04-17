# Architectuur & Database

## Stack & Omgeving

| | |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| State | `useState` + **Supabase** (PostgreSQL + Storage) |
| Taal | JSX (geen TypeScript) |
| Dev server | `npm run dev` → `http://localhost:5173` |
| Hosting | Vercel (auto-deploy bij git push naar `main`) |
| Database | Supabase — project `holypriabntrbxpnsjfe`, EU West |
| Locatie | `apps/BackdropDesigner/dev/backdrop-designer/` |

---

## Projectstructuur

```
apps/BackdropDesigner/
  CLAUDE.md                      — index + verwijzingen naar _docs/
  _docs/                         — thematische documentatie
  dev/
    backdrop-designer/           — de Vite/React webapp
      src/
        App.jsx                  — Hoofdcomponent, state-beheer, layout
      components/                — UI-componenten (main app)
      admin/                     — admin-sectie (auth + CRUD panels)
      utils/                     — Supabase client, db-functies, helpers
      data/                      — statische JSON (sponsors, fallback formats)
      scripts/                   — Node.js upload-scripts
    batch_export_logos_v1_DEV.jsx  — ExtendScript: batch export vanuit Illustrator
  vercel.json                    — build/output/rewrites voor Vercel
```

Zie [components.md](components.md) voor een volledig componentoverzicht.

### sponsors.json formaat

```json
{ "partner": "A WARE", "filename": "A_WARE" }
```

- `partner`: weergavenaam (met spaties), sleutel voor alle tags/data
- `filename`: bestandsnaam zonder extensie → Supabase Storage URL via `logoUrl(filename)`
- Geen `url`-veld (was FTP-pad uit oude Excel-workflow, niet meer nodig)
- `BLANK` staat **niet** in de JSON — die is hardcoded in `App.jsx`

---

## State & Persistentie (Supabase)

Alle persistente state wordt opgeslagen in **Supabase (PostgreSQL)** via `src/utils/db.js`. Alle functies zijn `async` en worden fire-and-forget aangeroepen met `.catch(console.error)`.

### Supabase tabellen

| Tabel | Inhoud |
|---|---|
| `designs` | Opgeslagen ontwerpen — `id, name, format_code, format, slots, folder, saved_at, updated_at` |
| `events` | Eventcodes — `code, sort_order` |
| `event_groups` | Koepels — `name, event_codes` |
| `sponsor_event_tags` | Event-tags + categorie per sponsor per event — `sponsor_name, event_code, category` |
| `sponsor_group_assignments` | Koepel-assignments — `sponsor_name, group_name, category` |
| `settings` | Key-value opslag — `key, value` (o.a. `category_list`, `static_imported`, `default_aspect`) |
| `custom_sponsors` | Sponsors toegevoegd via de admin — `name, logo_data_url` |
| `logo_overrides` | Custom logo-overrides voor bestaande sponsors — `sponsor_name, logo_data_url` |
| `cell_presets` | Celdimensie-presets — `id, data` |
| `canvas_presets` | Canvas-presets — `id, data` |
| `format_presets` | Gridformaten — `id (text), data (jsonb), sort_order (int)` — `data` bevat alle formaatsvelden incl. `tags: []` |

Alle tabellen hebben een nullable `user_id uuid` kolom voor toekomstige multi-user migratie (RLS).

### Kritisch patroon — per-sponsor saves

`sponsor_event_tags` slaat zowel event-tags als per-event categorieën op in dezelfde tabel. Gebruik altijd de **per-sponsor** functies:

- **`saveSponsorTags(sponsorName, eventCodes, categoryMap)`** — verwijdert alle rijen voor die sponsor, voegt de nieuwe in. Raakt andere sponsors niet aan.
- **`saveSponsorGroup(sponsorName, groupMap)`** — idem voor `sponsor_group_assignments`.

**Nooit** meer `saveSponsorEventData(tags, sponsorCategories)` gebruiken voor nieuwe code. Die functie doet een DELETE WHERE sponsor_name != '' (= alles), gevolgd door een INSERT van de volledige `tags` state. Als `tags = {}` (stale state bij snel opslaan) wist dit de hele tabel. De functie bestaat nog in `db.js` voor backwards compat maar is deprecated.

### Mount — parallel laden

In `App.jsx` laadt een `useEffect` op mount alle databronnen parallel via `Promise.all`. Pas daarna wordt `dbLoading` op `false` gezet.

### Env vars (niet gecommit)

```
VITE_SUPABASE_URL=https://holypriabntrbxpnsjfe.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable anon key>
```

Instellen via `.env.local` (lokaal) en Vercel environment variables (productie).

---

## Kernconcepten — datamodel

### Sponsors & Slots

- `slots`: `string[]` — platte array van sponsornamen (lengte = cols × rows)
- `BLANK` = leeg slot (speciale ingebouwde sponsor)
- Sponsors worden toegewezen via klikken of drag-and-drop

### Events & Koepels

- **Events**: codes zoals AGR, BCC, CXWC, ROAD, TSP
- **Koepels**: groeperingen van events (bv. "Grote Rondes")
- Een sponsor kan getagd worden op event-niveau (directe tag) of koepel-niveau (via `sponsorGroups`)
- Elke event kan maar aan 1 koepel worden toegewezen
- `sponsor_event_tags`: directe event-koppeling per sponsor
- `sponsor_group_assignments`: koepel-koppeling
- `event_groups`: welke events zitten in welke koepel

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
- Opgeslagen in `localStorage` (enige overblijvende localStorage-key)

---

## Ontwerpbeslissingen

- **Supabase als backend**: alle data in PostgreSQL + Storage; `localStorage` enkel nog voor `advanceDir`
- **Geen TypeScript**: bewuste keuze voor snelheid en leesbaarheid
- **Één `categoryList`**: vroeger waren er twee aparte lijsten (per-event en per-koepel) — samengevoegd
- **ManageList defaultCollapsed**: prop zodat elk blok een eigen standaardtoestand heeft
- **`editingKoepelEvent` state**: koepeldropdown per event is alleen zichtbaar na klikken op een icoon
- **`advanceDir` in localStorage**: de gekozen richting blijft bewaard tussen sessies
