class_name HaleAnalogue
extends RefCounted
## Scripted Inspector Hale analogue: Reedwalk hydrologist. Winnable and losable.

const WIN_SCRIPT := &"dry_pan"
const LOSE_SCRIPT := &"stall"


static func make_sim(p_seed: int = 1) -> BattleSim:
	var player := _player()
	var lead := _mud_lead()
	var ace := _ace()
	var sim := BattleSim.new()
	sim.setup_parties(
		[player],
		[lead, ace],
		p_seed,
		null,
		&"reedwalk",
		BattleRules.trainer()
	)
	return sim


static func player_action(script: StringName) -> BattleAction:
	if script == LOSE_SCRIPT:
		return BattleAction.wait_action()
	return BattleAction.fight(&"ember_spit")


static func play(script: StringName, p_seed: int = 1) -> BattleSim:
	var sim: BattleSim = make_sim(p_seed)
	var ai := BattleAI.new(p_seed + 17)
	var guard: int = 0
	while not sim.is_over() and guard < 60:
		var pact: BattleAction = player_action(script)
		var fact: BattleAction = ai.choose(sim, BattleSim.SIDE_FOE, BattleAI.TYPE_AWARE)
		sim.step(pact, fact)
		guard += 1
	return sim


static func _player() -> Battler:
	var spec := EchoSpecies.from_dict({
		"id": "cinder_practice",
		"display_name": "Cinder Practice",
		"types": ["ember"],
		"base_stats": {"hp": 70, "atk": 40, "def": 55, "spa": 95, "spd": 55, "spe": 70},
		"abilities": ["dry_kindle"],
		"learnset": [],
	})
	var inst := EchoInstance.from_species(spec, 18, &"keen")
	inst.scars = StatBlock.new(31, 31, 31, 31, 31, 31)
	inst.ability_id = &"dry_kindle"
	inst.moves = [{"id": "ember_spit", "pp": -1}]
	inst.current_hp = inst.computed_stats(spec).hp
	return Battler.from_instance(inst, spec, BattleSim.SIDE_ALLY)


static func _mud_lead() -> Battler:
	## Fast bloom that only knows a Tide slap — sets mud, dies to Ember.
	var spec := EchoSpecies.from_dict({
		"id": "rillick",
		"display_name": "Rillick",
		"types": ["bloom"],
		"base_stats": {"hp": 45, "atk": 40, "def": 40, "spd": 40, "spa": 40, "spe": 120},
		"abilities": ["swift_current"],
		"learnset": [],
	})
	var inst := EchoInstance.from_species(spec, 15, &"swift")
	inst.scars = StatBlock.new(31, 31, 31, 31, 31, 31)
	inst.ability_id = &"swift_current"
	inst.moves = [{"id": "tide_slap", "pp": -1}]
	inst.current_hp = inst.computed_stats(spec).hp
	return Battler.from_instance(inst, spec, BattleSim.SIDE_FOE, 0)


static func _ace() -> Battler:
	var spec: EchoSpecies = null
	if DataRegistry != null and DataRegistry.has_species(&"brackon"):
		spec = DataRegistry.get_species(&"brackon")
	if spec == null:
		spec = EchoSpecies.from_dict({
			"id": "brackon",
			"display_name": "Brackon",
			"types": ["tide", "bloom"],
			"base_stats": {"hp": 62, "atk": 58, "def": 55, "spa": 72, "spd": 58, "spe": 48},
			"abilities": ["reed_spine"],
			"learnset": [],
		})
	var inst := EchoInstance.from_species(spec, 13, &"keen")
	inst.scars = StatBlock.new(31, 31, 31, 31, 31, 31)
	inst.ability_id = &"reed_spine"
	inst.moves = [
		{"id": "bloom_lash", "pp": -1},
		{"id": "tide_slap", "pp": -1},
	]
	inst.current_hp = inst.computed_stats(spec).hp
	return Battler.from_instance(inst, spec, BattleSim.SIDE_FOE, 1)
