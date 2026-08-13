#!/usr/bin/env bash
# Headless GUT. Offline. Exit 0 only if every test passed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GODOT="$("$ROOT/scripts/godot.sh")"

export GODOT_DISABLE_LEAK_CHECKS="${GODOT_DISABLE_LEAK_CHECKS:-1}"

echo "AETHERA tests  |  $GODOT"

# Import first so class_name scripts register (do not commit .godot/)
"$GODOT" --headless --path "$ROOT/game" --import --quit

exec "$GODOT" --headless --display-driver headless --audio-driver Dummy \
  --path "$ROOT/game" \
  -s res://addons/gut/gut_cmdln.gd \
  -gdir=res://tests \
  -ginclude_subdirs \
  -gexit \
  -gprefix=test_ \
  -gsuffix=.gd
