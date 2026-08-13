#!/usr/bin/env bash
# Launch AETHERA offline from this folder. No account, no CDN, no ROM.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GODOT="$("$ROOT/scripts/godot.sh")"
cd "$ROOT"

echo "AETHERA  |  engine: $GODOT"
echo "Saves    |  $ROOT/saves   (portable)"
echo "Offline  |  yes"
echo ""

# --path must be the Godot project. Windowed play; pass extra args through.
exec "$GODOT" --path "$ROOT/game" --rendering-method gl_compatibility "$@"
