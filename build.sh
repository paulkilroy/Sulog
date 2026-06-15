#!/usr/bin/env bash
# Build src/sulog.jsx -> index.html (single self-contained file).
# React, react-dom, lucide-react and the app are bundled + minified, then
# inlined into an HTML shell. Run:  npm install && npm run build
set -euo pipefail

SRC="src/sulog.jsx"
OUT="index.html"
TMP="$(mktemp -d)"
BUNDLE="$TMP/bundle.js"

echo "→ bundling $SRC"
# Build stamp shown in the UI so you can confirm a deploy at a glance:
# UTC date/time + short git hash (with a "+" if the tree is dirty).
STAMP_DATE="$(date -u '+%Y-%m-%d %H:%M UTC')"
GIT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)"
git diff --quiet 2>/dev/null || GIT_HASH="${GIT_HASH}+"
BUILD_STAMP="${STAMP_DATE} · ${GIT_HASH}"
npx esbuild "$SRC" --bundle --jsx=automatic --format=iife --minify \
  --define:__BUILD__="\"$BUILD_STAMP\"" --outfile="$BUNDLE"

# Safety: the bundle must not contain a literal </script> (would break inlining)
if grep -q '</script' "$BUNDLE"; then
  echo "✗ bundle contains </script>; aborting to avoid broken HTML"; exit 1
fi

echo "→ assembling $OUT"
{
  cat <<'HTML'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0a2e34" />
<title>Sulog · Waray review</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230a2e34'/><path d='M8 60 C28 48 40 70 58 60 C72 52 84 66 92 60 L92 96 L8 96 Z' fill='%2316a3ab'/><circle cx='74' cy='30' r='12' fill='%23f4a53a'/></svg>" />
<style>
  html,body{margin:0;padding:0;background:#f7f1e6;-webkit-text-size-adjust:100%}
  #root{min-height:100vh}
</style>
</head>
<body>
<div id="root"></div>
<script>
HTML
  cat "$BUNDLE"
  cat <<'HTML'
</script>
</body>
</html>
HTML
} > "$OUT"

rm -rf "$TMP"
echo "✓ wrote $OUT ($(wc -c < "$OUT") bytes)"
