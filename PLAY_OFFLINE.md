# Play AETHERA completely offline

No account. No always-online. No ROM. No Nintendo files.

## 1. One-time: put Godot next to the project

From a machine that can reach GitHub **once**:

```bash
./scripts/fetch-godot.sh
```

Windows PowerShell:

```powershell
.\scripts\fetch-godot.ps1
```

This downloads **official Godot 4.6.3 (standard, not .NET)** into `tools/godot/`.

If you already have that editor installed, copy the binary into `tools/godot/` or set:

```bash
export GODOT=/absolute/path/to/Godot_v4.6.3-stable_linux.x86_64
```

## 2. Launch (no network)

Linux / macOS:

```bash
./scripts/play.sh
```

Windows:

```bat
scripts\play.bat
```

macOS Finder: double-click `scripts/play.command`.

The window is 1280×720 (internal 640×360, integer scale).

| Key | Action |
|---|---|
| Arrows / D-pad | Move in menus |
| Z / Enter / Space / A | Confirm |
| X / Esc / B | Back |
| S (in Field Camp) | Save now |

## 3. Saves travel with the folder

`portable.flag` is in the repo root. That means progress is written to:

```
saves/slot_1.json
saves/slot_2.json
saves/slot_3.json
saves/slot_N.bak.json    ← previous copy, rotated every save
```

Copy the **entire AETHERA folder** (USB, another computer, zip) and your files come with you. Still offline.

To use the OS user-data directory instead, delete `portable.flag`.

Override the folder if you want:

```bash
export AETHERA_SAVES=/path/to/my/saves
./scripts/play.sh
```

You cannot save in the middle of a battle (once battles exist). The title screen and Field Camp save freely.

## 4. Open in the editor

```bash
./scripts/edit.sh
```

## 5. Tests (still offline after fetch)

```bash
./scripts/run-tests.sh
```

## What this is not

- Not a Pokémon ROM, patch, or fangame
- Not an MMO
- Not a browser account

P00 is the title + save system. The Reach opens in later phases (`MASTER_LOG.md`).
