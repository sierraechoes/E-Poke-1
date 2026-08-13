class_name StatStages
extends RefCounted
## Battle-only stages. Reset on switch. Range −6..+6.

var atk: int = 0
var def: int = 0
var spa: int = 0
var spd: int = 0
var spe: int = 0
var acc: int = 0
var eva: int = 0


func get_named(stat_id: StringName) -> int:
	match stat_id:
		&"atk":
			return atk
		&"def":
			return def
		&"spa":
			return spa
		&"spd":
			return spd
		&"spe":
			return spe
		&"acc":
			return acc
		&"eva":
			return eva
		_:
			return 0


func set_named(stat_id: StringName, value: int) -> void:
	var v: int = clampi(value, -6, 6)
	match stat_id:
		&"atk":
			atk = v
		&"def":
			def = v
		&"spa":
			spa = v
		&"spd":
			spd = v
		&"spe":
			spe = v
		&"acc":
			acc = v
		&"eva":
			eva = v


func add(stat_id: StringName, delta: int) -> int:
	var before: int = get_named(stat_id)
	set_named(stat_id, before + delta)
	return get_named(stat_id) - before


func multiplier(stat_id: StringName) -> float:
	if stat_id == &"acc" or stat_id == &"eva":
		return acc_multiplier(get_named(stat_id))
	return stat_multiplier(get_named(stat_id))


static func stat_multiplier(stage: int) -> float:
	var s: int = clampi(stage, -6, 6)
	if s >= 0:
		return float(2 + s) / 2.0
	return 2.0 / float(2 - s)


static func acc_multiplier(stage: int) -> float:
	var s: int = clampi(stage, -6, 6)
	if s >= 0:
		return float(3 + s) / 3.0
	return 3.0 / float(3 - s)
