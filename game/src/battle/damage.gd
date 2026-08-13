class_name Damage
extends RefCounted
## Pure damage. No sprites. No global state.

const STAB := 1.5
const CRIT := 1.5
const BURN_PHYS := 0.5


static func calc(
		level: int,
		power: int,
		attack_stat: int,
		defense_stat: int,
		stab: float = 1.0,
		type_mult: float = 1.0,
		crit: float = 1.0,
		rand: float = 1.0,
		burn: float = 1.0,
		weather: float = 1.0,
		field: float = 1.0,
		other: float = 1.0
	) -> int:
	if type_mult <= 0.0 or power <= 0 or attack_stat <= 0 or defense_stat <= 0:
		return 0
	## base = floor(floor(floor((2*L/5)+2) * Power * A / D) / 50) + 2
	var t: int = int((2 * level) / 5) + 2
	var t2: int = int((t * power * attack_stat) / defense_stat)
	var base: int = int(t2 / 50) + 2
	var d: float = float(base)
	d = floor(d * weather)
	d = floor(d * crit)
	d = floor(d * rand)
	d = floor(d * stab)
	d = floor(d * type_mult)
	d = floor(d * burn)
	d = floor(d * field)
	d = floor(d * other)
	return maxi(1, int(d))


static func stab_for(move_type: StringName, user_types: Array) -> float:
	for t in user_types:
		if (t as StringName) == move_type:
			return STAB
	return 1.0


static func burn_for(is_burned: bool, category: StringName) -> float:
	if is_burned and category == &"physical":
		return BURN_PHYS
	return 1.0
