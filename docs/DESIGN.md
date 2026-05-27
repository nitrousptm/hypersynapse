# HYPERSYNAPSE — Design Notes

Living document. Owned by Director / Timeline Agent; edited by the Concept and Shader agents.

## Concept (working)

A descent through a synthetic mind. The viewer travels from raw electrical
signal into structured cognition: neurons fire, geometric latticeworks
crystallize, abstract dream-states bloom, and the demo collapses back into
a single point of light. Cyberpunk surface — neon, scanlines, holographic
glitch — over a geometric/abstract substrate (SDF lattices, voronoi
networks, ray-marched volumes).

## Three-Act Structure (8:00)

| Act | Length | Title             | Mood             | Primary Technique |
|----:|-------:|-------------------|------------------|-------------------|
| I   |  2:15  | Boot / Synapse    | birth, electric  | SDF + particles   |
| II  |  3:30  | Lattice / City    | structure, drive | raymarched city   |
| III |  2:15  | Bloom / Collapse  | overload, peace  | volumetrics + IFS |

Beat-1 (Act I→II) at ~2:15. Drop (Act II climax) at ~4:30. Collapse at ~5:45.

## Tech Budget

- Raymarched SDFs as primary geometry primitive.
- Compute-shader particle systems (up to 4M particles on 5090, scaled down via instance count on 3090).
- Volumetric ray-march in Act III (cheap on 5090, may halve internal res on 3090).
- Post FX: bloom, chromatic aberration, scanlines, film grain, vignette.
- Optional: hardware-accelerated raytracing extension probe (`GL_NV_ray_tracing`); fall back gracefully.

## Quality Strategy (RTX 3090 fallback)

No quality presets. Single render pipeline. On 3090 we accept lower framerate (45–55 fps) per Udo's call.
If we ship something genuinely punishing, we'll add a single `--low` runtime flag, no menu.

## Open Questions for Agents

- Music BPM target? DnB usually 170–175. Locks beat-grid for visual sync.
- Track structure: do we author music first and cut to it, or design visual timing first?
- Capture/replay: do we ship a 60fps WebM render alongside the exe? (Demoscene tradition: yes.)
