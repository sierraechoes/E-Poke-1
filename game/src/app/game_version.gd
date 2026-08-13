extends Node
## Build identity. Autoload: GameVersion

const VERSION := "0.3.0-p03"
const PHASE := "P03"
const TITLE := "AETHERA"
const CODENAME := "ECHOES"
const ENGINE_PIN := "4.6.3"

func label() -> String:
	return "%s  v%s  ·  %s" % [TITLE, VERSION, PHASE]
