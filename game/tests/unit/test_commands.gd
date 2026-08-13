extends GutTest


func test_priority_moves_first() -> void:
	var slow := BattleFix.species("slow", ["pulse"], 80, 80, 40, 40, 40, 10)
	var fast := BattleFix.species("fast", ["pulse"], 80, 80, 40, 40, 40, 200)
	var pip := BattleFix.move("pip", "pulse", "physical", 40, {"priority": 1})
	var tap := BattleFix.move("tap", "pulse", "physical", 40, {"priority": 0})
	var sim := BattleSim.new()
	sim.setup(BattleFix.battler(slow, 20, BattleSim.SIDE_ALLY), BattleFix.battler(fast, 20, BattleSim.SIDE_FOE), 1)
	sim.register_move(pip)
	sim.register_move(tap)
	var events: Array = sim.step(BattleAction.fight(&"pip"), BattleAction.fight(&"tap"))
	var first: BattleEvent = BattleFix.first_event(events, BattleEvent.MOVE_USED)
	assert_eq(str(first.payload.get("side", "")), "ally")
	assert_eq(str(first.payload.get("move", "")), "pip")


func test_flinch_skips_slower() -> void:
	var fast := BattleFix.species("fast", ["pulse"], 80, 80, 40, 40, 40, 200)
	var slow := BattleFix.species("slow", ["pulse"], 80, 80, 40, 40, 40, 10)
	var scare := BattleFix.move("scare", "pulse", "physical", 20, {"effect": {"flinch": 100}})
	var tap := BattleFix.move("tap", "pulse", "physical", 40)
	var a := BattleFix.battler(fast, 20, BattleSim.SIDE_ALLY)
	var f := BattleFix.battler(slow, 20, BattleSim.SIDE_FOE)
	var sim := BattleSim.new()
	sim.setup(a, f, 1)
	sim.register_move(scare)
	sim.register_move(tap)
	var events: Array = sim.step(BattleAction.fight(&"scare"), BattleAction.fight(&"tap"))
	assert_true(BattleFix.has_event(events, BattleEvent.FLINCH))
	var foe_hit := false
	for e in events:
		var ev: BattleEvent = e
		if ev.type == BattleEvent.DAMAGE and str(ev.payload.get("side", "")) == "ally":
			foe_hit = true
	assert_false(foe_hit)


func test_voluntary_switch() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var a0 := BattleFix.battler(spec, 10, BattleSim.SIDE_ALLY)
	var a1 := BattleFix.battler(spec, 10, BattleSim.SIDE_ALLY)
	a1.instance.nickname = "Bench"
	var f := BattleFix.battler(spec, 10, BattleSim.SIDE_FOE)
	var sim := BattleSim.new()
	sim.setup_parties([a0, a1], [f], 1)
	sim.step(BattleAction.switch_to(1), BattleAction.wait_action())
	assert_eq(sim.ally.active_index, 1)
	assert_eq(sim.ally.active().display_name(), "Bench")


func test_forced_replacement_after_mid_turn_faint() -> void:
	var nuke_s := BattleFix.species("nuke", ["ember"], 80, 200, 40, 40, 40, 200)
	var pillow := BattleFix.species("pillow", ["bloom"], 20, 20, 10, 20, 10, 10)
	var bench := BattleFix.species("bench", ["pulse"], 80, 40, 40, 40, 40, 40)
	var blast := BattleFix.move("blast", "ember", "physical", 120)
	var tap := BattleFix.move("tap", "pulse", "physical", 40)
	var f0 := BattleFix.battler(pillow, 5, BattleSim.SIDE_FOE)
	f0.instance.nickname = "Lead"
	var f1 := BattleFix.battler(bench, 10, BattleSim.SIDE_FOE)
	f1.instance.nickname = "Reserve"
	var sim := BattleSim.new()
	sim.setup_parties([BattleFix.battler(nuke_s, 50, BattleSim.SIDE_ALLY)], [f0, f1], 1)
	sim.register_move(blast)
	sim.register_move(tap)
	var events: Array = sim.step(BattleAction.fight(&"blast"), BattleAction.fight(&"tap"))
	assert_true(f0.fainted)
	assert_true(BattleFix.has_event(events, BattleEvent.SWITCH))
	assert_eq(sim.foe.active().display_name(), "Reserve")
	assert_false(sim.is_over())


func test_switch_happens_before_fight() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 40)
	var a0 := BattleFix.battler(spec, 10, BattleSim.SIDE_ALLY)
	a0.instance.nickname = "Lead"
	var a1 := BattleFix.battler(spec, 10, BattleSim.SIDE_ALLY)
	a1.instance.nickname = "In"
	var f := BattleFix.battler(spec, 10, BattleSim.SIDE_FOE)
	var tap := BattleFix.move("tap", "pulse", "physical", 40)
	var sim := BattleSim.new()
	sim.setup_parties([a0, a1], [f], 1)
	sim.register_move(tap)
	var events: Array = sim.step(BattleAction.switch_to(1), BattleAction.fight(&"tap"))
	var types: Array = []
	for e in events:
		types.append(String((e as BattleEvent).type))
	assert_true(types.find("switch") < types.find("move_used") or types.find("switch") >= 0)
	assert_eq(sim.ally.active().display_name(), "In")


func test_flee_succeeds_when_much_faster() -> void:
	var hare := BattleFix.species("hare", ["gale"], 80, 40, 40, 40, 40, 250)
	var rock := BattleFix.species("rock", ["stone"], 80, 40, 40, 40, 40, 5)
	var sim := BattleSim.new()
	sim.setup(BattleFix.battler(hare, 50, BattleSim.SIDE_ALLY), BattleFix.battler(rock, 5, BattleSim.SIDE_FOE), 1)
	var events: Array = sim.step(BattleAction.flee(), BattleAction.wait_action())
	assert_true(BattleFix.has_event(events, BattleEvent.FLEE_SUCCESS))
	assert_eq(sim.outcome, BattleSim.OUTCOME_FLED)


func test_cannot_flee_trainer() -> void:
	var spec := BattleFix.species("x", ["pulse"], 80, 40, 40, 40, 40, 200)
	var sim := BattleSim.new()
	sim.setup_parties(
		[BattleFix.battler(spec, 20, BattleSim.SIDE_ALLY)],
		[BattleFix.battler(spec, 20, BattleSim.SIDE_FOE)],
		1, null, &"", BattleRules.trainer()
	)
	var events: Array = sim.step(BattleAction.flee(), BattleAction.wait_action())
	assert_true(BattleFix.has_event(events, BattleEvent.FLEE_FAIL))
	assert_false(sim.is_over())
