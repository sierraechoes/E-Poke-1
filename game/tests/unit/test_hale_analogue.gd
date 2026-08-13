extends GutTest


func test_hale_is_winnable_by_drying_the_pan() -> void:
	DataRegistry.reload()
	var sim: BattleSim = HaleAnalogue.play(HaleAnalogue.WIN_SCRIPT, 3)
	assert_true(sim.is_over())
	assert_eq(sim.winner, BattleSim.SIDE_ALLY)
	assert_lt(sim.turn, 40)


func test_hale_is_losable_if_you_stall() -> void:
	DataRegistry.reload()
	var sim: BattleSim = HaleAnalogue.play(HaleAnalogue.LOSE_SCRIPT, 3)
	assert_true(sim.is_over())
	assert_eq(sim.winner, BattleSim.SIDE_FOE)


func test_win_and_lose_are_stable_across_seeds() -> void:
	DataRegistry.reload()
	for seed in [1, 2, 5, 9]:
		var win: BattleSim = HaleAnalogue.play(HaleAnalogue.WIN_SCRIPT, seed)
		var lose: BattleSim = HaleAnalogue.play(HaleAnalogue.LOSE_SCRIPT, seed)
		assert_eq(win.winner, BattleSim.SIDE_ALLY, "win seed %d" % seed)
		assert_eq(lose.winner, BattleSim.SIDE_FOE, "lose seed %d" % seed)


func test_win_script_bakes_the_field() -> void:
	DataRegistry.reload()
	var sim: BattleSim = HaleAnalogue.make_sim(1)
	var ai := BattleAI.new(18)
	var saw_dry := false
	var guard: int = 0
	while not sim.is_over() and guard < 20:
		sim.step(HaleAnalogue.player_action(HaleAnalogue.WIN_SCRIPT), ai.choose(sim, BattleSim.SIDE_FOE, BattleAI.TYPE_AWARE))
		if String(sim.field_id) == "dry_pan":
			saw_dry = true
			break
		guard += 1
	assert_true(saw_dry)
