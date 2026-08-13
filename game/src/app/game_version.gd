extends Node
## Build identity. Autoload: GameVersion

const VERSION := "0.2.0-p02"
const PHASE := "P02"
const TITLE := "AETHERA"
const CODENAME := "ECHOES"
const ENGINE_PIN := "4.6.3"

func label() -> String:
	return "%s  v%s  ·  %s" % [TITLE, VERSION, PHASE]
