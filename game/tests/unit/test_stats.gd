extends GutTest


func test_hp_fixture_lv50() -> void:
	## Base 50, Scar 31, Training 0, Lv 50 → 125
	assert_eq(StatFormulas.calc_hp(50, 31, 0, 50), 125)


func test_atk_fixture_lv50_fierce() -> void:
	## Base 80, Scar 31, Training 252, Lv 50, Temper 1.1 → 145
	assert_eq(StatFormulas.calc_stat(80, 31, 252, 50, 1.1), 145)


func test_hp_level_one() -> void:
	## floor((2*50)*1/100) + 1 + 10 = 1 + 11 = 12
	assert_eq(StatFormulas.calc_hp(50, 0, 0, 1), 12)


func test_compute_applies_temper_to_atk_only() -> void:
	var base := StatBlock.new(50, 80, 50, 80, 50, 50)
	var scars := StatBlock.new(31, 31, 31, 31, 31, 31)
	var train := StatBlock.new(0, 252, 0, 0, 0, 0)
	var out := StatFormulas.compute(base, scars, train, 50, &"atk", &"spa")
	assert_eq(out.hp, 125)
	assert_eq(out.atk, 145)
	# spa has minus temper 0.9, training 0
	var spa_flat := StatFormulas.calc_stat(80, 31, 0, 50, 0.9)
	assert_eq(out.spa, spa_flat)
	assert_ne(out.spa, out.atk)


func test_training_total_cap_constant() -> void:
	assert_eq(StatFormulas.TRAINING_TOTAL_MAX, 510)
	assert_eq(StatFormulas.SCAR_MAX, 31)
