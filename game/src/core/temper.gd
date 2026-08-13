class_name Temper
extends RefCounted
## Named +10% / −10% leans. Neutral = even.

const CATALOG := {
	&"even": {"plus": &"", "minus": &"", "label": "Even"},
	&"fierce": {"plus": &"atk", "minus": &"spa", "label": "Fierce"},
	&"keen": {"plus": &"spa", "minus": &"atk", "label": "Keen"},
	&"stout": {"plus": &"def", "minus": &"atk", "label": "Stout"},
	&"veiled": {"plus": &"spd", "minus": &"atk", "label": "Veiled"},
	&"swift": {"plus": &"spe", "minus": &"atk", "label": "Swift"},
	&"brisk": {"plus": &"spe", "minus": &"spa", "label": "Brisk"},
	&"heavy": {"plus": &"atk", "minus": &"spe", "label": "Heavy"},
	&"languid": {"plus": &"spa", "minus": &"spe", "label": "Languid"},
	&"ironclad": {"plus": &"def", "minus": &"spa", "label": "Ironclad"},
	&"reckless": {"plus": &"atk", "minus": &"def", "label": "Reckless"},
}


static func is_valid(id: StringName) -> bool:
	return CATALOG.has(id)


static func plus_of(id: StringName) -> StringName:
	if not CATALOG.has(id):
		return &""
	return CATALOG[id]["plus"]


static func minus_of(id: StringName) -> StringName:
	if not CATALOG.has(id):
		return &""
	return CATALOG[id]["minus"]


static func label_of(id: StringName) -> String:
	if not CATALOG.has(id):
		return String(id)
	return str(CATALOG[id]["label"])
