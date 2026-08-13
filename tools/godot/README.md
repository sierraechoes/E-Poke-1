# Local Godot 4.6.3

This folder is where the **standard (non-.NET)** Godot 4.6.3 editor binary lives.

It is **not** committed (too large, OS-specific). Fetch it once:

```bash
# from the repo root
./scripts/fetch-godot.sh
```

Windows (PowerShell):

```powershell
.\scripts\fetch-godot.ps1
```

After that, `./scripts/play.sh` and `./scripts/edit.sh` work **completely offline**.

Expected filenames:

| OS | File |
|---|---|
| Linux x86_64 | `Godot_v4.6.3-stable_linux.x86_64` |
| Windows | `Godot_v4.6.3-stable_win64.exe` |
| macOS | `Godot.app` (from the official zip) |

You can also drop in any official 4.6.3 standard build and name it `godot` here.
