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

## Run
Open `index.html` in a browser. No build step — React is bundled in.

## Deploy (GitHub Pages)
Already wired: pushing to `main` redeploys the site.
Settings → Pages → Deploy from a branch → `main` / root.

## Updating
Replace `index.html` with the new build, then run `./push.sh "your message"`.

## Source
`src/sulog-waray.jsx` is the readable source. `index.html` is the bundled, deployable
build (React + lucide + app, minified into one file).

Progress is stored in the browser (localStorage); the gist sync holds the canonical copy.
