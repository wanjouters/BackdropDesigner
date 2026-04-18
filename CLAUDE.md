# BackdropDesigner — Project Context voor Claude

BackdropDesigner is een **React-webapp** (Vite + Tailwind CSS v4) voor het visueel ontwerpen van sponsor-backdrops voor Flanders Classics wielerwedstrijden. Gebruikers wijzen sponsors toe aan gridslots, bekijken een live preview en exporteren naar CSV (voor het Gridzilla Illustrator-script) of JPEG. State wordt persistent opgeslagen in **Supabase** (PostgreSQL + Storage). Productie draait op **Vercel**. Locatie van de webapp-code: `dev/backdrop-designer/`.

---

## Waar vind ik wat?

De documentatie is opgesplitst per thema in de `_docs/` map. Kies de juiste file voor de vraag waar je aan werkt:

| Thema | File | Wanneer lezen |
|---|---|---|
| **Architectuur & database** | [`_docs/architecture.md`](_docs/architecture.md) | Stack, Supabase-tabellen, db-patronen, env vars, datamodel (sponsors/events/koepels/categorieën), filterlogica |
| **Componenten** | [`_docs/components.md`](_docs/components.md) | Welk bestand doet wat — main app én admin; utils-overzicht |
| **Design / UX patronen** | [`_docs/design-system.md`](_docs/design-system.md) | Modals, × wis-knoppen, delete-mode, autocomplete, kleuren, toolbar, lege staat, silhouetten |
| **Workflows** | [`_docs/workflows.md`](_docs/workflows.md) | Logo-upload pipeline (Illustrator → Supabase), `batch_export` script, `upload-logos.js`, exportformaten, Vercel, Edge Function |
| **Conventies** | [`_docs/conventions.md`](_docs/conventions.md) | Naamgeving, sponsor/event/koepel model, DB-aanroepen, React-patronen, ExtendScript, Git, docs |
| **Changelog** | [`_docs/changelog.md`](_docs/changelog.md) | Wat is er per sessie veranderd (nieuwste bovenaan) |
| **Roadmap** | [`_docs/roadmap.md`](_docs/roadmap.md) | Openstaande punten + lange-termijn UXP-visie voor Gridzilla |

Het README.md in de repo-root is voor externe lezers; dit CLAUDE.md + `_docs/` is voor Claude.

---

## Voor Claude — hoe deze docs gebruiken

**Altijd eerst lezen vóór je begint:**
1. [`_docs/conventions.md`](_docs/conventions.md) — naamgeving, sponsor/event/koepel-model, algemene regels
2. [`_docs/architecture.md`](_docs/architecture.md) — hoe data is opgebouwd in Supabase

**Daarna afhankelijk van het soort werk:**

| Soort werk | Extra lezen |
|---|---|
| UI / modal / button toevoegen | [`_docs/design-system.md`](_docs/design-system.md) — blijf consistent met bestaande patronen |
| Component aanpassen | [`_docs/components.md`](_docs/components.md) — check welke verantwoordelijkheid waar hoort |
| Logo-pipeline / export / Illustrator | [`_docs/workflows.md`](_docs/workflows.md) |
| Nieuwe DB-functie | [`_docs/architecture.md`](_docs/architecture.md) — let op per-sponsor save patroon, **geen** `saveSponsorEventData` meer |
| Reviewen wat er laatst veranderd is | [`_docs/changelog.md`](_docs/changelog.md) |

**Bij het bijwerken van de docs:**
- Nieuwe sessie → nieuwe entry **bovenaan** in [`_docs/changelog.md`](_docs/changelog.md); bestaande entries niet wijzigen
- Nieuw UX-patroon → toevoegen aan [`_docs/design-system.md`](_docs/design-system.md) zodat het herbruikbaar wordt
- Nieuw component of grote structuurwijziging → [`_docs/components.md`](_docs/components.md) en/of [`_docs/architecture.md`](_docs/architecture.md) bijwerken
- CLAUDE.md zelf blijft kort — alleen index; inhoud hoort in `_docs/`

**Globale regels uit `/Projects/CLAUDE.md`** (repo-root parent) blijven leidend voor ExtendScript-compatibiliteit, Adobe-standaarden, git-workflow en file-safety. Project-specifieke regels hier hebben voorrang bij conflict.

---

## Sessie afsluiten — trigger: "sessie afsluiten"

Wanneer de gebruiker **"sessie afsluiten"** zegt, voert Claude altijd deze stappen uit in volgorde:

1. **`_docs/changelog.md`** — controleer of er een entry is voor deze sessie; zo niet, voeg die toe bovenaan met alles wat veranderd is
2. **`_docs/components.md`** — bijwerken als er componenten bij zijn gekomen, hernoemd of verwijderd
3. **`_docs/architecture.md`** — bijwerken als DB-structuur, tabellen of datamodel zijn gewijzigd
4. **`_docs/design-system.md`** — bijwerken als er nieuwe UX-patronen zijn toegevoegd
5. **`CLAUDE.md`** (dit bestand) — bijwerken als er nieuwe project-conventies of beslissingen zijn genomen
6. **Commit** — met een beknopte boodschap die de sessie samenvat (`feat:`, `fix:`, `refactor:` prefix)
7. **Push** naar remote (`git push`)

Claude voert deze stappen **automatisch** uit zonder extra goedkeuring te vragen, omdat "sessie afsluiten" zelf de goedkeuring is.

---

## Snelle feiten

- **Supabase project**: `holypriabntrbxpnsjfe`, EU West
- **Dev server**: `npm run dev` → `http://localhost:5173` (vanuit `dev/backdrop-designer/`)
- **Env vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (niet committen; zie `.env.local` lokaal + Vercel env)
- **Sponsor namen**: UPPERCASE, spaties. Filenames: underscores. Lege slots = `BLANK`.
- **Beheer** (tags, koepels, formaten, logo's, users): allemaal in de **admin** (`src/admin/`), niet meer in de main app.
