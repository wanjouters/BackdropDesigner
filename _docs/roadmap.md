# Roadmap & Openstaande punten

## Openstaande verbeterpunten

| Punt | Beschrijving |
|------|-------------|
| **Auto-upload vanuit CEP** | `File.execute()` werkt niet voor `.command` bestanden vanuit CEP-extensies (bv. LoaderScriptPanel). Handmatig commando als fallback. Alternatieve aanpak te bekijken. |
| **CSV-export escaping** | Sponsornamen met komma's of aanhalingstekens breken het CSV-formaat. |
| **FormatPickerModal UI** | (Historisch) "Annuleren" kreeg focus-ring bij klikken — niet meer relevant, modal is verwijderd. |
| **Multi-user / login** | Alle tabellen hebben al `user_id uuid` (nullable). RLS + authenticatie toe te voegen wanneer nodig. |

---

## Toekomstvisie — Hosting, login & Gridzilla-integratie

### Fase 1 — Online hosting ✅ GEDAAN
- App gehost via **Vercel** (automatische deploy bij git push naar `main`)
- Logo's via **Supabase Storage** (public bucket `logos`) — niet meer in de repo

### Fase 2 — Database & gedeelde data ✅ GEDAAN (single-user)
- Alle data via **Supabase PostgreSQL** (`db.js`)
- Logo's via **Supabase Storage** (`logoUrl.js`)
- Ontwerpen, events, tags, categorieën, presets — alles in de cloud
- Multi-user / login: structuur aanwezig (`user_id` kolom), authenticatie nog niet geïmplementeerd

### Fase 3 — Gridzilla rechtstreeks gekoppeld aan de app (lange termijn)

**Huidige situatie:**
```
BackdropDesigner (browser)  →  CSV  →  Gridzilla (ExtendScript in Illustrator)
```

**Tussenstap (Optie A — na fase 1):**
CSV vervangen door een rijkere JSON-export. Gridzilla leest het JSON-bestand in via `File.openDialog()`. Geen CSV-beperkingen meer, alle info beschikbaar (marges, kleuren, header-type, presets…).

**Einddoel (Optie C — na fase 2):**
Gridzilla omzetten van ExtendScript naar een **UXP-plugin** (Unified Extensibility Platform — Adobe's moderne vervanging voor ExtendScript).

```
Illustrator UXP-plugin  →  fetch()  →  Supabase  →  bouwt grid rechtstreeks
```

**Voordelen UXP:**
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

---

## Eigenaar / Context

- **Jan Wouters** — freelance grafisch ontwerper, Flanders Classics
- Eindgebruikers: collega's van Flanders Classics (niet-technisch)
- Downstream: Gridzilla Illustrator-script (JSX/ExtendScript) dat de CSV omzet naar een Illustrator-backdrop
