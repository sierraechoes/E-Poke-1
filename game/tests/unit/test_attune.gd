extends GutTest


func test_healthier_is_easier() -> void:
	var full: float = Attune.hp_term(100, 100)
	var low: float = Attune.hp_term(1, 100)
	assert_gt(full, low)
	var a_full: int = Attune.score(200, false, 1.0, Attune.APPROACH, 1.0, 100, 100)
	var a_low: int = Attune.score(200, false, 1.0, Attune.APPROACH, 1.0, 1, 100)
	assert_gt(a_full, a_low)


func test_harm_makes_attune_harder() -> void:
	var kind: int = Attune.score(180, false, 1.0, Attune.APPROACH, 1.0, 80, 80)
	var hurt: int = Attune.score(180, true, 1.0, Attune.APPROACH, 1.0, 80, 80)
	assert_gt(kind, hurt)


func test_force_is_easier_and_cuts_bond_cap() -> void:
	assert_gt(Attune.approach_mod(Attune.FORCE), Attune.approach_mod(Attune.APPROACH))
	var inst := EchoInstance.new()
	inst.bond_cap = 100
	inst.bond = 90
	Attune.apply_force_bond(inst)
	assert_eq(inst.bond_cap, 70)
	assert_eq(inst.bond, 70)


func test_field_compat_from_habitat() -> void:
	var spec := EchoSpecies.from_dict({
		"id": "x",
		"types": ["bloom"],
		"base_stats": {"hp": 40, "atk": 40, "def": 40, "spa": 40, "spd": 40, "spe": 40},
		"habitat_tags": ["reedwalk"],
	})
	assert_eq(Attune.field_compat(spec, &"reedwalk"), 1.25)
	assert_eq(Attune.field_compat(spec, &"dry_pan"), 1.0)
	spec.habitat_tags = [&"hostile_reedwalk"]
	assert_eq(Attune.field_compat(spec, &"reedwalk"), 0.75)


func test_attune_succeeds_on_healthy_high_rate() -> void:
	var wild_s := BattleFix.species("easy", ["pulse"], 40, 20, 20, 20, 20, 20)
	wild_s.attune_rate = 255
	var me_s := BattleFix.species("me", ["pulse"], 80, 40, 40, 40, 40, 40)
	var ok := false
	for seed in range(1, 8):
		var sim := BattleSim.new()
		sim.setup(BattleFix.battler(me_s, 10, BattleSim.SIDE_ALLY), BattleFix.battler(wild_s, 5, BattleSim.SIDE_FOE), seed)
		var events: Array = sim.step(BattleAction.attune(Attune.HARMONIZE), BattleAction.wait_action())
		if BattleFix.has_event(events, BattleEvent.ATTUNE_SUCCESS):
			ok = true
			assert_true(sim.is_over())
			assert_eq(sim.outcome, BattleSim.OUTCOME_ATTUNED)
			assert_eq(sim.winner, BattleSim.SIDE_ALLY)
			break
	assert_true(ok)


func test_attune_forbidden_in_trainer_battle() -> void:
	var spec := BattleFix.species("x", ["pulse"], 40, 40, 40, 40, 40, 40)
	var sim := BattleSim.new()
	sim.setup_parties(
		[BattleFix.battler(spec, 10, BattleSim.SIDE_ALLY)],
		[BattleFix.battler(spec, 10, BattleSim.SIDE_FOE)],
		1, null, &"", BattleRules.trainer()
	)
	var events: Array = sim.step(BattleAction.attune(Attune.APPROACH), BattleAction.wait_action())
	assert_true(BattleFix.has_event(events, BattleEvent.ATTUNE_FAIL))
	assert_false(sim.is_over())


func test_tuning_resin_raises_score() -> void:
	var base: int = Attune.score(100, false, 1.0, Attune.APPROACH, 1.0, 50, 50)
	var aided: int = Attune.score(100, false, 1.0, Attune.APPROACH, 1.25, 50, 50)
	assert_gt(aided, base)


func test_force_fail_can_make_wild_flee() -> void:
	var wild_s := BattleFix.species("skittish", ["pulse"], 40, 20, 20, 20, 20, 20)
	wild_s.attune_rate = 1
	var me_s := BattleFix.species("me", ["pulse"], 80, 40, 40, 40, 40, 40)
	var fled := false
	var agitated := false
	for seed in range(1, 40):
		var sim := BattleSim.new()
		sim.setup(BattleFix.battler(me_s, 10, BattleSim.SIDE_ALLY), BattleFix.battler(wild_s, 5, BattleSim.SIDE_FOE), seed)
		var events: Array = sim.step(BattleAction.attune(Attune.FORCE), BattleAction.wait_action())
		if BattleFix.has_event(events, BattleEvent.ATTUNE_SUCCESS):
			continue
		var ev: BattleEvent = BattleFix.first_event(events, BattleEvent.ATTUNE_FAIL)
		if ev == null:
			continue
		if str(ev.payload.get("reason", "")) == "wild_fled":
			fled = true
			assert_eq(sim.outcome, BattleSim.OUTCOME_WILD_FLED)
		if str(ev.payload.get("reason", "")) == "agitated":
			agitated = true
	assert_true(fled or agitated)
