class_name TypeChart
extends RefCounted
## Attacker → defender multipliers. Missing pair = 1.0

const IMMUNE := 0.0
const RESIST := 0.5
const NEUTRAL := 1.0
const WEAK := 2.0

var _mult: Dictionary = {}


func set_mult(atk: StringName, deff: StringName, value: float) -> void:
	if not _mult.has(atk):
		_mult[atk] = {}
	_mult[atk][deff] = value


func multiplier(atk: StringName, deff: StringName) -> float:
	if not _mult.has(atk):
		return NEUTRAL
	return float(_mult[atk].get(deff, NEUTRAL))


func merge_from(other: TypeChart) -> void:
	for atk in other._mult.keys():
		for deff in other._mult[atk].keys():
			set_mult(atk, deff, float(other._mult[atk][deff]))


func vs(atk: StringName, defender_types: Array) -> float:
	var product := 1.0
	if defender_types.is_empty():
		return NEUTRAL
	for t in defender_types:
		product *= multiplier(atk, t as StringName)
	return product


static func from_locked_table() -> TypeChart:
	var chart := TypeChart.new()
	# pulse
	chart.set_mult(&"pulse", &"hex", IMMUNE)
	chart.set_mult(&"pulse", &"iron", RESIST)
	chart.set_mult(&"pulse", &"flesh", WEAK)
	# ember
	chart.set_mult(&"ember", &"ember", RESIST)
	chart.set_mult(&"ember", &"tide", RESIST)
	chart.set_mult(&"ember", &"bloom", WEAK)
	chart.set_mult(&"ember", &"frost", WEAK)
	chart.set_mult(&"ember", &"iron", WEAK)
	chart.set_mult(&"ember", &"stone", RESIST)
	chart.set_mult(&"ember", &"gale", RESIST)
	chart.set_mult(&"ember", &"myth", RESIST)
	# tide
	chart.set_mult(&"tide", &"ember", WEAK)
	chart.set_mult(&"tide", &"tide", RESIST)
	chart.set_mult(&"tide", &"bloom", RESIST)
	chart.set_mult(&"tide", &"stone", WEAK)
	chart.set_mult(&"tide", &"toxin", WEAK)
	chart.set_mult(&"tide", &"volt", RESIST)
	# bloom
	chart.set_mult(&"bloom", &"ember", RESIST)
	chart.set_mult(&"bloom", &"tide", WEAK)
	chart.set_mult(&"bloom", &"bloom", RESIST)
	chart.set_mult(&"bloom", &"stone", WEAK)
	chart.set_mult(&"bloom", &"iron", RESIST)
	chart.set_mult(&"bloom", &"toxin", RESIST)
	chart.set_mult(&"bloom", &"gale", RESIST)
	chart.set_mult(&"bloom", &"light", WEAK)
	# volt
	chart.set_mult(&"volt", &"tide", WEAK)
	chart.set_mult(&"volt", &"volt", RESIST)
	chart.set_mult(&"volt", &"stone", IMMUNE)
	chart.set_mult(&"volt", &"gale", WEAK)
	chart.set_mult(&"volt", &"iron", WEAK)
	chart.set_mult(&"volt", &"bloom", RESIST)
	# frost
	chart.set_mult(&"frost", &"ember", RESIST)
	chart.set_mult(&"frost", &"tide", RESIST)
	chart.set_mult(&"frost", &"bloom", WEAK)
	chart.set_mult(&"frost", &"frost", RESIST)
	chart.set_mult(&"frost", &"gale", WEAK)
	chart.set_mult(&"frost", &"iron", RESIST)
	chart.set_mult(&"frost", &"flesh", WEAK)
	# stone
	chart.set_mult(&"stone", &"ember", WEAK)
	chart.set_mult(&"stone", &"volt", WEAK)
	chart.set_mult(&"stone", &"gale", WEAK)
	chart.set_mult(&"stone", &"flesh", RESIST)
	chart.set_mult(&"stone", &"iron", RESIST)
	chart.set_mult(&"stone", &"tide", RESIST)
	chart.set_mult(&"stone", &"bloom", RESIST)
	# gale
	chart.set_mult(&"gale", &"bloom", WEAK)
	chart.set_mult(&"gale", &"flesh", WEAK)
	chart.set_mult(&"gale", &"toxin", WEAK)
	chart.set_mult(&"gale", &"volt", RESIST)
	chart.set_mult(&"gale", &"stone", RESIST)
	chart.set_mult(&"gale", &"iron", RESIST)
	chart.set_mult(&"gale", &"frost", RESIST)
	# iron
	chart.set_mult(&"iron", &"frost", WEAK)
	chart.set_mult(&"iron", &"pulse", WEAK)
	chart.set_mult(&"iron", &"myth", WEAK)
	chart.set_mult(&"iron", &"ember", RESIST)
	chart.set_mult(&"iron", &"iron", RESIST)
	chart.set_mult(&"iron", &"volt", RESIST)
	chart.set_mult(&"iron", &"toxin", IMMUNE)
	# toxin
	chart.set_mult(&"toxin", &"bloom", WEAK)
	chart.set_mult(&"toxin", &"flesh", WEAK)
	chart.set_mult(&"toxin", &"veil", WEAK)
	chart.set_mult(&"toxin", &"toxin", RESIST)
	chart.set_mult(&"toxin", &"iron", IMMUNE)
	chart.set_mult(&"toxin", &"stone", RESIST)
	chart.set_mult(&"toxin", &"hex", RESIST)
	# hex
	chart.set_mult(&"hex", &"hex", WEAK)
	chart.set_mult(&"hex", &"veil", WEAK)
	chart.set_mult(&"hex", &"pulse", IMMUNE)
	chart.set_mult(&"hex", &"flesh", IMMUNE)
	chart.set_mult(&"hex", &"gloom", RESIST)
	chart.set_mult(&"hex", &"light", RESIST)
	# veil
	chart.set_mult(&"veil", &"flesh", WEAK)
	chart.set_mult(&"veil", &"toxin", WEAK)
	chart.set_mult(&"veil", &"gloom", WEAK)
	chart.set_mult(&"veil", &"veil", RESIST)
	chart.set_mult(&"veil", &"iron", RESIST)
	chart.set_mult(&"veil", &"hex", RESIST)
	chart.set_mult(&"veil", &"myth", WEAK)
	# flesh
	chart.set_mult(&"flesh", &"iron", WEAK)
	chart.set_mult(&"flesh", &"stone", WEAK)
	chart.set_mult(&"flesh", &"frost", WEAK)
	chart.set_mult(&"flesh", &"gale", RESIST)
	chart.set_mult(&"flesh", &"veil", RESIST)
	chart.set_mult(&"flesh", &"toxin", RESIST)
	chart.set_mult(&"flesh", &"hex", IMMUNE)
	# myth
	chart.set_mult(&"myth", &"myth", WEAK)
	chart.set_mult(&"myth", &"tide", WEAK)
	chart.set_mult(&"myth", &"iron", RESIST)
	chart.set_mult(&"myth", &"light", IMMUNE)
	chart.set_mult(&"myth", &"frost", WEAK)
	# gloom
	chart.set_mult(&"gloom", &"veil", WEAK)
	chart.set_mult(&"gloom", &"hex", WEAK)
	chart.set_mult(&"gloom", &"light", WEAK)
	chart.set_mult(&"gloom", &"gloom", RESIST)
	chart.set_mult(&"gloom", &"flesh", RESIST)
	chart.set_mult(&"gloom", &"pulse", RESIST)
	# light
	chart.set_mult(&"light", &"gloom", WEAK)
	chart.set_mult(&"light", &"hex", WEAK)
	chart.set_mult(&"light", &"myth", WEAK)
	chart.set_mult(&"light", &"iron", RESIST)
	chart.set_mult(&"light", &"light", RESIST)
	chart.set_mult(&"light", &"ember", RESIST)
	return chart


static func from_json_dict(raw: Dictionary) -> TypeChart:
	var chart := TypeChart.new()
	var table: Dictionary = raw.get("chart", {})
	for atk in table.keys():
		var row: Dictionary = table[atk]
		for deff in row.keys():
			chart.set_mult(StringName(str(atk)), StringName(str(deff)), float(row[deff]))
	return chart


func to_json_dict() -> Dictionary:
	var chart := {}
	for atk in _mult.keys():
		var row := {}
		for deff in _mult[atk].keys():
			row[String(deff)] = _mult[atk][deff]
		chart[String(atk)] = row
	return {"types": TypeIds.ALL.duplicate(), "chart": chart}
