# 07 — Official Systems Deep Dive

> The mechanical grammar of Pokémon. We need this to write a battle kernel and to know what is worth keeping.

## The two games inside every Pokémon game

1. **Overworld game** — top-down exploration, NPCs, gates, items, encounters
2. **Battle game** — turn-based (historically), probabilistic combat, party of 6

They share a save file and a monster struct. That is almost all.

Legends: Arceus and Z-A blur this. Our architecture should allow a future overworld-combat bridge without requiring it for 1.0.

---

## The monster struct (runtime)

A species is a template. An *instance* is:

| Field | Typical range | Purpose |
|---|---|---|
| Species ID | enum | Which template |
| Nickname | string | Player expression |
| Level | 1–100 | The big knob |
| EXP | int | Toward next level |
| IVs | 0–31 × 6 | "Genes." Hidden power in older gens |
| EVs | 0–252 × 6, 510 total | Training. 4 EV ≈ 1 stat at high level |
| Nature | 25 possibilities | +10% one stat, −10% another (or neutral) |
| Ability | 1 of 2–3 | Passive rule
| Gender | M/F/N | Breeding, some evolutions |
| Friendship / loyalty | 0–255 | Evolutions, Return/Frustration, flavor |
| Origin (OT, ID, ball, met location, pokerus) | — | Breeding, ribbons, legality |
| Moves × 4 | move + PP | The actual verbs |
| Held item | item id | Build identity |
| Status | PSN/TOX/BRN/PAR/SLP/FRZ | Residual and control |
| HP current | 0–max | Death is fainting |
| Pokerus / ribbons / markings | — | Meta |
| Shiny flag | bool | Cosmetics + hunt culture |
| Form index | int | Regional, mega, weather, etc. |

**ECHOES analogue:** species template + instance with **Bond**, **Temperament**, **Attunement origin**, **Resonance scars** (replacing IVs with something diegetic), **Training** (replacing EVs with something visible).

Hidden IVs are a 1990s cartridge trick. Players now expect either transparency or a replacement.

---

## Stat formulas (Gen 3+)

```
HP  = floor((2*Base + IV + floor(EV/4)) * Level / 100) + Level + 10
STAT = floor((floor((2*Base + IV + floor(EV/4)) * Level / 100) + 5) * Nature)
```

Nature is 1.1, 1.0, or 0.9.

Stage multipliers in battle (Atk/Def/SpA/SpD/Spe):

```
-6 → 2/8
-5 → 2/7
-4 → 2/6
-3 → 2/5
-2 → 2/4
-1 → 2/3
 0 → 2/2
+1 → 3/2
+2 → 4/2
+3 → 5/2
+4 → 6/2
+5 → 7/2
+6 → 8/2
```

Accuracy/evasion stages use a different table (3/3 baseline).

These formulas are *ideas*. We can keep the shape so veterans have intuition, or replace IVs/EVs entirely.

---

## Damage formula (modern, simplified)

A practical Gen 5+ mental model:

```
base = ((2*Level/5 + 2) * Power * A / D) / 50 + 2
damage = base
        * Weather
        * Crit          (1.5x modern; 2x old)
        * random        (0.85–1.00, 16 buckets)
        * STAB          (1.5x; 2.0x Adaptability / some Tera cases)
        * Type          (0 / 0.25 / 0.5 / 1 / 2 / 4)
        * Burn          (0.5x physical, unless Guts)
        * other         (screens, items, abilities, terrain, fields…)
```

`A` is Atk or SpA. `D` is Def or SpD. Category is a property of the **move** since Gen 4 (the physical/special split). Before that, category was a property of the **type** (Fire always special). The split is non-negotiable for modern design.

**Randomness:** 16 rolls. This is why calculators print ranges. Designers who hate luck tighten the window (0.93–1.00) or show the roll.

---

## Type chart

18 types: Normal, Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy (Fairy added Gen 6).

Design properties of the official chart:

- Immunities (Ground vs Flying, Normal vs Ghost, Dragon vs Fairy, etc.) create *identity*
- 4× weaknesses punish dual-typing greed
- Steel is a defensive glue type
- Dragon was an offensive bully until Fairy
- Bug/Poison/Ice/Grass have been historically sad offensively; fan games often buff them
- New types (Fairy, Uranium's Nuclear, Too Many Types) rewrite the metagame overnight

**For ECHOES:** keep ~16–20 types max. Either:

- A renamed structural clone (easiest for players), or
- A themed chart around Resonance (Pulse, Stone, Tide, Bloom, Ember, Veil, Hex, Volt, Gale, Toxin, Frost, Flesh, Iron, Myth, Gloom, Light…)

Do not add a type that beats 14 others.

---

## Turn structure (classic)

```
on_enter_weather_terrain
choose_commands          # player and AI
order_by_priority_then_speed
for each action:
    check flinch / status / confusion
    check accuracy
    apply move effects + damage
    on_hit abilities / items
    check faints → replacements
residual:
    weather, status, leftovers, field
check end (all fainted / catch / flee / decision)
```

Priority (Quick Attack +1, Protect +4, Helping Hand +5, Roar −6, etc.) is how you get interesting speed interactions.

Doubles (2v2) is a different and richer game: targeting, spread-move penalties, Fake Out, redirection, trick room. Temtem made doubles the default. We should support singles for 1.0 and design data as if doubles exist.

---

## Abilities, items, status — the three modifier layers

A good creature game is a stack of exceptions:

1. **Move** — the verb
2. **Ability** — always-on or trigger
3. **Item** — equipment
4. **Field / weather / terrain** — the place
5. **Status / volatile** — the state
6. **Side conditions** — screens, tailwind, spikes

Reborn's insight: layer 4 was underused by Game Freak (weather + three terrains). Promoting *place* to a full ruleset is the best mechanical gift the fangame scene produced.

---

## Catching

Official formula (simplified Gen 3+):

```
a = ((3*HPmax - 2*HPcur) * catchRate * ballMod * statusMod) / (3*HPmax)
```

Then shake checks derived from `a`. Critical captures exist later.

Design tensions:

- Catch rate + ball + status + HP is a mini-game
- Master Ball deletes the mini-game
- Overworld catching (Let's Go, PLA) deletes the battle interrupt
- Catching as *violence* vs. catching as *relationship* is a thematic fork

**ECHOES:** attunement mini-game based on Bond, Field compatibility, and whether you harmed the wild Echo. Killing-to-weaken should cost attunement. PLA's "don't murder it first" is the correct moral-mechanical link for our theme.

---

## Progression grammar of a mainline game

```
lab → starter → rival 1 → route zoo → gym 1
loop(route, town, optional side, gym)
midgame villain reveal
water unlock / ride
late villain climax
Elite Four + Champion
post-game (second region OR battle facility OR legendaries OR DLC)
```

Gates: HMs, story rocks, water, one-way ledges, badge-levelled HMs, ride Pokémon (SwSh/PLA/SV).

Level curve: official games are easy. Fan games over-correct into grind or into Kaizo. Unbound's four difficulties are the correct product design.

Dex size per official regional dex is roughly 150–400 before DLC. Kalos and Galar went large; Unova 1 was tight and beloved for it.

---

## Breeding, IVs, competitive culture

Breeding is a second game:

- Egg groups
- Nature via Everstone
- IVs via Destiny Knot
- Ball inheritance
- Egg moves, Mirror Herb
- Masuda method for shinies

This is thousands of hours of content and also a spreadsheet. Radical Red and modern official games added items that skip the pain.

**For 1.0:** do not implement a full breeding lab. Implement:

- A visible "potential" that can be trained in the world
- A late-game tuner (our "Destiny Knot NPC")
- Cosmetic variants as exploration rewards, not 1/4096 only

Shiny-hunt culture is real. Offer an opt-in hunt mode and a casual cosmetic path.

---

## Gimmicks (and why they fade)

| Gimmick | Gen | What it was | Why it died |
|---|---|---|---|
| Contests | 3–4 | Parallel sport | Split focus |
| Mega | 6–7, Z-A | Best-liked gimmick | Data/balance + "only some species" |
| Z-Move | 7 | Once-per-battle nuke | Shallow |
| Dynamax | 8 | Raid spectacle | Hated in singles, fine in raids |
| Terastal | 9 | Type rewrite | Flexible, maybe sticky |
| Agile/Strong | PLA | Action-RPG stamina | Tied to that combat
| Real-time ZA | Z-A | Positioning | New, unproven as a series spine |

Fan consensus: **Megas were the best gimmick** because they were character-design events, not just a multiplier.

**ECHOES gimmick:** Resonance Overdraw — spend Bond to temporarily let an Echo rewrite the field (not just itself). Ties theme, field system, and relationship together. Not a hat on Charizard.

---

## AI

Official in-game AI is famously soft:

- Often random among damaging moves
- Poor switching
- Predictable set-up

Radical Red / expansion AI flags:

- Consider type effectiveness
- Consider KO
- Consider status
- Double-battle support
- Risky prediction (the thing Unbound players accuse of "cheating" when it reads switches)

Fair hard AI:

- Knows what it *could* know (your last-revealed moves, types)
- Does not know your exact unrevealed item unless scouted
- Has a declared personality (press, stall, suicide lead)

Our AI should be data: `AiProfile` resources, not a single `if hard: be psychic`.

---

## QoL that is now "table stakes"

If we ship without these, players will bounce:

- Run everywhere
- Fast-forward / instant text / battle anim skip
- Reusable teaching items
- No mandatory four-move HM jail
- Seen/caught indicators on encounters
- Move reminder cheap and early
- Held-item and ability visibility
- Multiple bag sort modes
- Save anywhere except mid-battle and mid-cutscene
- Difficulty select at file create, changeable downward later
- Controller + keyboard + rebinding
- Colorblind type cues, not color-only
- Autosave + rotating backups
