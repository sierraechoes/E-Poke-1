class_name AbilitySpec
extends Resource

@export var id: StringName = &""
@export var display_name: String = ""
@export var description: String = ""
@export var handler_id: StringName = &""


func to_dict() -> Dictionary:
	return {
		"id": String(id),
		"display_name": display_name,
		"description": description,
		"handler": String(handler_id),
	}


static func from_dict(raw: Dictionary) -> AbilitySpec:
	var a := AbilitySpec.new()
	a.id = StringName(str(raw.get("id", "")))
	a.display_name = str(raw.get("display_name", a.id))
	a.description = str(raw.get("description", ""))
	a.handler_id = StringName(str(raw.get("handler", a.id)))
	return a
