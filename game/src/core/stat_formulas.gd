class_name StatFormulas
extends RefCounted
## Gen 3-shaped formulas. Fixtures locked in notes/20.

const SCAR_MAX := 31
const TRAINING_MAX := 252
const TRAINING_TOTAL_MAX := 510
const LEVEL_MIN := 1
const LEVEL_MAX := 100
const TEMPER_UP := 1.1
const TEMPER_DOWN := 0.9
const TEMPER_FLAT := 1.0


static func clamp_scar(v: int) -> int:
	return clampi(v, 0, SCAR_MAX)


static func clamp_training(v: int) -> int:
	return clampi(v, 0, TRAINING_MAX)


static func clamp_level(v: int) -> int:
	return clampi(v, LEVEL_MIN, LEVEL_MAX)


static func calc_hp(base: int, scar: int, training: int, level: int) -> int:
	## HP = floor((2*Base + Scar + floor(Training/4)) * Level / 100) + Level + 10
	var inner: int = (2 * base + clamp_scar(scar) + int(clamp_training(training) / 4)) * clamp_level(level)
	return int(inner / 100) + clamp_level(level) + 10


static func calc_stat(base: int, scar: int, training: int, level: int, temper: float) -> int:
	## STAT = floor((floor((2*Base + Scar + floor(Training/4)) * Level / 100) + 5) * Temper)
	var inner: int = (2 * base + clamp_scar(scar) + int(clamp_training(training) / 4)) * clamp_level(level)
	var mid: int = int(inner / 100) + 5
	return int(float(mid) * temper)


static func temper_for(stat_id: StringName, plus: StringName, minus: StringName) -> float:
	if stat_id == &"hp":
		return TEMPER_FLAT
	if plus != &"" and stat_id == plus:
		return TEMPER_UP
	if minus != &"" and stat_id == minus:
		return TEMPER_DOWN
	return TEMPER_FLAT


static func compute(base: StatBlock, scars: StatBlock, training: StatBlock, level: int, plus: StringName, minus: StringName) -> StatBlock:
	var out := StatBlock.new()
	out.hp = calc_hp(base.hp, scars.hp, training.hp, level)
	out.atk = calc_stat(base.atk, scars.atk, training.atk, level, temper_for(&"atk", plus, minus))
	out.def = calc_stat(base.def, scars.def, training.def, level, temper_for(&"def", plus, minus))
	out.spa = calc_stat(base.spa, scars.spa, training.spa, level, temper_for(&"spa", plus, minus))
	out.spd = calc_stat(base.spd, scars.spd, training.spd, level, temper_for(&"spd", plus, minus))
	out.spe = calc_stat(base.spe, scars.spe, training.spe, level, temper_for(&"spe", plus, minus))
	return out
