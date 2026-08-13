extends GutTest


func test_two_plus_two() -> void:
	assert_eq(2 + 2, 4, "CI pulse")


func test_version_string_present() -> void:
	assert_true(GameVersion.VERSION.begins_with("0."), "version pin")
	assert_eq(GameVersion.PHASE, "P03")
	assert_eq(GameVersion.TITLE, "AETHERA")


func test_engine_is_four_six() -> void:
	var info := Engine.get_version_info()
	assert_eq(int(info.major), 4, "Godot major")
	assert_eq(int(info.minor), 6, "Godot minor — pin 4.6.3")
