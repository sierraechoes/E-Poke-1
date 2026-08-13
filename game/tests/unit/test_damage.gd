extends GutTest


func test_stab_increases_damage() -> void:
	var plain := Damage.calc(50, 60, 100, 80, 1.0, 1.0, 1.0, 1.0, 1.0)
	var stab := Damage.calc(50, 60, 100, 80, 1.5, 1.0, 1.0, 1.0, 1.0)
	assert_gt(stab, plain)
	assert_eq(stab, int(floor(float(plain) * 1.5)))


func test_super_effective_doubles() -> void:
	var neu := Damage.calc(50, 60, 100, 80, 1.0, 1.0, 1.0, 1.0, 1.0)
	var sup := Damage.calc(50, 60, 100, 80, 1.0, 2.0, 1.0, 1.0, 1.0)
	assert_eq(sup, neu * 2)


func test_resist_halves() -> void:
	var neu := Damage.calc(50, 60, 100, 80, 1.0, 1.0, 1.0, 1.0, 1.0)
	var res := Damage.calc(50, 60, 100, 80, 1.0, 0.5, 1.0, 1.0, 1.0)
	assert_eq(res, int(floor(float(neu) * 0.5)))


func test_immune_is_zero() -> void:
	assert_eq(Damage.calc(50, 60, 100, 80, 1.5, 0.0, 1.0, 1.0, 1.0), 0)


func test_burn_halves_physical_not_special() -> void:
	assert_eq(Damage.burn_for(true, &"physical"), 0.5)
	assert_eq(Damage.burn_for(true, &"special"), 1.0)
	assert_eq(Damage.burn_for(false, &"physical"), 1.0)
	var phys := Damage.calc(50, 60, 100, 80, 1.0, 1.0, 1.0, 1.0, 0.5)
	var spec := Damage.calc(50, 60, 100, 80, 1.0, 1.0, 1.0, 1.0, 1.0)
	assert_eq(phys, int(floor(float(spec) * 0.5)))


func test_seeded_damage_rolls_stable() -> void:
	var a := BattleRng.new(42)
	var b := BattleRng.new(42)
	for i in 16:
		assert_eq(a.damage_roll(), b.damage_roll())
	var c := BattleRng.new(99)
	var same := true
	a.reseed(42)
	for i in 8:
		if abs(a.damage_roll() - c.damage_roll()) > 0.0001:
			same = false
			break
	assert_false(same, "different seeds should diverge")


func test_stab_helper() -> void:
	assert_eq(Damage.stab_for(&"pulse", [&"pulse"]), 1.5)
	assert_eq(Damage.stab_for(&"ember", [&"pulse"]), 1.0)
	assert_eq(Damage.stab_for(&"bloom", [&"bloom", &"tide"]), 1.5)
