# Sulog — Waray review

A personal, Duolingo-style review app for Waray-Waray, built from Paul's Preply lesson
materials. One self-contained page — open `index.html` or host it on GitHub Pages.

**Live:** https://paulkilroy.github.io/Sulog/

## Features
- Waray↔English; modes: multiple choice, type, flashcard, listen, speak
- Spaced repetition (Leitner) + a "needs work" queue
- Record your own voice on any card to override the rough text-to-speech
- Adjustable playback speed (and "speed up as I learn")
- Cloud sync via a private GitHub gist (Backup & sync screen)

## Develop
Edit **`src/sulog.jsx`** (never `index.html` — it's generated), then:
```bash
npm install        # once
npm run build      # regenerate index.html
git commit -am msg && git push   # Pages auto-deploys
```
New here? Read **HANDOFF.md** first.

## Deploy (GitHub Pages)
Settings → Pages → Deploy from a branch → `main` / root. `.nojekyll` is included so files
are served as-is. Live ~1 min after each push.

Progress is stored in the browser (localStorage); the gist sync holds the canonical copy.
