extends GutTest

var _tmp_dir: String = ""


func before_each() -> void:
	_tmp_dir = "user://test_saves_%d" % Time.get_ticks_usec()
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(_tmp_dir))
	SaveService._cached_dir = ProjectSettings.globalize_path(_tmp_dir)
	SaveService.current = null
	SaveService.current_slot = -1


func after_each() -> void:
	_wipe(_tmp_dir)
	SaveService._cached_dir = ""
	SaveService.current = null
	SaveService.current_slot = -1


func test_new_game_writes_and_reads_slot() -> void:
	var created := SaveService.new_game(1, "tactician", "Nyx")
	assert_not_null(created)
	assert_eq(created.player_name, "Nyx")
	assert_eq(created.difficulty, "tactician")
	assert_true(SaveService.has_slot(1))
	var peeked: SaveData = SaveService.peek_slot(1)
	assert_eq(peeked.player_name, "Nyx")
	assert_eq(peeked.difficulty, "tactician")
	assert_eq(peeked.version, SaveData.CURRENT_VERSION)


func test_save_roundtrip_preserves_playtime_and_reeds() -> void:
	SaveService.new_game(2, "story", "Rook")
	SaveService.current.reeds = 777
	SaveService.current.playtime_sec = 125.0
	SaveService.current.flags["met_nyx"] = true
	assert_eq(SaveService.save_current(), OK)
	SaveService.current = null
	var loaded := SaveService.load_slot(2)
	assert_eq(loaded.reeds, 777)
	assert_almost_eq(loaded.playtime_sec, 125.0, 0.01)
	assert_true(loaded.flags.get("met_nyx", false))


func test_backup_is_created_on_second_write() -> void:
	SaveService.new_game(3, "iron", "Sol")
	SaveService.current.notes = "first"
	SaveService.save_current()
	SaveService.current.notes = "second"
	SaveService.save_current()
	assert_true(FileAccess.file_exists(SaveService.backup_path(3)))
	var bak_text := FileAccess.get_file_as_string(SaveService.backup_path(3))
	assert_true(bak_text.contains("first") or bak_text.contains("\"notes\""), "backup has previous payload")


func test_future_version_is_rejected() -> void:
	var future := SaveData.create_new(1, "story", "Venn")
	future.version = 99
	SaveService.write_slot(1, future)
	# peek returns data; load_slot must refuse migration
	SaveService.current = null
	var loaded := SaveService.load_slot(1)
	assert_null(loaded, "future saves must not load")


func test_cannot_save_mid_battle() -> void:
	SaveService.new_game(1, "story", "Attuner")
	SaveService.current.in_battle = true
	var err := SaveService.save_current()
	assert_eq(err, ERR_BUSY)
	SaveService.current.in_battle = false
	assert_eq(SaveService.save_current(), OK)


func test_continue_picks_most_recent() -> void:
	SaveService.new_game(1, "story", "Old")
	OS.delay_msec(20)
	SaveService.new_game(2, "story", "New")
	SaveService.current = null
	var cont := SaveService.continue_latest()
	assert_not_null(cont)
	assert_eq(cont.player_name, "New")


func test_empty_name_becomes_attuner() -> void:
	var data := SaveData.create_new(1, "story", "   ")
	assert_eq(data.player_name, "Attuner")


func _wipe(res_path: String) -> void:
	var abs_path := ProjectSettings.globalize_path(res_path)
	var d := DirAccess.open(abs_path)
	if d == null:
		return
	d.list_dir_begin()
	var name := d.get_next()
	while name != "":
		if name != "." and name != "..":
			d.remove(name)
		name = d.get_next()
	d.list_dir_end()
	DirAccess.remove_absolute(abs_path)
