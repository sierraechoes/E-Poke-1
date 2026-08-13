# 18 — Sources and References

> Research compiled 2026-08-12. Links rot. Titles are enough to search again.

This is not an academic bibliography. It is the trail of sources used to write `notes/00`–`17`.

## ROM hacks and fangame roundups

- Guidespot, "Best Pokémon Fan Games 2026: 16 Incredible ROM Hacks" — https://www.guidespot.com/best-pokemon-fan-games/
- Game Rant, best ROM hacks lists — https://gamerant.com/best-game-rom-hacks-pokemon-fans-should-play/
- GameWhims, "10 Best Pokémon ROM Hacks in 2026"
- Pokémon Coders, fan-made games list (RMXP) — https://www.pokemoncoders.com/fan-made-pokemon-games/
- visualboyadvance.org ROM hack index (popularity snapshot, not a quality ranking)
- r/PokemonROMhacks: "Must Try ROM Hacks (2025)", "most anticipated 2026", "2026 noteworthy list"
- r/RomHacks: 2026 noteworthy sequel threads
- PokéCommunity: Pokémon Unbound release thread (Skeli) — https://www.pokecommunity.com/threads/pokémon-unbound-completed.382178/

## Decomp, binary, pret

- pret organization and pokeemerald — https://github.com/pret/pokeemerald
- pret pokecrystal — https://github.com/pret/pokecrystal
- pret index — https://pret.github.io
- pokeemerald-expansion (RHH) — https://github.com/rh-hideout/pokeemerald-expansion
- PokéCommunity: "difference btw binary & decomp" (.436282)
- PokéCommunity: "Stop Binary Hacking; It's Holding Back the Entire Community" (.488749)
- PokéCommunity: "The Case for Leaving Binary Hacking Behind in 2025 and Beyond" (.537751)
- PokéCommunity: "First Time Learning to Make ROM Hacks" (.490689)
- PokéCommunity: pokeemerald scripting tutorial (.416800)
- TechTimes on FireEmerald / pret / expansion infrastructure (2026)

## Essentials, PSDK, fangame production

- Essentials Engine wiki, Guide: Game design — https://essentialsengine.miraheze.org/wiki/Guide:Game_design
- Essentials Docs (Fandom), Introduction to Essentials
- PokéCommunity: Essentials v21.1 release (Maruno)
- GitHub: Maruno17/pokemon-essentials releases
- Pokémon Workshop / PSDK yard README — https://psdk.pokemonworkshop.com/yard/
- Pokémon Workshop docs — https://docs.pokemonworkshop.com/
- Pokémon Studio get-started — https://pokemonworkshop.com/en/documentation/get-started/
- r/PokemonRMXP: Essentials vs PSDK threads (2024–2025)
- Eevee Expo / Relic Castle engine discussions
- Vocal Media 2025 fangame-making guides (used cautiously; mixed quality)

## Legal / IP (practice, not counsel)

- RPG Maker Web forums: "Am I allowed to make a Pokémon fan game" (.130800)
- RPG Maker Web: "Is making a fan-made game illegal" (.45090)
- ExpertBeacon: "Are Fan Made Pokémon Games Illegal?"
- GameDev StackExchange: "Licensing for my fan-game" (q/146711)
- Community histories of Pokémon Uranium and Pokémon Prism takedowns
- Public discussion of Palworld / Nintendo IP tension (context only)

## Official systems

- Smogon / damage calculator documentation (Gen 5+ formula, ranges)
- Bulbapedia / standard community knowledge for stats, IVs/EVs, catch formula (cross-checked mentally; verify numbers in implementation tests)
- PocketMonsters.net writeup of GAME FREAK CEDEC 2026 battle-system talk (Sections, EventHandlers, Z-A sharing a pipeline with turn-based)
- Official generation feature lists (public knowledge)

## Original monster collectors

- Cassette Beasts (Bytten Studio) Steam page and community discussion
- Coromon, Monster Sanctuary, Temtem, Nexomon, Siralim Ultimate, Palworld, MH Stories 2, SMT V — Steam pages, r/MonsterTamerWorld, r/JRPG recommendation threads
- Summerengine / fone.tips 2026 roundups of monster tamers

## Design conversation

- r/pokemon: design philosophy threads
- r/patientgamers: Pokémon Reborn retrospective
- r/PokemonUnbound, r/pokemonradicalred comparisons
- Essentials wiki regional dex size table

## Tools

- HexManiacAdvance documentation
- Porymap / Poryscript (decomp community)
- mGBA
- Aseprite / LibreSprite
- Godot 4 documentation (engine of record for this project)
- Dialogic 2, LDtk (candidates)

## How to cite these notes in-repo

When a later design doc depends on a claim ("Unbound has four difficulties"), point at `03` or `12`, not at a random Discord. When implementing a formula, write a test with a cited example, not a vibe.

## What we did not use

- ROM download sites as design sources
- Leaked Game Freak assets or internal dumps
- Paid "best ROM list" SEO pages beyond triangulation
- AI-generated Fakemon lists

## Added 2026-08-13 (plan refinement)

- Godot 4.6.3 maintenance release — https://godotengine.org/article/maintenance-release-godot-4-6-3/
- Godot 4.6 release notes — https://godotengine.org/releases/4.6/
- GUT unit testing + headless CI import pattern (Godot 4.5/4.6 community writeups)
- TileMapLayer class docs (Godot 4.4+) and TileMap bloat / chunking guides (2026)
- Steam: Echoes of Aetheria (title collision note)
- Nintendo: The Legend of Zelda: Echoes of Wisdom (title collision note)

## Maintenance

Update this file when a major source changes (Unbound successor, expansion 2.0, PSDK leaving RMXP, a new legal action). Date the edit.
