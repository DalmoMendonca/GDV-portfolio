# GDV501-P10: Festival Signal

Course: GDV 501 - Game Systems, Loops, and Player Experience

Public repository target: games-portfolio/projects/GDV501/P10

## Generic Description

Create a course-ending capstone that synthesizes loops, constraints, feedback, pacing, onboarding, and public-play readability into a complete festival-ready game.

## Specific Execution

Explore a three-night festival, route signal beams with rotating mirrors, visit lit districts to solve their local public-play needs, and keep the crowd delighted through escalating procession goals. The game combines movement, spatial routing, readable state, short-term risk, timed pressure, and a complete ending.

## Design Standard

This project is the GDV501 capstone. It is built as a finished portfolio artifact: title, onboarding, multi-night progression, readable controls, deterministic test hooks, responsive canvas presentation, accessibility basics, and Netlify-ready deployment.

## Course Synthesis

- **Loops:** move, inspect, rotate, visit, solve, score, advance to the next night.
- **Constraints:** limited time, finite mirror orientations, required districts, and a crowd score that drops after wasteful rotations.
- **Feedback:** beam colors, district states, log messages, progress meter, particles, proximity rings, and night reports.
- **Pacing:** each night expands the required route and gives the player more to manage.
- **Public play:** goals and current state are readable from the left panel and the map, so a spectator can understand the run quickly.

## Controls

WASD or arrow keys move. Space interacts with nearby mirrors and districts. Click a mirror to rotate it. M toggles the map, X toggles reduced motion, F toggles fullscreen, and R restarts.

## Accessibility Notes

The game uses shape, labels, text state, and color together rather than color alone. It supports keyboard and pointer interaction, includes a reduced-motion toggle, and avoids hidden information in the scoring path.

## Build Instructions

```bash
npm install
npm run dev
npm run build
```

## Links

- Public game URL: https://gdv501-p10-festival-signal.netlify.app
- GitHub repository: https://github.com/DalmoMendonca/games-portfolio/tree/master/projects/GDV501/P10
- Netlify deploy: https://gdv501-p10-festival-signal.netlify.app
