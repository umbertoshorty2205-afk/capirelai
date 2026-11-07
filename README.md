# Capire l'AI — Sito di divulgazione sull'intelligenza artificiale

Sito statico generato con [Astro](https://astro.build/) per il progetto **capirelai.com**: divulgazione sull'intelligenza artificiale in italiano.

## Struttura del progetto

```
src/
├── content/
│   ├── concetti/          # Articoli sui concetti fondamentali
│   ├── guide/             # Guide pratiche
│   ├── prove/             # Test ed esperimenti sul campo
│   └── aggiornamenti/     # Novità del settore
├── layouts/
│   └── MainLayout.astro   # Layout principale con navigazione
├── pages/
│   ├── index.astro        # Homepage
│   ├── concetti/index.astro
│   ├── guide/index.astro
│   ├── prove/index.astro
│   ├── aggiornamenti/index.astro
│   └── chi-sono/index.astro
├── styles/
│   └── global.css         # CSS nativo (no framework)
└── content.config.ts      # Schema Zod per le collection
```

## Schema articoli

Ogni articolo (file `.md` in `src/content/*`) ha questo frontmatter:

```yaml
---
titolo: "Titolo dell'articolo"
descrizione: "Breve descrizione per anteprime e SEO"
data: 2024-12-01
autore: "Nome autore"
---
```

## Comandi

| Comando | Descrizione |
|---------|-------------|
| `npm install` | Installa le dipendenze |
| `npm run dev` | Avvia il server di sviluppo su `http://localhost:4321` |
| `npm run build` | Genera il sito statico in `dist/` |
| `npm run preview` | Anteprima locale del build (`dist/`) |

## Sviluppo locale

```bash
npm install
npm run dev
```

Apri `http://localhost:4321` nel browser.

## Pubblicazione

Il sito è **statico** (`output: "static"` in `astro.config.mjs`). La cartella `dist/` generata da `npm run build` può essere deployata su:

- **GitHub Pages** — push della cartella `dist/` su branch `gh-pages` o via Actions
- **Netlify** — collega il repo, build command: `npm run build`, publish dir: `dist`
- **Vercel** — importa il repo, framework preset: Astro
- **Cloudflare Pages** — build command: `npm run build`, output dir: `dist`
- **Qualsiasi hosting statico** — carica il contenuto di `dist/` via FTP/SFTP/CLI

### Esempio: GitHub Actions per GitHub Pages

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
```

## Requisiti

- Node.js 18+ (consigliato 20+)
- npm 9+

## Licenza

Contenuti: CC BY 4.0 — Codice: MIT