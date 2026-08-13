extends Control
## P00 title: New / Continue / Load / offline save slots.

enum Mode { ROOT, NEW_SLOT, NEW_DIFF, LOAD, MESSAGE }

const DIFF_IDS := ["story", "tactician", "iron"]
const DIFF_LABELS := [
	"Story  —  generous, still a game",
	"Tactician  —  honest fights",
	"Iron  —  sealed Echoes stay sealed",
]

@onready var _title: Label = %TitleLabel
@onready var _subtitle: Label = %SubtitleLabel
@onready var _version: Label = %VersionLabel
@onready var _offline: Label = %OfflineLabel
@onready var _save_path: Label = %SavePathLabel
@onready var _menu: VBoxContainer = %Menu
@onready var _hint: Label = %HintLabel

var _mode: Mode = Mode.ROOT
var _root_items: Array[String] = []
var _cursor: int = 0
var _pending_slot: int = 1
var _buttons: Array[Button] = []
var _message: String = ""


func _ready() -> void:
	InputRouter.push_owner(&"title")
	_title.text = GameVersion.TITLE
	_subtitle.text = "Listen.  The Reach still answers."
	_version.text = GameVersion.label()
	_offline.text = "OFFLINE  ·  no account  ·  no ROM"
	_save_path.text = "Saves: " + SaveService.get_saves_dir()
	_rebuild_root()
	_render()


func _exit_tree() -> void:
	InputRouter.pop_owner(&"title")


func _unhandled_input(event: InputEvent) -> void:
	if not InputRouter.is_owner(&"title"):
		return
	if event.is_action_pressed("ui_down"):
		_move(1)
		accept_event()
	elif event.is_action_pressed("ui_up"):
		_move(-1)
		accept_event()
	elif event.is_action_pressed("accept"):
		_activate()
		accept_event()
	elif event.is_action_pressed("cancel"):
		_back()
		accept_event()


func _move(delta: int) -> void:
	if _buttons.is_empty():
		return
	_cursor = posmod(_cursor + delta, _buttons.size())
	_buttons[_cursor].grab_focus()


func _activate() -> void:
	if _buttons.is_empty():
		return
	_buttons[_cursor].emit_signal("pressed")


func _back() -> void:
	if _mode == Mode.ROOT:
		return
	_mode = Mode.ROOT
	_rebuild_root()
	_render()


func _rebuild_root() -> void:
	_root_items.clear()
	if SaveService.has_any_save():
		_root_items.append("Continue")
	_root_items.append("New File")
	_root_items.append("Load File")
	_root_items.append("Where are my saves?")
	if OS.get_name() != "Web":
		_root_items.append("Quit")


func _render() -> void:
	for c in _menu.get_children():
		c.queue_free()
	_buttons.clear()
	_cursor = 0
	match _mode:
		Mode.ROOT:
			_hint.text = "Z / Enter  confirm    X / Esc  back    arrows  move"
			for item in _root_items:
				_add_btn(item, _on_root.bind(item))
		Mode.NEW_SLOT:
			_hint.text = "Choose a file. Occupied files will be overwritten."
			for i in range(1, SaveService.SLOT_COUNT + 1):
				_add_btn(_slot_label(i), _on_pick_new_slot.bind(i))
			_add_btn("Back", _back)
		Mode.NEW_DIFF:
			_hint.text = "Difficulty is stored on this file. You can lower it later."
			for i in DIFF_IDS.size():
				_add_btn(DIFF_LABELS[i], _on_pick_diff.bind(DIFF_IDS[i]))
			_add_btn("Back", _back)
		Mode.LOAD:
			_hint.text = "Load a file from this folder."
			var any := false
			for i in range(1, SaveService.SLOT_COUNT + 1):
				if SaveService.has_slot(i):
					any = true
					_add_btn(_slot_label(i), _on_load_slot.bind(i))
			if not any:
				_add_btn("No files yet", _back)
			_add_btn("Back", _back)
		Mode.MESSAGE:
			_hint.text = _message
			_add_btn("OK", _back)
	await get_tree().process_frame
	if _buttons.size() > 0:
		_buttons[0].grab_focus()


func _add_btn(text: String, cb: Callable) -> void:
	var b := Button.new()
	b.text = text
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.custom_minimum_size = Vector2(420, 28)
	b.pressed.connect(cb)
	_menu.add_child(b)
	_buttons.append(b)


func _slot_label(slot: int) -> String:
	var data: SaveData = SaveService.peek_slot(slot)
	if data == null:
		return "File %d  —  empty" % slot
	return "File %d  —  %s" % [slot, data.summary_line()]


func _on_root(item: String) -> void:
	match item:
		"Continue":
			var data := SaveService.continue_latest()
			if data:
				_enter_game()
			else:
				_show_msg("Nothing to continue.")
		"New File":
			_mode = Mode.NEW_SLOT
			_render()
		"Load File":
			_mode = Mode.LOAD
			_render()
		"Where are my saves?":
			var kind := "portable folder" if SaveService.is_portable() else "OS user data"
			_show_msg("Saves are %s:\n%s\nCopy the whole AETHERA folder to keep progress offline." % [
				kind, SaveService.get_saves_dir()
			])
		"Quit":
			get_tree().quit()


func _on_pick_new_slot(slot: int) -> void:
	_pending_slot = slot
	_mode = Mode.NEW_DIFF
	_render()


func _on_pick_diff(diff: String) -> void:
	var data := SaveService.new_game(_pending_slot, diff, "Attuner")
	if data == null:
		_show_msg("Could not write the file. Check that the saves folder is writable.")
		return
	_enter_game()


func _on_load_slot(slot: int) -> void:
	var data := SaveService.load_slot(slot)
	if data:
		_enter_game()
	else:
		_show_msg("Could not read that file.")


func _show_msg(text: String) -> void:
	_message = text
	_mode = Mode.MESSAGE
	_render()


func _enter_game() -> void:
	get_tree().change_scene_to_file("res://scenes/camp/camp_stub.tscn")
