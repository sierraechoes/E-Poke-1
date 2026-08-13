extends AbilityHandler
## Speed ×1.5 on Reedwalk or while this side has mud.


func _init() -> void:
	id = &"swift_current"


func handle(event: StringName, host: Battler, ctx: Dictionary, sim: BattleSim) -> void:
	if event != EVT_MODIFY_SPEED:
		return
	if ctx.get("battler") != host:
		return
	var side: Side = sim.side_of(host)
	var wet: bool = sim.field_id == &"reedwalk" or (side != null and side.mud_turns > 0)
	if wet:
		ctx["spe"] = float(ctx.get("spe", 0.0)) * 1.5
