# E-Poke-1 Research Library

> Deep-dive research for building a legally shippable, open-source, fully immersive creature-collecting RPG.
> Compiled 2026-08-12. Read in numbered order, or jump by topic.

This folder is the project's research backbone. It is **not** a ROM dump, **not** a Nintendo asset pack, and **not** a how-to for piracy. It is a structured study of:

1. How Pokémon ROMs and fan games actually work
2. What the best ROM hacks and fangames invented
3. How those games are coded, designed, and shipped
4. What is legal to build in public as open source
5. The strongest original concept we can actually execute

## How to use these notes

| If you want… | Start here |
|---|---|
| The one-page conclusion | [00-executive-summary.md](00-executive-summary.md) |
| What a Pokémon ROM even is | [01-pokemon-roms-fundamentals.md](01-pokemon-roms-fundamentals.md) |
| How ROM hacks are made | [02-rom-hacking-methods.md](02-rom-hacking-methods.md) |
| The best ROM hacks, dissected | [03-famous-rom-hacks.md](03-famous-rom-hacks.md) |
| The best standalone fangames | [04-famous-fangames.md](04-famous-fangames.md) |
| Engines, kits, and tools | [05-engines-and-toolchains.md](05-engines-and-toolchains.md) |
| Legal / IP reality check | [06-legal-and-ip.md](06-legal-and-ip.md) |
| Official game systems (stats, types, battles) | [07-official-systems-deep-dive.md](07-official-systems-deep-dive.md) |
| How to actually code a game like this | [08-how-to-code-the-game.md](08-how-to-code-the-game.md) |
| Designing original creatures | [09-creature-and-fakemon-design.md](09-creature-and-fakemon-design.md) |
| Story, region, characters | [10-story-and-region-design.md](10-story-and-region-design.md) |
| Maps, gating, difficulty | [11-world-mapping-and-progression.md](11-world-mapping-and-progression.md) |
| Design lessons from the greats | [12-lessons-from-the-greats.md](12-lessons-from-the-greats.md) |
| Legal original monster games | [13-original-monster-collectors.md](13-original-monster-collectors.md) |
| What still has not been done | [14-gaps-and-opportunities.md](14-gaps-and-opportunities.md) |
| Concept shortlist + flagship idea | [15-concept-brainstorm.md](15-concept-brainstorm.md) |
| Recommended tech architecture | [16-recommended-architecture.md](16-recommended-architecture.md) |
| Phased build plan | [17-development-roadmap.md](17-development-roadmap.md) |
| Sources | [18-sources-and-references.md](18-sources-and-references.md) |
| Glossary | [19-glossary.md](19-glossary.md) |
| Refined production plan | [20-refined-production-plan.md](20-refined-production-plan.md) |

**Execution lives in the repo-root [MASTER_LOG.md](../MASTER_LOG.md).** That file is updated after every phase. Do not treat `17` as the live schedule.

## Hard rule for this repository

This project will **not** ship Nintendo IP.

- No Pokémon names, sprites, cries, maps, music, or logos
- No ROM files, no IPS/BPS patches against official ROMs
- No Pokémon Essentials / PSDK distributions that bundle official data
- Yes to original creatures, original world, original code, MIT/Apache licensing

We study ROM hacks and fangames the way a studio studies a genre. Then we build something we can put on GitHub, itch.io, and Steam without a cease-and-desist being the end of the project.

## Recommended next action after reading

1. Read `00`, `06`, `15`, `20`
2. Open [`MASTER_LOG.md`](../MASTER_LOG.md)
3. Prompt: `Start P00 — project bootstrap`
