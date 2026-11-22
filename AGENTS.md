# Repository Guidelines

## Project structure

Soupostat runs the same offline web game in browsers and platform launchers. Start with `game/index.html` to see the script loading order. Keep simulation rules in `game/engine.js`, permanent trait definitions in `game/traits.js`, and presentation in `game/app.js` and `game/scene.js`. The original refrigerator painting lives in `art/`. Ship the optimized image and licensed fonts from `game/assets/`. Update `docs/DESIGN.md` when player-facing rules change.

## Local development

Run commands from the repository root.

- `python3 -m http.server 8080 --bind 127.0.0.1 --directory game` serves the game at `http://localhost:8080`. The web client requires no package installation.
- `node tests/engine.cjs` runs the simulation regression scenarios.
- `./macos/build.sh` builds the Apple Silicon application using Xcode Command Line Tools. Launch it with `open dist/Супостат.app`.
- Keep generated packages in the ignored `dist/` directory. See the README for platform packaging commands.

## Style and compatibility

Use two spaces in JavaScript, CSS and HTML, four in Swift, and camelCase for JavaScript functions and state fields. Match the existing single-quoted JavaScript strings. Keep Russian UI text and stable internal English IDs. Browser scripts load locally in order. Preserve the CommonJS entry point for Node tests. When shipping changed web assets, update the cache version and file list in `game/sw.js`.

## Testing and contributions

Use Node’s built-in `node:assert/strict`. Add focused scenarios to `tests/engine.cjs` for balance, purchased traits, save migration and terminal states. Use a fixed seed and advance the simulation clock directly. For UI changes, exercise the affected control with keyboard or touch.

Use short imperative commit subjects, following the existing “Build” and “Move” examples. A pull request should explain the player-visible change and the checks performed. Link the issue when one exists and include a screenshot when it helps review a visual change.
