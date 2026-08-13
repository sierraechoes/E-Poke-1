# 02 — ROM Hacking Methods

> Binary hacking vs. decompilation hacking vs. C-injection. Tools, workflows, and why the community moved.

## The three ways people "make a Pokémon game"

```
┌─────────────────────────────────────────────────────────────┐
│  1. BINARY HACK                                             │
│     Official ROM  +  GUI tools  →  patched .gba             │
│     Tools: HexManiacAdvance, Advance Map, XSE, PGE          │
├─────────────────────────────────────────────────────────────┤
│  2. DECOMP HACK                                             │
│     pret source (C / asm)  +  Porymap  →  make  →  .gba     │
│     Bases: pokeemerald, pokefirered, pokecrystal            │
│     Super-base: pokeemerald-expansion (RHH)                 │
├─────────────────────────────────────────────────────────────┤
│  3. FANGAME / ORIGINAL ENGINE                               │
│     Essentials, PSDK, Unity, Godot, custom  →  .exe / web   │
│     This is NOT ROM hacking. Covered in 05 and 08.          │
└─────────────────────────────────────────────────────────────┘
```

## Binary hacking

You open a compiled ROM and edit what is already there.

### Mental model

The ROM is a baked cake. You can scrape icing (text, palettes), swap decorations (sprites), and surgically replace slices (repoint a table). You cannot unbake the flour. If you need a new engine feature, you inject compiled C/ASM into free space and hook a branch to it.

### Core tools (Gen 3)

| Tool | Job |
|---|---|
| **HexManiacAdvance (HMA)** | Modern all-in-one: species, trainers, moves, text, images, scripts. Actively documented |
| **Advance Map** | Classic map editor. Ancient UI, still used |
| **XSE (eXtreme Script Editor)** | Compile/decompile Gen 3 scripts |
| **PGE (Pokémon Game Editor)** | Trainers, wild encounters, etc. |
| **unLZ-GBA** | Extract/insert compressed graphics |
| **G3T / G3HS** | Older all-in-ones, mostly superseded |
| **Sappy / midi2agb** | Music |
| **Lunar IPS / Floating IPS / beat / MultiPatch** | Apply patches |
| **HxD / 010 Editor** | Raw hex when tools fail |

### C-injection (the binary world's "expansion pack")

When GUI tools are not enough, binary hackers compile C routines and insert them:

- **CFRU** — Complete FireRed Upgrade. Modern battle engine on FireRed
- **DPE** — Dynamic Pokémon Expansion. Adds species slots past the original 411
- Unbound is the showcase of CFRU+DPE taken to a finished game

This is how a 2004 FireRed ROM ends up with Fairy type, the physical/special split, Mega Evolution, Z-Moves, and Gen 8 abilities.

### Strengths

- Lowest barrier: download tools, open ROM, change a starter
- Huge archive of 2005–2018 tutorials (Anthroyd, etc.)
- Cheats often still work because addresses do not shift
- Fine for a weekend "rebalance Kanto" project

### Weaknesses

- **Corruption.** Overlapping inserts silently destroy the ROM
- **No real version control.** People copy `hack_backup_37.gba`
- **Offsets and free space.** You become a memory-layout janitor
- **Tools rot.** Advance Map has not meaningfully modernized
- **Engine changes are painful.** New abilities, new battle mechanics = ASM/C
- **Not reusable.** Another hacker cannot cleanly merge your work
- FireRed is the only well-supported binary base. Emerald binary is poorer. Ruby/Sapphire is a dead end

Community consensus in 2025–2026 (PokéCommunity threads such as "Stop Binary Hacking" and "The Case for Leaving Binary Hacking Behind"): if a project will take more than a few hours, **start on decomp**.

## Decompilation / disassembly hacking

A group called **pret** (Pokémon Reverse Engineering Tools) spent years producing source that, when compiled, is a **byte-identical** match of the official ROM.

### The important pret projects

| Repo | Game | Language | Status |
|---|---|---|---|
| [pret/pokered](https://github.com/pret/pokered) | Red/Blue | RGBDS asm | Mature |
| [pret/pokeyellow](https://github.com/pret/pokeyellow) | Yellow | RGBDS asm | Mature |
| [pret/pokegold](https://github.com/pret/pokegold) | Gold/Silver | RGBDS asm | Mature |
| [pret/pokecrystal](https://github.com/pret/pokecrystal) | Crystal | RGBDS asm | Gold standard for Gen 2 |
| [pret/pokeruby](https://github.com/pret/pokeruby) | Ruby/Sapphire | C + asm | Less used |
| [pret/pokefirered](https://github.com/pret/pokefirered) | FireRed/LeafGreen | C + asm | Very usable |
| [pret/pokeemerald](https://github.com/pret/pokeemerald) | Emerald | C + asm | **The** Gen 3 base. 3.4k+ stars |

Matching means: compile `pokeemerald`, get a `.gba` whose SHA1 is `f3ae088181bf583e55daf962a92bb46f4f1d07b7` — identical to the retail US Emerald cart.

### pokeemerald-expansion

Maintained by **Rom Hacking Hideout (RHH)**. Not a game. A *kit* on top of pret's Emerald:

- Gen 5+ damage calc
- Fairy type, physical/special split
- Moves and abilities through Scarlet/Violet
- Mega, Primal, Ultra Burst, Z-Moves, Dynamax/Gmax
- Followers, expanded IDs, modern AI flags
- Config headers to toggle almost everything
- Debug menus, inverse battles, modern exp share, etc.

If someone is making a serious Gen 3 decomp hack in 2026, they start here unless they need vanilla link-cable compatibility.

### Decomp workflow

```
install build deps (devkitARM / agbcc, libpng, python, git)
git clone pokeemerald or pokeemerald-expansion
edit C, headers, JSON, PNGs
edit maps in Porymap
optionally write scripts in Poryscript
make -j$(nproc)
run pokeemerald.gba in mGBA
git commit
```

### Decomp tools

| Tool | Job |
|---|---|
| **Porymap** | Map editor designed for the decomps. Better than Advance Map |
| **Poryscript** | High-level language that compiles to pokeemerald script macros |
| **VS Code / CLion** | Actual IDE, go-to-definition on `GetMonData` |
| **git** | Real version control, feature branches, expansion merges |
| **mGBA + GDB** | Source-level debugging is possible |

### Strengths

- Human-readable everything
- Compiler handles pointers and free space
- Git merges, code review, reusable feature branches
- You can change *any* function, including the battle engine
- Far less ROM corruption
- Expansion gives you a decade of engine work for free

### Weaknesses

- Setup (WSL on Windows, toolchains) scares beginners
- Merge conflicts when tracking expansion
- Fewer "click here" tutorials than 2012 binary YouTube
- You still need to know C for anything interesting
- **You are still producing a derivative of Pokémon Emerald**

## Binary vs. decomp cheat sheet

| Concern | Binary | Decomp |
|---|---|---|
| Change a starter | 2 minutes in HMA | Edit a species constant / script |
| Add a map | Advance Map | Porymap |
| Add Fairy type | CFRU or pain | Expansion config, or a weekend of C |
| New ability | ASM/C injection | Write a function, register it |
| Version control | File copies | Git |
| Corruption risk | High | Low |
| Link with retail carts | Often works | Vanilla yes; expansion no |
| Best base | FireRed | Emerald (+ expansion) |
| Suitable for this repo | No | No (IP) |

## Gen 1 and 2 specifically

These are **disassemblies** (RGBDS assembly), not C decomps.

- `pokecrystal` has the best wiki in the entire pret ecosystem
- Polished Crystal, Crystal Clear, Prism, Brown, and many quality-of-life hacks live here
- Binary hacking Gen 1/2 is considered dead

## Gen 4 and 5

- Platinum / HGSS / BW decomps exist at various completeness
- **Renegade Platinum**, **Sacred Gold / Storm Silver**, **Blaze Black / Volt White** (and Redux) are the famous difficulty/enhancement hacks
- Tooling is less cozy than pokeemerald
- Still Nintendo IP

## How a hack reaches players

1. Author builds a modified ROM
2. Author generates a **BPS** (or UPS/IPS) against a named clean dump
3. Players obtain that clean dump themselves
4. Players apply the patch (Floating IPS, Rom Patcher JS, Hackdex, etc.)
5. Players run the result in mGBA

Good authors document the exact ROM: `Pokemon - Fire Red Version (USA, Europe) (Rev 1).gba` and a checksum.

## What ROM hacking teaches us that we will keep

Even though we will not ship a hack, the craft has lessons:

1. **Data is the game.** Species, trainers, encounters, and scripts are tables. Treat them as data, not hard-coded logic.
2. **The overworld and the battle engine are two programs.** Keep them decoupled.
3. **Config flags beat forks.** Expansion's `config.h` pattern is how you support difficulty modes and optional features.
4. **Porymap's event model** (objects, warps, triggers, signposts, flags) is a proven overworld schema. Copy the *schema*, not the code.
5. **Never depend on memory offsets.** Name things.
6. **A finished 20-hour game beats an infinite engine.** Unbound shipped. A thousand CFRU experiments did not.

## What we will not do in this repository

- Commit `.gba`, `.gbc`, `.nds`, or any official dump
- Commit BPS/IPS/UPS patches against official games
- Vendor pret source as if it were our game
- Vendor Essentials/PSDK with Pokémon data

We will, in later phases, implement *our own* battle kernel and overworld, informed by these architectures. See `08` and `16`.
