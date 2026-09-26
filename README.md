# Teriberka promo site

One-page informational site (Russian) about the village of Teriberka,
Murmansk Oblast. Content-marketing style: no advertising, editorial tone.
Static build — no framework, no build step.

## Structure
- `index.html` — the whole page (markup + inline JSON-LD)
- `css/styles.css` — styles (dark Arctic theme, responsive)
- `js/main.js` — nav, scroll reveals, lightbox, back-to-top
- `assets/img/` — photos downloaded from Wikimedia Commons (free licenses,
  attribution in the page footer)
- `assets/fonts/` — Prata (OFL), self-hosted cyrillic + latin subsets

## Run locally
```
python -m http.server 8080   # from this directory
# open http://localhost:8080
```

## Deployment
GitHub Pages, repo `weissfl/teriberka-promo`, branch `main`, root.
URL: https://weissfl.github.io/teriberka-promo/

## Content provenance
Facts researched 2026-09-26 with a two-independent-source rule — see
`../research/sources.md` for the full list of sources and conflicts.
