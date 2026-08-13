#!/usr/bin/env bash
# Fail if Nintendo / Pokémon trademarks sneak into game code or data.
# Research notes are allowed to discuss those words.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Word boundaries-ish. Keep the list mechanical, not cute.
PATTERN='Pok[eé]mon|Pikachu|Pok[eé]dex|Pok[eé] ?Ball|Charizard|Game Freak|Pok[eé]mon Company'

hits="$(grep -RInE --exclude-dir=.git --exclude-dir=.godot --exclude-dir=addons \
  --exclude-dir=notes --exclude='MASTER_LOG.md' --exclude='PLAY_OFFLINE.md' \
  --exclude='README.md' --exclude='CONTRIBUTING.md' --exclude='LICENSE-ASSETS' \
  --exclude='check-ip-words.sh' \
  -e "$PATTERN" "$ROOT" || true)"

if [[ -n "$hits" ]]; then
  echo "IP word check FAILED:"
  echo "$hits"
  exit 1
fi
echo "IP word check OK."
