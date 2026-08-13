extends AbilityHandler
## Cannot be burned.


func _init() -> void:
	id = &"kiln_hide"


func handle(event: StringName, host: Battler, ctx: Dictionary, _sim: BattleSim) -> void:
	if event != EVT_TRY_STATUS:
		return
	if ctx.get("target") != host:
		return
	if (ctx.get("status", &"") as StringName) == StatusIds.BURN:
		ctx["blocked"] = true
