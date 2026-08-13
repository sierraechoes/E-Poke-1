extends Node
## Portable, versioned, offline saves. Autoload: SaveService
##
## Resolution order for the save directory:
##   1. AETHERA_SAVES environment variable
##   2. <project-or-exe-root>/saves  if portable.flag exists there
##   3. user://saves  (OS app-data)

const SLOT_COUNT := 3
const FILE_FMT := "slot_%d.json"
const BACKUP_FMT := "slot_%d.bak.json"
const PORTABLE_FLAG := "portable.flag"

signal save_written(slot: int)
signal save_loaded(slot: int)
signal save_failed(reason: String)

var current: SaveData = null
var current_slot: int = -1
var _session_started_usec: int = 0
var _cached_dir: String = ""


func _ready() -> void:
	_cached_dir = ""
	var dir := get_saves_dir()
	DirAccess.make_dir_recursive_absolute(dir)
	_session_started_usec = Time.get_ticks_usec()


func is_portable() -> bool:
	return FileAccess.file_exists(_portable_flag_path())


func get_saves_dir() -> String:
	if _cached_dir != "":
		return _cached_dir
	var env_dir := OS.get_environment("AETHERA_SAVES")
	if env_dir != "":
		_cached_dir = env_dir
		return _cached_dir
	var root := _install_root()
	if FileAccess.file_exists(root.path_join(PORTABLE_FLAG)):
		_cached_dir = root.path_join("saves")
		return _cached_dir
	_cached_dir = ProjectSettings.globalize_path("user://saves")
	return _cached_dir


func slot_path(slot: int) -> String:
	return get_saves_dir().path_join(FILE_FMT % slot)


func backup_path(slot: int) -> String:
	return get_saves_dir().path_join(BACKUP_FMT % slot)


func has_slot(slot: int) -> bool:
	return FileAccess.file_exists(slot_path(slot))


func has_any_save() -> bool:
	for i in range(1, SLOT_COUNT + 1):
		if has_slot(i):
			return true
	return false


func peek_slot(slot: int) -> SaveData:
	if not has_slot(slot):
		return null
	return _read_file(slot_path(slot))


func list_slots() -> Array:
	var out: Array = []
	for i in range(1, SLOT_COUNT + 1):
		var data := peek_slot(i)
		out.append({
			"slot": i,
			"exists": data != null,
			"data": data,
		})
	return out


func new_game(slot: int, difficulty: String, attuner_name: String) -> SaveData:
	_assert_slot(slot)
	var data := SaveData.create_new(slot, difficulty, attuner_name)
	var err := write_slot(slot, data)
	if err != OK:
		save_failed.emit("Could not create file %d (%s)" % [slot, error_string(err)])
		return null
	current = data
	current_slot = slot
	_session_started_usec = Time.get_ticks_usec()
	save_loaded.emit(slot)
	return data


func load_slot(slot: int) -> SaveData:
	_assert_slot(slot)
	var data := peek_slot(slot)
	if data == null:
		save_failed.emit("File %d is empty." % slot)
		return null
	if not data.migrate_if_needed():
		save_failed.emit("File %d is from a newer AETHERA and cannot be opened." % slot)
		return null
	if data.in_battle:
		# Mid-battle saves are forbidden. If a crash left the flag, clear it.
		data.in_battle = false
		data.notes = "Recovered from an interrupted battle."
	current = data
	current_slot = slot
	_session_started_usec = Time.get_ticks_usec()
	save_loaded.emit(slot)
	return data


func continue_latest() -> SaveData:
	var best_slot := -1
	var best_time := -1
	for i in range(1, SLOT_COUNT + 1):
		var data := peek_slot(i)
		if data and data.updated_unix >= best_time:
			best_time = data.updated_unix
			best_slot = i
	if best_slot < 0:
		save_failed.emit("No files to continue.")
		return null
	return load_slot(best_slot)


func save_current() -> Error:
	if current == null or current_slot < 1:
		save_failed.emit("Nothing to save.")
		return ERR_UNAVAILABLE
	if current.in_battle:
		save_failed.emit("Cannot save in the middle of a battle.")
		return ERR_BUSY
	_accrue_playtime()
	current.touch()
	return write_slot(current_slot, current)


func write_slot(slot: int, data: SaveData) -> Error:
	_assert_slot(slot)
	DirAccess.make_dir_recursive_absolute(get_saves_dir())
	var path := slot_path(slot)
	var bak := backup_path(slot)
	if FileAccess.file_exists(path):
		var prev := FileAccess.get_file_as_string(path)
		var bak_file := FileAccess.open(bak, FileAccess.WRITE)
		if bak_file:
			bak_file.store_string(prev)
			bak_file.close()
	data.slot_id = slot
	data.touch()
	var json := JSON.stringify(data.to_dict(), "\t")
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f == null:
		var err := FileAccess.get_open_error()
		save_failed.emit("Write failed: %s" % error_string(err))
		return err
	f.store_string(json)
	f.close()
	save_written.emit(slot)
	return OK


func delete_slot(slot: int) -> void:
	_assert_slot(slot)
	var path := slot_path(slot)
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)
	var bak := backup_path(slot)
	if FileAccess.file_exists(bak):
		DirAccess.remove_absolute(bak)
	if current_slot == slot:
		current = null
		current_slot = -1


func can_save_now() -> bool:
	return current != null and current_slot >= 1 and not current.in_battle


func _accrue_playtime() -> void:
	if current == null:
		return
	var now := Time.get_ticks_usec()
	var delta := float(now - _session_started_usec) / 1_000_000.0
	current.playtime_sec += maxf(delta, 0.0)
	_session_started_usec = now


func _read_file(path: String) -> SaveData:
	var text := FileAccess.get_file_as_string(path)
	if text.is_empty():
		return null
	var parsed: Variant = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		return null
	return SaveData.from_dict(parsed)


func _install_root() -> String:
	# Editor / project play: repo root is parent of res://
	if OS.has_feature("editor"):
		var game_dir := ProjectSettings.globalize_path("res://").trim_suffix("/")
		return game_dir.get_base_dir()
	# Exported binary: folder next to the executable
	return OS.get_executable_path().get_base_dir()


func _portable_flag_path() -> String:
	return _install_root().path_join(PORTABLE_FLAG)


func _assert_slot(slot: int) -> void:
	assert(slot >= 1 and slot <= SLOT_COUNT, "Save slot out of range")
