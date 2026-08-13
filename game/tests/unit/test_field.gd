extends GutTest


func test_reedwalk_boosts_bloom() -> void:
	var bloom := BattleFix.species("reed", ["bloom"], 80, 40, 40, 100, 40, 40)
	var pulse := BattleFix.species("hum", ["pulse"], 80, 40, 40, 40, 40, 40)
	var lash := BattleFix.move("lash", "bloom", "special", 40)
	var on_field := BattleSim.new()
	on_field.setup(BattleFix.battler(bloom, 50, BattleSim.SIDE_ALLY), BattleFix.battler(pulse, 50, BattleSim.SIDE_FOE), 4, null, &"reedwalk")
	on_field.register_move(lash)
	var e1: Array = on_field.step(BattleAction.fight(&"lash"), BattleAction.wait_action())
	var d1: BattleEvent = BattleFix.first_event(e1, BattleEvent.DAMAGE)
	var off := BattleSim.new()
	off.setup(BattleFix.battler(bloom, 50, BattleSim.SIDE_ALLY), BattleFix.battler(pulse, 50, BattleSim.SIDE_FOE), 4, null, &"")
	off.register_move(lash)
	var e2: Array = off.step(BattleAction.fight(&"lash"), BattleAction.wait_action())
	var d2: BattleEvent = BattleFix.first_event(e2, BattleEvent.DAMAGE)
	assert_not_null(d1)
	assert_not_null(d2)
	assert_eq(float(d1.payload.get("field", 1.0)), 1.3)
	assert_gt(int(d1.payload.get("amount", 0)), int(d2.payload.get("amount", 0)))


func test_tide_applies_mud_then_ember_bakes_dry_pan() -> void:
	var user := BattleFix.species("mixer", ["tide", "ember"], 80, 80, 40, 80, 40, 100)
	var dummy := BattleFix.species("dummy", ["pulse"], 80, 40, 40, 40, 40, 10)
	var slap := BattleFix.move("slap", "tide", "physical", 20)
	var spit := BattleFix.move("spit", "ember", "special", 20)
	var sim := BattleSim.new()
	sim.setup(BattleFix.battler(user, 30, BattleSim.SIDE_ALLY), BattleFix.battler(dummy, 30, BattleSim.SIDE_FOE), 2, null, &"reedwalk")
	sim.register_move(slap)
	sim.register_move(spit)
	var e1: Array = sim.step(BattleAction.fight(&"slap"), BattleAction.wait_action())
	assert_true(BattleFix.has_event(e1, BattleEvent.MUD))
	assert_gt(sim.foe.mud_turns, 0)
	assert_eq(String(sim.field_id), "reedwalk")
	var e2: Array = sim.step(BattleAction.fight(&"spit"), BattleAction.wait_action())
	assert_true(BattleFix.has_event(e2, BattleEvent.FIELD_CHANGE))
	assert_eq(String(sim.field_id), "dry_pan")
	assert_eq(sim.foe.mud_turns, 0)
	assert_eq(sim.ally.mud_turns, 0)


func test_dry_pan_type_mods() -> void:
	var rt := FieldRuntime.new()
	rt.field_id = &"dry_pan"
	assert_eq(rt.type_mod(&"ember"), 1.3)
	assert_eq(rt.type_mod(&"tide"), 0.7)
	assert_eq(rt.type_mod(&"bloom"), 0.85)
	assert_eq(rt.type_mod(&"pulse"), 1.0)


func test_dry_pan_tide_can_restore_reedwalk() -> void:
	var tide := BattleFix.species("wet", ["tide"], 80, 200, 40, 40, 40, 200)
	var dummy := BattleFix.species("x", ["pulse"], 200, 40, 40, 40, 40, 10)
	var slap := BattleFix.move("slap", "tide", "physical", 40)
	var restored := false
	for seed in range(1, 40):
		var sim := BattleSim.new()
		sim.setup(BattleFix.battler(tide, 40, BattleSim.SIDE_ALLY), BattleFix.battler(dummy, 40, BattleSim.SIDE_FOE), seed, null, &"dry_pan")
		sim.register_move(slap)
		var events: Array = sim.step(BattleAction.fight(&"slap"), BattleAction.wait_action())
		if BattleFix.has_event(events, BattleEvent.FIELD_CHANGE) and String(sim.field_id) == "reedwalk":
			restored = true
			break
	assert_true(restored, "30% restore should appear in a short seed hunt")


func test_mud_lowers_speed() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 100)
	var a := BattleFix.battler(spec, 30, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(spec, 30, BattleSim.SIDE_FOE)
	var sim := BattleSim.new()
	sim.setup(a, f, 1, null, &"reedwalk")
	var base: int = sim.effective_spe(f)
	sim.foe.mud_turns = 3
	var muddied: int = sim.effective_spe(f)
	assert_lt(muddied, base)
