extends Node
## Build identity. Autoload: GameVersion

const VERSION := "0.1.0-p01"
const PHASE := "P01"
const TITLE := "AETHERA"
const CODENAME := "ECHOES"
const ENGINE_PIN := "4.6.3"

func label() -> String:
	return "%s  v%s  ·  %s" % [TITLE, VERSION, PHASE]
