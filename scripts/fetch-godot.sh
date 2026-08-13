#!/usr/bin/env bash
# One-time download of official Godot 4.6.3 (standard). After this, play offline.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="4.6.3"
DEST="$ROOT/tools/godot"
mkdir -p "$DEST"

# Already present?
if [[ -x "$DEST/Godot_v${VERSION}-stable_linux.x86_64" || -x "$DEST/godot" ]]; then
  echo "Godot ${VERSION} already in $DEST — nothing to fetch."
  exit 0
fi

os="$(uname -s)"
arch="$(uname -m)"
asset=""
bin_name=""

case "$os" in
  Linux)
    case "$arch" in
      x86_64|amd64) asset="Godot_v${VERSION}-stable_linux.x86_64.zip"; bin_name="Godot_v${VERSION}-stable_linux.x86_64" ;;
      aarch64|arm64) asset="Godot_v${VERSION}-stable_linux.arm64.zip"; bin_name="Godot_v${VERSION}-stable_linux.arm64" ;;
      *) echo "Unsupported Linux arch: $arch" >&2; exit 1 ;;
    esac
    ;;
  Darwin)
    asset="Godot_v${VERSION}-stable_macos.universal.zip"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    echo "Use scripts/fetch-godot.ps1 on Windows." >&2
    exit 1
    ;;
  *)
    echo "Unsupported OS: $os" >&2
    exit 1
    ;;
esac

url="https://github.com/godotengine/godot/releases/download/${VERSION}-stable/${asset}"
tmp="$(mktemp -d)"
echo "Downloading official Godot ${VERSION} (standard)…"
echo "  $url"

if command -v curl >/dev/null 2>&1; then
  curl -L --fail --retry 5 --retry-delay 2 -o "$tmp/$asset" "$url"
elif command -v wget >/dev/null 2>&1; then
  wget -O "$tmp/$asset" "$url"
else
  echo "Need curl or wget." >&2
  exit 1
fi

unzip -o "$tmp/$asset" -d "$tmp/out"
if [[ "$os" == "Darwin" ]]; then
  rm -rf "$DEST/Godot.app"
  cp -a "$tmp/out/Godot.app" "$DEST/Godot.app"
  echo "Installed $DEST/Godot.app"
else
  src="$(find "$tmp/out" -type f -name 'Godot*' | head -1)"
  cp "$src" "$DEST/$bin_name"
  chmod +x "$DEST/$bin_name"
  ln -sfn "$bin_name" "$DEST/godot"
  echo "Installed $DEST/$bin_name"
fi

rm -rf "$tmp"
echo "Done. You can now run ./scripts/play.sh offline."
