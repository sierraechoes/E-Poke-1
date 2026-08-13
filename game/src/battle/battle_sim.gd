class_name BattleSim
extends RefCounted
## Headless singles kernel. No nodes. Deterministic with a seed.

const SIDE_ALLY := &"ally"
const SIDE_FOE := &"foe"
const TURN_CAP := 200

const OUTCOME_KO := &"ko"
const OUTCOME_DRAW := &"draw"
const OUTCOME_FLED := &"fled"
const OUTCOME_ATTUNED := &"attuned"
const OUTCOME_WILD_FLED := &"wild_fled"

var rng: BattleRng
var chart: TypeChart
var ally: Side
var foe: Side
var field_id: StringName = &""
var field: FieldRuntime
var rules: BattleRules
var catalog: AbilityCatalog
var turn: int = 0
var over: bool = false
var winner: StringName = &""
var outcome: StringName = &""
var flee_attempts: int = 0
var attuned_instance: EchoInstance
var _pending: Dictionary = {}
var _awaiting: Dictionary = {}
var bags: Dictionary = {}
var log: Array = []
var move_book: Dictionary = {}
var item_book: Dictionary = {}


func setup(p_ally: Battler, p_foe: Battler, p_seed: int = 1, p_chart: TypeChart = null, p_field: StringName = &"") -> void:
	setup_parties([p_ally], [p_foe], p_seed, p_chart, p_field, BattleRules.wild())


func setup_parties(
		allies: Array,
		foes: Array,
		p_seed: int = 1,
		p_chart: TypeChart = null,
		p_field: StringName = &"",
		p_rules: BattleRules = null
	) -> void:
	rng = BattleRng.new(p_seed)
	chart = p_chart if p_chart != null else TypeChart.from_locked_table()
	rules = p_rules if p_rules != null else BattleRules.wild()
	catalog = AbilityCatalog.new()
	field = FieldRuntime.new()
	field.field_id = p_field
	field_id = p_field
	field.spec = lookup_field(p_field)
	ally = Side.new()
	ally.id = SIDE_ALLY
	foe = Side.new()
	foe.id = SIDE_FOE
	_fill_side(ally, allies)
	_fill_side(foe, foes)
	turn = 0
	over = false
	winner = &""
	outcome = &""
	flee_attempts = 0
	attuned_instance = null
	_pending.clear()
	_awaiting.clear()
	bags = {SIDE_ALLY: {}, SIDE_FOE: {}}
	log.clear()
	_check_over()
	if not over:
		var opening: Array = []
		var a: Battler = ally.active()
		var f: Battler = foe.active()
		if a and not a.fainted:
			_dispatch(AbilityHandler.EVT_SWITCH_IN, a, {"events": opening})
		if f and not f.fainted:
			_dispatch(AbilityHandler.EVT_SWITCH_IN, f, {"events": opening})
		log.append_array(opening)


func is_over() -> bool:
	return over


func is_awaiting_replace() -> bool:
	return not _awaiting.is_empty()


func side_by_id(side_id: StringName) -> Side:
	if side_id == SIDE_ALLY:
		return ally
	return foe


func side_of(b: Battler) -> Side:
	if b == null:
		return null
	return ally if b.side_id == SIDE_ALLY else foe


func other_side(side_id: StringName) -> Side:
	return foe if side_id == SIDE_ALLY else ally


func lookup_field(id: StringName) -> FieldSpec:
	if id == &"":
		return null
	if DataRegistry != null and DataRegistry.has_field(id):
		return DataRegistry.get_field(id)
	return null


func add_item(side_id: StringName, item_id: StringName, n: int = 1) -> void:
	if not bags.has(side_id):
		bags[side_id] = {}
	var bag: Dictionary = bags[side_id]
	bag[item_id] = int(bag.get(item_id, 0)) + n


func item_count(side_id: StringName, item_id: StringName) -> int:
	if not bags.has(side_id):
		return 0
	return int(bags[side_id].get(item_id, 0))


func register_move(move: MoveSpec) -> void:
	move_book[move.id] = move


func register_item(item: ItemSpec) -> void:
	item_book[item.id] = item


func find_move(_user: Battler, move_id: StringName) -> MoveSpec:
	if move_book.has(move_id):
		return move_book[move_id]
	if DataRegistry != null and DataRegistry.has_move(move_id):
		return DataRegistry.get_move(move_id)
	return null


func find_item(item_id: StringName) -> ItemSpec:
	if item_book.has(item_id):
		return item_book[item_id]
	if DataRegistry != null and DataRegistry.has_item(item_id):
		return DataRegistry.get_item(item_id)
	return null


func snapshot() -> Dictionary:
	return {
		"turn": turn,
		"over": over,
		"winner": String(winner),
		"outcome": String(outcome),
		"field": String(field_id),
		"ally": _snap_battler(ally.active() if ally else null),
		"foe": _snap_battler(foe.active() if foe else null),
		"seed": rng.seed_value if rng else 0,
		"rng_calls": rng.call_count if rng else 0,
		"mud_ally": ally.mud_turns if ally else 0,
		"mud_foe": foe.mud_turns if foe else 0,
		"awaiting": _awaiting.keys(),
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
	if not _awaiting.is_empty():
		events.append_array(_resolve_replacements())
		_pending.clear()
		log.append_array(events)
		return events
	if not _pending.has(SIDE_ALLY) or not _pending.has(SIDE_FOE):
		return events
	turn += 1
	if turn > TURN_CAP:
		over = true
		winner = &"draw"
		outcome = OUTCOME_DRAW
		events.append(BattleEvent.make(BattleEvent.BATTLE_OVER, {"winner": "draw", "outcome": "draw"}))
		_pending.clear()
		log.append_array(events)
		return events
	events.append(BattleEvent.make(BattleEvent.TURN_START, {"turn": turn}))
	_clear_acted()
	var order: Array = _action_order()
	for entry in order:
		if over:
			break
		var b: Battler = entry["battler"]
		var act: BattleAction = entry["action"]
		if b == null or b.fainted:
			events.append(BattleEvent.make(BattleEvent.SKIP, {
				"side": String(b.side_id) if b else "",
				"reason": "fainted",
			}))
			continue
		if act == null:
			events.append(BattleEvent.make(BattleEvent.SKIP, {
				"side": String(b.side_id),
				"reason": "no_fight",
			}))
			continue
		match act.kind:
			BattleAction.KIND_SWITCH:
				events.append_array(_do_switch(b, act))
			BattleAction.KIND_ITEM:
				events.append_array(_do_item(b, act))
			BattleAction.KIND_FLEE:
				events.append_array(_do_flee(b))
			BattleAction.KIND_ATTUNE:
				events.append_array(_do_attune(b, act))
			BattleAction.KIND_FIGHT:
				if not _check_can_act(b, events):
					b.acted_this_turn = true
					continue
				b.acted_this_turn = true
				events.append_array(_do_fight(b, act))
			_:
				b.acted_this_turn = true
				events.append(BattleEvent.make(BattleEvent.SKIP, {
					"side": String(b.side_id),
					"reason": "no_fight",
				}))
		_check_over()
		events.append_array(_process_faints())
	if not over:
		events.append_array(_do_residuals())
		_check_over()
		events.append_array(_process_faints())
	_clear_flinch()
	events.append(BattleEvent.make(BattleEvent.TURN_END, {"turn": turn}))
	if over:
		events.append(BattleEvent.make(BattleEvent.BATTLE_OVER, {
			"winner": String(winner),
			"outcome": String(outcome),
		}))
	_pending.clear()
	log.append_array(events)
	return events


func try_inflict(target: Battler, status: StringName, events: Array, source: Battler = null) -> bool:
	if target == null or target.fainted:
		return false
	if target.has_status():
		return false
	if not StatusIds.is_major(status):
		return false
	var ctx := {
		"target": target,
		"status": status,
		"blocked": false,
		"source": source,
		"events": events,
	}
	_dispatch(AbilityHandler.EVT_TRY_STATUS, target, ctx)
	if source:
		_dispatch(AbilityHandler.EVT_TRY_STATUS, source, ctx)
	if bool(ctx.get("blocked", false)):
		events.append(BattleEvent.make(BattleEvent.STATUS_BLOCKED, {
			"side": String(target.side_id),
			"target": target.display_name(),
			"status": String(status),
		}))
		return false
	target.instance.status_id = status
	if status == StatusIds.SLEEP:
		target.sleep_turns = 1 + rng.next_int(3)
	events.append(BattleEvent.make(BattleEvent.STATUS_APPLIED, {
		"side": String(target.side_id),
		"target": target.display_name(),
		"status": String(status),
	}))
	return true


func effective_spe(b: Battler) -> int:
	if b == null or b.fainted:
		return 0
	var spe: float = float(b.stats.spe) * b.stages.multiplier(&"spe")
	if b.instance.status_id == StatusIds.PARA:
		spe *= StatusIds.PARA_SPEED
	var side: Side = side_of(b)
	if side != null and side.mud_turns > 0:
		spe *= StatusIds.MUD_SPEED
	var ctx := {"battler": b, "spe": spe}
	_dispatch(AbilityHandler.EVT_MODIFY_SPEED, b, ctx)
	return maxi(0, int(ctx["spe"]))


func _fill_side(side: Side, arr: Array) -> void:
	side.battlers = []
	var i: int = 0
	for raw in arr:
		var bat: Battler = raw
		bat.side_id = side.id
		bat.slot = i
		side.battlers.append(bat)
		i += 1
	var living: Array = side.living_indices()
	side.active_index = living[0] if not living.is_empty() else 0


func _dispatch(event: StringName, host: Battler, ctx: Dictionary) -> void:
	if catalog == null or host == null:
		return
	catalog.dispatch(event, host, ctx, self)


func _action_order() -> Array:
	var a: Battler = ally.active()
	var f: Battler = foe.active()
	var aa: BattleAction = _pending.get(SIDE_ALLY)
	var fa: BattleAction = _pending.get(SIDE_FOE)
	var ea := {"battler": a, "action": aa}
	var ef := {"battler": f, "action": fa}
	if a == null:
		return [ef]
	if f == null:
		return [ea]
	var ap: int = _action_priority(a, aa)
	var fp: int = _action_priority(f, fa)
	if ap != fp:
		return [ea, ef] if ap > fp else [ef, ea]
	var aspe: int = effective_spe(a)
	var fspe: int = effective_spe(f)
	if aspe != fspe:
		return [ea, ef] if aspe > fspe else [ef, ea]
	if rng.next_bool():
		return [ea, ef]
	return [ef, ea]


func _action_priority(b: Battler, act: BattleAction) -> int:
	if act == null:
		return -1000
	match act.kind:
		BattleAction.KIND_SWITCH:
			return 100
		BattleAction.KIND_ITEM:
			return 90
		BattleAction.KIND_FLEE, BattleAction.KIND_ATTUNE:
			return 80
		BattleAction.KIND_FIGHT:
			var m: MoveSpec = find_move(b, act.move_id)
			return m.priority if m else 0
		_:
			return -100


func _check_can_act(b: Battler, events: Array) -> bool:
	if bool(b.volatiles.get(StatusIds.VOL_FLINCH, false)):
		events.append(BattleEvent.make(BattleEvent.FLINCH, {
			"side": String(b.side_id),
			"target": b.display_name(),
		}))
		return false
	if b.instance.status_id == StatusIds.SLEEP:
		b.sleep_turns -= 1
		if b.sleep_turns < 0:
			b.instance.status_id = &""
			b.sleep_turns = 0
			events.append(BattleEvent.make(BattleEvent.WAKE, {
				"side": String(b.side_id),
				"target": b.display_name(),
			}))
			return true
		events.append(BattleEvent.make(BattleEvent.SLEEP, {
			"side": String(b.side_id),
			"target": b.display_name(),
			"left": b.sleep_turns,
		}))
		return false
	if b.instance.status_id == StatusIds.PARA:
		if rng.chance_pct(StatusIds.FULL_PARA_PCT):
			events.append(BattleEvent.make(BattleEvent.FULL_PARA, {
				"side": String(b.side_id),
				"target": b.display_name(),
			}))
			return false
	return true


func _do_fight(user: Battler, act: BattleAction) -> Array:
	var events: Array = []
	var move: MoveSpec = find_move(user, act.move_id)
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
	var target: Battler = other_side(user.side_id).active()
	if target == null or target.fainted:
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(user.side_id),
			"reason": "no_target",
		}))
		return events
	var before := {
		"user": user,
		"target": target,
		"move": move,
		"cancel": false,
		"events": events,
	}
	_dispatch(AbilityHandler.EVT_BEFORE_MOVE, user, before)
	if bool(before.get("cancel", false)):
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(user.side_id),
			"reason": "cancelled",
		}))
		return events
	if not _roll_hit(user, target, move):
		events.append(BattleEvent.make(BattleEvent.MISS, {
			"side": String(user.side_id),
			"user": user.display_name(),
			"move": String(move.id),
		}))
		return events
	var damaging: bool = move.category != &"status" and move.power > 0
	var dealt: int = 0
	if damaging:
		var dmg_events: Array = _deal_damage(user, target, move)
		events.append_array(dmg_events)
		for e in dmg_events:
			var ev: BattleEvent = e
			if ev.type == BattleEvent.DAMAGE:
				dealt = int(ev.payload.get("amount", 0))
	_apply_move_effect(user, target, move, events)
	if field:
		field.on_move_hit(self, user, target, move, dealt, events)
	return events


func _deal_damage(user: Battler, target: Battler, move: MoveSpec) -> Array:
	var events: Array = []
	var atk_stat: int = user.staged(&"atk") if move.category == &"physical" else user.staged(&"spa")
	var def_stat: int = target.staged(&"def") if move.category == &"physical" else target.staged(&"spd")
	var stab: float = Damage.stab_for(move.type_id, user.species.types)
	var type_m: float = chart.vs(move.type_id, target.species.types)
	var burn: float = Damage.burn_for(user.is_burned(), move.category)
	var field_m: float = field.type_mod(move.type_id) if field else 1.0
	var roll: float = rng.damage_roll()
	var ctx := {
		"user": user,
		"target": target,
		"move": move,
		"stab": stab,
		"type_mult": type_m,
		"burn": burn,
		"field": field_m,
		"other": 1.0,
		"crit": 1.0,
		"weather": 1.0,
		"events": events,
	}
	_dispatch(AbilityHandler.EVT_MODIFY_DAMAGE, user, ctx)
	_dispatch(AbilityHandler.EVT_MODIFY_DAMAGE, target, ctx)
	_maybe_berry(target, move, float(ctx["type_mult"]), ctx)
	var dmg: int = Damage.calc(
		user.instance.level,
		move.power,
		atk_stat,
		def_stat,
		float(ctx["stab"]),
		float(ctx["type_mult"]),
		float(ctx["crit"]),
		roll,
		float(ctx["burn"]),
		float(ctx["weather"]),
		float(ctx["field"]),
		float(ctx["other"])
	)
	var dealt: int = target.apply_damage(dmg)
	events.append(BattleEvent.make(BattleEvent.DAMAGE, {
		"side": String(target.side_id),
		"target": target.display_name(),
		"amount": dealt,
		"type_mult": float(ctx["type_mult"]),
		"stab": float(ctx["stab"]),
		"burn": float(ctx["burn"]),
		"roll": roll,
		"effective": float(ctx["type_mult"]),
		"field": float(ctx["field"]),
	}))
	if ctx.has("berry_ate"):
		events.append(BattleEvent.make(BattleEvent.ITEM_USED, {
			"side": String(target.side_id),
			"item": String(ctx["berry_ate"]),
			"reason": "berry",
		}))
	var hit_ctx := {
		"user": user,
		"target": target,
		"move": move,
		"dealt": dealt,
		"events": events,
	}
	_dispatch(AbilityHandler.EVT_AFTER_HIT, target, hit_ctx)
	_dispatch(AbilityHandler.EVT_AFTER_HIT, user, hit_ctx)
	if target.fainted:
		events.append(BattleEvent.make(BattleEvent.FAINT, {
			"side": String(target.side_id),
			"target": target.display_name(),
		}))
		_dispatch(AbilityHandler.EVT_ON_FAINT, target, hit_ctx)
	return events


func _maybe_berry(target: Battler, move: MoveSpec, type_m: float, ctx: Dictionary) -> void:
	var item: ItemSpec = find_item(target.held_id())
	if item == null or item.kind != ItemSpec.KIND_BERRY:
		return
	var t := StringName(str(item.params.get("type", "")))
	if t != move.type_id:
		return
	if type_m <= 1.0:
		return
	ctx["other"] = float(ctx.get("other", 1.0)) * float(item.params.get("mult", 0.5))
	target.set_held(&"")
	ctx["berry_ate"] = String(item.id)


func _apply_move_effect(user: Battler, target: Battler, move: MoveSpec, events: Array) -> void:
	if target.fainted:
		return
	var eff: Dictionary = move.effect
	if eff.is_empty():
		return
	var chance: int = int(eff.get("chance", 100))
	if eff.has("status"):
		if rng.chance_pct(chance):
			try_inflict(target, StringName(str(eff.get("status", ""))), events, user)
	var flinch_ch: int = int(eff.get("flinch", 0))
	if flinch_ch > 0 and rng.chance_pct(flinch_ch):
		target.volatiles[StatusIds.VOL_FLINCH] = true
		events.append(BattleEvent.make(BattleEvent.VOLATILE, {
			"side": String(target.side_id),
			"target": target.display_name(),
			"volatile": "flinch",
		}))


func _roll_hit(user: Battler, target: Battler, move: MoveSpec) -> bool:
	if move.accuracy <= 0:
		return true
	var stage: int = clampi(user.stages.get_named(&"acc") - target.stages.get_named(&"eva"), -6, 6)
	if move.accuracy >= 100 and stage == 0:
		return true
	var stage_m: float = StatStages.acc_multiplier(stage)
	var effective: int = int(floor(float(move.accuracy) * stage_m))
	if effective >= 100:
		return true
	if effective <= 0:
		return false
	return rng.next_int(100) < effective


func _do_switch(user: Battler, act: BattleAction) -> Array:
	var events: Array = []
	var side: Side = side_of(user)
	var dest: int = act.slot
	if dest == side.active_index:
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(side.id),
			"reason": "same_slot",
		}))
		return events
	if dest < 0 or dest >= side.battlers.size():
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(side.id),
			"reason": "bad_slot",
		}))
		return events
	var incoming: Battler = side.battlers[dest]
	if incoming == null or incoming.fainted:
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(side.id),
			"reason": "fainted_dest",
		}))
		return events
	user.volatiles.erase(StatusIds.VOL_FLINCH)
	events.append_array(_send_out(side, dest))
	return events


func _send_out(side: Side, index: int) -> Array:
	var events: Array = []
	if index < 0 or index >= side.battlers.size():
		return events
	var incoming: Battler = side.battlers[index]
	if incoming == null or incoming.fainted:
		return events
	side.active_index = index
	incoming.stages = StatStages.new()
	incoming.volatiles.erase(StatusIds.VOL_FLINCH)
	incoming.acted_this_turn = false
	events.append(BattleEvent.make(BattleEvent.SWITCH, {
		"side": String(side.id),
		"slot": index,
		"name": incoming.display_name(),
	}))
	_dispatch(AbilityHandler.EVT_SWITCH_IN, incoming, {"events": events, "battler": incoming})
	_awaiting.erase(side.id)
	return events


func _process_faints() -> Array:
	var events: Array = []
	_check_over()
	if over:
		return events
	for side in [ally, foe]:
		var b: Battler = side.active()
		if b == null or not b.fainted:
			continue
		var living: Array = side.living_indices()
		if living.is_empty():
			continue
		if living.size() == 1 or rules.auto_replace:
			events.append_array(_send_out(side, int(living[0])))
		else:
			_awaiting[side.id] = true
	return events


func _resolve_replacements() -> Array:
	var events: Array = []
	for side in [ally, foe]:
		if not _awaiting.has(side.id):
			continue
		var act: BattleAction = _pending.get(side.id)
		if act != null and act.kind == BattleAction.KIND_SWITCH:
			var user: Battler = side.active()
			if user == null and not side.battlers.is_empty():
				user = side.battlers[0]
			if user:
				events.append_array(_do_switch(user, act))
		elif rules.auto_replace or side.living_indices().size() <= 1:
			var living: Array = side.living_indices()
			if not living.is_empty():
				events.append_array(_send_out(side, int(living[0])))
	return events


func _do_item(user: Battler, act: BattleAction) -> Array:
	var events: Array = []
	var item: ItemSpec = find_item(act.item_id)
	var side: Side = side_of(user)
	if item == null:
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(user.side_id),
			"reason": "unknown_item",
		}))
		return events
	if item_count(side.id, item.id) <= 0:
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(user.side_id),
			"reason": "no_item",
		}))
		return events
	var dest_idx: int = act.slot if act.slot >= 0 else side.active_index
	if dest_idx < 0 or dest_idx >= side.battlers.size():
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(user.side_id),
			"reason": "bad_slot",
		}))
		return events
	var dest: Battler = side.battlers[dest_idx]
	if dest == null or dest.fainted:
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(user.side_id),
			"reason": "fainted_dest",
		}))
		return events
	var applied: bool = false
	match item.kind:
		ItemSpec.KIND_HEAL:
			var amt: int = int(item.params.get("hp", 20))
			var healed: int = dest.apply_heal(amt)
			if healed > 0:
				applied = true
				events.append(BattleEvent.make(BattleEvent.HEAL, {
					"side": String(side.id),
					"target": dest.display_name(),
					"amount": healed,
					"source": String(item.id),
				}))
		ItemSpec.KIND_STATUS_HEAL:
			if dest.clear_status():
				applied = true
				events.append(BattleEvent.make(BattleEvent.STATUS_CURE, {
					"side": String(side.id),
					"target": dest.display_name(),
				}))
		ItemSpec.KIND_X_STAT:
			var stat := StringName(str(item.params.get("stat", "atk")))
			var delta: int = int(item.params.get("stages", 2))
			var changed: int = dest.stages.add(stat, delta)
			if changed != 0:
				applied = true
				events.append(BattleEvent.make(BattleEvent.STAGE_CHANGE, {
					"side": String(side.id),
					"target": dest.display_name(),
					"stat": String(stat),
					"delta": changed,
					"stage": dest.stages.get_named(stat),
				}))
		ItemSpec.KIND_BERRY, ItemSpec.KIND_RESIDUAL, ItemSpec.KIND_ATTUNE_AID:
			dest.set_held(item.id)
			applied = true
			events.append(BattleEvent.make(BattleEvent.ITEM_USED, {
				"side": String(side.id),
				"item": String(item.id),
				"reason": "held",
			}))
		_:
			pass
	if not applied:
		events.append(BattleEvent.make(BattleEvent.SKIP, {
			"side": String(user.side_id),
			"reason": "item_no_effect",
		}))
		return events
	_consume_item(side.id, item.id)
	events.append(BattleEvent.make(BattleEvent.ITEM_USED, {
		"side": String(side.id),
		"item": String(item.id),
		"target": dest.display_name(),
	}))
	return events


func _consume_item(side_id: StringName, item_id: StringName) -> bool:
	if not bags.has(side_id):
		return false
	var bag: Dictionary = bags[side_id]
	var n: int = int(bag.get(item_id, 0))
	if n <= 0:
		return false
	bag[item_id] = n - 1
	return true


func _do_flee(user: Battler) -> Array:
	var events: Array = []
	events.append(BattleEvent.make(BattleEvent.FLEE_ATTEMPT, {"side": String(user.side_id)}))
	if not rules.can_flee or not rules.is_wild:
		events.append(BattleEvent.make(BattleEvent.FLEE_FAIL, {"reason": "trainer"}))
		return events
	flee_attempts += 1
	var them: Battler = other_side(user.side_id).active()
	var us_spe: int = effective_spe(user)
	var them_spe: int = effective_spe(them) if them else 1
	var threshold: int = Attune.flee_threshold(us_spe, them_spe, flee_attempts)
	if rng.next_int(256) < threshold:
		over = true
		winner = SIDE_ALLY
		outcome = OUTCOME_FLED
		events.append(BattleEvent.make(BattleEvent.FLEE_SUCCESS, {"threshold": threshold}))
	else:
		events.append(BattleEvent.make(BattleEvent.FLEE_FAIL, {
			"reason": "roll",
			"threshold": threshold,
		}))
	return events


func _do_attune(user: Battler, act: BattleAction) -> Array:
	var events: Array = []
	if not rules.can_attune or not rules.is_wild:
		events.append(BattleEvent.make(BattleEvent.ATTUNE_FAIL, {"reason": "not_wild"}))
		return events
	if user.side_id != SIDE_ALLY:
		events.append(BattleEvent.make(BattleEvent.ATTUNE_FAIL, {"reason": "not_player"}))
		return events
	var wild: Battler = foe.active()
	if wild == null or wild.fainted:
		events.append(BattleEvent.make(BattleEvent.ATTUNE_FAIL, {"reason": "no_target"}))
		return events
	var bond_item: float = 1.0
	if act.item_id != &"":
		var bag_item: ItemSpec = find_item(act.item_id)
		if bag_item and bag_item.kind == ItemSpec.KIND_ATTUNE_AID and item_count(SIDE_ALLY, act.item_id) > 0:
			bond_item = float(bag_item.params.get("bond_item", 1.25))
			_consume_item(SIDE_ALLY, act.item_id)
	else:
		var held: ItemSpec = find_item(user.held_id())
		if held == null:
			held = find_item(wild.held_id())
		if held and held.kind == ItemSpec.KIND_ATTUNE_AID:
			bond_item = float(held.params.get("bond_item", 1.25))
	var field_c: float = Attune.field_compat(wild.species, field_id)
	var agitated: bool = bool(wild.volatiles.get(StatusIds.VOL_AGITATED, false))
	var a: int = Attune.score(
		wild.species.attune_rate,
		wild.took_damage_this_battle,
		field_c,
		act.approach,
		bond_item,
		wild.hp(),
		wild.max_hp(),
		agitated
	)
	events.append(BattleEvent.make(BattleEvent.ATTUNE_ATTEMPT, {
		"a": a,
		"approach": String(act.approach),
		"harmed": wild.took_damage_this_battle,
	}))
	if Attune.roll_success(rng, a):
		if act.approach == Attune.FORCE:
			Attune.apply_force_bond(wild.instance)
		over = true
		winner = SIDE_ALLY
		outcome = OUTCOME_ATTUNED
		attuned_instance = wild.instance
		events.append(BattleEvent.make(BattleEvent.ATTUNE_SUCCESS, {
			"species": String(wild.species.id),
			"approach": String(act.approach),
			"bond_cap": wild.instance.bond_cap,
		}))
		return events
	var flee_pct: int = Attune.FAIL_FLEE_FORCE if act.approach == Attune.FORCE else Attune.FAIL_FLEE_SOFT
	if rng.chance_pct(flee_pct):
		over = true
		winner = &""
		outcome = OUTCOME_WILD_FLED
		events.append(BattleEvent.make(BattleEvent.ATTUNE_FAIL, {"reason": "wild_fled"}))
	else:
		wild.volatiles[StatusIds.VOL_AGITATED] = true
		events.append(BattleEvent.make(BattleEvent.ATTUNE_FAIL, {"reason": "agitated"}))
	return events


func _do_residuals() -> Array:
	var events: Array = []
	for b in [ally.active() if ally else null, foe.active() if foe else null]:
		if b == null or b.fainted:
			continue
		var st: StringName = b.instance.status_id
		var resid: int = StatusIds.residual_damage(st, b.max_hp())
		if resid > 0:
			var dealt: int = b.apply_damage(resid)
			events.append(BattleEvent.make(BattleEvent.STATUS_DAMAGE, {
				"side": String(b.side_id),
				"target": b.display_name(),
				"status": String(st),
				"amount": dealt,
			}))
			if b.fainted:
				events.append(BattleEvent.make(BattleEvent.FAINT, {
					"side": String(b.side_id),
					"target": b.display_name(),
				}))
				continue
		var ctx := {"events": events, "battler": b}
		_dispatch(AbilityHandler.EVT_RESIDUAL, b, ctx)
		if b.fainted:
			continue
		_held_residual(b, events)
	for side in [ally, foe]:
		if side and side.mud_turns > 0:
			side.mud_turns -= 1
			if side.mud_turns <= 0:
				side.mud_turns = 0
				events.append(BattleEvent.make(BattleEvent.MUD, {
					"side": String(side.id),
					"op": "fade",
				}))
	return events


func _held_residual(b: Battler, events: Array) -> void:
	var item: ItemSpec = find_item(b.held_id())
	if item == null or item.kind != ItemSpec.KIND_RESIDUAL:
		return
	var frac: int = int(item.params.get("fraction", 16))
	if frac <= 0:
		return
	var amt: int = maxi(1, int(b.max_hp() / frac))
	var healed: int = b.apply_heal(amt)
	if healed <= 0:
		return
	events.append(BattleEvent.make(BattleEvent.HEAL, {
		"side": String(b.side_id),
		"target": b.display_name(),
		"amount": healed,
		"source": String(item.id),
	}))


func _clear_acted() -> void:
	for side in [ally, foe]:
		if side == null:
			continue
		for raw in side.battlers:
			var b: Battler = raw
			if b:
				b.acted_this_turn = false


func _clear_flinch() -> void:
	for side in [ally, foe]:
		if side == null:
			continue
		for raw in side.battlers:
			var b: Battler = raw
			if b:
				b.volatiles.erase(StatusIds.VOL_FLINCH)


func _find_move(user: Battler, move_id: StringName) -> MoveSpec:
	return find_move(user, move_id)


func _check_over() -> void:
	var a_dead: bool = ally == null or ally.all_fainted()
	var f_dead: bool = foe == null or foe.all_fainted()
	if a_dead and f_dead:
		over = true
		winner = &"draw"
		outcome = OUTCOME_DRAW
	elif a_dead:
		over = true
		winner = SIDE_FOE
		outcome = OUTCOME_KO
	elif f_dead:
		over = true
		winner = SIDE_ALLY
		outcome = OUTCOME_KO


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
		"slot": b.slot,
		"ability": String(b.ability_id()),
	}
