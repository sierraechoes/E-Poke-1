class_name AbilityCatalog
extends RefCounted
## Maps ability id → handler. BattleSim never switches on ability names.

const _SCRIPTS := [
	preload("res://src/battle/abilities/static_hum.gd"),
	preload("res://src/battle/abilities/kiln_hide.gd"),
	preload("res://src/battle/abilities/reed_spine.gd"),
	preload("res://src/battle/abilities/silt_cloak.gd"),
	preload("res://src/battle/abilities/dry_kindle.gd"),
	preload("res://src/battle/abilities/clear_tone.gd"),
	preload("res://src/battle/abilities/swift_current.gd"),
	preload("res://src/battle/abilities/after_glow.gd"),
]

var _by_id: Dictionary = {}


func _init() -> void:
	for scr in _SCRIPTS:
		var h: AbilityHandler = scr.new()
		_by_id[h.id] = h


func size() -> int:
	return _by_id.size()


func has(id: StringName) -> bool:
	return _by_id.has(id)


func ids() -> Array:
	return _by_id.keys()


func register(handler: AbilityHandler) -> void:
	_by_id[handler.id] = handler


func dispatch(event: StringName, host: Battler, ctx: Dictionary, sim: BattleSim) -> void:
	if host == null:
		return
	var hid: StringName = host.ability_id()
	if hid == &"":
		return
	var h: AbilityHandler = _by_id.get(hid)
	if h:
		h.handle(event, host, ctx, sim)
