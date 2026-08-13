# 16 — Recommended Architecture

> Concrete stack for ECHOES. This is the engineering spec the roadmap (`17`) implements.

## Non-negotiables

- Original IP only (`06`)
- Battle kernel headless-testable (`08`)
- All balance data in resources, not code
- Godot 4.3+ (or current stable 4.x)
- Runs on mid-range laptops and, eventually, web demo + Steam Deck
- Linux-first development (this workspace is Linux)

## Stack

| Layer | Choice | Why |
|---|---|---|
| Engine | Godot 4.x | MIT, 2D, exports, Resources |
| Game language | GDScript | Speed of iteration, readable PRs |
| Battle sim tests | GDScript + `godot --headless` | Same language as game |
| Optional later | C# or Rust GDExtension for sim | Only if profiling demands |
| Maps | Godot TileMapLayer + custom data | Fewer moving parts than Tiled for v1 |
| Alt maps | LDtk importer | If designers want LDtk |
| Dialogue | Thin in-house runner *or* Dialogic 2 | Decide in Phase 0; isolate behind `DialogueService` |
| Art | Aseprite / LibreSprite | Indexed pixel, animations |
| Audio | Godot buses + OGG Vorbis | No FMOD until we need it |
| VCS | Git | Feature branches, small files |
| CI | GitHub Actions | Headless tests on PR |
| Design data | `.tres` + JSON export | Mods and translation |
| Localization | CSV / gettext | PSDK got this right |

## Repository layout (target)

```
/notes                  this research library
/docs                   player + contributor docs (later)
/game                   Godot project root
  /addons               validators, importers
  /core                 rng, types, stats
  /data                 resources (species, moves, fields…)
  /battle               kernel + view
  /overworld            maps, player, events
  /campaign             flags, quests
  /ui
  /save
  /tests
  /tools                export JSON, balance reports
/assets_src             aseprite sources (optional LFS)
```

The Godot project is not created in the research phase. Phase 0 of `17` creates it.

## Core types (names)

```
EchoSpecies       template
EchoInstance      runtime (party, box, wild)
MoveSpec          template
AbilitySpec       template
ItemSpec          template
FieldSpec         template + transition table
TypeChart         resource
EncounterTable    resource
TrainerSpec       resource
AiProfile         resource
QuestSpec         resource
MapMeta           resource (warps, connections, default field)
```

IDs are `StringName` slugs: `soolin`, `move_ember_spit`, `field_reedwalk`. Never reuse IDs. Never use integers as public IDs (Essentials pain).

## Battle kernel API (sketch)

```gdscript
var battle := BattleSim.new()
battle.setup(BattleConfig.new({
    "seed": 123,
    "field": "reedwalk",
    "allies": [player_party],
    "foes": [wild_or_trainer],
    "rules": { "can_flee": true, "can_attune": true }
}))

while not battle.is_over():
    var view_state := battle.snapshot()
    # view renders snapshot
    var cmd := await input.choose(view_state)
    var events := battle.step(cmd)  # list of BattleEvent
    # view plays events
```

`BattleEvent` is a typed dictionary or resource: `{type: "damage", source, target, amount, crit, effectiveness}`. The view is a dumb player of events. This is how we later add netcode and a roguelike mode.

## Field system

A `FieldSpec` includes:

- id, display name, almanac text
- stat/type modifiers
- move rewrites (`ember_spit` on Reedwalk → steam, changes accuracy)
- residual (end-of-turn)
- transitions: `{move_tag: tide, to: reedwalk_mud}`
- overworld tint / particles key
- ecology: which harvests damage this field

The overworld map cell has `field_id`. Battle inherits it. If the battle *changes* the field, the overworld cell updates (this is the thesis).

## Ecology (minimum viable)

Per species per region-chunk:

```
population: 0.0–1.0
pressure: harvests this in-game week
```

Thresholds:

- `< 0.2` → Silence overlay, encounters empty, story flags
- restore via quests, releasing, or waiting seasons

Do not simulate every animal every frame. Simulate on sleep, on harvest, on weekly tick.

## Attunement

Not a ball throw.

Sequence:

1. Battle or overworld calm
2. Player chooses Approach / Offer / Harmonize / Force
3. Echo temperament + HP + Field compatibility + Bond items → success chance
4. Force is easier, tanks Bond cap forever on that instance
5. Fail states: flee, sleep, counter-attune (wild applies a volatile)

SMT + PLA, not RBY.

## Services (singletons, but thin)

```
TypeService
DataRegistry      # loads all resources, validates
SaveService
FlagService
InventoryService
AlmanacService
EcologyService
AudioService
InputRouter
```

Avoid a 4,000-line `Autoload.gd`. Pret and Essentials both grew god-objects. We will not.

## Modding

A mod is a folder:

```
mods/cool_echo/
  manifest.json
  data/*.tres or *.json
  gfx/
```

`DataRegistry` loads core, then mods, then fails on ID conflict unless the manifest `replaces`.

Workshop/GitHub can come later. The folder format is the promise.

## CI

```
on: pull_request
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - install Godot headless
      - godot --headless -s tests/run.gd
      - tools/validate_data.py
```

No PR merges if a move references a missing type.

## Performance budget (1.0)

- 60 FPS on Steam Deck in overworld
- Battle kernel `step()` < 2 ms
- Map resident set: current + neighbors
- Cold start to title < 5 s on a mid laptop

## Accessibility

- Remap
- Text size
- Battle speed 1×/2×/4×/instant
- Type icons + letters
- Screen shake off
- Photosensitivity: no 10 Hz flashes
- Colorblind palettes for Field tints

## What we explicitly postpone

| Thing | Until |
|---|---|
| Multiplayer | 1.1+ |
| Fusion | 1.1 |
| Breeding lab | maybe never; use tuners |
| 3D overworld | never for 1.0 |
| Voice acting | never required |
| Mobile touch UI | after desktop feels good |
| Official monster data of any franchise | never |
