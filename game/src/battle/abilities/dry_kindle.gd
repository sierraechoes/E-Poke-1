extends AbilityHandler
## Ember moves ×1.2 on Dry Pan.


func _init() -> void:
	id = &"dry_kindle"


func handle(event: StringName, host: Battler, ctx: Dictionary, sim: BattleSim) -> void:
	if event != EVT_MODIFY_DAMAGE:
		return
	if ctx.get("user") != host:
		return
	var move: MoveSpec = ctx.get("move")
	if move == null or move.type_id != &"ember":
		return
	if sim.field_id == &"dry_pan":
		ctx["other"] = float(ctx.get("other", 1.0)) * 1.2
