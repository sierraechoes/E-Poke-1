# 09 — Creature and Fakemon Design

> How official Pokémon are designed, how the best Fakemon succeed, and how ECHOES should build a dex that can carry a whole game.

## The job of a creature

A species has to do four jobs at once:

1. **Readable silhouette** — identifiable at 32–64 px and at summary-screen size
2. **World logic** — it looks like it belongs on *this* route
3. **Mechanical identity** — a typing + stat spread + ability you can *say in a sentence*
4. **Emotional hook** — cute, cool, funny, uncanny, or tragic. One is enough

If it only does (3), it is a Smogon set. If it only does (1)+(2), it is a plush. The genre sings when all four lock.

## Official design grammar (what we are allowed to learn)

Game Freak's creature design, compressed:

- **Based on a real thing + a twist.** Mouse + electric sacs. Plant + dinosaur. Trash + poison gas.
- **Three-stage lines for starters and pseudo-legendaries.** Two-stage for most. Singles for bugs, legends, oddballs.
- **Body-shape consistency across a line.** Ivysaur must still be Bulbasaur.
- **Type as culture.** A region's types follow its biome and its myth.
- **BST bands** (approximate, modern):
  - Early rodent: 240–320
  - Mid two-stage: 400–460
  - Fully evolved regular: 470–530
  - Pseudo: ~600
  - Box legendary: 670–720
  - Mythical: whatever the plot needs
- **One "boss stat."** Garchomp is speed + attack. Blissey is HP. Do not make 110s in four stats.
- **Ability is the punchline.** Drought on a drought-looking camel. Levitate on something that should not touch dirt.

## Why many Fakemon fail

| Failure | What it looks like | Fix |
|---|---|---|
| Pikaclone energy | Another small mammal with cheek circles | Change the animal *and* the joke |
| Stat soup | 100/100/100/100/100/100 | Pick a role |
| Type salad | Fire/Fairy/Steel "because cool" | Dual type max. A third type is a gimmick, not a species |
| Line-in-name-only | Stage 2 is a different character | Carry 3 visual motifs through the line |
| Dex filler | 40 rodents | Every early bird needs a reason (pest, pollinator, trash, omen) |
| Unpaintably complex | 4,000-pixel baroque | Design at 64×64 first |
| Mean-spirited | Trauma as the only joke | Allow darkness; do not make it the whole dex |
| Copyright-adjacent | "It's Pikachu but a fox" | New silhouette, new name roots |

Uranium worked because the Fakemon had a **regional accent** (Tandor, nuclear history) and a **new type** that made them mechanically necessary.

Clover worked (for its audience) because every species was a *joke with a movepool*.

Infinite Fusion worked because the *combination rule* was the design.

## ECHOES creature brief

Echoes are not animals in capsules. They are **living frequencies** — spirits that condense around human history, weather, ruins, machines, grief, festivals.

Design implications:

- A landfill Echo looks like compacted signage and stray radio
- A tide Echo looks like a drowned bell + a fish
- A city Echo might be a living neon ligature
- Evolution is **retuning** (cleaner, louder, or corrupted), not just "gets taller"

### Line patterns

| Pattern | Use for | Count in a 140-dex |
|---|---|---|
| 3-stage starter | Player identity | 3 lines (9) |
| 2-stage regional | The meat | ~40 lines (80) |
| Single-stage | Bugs, oddities, spirits | ~25 |
| Branching 2-stage | Player expression | 4–6 lines |
| Titan / legendary | Plot | 6–10 |
| Paradox / Silence-touched | Late / post | 8–12 |

Target **140 species** for 1.0. Unova-tight. Every one must be catchable without a guide if you explore.

### Naming

Do not use Japanese-pun-on-English unless we can do it at Game Freak level. Prefer:

- Invented roots that are pronounceable (2–3 syllables)
- Occasional clear compound (Gravenbell, Sootling)
- No "Pika-, Char-, Basa-, Eevee-" phonetics

Keep an internal etymology doc so names do not drift into mush.

### Starters (the most important three)

Requirements:

- Immediately readable roles
- Opposite-ish triangle that is *not* necessarily Grass/Fire/Water if the region theme is stronger — but a closed triangle is kinder to new players
- Each line tells a different story about the region
- Finals must all be viable on Tactician difficulty
- Overworld personality (follow animations, town reactions)

Proposal direction for ECHOES (see `15`):

- **Bloom/Tide/Ember** triangle, but each is *also* a cultural institution (harvest festival, harbor guild, foundry)
- Or break the triangle: **Veil / Iron / Bloom** (memory, industry, growth) if we can teach it in the first 20 minutes

### Role grid (fill this before drawing the 80th)

Every fully evolved Echo should claim at least one:

- Physical sweeper
- Special sweeper
- Pivot / scout
- Physical wall
- Special wall
- Cleric / support
- Field setter (our unique role)
- Field breaker
- Attune-support (helps catch / calm)
- Trickster (item / disable / redirect)

If we have 14 special sweepers and 1 cleric, the dex is a failure even if the art is good.

### Ability design rules

- One sentence
- Visible in the world when possible (a drought Echo dries puddles)
- No ability that says "immune to the game's thesis"
- Signature abilities on ~15 species, not 80

### Movepool design rules

- Early game: 3–4 damaging options by the first boss, one status
- Every fully evolved Echo gets a *reason to stay* in the late game (a coverage move, a pivot move, or a field verb)
- Signature moves are character, not just 120 BP
- Do not give every special attacker the same 4 coverage moves. That is how dexes flatten

## Production pipeline for one Echo

```
1. Role + types + BST band          (design sheet)
2. Habitat + ecology diet           (world sheet)
3. Name + etymology + cry note
4. Silhouette thumbnails (10)       (pick 1)
5. Line sketches (all stages)
6. Color script (day / night / rare)
7. Pixel pass: icon, overworld 4-dir, battle front/back
8. Data resource + learnset v1
9. Place on a route
10. Play, then change the data before the art
```

Art last is how you avoid falling in love with an unusable design. Data first is how Radical Red makes junk species sing.

## Regional variants and "Deltas"

Insurgence Deltas = official species, new types. We cannot do that with Nintendo's animals. We *can*:

- **Shore-tuned vs. Peak-tuned** forms of our own Echoes
- **Silence-touched** forms in collapsed biomes
- **Festival forms** (cosmetic + tiny stat lean)

Forms must be readable in the overworld. Invisible forms are a Pokédex footnote.

## Fusion (optional, later)

Cassette Beasts and Infinite Fusion prove fusion is the most loved *new* verb in the genre.

If we add it:

- Mid-battle, temporary, Bond-costly (Cassette) — better for our theme
- Not 140² unique sprites. Procedural parts + ~40 handmade "iconic fusions"
- Typing blend must be table-driven and tested for 4× hell

Do not promise fusion in the vertical slice.

## Ethical / tonal notes

Creatures that are walking trauma can work (Reborn, some Uranium). A whole dex of it is exhausting. Ratio:

- 50% wonder
- 30% odd / funny
- 20% uncanny or sad

Players should want to *attune*, not feel like they are pocketing victims. The plot can still be dark.

## Deliverable for pre-production

A public `notes/dex/` (later) with:

- 3 starters fully specced
- 12 route-1-to-boss-1 Echoes fully specced
- 140-slot spreadsheet: id, name, types, bst, role, habitat, status (idea/sketch/pixel/in-game)
