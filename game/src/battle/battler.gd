class_name Battler
extends RefCounted
## One combatant. Stats frozen at send-in except HP and status.

var instance: EchoInstance
var species: EchoSpecies
var stats: StatBlock
var side_id: StringName = &"ally"
var slot: int = 0
var fainted: bool = false


static func from_instance(inst: EchoInstance, spec: EchoSpecies, p_side: StringName, p_slot: int = 0) -> Battler:
	var b := Battler.new()
	b.instance = inst
	b.species = spec
	b.stats = inst.computed_stats(spec)
	b.side_id = p_side
	b.slot = p_slot
	b.fainted = inst.current_hp <= 0
	if inst.current_hp <= 0:
		inst.current_hp = 0
	elif inst.current_hp > b.stats.hp:
		inst.current_hp = b.stats.hp
	return b


func hp() -> int:
	return instance.current_hp


func max_hp() -> int:
	return stats.hp


func is_burned() -> bool:
	return instance.status_id == &"burn"


func apply_damage(amount: int) -> int:
	if fainted or amount <= 0:
		return 0
	var dealt: int = mini(amount, instance.current_hp)
	instance.current_hp -= dealt
	if instance.current_hp <= 0:
		instance.current_hp = 0
		fainted = true
	return dealt


func display_name() -> String:
	if instance.nickname != "":
		return instance.nickname
	return species.display_name
