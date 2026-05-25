# games-portfolio

Monorepo for the Master of Video Game Design and Development portfolio.

The portfolio and all 120 project folders live here. Each project is structured so it can stand alone if needed, but source control stays consolidated in this repository to avoid one repository per assignment.

## Structure

- `src/` - portfolio website source.
- `projects/<COURSE>/<P##>/` - standalone project folders.
- `projects/GDV501/P01` through `projects/GDV501/P10` - currently playable GDV501 exemplars.
- `tools/` - scaffolding, generation, repair, and build-copy utilities.

## Deployment Model

The portfolio deploys to Netlify as one site. Individual projects may also deploy to their own Netlify sites, but their source links point back to the matching subfolder in this monorepo.

## Production Standard

This portfolio is governed by [docs/production-standard.md](docs/production-standard.md). The short version: P01-P09 in each course are focused playable studies, while every P10 is a substantial course capstone that must synthesize the course into a full, portfolio-defining game. Existing early P10s are playable placeholders until reworked to meet that capstone bar.

The P10 roadmap lives in [docs/p10-masterpiece-roadmap.md](docs/p10-masterpiece-roadmap.md).

## Commands

```bash
npm install
npm run dev
npm run build
```
