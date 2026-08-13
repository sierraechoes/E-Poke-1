# 15 — Concept Brainstorm and Flagship Recommendation

> Multiple advanced concepts, scored. One flagship locked for pre-production.

## How we scored

Criteria (1–5):

- **Thesis clarity** — can we say it in one sentence?
- **Immersion** — does the world react?
- **Mechanical novelty** — new play, not just new paint
- **Feasibility** — can a small team ship 1.0?
- **Legal distance** — would a bystander think this is Pokémon?
- **Replay / community** — mods, modes, discussion
- **Emotional hook** — would someone make fanart?

---

## Concept A — ECHOES (flagship)

**One sentence:** You attune to living frequencies in a wounded region; the places you fight in are the places you save or silence.

**Player fantasy:** Warden-researcher, not pocket monster gymnast.

**Core loops:**

1. Explore a Field → attune Echoes → use them to retune or exploit that Field
2. Circuit inspections (gym analogue) test practice, not just type
3. Ecology ledger: harvest too hard, Silence blooms, late game changes

**Signature mechanics:**

- **Resonance Fields** on every combat-capable tile, inherited from the map
- **Pact / Attunement** via negotiation + condition, harm makes it harder
- **Bond** as a resource (overdraw to rewrite a Field; neglect causes refusal)
- **Silence Zones** that spread if species are depleted
- **Inspectors** instead of typed gym leaders
- **Four endings** tied to institutions (League, Chorus, Keepers, Unbound Ear)

**Presentation:** HD-chunky pixel, overcast coastal-industrial palette, original UI (no Poké Ball chrome).

**Scores:** 5 5 5 4 5 5 5 — **total 34**

**Risks:** Ecology sim can become invisible or annoying. Mitigation: a Field almanac and obvious visual decay. Writing must stay specific.

---

## Concept B — RELIQUARY

A dungeon-first creature RPG. The overworld is a museum city. Each relic-floor is a Field. Very Siralim + SMT.

Strong thesis, weaker "immersive open" brief. Good as ECHOES' post-game facility.

**Scores:** 5 3 4 4 5 4 3 — **total 28**

---

## Concept C — TWO CURRENTS

Full Temtem-style co-op from minute one. Two attuners, shared Fields, shared ecology blame.

Novelty high, feasibility low for 1.0. Keep as **optional 2P mode** on ECHOES.

**Scores:** 4 4 4 2 5 5 4 — **total 28**

---

## Concept D — FERAL CIRCUIT

Rocket Edition energy: you play a Chorus harvester. The "gyms" are raids. Dark comedy.

Excellent as ECHOES' Chorus ending / New Game+ campaign, not the face of an OSS launch.

**Scores:** 5 4 3 3 4 3 4 — **total 26**

---

## Concept E — ROGUE FREQUENCY

PokeRogue structure, original creatures, browser-first.

Fastest to a public demo, weakest "fully immersive RPG." Build as a mode sharing ECHOES' kernel.

**Scores:** 5 2 4 5 5 5 3 — **total 29**

---

## Concept F — OPEN REACH

Crystal Clear + PLA. Full open region, ride anything, scale everything.

SV already burned players on empty open. Ecology would help, but production cost is the highest.

**Scores:** 3 4 3 2 4 3 3 — **total 22**

---

## Concept G — TYPEZERO

Too Many Types + Elite Redux. The game *is* the teambuilder.

Great for a dedicated audience, poor for "immersive." Could inform our ability/field data richness.

**Scores:** 4 2 5 3 5 5 2 — **total 26**

---

## Recommendation

**Ship Concept A (ECHOES).** Fold B, C, E as modes or post-game. Use D as a campaign branch. Steal G's data richness. Do not start with F.

### Public-facing pitch (draft)

> **ECHOES** is an open-source creature RPG about listening. In the Vesper Reach, spirits called Echoes condense around weather, ruins, and human noise. You are a licensed Attuner. The League wants them catalogued. The companies want them harvested. The wild wants them left alone. Every battle takes place in a living Field — and Fields remember what you take.

### Working proper nouns (all replaceable after trademark search)

| Role | Name |
|---|---|
| Game title | ECHOES |
| Region | Vesper Reach |
| Player job | Attuner |
| Catch | Attune / Pact |
| Storage | The Quiet (a relay that holds pacts you are not carrying) |
| Dex | Field Almanac |
| Badges | Seals of Practice |
| Gyms | Circuit Inspections |
| Elite Four | The Quorum |
| Champion | First Tuner |
| Villain-ish | Chorus Mercantile |
| Radicals | The Unbound Ear |
| Monks | Keepers of Silence |
| Currency | Reeds (or simply credits) |
| Ball analogue | Tuning Fork / Relic Bell (not thrown as a ball if we can help it) |
| Mega analogue | Overdraw |
| Legendary cluster | The Hollow Choir |

### Starter triangle (draft)

| Starter | Type lean | Culture | Joke / truth |
|---|---|---|---|
| **Soolin** | Bloom → Bloom/Veil | Harvest communes | A seed that remembers last year's flood |
| **Cindraught** | Ember → Ember/Iron | Foundry wards | A kiln-spark that wants to be a tool |
| **Marrilin** | Tide → Tide/Gloom | Harbor | A drowned kittenfish that is not cute, then is |

Final names TBD. Types use ECHOES chart, not Grass/Fire/Water words, but the triangle is teachable.

### First Field (vertical slice)

**Reedwalk Estuary** — Bloom + Tide.  
Boosts Bloom moves. Tide moves leave *mud* (speed down). Ember dries mud into cracked earth (changes Field to **Dry Pan**, which boosts Ember and hurts Tide). The first inspector *forces* you to notice this.

Wild: 8 Echoes + 4 extras at night.  
Boss: Inspector Hale, a hydrologist, not a "Water Gym Leader."

### Why this is "the most advanced"

It is not advanced because it has more systems. It is advanced because **the systems are the story**:

- The battle engine's Field is the map's biome
- The catch mechanic is the moral mechanic
- The difficulty modes let anyone finish
- The data format lets the community keep building after 1.0
- The IP is ours, so finishing is not a funeral

---

## Decision log

| Date | Decision |
|---|---|
| 2026-08-12 | Flagship = ECHOES. Original IP. Godot 4. No Nintendo data. |
| 2026-08-12 | 1.0 target: 140 Echoes, 8 inspections, 3-act semi-open map. |
| 2026-08-12 | Fusion, 2P, roguelike = post-1.0 or modes, not slice blockers. |
