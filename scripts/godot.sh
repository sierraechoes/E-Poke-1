#!/usr/bin/env bash
# Resolve a local Godot 4.6.3 binary. Never requires the network.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WANT_VERSION="${AETHERA_GODOT_VERSION:-4.6.3}"
TOOL_DIR="$ROOT/tools/godot"

candidates=()

if [[ -n "${GODOT:-}" ]]; then
  candidates+=("$GODOT")
fi
if [[ -n "${AETHERA_GODOT:-}" ]]; then
  candidates+=("$AETHERA_GODOT")
fi

candidates+=(
  "$TOOL_DIR/godot"
  "$TOOL_DIR/Godot_v${WANT_VERSION}-stable_linux.x86_64"
  "$TOOL_DIR/Godot_v${WANT_VERSION}-stable_linux_x86_64"
  "$TOOL_DIR/Godot_v${WANT_VERSION}-stable_win64.exe"
)

# Compiled-from-source fallback used in this sandbox
candidates+=(
  /tmp/godot-src/bin/godot.linuxbsd.editor.x86_64
  /tmp/godot-src/bin/godot.linuxbsd.editor.dev.x86_64
)

# PATH
if command -v godot >/dev/null 2>&1; then
  candidates+=("$(command -v godot)")
fi
if command -v godot4 >/dev/null 2>&1; then
  candidates+=("$(command -v godot4)")
fi

# macOS app bundle
shopt -s nullglob
for app in "$TOOL_DIR"/Godot*.app; do
  candidates+=("$app/Contents/MacOS/Godot")
done
shopt -u nullglob

pick=""
for c in "${candidates[@]}"; do
  if [[ -n "$c" && -x "$c" ]]; then
    pick="$c"
    break
  fi
done

if [[ -z "$pick" ]]; then
  echo "AETHERA: Godot ${WANT_VERSION} not found." >&2
  echo "This game is designed to run fully offline once the engine is next to the project." >&2
  echo "" >&2
  echo "One-time setup (needs network once):" >&2
  echo "  $ROOT/scripts/fetch-godot.sh" >&2
  echo "" >&2
  echo "Or install official Godot ${WANT_VERSION} (standard, not .NET) and either:" >&2
  echo "  - put the binary in $TOOL_DIR/" >&2
  echo "  - or set GODOT=/path/to/godot" >&2
  exit 127
fi

echo "$pick"
