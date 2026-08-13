class_name BattleRng
extends RefCounted
## Seeded RNG. Same seed + same call sequence = same fight.

var _rng: RandomNumberGenerator
var seed_value: int = 0
var call_count: int = 0


func _init(p_seed: int = 1) -> void:
	reseed(p_seed)


func reseed(p_seed: int) -> void:
	seed_value = p_seed
	call_count = 0
	_rng = RandomNumberGenerator.new()
	_rng.seed = p_seed


func next_int(n: int) -> int:
	call_count += 1
	if n <= 1:
		return 0
	return _rng.randi_range(0, n - 1)


func next_bool() -> bool:
	return next_int(2) == 0


## 16 buckets: 0.85, 0.86, …, 1.00
func damage_roll() -> float:
	return float(85 + next_int(16)) / 100.0


## percent 0–100. 0 never, 100 always, no extra roll.
func chance_pct(percent: int) -> bool:
	if percent <= 0:
		return false
	if percent >= 100:
		return true
	return next_int(100) < percent
