extends GutTest


func test_burn_halves_physical_in_sim() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 80, 80, 80, 80, 80)
	var hit := BattleFix.move("hit", "pulse", "physical", 60)
	var a := BattleFix.battler(spec, 50, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(spec, 50, BattleSim.SIDE_FOE)
	a.instance.status_id = StatusIds.BURN
	var sim := BattleSim.new()
	sim.setup(a, f, 3)
	sim.register_move(hit)
	var events: Array = sim.step(BattleAction.fight(&"hit"), BattleAction.wait_action())
	var ev: BattleEvent = BattleFix.first_event(events, BattleEvent.DAMAGE)
	assert_not_null(ev)
	assert_eq(float(ev.payload.get("burn", 1.0)), 0.5)


func test_burn_residual_ticks() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var a := BattleFix.battler(spec, 50, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(spec, 50, BattleSim.SIDE_FOE)
	a.instance.status_id = StatusIds.BURN
	var before: int = a.hp()
	var sim := BattleSim.new()
	sim.setup(a, f, 1)
	sim.step(BattleAction.wait_action(), BattleAction.wait_action())
	var expect: int = StatusIds.residual_damage(StatusIds.BURN, a.max_hp())
	assert_eq(a.hp(), before - expect)
	assert_true(BattleFix.has_event(sim.log, BattleEvent.STATUS_DAMAGE))


func test_poison_residual_ticks() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var a := BattleFix.battler(spec, 50, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(spec, 50, BattleSim.SIDE_FOE)
	a.instance.status_id = StatusIds.POISON
	var before: int = a.hp()
	var sim := BattleSim.new()
	sim.setup(a, f, 1)
	sim.step(BattleAction.wait_action(), BattleAction.wait_action())
	var expect: int = StatusIds.residual_damage(StatusIds.POISON, a.max_hp())
	assert_eq(a.hp(), before - expect)
	assert_gt(expect, StatusIds.residual_damage(StatusIds.BURN, a.max_hp()))


func test_sleep_skips_then_wakes() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 80, 80, 80, 80, 40)
	var hit := BattleFix.move("hit", "pulse", "physical", 40)
	var a := BattleFix.battler(spec, 30, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(spec, 30, BattleSim.SIDE_FOE)
	a.instance.status_id = StatusIds.SLEEP
	a.sleep_turns = 1
	var sim := BattleSim.new()
	sim.setup(a, f, 2)
	sim.register_move(hit)
	var e1: Array = sim.step(BattleAction.fight(&"hit"), BattleAction.wait_action())
	assert_true(BattleFix.has_event(e1, BattleEvent.SLEEP))
	assert_false(BattleFix.has_event(e1, BattleEvent.DAMAGE))
	var e2: Array = sim.step(BattleAction.fight(&"hit"), BattleAction.wait_action())
	assert_true(BattleFix.has_event(e2, BattleEvent.WAKE))
	assert_true(BattleFix.has_event(e2, BattleEvent.DAMAGE))
	assert_eq(String(a.instance.status_id), "")


func test_para_halves_speed_order() -> void:
	var fast := BattleFix.species("fast", ["pulse"], 80, 40, 40, 40, 40, 90)
	var mid := BattleFix.species("mid", ["pulse"], 80, 40, 40, 40, 40, 80)
	var hit := BattleFix.move("hit", "pulse", "physical", 20)
	var a := BattleFix.battler(fast, 50, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(mid, 50, BattleSim.SIDE_FOE)
	a.instance.status_id = StatusIds.PARA
	var sim := BattleSim.new()
	sim.setup(a, f, 1)
	sim.register_move(hit)
	assert_lt(sim.effective_spe(a), sim.effective_spe(f))
	var events: Array = sim.step(BattleAction.fight(&"hit"), BattleAction.fight(&"hit"))
	var first: BattleEvent = BattleFix.first_event(events, BattleEvent.MOVE_USED)
	assert_not_null(first)
	assert_eq(str(first.payload.get("side", "")), "foe")


func test_full_para_chance_is_twenty_five() -> void:
	assert_eq(StatusIds.FULL_PARA_PCT, 25)
	var hits: int = 0
	var rng := BattleRng.new(7)
	for i in 400:
		if rng.chance_pct(StatusIds.FULL_PARA_PCT):
			hits += 1
	assert_gt(hits, 60)
	assert_lt(hits, 140)


func test_full_para_can_skip_a_fight() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 200, 40, 40, 40, 200)
	var hit := BattleFix.move("hit", "pulse", "physical", 40)
	var saw := false
	for seed in range(1, 60):
		var a := BattleFix.battler(spec, 30, BattleSim.SIDE_ALLY)
		var f := BattleFix.battler(spec, 30, BattleSim.SIDE_FOE)
		a.instance.status_id = StatusIds.PARA
		var sim := BattleSim.new()
		sim.setup(a, f, seed)
		sim.register_move(hit)
		var events: Array = sim.step(BattleAction.fight(&"hit"), BattleAction.wait_action())
		if BattleFix.has_event(events, BattleEvent.FULL_PARA):
			saw = true
			assert_false(BattleFix.has_event(events, BattleEvent.DAMAGE))
			break
	assert_true(saw, "some seed must full-para")


func test_cannot_stack_major_status() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var a := BattleFix.battler(spec, 20, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(spec, 20, BattleSim.SIDE_FOE)
	f.instance.status_id = StatusIds.BURN
	var sim := BattleSim.new()
	sim.setup(a, f, 1)
	var events: Array = []
	var ok: bool = sim.try_inflict(f, StatusIds.POISON, events)
	assert_false(ok)
	assert_eq(f.instance.status_id, StatusIds.BURN)


func test_accuracy_always_hits_at_one_hundred() -> void:
	assert_eq(StatusIds.FULL_PARA_PCT, 25)
	var spec := BattleFix.species("x", ["pulse"], 80, 80, 80, 80, 80, 80)
	var hit := BattleFix.move("hit", "pulse", "physical", 40, {"accuracy": 100})
	var sim := BattleSim.new()
	sim.setup(BattleFix.battler(spec, 20, BattleSim.SIDE_ALLY), BattleFix.battler(spec, 20, BattleSim.SIDE_FOE), 4)
	sim.register_move(hit)
	var events: Array = sim.step(BattleAction.fight(&"hit"), BattleAction.wait_action())
	assert_true(BattleFix.has_event(events, BattleEvent.DAMAGE))
	assert_false(BattleFix.has_event(events, BattleEvent.MISS))
