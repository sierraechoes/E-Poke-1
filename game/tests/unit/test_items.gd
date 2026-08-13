extends GutTest


func test_reed_tonic_heals_twenty() -> void:
	DataRegistry.reload()
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var a := BattleFix.battler(spec, 40, BattleSim.SIDE_ALLY)
	a.instance.current_hp = a.max_hp() - 30
	var sim := BattleSim.new()
	sim.setup(a, BattleFix.battler(spec, 40, BattleSim.SIDE_FOE), 1)
	sim.add_item(BattleSim.SIDE_ALLY, &"reed_tonic", 1)
	var before: int = a.hp()
	sim.step(BattleAction.use_item(&"reed_tonic"), BattleAction.wait_action())
	assert_eq(a.hp(), before + 20)
	assert_eq(sim.item_count(BattleSim.SIDE_ALLY, &"reed_tonic"), 0)


func test_balm_vial_clears_burn() -> void:
	DataRegistry.reload()
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var a := BattleFix.battler(spec, 20, BattleSim.SIDE_ALLY)
	a.instance.status_id = StatusIds.BURN
	var sim := BattleSim.new()
	sim.setup(a, BattleFix.battler(spec, 20, BattleSim.SIDE_FOE), 1)
	sim.add_item(BattleSim.SIDE_ALLY, &"balm_vial", 1)
	sim.step(BattleAction.use_item(&"balm_vial"), BattleAction.wait_action())
	assert_eq(String(a.instance.status_id), "")


func test_focus_reed_raises_attack() -> void:
	DataRegistry.reload()
	var spec := BattleFix.species("x", ["pulse"], 80, 80, 40, 40, 40, 40)
	var hit := BattleFix.move("hit", "pulse", "physical", 40)
	var a := BattleFix.battler(spec, 30, BattleSim.SIDE_ALLY)
	var sim := BattleSim.new()
	sim.setup(a, BattleFix.battler(spec, 30, BattleSim.SIDE_FOE), 2)
	sim.register_move(hit)
	sim.add_item(BattleSim.SIDE_ALLY, &"focus_reed", 1)
	sim.step(BattleAction.use_item(&"focus_reed"), BattleAction.wait_action())
	assert_eq(a.stages.get_named(&"atk"), 2)
	var boosted: int = a.staged(&"atk")
	assert_gt(boosted, a.stats.atk)


func test_bloom_berry_halves_super_effective() -> void:
	DataRegistry.reload()
	var grass := BattleFix.species("reed", ["bloom"], 80, 40, 40, 100, 40, 40)
	var dummy := BattleFix.species("x", ["tide"], 80, 40, 40, 40, 40, 40)
	var lash := BattleFix.move("lash", "bloom", "special", 60)
	var held := BattleFix.battler(dummy, 40, BattleSim.SIDE_FOE)
	held.set_held(&"bloom_berry")
	var sim := BattleSim.new()
	sim.setup(BattleFix.battler(grass, 40, BattleSim.SIDE_ALLY), held, 4)
	sim.register_move(lash)
	var e1: Array = sim.step(BattleAction.fight(&"lash"), BattleAction.wait_action())
	var bare := BattleFix.battler(dummy, 40, BattleSim.SIDE_FOE)
	var sim2 := BattleSim.new()
	sim2.setup(BattleFix.battler(grass, 40, BattleSim.SIDE_ALLY), bare, 4)
	sim2.register_move(lash)
	var e2: Array = sim2.step(BattleAction.fight(&"lash"), BattleAction.wait_action())
	var d1: int = int(BattleFix.first_event(e1, BattleEvent.DAMAGE).payload.get("amount", 0))
	var d2: int = int(BattleFix.first_event(e2, BattleEvent.DAMAGE).payload.get("amount", 0))
	assert_lt(d1, d2)
	assert_eq(String(held.held_id()), "")


func test_hum_charm_heals_each_turn() -> void:
	DataRegistry.reload()
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var a := BattleFix.battler(spec, 40, BattleSim.SIDE_ALLY)
	a.set_held(&"hum_charm")
	a.instance.current_hp = int(a.max_hp() / 2)
	var before: int = a.hp()
	var sim := BattleSim.new()
	sim.setup(a, BattleFix.battler(spec, 40, BattleSim.SIDE_FOE), 1)
	sim.step(BattleAction.wait_action(), BattleAction.wait_action())
	assert_gt(a.hp(), before)


func test_six_items_load() -> void:
	DataRegistry.reload()
	for id in [&"reed_tonic", &"balm_vial", &"focus_reed", &"bloom_berry", &"hum_charm", &"tuning_resin"]:
		assert_true(DataRegistry.has_item(id), String(id))
	assert_gte(DataRegistry.item_count(), 6)
