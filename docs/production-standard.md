# Production Standard

This repository is a single public monorepo for the full master's portfolio. Every game lives under `projects/<COURSE>/<P##>/` and links back to this repository. Individual games may have separate Netlify sites, but they do not get separate GitHub repositories.

## Quality Bar

The portfolio must read like a graduate-level body of practice, not a generated catalog. A project is not acceptable just because it runs. Each game needs a specific design point of view, a coherent visual language, clear onboarding, and a game loop that can be understood without reading the syllabus.

Projects P01-P09 in each course are focused studies. They can be compact, but they still need to feel authored. They should vary sharply across:

- Camera and presentation: top-down, side-view, board-game, first-person approximation, split-screen, tactile interface, textual, audio-first, spatial map, toy-box, arcade cabinet, etc.
- Visual language: different composition, palette, typography, texture, rhythm, and use of negative space.
- Interaction model: keyboard, mouse, touch, drag/drop, menu-as-play, one-button, timing, route planning, drawing, typing, local multiplayer, simulation tuning, etc.
- Game genre: puzzle, arcade, stealth, tactics, narrative, management, racing, rhythm, exploration, deck/board, physics toy, tool-game, and hybrid forms.

No course should be delivered as ten versions of the same canvas shell. Reusable infrastructure is fine; reusable art direction is not.

## P10 Capstone Rule

The final project in every course is a masterpiece requirement. It must synthesize the course concepts into a substantial game that could plausibly support a Steam page, trailer, press kit, and public playtest.

P10 requirements:

- A full game arc with title, onboarding, multiple mechanics or levels, progression, end state, restart, and meaningful mastery.
- At least 15-30 minutes of intended first-session play, even if represented as a vertical slice.
- A distinctive market-facing identity: name, capsule-worthy key art direction, readable UI, audio direction, and store-page pitch.
- Course synthesis: the game must visibly tie together the course's core competencies rather than simply repeat one weekly exercise.
- Production evidence: README, build instructions, feature list, known issues, accessibility notes, and postmortem.
- Validation: local build, Playwright smoke, screenshot review, live Netlify smoke, and portfolio link check.

Existing P10s created before this standard are considered playable placeholders until they are reworked to meet this capstone bar.

## Implementation Policy

Future work proceeds in this order:

1. Preserve the monorepo and remove obsolete per-project GitHub repositories.
2. Rework existing P10 projects into course capstones before claiming a course is portfolio-complete under the new standard.
3. Build future courses with P01-P09 as diverse focused studies and P10 as a substantial capstone.
4. Publish every game on Netlify when possible.
5. Keep source links pointed at `games-portfolio`.

The goal is not 120 generic games. The goal is 120 playable arguments for design competence, with 12 major capstones that prove professional-level synthesis.
