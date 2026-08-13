extends AbilityHandler
## Contact hit on the host: 30% para the attacker.


func _init() -> void:
	id = &"static_hum"


func handle(event: StringName, host: Battler, ctx: Dictionary, sim: BattleSim) -> void:
	if event != EVT_AFTER_HIT:
		return
	if ctx.get("target") != host:
		return
	var move: MoveSpec = ctx.get("move")
	if move == null or int(ctx.get("dealt", 0)) <= 0:
		return
	if not _has_contact(move):
		return
	var user: Battler = ctx.get("user")
	if user == null or user.fainted:
		return
	if not sim.rng.chance_pct(30):
		return
	var events: Array = ctx.get("events", [])
	sim.try_inflict(user, StatusIds.PARA, events, host)


func _has_contact(move: MoveSpec) -> bool:
	for t in move.tags:
		if (t as StringName) == &"contact":
			return true
	return false
