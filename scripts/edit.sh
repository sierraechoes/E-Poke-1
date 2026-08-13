#!/usr/bin/env bash
# Open the AETHERA Godot editor. Offline once Godot is in tools/godot/.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GODOT="$("$ROOT/scripts/godot.sh")"
exec "$GODOT" --editor --path "$ROOT/game" "$@"
