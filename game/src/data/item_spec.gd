class_name ItemSpec
extends Resource

const KIND_HEAL := &"heal"
const KIND_STATUS_HEAL := &"status_heal"
const KIND_X_STAT := &"x_stat"
const KIND_BERRY := &"berry"
const KIND_RESIDUAL := &"residual"
const KIND_ATTUNE_AID := &"attune_aid"

@export var id: StringName = &""
@export var display_name: String = ""
@export var pocket: StringName = &"tools"
@export var description: String = ""
@export var kind: StringName = &""
@export var params: Dictionary = {}


func to_dict() -> Dictionary:
	return {
		"id": String(id),
		"display_name": display_name,
		"pocket": String(pocket),
		"description": description,
		"kind": String(kind),
		"params": params.duplicate(true),
	}


static func from_dict(raw: Dictionary) -> ItemSpec:
	var i := ItemSpec.new()
	i.id = StringName(str(raw.get("id", "")))
	i.display_name = str(raw.get("display_name", i.id))
	i.pocket = StringName(str(raw.get("pocket", "tools")))
	i.description = str(raw.get("description", ""))
	i.kind = StringName(str(raw.get("kind", "")))
	var p: Variant = raw.get("params", {})
	i.params = p.duplicate(true) if typeof(p) == TYPE_DICTIONARY else {}
	return i
