#!/usr/bin/env bash
# Commit and push Sulog to GitHub. Usage: ./push.sh "optional commit message"
set -euo pipefail

REMOTE_URL="https://github.com/paulkilroy/Sulog.git"
BRANCH="main"
MSG="${1:-update $(date '+%Y-%m-%d %H:%M')}"

# 1. Make sure we're a git repo pointed at the right remote
if [ ! -d .git ]; then
  echo "→ initialising git repo"
  git init -q
fi
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "→ adding origin $REMOTE_URL"
  git remote add origin "$REMOTE_URL"
else
  git remote set-url origin "$REMOTE_URL"
fi

# 2. Ensure we're on the main branch
git checkout -q -B "$BRANCH"

# 3. Stage everything that changed
git add -A

# 4. Nothing to commit? say so and stop cleanly
if git diff --cached --quiet; then
  echo "✓ nothing changed — repo already up to date"
  exit 0
fi

# 5. Commit + push (first push sets upstream)
git commit -q -m "$MSG"
echo "→ pushing to $BRANCH …"
git push -u origin "$BRANCH"
echo "✓ pushed: $MSG"
echo "  GitHub Pages will redeploy in ~1 min → https://paulkilroy.github.io/Sulog/"
