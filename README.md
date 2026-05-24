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

## Commands

```bash
npm install
npm run dev
npm run build
```
