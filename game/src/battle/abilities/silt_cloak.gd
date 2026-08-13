extends AbilityHandler
## Incoming damage ×0.8 while this side has mud.


func _init() -> void:
	id = &"silt_cloak"


func handle(event: StringName, host: Battler, ctx: Dictionary, sim: BattleSim) -> void:
	if event != EVT_MODIFY_DAMAGE:
		return
	if ctx.get("target") != host:
		return
	var side: Side = sim.side_of(host)
	if side != null and side.mud_turns > 0:
		ctx["other"] = float(ctx.get("other", 1.0)) * 0.8
