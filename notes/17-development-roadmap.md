# 17 — Development Roadmap (historical)

> **Superseded for execution.** The live schedule, checklists, and status are in [`/MASTER_LOG.md`](../MASTER_LOG.md). Design locks and the type chart are in [`20-refined-production-plan.md`](20-refined-production-plan.md).
>
> This file is the first-pass roadmap (2026-08-12). Keep it for context. Do not tick boxes here.

---

## North star (original 2026-08-12 draft)

A finished, legally clean, open-source creature RPG (ECHOES) with:

- Act I–III campaign (~20 hours)
- 140 Echoes
- 8 inspections + Quorum + finale
- Fields + pacts + ecology
- Story / Tactician / Iron / Custom
- Linux / Windows / macOS builds

## Phase 0 — Foundation (2–3 weeks)

**Goal:** a repo that runs tests and a walkable stub.

- [ ] Create `game/` Godot 4 project
- [ ] `CONTRIBUTING.md`, code of conduct, IP policy (no Nintendo assets)
- [ ] Resource classes: species, move, type chart, field
- [ ] Headless damage tests (seeded)
- [ ] One dummy Echo, one move, one field
- [ ] CI on GitHub Actions
- [ ] Window that shows "ECHOES" and runs a 1v1 in text mode

**Exit:** `godot --headless -s tests/run.gd` is green on CI.

## Phase 1 — Battle kernel (3–5 weeks)

- [ ] Full singles loop: move, switch, item, flee
- [ ] Status: burn, poison, sleep, para
- [ ] Abilities as event handlers (start with 8)
- [ ] Items: 6
- [ ] Field transitions
- [ ] Attune action + formula
- [ ] AI profiles: random, type-aware
- [ ] Snapshot + event log
- [ ] Minimal battle view (sprites optional: colored rectangles OK)

**Exit:** a scripted boss fight on Reedwalk that a human can win or lose for the right reasons.

## Phase 2 — Overworld slice (3–4 weeks)

- [ ] Player controller, Y-sort, collision
- [ ] Town + indoor heal hub + route
- [ ] Dialogue runner + flags
- [ ] Wild encounter (visible + grass)
- [ ] Trainer eye-contact
- [ ] Party / bag / pause
- [ ] Save / load
- [ ] Day/night tint

**Exit:** the Phase-0 fantasy in `08` is playable by a stranger without instructions.

## Phase 3 — Vertical slice content (3–4 weeks)

- [ ] 12 Echoes finished (art pass v1, data v1)
- [ ] 3 starters (choose at the hub)
- [ ] Inspector Hale
- [ ] Almanac entries
- [ ] 8 trainers
- [ ] Music: 4 loops (town, wild, battle, boss)
- [ ] Polish: animations, SFX, UI chrome v1

**Exit:** a 45–90 minute public slice. This is the first thing that looks like a game.

## Phase 4 — Act I demo (8–12 weeks)

- [ ] 30 Echoes
- [ ] 2 inspectors
- [ ] Rival intro + Nyx intro
- [ ] First Silence bloom event
- [ ] Quest log
- [ ] Pact verbs: Part, Ferry
- [ ] Difficulty modes wired
- [ ] Controller support, rebinding
- [ ] Localization pipeline (even if only English)

**Exit:** downloadable Act I. Collect feedback. **Do not expand the map until Act I is fun.**

## Phase 5 — Production (the long middle)

Build in biome kits, not in "one more route":

1. Estuary (exists)
2. Relay City hub
3. Foundry / ash
4. Highlands / fog
5. Exclusion / Silence
6. Capital / finale spaces

Each kit: maps, 15–25 Echoes, 1–2 inspectors, one story beat, one pact verb, one Field family.

Parallel tracks:

- Art (biggest bottleneck — hire/commission if we can)
- Writing (style guide, cast bible)
- Balance (weekly kernel replays)
- Music

**Mid-production kill rules:**

- If an Echo is not placed, it is cut
- If a Field has no transition, it is cut
- If a quest is "fetch 5," it is rewritten or cut

## Phase 6 — Systems that wait until the spine exists

- Ecology tick + visual decay (can start late Phase 4)
- Move reminder, tuners, cosmetics
- Battle facility prototype (Reliquary)
- Mod folder loader
- 4× battle speed, animation skip
- Accessibility pass

## Phase 7 — 1.0 wrap

- [ ] 140 Echoes in Almanac (all catchable)
- [ ] 8 inspections + Quorum + Hollow Choir
- [ ] Three published endings (Keeper can be a fourth if written)
- [ ] Iron mode validated
- [ ] Performance budget met
- [ ] Credits, licenses of all third-party
- [ ] Full English proofread
- [ ] Steam/itch page if we choose to distribute there (free)

## Phase 8 — After 1.0

- Rogue Frequency mode
- Fusion (Bond-cost, procedural + a few handmade)
- Optional 2P
- Translation community
- Reliquary facility deep dive
- More Echoes *only if* roles are missing

## Team shape (realistic)

| Role | Minimum |
|---|---|
| Systems / combat | 1 |
| Overworld / events | 1 (can be same person) |
| Pixel art | 1 dedicated or commissions |
| Writing | 1 (can be same as design) |
| Music | commission |
| Producer | the person who cuts scope |

A single talented generalist can reach the vertical slice. 1.0 as a solo is possible and will take 18–36 months. A trio can do it in 12–18 if art is staffed.

## What we will not schedule

- Rewriting the engine mid-production
- A second region
- Voice acting
- "All the QoL Unbound ever added" before Act I
- A custom 3D engine
- Anything that requires a Nintendo ROM to compile

## Immediate next tasks (after these notes)

1. Agree the flagship (already recommended: ECHOES)
2. Trademark-search the public name before it hardens
3. Start Phase 0 Godot project
4. Write the 12-Echo design sheets (`09` pipeline)
5. Draft Inspector Hale's team and the Reedwalk transition table

Research is complete enough to build.
