# Md. Hossain — IT Command Center

Personal website of **Md. Hossain**, IT Infrastructure Specialist in Dhaka, Bangladesh.

**Live:** https://mdhossaincloud.github.io/

## What's inside

| Path | Purpose |
|---|---|
| `index.html`, `de/` `fr/` `es/` `it/` `pt/` `nl/` `zh/` | Home page in 8 languages: hero with 3D network, about with scroll-assembled portrait, experience, expertise, services, Fixible IT feature, insights lab, achievements, contact |
| `projects/*/index.html` | Case studies: Hossain OneDesk, OneDesk Cheque Writer, Fixible IT, this website |
| `knowledge/index.html` | Knowledge Hub: learning paths, searchable library, IT glossary |
| `knowledge/<slug>/` | Written guides, generated from `_build/articles/*.md` |
| `404.html` | Not-found page (root-absolute paths) |
| `assets/css/site.css` | Design system: tokens, dark/light themes, components |
| `assets/js/site.js` | Theme, mobile menu, scroll progress, active section, copy email |
| `assets/js/scene.js` | Dependency-free 3D network scene (Canvas 2D + perspective projection) |
| `assets/js/lab-data.js`, `lab.js` | Infrastructure Lab content and renderer |
| `assets/js/articles.js`, `hub.js` | Published guides list and Knowledge Hub search |
| `assets/js/bg.js` | Background data sphere that dissolves into binary on scroll |
| `assets/js/rack.js` | Scroll-driven 3D server rack that dissolves into binary |
| `assets/js/calc.js` | CCTV storage calculator used by one guide |
| `assets/media/` | 8-second motion loop (MP4) and poster |
| `assets/img/hossain-*.jpg` | Portrait and avatar |
| `assets/fonts/` | Self-hosted Archivo and IBM Plex, Latin subset (SIL Open Font License) |
| `_build/i18n/*.json` | Translations; English is the source and fallback |
| `cv/MD_Hossain_CV.pdf` | Downloadable CV |
| `_build/` | Page sources and `build.py` (not published by GitHub Pages) |
| `_build/trees/*.json` | Folder-structure snapshots (names only) shown on project pages; regenerate with `_build/tools/make_tree.py` |

## Editing content

1. Edit the page source in `_build/pages/` and text in `_build/i18n/` (not the generated HTML).
2. Run `python3 _build/build.py` to regenerate the pages and `sitemap.xml`.
3. Preview locally: `python3 -m http.server 8000` and open http://localhost:8000.
4. Commit both the source and the generated files.

Lab topics are data in `assets/js/lab-data.js`. Guides are Markdown files in `_build/articles/` with a short front-matter block; the build creates each page and regenerates `assets/js/articles.js`.

## Principles

- Static HTML, CSS and JavaScript. No framework, no runtime dependencies.
- Dark theme by default, light theme remembered per visitor; reduced motion respected.
- Every professional claim is traceable to the CV or a public verification link.
- Lab diagrams are generic and educational; no employer configurations, addresses or credentials are published.

Previous design (Cyber Command v2) is preserved at tag `backup/cyber-command-v2`.
