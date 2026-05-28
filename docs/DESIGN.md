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

## Resolved Decisions (2026-05-28)

| Question | Decision | Rationale |
|---|---|---|
| Music BPM | **174 BPM** | Classic DnB tempo. Clean 8-bar phrases = 11.03 s, lines up with act cuts at 135 s (≈12.25 bars). Beat grid hard-coded in `timeline.h`. |
| Track structure | **Visuals first, music cuts to timeline** | Demo timing must be deterministic for Assembly submission. Composer receives the three-act time map and cuts to it. |
| Capture / replay | **Yes — ship `--capture` flag for WebM 60fps** | Demoscene tradition. Will headless-render via offscreen FBO + ffmpeg pipe. Flag TBD in a later session. |

## Implementation Status (2026-05-28 06:55)

### Audio Integration ✅ DONE
- **miniaudio** engine initialized (48 kHz, stereo)
- Play/seek/position() methods implemented
- Timeline-synchronized playback ready (174 BPM hard-coded in timeline.h)
- Command-line audio path: `./build/hypersynapse track.wav`
- No drift compensation yet (timeline is source of truth; audio position() available for monitoring)

### Open Questions for Agents

- ~~Music BPM target?~~ → **174 BPM** ✅
- ~~Track structure?~~ → **Visuals first** ✅
- ~~WebM capture?~~ → **Yes, `--capture` flag** ✅
- ~~Audio integration?~~ → **miniaudio done** ✅
- Shader `#include` mechanism: add GL_ARB_shading_language_include, or keep shaders self-contained? (current: self-contained)
- Compute-shader particle system: implement as Act I overlay or separate pass? (planned: Act I → II transition)
- Drift compensation: should we sync audio frame to timeline if they diverge >100ms?
