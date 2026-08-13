class_name Side
extends RefCounted

var id: StringName = &"ally"
var battlers: Array = [] ## Array[Battler]


func active() -> Battler:
	for b in battlers:
		var bat: Battler = b
		if not bat.fainted:
			return bat
	return null


func all_fainted() -> bool:
	return active() == null
