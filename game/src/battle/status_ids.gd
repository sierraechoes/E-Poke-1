class_name StatusIds
extends RefCounted
## Locked status grammar. See KERNEL.md.

const BURN := &"burn"
const POISON := &"poison"
const SLEEP := &"sleep"
const PARA := &"para"

const ALL := [BURN, POISON, SLEEP, PARA]

## Residual: floor(max_hp / N), at least 1.
const BURN_FRACTION := 16
const POISON_FRACTION := 8

## Para halves Speed. It does not touch accuracy.
const PARA_SPEED := 0.5
const FULL_PARA_PCT := 25

## Reedwalk mud.
const MUD_SPEED := 0.67
const MUD_TURNS := 3

const VOL_FLINCH := &"flinch"
const VOL_AGITATED := &"agitated"


static func is_major(id: StringName) -> bool:
	return ALL.has(id)


static func residual_damage(status: StringName, max_hp: int) -> int:
	if max_hp <= 0:
		return 0
	if status == BURN:
		return maxi(1, int(max_hp / BURN_FRACTION))
	if status == POISON:
		return maxi(1, int(max_hp / POISON_FRACTION))
	return 0
