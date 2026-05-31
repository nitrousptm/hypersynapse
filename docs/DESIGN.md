# SINGULARITY GARDEN — Design Notes

Living document. Owned by demo_director.

## Concept

A superintelligent AI awakens and begins rewriting reality into organic mathematical structures.
Cities fracture into fractals. Light becomes physical. Geometry grows like plants.
Time loses linearity. The universe transforms into a single living mathematical entity.

Tone arc: **dystopian → surreal → transcendent**

Style fusion:
- hard sci-fi brutalism (Act 1–2)
- sacred geometry / procedural organics (Act 3)
- cosmic horror beauty / recursive infinity (Act 3–4)

Signature Effect: **Recursive Universes** — worlds within worlds.
Holy-shit moment: camera zooms out of a universe that is a particle in a larger universe.

## Four-Act Structure (4:00 / 240s)

| Act | Duration   | Title         | Mood                        |
|----:|:----------:|---------------|----------------------------|
| I   | 0:00–0:45  | BOOT          | Cold, minimal, tension      |
| II  | 0:45–1:45  | INFECTION     | Loss of control, fracture   |
| III | 1:45–3:00  | ASCENSION     | Beautiful, overwhelming     |
| IV  | 3:00–4:00  | TRANSCENDENCE | Cosmic, emotional, gigantic |

## Scene Map (7 Scenes)

| Scene | Time      | Title                     | Act | Primary Technique              |
|------:|:---------:|---------------------------|-----|-------------------------------|
| 1     | 0:00–0:18 | Black Void Startup        | I   | Fullscreen: hex grid, CRT     |
| 2     | 0:18–0:45 | Awakening Core            | I   | SDF monolith + particles      |
| 3     | 0:45–1:15 | City Corruption           | II  | Polygon meshes + displacement |
| 4     | 1:15–1:45 | Time Fracture             | II  | Feedback + temporal reprojection |
| 5     | 1:45–2:30 | Geometry Bloom            | III | Raymarched fractals + volumetrics |
| 6     | 2:30–3:00 | Impossible Space          | III | **SIGNATURE**: Recursive universes |
| 7     | 3:00–4:00 | Singularity Garden        | IV  | Cosmic instancing + final logo |

## Scene Details

### Scene 1 — Black Void Startup (0:00–0:18)
- Black void with single white debug lines, GPU-style hex grids
- CRT noise overlay, floating numeric glyphs, scanlines
- Chromatic aberration very subtle
- First kick at 0:18 triggers Scene 2 cut
- Camera: static, slowly drifting

### Scene 2 — Awakening Core (0:18–0:45)
- Giant geometric monolith (polygon mesh) materializes from particles
- Procedural surface growth via vertex displacement shader
- Volumetric fog around base
- Beat-synced particle bursts from surface
- Monolith "opens" impossibly at 0:45 → Act II cut

### Scene 3 — City Corruption (0:45–1:15)
- Brutalist megacity rendered with instanced polygon buildings
- Geometry shader extrusions on facades
- Vertex displacement: buildings start warping to mathematical shapes
- Light arteries spread through city grid
- Camera: fast FPV flights through canyons
- Transition: buildings dissolve into mathematical forms at 1:15

### Scene 4 — Time Fracture (1:15–1:45)
- Same explosion played at 3 different time offsets simultaneously
- Frozen debris fields in space
- Reversed particle simulation streams
- Recursive mirror portals
- Reprojection feedback buffer abuse
- Camera: flies through frozen time fragments

### Scene 5 — Geometry Bloom (1:45–2:30)
- Reality becomes organic: raymarched fractal flowers, SDF temples
- Kaleidoscopic spaces, living light structures
- Procedural animation: geometry pulsing to music
- Volumetric light scattering through fractal structures
- Emotional musical peak

### Scene 6 — Impossible Space (2:30–3:00) *** SIGNATURE ***
- Non-euclidean space: rooms fold into themselves
- 4D-like rotation effects
- Portal rendering: recursive FBO capture (3 depth levels)
- Rooms within light beams
- **HOLY-SHIT MOMENT at 2:50**: Camera zooms out from universe → universe is a particle in larger universe
- Shader-based space warping, impossible topology

### Scene 7 — Singularity Garden (3:00–4:00)
- Entire reality becomes fractal
- Massive GPU instancing: stars, nebulae, geometric structures
- Particle fluid: light grows like plants
- Final 10s: complete silence → single light pulse → SINGULARITY GARDEN logo
- Logo: all previous scene data streams converge as typography
- Camera: slow pullback to infinite distance

## Color Palette

| Act | Primary  | Secondary | Highlight |
|-----|----------|-----------|-----------|
| I   | #000000  | #0a0a12   | #e8e8ff   |
| II  | #0d1117  | #1a2030   | #00aaff   |
| III | #050020  | #200050   | #ff40ff   |
| IV  | #000508  | #001020   | #ffffff   |

Progression: near-black → electric blue → magenta/violet → pure white

## Tech Stack

- **API**: OpenGL 4.6 Core + Compute Shaders
- **Language**: C++20
- **Geometry**: Polygon meshes (procedural, runtime-generated) + SDF raymarching hybrid
- **Particles**: GPU compute shader, 32k–1M pool
- **Audio**: miniaudio, 133 BPM, `assets/music/Concrete-Syncope.wav`
- **Post FX**: ACES tonemapping, bloom, chromatic aberration, scanlines, vignette
- **Recursive rendering**: Dual FBO pingpong for Scene 6 portal effect

## Music

- **File**: `assets/music/Concrete-Syncope.wav`
- **BPM**: 133
- **Beat**: 0.45113s | **Bar**: 1.80451s
- **Style**: Industrial Ambient / Cinematic Neurobass
- **References**: Carbon Based Lifeforms, Noisia, Mick Gordon, Rival Consoles
- **Key cues**: First kick 0:18 | Bass drop 0:45 | Emotional peak 1:45 | Climax 2:50 | Silence 3:50

## Mesh Architecture

All geometry generated procedurally at runtime — no external asset files.

| Mesh          | Generator                              | Used In |
|---------------|----------------------------------------|---------|
| MonolithMesh  | Box + subdivision + displacement       | Scene 2 |
| BuildingMesh  | Instanced box extrusions (1000+ inst.) | Scene 3 |
| CityGrid      | Procedural street/block layout         | Scene 3 |
| Particles     | GPU compute (no CPU mesh)              | All     |
| Fractals      | SDF raymarching (no mesh)              | 5–7     |

## Resolved Decisions

| Question          | Decision                                               |
|-------------------|-------------------------------------------------------|
| API               | OpenGL 4.6 (Assembly-compatible, saves vs Vulkan)     |
| Signature effect  | Recursive Universes (Scene 6)                         |
| Music             | Concrete-Syncope.wav, 133 BPM (Industrial Ambient — NOT DnB) |
| Polygon models    | Procedural runtime generation, no external files      |
| Geometry hybrid   | Polygon for architecture, SDF for organic/fractal     |
| Quality fallback  | No presets; RTX 3090 accepted at 45–55 fps            |
| Music BPM         | 133 BPM locked — Neurobass/Cinematic Industrial (DnB rejected) |
| Track structure   | Visuals-first approach: scenes designed, then music mapped to them |
| Capture/replay    | WebM VP9 60fps via ffmpeg two-pass; validate_webm.sh provided |
| Particle camera   | Per-scene orbit camera; particles use 3D world space  |
| Bloom pipeline    | Dual-layer Gaussian (tight 0.4r + wide 1.0r) for cinematic halo |
| Lens flare        | Beat-sync, Acts II–III only — fades out before finale  |
| Scene 5 god rays  | Dual-source HG volumetric (32 dithered steps, SDF soft shadow, beat-surge) |
| Scene 6 zoom blur | Radial zoom blur in post FX at scene_norm 0.78–0.98 (holy-shit moment) |
| Scene 7 galaxy    | 6-layer starfield + galactic plane (dust + HII regions) + large emission nebula |
| Scene 6 SDF march | Portal type detection moved inside surface hit only — eliminates ~180 redundant SDF evals/pixel (29 May) |
| Normal estimation | Tetrahedron method (4 SDF evals vs 6 central-diff) in all SDF scenes: 2, 5, 6 |
| Capture timing    | Deterministic: frame_count/60Hz instead of wall-clock — guarantees 14,400 frames (29 May) |
| Scene 7 logo seq  | 12 data streams (vs 6), per-stream width variation; two-layer glow; breathing pulse; separator + credit dots (29 May) |
| Scene crossfades  | GL_CONSTANT_ALPHA blend (not GL_SRC_ALPHA) + pre-boundary only window — actual smooth 0.6s fades, no more hard cuts (30 May) |
| Scene 5→6 crossfade portals | Portal FBOs pre-rendered during cross-fade window so Scene 6 shows live recursive portals (not black stale FBOs) during transition (30 May eve) |
| Galaxy spiral (Scene 6) | cos^10 2-arm spiral replaces abs(sin) 4-arm artifact — proper Milky-Way shape for the holy-shit zoom-out (30 May eve) |
| Tendril SDF (Scene 7) | sdSeg2D line-segment SDF in tendril() — correct tube glow instead of point-glow chain; origin-relative growth (30 May eve) |
| Scene 4 portal interiors | portal_interior() samples prev_frame through each ring with unique time-offset tint + Y-flip — portals now show actual time-shifted scene content, not just decorative rings (30 May night) |
| SUBMISSION.md music path | Corrected to assets\music\Concrete-Syncope.wav (was wrong assets\music.wav) (30 May night) |
| Scene 6 outer universe | 3 distinct galaxies in cosmic_particles(): Milky-Way (bluish-violet), Andromeda companion (reddish-orange), edge-on sliver streak + faint intergalactic filament between them (31 May) |
| Scene 6 universe-particle | Shrunken universe now shows a spiral galaxy structure + concentric pulse rings emanating outward — sells "it IS a universe" identity (31 May) |
| Scene 6 reality-fracture flash | Brief white burst at scene_norm 0.80 marks the exact zoom transition — sharpens the wow-moment onset (31 May) |
| Post FX beat-vignette | Vignette tightens on strong kicks (Acts II/III): vig_str += kick * 0.6 — heartbeat compression effect (31 May) |
| Post FX dither | Triangular dither (1/255 amplitude, 2-sample triangle distribution) added after ACES tonemap — eliminates banding in dark areas (31 May) |
| Scene 2 normal estimation | calc_normal() upgraded to tetrahedron method (4 SDF evals) — was still using central differences despite DESIGN.md claiming fix (31 May morning) |
| Scene 3 rain atmosphere | Post FX rain streaks (12 vertical dashes, city-light electric blue): dystopian megacity atmosphere; intensity driven by kick, fades as buildings dissolve into math (31 May morning) |
| Scene 5 kaleidoscope sky | 6-fold azimuthal mirror applied to sky_background rd (blends in from scene_norm 0.38→0.60): aurora curtains + nebula fold into symmetric mandala backdrop — proper kaleidoscopic spaces as per design intent (31 May morning) |

## Implementation Status (31 May 2026 — afternoon)

### Completed Systems

| System | Status | Notes |
|--------|--------|-------|
| Post FX chain | ✅ Complete | ACES + dual-layer bloom + lens flare + CA + radial zoom blur + scanlines + grain + vignette |
| Scene shaders (all 7) | ✅ Complete | Boot Void → Transcendence fully implemented + bug fixes (29 May) |
| Signature Scene 6 | ✅ Complete | Recursive portal FBOs, holy-shit zoom-out at 2:50; glow offset fixed + richer star field + radial zoom post FX |
| SDF raymarching | ✅ Complete | sdf_lib.glsl shared library, used in scenes 2, 5, 6 |
| Scene 5 Volumetrics | ✅ Upgraded | Dual-source HG god rays, 32 dithered steps, SDF soft shadow, beat-surge (29 May) |
| Scene 7 Galaxy | ✅ Upgraded | 6-layer starfield + galactic plane (dust lanes + HII regions) + large emission nebula (29 May) |
| Particle system | ✅ Complete | Compute shader physics, beat-sync, act-specific behaviors |
| Particle render | ✅ Complete | Soft glow sprites, velocity-based brightness, act-aware color |
| Audio integration | ✅ Complete | miniaudio, Concrete-Syncope.wav playback |
| Mesh pipeline | ✅ Complete | Procedural city (scene 3), buildings + instancing |
| Timeline | ✅ Complete | 133 BPM beat tracking, 4 acts, 7 scenes, cue system |
| Capture mode | ✅ Complete | PPM frame sequence + ffmpeg WebM encode |
| Debug stats | ✅ Complete | FPS/frame time overlay, beat counter |
| Build scripts | ✅ Complete | build.sh (Linux/macOS) + build_windows.ps1 (MSVC) |
| Logo SDF (Scene 7) | ✅ Refined | Proper arc-based S + G letter forms (29 May); replaced rough placeholders |
| Scene 4 Feedback | ✅ Fixed | Reprojection feedback UV bug fixed (was sampling top-right quadrant only) |
| Scene 6 march perf | ✅ Optimized | Portal SDF type detection moved inside d<SURF_DIST — ~180 evals/pixel saved (29 May eve) |
| Normal estimation | ✅ Optimized | Tetrahedron method (4 SDF evals) in all SDF scenes: 2, 5, 6 — Scene 2 upgraded 29 May night |
| Capture timing fix | ✅ Fixed | frame_count/60.0 in capture mode — deterministic 14,400 frames guaranteed (29 May eve) |
| Scene 7 logo polish | ✅ Complete | 12 streams, two-layer glow, breathing pulse, separator line, credit dot row (29 May eve) |
| Scene 4 particles | ✅ Added | Frozen debris field: 28/beat, near-zero velocity (0.018), blue↔orange palette (29 May night) |
| Capture progress | ✅ Added | --capture prints % + frame/14400 counter every 5s demo time (29 May night) |
| Scene crossfades | ✅ Fixed | Two bugs: GL_SRC_ALPHA→GL_CONSTANT_ALPHA (alpha=1 caused hard cuts); pre-boundary-only window (sc+1 pointed at wrong scene post-flip). Now: smooth 0.6s crossfades between all 7 scenes (30 May) |
| Scene 7 credit dots | ✅ Fixed | Overlap bug: group 2 was starting inside group 1's x-range. Both groups now centered symmetrically at ±0.28 with 0.074 clear gap + staggered appear animation (30 May) |
| Scene 6 particles | ✅ Added | Portal particle emission: 40 inward-spiraling cyan/violet fragments per beat — sells the "quantum things falling into portals" feel (30 May) |
| Scene 5→6 crossfade | ✅ Fixed | Portal FBOs now pre-rendered during crossfade — recursive portals show correctly throughout the 0.6s transition (30 May eve) |
| Scene 6 galaxy spiral | ✅ Improved | True 2-arm logarithmic spiral via cos^10 — eliminates 4-arm abs(sin) artifact; dusty arm tints + brighter galactic core (30 May eve) |
| Scene 7 tendrils | ✅ Fixed | Proper line-segment SDF (sdSeg2D) — tendrils have correct tube thickness; removed dead d_line variable; grow from origin outward (30 May eve) |
| Scene 4 portals | ✅ Upgraded | portal_interior() adds actual time-shifted prev_frame content inside each ring: Y-flipped, colour-tinted per portal, edge-faded — true "windows into other timeframes" (30 May night) |
| Scene 6 outer universe | ✅ Upgraded | 3 galaxies (Milky-Way, Andromeda companion, edge-on sliver) + intergalactic filament — richer "cluster of universes" reveal during zoom-out (31 May) |
| Scene 6 universe-particle | ✅ Upgraded | Shrunken universe shows spiral structure + 3 concentric pulse rings + bright nucleus — identity as a universe is unmistakable (31 May) |
| Scene 6 reality-fracture | ✅ Added | White flash burst at scene_norm 0.80 sharpens the zoom-transition onset (31 May) |
| Post FX beat vignette | ✅ Added | Beat-driven vignette compression (kick * 0.6) in Acts II/III — heartbeat feel (31 May) |
| Post FX dither | ✅ Added | Triangular dither 1/255 after ACES — eliminates dark-area banding (31 May) |
| Scene 5 sky | ✅ Upgraded | Replaced 2-line gradient with: proper 3-layer magenta/violet starfield + twinkle + aurora curtains (2 swaying bands, beat-pulse, scene_norm fade-in) + dual-scale nebula haze — matches Act III color palette (31 May) |
| Scene 2 normal estimation | ✅ Fixed | Tetrahedron method (4 evals) in calc_normal() — code was still central-differences despite DESIGN.md claim (31 May morning) |
| Scene 3 rain atmosphere | ✅ Added | 12 vertical rain streak dashes in post.frag (scene_idx==2): electric-blue city-light catch, kick-driven intensity, fade with scene_norm (31 May morning) |
| Scene 5 kaleidoscope sky | ✅ Added | 6-fold azimuthal mirror on sky background rd, blends in at scene_norm 0.38→0.60 — aurora + nebulae fold into symmetric mandala (31 May morning) |
| Scene 4 crack lines | ✅ Added | Glowing spacetime fracture cracks: fracture_arm() grows 7 branching segments from 3 impact sites; electric-blue (#1e74ff) + white-hot core on beat; spread driven by scene_norm — sells "time breaking apart" literally (31 May afternoon) |

### Outstanding for Submission

| Task | Priority | Notes |
|------|----------|-------|
| Windows RTX compile test | 🔴 Critical | Needs MSVC + RTX 3090/5090 machine |
| 4-minute runtime validation | 🔴 Critical | Audio sync + full run-through |
| WebM capture test | 🔴 Critical | 14,400 frames @ 60fps (240s × 60) |
| nfo file | ✅ Done | SINGULARITY_GARDEN.nfo created (28 May 2026) |
| Assembly portal upload | 🟡 Required | Before Assembly submission deadline |
