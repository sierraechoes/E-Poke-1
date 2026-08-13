# AETHERA data

JSON is the source of truth. IDs are slugs and never reused.

```
data/type_chart.json     optional overrides; code has the locked chart
data/species/*.json
data/moves/*.json
data/abilities/*.json
data/items/*.json
data/fields/*.json
```

`DataRegistry` loads these at boot and refuses duplicate / unknown-type / missing-move learnsets.
