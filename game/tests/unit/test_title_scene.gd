extends GutTest


func test_title_scene_instantiates() -> void:
	var packed := load("res://scenes/boot/title.tscn")
	assert_not_null(packed)
	var scene: Node = packed.instantiate()
	add_child_autofree(scene)
	assert_true(scene is Control)
	var title: Label = scene.get_node("%TitleLabel")
	assert_eq(title.text, "AETHERA")


func test_camp_scene_instantiates() -> void:
	var packed := load("res://scenes/camp/camp_stub.tscn")
	assert_not_null(packed)
	var scene: Node = packed.instantiate()
	add_child_autofree(scene)
	assert_true(scene is Control)
