class_name BattleEvent
extends RefCounted

const MOVE_USED := &"move_used"
const DAMAGE := &"damage"
const FAINT := &"faint"
const SKIP := &"skip"
const TURN_END := &"turn_end"
const BATTLE_OVER := &"battle_over"

var type: StringName = &""
var payload: Dictionary = {}


static func make(p_type: StringName, p_payload: Dictionary = {}) -> BattleEvent:
	var e := BattleEvent.new()
	e.type = p_type
	e.payload = p_payload
	return e


func to_dict() -> Dictionary:
	return {"type": String(type), "payload": payload.duplicate(true)}
