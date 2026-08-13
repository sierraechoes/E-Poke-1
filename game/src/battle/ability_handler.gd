class_name AbilityHandler
extends RefCounted
## One ability. Subscribe by implementing handle(). Never branch in BattleSim.

const EVT_SWITCH_IN := &"switch_in"
const EVT_BEFORE_MOVE := &"before_move"
const EVT_MODIFY_DAMAGE := &"modify_damage"
const EVT_AFTER_HIT := &"after_hit"
const EVT_TRY_STATUS := &"try_status"
const EVT_RESIDUAL := &"residual"
const EVT_MODIFY_SPEED := &"modify_speed"
const EVT_ON_FAINT := &"on_faint"

var id: StringName = &""


func handle(_event: StringName, _host: Battler, _ctx: Dictionary, _sim: BattleSim) -> void:
	pass
