extends AbilityHandler
## Residual: restore 1/16 max HP.


func _init() -> void:
	id = &"after_glow"


func handle(event: StringName, host: Battler, ctx: Dictionary, _sim: BattleSim) -> void:
	if event != EVT_RESIDUAL:
		return
	if host.fainted:
		return
	var amt: int = maxi(1, int(host.max_hp() / 16))
	var healed: int = host.apply_heal(amt)
	if healed <= 0:
		return
	var events: Array = ctx.get("events", [])
	events.append(BattleEvent.make(BattleEvent.HEAL, {
		"side": String(host.side_id),
		"target": host.display_name(),
		"amount": healed,
		"source": "after_glow",
	}))
