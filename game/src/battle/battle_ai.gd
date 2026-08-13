class_name BattleAI
extends RefCounted
## Data profiles. Own RNG so picks do not desync a seeded replay.

const RANDOM := &"random"
const TYPE_AWARE := &"type_aware"

var rng: BattleRng


func _init(p_seed: int = 1) -> void:
	rng = BattleRng.new(p_seed)


func choose(sim: BattleSim, side_id: StringName, profile: StringName = RANDOM) -> BattleAction:
	var me: Battler = sim.side_by_id(side_id).active() if sim.side_by_id(side_id) else null
	if me == null or me.fainted:
		return BattleAction.wait_action()
	var ids: Array = me.move_ids()
	if ids.is_empty():
		return BattleAction.wait_action()
	if profile == TYPE_AWARE:
		return _type_aware(sim, me, ids)
	return BattleAction.fight(ids[rng.next_int(ids.size())])


func _type_aware(sim: BattleSim, me: Battler, ids: Array) -> BattleAction:
	var them_side: Side = sim.other_side(me.side_id)
	var them: Battler = them_side.active() if them_side else null
	var best_id: StringName = ids[0]
	var best: float = -1.0
	for raw in ids:
		var mid: StringName = raw
		var mv: MoveSpec = sim.find_move(me, mid)
		var score: float = 0.1
		if mv != null and mv.power > 0 and them != null and not them.fainted:
			var typ: float = sim.chart.vs(mv.type_id, them.species.types)
			var stab: float = Damage.stab_for(mv.type_id, me.species.types)
			var field_m: float = sim.field.type_mod(mv.type_id) if sim.field else 1.0
			score = typ * float(mv.power) * stab * field_m
		if score > best:
			best = score
			best_id = mid
	return BattleAction.fight(best_id)
