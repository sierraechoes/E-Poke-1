extends GutTest

var _chart: TypeChart


func before_each() -> void:
	_chart = TypeChart.from_locked_table()


func test_sixteen_types() -> void:
	assert_eq(TypeIds.ALL.size(), 16)
	assert_true(TypeIds.is_valid(&"pulse"))
	assert_false(TypeIds.is_valid(&"fire"))


func test_volt_vs_stone_immune() -> void:
	assert_eq(_chart.multiplier(&"volt", &"stone"), 0.0)


func test_hex_vs_pulse_immune() -> void:
	assert_eq(_chart.multiplier(&"hex", &"pulse"), 0.0)


func test_iron_vs_toxin_immune() -> void:
	assert_eq(_chart.multiplier(&"iron", &"toxin"), 0.0)


func test_myth_vs_light_immune() -> void:
	assert_eq(_chart.multiplier(&"myth", &"light"), 0.0)


func test_ember_vs_bloom_super() -> void:
	assert_eq(_chart.multiplier(&"ember", &"bloom"), 2.0)


func test_bloom_vs_ember_resist() -> void:
	assert_eq(_chart.multiplier(&"bloom", &"ember"), 0.5)


func test_dual_bloom_tide_vs_ember_neutral() -> void:
	var v := _chart.vs(&"ember", [&"bloom", &"tide"])
	assert_eq(v, 1.0, "2 × ½ = 1")


func test_dual_bloom_frost_vs_ember_quad() -> void:
	var v := _chart.vs(&"ember", [&"bloom", &"frost"])
	assert_eq(v, 4.0, "2 × 2 = 4")


func test_unlisted_pair_is_neutral() -> void:
	assert_eq(_chart.multiplier(&"pulse", &"pulse"), 1.0)


func test_hex_vs_flesh_immune() -> void:
	assert_eq(_chart.multiplier(&"hex", &"flesh"), 0.0)
	assert_eq(_chart.multiplier(&"flesh", &"hex"), 0.0)
