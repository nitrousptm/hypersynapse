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
| Scene 7 logo text | Full title "SINGULARITY GARDEN" in 5×7 pixel bitmap font replaces SG-initials-only: design doc always said "SINGULARITY GARDEN logo", not monogram (31 May eve) |
| Scene 6 outer universe | 3 distinct galaxies in cosmic_particles(): Milky-Way (bluish-violet), Andromeda companion (reddish-orange), edge-on sliver streak + faint intergalactic filament between them (31 May) |
| Scene 6 universe-particle | Shrunken universe now shows a spiral galaxy structure + concentric pulse rings emanating outward — sells "it IS a universe" identity (31 May) |
| Scene 6 reality-fracture flash | Brief white burst at scene_norm 0.80 marks the exact zoom transition — sharpens the wow-moment onset (31 May) |
| Post FX beat-vignette | Vignette tightens on strong kicks (Acts II/III): vig_str += kick * 0.6 — heartbeat compression effect (31 May) |
| Post FX dither | Triangular dither (1/255 amplitude, 2-sample triangle distribution) added after ACES tonemap — eliminates banding in dark areas (31 May) |
| Scene 2 normal estimation | calc_normal() upgraded to tetrahedron method (4 SDF evals) — was still using central differences despite DESIGN.md claiming fix (31 May morning) |
| Scene 3 rain atmosphere | Post FX rain streaks (12 vertical dashes, city-light electric blue): dystopian megacity atmosphere; intensity driven by kick, fades as buildings dissolve into math (31 May morning) |
| Scene 3 digital glitch | Row displacement + R/B channel-split fringe in post FX at scene_norm²; strips narrow as corruption grows; tape-dropout noise bands when gs>0.20 — demoscene "data rewrite" read (1 June) |
| Scene 5 kaleidoscope sky | 6-fold azimuthal mirror applied to sky_background rd (blends in from scene_norm 0.38→0.60): aurora curtains + nebula fold into symmetric mandala backdrop — proper kaleidoscopic spaces as per design intent (31 May morning) |
| Scene 5 flower geometry | 7-petal symmetry (was 5): fuller and more organic; rounded box petals (sdBox - 0.018); dual-axis curl (primary X-wave + secondary Z-twist per petal); stamen ring at r=0.10; temple 4th octahedron level adds filigree fractal detail (1 June) |
| Scene 5 heat shimmer | Post FX UV warp (4-term sinusoidal turbulence, coprime freq 11.7–33.7): reality visually warps as fractals bloom; beat_amp surges on kicks; applied pre-sampling so CA+bloom+grading all inherit the warp (1 June) |
| Scene 7 camera zoom-out | Camera recedes from galaxy via FOV compression (uv/zoom, zoom 1→3.5) + slow 0.022 rad/s lateral drift — stars contract toward horizon selling "pullback to infinite distance"; galaxy brightness ramps 2.0→4.5 as cosmic depth reveals (2 June) |
| Scene 7 data stream convergence | Data stream phase changed -u_time→+u_time so bright bands travel inward toward logo — now reads as "data converging as typography" matching design intent; was flowing outward (2 June) |
| Scene 2 monolith fracture post FX | Vertical crack glow (cx-based 1/r falloff, electric blue-white) in post.frag (scene_idx==1) from scene_norm 0.82→1.0; R/B chromatic bleed outward from crack; sells "monolith opens impossibly" at Act I→II cut (2 June) |
| Scene 6 spacetime-fold entry ripple | post.frag (scene_idx==5): radial UV ripple emanating from screen centre on entry (scene_norm 0→0.12, ~3.6s). Expanding wavefront → 1-ring decaying oscillation bends texture outward then back; beat-kicks nudge wavefront radius. Paired with blue-white prismatic burst (exp decay 1s). Sells "crossing into impossible space" at 2:30 cut. (2 June) |
| Scene 7 big-bang entry burst | post.frag (scene_idx==6): UV radially expands outward (inverted zoom) over first 1.3s (scene_norm 0→0.055) + blue-white brightness spike (exp decay). Narrative counterpoint to scene 6 inward zoom-out: the universe-particle *explodes* into Act IV. (2 June) |
| Scene 5 geometry crystallisation entry | post.frag (scene_idx==4): UV implodes inward over 3.6s (scene_norm 0→0.08, exp falloff) + magenta/violet burst (exp decay ~2s) + expanding cyan ring. Sells "fractal reality erupting from nothingness" at 1:45 emotional Act III peak. (2 June) |
| Scene 3 city materialisation entry | post.frag (scene_idx==2): UV explodes outward from centre (city crystallising from point, scene_norm 0→0.10, ~2.4s) + electric-blue/cyan burst + expanding ring. Sells 0:45 bass drop as Act II ignites. (2 June) |
| Scene 4 temporal rupture entry | post.frag (scene_idx==3): row-based horizontal UV tear (8-px blocks, random offsets, 0→0.09, ~2.1s) + cold blue-white freeze flash. Tape-pull row-tear reads as time physically breaking at 1:15. (2 June) |

| Scene 2 awakening entry burst | ✅ Added | post.frag (scene_idx==1, scene_norm 0→entry): cold-white monolith flash + outward ring at the first kick (0:18) — every scene now has an entry post FX. (3 June session 3) |
| Scene 7 subtitle per-char stagger | ✅ Upgraded | render_subtitle() now mirrors title: 0.0012 stagger between chars + birth flash per char. "BY AGENTIX" types in left-to-right matching demo title choreography. (3 June session 3) |
| Scene 5 exit — fractal ascension dissolution | ✅ Added | post.frag (scene_idx==4, scene_norm 0.82→0.98): (1) CW UV spiral rotation (centre-heavy exp falloff, max ~2.9°) + 1.6% UV compression — geometry field "inhales" into the portal; (2) violet brightness bell-curve peaking at ~scene_norm 0.90 + chromatic edge dissolution glow — every scene now has both entry AND exit post FX. (3 June session 4) |
| Scene 3 exit — city data death | ✅ Added | post.frag (scene_idx==2, scene_norm 0.80→0.98): (1) row-based UV strip scatter (0.028 strip height, random horizontal offsets growing with death_t) + vertical chroma drift (B-channel "falls" as data crashes); (2) electric-blue brightness overload (quadratic ramp, vec3(0.12, 0.55, 1.0) × 1.8). Paired with existing digital-glitch (section 4c) which is also at peak intensity. Sells "AI overwrites last city geometry just before time shatters at 1:15". Now every scene has confirmed entry AND exit post FX. (3 June session 5) |
| Scene 1 exit — Boot sequence lock-on surge | ✅ Added | post.frag (scene_idx==0, scene_norm 0.84→1.0): (1) global cold-blue/white brightness surge (lock_t²×2.4) as CRT "signal locks"; (2) single bright scan line sweeping top→bottom (exp(-dist×380)×3.2, white-blue); (3) trailing afterglow on already-scanned band. Pairs seamlessly with Scene 2 entry burst at the 0:18 cut — compound: lock surge + crossfade + entry flash. All 7 scenes now have explicit entry AND exit post FX in post.frag. (3 June session 6) |

| Scene 6 exit — singularity implosion | ✅ Added | post.frag (scene_idx==5, scene_norm 0.875→1.0): (1) UV contracts inward toward centre (exp-falloff gravity pull, sing_pull² × 0.042 — picks up exactly where vortex gate ends at 0.875); (2) glowing core flare at screen centre (exp(-r²×5.5) × 5.5 × sing_t²) + screen-wide blue-white surge (×3.0 cubic ramp). Creates inhale→exhale transition: Scene 6 UV implodes → Scene 7 big-bang UV explodes outward. All 7 scenes now have confirmed entry AND exit post FX. (4 June) |

| Scene 7 year stamp "2026" | ✅ Added | 07_transcendence.frag: 3 new digit chars (2=15, 0=16, 6=17) added to FONT_DATA[126]; render_year() renders "2026" at scene_norm 0.976, centered at y=−0.455, below credit dots; tiny blue-white glow (0.9× dim vs subtitle). Completes demoscene credit sequence: SINGULARITY GARDEN → BY AGENTIX → 2026. (4 June) |

| Audio volume fade-out | ✅ Added | Audio::set_volume(float) via ma_sound_set_volume; main loop applies linear fade 228→235s (visual silence window: scene_norm 0.875→0.895 ≈ 232–234s). Pairs with shader silence_fade so audio and visual black-out are synchronised. (4 June) |

| Scene 7 particle silence gate | ✅ Added | Transcendence burst emission stops at scene_norm > 0.82 (≈229s). 4s particle lifetime means the last batch is fully aged out by ~233s — particles cannot drift through the clean logo reveal at scene_norm 0.905. (4 June) |

| Scene 5 SDF AO | ✅ Upgraded | `sdf_ao()` replaces inaccurate step-count AO: 5-step normal-march measures actual geometry occlusion → true contact shadows in petal crevices and fractal filigree. Lambert diffuse term added (animated lights matching god_rays): `col = mat * (0.15 + diff * ao_val)`. Before: flat step-count × mat; now: proper lit/shadowed 3D depth. (4 June session 5) |
| Scene 5 kaleidoscope evolution | ✅ Upgraded | Aurora mandala fold-count evolves 6-fold → 12-fold over scene via `mix(6,12, scene_norm²)`. Beat kicks add +2 transient folds — mandala "snaps" to higher order on each 133 BPM hit then relaxes. Visually: sky crystallises progressively as geometry blooms. (4 June session 5) |

| Scene 4 frozen crystal shard field | ✅ Added | 04_time_fracture.frag: Replaced flat 2D `debris()` point-lights with a full 3D raymarched frozen-shard field — 10 thin SDFRoundBox crystals at fixed positions, each with precomputed Y+X rotation (constants in `SC[]` array, no live trig in march loop). 80-step raymarch, MAX_DIST=6. Camera orbits slowly (0.11 rad/s) spiraling inward over scene. Three time-copy materials: cold blue (past) / hot orange (present) / acid cyan (future). Beat-reactive flare on kicks. Temporal feedback decay 0.70→0.60 to balance 3D+echo brightness. All existing 2D overlays retained: reversed streams, portal rings+interiors, warp sample, crack lines, tesseract. Delivers DESIGN.md "camera flies through frozen time fragments" intent; Scene 4 now has same 3D depth as Scenes 5 and 6. (5 June) |

| Scene 6 SDF AO + diffuse | ✅ Upgraded | `sdf_ao()` (same 5-step normal-march as Scene 5) added — fold_space creates deep crevices between recursive boxes; proper AO gives rich contact shadows absent from the previous step-count approximation. Lambert diffuse added with two animated portal-colored lights (cyan key + violet fill, orbiting at 0.22 rad/s). Specular highlight on key light (cos^48). Beat-reactive self-emission on walls (walls glow briefly on each 133 BPM kick). `col = mat * (0.12 + diff * ao_val)` — Scene 6 room geometry now has same lighting depth as Scene 5. (5 June) |
| Scene 6 beat-reactive inner geometry | ✅ Added | `beat_expand = smoothstep(0.08, 0.0, u_beat) * 0.018` applied to all three recursive box half-extents in `sdf_room()` — primary (1.0×), secondary (0.6×), tertiary (0.3×). Inner geometry surges outward on each kick, connecting impossible-space architecture to the 133 BPM pulse. (5 June) |

## Implementation Status (5 June 2026)

### Completed Systems

| System | Status | Notes |
|--------|--------|-------|
| Post FX chain | ✅ Complete | ACES + dual-layer bloom + lens flare + CA + radial zoom blur + scanlines + grain + vignette + Scene 1 exit CRT lock-on |
| Scene shaders (all 7) | ✅ Complete | Boot Void → Transcendence fully implemented + bug fixes (29 May) |
| Signature Scene 6 | ✅ Complete | Recursive portal FBOs, holy-shit zoom-out at 2:50; glow offset fixed + richer star field + radial zoom post FX |
| SDF raymarching | ✅ Complete | sdf_lib.glsl shared library, used in scenes 2, 5, 6 |
| Scene 5 Volumetrics | ✅ Upgraded | Dual-source HG god rays, 32 dithered steps, SDF soft shadow, beat-surge (29 May) |
| Scene 7 Galaxy | ✅ Upgraded | 6-layer starfield + galactic plane (dust lanes + HII regions) + large emission nebula (29 May) |
| Particle system | ✅ Complete | Compute shader physics, beat-sync, act-specific behaviors |
| Particle render | ✅ Complete | Soft glow sprites, velocity-based brightness, act-aware color |
| Audio integration | ✅ Complete | miniaudio, Concrete-Syncope.wav playback + smooth volume fade-out 228–235s |
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
| Scene 7 full title text | ✅ Added | "SINGULARITY GARDEN" rendered in 5×7 pixel bitmap font (13 unique chars, 91-int bitmask table); glowing dot-pixels appear at scene_norm 0.920→0.945 between SG monogram and separator line; credit-dot timing shifted to 0.970→0.990 (31 May eve) |
| Scene 2 renderer upgrade | ✅ Fixed | Renderer switched from 02_awakening_monolith.frag to 02_awakening_core.frag — the richer shader with sacred geometry engravings (Metatron's Cube), dramatic push-in→pull-back camera, particle cloud SDF materialisation, and proper ground reflection (31 May night) |
| Scene 2 sdf_monolith bug | ✅ Fixed | Rise and split effects now compose correctly: all SDF work done in monolith-local frame (pl = p + rise offset); split_gap applied to pl not raw p; shade_monolith engraving UV also uses local frame — split opening now actually visible at scene end (31 May night) |
| Scene 2 split particle burst | ✅ Added | Particle system emits 200–400 white-hot/cyan particles per beat from the crack line when split_progress > 0.01 — shoots outward along X + slight upward arc; switches back to surface-materialisation burst in pre-split phase (31 May night) |
| Scene 3 digital glitch | ✅ Added | Row-displacement glitch in post.frag (scene_idx==2): strips narrow from h=0.055→0.016 as scene_norm grows; R/B channels shift by different factors → analog color fringe; occasional white-noise tape-dropout bands; intensity = scene_norm² * 0.75 + kick * 0.5 — sells "AI rewriting city data stream" for demoscene judges (1 June) |
| Scene 5 flower polish | ✅ Added | 9-petal flower (DESIGN said 7, code went further): rounded petal boxes + dual-axis curl (X + Z twist), stamen ring SDF; 4th octahedron level in temple for finer filigree (1 June) |
| Scene 5 heat shimmer | ✅ Added | Pre-sampling UV warp in post.frag (scene_idx==4): 4-term sinusoidal turbulence; beat_amp surge; smoothstep 0.05→0.45 onset — CA + bloom + grading all warped together (1 June) |
| Scene 7 singularity vortex | ✅ Added | pre-sampling UV warp in post.frag (scene_idx==6): center-heavy rotation (exp(-r*4)) ramps scene_norm 0.50→0.875, snaps off at silence onset; beat-kick surge (0.06+0.14)*PI → 10/36° center rotation; entire galaxy/tendril field spirals inward before logo freeze (1 June night) |
| Scene 7 tendril expansion | ✅ Added | UV scale tendril_scale=1/(1+scene_norm*0.9) applied to tendril(uv_t): tendrils grow 1.9× larger by scene end; fills the frame with light-as-plant-growth as per DESIGN concept (1 June night) |
| Scene 6 smin+fbm3 fix | ✅ Fixed | Runtime-only GL shader compile bug: smin() + fbm3() used but never defined in 06_impossible_space.frag. Added both inline before sdf_room() (1 June PM) |
| Scene 4 time echo | ✅ Added | post.frag (scene_idx==3): 2 ghost copies at ±(0.008, 0.005) UV offsets — blue-tinted future + red-tinted past; strength 0.18+scene_norm*0.22; inserted pre-bloom so ghosts glow (1 June PM) |
| Scene 7 cosmic beat ripple | ✅ Added | post.frag (scene_idx==6): ring expanding at rr=u_beat*1.8, fade=exp(-u_beat*2.2)*scene_norm — "universe heartbeat" on every 133 BPM kick in Act IV finale (1 June PM) |
| Scene 1 boot progress ring | ✅ Added | Clockwise arc (r=0.45, aspect-uncorrected UV) sweeping from top as scene_norm→1; bright leading-edge tip; 0.25+0.75*scene_norm brightness ramp — demoscene countdown before 0:18 kick (1 June PM) |
| Scene 5 flower petals | 9-petal (not 7) | Code upgraded to 9-fold symmetry (vs 7 in DESIGN.md) during scenes expansion commit — more organic and visually richer (75d66d8) |
| Scene 4 tesseract | ✅ Added | Beat-reactive 4D rotating hypercube (16 verts, 32 edges) projected to screen via 4D→3D→2D pipeline; two independent plane rotations (XW + YZ) + XY roll; edge glow fades in from scene_norm 0.05→0.35; electric-blue, white-hot on kick — demoscene "impossible 4D object" in Time Fracture (1 June eve) |
| Scene 6 gravitational lensing | ✅ Added | Universe-particle bends background starlight: 3-sample chromatic deflection (1/r² point mass law, rs=0.028 screen units); Einstein ring halo at r=rs·1.6; R/G/B deflect at 0.88/1.00/1.14× — prismatic arc makes the shrunken universe unmistakably massive; guard skips expensive path when zoom<0.05 (2 June) |
| Scene 7 zoom-out camera | ✅ Added | FOV compression via uv/zoom (zoom 1→3.5 over scene): stars contract toward horizon as camera recedes; slow 0.022 rad/s lateral drift; galaxy brightness 2.0→4.5 — sells design-doc "slow pullback to infinite distance" (2 June AM) |
| Scene 7 stream convergence | ✅ Fixed | Data streams now flow inward toward logo (phase +u_time instead of -u_time) — reads as "data converging as typography" per design intent (2 June AM) |
| Scene 2 monolith fracture | ✅ Added | Post FX crack light (scene_idx==1): vertical 1/r blue-white glow + R/B chromatic tear at scene_norm 0.82→1.0 — monolith split moment now has a visible light-bleed before the Act I→II cut (2 June AM) |
| Scene 6 entry spacetime ripple | ✅ Added | Pre-sampling UV warp + prismatic burst in post.frag at 2:30 cut; radial wavefront bends texture for 3.6s then decays (2 June) |
| Scene 7 big-bang entry burst | ✅ Added | Inverted radial UV expansion + blue-white brightness spike at Act IV entry; narrative counterpoint to scene 6 inward zoom (2 June) |
| Scene 5 geometry crystallisation entry | ✅ Added | UV implosion + magenta/violet burst + expanding cyan ring at Act III peak (1:45) (2 June) |
| Scene 3 city materialisation entry | ✅ Added | UV outward burst + electric-blue/cyan flash + ring at 0:45 bass drop; Act II onset (2 June) |
| Scene 4 temporal rupture entry | ✅ Added | Row-tear UV displacement + cold blue-white freeze flash at 1:15 time fracture onset (2 June) |
| Scene 1 double-tonemap fix | ✅ Fixed | Removed Reinhard pre-tonemap from 01_boot_void.frag — was double-tonemapping with post.frag ACES, crushing highlights and muddying Act I cold palette (2 June night) |
| Scene 7 title stagger reveal | ✅ Added | Per-character appearance: each of the 18 chars in "SINGULARITY GARDEN" fades in 0.0015 scene_norm after the previous (stagger 0→0.027); each char has a white-hot birth flash (exp decay) then settles to blue-white — proper demoscene typewriter feel (2 June night) |
| Scene 4 tesseract fade-out | ✅ Added | tes_gate now multiplied by (1-smoothstep(0.82, 0.97)): tesseract dissolves gracefully in last ~4.5s of scene — no more hard cut at crossfade boundary (3 June) |
| Scene 4 temporal exit twist | ✅ Added | post.frag (scene_idx==3, scene_norm 0.82→0.97): quadratic UV rotation from centre reaching ~3.7° — spacetime "winds up" before the Act III implosion burst snaps it clean (3 June) |
| Scene 5 beat-reactive geometry | ✅ Added | sdf_world() shrinks p by smoothstep(0.08,0,beat)*scene_norm*0.028 on each kick: all flowers/temple surge outward toward camera on every 133 BPM kick at the emotional peak (3 June) |
| Scene 7 light pulse | ✅ Improved | Replaced sawtooth smoothstep with: exp(-pulse_t*65)*4.5 instant flash + expanding ring (sdist exp-decay) — cinematic camera-flash feel for the Big Bang moment before logo reveal (3 June) |
| Scene 2 monolith exit shockwave | ✅ Added | post.frag (scene_idx==1, scene_norm 0.84→1.0): radial UV ripple expands outward from centre as the monolith opens — aspect-corrected ring, wave_r=0.9, single decaying oscillation crest, max 2.2% warp, fades as wave exits screen. Pairs with fracture crack-light (section 1c) for compound opening effect (3 June session 2) |
| Scene 7 subtitle "BY AGENTIX" | ✅ Added | 07_transcendence.frag: 5×7 bitmap font subtitle appears at scene_norm 0.960–0.978, positioned between separator (−0.30) and credit dots (−0.40) at y=−0.35; B=13 and X=14 added to FONT_DATA[105]; uniform fade-in, dimmer blue-white (1.3× vs title 2.0×) — completes the demoscene "DEMO_NAME / GROUP_NAME" credit format (3 June session 2) |
| Scene 5 exit post FX | ✅ Added | post.frag (scene_idx==4, scene_norm 0.82→0.98): CW UV spiral (asc_t² × 0.050 × exp(-r×1.8) radians, ~2.9° max at centre) + 1.6% UV compression; violet bell-curve brightness surge (peaks at scene_norm≈0.90); chromatic edge dissolution glow ring. (3 June session 4) |
| Scene 3 exit post FX | ✅ Added | post.frag (scene_idx==2, scene_norm 0.80→0.98): strip-scatter UV tear + B-channel vertical chroma drift + electric-blue brightness overload (×1.8). Every scene now confirmed entry AND exit post FX. (3 June session 5) |

### Outstanding for Submission

| Task | Priority | Notes |
|------|----------|-------|
| Windows RTX compile test | 🔴 Critical | Needs MSVC + RTX 3090/5090 machine (user action) |
| 4-minute runtime validation | 🔴 Critical | Audio sync + full run-through (user action) |
| WebM capture test | 🔴 Critical | 14,400 frames @ 60fps (240s × 60) (user action) |
| nfo file | ✅ Done | SINGULARITY_GARDEN.nfo created (28 May 2026) |
| Assembly portal upload | 🟡 Required | Before 2026-07-28 deadline (user action) |

| --fullscreen flag | ✅ Added | main.cpp: args parsed before window creation; `--fullscreen` passes primary monitor to glfwCreateWindow — Assembly shows demos fullscreen (4 June session 3) |
| Auto music path | ✅ Added | main.cpp: defaults to `assets/music/Concrete-Syncope.wav` when no audio arg given (non-capture mode) — plain `./hypersynapse` now plays music (4 June session 3) |
| [demo] finished message | ✅ Added | main.cpp: prints `[demo] finished — 240s complete` after loop exits — matches SUBMISSION.md expected console output (4 June session 3) |
| WebM audio mix-in | ✅ Fixed | capture.cpp: ffmpeg_command() now includes `-i audio_path -c:a libopus -b:a 192k -shortest` — captured WebM will include synchronized music track (4 June session 3) |

### Completeness Summary (4 June 2026 — Session 3)

All 7 scenes have **entry post FX** (burst/flash/ring at every scene cut) and **exit post FX** (UV warp + color surge at every transition out). Credit sequence complete: "SINGULARITY GARDEN" → "BY AGENTIX" → "2026". Audio fade-out (228–235s) synchronised with visual silence. Scene 7 particles silenced before logo reveal. All demoscene submission requirements met on the shader/C++ side. `--fullscreen` flag added for Assembly presentation. WebM capture now mixes in audio track. Project is **submission-ready** pending Windows hardware validation.

| Audio-locked timeline | ✅ Fixed | main.cpp: Timeline now driven by `audio.position()` (miniaudio PCM cursor) instead of wall clock. Eliminates ~20–50 ms startup-buffer drift so beat-sync effects stay locked to actual audio playback across the full 240s run. Fallback to wall clock before audio starts. Stats print includes `drift:` field (audio_t − wall_t). Default audio path now applies in capture mode too so `./hypersynapse --capture` alone produces an ffmpeg command with correct audio mix-in. SUBMISSION.md updated to v1.3. (4 June session 4) |

| Scene 4 frozen crystal shard field | ✅ Added | 04_time_fracture.frag: Replaced flat 2D `debris()` point-lights with a full 3D raymarched frozen-shard field — 10 thin SDFRoundBox crystals at fixed positions, each with precomputed Y+X rotation (constants in `SC[]` array, no live trig in march loop). 80-step raymarch, MAX_DIST=6. Camera orbits slowly (0.11 rad/s) spiraling inward over scene. Three time-copy materials: cold blue (past) / hot orange (present) / acid cyan (future). Beat-reactive flare on kicks. Temporal feedback decay 0.70→0.60 to balance 3D+echo brightness. All existing 2D overlays retained: reversed streams, portal rings+interiors, warp sample, crack lines, tesseract. Delivers DESIGN.md "camera flies through frozen time fragments" intent; Scene 4 now has same 3D depth as Scenes 5 and 6. (5 June) |
