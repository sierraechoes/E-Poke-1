extends GutTest


func test_type_aware_picks_super_effective() -> void:
	var ally_s := BattleFix.species("reed", ["bloom"], 80, 40, 40, 40, 40, 40)
	var foe_s := BattleFix.species("mixed", ["ember"], 80, 40, 40, 80, 40, 40)
	var a := BattleFix.battler(ally_s, 20, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(foe_s, 20, BattleSim.SIDE_FOE)
	f.instance.moves = [
		{"id": "ember_spit", "pp": -1},
		{"id": "pulse_tap", "pp": -1},
	]
	var sim := BattleSim.new()
	sim.setup(a, f, 1)
	var ai := BattleAI.new(1)
	var act: BattleAction = ai.choose(sim, BattleSim.SIDE_FOE, BattleAI.TYPE_AWARE)
	assert_eq(act.kind, BattleAction.KIND_FIGHT)
	assert_eq(act.move_id, &"ember_spit")


func test_random_picks_a_legal_move() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var a := BattleFix.battler(spec, 10, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(spec, 10, BattleSim.SIDE_FOE)
	f.instance.moves = [
		{"id": "pulse_tap", "pp": -1},
		{"id": "ember_spit", "pp": -1},
	]
	var sim := BattleSim.new()
	sim.setup(a, f, 1)
	var ai := BattleAI.new(11)
	var seen: Dictionary = {}
	for i in 20:
		var act: BattleAction = ai.choose(sim, BattleSim.SIDE_FOE, BattleAI.RANDOM)
		assert_eq(act.kind, BattleAction.KIND_FIGHT)
		seen[String(act.move_id)] = true
	assert_true(seen.has("pulse_tap") or seen.has("ember_spit"))


func test_random_does_not_consume_battle_rng() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var sim := BattleSim.new()
	sim.setup(BattleFix.battler(spec, 10, BattleSim.SIDE_ALLY), BattleFix.battler(spec, 10, BattleSim.SIDE_FOE), 5)
	var before: int = sim.rng.call_count
	var ai := BattleAI.new(99)
	ai.choose(sim, BattleSim.SIDE_FOE, BattleAI.RANDOM)
	assert_eq(sim.rng.call_count, before)
