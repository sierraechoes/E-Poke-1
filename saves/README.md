# Saves (portable)

This folder holds your AETHERA save slots when `portable.flag` exists in the project root.

| File | Meaning |
|---|---|
| `slot_1.json` | File 1 |
| `slot_2.json` | File 2 |
| `slot_3.json` | File 3 |
| `slot_N.bak.json` | Previous copy, rotated on each save |

The game never needs a network connection to save or load.

You can copy this whole project folder to a USB drive and keep playing offline. Progress travels with the folder.

Do not edit JSON by hand unless you know the schema (`SaveData` in `game/src/save/save_data.gd`). Always quit the game first.
