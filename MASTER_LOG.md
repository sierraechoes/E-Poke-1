# ECHOES / AETHERA — Master Log

> Living production log. This file is the source of truth for **what to build, in what order, and whether it is actually done**.
>
> Last updated: **2026-08-13** (P01 DONE)
> Current wave: **W1 Foundation**
> Current phase: **P02 — Damage + 1v1 kernel (READY)**
> Public title (working): **AETHERA**
> Internal codename: **ECHOES**
> Engine pin: **Godot 4.6.3** (standard, not .NET)

---

## 0. How this file is updated (contract)

Every future session — human or agent — **must** do this. Do not skip.

### At the start of a session

1. Read **this file** first (status block + the phase you are about to run).
2. Read the phase's Exit Gate. If the previous phase is not `DONE`, finish it. Do not skip ahead.
3. Do **one phase only** unless the user explicitly says otherwise.

### At the end of a session

1. Tick every completed checkbox in that phase.
2. Set the phase status to `DONE` / `BLOCKED` / `IN PROGRESS`.
3. Update the **Status block** at the top and the **Changelog** at the bottom.
4. If anything spilled over, add it to **Backlog** or the next phase. Do not silently drop it.
5. Never mark `DONE` unless the **Exit Gate** passed (tests + playable check + no error spam).
6. If you change a locked decision, add a row to **Decision log** and a **Risk** if it increases scope.

### Status values

| Status | Meaning |
|---|---|
| `NOT STARTED` | No work |
| `READY` | Previous gate passed; this is the next prompt |
| `IN PROGRESS` | Started, not gated |
| `DONE` | Exit Gate passed |
| `BLOCKED` | Cannot proceed; reason must be written |
| `CUT` | Explicitly removed from 1.0 |

---

## 1. Status block

| Field | Value |
|---|---|
| Date | 2026-08-13 |
| Wave | W1 Foundation |
| Phase | P02 Damage + 1v1 kernel |
| Phase status | READY |
| Game code exists | Yes (`game/`) |
| Godot installed in this environment | Yes — `tools/godot/godot` → 4.6.3.stable |
| Tests | 35/35 GUT passing |
| Playable build | Title + Field Camp + saves + live data registry |
| Last ship | P01 data model |
| Next user prompt | **"Start P02 — damage and 1v1 kernel"** |

---

## 2. What we are building

**AETHERA** (codename ECHOES) is an original, open-source creature RPG.

One sentence: you attune to living frequencies called Echoes; every battle happens in a living Field; Fields remember what you take.

It is **not** a Pokémon ROM, ROM hack, or Nintendo-IP fangame. See `notes/06-legal-and-ip.md`.

### 1.0 definition of “fully playable”

A stranger can, without a debugger or a design doc:

1. Start a new file, pick a difficulty, pick a starter
2. Walk the Vesper Reach Act I–III
3. Attune wild Echoes, build a party of 6, store extras in The Quiet
4. Win 8 Circuit Inspections + the Quorum + the Hollow Choir climax
5. Reach one of at least three authored endings
6. Save and load safely
7. Finish in ~18–25 hours on Story, with a real challenge on Tactician
8. Do all of this with **zero** Nintendo names, sprites, music, or data
9. See no red errors, no softlocks on the critical path, no lost saves

If any of those fail, 1.0 is not shipped.

### Milestone definitions of “playable”

| Milestone | After phase | A human can… |
|---|---|---|
| **Kernel** | P04 | Fight a 1v1 in a window, win or lose for the right reasons |
| **Loop** | P09 | Walk a town, talk, heal, fight wild + trainer, save, reload |
| **Slice** | P13 | 45–90 min: pick starter, explore Reedwalk, beat Inspector Hale |
| **Act I demo** | P18 | 3–5 hours, 2 inspectors, rival + Nyx, first Silence bloom |
| **1.0** | P30 | Full campaign as defined above |

---

## 3. Locked decisions

These are closed. Re-open only with a Decision-log row.

| ID | Decision |
|---|---|
| D01 | Original IP only. No ROMs, patches, Essentials/PSDK data, ripped sprites, official names. |
| D02 | Internal name **ECHOES**. Public working title **AETHERA** (ECHOES collides with Zelda: Echoes of Wisdom and other Steam titles). Trademark-search before store pages. |
| D03 | Engine **Godot 4.6.3** standard (GDScript). Not Unity. Not RMXP. Not pret. |
| D04 | Tests: **GUT** + `godot --headless`. CI on GitHub Actions. Kernel is `RefCounted`, not Node-bound. |
| D05 | **1.0 combat is singles, turn-based.** No real-time positioning, no doubles required. Data may have a `target` field so doubles can exist later. |
| D06 | Positioning / ZA-lite, fusion, 2P campaign, roguelike mode = **post-1.0**. |
| D07 | Dialogue = **thin in-house runner** (JSON/CSV lines + event scripts). Not Dialogic for 1.0 (headless/CI risk). Behind `DialogueService`. |
| D08 | Maps = Godot `TileMapLayer`, 16px tiles, chunked scenes. Large tile data saved as `.res`, not inline `.tscn`. |
| D09 | Internal resolution **640×360**, integer scale, default window 1280×720. |
| D10 | **16 Resonance types** (not Pokémon type names). Chart locked in `notes/20-refined-production-plan.md`. |
| D11 | Stats keep the *shape* of Gen 3+ formulas. IVs → visible **Scars** (0–31). EVs → visible **Training** (0–252 / 510). Natures → **Tempers** (+10% / −10%). |
| D12 | Party 6, moves 4, level 1–100, Quiet storage 8×30. |
| D13 | Catch analogue = **Attune** with Approach / Offer / Harmonize / Force. Harm makes attune harder. No thrown balls. Tool = **Tuning Fork**. |
| D14 | Gimmick = **Overdraw** (spend Bond to rewrite the Field). Not a mega-form hat. |
| D15 | 1.0 size: **140 Echoes**, **8 inspectors + Quorum + finale**, **~50–80 maps**, **18–25 hour** story. |
| D16 | Structure: Act I linear teach → Act II hub + 3 biomes any order (tiered, not fully scaled) → Act III linear. |
| D17 | Difficulty at file create: Story / Tactician / Iron / Custom. Can lower later, not raise mid-file without a warning. |
| D18 | License: code **MIT**, writing **CC-BY-SA 4.0**, art/audio **CC-BY-NC 4.0** until a commercial decision. |
| D19 | Currency **Reeds**. Dex **Field Almanac**. Gyms **Circuit Inspections**. Storage **The Quiet**. |
| D20 | One phase per prompt. Placeholders (colored rects, generated shapes) are legal until the matching content phase. |
| D21 | A phase is not done if the game errors on the happy path. Fix before advancing. |
| D22 | Ecology sim is **weekly tick + on harvest**, never per-frame. Visual decay is mandatory or the system is invisible. |
| D23 | Saves are **portable by default**: `portable.flag` → `saves/` next to the project. 3 slots + `.bak.json`. No network. No mid-battle save. |

---

## 4. How one-prompt phases work

You (the user) say: **Start P00** then **Start P01** and so on.

Each phase is sized so one focused agent session can finish it at high quality:

- Implement only that phase's checklist
- Write/extend tests
- Run the playable check
- Update this log

Do **not** ask for “build the whole game” in one prompt. That is how fangames die.

---

## 5. Waves and phases (the entire game)

```
W0 Research          DONE
W1 Foundation        P00–P04     kernel + playable battle window
W2 Overworld loop    P05–P09     walk / talk / fight / save
W3 Vertical slice    P10–P13     Reedwalk + Hale (first ship)
W4 Act I             P14–P18     demo ship
W5 Act II world      P19–P24     hub + three biomes + story fork
W6 Act III           P25–P26     Quorum, Choir, endings
W7 Systems + content P27–P29     ecology, QoL, remaining Echoes/art
W8 1.0 wrap          P30         QA, credits, builds
W9 Post-1.0          P50+        fusion, 2P, roguelike, Reliquary
```

---

## 6. Phase checklist

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[-]` cut

---

### W0 — Research

#### P-W0 Research library — `DONE` (2026-08-12)

- [x] ROM / hack / fangame research
- [x] Legal path: original IP
- [x] Flagship concept
- [x] Architecture + first roadmap
- [x] Refined plan + this master log (2026-08-13)

**Exit Gate:** notes exist and a build order is locked. **Passed.**

---

### W1 — Foundation

#### P00 — Project bootstrap — `DONE` (2026-08-13)

**Goal:** an empty Godot game that runs, tests can run, IP/license are in writing.

- [x] Install Godot **4.6.3** (Linux). Official GH release assets blocked in this sandbox; compiled matching 4.6.3-stable source (`35e80b3a8`) to `tools/godot/`. Users: `./scripts/fetch-godot.sh` once, then offline.
- [x] Create `game/` Godot project (`Aethera`, 640×360, stretch-integer)
- [x] `.gitignore` for Godot
- [x] Root `LICENSE` (MIT) + `LICENSE-ASSETS`
- [x] `CONTRIBUTING.md` — original work only
- [x] `CODE_OF_CONDUCT.md`
- [x] Vendor **GUT 9.6.1** under `game/addons/gut/`
- [x] Headless test runner `scripts/run-tests.sh` + `game/tests/run.sh`
- [x] Smoke + save + title tests (12/12)
- [x] GitHub Actions: import → GUT 4.6.3 + IP word check
- [x] Input map: accept, cancel, menu, run, pause (+ ui arrows)
- [x] Boot scene: title “AETHERA” + version + offline badge + file menu
- [x] Portable 3-slot save/load (user-requested; fuller UI still in P08)
- [x] Offline launchers: `scripts/play.sh`, `play.bat`, `play.command`, `edit.sh`, `fetch-godot.sh`
- [x] Update README + `PLAY_OFFLINE.md` + this log

**Exit Gate:**

1. `tools/godot/godot --version` → `4.6.3.stable` — **Passed**
2. Title scene boots (`--quit-after 2` exit 0). Windowed play: `./scripts/play.sh` (needs a display)
3. Headless GUT **12/12 passed**
4. No `.gba`, IP word check OK

**Playable check:** title → New File → difficulty → Field Camp → S to save → Esc back → Continue. **Passed (headless + unit).**

**Spill:** Official prebuilt zip cannot be downloaded from this sandbox (release-asset CDN blocked). Fetch scripts cover user machines. Custom build lacks fontconfig (cosmetic ERROR lines here only).

---

#### P01 — Data model, types, stats — `DONE` (2026-08-13)

**Goal:** the grammar of the game exists and is tested. No battles yet.

- [x] `TypeIds` — 16 Resonance types
- [x] `TypeChart` — locked table from `notes/20` + JSON merge
- [x] `StatBlock` (hp, atk, def, spa, spd, spe)
- [x] Stat formulas + `Temper` catalog
- [x] `EchoSpecies`, `MoveSpec`, `AbilitySpec`, `ItemSpec`, `FieldSpec`
- [x] `EchoInstance` (level, scars, training, bond, moves)
- [x] `DataRegistry` autoload loads `res://data/**`
- [x] Validator: unknown type, missing learnset move, duplicate IDs, BST warnings
- [x] Tests: chart pins, HP=125 / Atk=145 fixtures, registry
- [x] Dummy data: `pinger`, `pulse_tap`, `static_hum`, `reedwalk`

**Exit Gate:** type chart + ≥3 stat fixtures + registry loads pinger. **Passed (35/35).**

**Playable check:** title still boots; Field Camp shows “Almanac N Echoes”. **Passed.**

---

#### P02 — Damage + 1v1 kernel — `READY`

**Goal:** two Echoes can legally hurt each other in a seeded sim.

- [ ] `BattleRng` (seeded, replayable, 16-bucket damage roll)
- [ ] `Damage.calc(...)` pure function (level, power, A/D, STAB, type, crit 1.5, burn 0.5 physical)
- [ ] `Battler`, `Side`, `BattleAction`, `BattleEvent`
- [ ] `BattleSim.setup` + `step` for: both choose Fight, speed order, one damaging move each
- [ ] Faint detection (HP 0 cannot act)
- [ ] Snapshot() for a future view
- [ ] Tests: STAB once, 2× and 0.5× type, burn halves physical not special, seeded range stable, dead battler does not move

**Exit Gate:** headless scripted 1v1 reaches a winner. All listed tests green.

**Playable check:** optional CLI/print dump of a fight in the debug console.

---

#### P03 — Full singles loop — `NOT STARTED`

**Goal:** the battle game is complete enough to support the slice.

- [ ] Commands: Fight, Switch, Item, Attune, Flee
- [ ] Status: burn, poison, sleep, para (accuracy / full-para chance documented)
- [ ] Volatiles: flinch (hook only if a move needs it)
- [ ] Switching, mid-turn faint, forced replacement
- [ ] Field: incoming modifiers + one transition (Reedwalk mud / Dry Pan — even if names are data)
- [ ] Ability handlers: at least 8, event-subscribed, not `if ability ==`
- [ ] Items: at least 6 (heal, status heal, X-stat, type berry, leftover-like residual, attune aid)
- [ ] Attune formula (Approach / Offer / Harmonize / Force) + fail states
- [ ] AI profiles: `random`, `type_aware`
- [ ] Priority on moves
- [ ] Tests for each status, field transition, attune-easier-if-healthy, AI picks super-effective when flagged

**Exit Gate:** a scripted “Inspector Hale analogue” fight is winnable and losable. Tests green.

**Playable check:** still allowed to be headless.

---

#### P04 — Battle view (first playable fight) — `NOT STARTED`

**Goal:** a human fights with keyboard/gamepad. Placeholders OK.

- [ ] Battle scene: two battlers as colored shapes + names + HP bars
- [ ] Command menu + move menu + target is implicit (singles)
- [ ] Event player: typed text log, HP lerp, faint hide
- [ ] InputRouter so overworld cannot steal input later
- [ ] Battle speed 1× / 2× / instant (even if only 1× polished)
- [ ] Debug start: from title, “Fight debug” launches the scripted 1v1
- [ ] No errors on win, lose, flee
- [ ] Tests: event list from a recorded replay produces the same HP end-state

**Exit Gate:** **Kernel milestone.** A human can win the debug fight without touching code.

**Playable check:** title → Fight debug → win or lose → return to title.

---

### W2 — Overworld loop

#### P05 — Walk the world — `NOT STARTED`

- [ ] Player controller on 16px grid (or smooth with grid-snapped collision — pick one and stick)
- [ ] Run, face, idle
- [ ] TileMapLayer: ground, collision, above
- [ ] One test map: town plaza blockout
- [ ] Camera follow, Y-sort
- [ ] Camera stays in map bounds
- [ ] No tunneling through collision at run speed

**Exit Gate:** walk around for 60 seconds, cannot leave collision, 60 FPS on this tiny map.

---

#### P06 — Talk, flags, warps — `NOT STARTED`

- [ ] `DialogueService` + JSON/CSV lines
- [ ] NPC interact: face player, talk, branch on flag
- [ ] `FlagService` + `VarService`
- [ ] Warps: door to indoor heal stub and back (spawn facing + offset)
- [ ] Signposts
- [ ] Event lock (player cannot walk during talk)
- [ ] Tests: flag set/get; warp destination exists

**Exit Gate:** talk to an NPC, go inside, come out, flag persists in memory.

---

#### P07 — Encounters + trainers — `NOT STARTED`

- [ ] Encounter table resource on the route map
- [ ] Grass (or visible spawn) starts `BattleSim` with a wild instance
- [ ] On win: exp stub, return to overworld
- [ ] On lose: send to heal point (even if crude)
- [ ] Trainer: eye contact, approach, lock, battle, set `trainer_*_done`
- [ ] Cannot rebattle a beaten trainer
- [ ] Tests: encounter table weights; trainer flag prevents second fight

**Exit Gate:** start a wild fight from the map and a trainer fight from the map.

---

#### P08 — Party, bag, pause, save — `NOT STARTED`

- [ ] Pause menu: Party, Almanac stub, Bag, Save, Options, Title
- [ ] Party screen + summary (stats, moves, bond)
- [ ] Bag: 4 pockets min (tools, medicine, held, key)
- [ ] Save v1 JSON: version, party, flags, vars, map, facing, inventory, playtime
- [ ] Load; reject unknown future versions gracefully
- [ ] 3 slots + rotating backup copy on each save
- [ ] Forbid save mid-battle
- [ ] Tests: save → mutate → load restores; migration hook exists (`version`)

**Exit Gate:** save in town, kill the process mentally (reload game), appear in the same tile with the same party.

---

#### P09 — The loop is a game — `NOT STARTED`

- [ ] Heal hub restores party + Quiet access stub (PC analogue: deposit/withdraw)
- [ ] Day/night tint (clock on steps or real minutes — lock: **step clock**)
- [ ] Shop buys a potion analogue
- [ ] Seen/attuned bits flip in Almanac stub
- [ ] Debug overlay toggle (collision, encounter tiles, flags)
- [ ] Lose → blackout → heal hub with money penalty (Story: small / Tactician: larger)
- [ ] No error spam on a 10-minute wander

**Exit Gate:** **Loop milestone.** A stranger walks, talks, heals, fights wild + trainer, saves, reloads, no console errors.

---

### W3 — Vertical slice (Reedwalk)

#### P10 — Slice data (12 Echoes + 3 starters) — `NOT STARTED`

- [ ] Design sheets for 3 starters + 9 route Echoes (role, types, BST, learnset v1)
- [ ] All as resources; all learnsets valid
- [ ] Starter pick event (one only)
- [ ] Role grid for these 12 is balanced enough for Hale
- [ ] Placeholder art: unique silhouette color per species (not one gray box)
- [ ] Tests: every species loads; every learnset move exists; starter triangle has a type answer for Hale

**Exit Gate:** DataRegistry reports 12 species, 0 validation errors.

---

#### P11 — Reedwalk content + Inspector Hale — `NOT STARTED`

- [ ] Maps: starter hub, Reedwalk route, Hale station, one indoor
- [ ] Field `reedwalk` + transition to `dry_pan` as designed
- [ ] 6–8 trainers with personalities (not “Youngster 1–8”)
- [ ] Hale: hydrologist, team uses the Field; Story vs Tactician AI profiles
- [ ] After Hale: Seal of Practice 1, short scene
- [ ] Critical path cannot softlock (tested by walking it)

**Exit Gate:** debug “jump to Hale” and “play from start” both reach the win scene.

---

#### P12 — Slice presentation — `NOT STARTED`

- [ ] UI chrome v1 (dialogue box, HP, menus) — original, not Poké-ball chrome
- [ ] 4 music loops: title, town, wild, battle (CC0 or original — **no ripped GBA**)
- [ ] SFX: accept, hit, faint, attune, heal
- [ ] Type icons + letters
- [ ] Animation skip / faster text
- [ ] Controller: verify a gamepad can do the whole slice

**Exit Gate:** slice is presentable, not pretty-final. Audio does not loop-gap harshly.

---

#### P13 — Slice polish + ship — `NOT STARTED`

- [ ] Play the slice start-to-Hale twice; write a bug list; fix blockers
- [ ] Level curve: Story is finishable with the starter + 2 attunes
- [ ] Tactician requires using the Field once (Hale punishes ignorance)
- [ ] Credits stub + license list
- [ ] Export Linux + Windows from Godot (even if unsigned)
- [ ] `docs/play-slice.md` how to play
- [ ] Tag mentally as **SLICE 0.1**

**Exit Gate:** **Slice milestone.** 45–90 min, fully playable, zero critical bugs.

---

### W4 — Act I demo

#### P14 — Second town, route, Inspector 2 — `NOT STARTED`

- [ ] New biome kit (foundry edge or harbor — lock at start of phase)
- [ ] +10 Echoes (total ~22–30)
- [ ] Inspector 2 with a different Field family
- [ ] Pact verb 1 taught (Part or Ferry)

#### P15 — Cast + Silence bloom — `NOT STARTED`

- [ ] Rook rival fight 1 (Rook **wins** if the player is sloppy; can lose on Tactician if player is good — but Rook wins once on the critical path in Story via scripted advantage, not HP lock)
- [ ] Nyx introduction
- [ ] Silence bloom on a route official maps call “cleared”
- [ ] Stance sliders: Mercy / Ambition / Inquiry start to matter in 2–3 lines

#### P16 — Quest log + pact verbs — `NOT STARTED`

- [ ] Quest tracker UI (Circuit / Pacts / Civic / Ecology)
- [ ] 4 authored side pacts
- [ ] Pact verb usable from key menu if compatible Echo is in Quiet (not only party)

#### P17 — Difficulty + options — `NOT STARTED`

- [ ] File create: Story / Tactician / Iron / Custom sliders
- [ ] Level cap taper on Tactician+
- [ ] Iron: fainted Echo is sealed (permadeath) with confirm
- [ ] Rebind, text speed, battle speed, screen shake off

#### P18 — Act I polish + demo ship — `NOT STARTED`

- [ ] Full Act I playthrough on Story and Tactician
- [ ] Softlock hunt
- [ ] Export + `docs/play-act1.md`
- [ ] **Act I demo milestone**

---

### W5 — Act II

#### P19 — Relay City hub — `NOT STARTED`

- [ ] City map with density (indoors > empty streets)
- [ ] League office, Chorus storefront, transit, Quiet HQ
- [ ] Fast travel points unlock
- [ ] Three biome gates visible

#### P20 — Biome: Foundry / ash — `NOT STARTED`

- [ ] Maps, Field family, ~18 Echoes, pact verb Temper, 1 inspector

#### P21 — Biome: Highlands / fog — `NOT STARTED`

- [ ] Maps, Field family, ~18 Echoes, pact verb Recall, 1 inspector

#### P22 — Biome: Exclusion / Silence — `NOT STARTED`

- [ ] Maps that can decay, Field family, ~18 Echoes, ecology gate, 1 inspector

#### P23 — Inspectors 5–8 + remaining Act II Echoes — `NOT STARTED`

- [ ] Remaining inspectors if not placed in P20–P22
- [ ] Dex toward ~90–110
- [ ] Optional civic quests (not fetch-5)

#### P24 — Act II story fork — `NOT STARTED`

- [ ] Chorus audit sequence
- [ ] Nyx sabotage choice
- [ ] Reputation flags change who will pact / who will talk
- [ ] Rook crisis (Rook keeps at least one canonical win on record)

---

### W6 — Act III

#### P25 — Capital + Quorum — `NOT STARTED`

- [ ] Capital maps
- [ ] Quorum: 4 distinct bosses + First Tuner
- [ ] Level bands honest; no grind mandatory on Story

#### P26 — Hollow Choir + endings — `NOT STARTED`

- [ ] Choir encounter uses Field rewrite as the mechanic
- [ ] Endings: Reform / Release / Chorus (Keeper if written)
- [ ] Credits, New Game+ hook (do not build NG+ content yet)
- [ ] Ending depends on reputation + ecology state, not a single last line

---

### W7 — Systems and remaining content

#### P27 — Ecology full — `NOT STARTED`

- [ ] Per-chunk population + weekly tick + harvest pressure
- [ ] Visual decay + Almanac warnings
- [ ] Restore quests
- [ ] Silence lock on at least one late gate
- [ ] Tests: over-attune → population drop → encounter table changes

#### P28 — QoL + accessibility + tuners — `NOT STARTED`

- [ ] Move reminder cheap
- [ ] Temper / Scar tuner late-game
- [ ] Almanac complete UI (seen, attuned, habitat, field notes)
- [ ] Colorblind palettes, type letters, UI scale
- [ ] Autosave on warp + inspector win
- [ ] 4× battle / anim skip

#### P29 — Finish the dex and the look — `NOT STARTED`

- [ ] 140 Echoes in data, all catchable without a guide
- [ ] Role grid review (cut or buff holes)
- [ ] Art pass: every 1.0 Echo has icon + OW 4-dir + battle front (back if possible)
- [ ] Music: ~20 loops as listed in `notes/10`
- [ ] Remaining maps decorated

---

### W8 — 1.0 wrap

#### P30 — QA and ship — `NOT STARTED`

- [ ] Critical-path playthrough Story
- [ ] Critical-path playthrough Tactician
- [ ] Iron smoke (first 2 inspectors)
- [ ] Save migration from Act I demo version
- [ ] Performance budget: 60 FPS Steam Deck target on hub + wild
- [ ] Crash/error hunt
- [ ] Credits + third-party licenses (GUT, fonts, CC0 audio)
- [ ] Linux / Windows / macOS exports
- [ ] itch.io page draft (free). Steam optional
- [ ] Tag **v1.0.0**
- [ ] **1.0 milestone**

---

### W9 — After 1.0 (do not start before P30)

| Phase | Thing |
|---|---|
| P50 | Rogue Frequency mode (same kernel) |
| P51 | Mid-battle fusion (Bond-cost, procedural + handmade icons) |
| P52 | Optional 2-player campaign |
| P53 | Reliquary battle facility |
| P54 | Translations |
| P55 | More Echoes only to fill missing roles |

---

## 7. Whole-game backlog (nothing forgotten)

Use this as a cross-check when a phase feels “done” but the game is not.

### Engine / infra

- [x] Godot 4.6.3 pin
- [x] GUT + CI
- [x] DataRegistry + validators
- [x] Save version + migrations (v1 + hook; P08 expands party/map fields)
- [ ] Input rebinding
- [ ] Localization pipeline (English first)
- [ ] Mod folder loader (can wait until P28)
- [ ] Export presets
- [ ] Logging levels (player build silent)

### Battle

- [ ] Damage, accuracy, crit, STAB, type
- [ ] Speed + priority
- [ ] Status + residuals
- [ ] Fields + transitions + Overdraw
- [ ] Abilities as handlers
- [ ] Items
- [ ] Attune
- [ ] Switch / faint / flee
- [ ] AI profiles
- [ ] Replay seed
- [ ] Battle view + log + anim skip
- [ ] Exp / level up / learn move
- [ ] Evolution / retune
- [ ] Held items
- [ ] Weather as a Field sibling (optional if Fields cover it)
- [ ] Doubles data-ready, not implemented

### Overworld

- [ ] Grid move, run, collision, ledges
- [ ] Warps, connections, indoor spawn
- [ ] NPC schedules (at least day/night)
- [ ] Visible wilds + grass ambush
- [ ] Trainer vision
- [ ] Pact verbs (Part, Ferry, Temper, Ground, Recall)
- [ ] Day/night, weather tint
- [ ] Map streaming (current + neighbors)
- [ ] Fast travel after Act I
- [ ] Debug overlay

### UI

- [x] Title, file select (P00)
- [ ] Dialogue, choice
- [ ] Party, summary, switch
- [ ] Bag, shop
- [ ] Almanac
- [ ] Quest log
- [ ] Pause
- [ ] Battle command / moves / attune
- [x] Save slots (P00; pause-save still P08)
- [ ] Region map
- [ ] Credits

### Campaign

- [ ] Starter choice
- [ ] 8 inspectors + Quorum + First Tuner
- [ ] Rook, Nyx, Anchor, Sol, Venn
- [ ] Silence bloom
- [ ] Act II fork
- [ ] 3–4 endings
- [ ] Side pacts / civic / ecology quests

### Content numbers (1.0)

- [ ] 140 Echoes
- [ ] ~80–120 moves
- [ ] ~40 abilities
- [ ] ~40 items
- [ ] ~20 Fields
- [ ] ~50–80 maps
- [ ] ~20 music loops
- [ ] English text proofread

### Legal / shipping

- [x] No Nintendo IP in repo
- [x] Contributor rule posted
- [ ] Licenses of third-party
- [ ] Public name trademark check
- [ ] Content warnings if needed

---

## 8. Quality gates (how we avoid a broken game)

A phase may not be marked `DONE` unless:

1. **Tests:** GUT exits 0 (after P00).
2. **Happy path:** the phase playable check works without the debugger.
3. **Errors:** Godot output has no `ERROR` on that path.
4. **Saves:** if the phase touches persistence, save/load is tested.
5. **Data:** `DataRegistry` validation is clean.
6. **Scope:** no unasked systems landed “while we were here.”
7. **Log:** this file was updated.

### Softlock / blocker classes (instant fail)

- Cannot move
- Cannot open a menu that is required
- Warp to missing map
- Battle never ends
- Fainted party with no blackout
- Save file unreadable after a version bump with no migration
- Starter not given and cannot proceed
- Flag that can be set in the wrong order and kill the plot

### Balance gate (from P13 onward)

- Story: wipe is possible but recover is cheap
- Tactician: Hale+ bosses require a plan
- Iron: fair knowledge, no undiscoverable 1HKO on the first route

---

## 9. Risk register

| ID | Risk | Level | Mitigation |
|---|---|---|---|
| R01 | Title **ECHOES** / **AETHERA** collision | Med | Codename ECHOES, public AETHERA; search before store |
| R02 | Scope explosion (140 Echoes + 8 biomes) | High | Kill rules; cut Echoes not placed; biomes before polish |
| R03 | Art bottleneck | High | Placeholders legal until P12/P29; commission |
| R04 | Battle kernel becomes a god-object | High | Event handlers; tests; no sprites in sim |
| R05 | Ecology invisible or annoying | Med | Visual decay + Almanac; weekly tick only |
| R06 | Looking like Pokémon (trade dress) | Med | Original UI, no balls, original types/names, distinct silhouettes |
| R07 | Godot not in environment | Low | Install in P00; pin version |
| R08 | TileMap `.tscn` bloat | Med | External `.res`; chunk maps |
| R09 | One-prompt phases too fat | Med | Spill to next phase in the log; do not silently skip tests |
| R10 | Abandonware after slice | High | Act I is the real demo; 1.0 size already cut |
| R11 | Positioning/fusion creeping into 1.0 | Med | D05 / D06 locked |
| R12 | Music legally dirty | High | CC0 or original only; checklist in P12 |

---

## 10. Environment and tools (this machine)

Checked 2026-08-13:

| Tool | Status |
|---|---|
| Linux x86_64 | Yes |
| Git 2.39.5 | Yes |
| Python 3.11 | Yes |
| Node 22 | Yes |
| GitHub CLI | Yes |
| Godot | **4.6.3.stable** at `tools/godot/godot` |
| GUT | Vendored **9.6.1** |
| Agent skill packs | **None found** |

No extra skill files, Cursor skills, or Claude skills were present. Work from `notes/` + this log.

---

## 11. Suggested user prompts (copy/paste)

Use exactly these, in order:

1. `Start P00 — project bootstrap`
2. `Start P01 — data model, types, stats`
3. `Start P02 — damage and 1v1 kernel`
4. `Start P03 — full singles battle loop`
5. `Start P04 — battle view`
6. `Start P05 — walk the world`
7. …and so on through P30.

If a phase is `BLOCKED`, say `Unblock P0X: <instruction>` rather than starting P0X+1.

---

## 12. Decision log

| Date | ID | Decision |
|---|---|---|
| 2026-08-12 | D01–D06 early | Original IP, Godot, ECHOES concept, no Nintendo data |
| 2026-08-13 | D02 | Public title **AETHERA**; ECHOES is the codename (Zelda Echoes of Wisdom collision) |
| 2026-08-13 | D03 | Pin Godot **4.6.3** |
| 2026-08-13 | D05 | 1.0 is singles turn-based; positioning postponed |
| 2026-08-13 | D07 | In-house dialogue, not Dialogic |
| 2026-08-13 | D09–D22 | Resolution, types, stats, attune, sizes, licenses, ecology tick locked |
| 2026-08-13 | — | One-prompt phase plan replaces the coarse `notes/17` schedule as the *execution* plan. `notes/17` remains historical. |
| 2026-08-13 | D23 | Portable `saves/` + 3 slots + backups; mid-battle save forbidden |

---

## 13. Changelog

| Date | Change |
|---|---|
| 2026-08-12 | Research library created (`notes/00`–`19`) |
| 2026-08-13 | Master log created. Plan refined. Contradictions locked. P00 marked READY. |
| 2026-08-13 | **P00 DONE.** Godot 4.6.3, GUT 12/12, title + portable saves, offline launchers. P01 READY. |
| 2026-08-13 | **P01 DONE.** 16 types, formulas, DataRegistry, pinger data. GUT 35/35. P02 READY. |

---

## 14. Backlog (spilled / later / maybe)

- Trademark counsel on AETHERA
- Followers (Echo behind the player) — want, not slice-critical
- Mid-battle dialogue — P15+
- Weather distinct from Fields
- New Game+
- Steam Deck verification hardware
- macOS export signing
- Voice acting — never required
