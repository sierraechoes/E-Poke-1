extends AbilityHandler
## Cannot receive a major status.


func _init() -> void:
	id = &"clear_tone"


func handle(event: StringName, host: Battler, ctx: Dictionary, _sim: BattleSim) -> void:
	if event != EVT_TRY_STATUS:
		return
	if ctx.get("target") == host:
		ctx["blocked"] = true
