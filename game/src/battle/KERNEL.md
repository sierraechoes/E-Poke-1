# Battle kernel (P03)

Headless singles. No sprites. Same seed + same actions = same fight.

## Turn pipeline

1. Both sides choose one command (or the sim is given both via `step`).
2. Order: **Switch (100) → Item (90) → Flee / Attune (80) → Fight (move priority) → Wait (−100)**.
3. Ties at the same action-priority break on **effective Speed**, then a coin flip.
4. Trainer commands (switch / item / flee / attune) ignore sleep, para, and flinch.
5. Fight checks, in order: flinch → sleep → full-para → accuracy → damage / effect → field reaction → faint → forced replace.
6. Residuals: burn, poison, ability `residual`, held residual, then mud timer.
7. Flinch clears at turn end.

`auto_replace` (default on) sends the next living Echo the moment the active faints. If a side has several living and `auto_replace` is off, the next `resolve` only accepts `switch`.

Turn cap: 200, then a draw.

## Effective Speed

```
spe = floor(base_spe * stage_mult)
spe = floor(spe * 0.5)     if para
spe = floor(spe * 0.67)    if that side has mud
spe = ability MODIFY_SPEED (e.g. Swift Current ×1.5)
```

Stat stages (−6..+6): `n≥0 → (2+n)/2`, `n<0 → 2/(2−n)`.

Accuracy / evasion stages use a 3/3 baseline: `n≥0 → (3+n)/3`, `n<0 → 3/(3−n)`.

## Accuracy

- `accuracy <= 0` always hits (no roll).
- `accuracy >= 100` and no acc/eva stages: always hits (no roll).
- Otherwise `next_int(100) < floor(accuracy * acc_stage_mult)`.

Para does **not** lower accuracy. It halves Speed and has a **25%** full-para chance when the Echo tries to Fight.

## Major status (one at a time; a second inflict fails)

| Id | Residual / control |
|---|---|
| `burn` | 1/16 max HP each residual; physical damage ×0.5 |
| `poison` | 1/8 max HP each residual |
| `sleep` | On inflict: `1 + next_int(3)` remaining Fight skips (1–3). Each Fight attempt decrements first; while the counter is still ≥ 0 the Echo sleeps. On the attempt that drives it below 0, it wakes and may move. |
| `para` | Speed ×0.5; 25% full-para |

Abilities subscribe to `try_status` to block (they are not `if ability ==` in the sim).

## Volatiles

- `flinch` — skip the next Fight this turn. Set by move `effect.flinch`.
- `agitated` — after a failed attune that did not flee; next attune ×0.85.

## Reedwalk / Dry Pan (locked slice field)

**reedwalk:** Bloom moves ×1.3. Any Tide move that hits applies **mud** (3 turns, target side Speed ×0.67). Any Ember move that hits while mud is present on either side consumes all mud and transitions to **dry_pan**.

**dry_pan:** Ember ×1.3, Tide ×0.7, Bloom ×0.85. A *damaging* Tide hit has a 30% chance to return to reedwalk.

## Attune (wild only)

```
condition  = 1.15 if the wild took no damaging hits this battle else 0.55
condition *= field_compat     # habitat tag == field → 1.25; hostile_<field> → 0.75; else 1.0
condition *= approach         # approach 1.0 / offer 1.1 / harmonize 1.25 / force 1.6
condition *= bond_item        # tuning resin 1.25
condition *= 0.85             # if agitated
hp_term    = 0.5 + 0.5 * (hp / max_hp)    # healthier is easier
a          = clamp(floor(attune_rate * condition * hp_term), 1, 255)
success    if next_int(256) < a
```

Force on success: `bond_cap = max(1, floor(bond_cap * 0.7))`.
Fail: Force 50% wild-flee, else 30% wild-flee / 70% stay agitated.

## Flee (wild only)

```
attempts += 1
threshold = clamp(floor(user_spe * 128 / max(1, foe_spe)) + 30 * attempts, 0, 255)
success if next_int(256) < threshold
```

## Commands

`fight` · `switch` · `item` · `attune` · `flee` · `wait`

## Abilities

Handlers live in `abilities/` and register on `AbilityCatalog`. The sim only dispatches events.

## AI

`random` — uniform legal move (own RNG, does not touch the battle seed).
`type_aware` — highest `type_mult * power * stab * field_mod` (status moves score 0.1).
