# 06 — Legal and IP Reality

> Not legal advice. This is industry-practice research so the project does not build on sand.

## The short version

| Action | Risk |
|---|---|
| Keep a ROM of a cartridge you bought, for personal play | Gray; generally low enforcement on individuals |
| Distribute a ROM | High. This is the classic infringement |
| Distribute a BPS patch that requires a ROM | Lower than shipping a ROM; still a derivative-work factory. Nintendo can and does act |
| Make a free fangame with Pikachu, Kanto, and Poké Balls | Infringing. Enforcement scales with popularity |
| Make a free fangame with original Fakemon but still call it Pokémon | Trademark + derivative. Uranium still got hit |
| Sell any of the above | Highest. Do not |
| Make an original monster RPG that is merely *inspired by* the genre | **The viable path** |
| Look so much like Pokémon that a customer would think Nintendo made it | Trade dress / unfair competition risk even with original monsters (Palworld-adjacent conversations) |

## Who owns Pokémon

The Pokémon Company is a joint venture of:

- **Nintendo**
- **Game Freak**
- **Creatures Inc.**

Trademarks cover the name Pokémon, Pikachu, Poké Ball, the logo, and a thicket of creature names. Copyright covers sprites, models, music, maps, script text, and the specific expression of characters and creatures. Patents on broad "walk in grass, fight a monster" mechanics are not how this usually gets enforced. Enforcement is copyright + trademark + "this confuses consumers."

## What cannot be copyrighted (and what that does *not* mean)

Generally not protectable by copyright:

- Game mechanics as ideas (catch, type chart, gyms, IVs)
- Short names in isolation (still often *trademarked*)
- Functional rules

Still protectable:

- The particular expression of those mechanics (UI art, exact type-chart presentation, Poké Ball design, status icons)
- Creature designs and names
- Maps that reproduce Kanto
- Music and cries
- The word **Pokémon** and **Poké-** branding

"Mechanics aren't copyrightable" is true and also how people talk themselves into shipping Pikachu.

## Documented enforcement patterns

Fan projects that were hit or heavily disrupted:

- **Pokémon Uranium** — original region and 150 Fakemon; still used the Pokémon name and many official species. ~1.5M downloads. Takedown
- **Pokémon Prism** — high-profile ROM hack, takedown drama
- **Pokémon Essentials hosting** — distribution channels have been C&D'd; the toolkit itself has lived in a gray, moving host landscape
- Numerous ROM sites, sprite sheets, and fangame pages, routinely

Projects that live for years often share traits:

- Small audience
- Non-commercial
- Quiet marketing
- Easy to ignore

The cruel mechanic of fangame law: **quality and popularity are the failure condition.**

Nintendo also has a trademark-defense incentive. Rights holders who sleep on marks can weaken them. That is one reason they are less "chill" than some other publishers.

## ROM hacks specifically

A ROM hack is a derivative work of a copyrighted game. The patch-file convention is community etiquette, not a shield.

This repository will not:

- Store official ROMs
- Store patches against official ROMs
- Link to ROM downloads
- Include step-by-step "download this dump" instructions

Research discussion of *how patches work* is enough.

## Essentials / PSDK specifically

Even if you redraw every sprite:

- The names Pikachu, Charizard, Kanto, Pokédex, Poké Ball are not yours
- The default kits ship Nintendo data
- Calling the game "a Pokémon fangame" is a trademark use

Some teams plan a "search-and-replace to original IP if we get a C&D." That is better than nothing and worse than starting original. Fakemon designed as "this is clearly a Pikachu cousin" can still be argued as derivative.

## Palworld-shaped caution

Palworld proved a creature-survival game can explode without being a Pokémon game. It also proved that if your creatures and loop read as "Pokémon with guns," you invite lawsuits and public IP fights. **Be inspired by the genre, not by specific silhouettes.**

## What a clean original game looks like

A reasonable-by-stander test: someone who has never heard of your project should not think Nintendo published it.

Checklist for E-Poke-1:

1. **No** Pokémon, Poké, Pikachu, Pokédex, Poké Ball, Gym Leader (as a mark), Elite Four, Kanto, Professor Oak, Team Rocket, Mega Evolution (as a named Nintendo gimmick), Z-Move, Terastal, Dynamax
2. **No** official music, sound fonts ripped from ROMs, cries, tilesets, fonts
3. **No** "Fakemon" that are palette-swaps or silhouette clones of existing species
4. **Yes** original creature names, original UI chrome, original ball-analogue (if any)
5. **Yes** a distinct art direction (HD-2D / chunky pixel / paper / woodcut — pick one and commit)
6. **Yes** original type names if we want extra distance (we can keep a *structural* 18-ish type chart)
7. **Yes** a disclaimer that we are not affiliated — disclaimers do not legalize infringement, but they help on trademark confusion
8. **Yes** lawyer review before any commercial launch

## Naming the project

Repo: `E-Poke-1`. That name is a research-era label. The public game title should **not** contain Poke / Pokémon.

Working title in these notes: **ECHOES**.

Backup titles (do a trademark search before locking): Aethera, Reliquary, Wild Pact, Frequency, Stillfield, Chorus, Bondwild.

## Licensing our own work

Recommended:

| Asset | License |
|---|---|
| Engine code, tools, data schema | MIT or Apache-2.0 |
| Narrative text | CC-BY-SA 4.0 or All Rights Reserved until 1.0 |
| Visual art / music | CC-BY-NC or ARR until we decide to sell |
| Community mods | Same as code if we want a mod economy of ideas |

Do **not** accept contributions that are ripped from Pokémon games. Add a contributor license agreement line in `CONTRIBUTING.md`: original work only, no Nintendo assets, no trained-on-Nintendo-sprite models dumped as "original."

## Playing fan games vs. making them

Playing a fangame as an individual is not what companies sue over. Making and hosting one is. This note exists so *we* do not become the latter using *their* IP.

## Decision locked for this repo

We are building an **original creature-collecting RPG**. We will keep studying Pokémon ROMs and fangames as genre research. We will not ship their world.
