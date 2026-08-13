class_name BattleRules
extends RefCounted

var can_flee: bool = true
var can_attune: bool = true
var auto_replace: bool = true
var is_wild: bool = true


static func wild() -> BattleRules:
	var r := BattleRules.new()
	r.can_flee = true
	r.can_attune = true
	r.auto_replace = true
	r.is_wild = true
	return r


static func trainer() -> BattleRules:
	var r := BattleRules.new()
	r.can_flee = false
	r.can_attune = false
	r.auto_replace = true
	r.is_wild = false
	return r
