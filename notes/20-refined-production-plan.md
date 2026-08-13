# 20 — Refined Production Plan

> Second-pass research (2026-08-13). This locks contradictions in `00`/`15`/`16`/`17` and makes the game *buildable one prompt at a time*.
>
> Execution lives in `/MASTER_LOG.md`. This file is the design rationale.

## Why the first roadmap was not enough

`notes/17` was a correct studio outline and a bad execution plan:

- Phases were weeks long, not one-session completable
- Several systems contradicted each other (positioning vs singles, ECHOES as a public title, Dialogic vs in-house)
- “Fully playable” was not defined per milestone
- Godot version, test harness, resolution, type chart, and save rules were still TBD
- Art and music were scheduled as if they were free
- The environment has **no Godot and no skill packs** — P00 must install the engine

Fangames fail by announcing a region and shipping a bedroom. We fail-closed: each phase has an Exit Gate. No gate, no next phase.

## Additional research that changed the plan

### Engine

- Current Godot line in 2026: **4.6.3** is a May 2026 maintenance release; 4.7.x also exists. We pin **4.6.3** for a known-stable 4.6 + GUT CI pattern, not a moving 4.7 target.
- GUT is the right harness for a GDScript-only game. CI must **import** the project before running tests if `.godot/` is not committed. Use `--headless`, Dummy audio, `-gexit`.
- `TileMapLayer` is the 4.3+ API. Large painted layers bloat `.tscn` into megabytes and slow save/load — store tile data as external `.res` and **chunk maps**. Editor freezes past huge single layers.
- Dialogic is powerful and a CI/headless liability. A 1.0 story of our size does not need it.

### Design

- Vertical slices only work if they are the *real* loop at shippable honesty, not a trailer. Our slice is Reedwalk → Hale, using the *final* kernel, not a fake battle.
- Creature collectors die when discovery is thin (Nexomon-style sameyness) or when systems do not talk. Fields + attune + ecology is the whole thesis; positioning combat would steal a year.
- **Echoes of Wisdom** (Nintendo, 2024) makes “ECHOES” a bad store title. Internal codename can stay. Public title: **AETHERA** (still search before launch; “Echoes of Aetheria” is an older Steam RPG).

### Playability

A game “with zero errors” is not a wish. It is:

1. A testable battle kernel (deterministic seed)
2. A save version integer + migrations
3. Validation on all data
4. A critical-path walk every ship phase
5. A ban on god-objects and on “quick hacks” that skip the event interpreter

## Contradictions resolved

| Was | Now |
|---|---|
| Exec summary: hybrid turn-based + positioning | **1.0 = singles turn-based.** Positioning is P51-era at earliest |
| Title: ECHOES | **Codename ECHOES, public AETHERA** |
| 120–160 vs 140 Echoes | **140** |
| Dialogic or in-house | **In-house** |
| Types: rename Pokémon chart *or* original | **16 original names, original matchups, familiar *shape*** |
| Currency / ball analogue undecided | **Reeds / Tuning Fork** |
| Godot 4.3+ vague | **4.6.3** |
| Coarse week-phases | **P00–P30 one-prompt phases** |

## Locked type chart (16)

Names are Resonance-flavored. Structure still has immunities and 4× greed punishment.

| Id | Name | Short idea |
|---|---|---|
| pulse | Pulse | Neutral living rhythm |
| ember | Ember | Heat, foundries, drought |
| tide | Tide | Water, flood, harbor |
| bloom | Bloom | Growth, reeds, harvest |
| volt | Volt | Current, relays, storms |
| frost | Frost | Cold, still air |
| stone | Stone | Earth, masonry, cliffs |
| gale | Gale | Wind, height, weather |
| iron | Iron | Metal, tools, cages |
| toxin | Toxin | Rot, runoff, industry |
| hex | Hex | Haunt, unfinished signals |
| veil | Veil | Memory, dreams, fog |
| flesh | Flesh | Body, labor, impact |
| myth | Myth | Old pacts, titans |
| gloom | Gloom | Silence-adjacent, spite |
| light | Light | Bells, festivals, clarity |

### Effectiveness (attacker → defender)

Values: `0` immune, `½` resist, `2` weak. Unlisted = `1`.

**Pulse** → hex 0, iron ½, flesh 2  
**Ember** → ember ½, tide ½, bloom 2, frost 2, iron 2, stone ½, gale ½, myth ½  
**Tide** → ember 2, tide ½, bloom ½, stone 2, toxin 2, volt ½  
**Bloom** → ember ½, tide 2, bloom ½, stone 2, iron ½, toxin ½, gale ½, light 2  
**Volt** → tide 2, volt ½, stone 0, gale 2, iron 2, bloom ½  
**Frost** → ember ½, tide ½, bloom 2, frost ½, gale 2, iron ½, flesh 2  
**Stone** → ember 2, volt 2, gale 2, flesh ½, iron ½, tide ½, bloom ½  
**Gale** → bloom 2, flesh 2, toxin 2, volt ½, stone ½, iron ½, frost ½  
**Iron** → frost 2, pulse 2, myth 2, ember ½, iron ½, volt ½, toxin 0  
**Toxin** → bloom 2, flesh 2, veil 2, toxin ½, iron 0, stone ½, hex ½  
**Hex** → hex 2, veil 2, pulse 0, flesh 0, gloom ½, light ½  
**Veil** → flesh 2, toxin 2, gloom 2, veil ½, iron ½, hex ½, myth 2  
**Flesh** → iron 2, stone 2, frost 2, gale ½, veil ½, toxin ½, hex 0  
**Myth** → myth 2, tide 2, iron ½, light 0, frost 2  
**Gloom** → veil 2, hex 2, light 2, gloom ½, flesh ½, pulse ½  
**Light** → gloom 2, hex 2, myth 2, iron ½, light ½, ember ½

Design notes:

- Stone grounds Volt (immunity) — identity
- Hex cannot touch Pulse or Flesh (unfinished signal vs living body/rhythm)
- Iron eats Toxin (sealed drums) and fears Ember (foundry)
- Light shuts Myth (old pacts named in daylight)
- No type is strong against more than five. No Uranium-Nuclear bully

Implement this table as data (`type_chart.json` or a Resource). Tests must pin at least:

- volt vs stone = 0
- hex vs pulse = 0
- iron vs toxin = 0
- myth vs light = 0
- ember vs bloom = 2
- bloom vs ember = ½
- dual bloom/tide vs ember = 1 (2 × ½)
- dual bloom/frost vs ember = 4 (2 × 2)

## Locked formulas

### Stats

```
HP   = floor((2*Base + Scar + floor(Training/4)) * Level / 100) + Level + 10
STAT = floor((floor((2*Base + Scar + floor(Training/4)) * Level / 100) + 5) * Temper)
```

Temper ∈ {0.9, 1.0, 1.1}. Scars 0–31. Training 0–252 per stat, 510 total.

Fixture (put in tests):

- Base HP 50, Scar 31, Training 0, Lv 50 → HP = 135  
  `floor((2*50+31+0)*50/100)+50+10 = floor(131*0.5)+60 = 65+60 = 125`  
  Recheck: `(2*50 + 31 + 0) = 131`, `131 * 50 / 100 = 65.5` → floor 65 + 50 + 10 = **125**
- Base Atk 80, Scar 31, Training 252, Lv 50, Temper 1.1  
  `floor(Training/4)=63`, `2*80+31+63=254`, `254*50/100=127`, floor+5=132, `floor(132*1.1)=145`

Write these numbers into GUT. If they drift, the game is wrong.

### Damage

```
base = floor(floor(floor((2*L/5)+2) * Power * A / D) / 50) + 2
damage = floor(base * weather * crit * rand * stab * type * burn * field * other)
```

- crit = 1.5
- rand = 85..100 inclusive / 100 (16 buckets: 85–100)
- STAB = 1.5
- burn = 0.5 if physical and battler burned (ability may cancel)
- type = product of chart values vs each defender type

### Attune

```
condition = 1.0
condition *= 0.55 if wild took damaging hits this battle else 1.15
condition *= field_compat        # 0.75 / 1.0 / 1.25
condition *= approach_mod        # Approach 1.0, Offer 1.1, Harmonize 1.25, Force 1.6
condition *= bond_item           # default 1.0
hp_term = 0.5 + 0.5 * (current_hp / max_hp)   # healthier is EASIER
a = clamp(species.attune_rate * condition * hp_term, 1, 255)
success if rng.roll(255) < a
```

Force on success: `bond_cap *= 0.7` permanently on that instance.

Fail: 50% flee if Force, else 30% flee / 70% stay agitated.

### Exp (simple, documented)

```
exp = floor(base_yield * foe_level / 5 * trainer_mod * story_mod)
```

trainer_mod 1.5 if trainer. story_mod 1.4 on Story, 1.0 Tactician, 0.85 Iron.

Learn-on-level uses the species learnset. Prompt to replace a move if 4 filled.

### Retune (evolution)

Triggered by level, item, location/Field, or Bond threshold. Same struct as a species change + keep Scars, Training, moves (unlearn illegal only if we must — prefer keep).

## Reedwalk Field (slice must teach this)

**reedwalk**

- Bloom moves ×1.3
- Tide moves apply **mud** (spe ×0.67) to the target side for 3 turns
- Ember moves: if mud present, consume mud and **transition field → dry_pan**

**dry_pan**

- Ember ×1.3
- Tide ×0.7
- Bloom ×0.85
- Tide move that deals damage has 30% chance to transition back to reedwalk

Hale’s first Echo should set mud. Hale’s last Echo should punish a player who never dried the pan — and lose to a player who did.

## What “no errors” means in practice

| Layer | How we enforce it |
|---|---|
| Formulas | GUT fixtures |
| Data | DataRegistry refuses to boot on bad IDs |
| Battle | Seeded replays; dead battlers cannot act |
| Overworld | Warps validated; event lock; blackout always warps to a real heal point |
| Save | version + backups + load test in P08 and P30 |
| UI | InputRouter; no two menus own accept |
| Perf | Chunk maps; no per-frame ecology; pool VFX later |
| Legal | CI-unfriendly but reviewable: a `tools/check_ip_words.sh` that greps the repo for Pokémon / Pikachu / Pokédex / Charizard / etc. Add in P00 or P01 |

## Content that must exist before art

P10 writes **data first** for 12 Echoes. Recommended slice roster (names draft):

| Id | Role | Types | Where |
|---|---|---|---|
| soolin | starter bloom | bloom | given |
| cindraught | starter ember | ember | given |
| marrilin | starter tide | tide | given |
| pinger | early pulse rodent | pulse | route common |
| reedling | bloom pest | bloom | reedwalk |
| siltick | tide bug | tide / stone | mud |
| sootling | ember scavenger | ember / toxin | near hub kiln |
| brimwren | gale scout | gale / pulse | day |
| lantern-kith | light / hex | light / hex | night |
| levee-back | stone wall | stone / tide | water edge |
| meterling | volt pivot | volt | relay post |
| hale’s ace (data only until Hale) | tide / bloom setter | tide / bloom | trainer-only until post |

Exact names can change; IDs should not, once shipped in a save.

## Production kill rules (repeat)

1. If an Echo is not on a map, it is cut from 1.0
2. If a Field has no transition and no residual, it is flavor text — cut or finish
3. If a quest is “collect 5,” rewrite or cut
4. If a feature is not in MASTER_LOG, it does not land in a phase
5. If P13 is not fun, we do not start P14

## Environment plan for P00

This sandbox has no Godot binary. P00 should:

1. Download the official Godot **4.6.3** Linux x86_64 standard build
2. Put it in a documented path (e.g. `tools/godot/Godot_v4.6.3-stable_linux.x86_64`) or `/usr/local/bin/godot` if permitted
3. Verify `--version`
4. Only then create the project

Do not apt-install a random ancient Godot.

## How this connects to one-prompt builds

User says `Start P00`. Agent does only P00, gates it, updates MASTER_LOG.

That is the entire process until P30.

## Sources added this pass

- Godot 4.6.3 maintenance release (2026-05-20) — godotengine.org
- Godot 4.6 release notes — godotengine.org/releases/4.6
- GUT headless + CI import pattern (Godot 4.5.x/4.6) — community CI writeups
- TileMapLayer docs; tile data bloat and chunking — Godot 4.4 class docs + 2026 TileMap guides
- Title collision: Zelda Echoes of Wisdom; Steam “Echoes of Aetheria”
- Vertical slice practice — gamedev discussions on shipping a real loop, not a trailer
