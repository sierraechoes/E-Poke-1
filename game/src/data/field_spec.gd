class_name FieldSpec
extends Resource

@export var id: StringName = &""
@export var display_name: String = ""
@export var almanac: String = ""
## type_id -> multiplier (e.g. bloom: 1.3)
@export var type_mods: Dictionary = {}
## [{tag, to}]
@export var transitions: Array = []


func type_mod(type_id: StringName) -> float:
	return float(type_mods.get(type_id, type_mods.get(String(type_id), 1.0)))


func to_dict() -> Dictionary:
	return {
		"id": String(id),
		"display_name": display_name,
		"almanac": almanac,
		"type_mods": type_mods.duplicate(true),
		"transitions": transitions.duplicate(true),
	}


static func from_dict(raw: Dictionary) -> FieldSpec:
	var f := FieldSpec.new()
	f.id = StringName(str(raw.get("id", "")))
	f.display_name = str(raw.get("display_name", f.id))
	f.almanac = str(raw.get("almanac", ""))
	f.type_mods = raw.get("type_mods", {}).duplicate(true)
	f.transitions = raw.get("transitions", []).duplicate(true)
	return f
