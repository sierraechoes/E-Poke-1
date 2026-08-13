# 11 — World, Mapping, and Progression

> How to structure space so exploration, difficulty, and story do not fight each other.

## Four structures (from the Essentials design guide, still correct)

| Map | Plot | Official analogue | Risk |
|---|---|---|---|
| Linear | Linear | Most mainline | Safe, can feel like a hallway |
| Open | Linear | SV story paths on an open map | Players sequence-break and get bored or crushed |
| Linear | Open | "You arrived; do whatever" hubs | Needs a strong hub fantasy |
| Open | Open | Crystal Clear, ROWE, some post-games | Scaling nightmare |

**ECHOES 1.0 recommendation:** **semi-open, linear spine.**

- Act I is a corridor that teaches (town, route, field, inspector)
- Act II is a hub (Relay City) with three unlockable biomes in any order
- Act III collapses to a linear finale
- Post-game opens the map fully with a second scaling rule

This is HGSS + a dash of Crystal Clear, not SV.

## The gym problem

If inspectors (gyms) can be done in any order:

- Either scale their teams to badge-count (Crystal Clear)
- Or lock them in three tiers of three (Alola-ish)
- Or do not scale levels but scale *AI and items* (more honest)

Level scaling of wilds is controversial. SV's auto-scale deleted the joy of being overlevelled *and* the fear of underlevelled. Better:

- Wilds have a **band** per area (e.g. 14–18)
- Inspectors scale within a band
- "Silence zones" never scale down. They are the true open-world danger
- An option: "Legacy curve" (no scale) vs "Wanderer curve" (soft scale)

## Gating verbs (replace HMs)

HMs were a brilliant map tool and a terrible party tool. Unbound's ADM is the correct *product* fix. Thematically we can do better.

Each gate is an **Echo pact verb** or a **Field condition**:

| Gate | How it opens | Taught by |
|---|---|---|
| Bramble | Bloom Echo "Part" | First forest |
| Channel | Tide Echo "Ferry" | First coast |
| Ash crust | Ember Echo "Temper" | Foundry |
| Static lock | Volt Echo "Ground" | City sewers |
| Memory wall | Veil Echo "Recall" | Highland
| Silence lock | Must *lower* local harvest, not a move | Ecology thesis |

The player does not teach "Cut" to a slot. The **pact** can be invoked from a key menu if any compatible Echo is in the box, not just the party. ADM energy, diegetic.

Some late gates require a *living Field* — if you over-harvested the forest, Cut does not work because the forest Echoes left. That is the game teaching the thesis.

## Route design checklist

A good route is a sentence:

> "After the rain, the reed-Echoes come to the boardwalk, and the old relay tower is visible but not climbable yet."

Must have:

- A distinct terrain tag and palette
- 4–7 wild species, not 12
- One trainer cluster with a personality (birders, meter-readers, pilgrims)
- One optional pocket (item, lore, rare Echo)
- A reason to return (tide, night, new pact verb, quest)
- A Field identity (Reedwalk: Bloom + Tide)

Must not have:

- A mandatory maze for the sake of runtime
- Invisible one-way ledges that require a guide
- Six identical "youngster" fights

## Town design checklist

- Readable from the region map silhouette
- One service block: heal, storage, shop, transit
- One character you remember
- One view (lighthouse, foundry stack, monastery roof)
- Indoor density > outdoor emptiness (Gen 4 towns still win this)
- Night version that is not just a palette swap (a shift worker, a closed stall, a different Echo on the roof)

## Encounter design

Official grass tables: 12 slots with 20/20/10/10/10/10/5/5/4/4/1/1. That shape is fine.

Improvements:

- Time and weather swap the rare slots
- Overworld visible spawns for the common 20/20
- Dex "wanted" tool (DexNav / PLA research) for the 1%
- Ecology pressure: if the player attuned 15 Reedlings this week, Reedling slots empty and a predator slot rises

## Difficulty and level caps

Offer at file create:

| Mode | Wild band | Inspector AI | Wipes |
|---|---|---|---|
| Story | Soft, exp generous | Honest, not cruel | Free heal nearby |
| Tactician | Official-ish | Type-aware | Normal |
| Iron | Tight cap per badge | KO-aware, switches | Permadeath optional per Echo |
| Custom | Sliders | Sliders | Sliders |

Iron is our nuzlocke. Do not make it the marketing. Make it correct.

Level cap: on Tactician+, exp tapers hard above the local inspector. Radical Red / Unbound players expect this. Story mode ignores it.

## Quest system

Unbound's mission log is the right UI. Categories:

- **Circuit** — main inspectors
- **Pacts** — specific Echo storylets (our "side quests that give a species")
- **Civic** — town problems
- **Ecology** — restore a Field (required for some endings)
- **Bounty** — optional gauntlet fights

Every quest has: giver, tracker, fail-or-not, reward that is not only money.

## Map production pipeline

1. Region thumbnail (one page, no art)
2. Progression graph (boxes and gates)
3. Act I maps at blockout (colored collision, no decor)
4. Playtest walking only
5. Decor pass
6. Encounter and trainer pass
7. Lighting / weather / night
8. Return hooks

Tools: Godot TileMap or LDtk → Godot. Custom data for terrain tags. A "debug overlay" that shows encounter tiles and warp IDs.

## How big is 1.0?

A finished Unbound is huge. We will not start there.

| Ship | Maps (order of magnitude) | Inspectors | Echoes |
|---|---|---|---|
| Vertical slice | 4 | 1 | 12 |
| Act I demo | 12–16 | 2 | 30 |
| 1.0 | 50–80 | 8 + finale | 140 |
| 1.1 post | +20 | + facility | +20 |

If map count exceeds this, cut biomes, not polish.

## Fast travel

Unlock after Act I. Points of interest only, not anywhere-warp (except a late Keeper gift). Fast travel that deletes walking deletes the overworld game.

PLA/SV wild rides: yes, as Echo verbs, late.

## The overworld is a game

If the player only holds A through grass to get to the next fight, we failed. Success looks like:

- They stop to watch a predator Echo hunt
- They come back at night for a form
- They feel guilty when a Field goes quiet
- They use a pact verb in a way the designer did not script

That is immersion. It is mostly systems + a few authored moments, not 80,000 words.
