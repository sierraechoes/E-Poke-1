# 03 — Famous ROM Hacks (Catalog and Dissection)

> What the major hacks are, what they changed, and what each one teaches a new original game.

Status notes are community consensus as of 2026 research. Projects move. Verify before playing.

## How to read this catalog

Each entry lists: base ROM, thesis, signature systems, finish state, and **steal / avoid**.

"Steal" means *design ideas*. Not code, not assets, not names.

---

## The current Mount Rushmore

### Pokémon Unbound (Skeli et al.)

- **Base:** FireRed + CFRU/DPE
- **Region:** Borrius (original)
- **Thesis:** The definitive modern GBA Pokémon game
- **Status:** Complete
- **Why it is the measuring stick**
  - Original region, original story, original soundtrack (~180 tracks)
  - Gen 8-class battle engine, Megas, Z-Moves, Fairy, phys/spec split
  - Four difficulties (Easy → Insane) with a real AI rewrite
  - ADM key item replaces HM slaves
  - Quest / mission log (80+ missions)
  - Character customization, day/night, DexNav, daily raids, mining
  - Gen 4 overworld look, Gen 5-ish UI
  - Dark-story toggle without collapsing into grimdark
- **Steal:** difficulty as a first-class mode; mission log; no-HM-slave key item; item-first-pickup tutorials; overworld utility creatures (heal, PC, ferry); post-game that is a *second loop*; original OST as identity
- **Avoid:** gym gimmicks that invalidate the player's normal skills (permanent fog on gym 1 is polarizing); "every Pokémon through Gen 8" scope if we are a small team

### Pokémon Radical Red

- **Base:** FireRed
- **Region:** Kanto, rebuilt as a competitive gauntlet
- **Thesis:** Every major fight is a Smogon puzzle
- **Status:** Complete / actively updated (Gen 9 content in later revisions)
- **Why it matters**
  - Full modern dex, Megas, Z-Moves, some Gmax
  - Reusable TMs, no-HM-friction, modern exp
  - AI that punishes lazy play
  - Monotype, randomized, and nuzlocke-friendly options
  - Tasteful fakemon / regional touches without becoming a fakemon game
- **Steal:** battles as puzzles; refillable battle items; make "bad" species viable via data, not lectures; challenge modes as presets
- **Avoid:** story is not the point here — do not copy Kanto-again unless the thesis is mechanical

### Pokémon Crystal Clear

- **Base:** Crystal (GBC)
- **Thesis:** Open-world Johto/Kanto. Gyms in any order
- **Steal:** player-directed structure; document how scaling works so it does not feel fake
- **Avoid:** empty openness. Freedom without reasons to go somewhere is SV's problem

### Pokémon Polished Crystal

- **Base:** Crystal decomp
- **Thesis:** The Crystal you remember, with the QoL it always deserved
- **Steal:** "vanilla-plus" as a product. Not every game must reinvent the region
- **Note:** for *our* original game this is a QoL checklist, not a concept

### Renegade Platinum (Drayano)

- **Base:** Platinum (NDS)
- **Thesis:** Sinnoh, but every species is usable and trainers are awake
- **Steal:** Drayano's whole philosophy — buff the weak, buff the trainers, keep the soul
- **Drayano family:** Sacred Gold / Storm Silver, Blaze Black / Volt White (+ Redux), etc. The most trusted "enhancement hack" brand

### Pokémon Emerald Kaizo / Run & Bun / Lucid / Imperium

- **Thesis:** Kaizo = ROM-hack Super Meat Boy. Run & Bun is often cited as the current skill ceiling
- **Steal:** handcrafted mandatory fights, documented AI, fairness even at brutality
- **Avoid:** as a *default* mode. Kaizo is a genre, not a mass-market game. Offer it as Iron Mode

---

## Original-region GBA classics

| Hack | Base | Why people still mention it |
|---|---|---|
| **Gaia** | FireRed | Beautiful original region, "feels official," long development, high craft |
| **Glazed** | FireRed | Multi-region, beginner-friendly, complete, slightly dated but beloved |
| **Light Platinum** | Ruby | Early "new region" phenomenon. Design is rougher; historically important |
| **Flora Sky** | Emerald | New region, popular mid-2010s |
| **Resolute** | FireRed | Ambitious story/region |
| **Prism** | Crystal | Original region on Gen 2 engine. Famous also for its takedown drama |
| **Brown** | Red | Ancient (2000s) original-region hack, still updated as a curiosity/classic |
| **Clover** | FireRed | /vp/ meme fakemon. Surprisingly tight design under the jokes. Not safe-for-all-audiences |
| **Kanlara Ultimate** | FireRed | Fakemon + extra types |
| **Snakewood** | Ruby | Horror/zombie Pokémon. Stygian Snakewood is the fangame remake |
| **CAWPS** | FireRed | Adult comedy. Proof that tone is a choice — and a branding risk |
| **Nameless** | FireRed | Dark narrative focus |
| **Rocket Edition** (Dragonsden) | FireRed | Play as Team Rocket. One of the best "invert the protagonist" hacks. Hoenn arc in progress |
| **Ash Gray / Orange Islands** | various | Anime-faithful. Niche, but shows licensed-story appetite |
| **Adventures Red Chapter** | FireRed | Manga-faithful, huge, unfinished-for-years energy |
| **Emerald Seaglass** | Emerald | Modern "the Emerald you wanted" |
| **Emerald Rogue** | Emerald | Roguelite runs, meta-progression hub. Genre-defining |
| **ROWE** | Emerald | Open world + enormous pre-game randomizer/option menu |
| **Elite Redux** | Emerald | Every species has multiple switchable abilities + innates. Theorycraft heaven |
| **Inclement Emerald** | Emerald | Difficulty + modern mechanics in Hoenn |
| **Too Many Types / TMT2** | FR / Emerald | Explodes the type chart. Experimental, polarizing, useful research |
| **Lazarus** | GBC-style | Original region, Greek myth, recently completed |
| **Odyssey** | — | Ambitious; Odyssey 2 is highly anticipated |
| **Hearth / Voyager / Coral / Darkfire** | various | 2026 watchlist. Do not treat vaporware as design proof |

---

## Enhancement / "the same game, better"

These are not new stories. They are how a lot of people now *prefer* to play the official games.

| Hack | Idea |
|---|---|
| Legacy Yellow / Crystal / Emerald | Respectful difficulty + QoL, complete the dex |
| Celebrations | Red/Blue with modern QoL |
| Crystal Legacy | Johto improvement |
| HeartGold/SoulSilver difficulty pair (Sacred/Storm) | Drayano Johto |
| Blaze Black 2 Redux / Volt White 2 Redux | Drayano Unova, the big one |
| FireRed Reignited / LeafGreen Regrown | Visual/QoL restorations |
| GS Chronicles | Johto on GBA with modernizations |
| Crystal Advance Redux | Crystal remade on GBA |
| Heart & Soul | Johto on Emerald engine |

**Steal the checklist, not the games:**

- Reusable TMs
- Infinite or key-item HMs
- Physical/special split if your move pool is modern
- Modern exp share as a toggle
- DexNav or equivalent "I want this species" tool
- Visible overworld creatures (Let's Go / PLA / SV)
- Fast text, run indoors, bigger bag, auto-run
- Nature/ability changing items available *somewhere*
- Level cap options for nuzlocke / difficulty integrity
- Set mode default on hard difficulties

---

## Design patterns that keep recurring (and why)

### 1. "Official-plus" (Unbound, Gaia, Polished Crystal)

Players want the feeling of a real Pokémon release with the quality-of-life Game Freak delayed by a generation.

### 2. "Gauntlet" (Radical Red, Kaizo, Imperium)

Players who aged with the series outgrew level-grinding stories. They want VGC/Smogon thinking in a campaign.

### 3. "Inversion" (Rocket Edition, Outlaw, Giovanni Origins)

Same world, different moral camera. Cheap to imagine, expensive to write well.

### 4. "Open order" (Crystal Clear, ROWE)

Freedom is beloved when gyms scale and routes still have identity.

### 5. "Roguelite" (Emerald Rogue, PokeRogue)

Solves replayability. Risks making the overworld disposable.

### 6. "Meme / horror / adult" (Clover, Snakewood, CAWPS)

Tone can be a moat. Tone can also cap the audience and the team's future.

### 7. "Everything-dex" (Unbound, Radical Red)

A marketing win and a production death sentence for a small original team. **Do not do this with original creatures.** 120–160 authored species will beat 800 placeholders.

---

## Anticipated / unfinished (do not build a plan on these)

Community 2026 watchlist includes: Odyssey 2, Voyager, USUM demake, Quarantine Crystal, Ruby 2, Ghost Grey, Samiya, Darkfire, Legends of Delta, Crown, Hearth, Spades and Clubs, Gaia 4.0, Clover 2.0, Light Platinum DS, Blaze Black Redux 2.0.

Lesson: this scene announces more than it finishes. **Our process must assume we are a small team and schedule cuts.**

---

## What "best ROM hack" means in practice

There is no single best. There is a best *for a job*:

| Player job | Point them at |
|---|---|
| "I want a new official game" | Unbound, Gaia |
| "I want to get good at battling" | Radical Red, Imperium, Elite Redux |
| "I want Johto with respect" | Polished Crystal, Crystal Clear |
| "I want Sinnoh with teeth" | Renegade Platinum |
| "I want Unova with teeth" | BB2/VW2 Redux |
| "I want a weird thesis" | Clover, Snakewood, Too Many Types, Elite Redux |
| "I want a run, not a 60-hour RPG" | Emerald Rogue |

Our game should pick **one primary job** and one secondary. ECHOES' primary job is *living world + bond*. Secondary is *tactical fields*. See `15`.
