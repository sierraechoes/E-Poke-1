class_name Battler
extends RefCounted
## One combatant. Stats frozen at send-in except HP, status, stages.

var instance: EchoInstance
var species: EchoSpecies
var stats: StatBlock
var side_id: StringName = &"ally"
var slot: int = 0
var fainted: bool = false
var stages: StatStages
var volatiles: Dictionary = {}
var sleep_turns: int = 0
var took_damage_this_battle: bool = false
var acted_this_turn: bool = false


static func from_instance(inst: EchoInstance, spec: EchoSpecies, p_side: StringName, p_slot: int = 0) -> Battler:
	var b := Battler.new()
	b.instance = inst
	b.species = spec
	b.stats = inst.computed_stats(spec)
	b.side_id = p_side
	b.slot = p_slot
	b.stages = StatStages.new()
	b.fainted = inst.current_hp <= 0
	if inst.current_hp <= 0:
		inst.current_hp = 0
	elif inst.current_hp > b.stats.hp:
		inst.current_hp = b.stats.hp
	if inst.status_id == StatusIds.SLEEP and b.sleep_turns <= 0:
		b.sleep_turns = 1
	return b


func hp() -> int:
	return instance.current_hp


func max_hp() -> int:
	return stats.hp


func is_burned() -> bool:
	return instance.status_id == StatusIds.BURN


func has_status() -> bool:
	return instance.status_id != &""


func status() -> StringName:
	return instance.status_id


func ability_id() -> StringName:
	return instance.ability_id if instance else &""


func held_id() -> StringName:
	return instance.held_item_id if instance else &""


func set_held(id: StringName) -> void:
	if instance:
		instance.held_item_id = id


func move_ids() -> Array:
	var out: Array = []
	if instance == null:
		return out
	for m in instance.moves:
		if typeof(m) == TYPE_DICTIONARY:
			var mid := StringName(str(m.get("id", "")))
			if mid != &"":
				out.append(mid)
	return out


func staged(stat_id: StringName) -> int:
	var raw: int = stats.get_named(stat_id)
	return maxi(1, int(float(raw) * stages.multiplier(stat_id)))


func apply_damage(amount: int) -> int:
	if fainted or amount <= 0:
		return 0
	var dealt: int = mini(amount, instance.current_hp)
	instance.current_hp -= dealt
	if dealt > 0:
		took_damage_this_battle = true
	if instance.current_hp <= 0:
		instance.current_hp = 0
		fainted = true
	return dealt


func apply_heal(amount: int) -> int:
	if fainted or amount <= 0:
		return 0
	var room: int = stats.hp - instance.current_hp
	var n: int = mini(amount, room)
	instance.current_hp += n
	return n


func clear_status() -> bool:
	if instance.status_id == &"":
		return false
	instance.status_id = &""
	sleep_turns = 0
	return true


func display_name() -> String:
	if instance.nickname != "":
		return instance.nickname
	return species.display_name
