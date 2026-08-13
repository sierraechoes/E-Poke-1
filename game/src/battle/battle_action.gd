class_name BattleAction
extends RefCounted

const KIND_FIGHT := &"fight"
const KIND_WAIT := &"wait"

var kind: StringName = KIND_FIGHT
var move_id: StringName = &""


static func fight(move_id: StringName) -> BattleAction:
	var a := BattleAction.new()
	a.kind = KIND_FIGHT
	a.move_id = move_id
	return a


static func wait_action() -> BattleAction:
	var a := BattleAction.new()
	a.kind = KIND_WAIT
	return a
