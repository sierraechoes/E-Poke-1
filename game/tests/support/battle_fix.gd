class_name BattleFix
extends RefCounted
## Shared builders for kernel tests. Not collected by GUT (no test_ prefix).


static func species(id: String, types: Array, hp: int, atk: int, defn: int, spa: int, spd: int, spe: int, ability: String = "") -> EchoSpecies:
	var raw := {
		"id": id,
		"display_name": id.capitalize(),
		"types": types,
		"base_stats": {"hp": hp, "atk": atk, "def": defn, "spa": spa, "spd": spd, "spe": spe},
		"learnset": [],
		"abilities": [],
	}
	if ability != "":
		raw["abilities"] = [ability]
	return EchoSpecies.from_dict(raw)


static func move(id: String, type_id: String, cat: String, power: int, extra: Dictionary = {}) -> MoveSpec:
	var raw := {
		"id": id,
		"display_name": id,
		"type": type_id,
		"category": cat,
		"power": power,
		"accuracy": int(extra.get("accuracy", 100)),
		"pp": 20,
		"priority": int(extra.get("priority", 0)),
		"tags": extra.get("tags", []),
		"effect": extra.get("effect", {}),
	}
	return MoveSpec.from_dict(raw)


static func battler(spec: EchoSpecies, level: int, side: StringName, ability: StringName = &"") -> Battler:
	var inst := EchoInstance.from_species(spec, level, &"even")
	inst.scars = StatBlock.new(31, 31, 31, 31, 31, 31)
	if ability != &"":
		inst.ability_id = ability
	var stats := inst.computed_stats(spec)
	inst.current_hp = stats.hp
	return Battler.from_instance(inst, spec, side)


static func has_event(events: Array, type_id: StringName) -> bool:
	for e in events:
		var ev: BattleEvent = e
		if ev.type == type_id:
			return true
	return false


static func first_event(events: Array, type_id: StringName) -> BattleEvent:
	for e in events:
		var ev: BattleEvent = e
		if ev.type == type_id:
			return ev
	return null


static func event_count(events: Array, type_id: StringName) -> int:
	var n: int = 0
	for e in events:
		var ev: BattleEvent = e
		if ev.type == type_id:
			n += 1
	return n
