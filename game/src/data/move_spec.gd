class_name MoveSpec
extends Resource

const CATEGORIES := [&"physical", &"special", &"status"]

@export var id: StringName = &""
@export var display_name: String = ""
@export var type_id: StringName = &"pulse"
@export var category: StringName = &"physical"
@export var power: int = 40
@export var accuracy: int = 100
@export var pp: int = 35
@export var priority: int = 0
@export var tags: Array[StringName] = []
@export var description: String = ""
## {status, chance, flinch}
@export var effect: Dictionary = {}


func to_dict() -> Dictionary:
	var tag_strs: Array = []
	for t in tags:
		tag_strs.append(String(t))
	return {
		"id": String(id),
		"display_name": display_name,
		"type": String(type_id),
		"category": String(category),
		"power": power,
		"accuracy": accuracy,
		"pp": pp,
		"priority": priority,
		"tags": tag_strs,
		"description": description,
		"effect": effect.duplicate(true),
	}


static func from_dict(raw: Dictionary) -> MoveSpec:
	var m := MoveSpec.new()
	m.id = StringName(str(raw.get("id", "")))
	m.display_name = str(raw.get("display_name", m.id))
	m.type_id = StringName(str(raw.get("type", "pulse")))
	m.category = StringName(str(raw.get("category", "physical")))
	m.power = int(raw.get("power", 40))
	m.accuracy = int(raw.get("accuracy", 100))
	m.pp = int(raw.get("pp", 35))
	m.priority = int(raw.get("priority", 0))
	m.tags.clear()
	for t in raw.get("tags", []):
		m.tags.append(StringName(str(t)))
	m.description = str(raw.get("description", ""))
	var eff: Variant = raw.get("effect", {})
	m.effect = eff.duplicate(true) if typeof(eff) == TYPE_DICTIONARY else {}
	return m
