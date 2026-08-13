class_name EchoInstance
extends RefCounted
## A living Echo: species template + scars, training, bond, moves.

const MOVE_SLOTS := 4

var species_id: StringName = &""
var nickname: String = ""
var level: int = 5
var exp: int = 0
var scars: StatBlock
var training: StatBlock
var temper_id: StringName = &"even"
var ability_id: StringName = &""
var moves: Array = [] ## [{id: StringName, pp: int}]
var bond: int = 50
var bond_cap: int = 100
var current_hp: int = 1
var status_id: StringName = &""
var held_item_id: StringName = &""
var origin: String = ""


func _init() -> void:
	scars = StatBlock.new()
	training = StatBlock.new()


static func from_species(species: EchoSpecies, p_level: int = 5, p_temper: StringName = &"even") -> EchoInstance:
	var inst := EchoInstance.new()
	inst.species_id = species.id
	inst.nickname = species.display_name
	inst.level = StatFormulas.clamp_level(p_level)
	inst.temper_id = p_temper if Temper.is_valid(p_temper) else &"even"
	if species.abilities.size() > 0:
		inst.ability_id = species.abilities[0]
	inst.scars = StatBlock.new(15, 15, 15, 15, 15, 15)
	inst.training = StatBlock.new()
	inst.moves = inst._default_moves(species)
	var stats := inst.computed_stats(species)
	inst.current_hp = stats.hp
	return inst


func computed_stats(species: EchoSpecies) -> StatBlock:
	return StatFormulas.compute(
		species.base_stats,
		scars,
		training,
		level,
		Temper.plus_of(temper_id),
		Temper.minus_of(temper_id)
	)


func to_dict() -> Dictionary:
	return {
		"species": String(species_id),
		"nickname": nickname,
		"level": level,
		"exp": exp,
		"scars": scars.to_dict() if scars else {},
		"training": training.to_dict() if training else {},
		"temper": String(temper_id),
		"ability": String(ability_id),
		"moves": moves.duplicate(true),
		"bond": bond,
		"bond_cap": bond_cap,
		"current_hp": current_hp,
		"status": String(status_id),
		"held": String(held_item_id),
		"origin": origin,
	}


static func from_dict(raw: Dictionary) -> EchoInstance:
	var inst := EchoInstance.new()
	inst.species_id = StringName(str(raw.get("species", "")))
	inst.nickname = str(raw.get("nickname", ""))
	inst.level = int(raw.get("level", 5))
	inst.exp = int(raw.get("exp", 0))
	inst.scars = StatBlock.from_dict(raw.get("scars", {}))
	inst.training = StatBlock.from_dict(raw.get("training", {}))
	inst.temper_id = StringName(str(raw.get("temper", "even")))
	inst.ability_id = StringName(str(raw.get("ability", "")))
	inst.moves = raw.get("moves", []).duplicate(true)
	inst.bond = int(raw.get("bond", 50))
	inst.bond_cap = int(raw.get("bond_cap", 100))
	inst.current_hp = int(raw.get("current_hp", 1))
	inst.status_id = StringName(str(raw.get("status", "")))
	inst.held_item_id = StringName(str(raw.get("held", "")))
	inst.origin = str(raw.get("origin", ""))
	return inst


func _default_moves(species: EchoSpecies) -> Array:
	var learned: Array = []
	var entries: Array[LearnsetEntry] = species.learnset.duplicate()
	entries.sort_custom(func(a: LearnsetEntry, b: LearnsetEntry) -> bool: return a.level < b.level)
	for e in entries:
		if e.level <= level:
			learned.append({"id": String(e.move_id), "pp": -1})
	if learned.size() > MOVE_SLOTS:
		learned = learned.slice(learned.size() - MOVE_SLOTS)
	return learned
