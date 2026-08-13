# 04 — Famous Standalone Fangames

> PC games built in Pokémon Essentials, PSDK, RPG Maker, or custom engines. These are not ROM hacks.

## Why fangames outgrow ROM hacks

A GBA ROM is ~16–32 MB with hard limits on maps, sprites, and audio. A PC fangame can have:

- Voice-adjacent cutscene length (still usually text)
- Hundreds of unique maps
- Custom battle UIs, field effects, mid-battle dialogue
- Online trade/battle
- Episode updates without patching a ROM
- Mature fiction that would never pass ESRB on a Nintendo SKU

The cost: they look like RPG Maker unless the team art-directs hard, they are Windows-first, and they are legally louder.

---

## The essential list

### Pokémon Reborn

- **Engine:** RPG Maker XP + Essentials
- **Region:** Reborn City — a polluted, collapsing metropolis
- **Status:** Complete
- **The invention: Field Effects**
  - The battlefield is a *place*: cave, swamp, factory, concert stage, holy ground
  - Fields boost types, change moves, interact with weather, can be mutated mid-fight
  - Gyms are built *around* fields. You prepare or you lose
- **Other signatures:** 18 gyms, limited early dex (forgotten species become stars), brutal puzzles, password system to tune the experience after launch (skip puzzles, remote PC, etc.)
- **Steal:** fields as first-class rules; limited dex as a feature; post-launch "accessibility passwords"; every area teaches a new tool
- **Avoid:** unrebinding/save-next-to-interact UX sins; requiring a wiki to understand fields *if we can afford in-game field notes*; writing that confuses "mature" with "cruel"

### Pokémon Rejuvenation

- Spiritual successor energy to Reborn
- Aevium region, Team Xen, Storm-9 catastrophe
- Episode-structured, enormous (80–120 hours claimed)
- Keeps and extends fields
- **Steal:** long-form character writing, if we have writers. Otherwise do not attempt this runtime
- **Avoid:** episode scope without an end date

### Pokémon Insurgence

- **Engine:** Essentials
- **Region:** Torren
- **Signatures:** Delta Pokémon (retagged official species — Delta Charizard is Electric/Dragon), cults and prophecy, 18 gyms, Megas, online trade/battle, Battle Frontier post-game
- **Steal:** "familiar body, new type" as a cheap way to make veterans re-learn; online as optional endgame
- **Avoid:** cult-of-the-week plotting unless characters are excellent
- **Legal note:** Deltas are still Nintendo species. We can do **regional morphs of our own Echoes**, not of Charizard

### Pokémon Uranium

- **Engine:** RPG Maker XP
- **Region:** Tandor
- **The invention:** 150+ original Fakemon + **Nuclear type**
- Nintendo C&D'd the original download after ~1.5 million downloads. Community mirrors keep it alive
- Feels closer to "a real new generation" than almost any hack
- **Steal:** a tight original dex with a cultural hook; one new type that is a *theme*, not a gimmick; "this could have been Gen 4.5"
- **Avoid:** a type that is strong against almost everything (Nuclear's balance is controversial)
- **This is the existence proof that original creatures can carry the genre**

### Pokémon Infinite Fusion

- Fuse any two species. Community has drawn 20k–176k+ sprites depending on how you count
- Fusion inherits typing, stats, abilities in a defined recipe
- Full Kanto/Johto-style campaign where *everyone* uses fusions
- **Steal:** combinatorial content; community art pipeline; fusion as a *battle verb* (see Cassette Beasts) not only a menu
- **Avoid:** depending on a volunteer army before we have 12 great official fusions

### Pokémon Xenoverse

- Heavy original dex, still updated
- Often cited as the most polished *living* fakemon project
- **Steal:** ship, then update a real creature roster. Do not wait for 800.

### PokeRogue

- Browser roguelike. No install. The 2024–2026 conversation dominator
- Short runs, meta unlocks, endless mode
- **Steal:** zero-friction session design; unlockable starters; a mode we can ship *beside* the campaign
- **Avoid:** making the campaign itself a roguelike unless that is the whole game

### PokeMMO

- MMO wrapper. Players provide official gen 3–5 ROMs
- Real economy, real PvP, real grinding
- **Steal:** multiplayer as a *world*, not a menu
- **Avoid:** always-online requirement for a story RPG; official ROM dependency

### Other notable fangames

| Game | Why it is in the notes |
|---|---|
| **Solar Light / Lunar Dark** | Fakemon region (Rikoto), complete-feeling pair |
| **Zeta / Omicron** | Early Essentials giants. Historical |
| **Phoenix Rising** | Ho-Oh focused, long development |
| **Empyrean** | Mutants, many starters, ambitious story |
| **Desolation** | Island region, mysterious tone, episodic |
| **DayBreak** | Armira region |
| **Wack** | 4000+ species, including jokes. A warning about scope |
| **Metal / Sunday** | Complete "huge region + all mons" style |
| **Fire Ash** | Anime timeline, 50+ gyms. Scope as spectacle |
| **Dark Rising series** | Edgy difficulty, polarizing writing, later RMXP remakes |
| **Sage** | Fakemon-focused |
| **Spectrum** | Fakemon, ongoing |
| **Clockwork** | Rosari region |
| **Spork** | Ceolis, sibling story, lighter tone |
| **Realidea System** | Artificial bonds as a plot device — thematically close to ECHOES |
| **Everlasting Orchard** | Stardew × Pokémon. Farm loop |
| **Academy Life** | Visual-novel school |
| **Pathways** | Player stats + branching. Systems-RPG lean |
| **Giovanni Origins** | Character study |
| **Soulstones 2** | Time / guild plot |
| **Stygian Snakewood** | Horror remake of a hack, now a fangame |
| **Tectonic** | Fully reworked species, new moves — Radical Red energy in a new region |

---

## Essentials-era production reality

These games take **years to a decade**. Uranium: ~9 years. Reborn: over a decade. Unbound (hack, but same lesson): many years of one obsessed lead + helpers.

Common failure mode:

1. Announce a 16-gym original region and 300 fakemon
2. Release a 2-town demo
3. Lead goes to college / burns out
4. Discord becomes a ghost town

**Counter-strategy for us:** vertical slice → Act 1 (3 towns, 4 bosses) → 1.0 (8 bosses + finale) → post-game. Public demo is Act 1, not a bedroom.

---

## Technical fingerprints

Most of the list above share:

- RPG Maker XP map editor
- Ruby scripts (Essentials) or PSDK Ruby
- PBS text files (species, moves, trainers, encounters, items, types)
- Plugin folders that break on Essentials major versions
- 640×480 or 384×216 upscaled
- Windows builds; Mac/Linux via mkxp-z or hope

Problems we will not inherit if we use Godot:

- RMXP license ($ for the editor)
- RGSS performance cliffs (partly fixed by mkxp-z)
- PBS whitespace landmines
- Plugin hell across v20 → v21
- "Looks like every other fangame"

Problems we *will* inherit if we are sloppy:

- Same maps-with-too-much-green
- Same dialogue boxes
- Same 8-gym clone plot

Art direction and writing are the differentiator once the engine works.

---

## What fangames do better than ROM hacks

- Character writing and cutscene control
- UI invention (Reborn's fields need a UI that GBA cannot comfortably host)
- Music length and quality (uncompressed)
- Episode updates
- Online features
- Adult presentation (for better and worse)

## What ROM hacks still do better

- "Feels like Pokémon" in the first five seconds
- Runs on a $30 Anbernic
- Patch distribution culture
- Performance and input crunch
- A finished Unbound is tighter than many 80-hour fangames

**ECHOES should aim at fangame expressive power with ROM-hack finish discipline.**
