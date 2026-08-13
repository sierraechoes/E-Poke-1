# 00 — Executive Summary

> Last updated: 2026-08-12

## What we set out to learn

How Pokémon ROMs work, how fan-made ROMs and fangames are built, what the best of them actually invented, how to code a game of this type, and what the most advanced *shippable* idea is for an open-source project.

## The one-sentence answer

The best thing we can build is **not** another Pokémon ROM hack. It is a **fully original, open-source creature-bonding RPG** that steals the *design lessons* of Unbound, Reborn, Radical Red, Cassette Beasts, and Legends: Arceus — and none of Nintendo's IP.

## Why not a ROM hack

| Path | What you get | Why it fails this repo |
|---|---|---|
| Binary ROM hack | Fast edits to FireRed / Emerald | Requires a copyrighted ROM. Cannot be distributed as source. Fragile. |
| Decomp hack (`pokeemerald`) | Real C source, modern workflow | The source *is* Pokémon Emerald. pret's repos are research artifacts, not a license. |
| Pokémon Essentials / PSDK | Full fangame toolkit | Built around Nintendo data, names, sprites, and mechanics presentation. C&D history. |
| Original Godot / custom engine | Slower start, total control | **Can be open source, sold, forked, and finished.** |

Nintendo and The Pokémon Company have shut down Pokémon Uranium, Pokémon Prism, Pokémon Essentials distribution, and many others. Popularity is the trigger. A successful "fan Pokémon game" dies at the exact moment it succeeds.

An original monster RPG with its own names, art, audio, and fiction can be the thing this repo claims to be: the best immersive open-source game *in this genre*.

## What the best fan projects actually proved

The official series has a brilliant core loop and a conservative design culture. Fan projects spent 20 years filling the gaps.

| Project | Type | The real invention |
|---|---|---|
| **Pokémon Unbound** | GBA ROM hack | The "modern official game that Game Freak did not make": new region, four difficulties, quest log, no HM slaves, Gen 8 battle engine on GBA, original OST |
| **Pokémon Radical Red** | GBA ROM hack | Every fight is a competitive puzzle. Full dex, modern mechanics, ruthless AI, endless replay |
| **Pokémon Reborn** | PC fangame | Field effects that rewrite battles. Mature city. Limited early dex that *forces* creativity |
| **Pokémon Insurgence** | PC fangame | Delta forms (retyped species) + darker cult story + online |
| **Pokémon Uranium** | PC fangame | 150+ original Fakemon + Nuclear type. Proof that original creatures can carry a whole game |
| **Infinite Fusion** | PC fangame | Combinatorial creativity. 176k+ fusions, community sprite army |
| **PokeRogue** | Browser | Pokémon as a roguelike. Instant sessions, infinite replay |
| **Crystal Clear / ROWE** | ROM hacks | True open gym order with scaling |
| **Emerald Rogue** | ROM hack | Roguelite loop inside a GBA Pokémon engine |
| **Drayano hacks** | ROM hacks | The "vanilla-plus difficulty" gold standard |

The pattern: **one sharp thesis + professional QoL + finish the game.** Abandoned 5% demos are the graveyard of this genre.

## What original (legal) games already proved

| Game | Lesson |
|---|---|
| **Cassette Beasts** | Fusion + recording-as-catching + adult tone + outstanding OST. Best modern "Pokémon-like" |
| **Coromon** | Stamina resource makes every turn a decision |
| **Monster Sanctuary** | Metroidvania gating with monster abilities. Synergy-first team building |
| **Temtem** | Full-campaign co-op and always-doubles |
| **Nexomon** | Volume of original creatures + self-aware writing |
| **Palworld** | Base-building + survival can sit on a creature loop (and also shows IP risk if you look *too* much like Pokémon) |

## The flagship concept (see `15`)

**Working title: ECHOES**

You do not "catch them all" in capsules. You **attune** to wild spirits called Echoes — living frequencies of a wounded world. The League that taught you to harvest them is collapsing the ecology. Your bond with each Echo is mechanical, not cosmetic: trust, temperament, habitat, and over-harvesting all change the map.

Signature systems:

1. **Resonance Fields** — Reborn-style field effects, but they are the *world*, not a gym gimmick
2. **Living ecology** — over-catching a species creates Silence Zones
3. **Pact, not Poké Ball** — creatures can refuse, flee, or protect you based on bond
4. **Hybrid battles** — turn-based at heart, with lane/positioning (ZA-lite, not full action)
5. **Open-but-authored world** — Crystal Clear freedom + handcrafted story spines
6. **First-class challenge modes** — Story / Tactician / Iron / Echo-lock (nuzlocke analogue)
7. **Mod-first data** — every creature, move, and field is a Godot resource / JSON
8. **Optional 2-player campaign** — Temtem's best idea, as a mode, not a requirement

~120–160 original Echoes. Tight regional identity. No "all 1000 species" trap.

## How we will build it

- **Engine:** Godot 4.x (MIT, 2D-first, GDScript + C# option, export everywhere)
- **Architecture:** data-driven combat kernel, separate overworld, separate dialogue
- **Art direction:** original HD-2D / chunky pixel, *not* ripped GBA Pokémon tiles
- **Audio:** original or CC0 / commissioned
- **License:** MIT or Apache-2.0 for code; CC-BY-SA or CC-BY-NC for writing/art (decide at repo init)
- **Process:** vertical slice first (one town, one wild route, 12 Echoes, one boss field), then expand

Full stack in `16`. Phased roadmap in `17`.

## Skills / environment note

No local skill packs, agent skill files, or extra toolkits were present in this workspace. Research was done from primary community sources (pret, PokéCommunity, Relic Castle / Eevee Expo, Pokémon Workshop, Essentials wiki, Steam-era monster-tamer design, and current 2025–2026 fan-game roundups).

## What "elite" means for this project

- Ship a finished loop, not a feature cemetery
- Original IP from day one so success does not kill the game
- Combat that is a game, not a type-chart slideshow
- A world that reacts
- Tools and data formats that let other people add Echoes without forking the engine
- Documentation as good as the game
