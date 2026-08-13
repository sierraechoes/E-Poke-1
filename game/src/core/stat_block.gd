class_name StatBlock
extends Resource
## Six combat stats. Used for bases, scars, training, and computed totals.

@export var hp: int = 0
@export var atk: int = 0
@export var def: int = 0
@export var spa: int = 0
@export var spd: int = 0
@export var spe: int = 0


func _init(
		p_hp: int = 0,
		p_atk: int = 0,
		p_def: int = 0,
		p_spa: int = 0,
		p_spd: int = 0,
		p_spe: int = 0
	) -> void:
	hp = p_hp
	atk = p_atk
	def = p_def
	spa = p_spa
	spd = p_spd
	spe = p_spe


func bst() -> int:
	return hp + atk + def + spa + spd + spe


func get_named(stat_id: StringName) -> int:
	match stat_id:
		&"hp":
			return hp
		&"atk":
			return atk
		&"def":
			return def
		&"spa":
			return spa
		&"spd":
			return spd
		&"spe":
			return spe
		_:
			return 0


func set_named(stat_id: StringName, value: int) -> void:
	match stat_id:
		&"hp":
			hp = value
		&"atk":
			atk = value
		&"def":
			def = value
		&"spa":
			spa = value
		&"spd":
			spd = value
		&"spe":
			spe = value


func duplicate_block() -> StatBlock:
	return StatBlock.new(hp, atk, def, spa, spd, spe)


func to_dict() -> Dictionary:
	return {"hp": hp, "atk": atk, "def": def, "spa": spa, "spd": spd, "spe": spe}


static func from_dict(raw: Dictionary) -> StatBlock:
	return StatBlock.new(
		int(raw.get("hp", 0)),
		int(raw.get("atk", 0)),
		int(raw.get("def", 0)),
		int(raw.get("spa", 0)),
		int(raw.get("spd", 0)),
		int(raw.get("spe", 0))
	)
