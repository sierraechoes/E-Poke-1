class_name Side
extends RefCounted

var id: StringName = &"ally"
var battlers: Array = [] ## Array[Battler]
var active_index: int = 0
var mud_turns: int = 0


func active() -> Battler:
	if active_index >= 0 and active_index < battlers.size():
		return battlers[active_index]
	for b in battlers:
		var bat: Battler = b
		if bat and not bat.fainted:
			return bat
	return null


func living_indices() -> Array:
	var out: Array = []
	for i in range(battlers.size()):
		var bat: Battler = battlers[i]
		if bat and not bat.fainted:
			out.append(i)
	return out


func all_fainted() -> bool:
	return living_indices().is_empty()
