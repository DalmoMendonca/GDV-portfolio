# GDV501-P01: Chrono Aperture

Course: GDV 501 - Game Systems, Loops, and Player Experience

Public repository target: GDV501-P01-one-button-timing-game

Netlify status: Ready for deployment.

## Generic Description

Design with extreme input constraint; create readable anticipation, action, and result states; tune difficulty through timing windows.

## Specific Execution

Build a game controlled by one button only. The player must learn a timing rule, fail safely, and improve within three attempts. Include three difficulty tiers and visual/audio feedback for early, perfect, and late input.

## Game Description

Chrono Aperture is a one-button timing game about committing at exactly the right moment. A needle rotates around a dial, and the player presses once when the needle passes through the active aperture. The game has three escalating tiers, each with three attempts. The perfect window shrinks, the needle accelerates, and feedback distinguishes early, good, perfect, and late input through color, motion, score, text, and audio.

## Grading Rubric

30 pts timing design and fairness; 20 pts clarity of feedback; 20 pts complete playable states; 15 pts tuning evidence from playtests; 15 pts designer's note and accessibility.

## A-Grade Execution Notes

- One gameplay input: Space, click, or tap all perform the same one-button action.
- Three difficulty tiers: Foundation, Compression, and Aperture.
- Three attempts per tier, nine total attempts.
- Clear anticipation, action, result, completion, and restart states.
- Feedback types: target aperture, perfect window, needle color, pulse, result panel, attempt history, score, streak, and Web Audio tones.
- Accessibility basics: readable text, no required color-only information, no flashing, pointer/keyboard/touch support, restart without closing, and minimal sensory load.
- Testability: exposes `window.render_game_to_text()` and `window.advanceTime(ms)` for automated verification.

## Build Instructions

```bash
npm install
npm run dev
npm run build
```

## Expected Deliverables

- Playable build
- Source repository
- 30 to 90 second capture video or GIF
- Designer's note
- One-page postmortem
- Accessibility checklist
- Build instructions
- Public portfolio metadata

## Links

- Local project path: projects/GDV501/P01
- Public game URL: TBD after Netlify deploy
- GitHub repository: TBD
- Netlify deploy: TBD
