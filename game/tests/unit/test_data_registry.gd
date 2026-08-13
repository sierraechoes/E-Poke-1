extends GutTest


func before_each() -> void:
	DataRegistry.reload()


func test_registry_is_clean() -> void:
	assert_true(DataRegistry.is_clean(), str(DataRegistry.errors))


func test_pinger_loads() -> void:
	assert_true(DataRegistry.has_species(&"pinger"))
	var s: EchoSpecies = DataRegistry.get_species(&"pinger")
	assert_eq(s.display_name, "Pinger")
	assert_eq(s.types[0], &"pulse")
	assert_eq(s.bst(), 280)


func test_pulse_tap_loads() -> void:
	assert_true(DataRegistry.has_move(&"pulse_tap"))
	var m: MoveSpec = DataRegistry.get_move(&"pulse_tap")
	assert_eq(m.type_id, &"pulse")
	assert_eq(m.power, 40)
	assert_eq(m.category, &"physical")


func test_instance_from_pinger_has_hp_and_move() -> void:
	var s: EchoSpecies = DataRegistry.get_species(&"pinger")
	var inst := EchoInstance.from_species(s, 5, &"even")
	var stats := inst.computed_stats(s)
	assert_gt(stats.hp, 0)
	assert_eq(inst.current_hp, stats.hp)
	assert_eq(inst.moves.size(), 1)
	assert_eq(str(inst.moves[0]["id"]), "pulse_tap")


func test_unknown_type_is_error() -> void:
	var bad := EchoSpecies.from_dict({
		"id": "badmon",
		"types": ["notatype"],
		"base_stats": {"hp": 50, "atk": 50, "def": 50, "spa": 50, "spd": 50, "spe": 50},
		"learnset": [],
	})
	DataRegistry.species[&"badmon"] = bad
	DataRegistry.errors.clear()
	DataRegistry.validate()
	assert_gt(DataRegistry.errors.size(), 0)
	DataRegistry.reload()


func test_missing_learnset_move_is_error() -> void:
	var bad := EchoSpecies.from_dict({
		"id": "lostmove",
		"types": ["pulse"],
		"base_stats": {"hp": 50, "atk": 50, "def": 50, "spa": 50, "spd": 50, "spe": 50},
		"learnset": [{"level": 1, "move": "does_not_exist"}],
	})
	DataRegistry.species[&"lostmove"] = bad
	DataRegistry.errors.clear()
	DataRegistry.validate()
	var hit := false
	for e in DataRegistry.errors:
		if str(e).contains("does_not_exist"):
			hit = true
	assert_true(hit)
	DataRegistry.reload()


func test_chart_available() -> void:
	assert_not_null(DataRegistry.chart)
	assert_eq(DataRegistry.chart.multiplier(&"ember", &"bloom"), 2.0)


func test_p03_content_loads() -> void:
	assert_true(DataRegistry.has_item(&"reed_tonic"))
	assert_true(DataRegistry.has_field(&"dry_pan"))
	assert_true(DataRegistry.has_ability(&"reed_spine"))
	assert_true(DataRegistry.has_species(&"brackon"))
	assert_true(DataRegistry.has_move(&"tide_slap"))
	assert_gte(DataRegistry.ability_count(), 8)
	assert_gte(DataRegistry.item_count(), 6)
