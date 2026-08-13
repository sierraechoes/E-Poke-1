class_name EchoSpecies
extends Resource

@export var id: StringName = &""
@export var display_name: String = ""
@export var types: Array[StringName] = []
@export var base_stats: StatBlock
@export var abilities: Array[StringName] = []
@export var learnset: Array[LearnsetEntry] = []
@export var attune_rate: int = 45
@export var habitat_tags: Array[StringName] = []
@export var category: String = "Echo"
@export var entry: String = ""


func _init() -> void:
	if base_stats == null:
		base_stats = StatBlock.new()


func bst() -> int:
	return base_stats.bst() if base_stats else 0


func to_dict() -> Dictionary:
	var learns: Array = []
	for e in learnset:
		learns.append(e.to_dict())
	var type_strs: Array = []
	for t in types:
		type_strs.append(String(t))
	var abil_strs: Array = []
	for a in abilities:
		abil_strs.append(String(a))
	var hab: Array = []
	for h in habitat_tags:
		hab.append(String(h))
	return {
		"id": String(id),
		"display_name": display_name,
		"types": type_strs,
		"base_stats": base_stats.to_dict() if base_stats else {},
		"abilities": abil_strs,
		"learnset": learns,
		"attune_rate": attune_rate,
		"habitat_tags": hab,
		"category": category,
		"entry": entry,
	}


static func from_dict(raw: Dictionary) -> EchoSpecies:
	var s := EchoSpecies.new()
	s.id = StringName(str(raw.get("id", "")))
	s.display_name = str(raw.get("display_name", s.id))
	s.types.clear()
	for t in raw.get("types", []):
		s.types.append(StringName(str(t)))
	s.base_stats = StatBlock.from_dict(raw.get("base_stats", {}))
	s.abilities.clear()
	for a in raw.get("abilities", []):
		s.abilities.append(StringName(str(a)))
	s.learnset.clear()
	for e in raw.get("learnset", []):
		if typeof(e) == TYPE_DICTIONARY:
			s.learnset.append(LearnsetEntry.from_dict(e))
	s.attune_rate = int(raw.get("attune_rate", 45))
	s.habitat_tags.clear()
	for h in raw.get("habitat_tags", []):
		s.habitat_tags.append(StringName(str(h)))
	s.category = str(raw.get("category", "Echo"))
	s.entry = str(raw.get("entry", ""))
	return s
