class_name FieldRuntime
extends RefCounted
## Reedwalk ↔ Dry Pan plus data-driven type mods.

const REEDWALK := &"reedwalk"
const DRY_PAN := &"dry_pan"

var field_id: StringName = &""
var spec: FieldSpec


func type_mod(type_id: StringName) -> float:
	if spec != null:
		var key_hit: bool = spec.type_mods.has(type_id) or spec.type_mods.has(String(type_id))
		if key_hit:
			return spec.type_mod(type_id)
	return _locked_mod(field_id, type_id)


func on_move_hit(sim: BattleSim, _user: Battler, target: Battler, move: MoveSpec, dealt: int, events: Array) -> void:
	if move == null or target == null:
		return
	var side: Side = sim.side_of(target)
	if side == null:
		return
	if field_id == REEDWALK:
		if move.type_id == &"tide":
			side.mud_turns = StatusIds.MUD_TURNS
			events.append(BattleEvent.make(BattleEvent.MUD, {
				"side": String(side.id),
				"turns": side.mud_turns,
				"op": "apply",
			}))
		if move.type_id == &"ember" and _any_mud(sim):
			_clear_mud(sim)
			_transition(sim, DRY_PAN, events)
	elif field_id == DRY_PAN:
		if move.type_id == &"tide" and dealt > 0 and sim.rng.chance_pct(30):
			_transition(sim, REEDWALK, events)


func _any_mud(sim: BattleSim) -> bool:
	return (sim.ally != null and sim.ally.mud_turns > 0) or (sim.foe != null and sim.foe.mud_turns > 0)


func _clear_mud(sim: BattleSim) -> void:
	if sim.ally:
		sim.ally.mud_turns = 0
	if sim.foe:
		sim.foe.mud_turns = 0


func _transition(sim: BattleSim, to: StringName, events: Array) -> void:
	var prev: StringName = field_id
	field_id = to
	sim.field_id = to
	spec = sim.lookup_field(to)
	events.append(BattleEvent.make(BattleEvent.FIELD_CHANGE, {
		"from": String(prev),
		"to": String(to),
	}))


static func _locked_mod(fid: StringName, type_id: StringName) -> float:
	if fid == REEDWALK and type_id == &"bloom":
		return 1.3
	if fid == DRY_PAN:
		if type_id == &"ember":
			return 1.3
		if type_id == &"tide":
			return 0.7
		if type_id == &"bloom":
			return 0.85
	return 1.0
