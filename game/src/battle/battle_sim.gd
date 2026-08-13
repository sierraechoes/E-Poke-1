class_name BattleSim
extends RefCounted
## Headless singles kernel. No nodes. Deterministic with a seed.

const SIDE_ALLY := &"ally"
const SIDE_FOE := &"foe"

var rng: BattleRng
var chart: TypeChart
var ally: Side
var foe: Side
var field_id: StringName = &""
var turn: int = 0
var over: bool = false
var winner: StringName = &""
var _pending: Dictionary = {}
var log: Array = [] ## Array[BattleEvent] this battle
var move_book: Dictionary = {} ## StringName -> MoveSpec, test/injection overlay


func setup(p_ally: Battler, p_foe: Battler, p_seed: int = 1, p_chart: TypeChart = null, p_field: StringName = &"") -> void:
	rng = BattleRng.new(p_seed)
	chart = p_chart if p_chart != null else TypeChart.from_locked_table()
	ally = Side.new()
	ally.id = SIDE_ALLY
	ally.battlers = [p_ally]
	p_ally.side_id = SIDE_ALLY
	foe = Side.new()
	foe.id = SIDE_FOE
	foe.battlers = [p_foe]
	p_foe.side_id = SIDE_FOE
	field_id = p_field
	turn = 0
	over = false
	winner = &""
	_pending.clear()
	log.clear()
	_check_over()


func is_over() -> bool:
	return over


func snapshot() -> Dictionary:
	return {
		"turn": turn,
		"over": over,
		"winner": String(winner),
		"field": String(field_id),
		"ally": _snap_battler(ally.active() if ally else null),
		"foe": _snap_battler(foe.active() if foe else null),
		"seed": rng.seed_value if rng else 0,
		"rng_calls": rng.call_count if rng else 0,
	}


func choose(side_id: StringName, action: BattleAction) -> void:
	_pending[side_id] = action


func step(ally_action: BattleAction, foe_action: BattleAction) -> Array:
	choose(SIDE_ALLY, ally_action)
	choose(SIDE_FOE, foe_action)
	return resolve()


func resolve() -> Array:
	var events: Array = []
	if over:
		return events
	if not _pending.has(SIDE_ALLY) or not _pending.has(SIDE_FOE):
		return events
	turn += 1
	var order: Array = _turn_order()
	for bat in order:
		var b: Battler = bat
		if over:
			break
		if b.fainted:
			events.append(BattleEvent.make(BattleEvent.SKIP, {
				"side": String(b.side_id),
				"reason": "fainted",
			}))
			continue
		var act: BattleAction = _pending.get(b.side_id)
		if act == null or act.kind != BattleAction.KIND_FIGHT:
			events.append(BattleEvent.make(BattleEvent.SKIP, {
				"side": String(b.side_id),
				"reason": "no_fight",
			}))
			continue
		events.append_array(_execute_move(b, act))
		_check_over()
	events.append(BattleEvent.make(BattleEvent.TURN_END, {"turn": turn}))
	if over:
		events.append(BattleEvent.make(BattleEvent.BATTLE_OVER, {"winner": String(winner)}))
	_pending.clear()
	log.append_array(events)
	return events


func _turn_order() -> Array:
	var a: Battler = ally.active()
	var f: Battler = foe.active()
	var pair: Array = []
	if a:
		pair.append(a)
	if f:
		pair.append(f)
	if pair.size() < 2:
		return pair
	var ba: Battler = pair[0]
	var bf: Battler = pair[1]
	if ba.stats.spe > bf.stats.spe:
		return [ba, bf]
	if bf.stats.spe > ba.stats.spe:
		return [bf, ba]
	if rng.next_bool():
		return [ba, bf]
	return [bf, ba]


func _execute_move(user: Battler, act: BattleAction) -> Array:
	var events: Array = []
	var move: MoveSpec = _find_move(user, act.move_id)
	events.append(BattleEvent.make(BattleEvent.MOVE_USED, {
		"side": String(user.side_id),
		"user": user.display_name(),
		"move": String(act.move_id),
	}))
	if move == null:
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(user.side_id),
			"reason": "unknown_move",
		}))
		return events
	var target: Battler = foe.active() if user.side_id == SIDE_ALLY else ally.active()
	if target == null or target.fainted:
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(user.side_id),
			"reason": "no_target",
		}))
		return events
	if move.category == &"status" or move.power <= 0:
		return events
	var atk_stat: int = user.stats.atk if move.category == &"physical" else user.stats.spa
	var def_stat: int = target.stats.def if move.category == &"physical" else target.stats.spd
	var stab: float = Damage.stab_for(move.type_id, user.species.types)
	var type_m: float = chart.vs(move.type_id, target.species.types)
	var burn: float = Damage.burn_for(user.is_burned(), move.category)
	var roll: float = rng.damage_roll()
	var dmg: int = Damage.calc(
		user.instance.level,
		move.power,
		atk_stat,
		def_stat,
		stab,
		type_m,
		1.0,
		roll,
		burn
	)
	var dealt: int = target.apply_damage(dmg)
	events.append(BattleEvent.make(BattleEvent.DAMAGE, {
		"side": String(target.side_id),
		"target": target.display_name(),
		"amount": dealt,
		"type_mult": type_m,
		"stab": stab,
		"burn": burn,
		"roll": roll,
		"effective": type_m,
	}))
	if target.fainted:
		events.append(BattleEvent.make(BattleEvent.FAINT, {
			"side": String(target.side_id),
			"target": target.display_name(),
		}))
	return events


func register_move(move: MoveSpec) -> void:
	move_book[move.id] = move


func _find_move(_user: Battler, move_id: StringName) -> MoveSpec:
	if move_book.has(move_id):
		return move_book[move_id]
	if DataRegistry != null and DataRegistry.has_move(move_id):
		return DataRegistry.get_move(move_id)
	return null


func _check_over() -> void:
	var a_dead: bool = ally == null or ally.all_fainted()
	var f_dead: bool = foe == null or foe.all_fainted()
	if a_dead and f_dead:
		over = true
		winner = &"draw"
	elif a_dead:
		over = true
		winner = SIDE_FOE
	elif f_dead:
		over = true
		winner = SIDE_ALLY


func _snap_battler(b: Battler) -> Dictionary:
	if b == null:
		return {}
	return {
		"name": b.display_name(),
		"species": String(b.species.id),
		"hp": b.hp(),
		"max_hp": b.max_hp(),
		"spe": b.stats.spe,
		"fainted": b.fainted,
		"status": String(b.instance.status_id),
	}
