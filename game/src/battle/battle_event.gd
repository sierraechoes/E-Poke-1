class_name BattleEvent
extends RefCounted

const MOVE_USED := &"move_used"
const DAMAGE := &"damage"
const FAINT := &"faint"
const SKIP := &"skip"
const TURN_START := &"turn_start"
const TURN_END := &"turn_end"
const BATTLE_OVER := &"battle_over"
const MISS := &"miss"
const STATUS_APPLIED := &"status_applied"
const STATUS_DAMAGE := &"status_damage"
const STATUS_CURE := &"status_cure"
const STATUS_BLOCKED := &"status_blocked"
const VOLATILE := &"volatile"
const SWITCH := &"switch"
const ITEM_USED := &"item_used"
const HEAL := &"heal"
const STAGE_CHANGE := &"stage_change"
const FIELD_CHANGE := &"field_change"
const MUD := &"mud"
const ATTUNE_ATTEMPT := &"attune_attempt"
const ATTUNE_SUCCESS := &"attune_success"
const ATTUNE_FAIL := &"attune_fail"
const FLEE_ATTEMPT := &"flee_attempt"
const FLEE_SUCCESS := &"flee_success"
const FLEE_FAIL := &"flee_fail"
const FLINCH := &"flinch"
const FULL_PARA := &"full_para"
const SLEEP := &"sleep"
const WAKE := &"wake"

var type: StringName = &""
var payload: Dictionary = {}


static func make(p_type: StringName, p_payload: Dictionary = {}) -> BattleEvent:
	var e := BattleEvent.new()
	e.type = p_type
	e.payload = p_payload
	return e


func to_dict() -> Dictionary:
	return {"type": String(type), "payload": payload.duplicate(true)}
