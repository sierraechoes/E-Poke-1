extends AbilityHandler
## Bloom STAB becomes 2.0.


func _init() -> void:
	id = &"reed_spine"


func handle(event: StringName, host: Battler, ctx: Dictionary, _sim: BattleSim) -> void:
	if event != EVT_MODIFY_DAMAGE:
		return
	if ctx.get("user") != host:
		return
	var move: MoveSpec = ctx.get("move")
	if move == null or move.type_id != &"bloom":
		return
	if Damage.stab_for(move.type_id, host.species.types) > 1.0:
		ctx["stab"] = 2.0
