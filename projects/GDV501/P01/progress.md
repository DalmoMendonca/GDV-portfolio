Original prompt: Fully code the first project for the first course as an exemplary A-grade execution.

## Progress

- Implemented Chrono Aperture as a one-button timing game with three difficulty tiers, three attempts per tier, early/good/perfect/late feedback, audio cues, score, streaks, final ranking, restart flow, and clear start/result/end states.
- Added deterministic test hooks: `window.render_game_to_text` and `window.advanceTime(ms)`.
- Added Vite build scripts and Netlify-ready configuration.
- Ran production-preview Playwright validation successfully and adjusted HUD message placement after visual screenshot inspection.
- Rebuilt with relative Vite asset paths so the game works both as an independent Netlify site and nested inside the portfolio build.
- Verified nested portfolio serving with Playwright; `window.render_game_to_text()` is available and returns expected game state.

## TODO

- Deploy to Netlify once Netlify CLI authentication is available.
