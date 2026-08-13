class_name TypeIds
extends RefCounted
## The 16 Resonance types. Locked in notes/20.

const ALL: Array[StringName] = [
	&"pulse",
	&"ember",
	&"tide",
	&"bloom",
	&"volt",
	&"frost",
	&"stone",
	&"gale",
	&"iron",
	&"toxin",
	&"hex",
	&"veil",
	&"flesh",
	&"myth",
	&"gloom",
	&"light",
]

const DISPLAY := {
	&"pulse": "Pulse",
	&"ember": "Ember",
	&"tide": "Tide",
	&"bloom": "Bloom",
	&"volt": "Volt",
	&"frost": "Frost",
	&"stone": "Stone",
	&"gale": "Gale",
	&"iron": "Iron",
	&"toxin": "Toxin",
	&"hex": "Hex",
	&"veil": "Veil",
	&"flesh": "Flesh",
	&"myth": "Myth",
	&"gloom": "Gloom",
	&"light": "Light",
}

const LETTER := {
	&"pulse": "P",
	&"ember": "E",
	&"tide": "T",
	&"bloom": "B",
	&"volt": "V",
	&"frost": "F",
	&"stone": "S",
	&"gale": "G",
	&"iron": "I",
	&"toxin": "X",
	&"hex": "H",
	&"veil": "L",
	&"flesh": "C",
	&"myth": "M",
	&"gloom": "D",
	&"light": "A",
}


static func is_valid(id: StringName) -> bool:
	return ALL.has(id)


static func display_name(id: StringName) -> String:
	return str(DISPLAY.get(id, String(id).capitalize()))
