# 05 — Engines and Toolchains

> Every serious way to build a Pokémon-like game in 2026, with a recommendation.

## Decision matrix

| Path | Language | Looks like | Legal to ship as OSS | Best for | Verdict for E-Poke-1 |
|---|---|---|---|---|---|
| Binary FireRed | none / ASM | Official GBA | No | Tiny hacks | Reject |
| pokeemerald-expansion | C | Official GBA | No (derivative) | Best ROM hacks | Study only |
| pokecrystal | RGBDS asm | Official GBC | No | Gen 2 hacks | Study only |
| Pokémon Essentials v21 | Ruby + RMXP | Classic fangame | No (IP + RMXP) | Fastest fangame | Study only |
| Pokémon SDK + Studio | Ruby + Tiled | Modern fangame | No (IP) | Best Pokémon-specific kit | Study only |
| Unity | C# | Anything | Yes, if original | 3D / teams from Unity shops | Backup |
| Unreal | C++ | 3D | Yes, if original | Wrong scale | Reject |
| GameMaker | GML | 2D | Yes, if original | Solo 2D | Possible |
| **Godot 4** | GDScript / C# | Anything 2D/2.5D | **Yes** | **This project** | **Primary** |
| Custom C++ / Rust / Zig | native | Anything | Yes | Engine fetish | Too slow to content |
| Web (Phaser, pixi, custom) | TS | PokeRogue-like | Yes | Roguelike / demo | Good for a side mode |

---

## Pokémon Essentials (RMXP)

The default fangame stack since the late 2000s. Lead: Maruno. Current line: **v21 / v21.1** (2023). Runtime is increasingly **mkxp-z** rather than official RGSS.

### What you actually install

1. Buy **RPG Maker XP** (Steam, often ~$5–20 on sale)
2. Obtain Essentials v21.1 project files (community distribution; Nintendo has C&D'd hosts before)
3. Open `Game.rxproj` in RMXP
4. Map in RMXP, define data in `/PBS/*.txt`, script in Ruby

### Project layout (internalize this; we will mirror it cleanly)

```
/Audio/{BGM,BGS,ME,SE}
/Data                 compiled rxdata
/Graphics/{Characters,Tilesets,Pokemon,Trainers,Pictures,...}
/PBS                  the real database
/Plugins              community scripts
Game.exe / mkxp-z
```

PBS files are the soul: `pokemon.txt`, `moves.txt`, `abilities.txt`, `items.txt`, `types.txt`, `trainers.txt`, `encounters.txt`, `metadata.txt`, `townmap.txt`, etc. The compiler turns them into `.dat` on launch.

### Strengths

- You can have a walking player and a wild battle on day one
- Enormous plugin ecosystem (following Pokémon, modern UI, Megas, Z-Moves…)
- Thundaga's YouTube series is how a generation of fangame devs learned
- JoiPlay can run many Essentials games on Android

### Weaknesses

- RMXP is 2005 software. Map editor constraints (tileset width, layers)
- PBS is untyped text. One typo = crash
- Plugin compatibility across versions is infamous
- Default look is instantly "another Essentials game"
- Bundled Pokémon data is Nintendo IP
- Not a comfortable Git workflow without `unpackd` / YAML extraction

### When Essentials is the right answer

A hobbyist who wants a Pokémon game *with Pokémon in it* and accepts the legal risk. That is not this repository.

---

## Pokémon SDK + Pokémon Studio (Pokémon Workshop)

The modern French-led alternative. Site: [pokemonworkshop.com](https://pokemonworkshop.com). Docs: [docs.pokemonworkshop.com](https://docs.pokemonworkshop.com).

### Stack

- **LiteRGSS2** (custom Ruby graphics, SFML, shaders) — not RGSS
- Ruby 3.0.1
- **Tiled** for maps (unlimited layers, no RMXP tileset width pain)
- RMXP still used for *events* (they are migrating away)
- **Pokémon Studio** as the database GUI (validates input, writes JSON)
- FMOD audio
- Native 320×240 upscaled

### Built-in (this is the pitch)

Time/tint, particles, FollowMe, quests, double/triple battles, safari, mid-battle dialogue, running shoes, rebindable keys, multi daycare, berries, GTS, overworld shadows, SystemTags (bikes, slopes, bridges, ice, headbutt…), CSV text for translation, weathers, a large set of premade field common events.

Studio prevents the "I forgot a comma in pokemon.txt" class of bugs.

Updates come through a launcher rather than manual file merges.

### Strengths vs Essentials

- Data validation
- Better logging
- Tiled mapping
- Performance historically better (gap narrowed after mkxp-z)
- First-class Git-friendly JSON
- Features that are plugins in Essentials are maintained in-tree

### Weaknesses

- Smaller English tutorial surface (Invatorzen's series is the usual pointer)
- Smaller plugin mall
- Still a *Pokémon* SDK: names, creatures, balls, the whole trademark cluster
- RMXP still in the loop for events (for now)
- JoiPlay compatibility is worse

### When PSDK is the right answer

A Pokémon fangame team that wants a decade-long project with sane data tools. Still the wrong legal foundation for an open-source original IP.

---

## pret decomps + expansion

Covered in `02`. Recap for engine choice:

- Best *Pokémon-looking* result per hour after setup
- C, Porymap, real Git
- You are producing Emerald
- Link-cable nostalgia is the only reason to stay vanilla; otherwise use expansion

**Use as a textbook, not a base.** Read `src/battle_*.c`, `src/pokemon.c`, `src/wild_encounter.c`, `src/script.c`. The battle loop and mon struct are worth studying in detail when we write our kernel.

---

## Unity

- Pokémon GO, BDSP, Unite used Unity. Plenty of "make Pokémon in Unity" YouTube series
- C#, huge hiring pool, asset store
- 3D is easier than in Godot historically (gap is smaller in Godot 4.3+)
- License drama (2023 runtime fee) damaged trust. Still usable
- You will spend a year recreating what Essentials gives in a week — unless you *want* a custom 3D game

**Backup** if we later want a 3D overworld with a hired Unity team. Not the start.

---

## Godot 4 (recommended)

### Why it wins for E-Poke-1

1. **MIT license.** Engine and game can be fully open source
2. **2D is a first-class citizen.** TileMaps, TileSet, Y-sort, lights, shaders
3. **GDScript** is readable by designers; C# is there if the battle kernel needs it
4. **Scenes + resources** map perfectly to "maps + PBS files"
5. **Export:** Windows, Linux, macOS, Web, Android. Critical for an OSS community
6. **No install fee, no store tax to *develop***
7. Custom resources (`EchoSpecies.tres`, `Move.tres`, `ResonanceField.tres`) give us Studio-like validation if we write inspectors
8. Growing monster-tamer examples; Cassette Beasts is Godot-adjacent in spirit (Cassette Beasts is Godot)

### What we must build that Essentials gives free

- Battle state machine
- Party/box/storage
- Inventory
- Dialogue/event interpreter
- Encounter tables
- Save/load
- AI
- Status, weather, field, items
- Dex, summary UI, bag UI, shop UI
- Pathfinding / warps / riders

This is months of work. It is also the work that *makes the project ours* and teachable.

### Mitigations

- Start with a tiny combat kernel + one overworld map
- Use Dialogic or a thin in-house yarn/ink runner for talk
- Use Godot TileMap (v2) + custom metadata for terrain tags
- Port *ideas* from pret and Essentials, never their assets

---

## Other kits worth knowing

| Kit | Note |
|---|---|
| **Pokemon Essentials Gen 9 kits / PE v21 plugins** | Community PBS updates. Still IP |
| **mkxp-z** | Open RGSS runtime. How modern Essentials actually runs |
| **unpackd** | Extract Essentials to YAML/RB for Git |
| **Pokeemerald-expansion** | Already covered |
| **HexManiacAdvance** | Binary |
| **Porymap / Poryscript** | Decomp maps/scripts |
| **Tiled** | PSDK maps; also usable with Godot via importers |
| **Aseprite** | Pixel art. Buy it or use LibreSprite |
| **LDtk** | Lovely 2D level editor, Godot importers exist |
| **Ink / Yarn Spinner / Dialogic** | Narrative |
| **FMOD / Godot audio buses** | Mix. Prefer Godot-native until we need FMOD |

---

## Toolchain we will actually standardize on

See `16` for the full architecture. Short version:

```
Godot 4.x
GDScript for game / UI / overworld
Optional C# or GDExtension later for battle sim speed + headless tests
Custom Resource types for all game data
JSON/CSV export for translators and modders
Git LFS only if we must (prefer compact pixel + ogg)
Aseprite + Godot import presets
mGBA is NOT a dependency
```

## Learning path (human, not just engine)

1. Finish one official game attentively (Emerald or Legends Arceus) as a *design autopsy*
2. Play Unbound *or* Reborn *or* Cassette Beasts — at least one, deeply
3. Read pret's battle files or Essentials' `Battle` scripts as a spectator
4. Build our kernel test-first (see `08`)
5. Do not learn RMXP unless we decide to make a Nintendo-IP fangame, which we will not
