extends GutTest


func test_catalog_has_at_least_eight() -> void:
	var cat := AbilityCatalog.new()
	assert_gte(cat.size(), 8)
	for id in [&"static_hum", &"kiln_hide", &"reed_spine", &"silt_cloak", &"dry_kindle", &"clear_tone", &"swift_current", &"after_glow"]:
		assert_true(cat.has(id), String(id))


func test_sim_does_not_hardcode_ability_names() -> void:
	var src := FileAccess.get_file_as_string("res://src/battle/battle_sim.gd")
	assert_false(src.is_empty())
	for id in ["static_hum", "kiln_hide", "reed_spine", "silt_cloak", "dry_kindle", "clear_tone", "swift_current", "after_glow"]:
		assert_false(src.contains(id), id)


func test_kiln_hide_blocks_burn() -> void:
	var spec := BattleFix.species("hide", ["ember"], 80, 40, 40, 40, 40, 40)
	var a := BattleFix.battler(spec, 20, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(spec, 20, BattleSim.SIDE_FOE, &"kiln_hide")
	var brand := BattleFix.move("brand", "ember", "special", 10, {"effect": {"status": "burn", "chance": 100}})
	var sim := BattleSim.new()
	sim.setup(a, f, 1)
	sim.register_move(brand)
	sim.step(BattleAction.fight(&"brand"), BattleAction.wait_action())
	assert_eq(String(f.instance.status_id), "")


func test_clear_tone_blocks_any_status() -> void:
	var spec := BattleFix.species("tone", ["pulse"], 80, 40, 40, 40, 40, 40)
	var a := BattleFix.battler(spec, 20, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(spec, 20, BattleSim.SIDE_FOE, &"clear_tone")
	var sim := BattleSim.new()
	sim.setup(a, f, 1)
	var events: Array = []
	assert_false(sim.try_inflict(f, StatusIds.PARA, events))
	assert_false(sim.try_inflict(f, StatusIds.SLEEP, events))
	assert_true(BattleFix.has_event(events, BattleEvent.STATUS_BLOCKED))


func test_reed_spine_doubles_bloom_stab() -> void:
	var spec := BattleFix.species("spine", ["bloom"], 80, 40, 40, 100, 40, 40)
	var dummy := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var lash := BattleFix.move("lash", "bloom", "special", 40)
	var boosted := BattleSim.new()
	boosted.setup(BattleFix.battler(spec, 40, BattleSim.SIDE_ALLY, &"reed_spine"), BattleFix.battler(dummy, 40, BattleSim.SIDE_FOE), 4)
	boosted.register_move(lash)
	var e1: Array = boosted.step(BattleAction.fight(&"lash"), BattleAction.wait_action())
	var plain := BattleSim.new()
	plain.setup(BattleFix.battler(spec, 40, BattleSim.SIDE_ALLY), BattleFix.battler(dummy, 40, BattleSim.SIDE_FOE), 4)
	plain.register_move(lash)
	var e2: Array = plain.step(BattleAction.fight(&"lash"), BattleAction.wait_action())
	var d1: BattleEvent = BattleFix.first_event(e1, BattleEvent.DAMAGE)
	var d2: BattleEvent = BattleFix.first_event(e2, BattleEvent.DAMAGE)
	assert_eq(float(d1.payload.get("stab", 0.0)), 2.0)
	assert_eq(float(d2.payload.get("stab", 0.0)), 1.5)
	assert_gt(int(d1.payload.get("amount", 0)), int(d2.payload.get("amount", 0)))


func test_silt_cloak_reduces_damage_in_mud() -> void:
	var spec := BattleFix.species("cloak", ["stone"], 80, 40, 80, 40, 80, 40)
	var atk := BattleFix.species("hit", ["pulse"], 80, 100, 40, 40, 40, 40)
	var hit := BattleFix.move("hit", "pulse", "physical", 50)
	var cloaked := BattleFix.battler(spec, 30, BattleSim.SIDE_FOE, &"silt_cloak")
	var sim := BattleSim.new()
	sim.setup(BattleFix.battler(atk, 30, BattleSim.SIDE_ALLY), cloaked, 5)
	sim.register_move(hit)
	sim.foe.mud_turns = 3
	var e1: Array = sim.step(BattleAction.fight(&"hit"), BattleAction.wait_action())
	var sim2 := BattleSim.new()
	sim2.setup(BattleFix.battler(atk, 30, BattleSim.SIDE_ALLY), BattleFix.battler(spec, 30, BattleSim.SIDE_FOE, &"silt_cloak"), 5)
	sim2.register_move(hit)
	var e2: Array = sim2.step(BattleAction.fight(&"hit"), BattleAction.wait_action())
	assert_lt(int(BattleFix.first_event(e1, BattleEvent.DAMAGE).payload.get("amount", 0)), int(BattleFix.first_event(e2, BattleEvent.DAMAGE).payload.get("amount", 0)))


func test_swift_current_boosts_speed_on_reedwalk() -> void:
	var spec := BattleFix.species("flow", ["tide"], 80, 40, 40, 40, 40, 80)
	var a := BattleFix.battler(spec, 30, BattleSim.SIDE_ALLY, &"swift_current")
	var f := BattleFix.battler(spec, 30, BattleSim.SIDE_FOE)
	var wet := BattleSim.new()
	wet.setup(a, f, 1, null, &"reedwalk")
	var dry := BattleSim.new()
	dry.setup(BattleFix.battler(spec, 30, BattleSim.SIDE_ALLY, &"swift_current"), BattleFix.battler(spec, 30, BattleSim.SIDE_FOE), 1, null, &"")
	assert_gt(wet.effective_spe(wet.ally.active()), dry.effective_spe(dry.ally.active()))


func test_after_glow_heals_residual() -> void:
	var spec := BattleFix.species("glow", ["light"], 80, 40, 40, 40, 40, 40)
	var a := BattleFix.battler(spec, 40, BattleSim.SIDE_ALLY, &"after_glow")
	a.instance.current_hp = int(a.max_hp() / 2)
	var before: int = a.hp()
	var sim := BattleSim.new()
	sim.setup(a, BattleFix.battler(spec, 40, BattleSim.SIDE_FOE), 1)
	sim.step(BattleAction.wait_action(), BattleAction.wait_action())
	assert_gt(a.hp(), before)
	assert_true(BattleFix.has_event(sim.log, BattleEvent.HEAL))


func test_dry_kindle_boosts_ember_on_dry_pan() -> void:
	var spec := BattleFix.species("kindle", ["ember"], 80, 40, 40, 100, 40, 40)
	var dummy := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var spit := BattleFix.move("spit", "ember", "special", 40)
	var hot := BattleSim.new()
	hot.setup(BattleFix.battler(spec, 40, BattleSim.SIDE_ALLY, &"dry_kindle"), BattleFix.battler(dummy, 40, BattleSim.SIDE_FOE), 4, null, &"dry_pan")
	hot.register_move(spit)
	var e1: Array = hot.step(BattleAction.fight(&"spit"), BattleAction.wait_action())
	var cold := BattleSim.new()
	cold.setup(BattleFix.battler(spec, 40, BattleSim.SIDE_ALLY, &"dry_kindle"), BattleFix.battler(dummy, 40, BattleSim.SIDE_FOE), 4, null, &"")
	cold.register_move(spit)
	var e2: Array = cold.step(BattleAction.fight(&"spit"), BattleAction.wait_action())
	assert_gt(int(BattleFix.first_event(e1, BattleEvent.DAMAGE).payload.get("amount", 0)), int(BattleFix.first_event(e2, BattleEvent.DAMAGE).payload.get("amount", 0)))


func test_static_hum_can_para_on_contact() -> void:
	var hum := BattleFix.species("hum", ["volt"], 80, 40, 40, 40, 40, 10)
	var slap := BattleFix.species("hand", ["pulse"], 80, 200, 40, 40, 40, 200)
	var tap := BattleFix.move("tap", "pulse", "physical", 20, {"tags": ["contact"]})
	var saw := false
	for seed in range(1, 50):
		var a := BattleFix.battler(slap, 30, BattleSim.SIDE_ALLY)
		var f := BattleFix.battler(hum, 30, BattleSim.SIDE_FOE, &"static_hum")
		var sim := BattleSim.new()
		sim.setup(a, f, seed)
		sim.register_move(tap)
		var events: Array = sim.step(BattleAction.fight(&"tap"), BattleAction.wait_action())
		if String(a.instance.status_id) == "para" or BattleFix.has_event(events, BattleEvent.STATUS_APPLIED):
			saw = true
			break
	assert_true(saw)
