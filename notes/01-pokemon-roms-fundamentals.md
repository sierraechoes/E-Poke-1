# 01 — Pokémon ROMs: Fundamentals

> What a "Pokémon ROM" is, how the official games are packaged, and why the fan scene split into ROM hacks vs. fangames.

## What a ROM is

A **ROM** (Read-Only Memory image) is a digital dump of a game cartridge or disc. For Pokémon, people usually mean:

| Generation | Hardware | Typical file | Notes |
|---|---|---|---|
| Gen 1 (Red/Blue/Yellow) | Game Boy | `.gb` | 8-bit, extremely well understood |
| Gen 2 (Gold/Silver/Crystal) | Game Boy Color | `.gbc` | Crystal is the gold-standard disassembly |
| Gen 3 (Ruby/Sapphire/FireRed/LeafGreen/Emerald) | Game Boy Advance | `.gba` | The ROM-hack capital of the world |
| Gen 4 (Diamond/Pearl/Platinum/HGSS) | Nintendo DS | `.nds` | Harder. Decomps exist / maturing |
| Gen 5 (Black/White/B2W2) | Nintendo DS | `.nds` | Drayano difficulty hacks live here |
| Gen 6–7 | 3DS | `.3ds` / decrypted | CIA/3DS hacking, much higher legal and technical friction |
| Gen 8–9 | Switch | NSP/XCI | Not a healthy "ROM hack" scene in the GBA sense |

A ROM is **copyrighted game data**. Possessing a dump of a cartridge you own sits in a legal gray area in many countries. **Distributing** the ROM is copyright infringement. That is why serious hack authors ship **patches**, not pre-patched games.

## ROM vs. ISO vs. dump vs. patch

- **ROM / dump:** the whole game, extracted from hardware or a backup
- **ISO:** usually optical media (not the GBA/DS world)
- **IPS / UPS / BPS patch:** a *diff* against a clean ROM. The player applies it to a ROM they already have
- **BPS** is the modern favorite (better validation, handles larger diffs)
- **Soft patching:** the emulator applies the patch in memory and never writes a new file

Community distribution norm: *author ships the patch; player supplies a legally obtained clean ROM.* This is custom, not a license from Nintendo.

## How a GBA Pokémon ROM is structured (the important mental model)

A Gen 3 Pokémon ROM is a single binary that contains:

1. **ARM/Thumb machine code** — the engine (battles, overworld, menus)
2. **Data tables** — species stats, learnsets, trainers, items, encounters
3. **Scripts** — NPC dialogue and events (a custom bytecode)
4. **Maps** — tiles, permission/behavior bytes, events, connections
5. **Graphics** — tilesets, sprites, compressed with Nintendo's BIOS methods
6. **Audio** — M4A / Sound Driver sequences, samples, cries
7. **Save format definitions** — what gets written to the SRAM/flash chip

When you "hack a ROM" you are either:

- **Binary hacking:** rewriting bytes inside that baked cake
- **Decomp hacking:** changing the recipe (`pokeemerald` C source) and baking a new cake

See `02` for the full comparison.

## Official generation map (design, not just hardware)

Understanding what each gen *added* is how you decide what to steal for an original game.

| Gen | Games | Mechanical additions that still matter |
|---|---|---|
| 1 | RBY | Catch, type chart (broken), gyms, Elite Four, storage PC |
| 2 | GSC | Held items, breeding, friendship, day/night, two regions, special vs physical *by type* |
| 3 | RSE/FRLG | Abilities, natures, double battles, contests, secret bases, Battle Frontier |
| 4 | DPPt/HGSS | Physical/special *split by move*, online Wi-Fi, following Pokémon (HGSS) |
| 5 | BW/B2W2 | Best story of the mainline, seasons, hidden abilities, triple/rotation, unmatched pixel art |
| 6 | XY/ORAS | Fairy type, Mega Evolution, super-training, roller skates, 3D overworld |
| 7 | SM/USUM | Z-Moves, regional forms, trials instead of gyms, SOS chaining |
| 8 | SwSh | Dynamax/Gmax, wild area, camping, (controversial) dexit |
| 8.5 | Legends Arceus | Overworld catching, agile/strong style, outbreak ecology, Hisuian forms |
| 9 | SV | Terastal, open world, picnic breeding, (performance issues) |
| 9.5 | Legends Z-A | Real-time positioning combat, urban redevelopment fantasy |

Fan projects almost always freeze a *presentation* (GBA or RMXP 2D) and then import mechanics from later gens. Unbound is "Gen 8 rules in a Gen 3 body." That mismatch is the entire modern ROM-hack aesthetic.

## Two fan traditions (do not confuse them)

### 1. ROM hacks

- Start from an official ROM or a pret decomp
- Played in an emulator (mGBA, VBA-M, Pizza Boy, Delta, RetroArch)
- Look and feel like a "lost official game"
- Distribution: patch files
- Best examples: Unbound, Radical Red, Crystal Clear, Renegade Platinum, Glazed, Gaia, Prism, Clover

### 2. Fangames (standalone)

- Built in RPG Maker XP + Pokémon Essentials, or PSDK, or Unity, or custom
- Played as a PC `.exe` (sometimes JoiPlay on Android)
- Can be much larger, darker, or mechanically weirder
- Distribution: full game download
- Best examples: Reborn, Rejuvenation, Insurgence, Uranium, Infinite Fusion, Xenoverse

A third modern branch:

### 3. Web / roguelike / MMO reinterpretations

- **PokeRogue** — browser roguelike
- **PokeMMO** — official-ROM-based MMO client (players supply ROMs)
- **PokéUnity / various Unity clones**

## Why Gen 3 became the hack capital

1. Hardware is simple and well documented
2. Tools existed for 20 years (Advance Map, XSE, then HMA)
3. FireRed is a clean single-region engine with space and community knowledge
4. Emerald has the Battle Frontier and is the most complete pret decomp
5. GBA pixel art is iconic and cheap to produce relative to 3D
6. Emulation is perfect and runs on phones, handhelds, and browsers

Gen 1/2 hacking is now almost entirely **disassembly** (`pokered`, `pokecrystal`). Binary hacking there is considered legacy.

Gen 4+ hacking exists (Renegade Platinum, Blaze Black 2 Redux) but the toolchains are heavier and the audience is smaller.

## What is inside a species definition (every engine has this)

Regardless of ROM or fangame, a creature is a row of data:

- Internal ID / species number
- Name, category ("Mouse Pokémon"), height, weight, color, shape
- Types (1 or 2)
- Base stats: HP, Atk, Def, SpA, SpD, Spe (BST = sum)
- Gender ratio, hatch steps, egg groups, growth rate
- Abilities (1, 2, hidden)
- Ev yield, catch rate, base exp, EV/IV/nature interaction is runtime
- Learnset: level-up, TM/HM/TR, egg, tutor
- Evolution methods and targets
- Held-item wild chances
- Sprites: front, back, icon, overworld, shiny palette, cry
- Pokédex entries (often two, one per version)

**This data model is the real "Pokémon engine."** The overworld is a separate game that occasionally calls the battle game.

Internalize that split. It is how we will architect ECHOES (`16`).

## Save data (why it matters)

A Pokémon save is a carefully packed struct:

- Player name, ID, secret ID, money, time, badges
- Party (up to 6 compact monster structs)
- PC boxes (Gen 3: 14 boxes × 30)
- Bag pockets
- Flags (story bits), variables (counters), game stats
- Dex seen/caught bits
- Hall of Fame

Decomp hacks can resize this. Binary hacks corrupt saves if they get it wrong. Original games should version their save format from day one (`save_version` integer + migrations).

## Emulators worth knowing

| Emulator | Use |
|---|---|
| **mGBA** | Best accuracy/performance for GBA. Dev-friendly |
| **Gambatte / SameBoy** | GB/GBC accuracy |
| **melonDS** | DS |
| **RetroArch** | Multi-core, shaders, handhelds |
| **BizHawk** | Tool-assisted / scripting |
| **Delta / Pizza Boy** | iOS / Android casual play |

We will not ship an emulator. We mention these only because that is how ROM hacks are *played*.

## Key takeaway

A Pokémon ROM is a frozen official game. A ROM hack is a derivative work of that game. A fangame is usually also a derivative work because it still uses the names, creatures, and often the sprites.

An original creature RPG is a *different product that learned the same lessons.* That is the only product this repository should become.
