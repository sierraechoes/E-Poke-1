class_name LearnsetEntry
extends Resource

@export var level: int = 1
@export var move_id: StringName = &""


func _init(p_level: int = 1, p_move: StringName = &"") -> void:
	level = p_level
	move_id = p_move


func to_dict() -> Dictionary:
	return {"level": level, "move": String(move_id)}


static func from_dict(raw: Dictionary) -> LearnsetEntry:
	return LearnsetEntry.new(int(raw.get("level", 1)), StringName(str(raw.get("move", ""))))
