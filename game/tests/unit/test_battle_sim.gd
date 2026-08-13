extends GutTest


func _species(id: String, types: Array, hp: int, atk: int, defn: int, spa: int, spd: int, spe: int) -> EchoSpecies:
	return EchoSpecies.from_dict({
		"id": id,
		"display_name": id.capitalize(),
		"types": types,
		"base_stats": {"hp": hp, "atk": atk, "def": defn, "spa": spa, "spd": spd, "spe": spe},
		"learnset": [],
		"abilities": [],
	})


func _move(id: String, type_id: String, cat: String, power: int) -> MoveSpec:
	return MoveSpec.from_dict({
		"id": id,
		"display_name": id,
		"type": type_id,
		"category": cat,
		"power": power,
		"accuracy": 100,
		"pp": 20,
	})


func _battler(spec: EchoSpecies, level: int, side: StringName) -> Battler:
	var inst := EchoInstance.from_species(spec, level, &"even")
	inst.scars = StatBlock.new(31, 31, 31, 31, 31, 31)
	var stats := inst.computed_stats(spec)
	inst.current_hp = stats.hp
	return Battler.from_instance(inst, spec, side)


func test_scripted_1v1_reaches_a_winner() -> void:
	var a_spec := _species("striker", ["pulse"], 40, 120, 40, 40, 40, 80)
	var f_spec := _species("pillow", ["pulse"], 30, 20, 20, 20, 20, 20)
	var hit := _move("slam", "pulse", "physical", 80)
	var sim := BattleSim.new()
	sim.setup(_battler(a_spec, 50, BattleSim.SIDE_ALLY), _battler(f_spec, 50, BattleSim.SIDE_FOE), 7)
	sim.register_move(hit)
	var guard := 0
	while not sim.is_over() and guard < 20:
		sim.step(BattleAction.fight(&"slam"), BattleAction.fight(&"slam"))
		guard += 1
	assert_true(sim.is_over())
	assert_true(sim.winner == BattleSim.SIDE_ALLY or sim.winner == BattleSim.SIDE_FOE)
	assert_gt(sim.turn, 0)


func test_dead_battler_does_not_move() -> void:
	var fast := _species("fast", ["ember"], 80, 200, 40, 40, 40, 200)
	var slow := _species("slow", ["bloom"], 15, 200, 10, 40, 10, 10)
	var nuke := _move("blast", "ember", "physical", 120)
	var sim := BattleSim.new()
	var a := _battler(fast, 50, BattleSim.SIDE_ALLY)
	var f := _battler(slow, 5, BattleSim.SIDE_FOE)
	var slow_hp_before := f.hp()
	sim.setup(a, f, 1)
	sim.register_move(nuke)
	var events: Array = sim.step(BattleAction.fight(&"blast"), BattleAction.fight(&"blast"))
	assert_true(f.fainted)
	var slow_acted := false
	for e in events:
		var ev: BattleEvent = e
		if ev.type == BattleEvent.DAMAGE and str(ev.payload.get("side", "")) == "ally":
			slow_acted = true
	assert_false(slow_acted, "fainted slow must not damage the fast one")
	assert_eq(a.hp(), a.max_hp())
	assert_gt(slow_hp_before, 0)


func test_same_seed_same_end_hp() -> void:
	var s1 := _run_pair(11)
	var s2 := _run_pair(11)
	assert_eq(s1["ally_hp"], s2["ally_hp"])
	assert_eq(s1["foe_hp"], s2["foe_hp"])
	assert_eq(s1["winner"], s2["winner"])
	var s3 := _run_pair(99)
	assert_true(typeof(s3["ally_hp"]) == TYPE_INT)


func test_stab_payload_is_one_point_five() -> void:
	var spec := _species("hum", ["pulse"], 80, 80, 80, 80, 80, 80)
	var mv := _move("tap", "pulse", "physical", 40)
	var sim := BattleSim.new()
	sim.setup(_battler(spec, 50, BattleSim.SIDE_ALLY), _battler(spec, 50, BattleSim.SIDE_FOE), 3)
	sim.register_move(mv)
	var events: Array = sim.step(BattleAction.fight(&"tap"), BattleAction.wait_action())
	var saw := false
	for e in events:
		var ev: BattleEvent = e
		if ev.type == BattleEvent.DAMAGE:
			assert_eq(float(ev.payload.get("stab", 0.0)), 1.5)
			saw = true
	assert_true(saw)


func test_type_chart_in_sim_ember_vs_bloom() -> void:
	var fire := _species("cinder", ["ember"], 80, 40, 40, 100, 40, 60)
	var grass := _species("reed", ["bloom"], 80, 40, 40, 40, 40, 40)
	var spit := _move("spit", "ember", "special", 40)
	var sim := BattleSim.new()
	sim.setup(_battler(fire, 50, BattleSim.SIDE_ALLY), _battler(grass, 50, BattleSim.SIDE_FOE), 4)
	sim.register_move(spit)
	var events: Array = sim.step(BattleAction.fight(&"spit"), BattleAction.wait_action())
	for e in events:
		var ev: BattleEvent = e
		if ev.type == BattleEvent.DAMAGE:
			assert_eq(float(ev.payload.get("type_mult", 0.0)), 2.0)


func test_snapshot_has_hp() -> void:
	DataRegistry.reload()
	var ping: EchoSpecies = DataRegistry.get_species(&"pinger")
	var reed: EchoSpecies = DataRegistry.get_species(&"reedling")
	assert_not_null(ping)
	assert_not_null(reed)
	var sim := BattleSim.new()
	sim.setup(_battler(ping, 10, BattleSim.SIDE_ALLY), _battler(reed, 10, BattleSim.SIDE_FOE), 5)
	var snap: Dictionary = sim.snapshot()
	assert_gt(int(snap["ally"]["hp"]), 0)
	assert_gt(int(snap["foe"]["hp"]), 0)
	assert_false(bool(snap["over"]))


func _run_pair(p_seed: int) -> Dictionary:
	var a_spec := _species("aa", ["pulse"], 60, 90, 50, 50, 50, 70)
	var f_spec := _species("bb", ["pulse"], 60, 90, 50, 50, 50, 70)
	var hit := _move("hit", "pulse", "physical", 50)
	var sim := BattleSim.new()
	sim.setup(_battler(a_spec, 30, BattleSim.SIDE_ALLY), _battler(f_spec, 30, BattleSim.SIDE_FOE), p_seed)
	sim.register_move(hit)
	sim.step(BattleAction.fight(&"hit"), BattleAction.fight(&"hit"))
	var snap: Dictionary = sim.snapshot()
	return {
		"ally_hp": int(snap["ally"]["hp"]),
		"foe_hp": int(snap["foe"]["hp"]),
		"winner": String(snap["winner"]),
	}
