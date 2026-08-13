extends Node
## Owns input actions so overworld / battle / menus never fight.
## Autoload: InputRouter

const ACTION_ACCEPT := &"accept"
const ACTION_CANCEL := &"cancel"
const ACTION_MENU := &"menu"
const ACTION_UP := &"ui_up"
const ACTION_DOWN := &"ui_down"
const ACTION_LEFT := &"ui_left"
const ACTION_RIGHT := &"ui_right"
const ACTION_RUN := &"run"
const ACTION_PAUSE := &"pause"

var _owner_id: StringName = &"none"


func _ready() -> void:
	_ensure_actions()


func push_owner(id: StringName) -> void:
	_owner_id = id


func pop_owner(id: StringName) -> void:
	if _owner_id == id:
		_owner_id = &"none"


func current_owner() -> StringName:
	return _owner_id


func is_owner(id: StringName) -> bool:
	return _owner_id == id


func just_accept() -> bool:
	return Input.is_action_just_pressed(ACTION_ACCEPT)


func just_cancel() -> bool:
	return Input.is_action_just_pressed(ACTION_CANCEL)


func just_pause() -> bool:
	return Input.is_action_just_pressed(ACTION_PAUSE)


func _ensure_actions() -> void:
	_add_key(ACTION_ACCEPT, [KEY_ENTER, KEY_KP_ENTER, KEY_Z, KEY_SPACE])
	_add_joy(ACTION_ACCEPT, JOY_BUTTON_A)
	_add_key(ACTION_CANCEL, [KEY_ESCAPE, KEY_X, KEY_BACKSPACE])
	_add_joy(ACTION_CANCEL, JOY_BUTTON_B)
	_add_key(ACTION_MENU, [KEY_TAB])
	_add_key(ACTION_RUN, [KEY_SHIFT])
	_add_joy(ACTION_RUN, JOY_BUTTON_LEFT_SHOULDER)
	_add_key(ACTION_PAUSE, [KEY_ESCAPE, KEY_P])
	_add_joy(ACTION_PAUSE, JOY_BUTTON_START)
	# Built-in ui_* already exist for arrows / dpad.


func _add_key(action: StringName, keys: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	for k in keys:
		var ev := InputEventKey.new()
		ev.physical_keycode = k
		if not _has_event(action, ev):
			InputMap.action_add_event(action, ev)


func _add_joy(action: StringName, button: int) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	var ev := InputEventJoypadButton.new()
	ev.button_index = button
	if not _has_event(action, ev):
		InputMap.action_add_event(action, ev)


func _has_event(action: StringName, ev: InputEvent) -> bool:
	for existing in InputMap.action_get_events(action):
		if existing.as_text() == ev.as_text():
			return true
	return false
