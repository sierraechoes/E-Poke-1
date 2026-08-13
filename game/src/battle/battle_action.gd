class_name BattleAction
extends RefCounted

const KIND_FIGHT := &"fight"
const KIND_WAIT := &"wait"
const KIND_SWITCH := &"switch"
const KIND_ITEM := &"item"
const KIND_ATTUNE := &"attune"
const KIND_FLEE := &"flee"

var kind: StringName = KIND_FIGHT
var move_id: StringName = &""
var slot: int = -1
var item_id: StringName = &""
var approach: StringName = &"approach"


static func fight(move_id: StringName) -> BattleAction:
	var a := BattleAction.new()
	a.kind = KIND_FIGHT
	a.move_id = move_id
	return a


static func wait_action() -> BattleAction:
	var a := BattleAction.new()
	a.kind = KIND_WAIT
	return a


static func switch_to(slot: int) -> BattleAction:
	var a := BattleAction.new()
	a.kind = KIND_SWITCH
	a.slot = slot
	return a


static func use_item(item_id: StringName, slot: int = -1) -> BattleAction:
	var a := BattleAction.new()
	a.kind = KIND_ITEM
	a.item_id = item_id
	a.slot = slot
	return a


static func attune(approach: StringName = &"approach", item_id: StringName = &"") -> BattleAction:
	var a := BattleAction.new()
	a.kind = KIND_ATTUNE
	a.approach = approach
	a.item_id = item_id
	return a


static func flee() -> BattleAction:
	var a := BattleAction.new()
	a.kind = KIND_FLEE
	return a
