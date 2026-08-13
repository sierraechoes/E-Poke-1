extends Node
## Loads and validates all game data under res://data.
## Autoload: DataRegistry

signal reloaded

var chart: TypeChart
var species: Dictionary = {} ## StringName -> EchoSpecies
var moves: Dictionary = {}
var abilities: Dictionary = {}
var items: Dictionary = {}
var fields: Dictionary = {}
var errors: Array[String] = []
var warnings: Array[String] = []


func _ready() -> void:
	reload()


func reload() -> void:
	errors.clear()
	warnings.clear()
	species.clear()
	moves.clear()
	abilities.clear()
	items.clear()
	fields.clear()
	chart = TypeChart.from_locked_table()
	_merge_chart_file()
	_load_folder("res://data/moves", _ingest_move)
	_load_folder("res://data/abilities", _ingest_ability)
	_load_folder("res://data/items", _ingest_item)
	_load_folder("res://data/fields", _ingest_field)
	_load_folder("res://data/species", _ingest_species)
	validate()
	for e in errors:
		push_error("DataRegistry: " + e)
	for w in warnings:
		push_warning("DataRegistry: " + w)
	reloaded.emit()


func is_clean() -> bool:
	return errors.is_empty()


func has_species(id: StringName) -> bool:
	return species.has(id)


func has_move(id: StringName) -> bool:
	return moves.has(id)


func get_species(id: StringName) -> EchoSpecies:
	return species.get(id)


func get_move(id: StringName) -> MoveSpec:
	return moves.get(id)


func has_item(id: StringName) -> bool:
	return items.has(id)


func get_item(id: StringName) -> ItemSpec:
	return items.get(id)


func has_field(id: StringName) -> bool:
	return fields.has(id)


func get_field(id: StringName) -> FieldSpec:
	return fields.get(id)


func has_ability(id: StringName) -> bool:
	return abilities.has(id)


func get_ability(id: StringName) -> AbilitySpec:
	return abilities.get(id)


func species_count() -> int:
	return species.size()


func move_count() -> int:
	return moves.size()


func item_count() -> int:
	return items.size()


func ability_count() -> int:
	return abilities.size()


func validate() -> void:
	for id in species.keys():
		var s: EchoSpecies = species[id]
		if String(s.id).is_empty():
			errors.append("Species missing id in file for key %s" % id)
		if s.types.is_empty():
			errors.append("%s has no types" % id)
		for t in s.types:
			if not TypeIds.is_valid(t):
				errors.append("%s has unknown type '%s'" % [id, t])
		if s.types.size() > 2:
			errors.append("%s has more than two types" % id)
		if s.base_stats == null:
			errors.append("%s missing base_stats" % id)
		else:
			var bst := s.bst()
			if bst < 150:
				warnings.append("%s BST %d is very low" % [id, bst])
			if bst > 780:
				warnings.append("%s BST %d is very high" % [id, bst])
		for e in s.learnset:
			if not moves.has(e.move_id):
				errors.append("%s learnset references missing move '%s'" % [id, e.move_id])
		for a in s.abilities:
			if not abilities.has(a):
				errors.append("%s references missing ability '%s'" % [id, a])
	for id in moves.keys():
		var m: MoveSpec = moves[id]
		if not TypeIds.is_valid(m.type_id):
			errors.append("Move %s has unknown type '%s'" % [id, m.type_id])
		if not MoveSpec.CATEGORIES.has(m.category):
			errors.append("Move %s has bad category '%s'" % [id, m.category])
	# Duplicate IDs across kinds are allowed (move vs species) but not inside a kind —
	# Dictionary keys already collapse those.


func _merge_chart_file() -> void:
	var path := "res://data/type_chart.json"
	if not FileAccess.file_exists(path):
		return
	var parsed: Variant = _read_json(path)
	if typeof(parsed) != TYPE_DICTIONARY:
		errors.append("type_chart.json is not an object")
		return
	var file_chart := TypeChart.from_json_dict(parsed)
	chart.merge_from(file_chart)


func _load_folder(path: String, ingest: Callable) -> void:
	if not DirAccess.dir_exists_absolute(path) and not DirAccess.dir_exists_absolute(ProjectSettings.globalize_path(path)):
		# res:// paths: try DirAccess.open
		pass
	var dir := DirAccess.open(path)
	if dir == null:
		return
	dir.list_dir_begin()
	var name := dir.get_next()
	while name != "":
		if not dir.current_is_dir() and name.ends_with(".json"):
			var full := path.path_join(name)
			var parsed: Variant = _read_json(full)
			if typeof(parsed) != TYPE_DICTIONARY:
				errors.append("%s is not a JSON object" % full)
			else:
				ingest.call(parsed, full)
		name = dir.get_next()
	dir.list_dir_end()


func _ingest_species(raw: Dictionary, path: String) -> void:
	var s := EchoSpecies.from_dict(raw)
	if s.id == &"":
		errors.append("Species in %s has empty id" % path)
		return
	if species.has(s.id):
		errors.append("Duplicate species id '%s' (%s)" % [s.id, path])
		return
	species[s.id] = s


func _ingest_move(raw: Dictionary, path: String) -> void:
	var m := MoveSpec.from_dict(raw)
	if m.id == &"":
		errors.append("Move in %s has empty id" % path)
		return
	if moves.has(m.id):
		errors.append("Duplicate move id '%s'" % m.id)
		return
	moves[m.id] = m


func _ingest_ability(raw: Dictionary, path: String) -> void:
	var a := AbilitySpec.from_dict(raw)
	if a.id == &"":
		errors.append("Ability in %s has empty id" % path)
		return
	if abilities.has(a.id):
		errors.append("Duplicate ability id '%s'" % a.id)
		return
	abilities[a.id] = a


func _ingest_item(raw: Dictionary, path: String) -> void:
	var i := ItemSpec.from_dict(raw)
	if i.id == &"":
		errors.append("Item in %s has empty id" % path)
		return
	if items.has(i.id):
		errors.append("Duplicate item id '%s'" % i.id)
		return
	items[i.id] = i


func _ingest_field(raw: Dictionary, path: String) -> void:
	var f := FieldSpec.from_dict(raw)
	if f.id == &"":
		errors.append("Field in %s has empty id" % path)
		return
	if fields.has(f.id):
		errors.append("Duplicate field id '%s'" % f.id)
		return
	fields[f.id] = f


func _read_json(path: String) -> Variant:
	var text := FileAccess.get_file_as_string(path)
	if text.is_empty():
		return null
	return JSON.parse_string(text)
