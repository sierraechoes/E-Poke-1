extends Control
## Temporary hub so P00 can prove save / load without an overworld.

@onready var _body: RichTextLabel = %Body
@onready var _status: Label = %Status

var _flash: String = ""


func _ready() -> void:
	InputRouter.push_owner(&"camp")
	# Title is responsible for new_game / load_slot. Do not create files here
	# (tests instantiate this scene).
	_refresh()


func _exit_tree() -> void:
	InputRouter.pop_owner(&"camp")


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("accept") or (event is InputEventKey and event.pressed and event.physical_keycode == KEY_S):
		_do_save()
		accept_event()
	elif event.is_action_pressed("cancel") or event.is_action_pressed("pause"):
		_do_save()
		get_tree().change_scene_to_file("res://scenes/boot/title.tscn")
		accept_event()


func _process(delta: float) -> void:
	if SaveService.current:
		SaveService.current.playtime_sec += delta
		if int(SaveService.current.playtime_sec) % 2 == 0:
			_refresh_status()


func _do_save() -> void:
	var err := SaveService.save_current()
	if err == OK:
		_flash = "Saved file %d." % SaveService.current_slot
	else:
		_flash = "Save failed."
	_refresh()


func _refresh() -> void:
	var d: SaveData = SaveService.current
	if d == null:
		_body.text = "No file loaded."
		return
	_body.text = "\n".join([
		"[b]Field Camp[/b]  —  the Reach is not open yet.",
		"",
		"Attuner   %s" % d.player_name,
		"File      %d" % d.slot_id,
		"Practice  %s" % d.difficulty.capitalize(),
		"Reeds     %d" % d.reeds,
		"Notes     %s" % d.notes,
		"",
		"Almanac   %d Echoes, %d moves  ·  %s" % [
			DataRegistry.species_count(),
			DataRegistry.move_count(),
			"data clean" if DataRegistry.is_clean() else "DATA ERRORS",
		],
		"",
		"Saves live on this machine, in this folder:",
		"%s" % SaveService.get_saves_dir(),
		"",
		"Portable: %s" % ("yes — copy the whole folder" if SaveService.is_portable() else "no — OS user data"),
		"",
		"[S] or Z / Enter   save now",
		"[Esc / X]          save and return to title",
	])
	_refresh_status()


func _refresh_status() -> void:
	var d: SaveData = SaveService.current
	if d == null:
		return
	var mins := int(d.playtime_sec) / 60
	var secs := int(d.playtime_sec) % 60
	var extra := ("  ·  " + _flash) if _flash != "" else ""
	_status.text = "Session  %d:%02d%s" % [mins, secs, extra]
