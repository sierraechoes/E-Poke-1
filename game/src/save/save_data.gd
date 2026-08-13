class_name SaveData
extends RefCounted
## Versioned save payload. Keep this schema additive.

const CURRENT_VERSION := 1
const DIFFICULTIES := ["story", "tactician", "iron", "custom"]

var slot_id: int = 1
var version: int = CURRENT_VERSION
var created_unix: int = 0
var updated_unix: int = 0
var playtime_sec: float = 0.0
var player_name: String = "Attuner"
var difficulty: String = "story"
var scene_id: String = "camp"
var flags: Dictionary = {}
var vars: Dictionary = {}
var party: Array = []
var inventory: Dictionary = {}
var reeds: int = 0
var in_battle: bool = false
var notes: String = ""


static func create_new(slot: int, difficulty_id: String, attuner_name: String) -> SaveData:
	var data := SaveData.new()
	data.slot_id = slot
	data.version = CURRENT_VERSION
	var now := int(Time.get_unix_time_from_system())
	data.created_unix = now
	data.updated_unix = now
	data.playtime_sec = 0.0
	data.player_name = attuner_name.strip_edges()
	if data.player_name.is_empty():
		data.player_name = "Attuner"
	data.difficulty = difficulty_id if difficulty_id in DIFFICULTIES else "story"
	data.scene_id = "camp"
	data.reeds = 200
	data.notes = "License pending."
	return data


func touch() -> void:
	updated_unix = int(Time.get_unix_time_from_system())


func to_dict() -> Dictionary:
	return {
		"slot_id": slot_id,
		"version": version,
		"created_unix": created_unix,
		"updated_unix": updated_unix,
		"playtime_sec": playtime_sec,
		"player_name": player_name,
		"difficulty": difficulty,
		"scene_id": scene_id,
		"flags": flags.duplicate(true),
		"vars": vars.duplicate(true),
		"party": party.duplicate(true),
		"inventory": inventory.duplicate(true),
		"reeds": reeds,
		"in_battle": in_battle,
		"notes": notes,
	}


static func from_dict(raw: Dictionary) -> SaveData:
	var data := SaveData.new()
	data.version = int(raw.get("version", 0))
	data.slot_id = int(raw.get("slot_id", 1))
	data.created_unix = int(raw.get("created_unix", 0))
	data.updated_unix = int(raw.get("updated_unix", 0))
	data.playtime_sec = float(raw.get("playtime_sec", 0.0))
	data.player_name = str(raw.get("player_name", "Attuner"))
	data.difficulty = str(raw.get("difficulty", "story"))
	data.scene_id = str(raw.get("scene_id", "camp"))
	data.flags = raw.get("flags", {}).duplicate(true)
	data.vars = raw.get("vars", {}).duplicate(true)
	data.party = raw.get("party", []).duplicate(true)
	data.inventory = raw.get("inventory", {}).duplicate(true)
	data.reeds = int(raw.get("reeds", 0))
	data.in_battle = bool(raw.get("in_battle", false))
	data.notes = str(raw.get("notes", ""))
	return data


func migrate_if_needed() -> bool:
	## Return false if the file is from a future game we cannot read.
	if version > CURRENT_VERSION:
		return false
	if version < 1:
		return false
	# Future: version 1 -> 2 migrations go here.
	version = CURRENT_VERSION
	return true


func summary_line() -> String:
	var mins := int(playtime_sec) / 60
	return "Lv-file  %s  ·  %s  ·  %dm" % [player_name, difficulty.capitalize(), mins]
