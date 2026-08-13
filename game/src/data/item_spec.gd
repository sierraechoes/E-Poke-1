class_name ItemSpec
extends Resource

@export var id: StringName = &""
@export var display_name: String = ""
@export var pocket: StringName = &"tools"
@export var description: String = ""


func to_dict() -> Dictionary:
	return {
		"id": String(id),
		"display_name": display_name,
		"pocket": String(pocket),
		"description": description,
	}


static func from_dict(raw: Dictionary) -> ItemSpec:
	var i := ItemSpec.new()
	i.id = StringName(str(raw.get("id", "")))
	i.display_name = str(raw.get("display_name", i.id))
	i.pocket = StringName(str(raw.get("pocket", "tools")))
	i.description = str(raw.get("description", ""))
	return i
