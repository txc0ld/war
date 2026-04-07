# Character Asset Credits

## `soldier.glb`

**Source:** [three.js examples](https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Soldier.glb)
**License:** MIT (via the three.js project)
**Original character:** Mixamo "Vanguard by T. Choonyung"

Single-mesh rigged soldier (~2 MB) with four embedded animations:
- `Idle` (looped)
- `Walk` (looped)
- `Run` (looped)
- `TPose` (reference)

Loaded via PlayCanvas's container loader and driven by the OpponentRenderer's
animation state machine — Idle when stationary, Run when moving above
0.5 m/s.
