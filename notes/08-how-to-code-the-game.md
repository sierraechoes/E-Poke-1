# 08 — How to Code a Game Like This

> Practical engineering. What to build, in what order, and how the best existing codebases do it.

## The only architecture that survives

Separate these binaries-in-spirit even if they live in one Godot project:

```
┌──────────────┐     spawn battle      ┌────────────────────┐
│  OVERWORLD   │ ───────────────────► │  BATTLE KERNEL     │
│  exploration │                      │  pure, testable    │
│  NPCs, maps  │ ◄─────────────────── │  no sprites req.   │
└──────────────┘     result packet    └────────────────────┘
        │                                      │
        ▼                                      ▼
┌──────────────┐                      ┌────────────────────┐
│  CAMPAIGN    │                      │  BATTLE VIEW       │
│  flags, quests│                      │  anim, VFX, UI     │
│  dialogue    │                      └────────────────────┘
└──────────────┘
        │
        ▼
┌──────────────┐
│  DATA LAYER  │  species, moves, items, fields, trainers, maps
│  resources   │
└──────────────┘
        │
        ▼
┌──────────────┐
│  SAVE        │  versioned, migratable
└──────────────┘
```

If battle logic touches sprites, you cannot unit-test damage. If overworld flags live in random node metadata, you cannot make a quest debugger. Essentials and pokeemerald both *approximately* follow this. We will follow it strictly.

---

## Phase-0 coding goal (the vertical slice)

A single executable that proves the fantasy:

1. Walk a small town (Y-sorted tiles, one indoor, one NPC with branching talk)
2. Walk a route with tall-grass *or* visible wilds
3. Fight a wild Echo (singles, 2 types, 8 moves, 3 statuses)
4. Attune (catch analogue) with a fairness formula
5. Heal at a hub
6. Fight a trainer with a 2-mon team
7. Fight a boss on a named Resonance Field
8. Save and load
9. All data from resources, none hard-coded in the battle loop

If this is fun, the game exists. Everything else is content.

---

## Battle kernel: write it like pret, test it like Smogon

### Suggested module list

```
core/rng.gd                 # seeded, replayable
core/types.gd               # chart, effectiveness
core/stats.gd               # formulas
data/species.gd             # Resource
data/move.gd                # Resource
data/ability.gd             # Resource
data/item.gd                # Resource
data/field.gd               # Resource
battle/battler.gd           # instance in a fight
battle/side.gd              # player / enemy / ally
battle/action.gd            # move, switch, item, flee, attune
battle/event.gd             # ability/item/field hooks
battle/queue.gd             # priority + speed
battle/damage.gd            # pure function
battle/effects/             # one file per effect family
battle/ai/                  # profiles
battle/sim.gd               # headless runner
```

### Event/handler pattern (Game Freak 2026 CEDEC, and also good sense)

Game Freak rebuilt battles around **Sections** (ordered pipelines) and **EventHandlers** (moves/abilities register without editing the pipeline). We should do the same:

```
Section: SelectAction
Section: TurnOrder
Section: ExecuteMove
    Section: Accuracy
    Section: DamageCalc
    Section: ApplyDamage
    Section: OnHit
Section: Residuals
```

An ability is not `if ability == INTIMIDATE`. An ability is a handler subscribed to `ON_SWITCH_IN`.

This is how you add 200 abilities without destroying the kernel.

### Headless tests (non-negotiable)

```
godot --headless -s tests/battle_runner.gd
```

Examples:

- 4× effective move vs 0.25×, snapshot damage range with seeded RNG
- STAB applies once
- Burn halves physical, not special
- Field Ember Shore boosts Tide? no — boosts Ember, and Tide moves douse it
- Speed ties respect the documented coin flip
- Faint mid-turn does not let a dead battler move

PokeRogue and competitive calculators exist because the official games are under-specified. We specify.

### Determinism

`BattleRng` is a seeded PRNG. A replay file is:

```
{ seed, species, actions[] }
```

If we cannot replay a desync, we cannot do netcode later.

---

## Data-driven content (our PBS / Studio)

Godot `Resource` classes with exported fields. Optional JSON mirror for mods.

```gdscript
class_name EchoSpecies
extends Resource

@export var id: StringName
@export var display_name: String
@export var types: Array[StringName]
@export var base_stats: StatBlock
@export var abilities: Array[StringName]
@export var learnset: Array[LearnsetEntry]
@export var attune_rate: int
@export var habitat_tags: Array[StringName]
@export var front: Texture2D
@export var overworld: Texture2D
```

Validation editor plugin:

- Unknown type? Error
- BST out of band? Warning
- Learnset references missing move? Error
- Two species same id? Error

This is Pokémon Studio's actual superpower. Rebuild it in an afternoon of EditorPlugin work.

**Never** store balance numbers only in code.

---

## Overworld

### Map schema (steal Porymap's nouns)

- **Collision / height / terrain tags** (grass, water, ice, ledge, warp)
- **Objects** (NPCs, items, overworld Echoes)
- **Triggers** (step on tile → script)
- **Signposts** (interact)
- **Warps** (doors)
- **Connections** (north map id + offset)
- **Encounter table** (by terrain + time + field)

Godot TileMap layers:

1. Ground
2. Decoration
3. Collision (invisible, or use physics layers)
4. Above-player (roofs)
5. Meta (terrain tags as custom data layers)

### Event interpreter

Do not scatter `if Global.flag_12`. Write a tiny script VM or use a resource graph:

```
Lock
FacePlayer
IfFlag gym1_done -> already_done
Talk "..."
Battle trainer_nessa
IfWon -> set gym1_done, give item
Release
```

Poryscript / Essentials events are this. Ink/Yarn are this with better tools. Either:

- **Dialogic 2** for talk-heavy scenes + custom nodes for `battle` / `give` / `flag`
- or a YAML/JSON script compiled to a RefCounted program

Flags are a set. Variables are a dictionary. Both live on the save.

### Visible wilds vs. grass rolls

2026 players expect to *see* creatures. Implementation:

- Spawn points with species table + roam radius + schedule (day/night)
- Stepping into grass still can roll an ambush (rare)
- Overworld Echoes despawn or flee based on ecology pressure

---

## UI

Build UI as scenes, not as draw-call archaeology:

- `ui/dialogue.tscn`
- `ui/party.tscn`
- `ui/summary.tscn`
- `ui/bag.tscn`
- `ui/dex.tscn`
- `ui/battle_command.tscn`
- `ui/attune.tscn`
- `ui/pause.tscn`
- `ui/map.tscn`

Input: an `InputRouter` so battle and overworld never fight for the A button. Rebindable actions from day one.

Accessibility: type icons + letters, scalable UI, screen-reader later if we can.

---

## Save system

```json
{
  "version": 3,
  "slot": 1,
  "playtime": 12345,
  "player": {},
  "party": [],
  "boxes": [],
  "inventory": {},
  "flags": [],
  "vars": {},
  "dex": {},
  "ecology": {},
  "map": { "id": "route_01", "x": 12, "y": 8, "facing": "down" }
}
```

Rules:

- `version` integer + `migrations/v2_to_v3.gd`
- Rotate 3 backup copies
- Never save mid-battle without storing the full battle snapshot (easier to forbid it)
- Hash optional for anti-cheat later; do not bother for 1.0 single-player

---

## AI

```
AiProfile:
  flags: [check_ko, check_type, check_status, switch_if_4x, stall]
  knowledge: revealed_only
  rng_wiggle: 0.1
```

Difficulty changes the profile, not the trainer's species list (or it changes both, but separately). Unbound mixes "smarter AI" and "better teams." Keep those knobs independent so Story mode is not "the boss has Magikarps."

---

## Networking (later)

Do not start here. Design for it:

- Deterministic battle kernel
- Input-command netcode, not state-sync of sprites
- Authoritative host for co-op overworld (easier than lockstep overworld)

Temtem is always-online. We will not be. Co-op is a mode.

---

## Performance

2D Pokémon-likes die from:

- Gigantic TileMaps with no streaming
- Unique textures per sprite without atlases
- Pathfinding on every NPC every frame
- Battle VFX that allocate each frame

Budget:

- Stream maps in chunks (one town + adjacent routes resident)
- Atlas wild overworlds
- Object pool VFX
- Battle kernel allocates nothing per turn after warmup

Godot 4's TileMap and Resource system are enough if we are adults.

---

## What to read in other people's code (as a textbook)

When you want to know how a *real* Pokémon battle is structured:

- pret/pokeemerald `src/battle_main.c`, `battle_util.c`, `battle_script_commands.c`, `pokemon.c`
- pokeemerald-expansion `src/battle_util.c` and ability tables
- Essentials `Battle` / `Battler` / `Move` Ruby classes (v21)
- PSDK battle code under their yard docs
- Smogon/calc for the *spec* of damage

Do not copy files into this repo. Take notes. Reimplement.

---

## Suggested first-week coding sequence

Day 1–2: `EchoSpecies`, `Move`, `TypeChart`, stat formulas, unit tests  
Day 3–4: headless 1v1, Tackle / Ember / Water Pulse, STAB, burn  
Day 5: switches, faint, simple AI  
Day 6: Godot battle view wired to kernel  
Day 7: one TileMap town + grass → battle  

That week is the difference between a notes folder and a game.
