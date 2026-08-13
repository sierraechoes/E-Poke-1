class_name Attune
extends RefCounted
## Pure attune math. Healthier wild Echoes are easier. Harm makes it harder.

const APPROACH := &"approach"
const OFFER := &"offer"
const HARMONIZE := &"harmonize"
const FORCE := &"force"

const FORCE_BOND := 0.7
const FAIL_FLEE_FORCE := 50
const FAIL_FLEE_SOFT := 30
const AGITATED_MOD := 0.85


static func approach_mod(approach: StringName) -> float:
	match approach:
		OFFER:
			return 1.1
		HARMONIZE:
			return 1.25
		FORCE:
			return 1.6
		_:
			return 1.0


static func hp_term(current_hp: int, max_hp: int) -> float:
	if max_hp <= 0:
		return 0.5
	return 0.5 + 0.5 * (float(current_hp) / float(max_hp))


static func field_compat(species: EchoSpecies, field_id: StringName) -> float:
	if field_id == &"" or species == null:
		return 1.0
	for tag in species.habitat_tags:
		var t: StringName = tag
		if t == field_id:
			return 1.25
		if String(t) == "hostile_%s" % String(field_id):
			return 0.75
	return 1.0


static func score(
		rate: int,
		harmed: bool,
		field_c: float,
		approach: StringName,
		bond_item: float,
		current_hp: int,
		max_hp: int,
		agitated: bool = false
	) -> int:
	var condition: float = 1.15 if not harmed else 0.55
	condition *= field_c
	condition *= approach_mod(approach)
	condition *= bond_item
	if agitated:
		condition *= AGITATED_MOD
	var a: int = int(floor(float(rate) * condition * hp_term(current_hp, max_hp)))
	return clampi(a, 1, 255)


static func roll_success(rng: BattleRng, a: int) -> bool:
	return rng.next_int(256) < a


static func apply_force_bond(inst: EchoInstance) -> void:
	inst.bond_cap = maxi(1, int(floor(float(inst.bond_cap) * FORCE_BOND)))
	if inst.bond > inst.bond_cap:
		inst.bond = inst.bond_cap


static func flee_threshold(user_spe: int, foe_spe: int, attempts: int) -> int:
	return clampi(int(user_spe * 128 / maxi(1, foe_spe)) + 30 * attempts, 0, 255)
