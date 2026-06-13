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

| Scene 4 SDF AO + crystal prism optics | ✅ Upgraded | `sdf_ao_shards()` (5-step normal-march) added: contact shadows in crevices where crystal clusters overlap — same technique as Scenes 5 & 6, now all three SDF scenes have proper AO. Chromatic prismatic specular: two extra ldir_r/ldir_b lobes offset ±3° from key light (cos^38) simulate wavelength-dependent refraction through frozen crystal — R and B highlights split apart creating rainbow spectral dispersion at grazing angles. Second fill light (cold blue-violet, 0.09 rad/s orbit) gives each shard varying secondary illumination as the camera circles — "time still flowing around the frozen moment." All three lighting techniques now consistent across SDF scenes 4, 5, 6. (5 June) |

| Scene 2 SDF AO + animated diffuse | ✅ Upgraded | `sdf_ao()` (5-step normal-march) added to 02_awakening_core.frag — ribs and crevices in the monolith now have true contact shadows. Two animated lights (key orbiting 0.18 rad/s + fill counter-orbit 0.12 rad/s): `col = mat * (0.10 + (diff_key + diff_fill) * ao_val)`. Specular highlight tracks animated key light. Same technique as Scenes 4/5/6 — all four SDF-raymarched scenes now have consistent AO+diffuse lighting. (5 June session 2) |

| Scene 7 beat-reactive cosmic flares | ✅ Added | 4 semi-random screen-space star positions pulse on each 133 BPM kick: bright core (exp(-r*10) decay) + expanding ring matching u_beat ramp. Positions shift slowly between bars (u_bar_cnt hash). Flares scale with u_scene_norm so they fade in early then become prominent during the 60s Act IV run. Makes the galaxy feel musically alive during scene_norm 0→0.5 where the background was previously passive. (5 June session 2) |

| Scene 3 two-light system + window specular | ✅ Upgraded | Replaced single hardcoded sun light with two-light model: warm sun (fades with v_corruption) + cold blue AI corruption light (grows with v_corruption) — building surfaces shift from warm concrete to electric blue as the AI takes over. Window specular (cos^28 Blinn-Phong) catches sun reflections on glass and fades as corruption dissolves the material. Matches lighting quality of other scenes. (5 June session 2) |

| Scene 7 tendril bifurcation | ✅ Upgraded | `tendril()` now grows a 4-segment trunk then forks into two 4-segment branches (positive + negative rotation at split point), each with a `tip_glow()` leaf terminal that flares on each 133 BPM kick (beat_boost × 3.0). Replaces old 8-segment linear list — now literally reads as "light growing like a plant" per design intent. (5 June session 6) |
| Post FX zodiacal scatter | ✅ Added | post.frag (scene_idx==6): ultra-wide bloom_layer (threshold=0.20, radius=28) tinted deep blue-violet (0.18,0.22,0.40) × 0.45, gated 0→scene_norm 0.875. Scatters dim galaxy regions into a soft astronomical haze — matches how real telescope images render galaxy backgrounds. Fades before silence window to keep logo reveal clean. (5 June session 6) |
| Scene 5 iridescent + SSS | ✅ Added | 05_geometry_bloom.frag: (1) Cosine-wheel RGB iridescent rim — hue rotates with view angle via 3-channel cos (2π/3 phase offsets), strength × fresnel × 0.50 × scene_norm — petals shimmer cyan→magenta→gold at grazing angles like beetle wings / soap bubbles; (2) SSS approximation — backlit petal surfaces (dot(-n,-rd) × dot(ldir1,-rd)) glow warm magenta (col_a × 0.28 × scene_norm) — organic translucency absent from opaque geometry. (5 June session 6) |

| Scene 4 beat shockwave rings | ✅ Upgraded | 04_time_fracture.frag: Replaced flat `beat_shatter` color tint with two expanding concentric rings — primary (u_beat×2.4 radius, exp(-3.2·beat) fade, blue-white) + echo ring (u_beat×1.25, faster decay) — emanate from screen center on each 133 BPM kick. Sells "time-pressure shockwaves through frozen space"; brief flat flash retained at peak impact only. (5 June) |
| Scene 6 beat pulse ring | ✅ Upgraded | 06_impossible_space.frag: Replaced flat beat pulse with expanding ring (u_beat×1.8 radius, exp(-4·beat) fade, portal-blue) that sweeps outward through non-euclidean geometry on each kick. Ambient flash softened (0.25× vs previous 0.3×) so ring carries the visual weight. (5 June) |
| Scene 3 particle chaos scaling | ✅ Upgraded | renderer.cpp: CityCorruption burst scales 40→120 with scene_norm (was fixed 60). Velocity transitions from purely vertical drift (start) → chaotic 3D spray (full corruption) — chaos = scene_norm²; height range raised to 12 units. Color fades from electric blue → hot blue-white as the AI takeover crescendos. (5 June) |
| Scene 5 aurora 3rd curtain | ✅ Added | 05_geometry_bloom.frag: Third aurora band at 240° (completing 3-fold rotational symmetry). Color: amber→gold (ci==2) vs violet→magenta (ci==0) and cyan→violet (ci==1). Kaleidoscope mandala is now fully saturated with tricolor coverage — the 6→12 fold evolution maps tri-symmetry into hexagonal/dodecagonal patterns. (5 June) |
| Scene 7 logo star-field return | ✅ Added | 07_transcendence.frag: Faint galaxy re-emerges behind logo at scene_norm 0.905→0.930 (strength 0.12×). After the silence black-out the universe "returns from the void" to frame the logo on a cosmic backdrop rather than pure black. Never competes with logo — purely an atmospheric depth layer. (5 June) |

| Scene 7 aurora ribbons | ✅ Added | 07_transcendence.frag: 5 tall sinusoidal vertical light curtains (`aurora_ribbon()` + `scene7_auroras()`) fill the depth between galaxy background and foreground tendrils during Act IV. Colors: teal-cyan at base → violet mid → white-blue apex. Each ribbon oscillates independently (two-frequency lateral wave); per-ribbon shimmer. Beat-surge: +45% on 133 BPM kicks. Gate: smoothstep 0.05→0.22 fade-in, 0.76→0.86 fade-out — fully clear before silence/logo window. (6 June) |

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

### Completeness Summary (5 June 2026 — Evening session)

All 7 scenes have **entry post FX** (burst/flash/ring at every scene cut) and **exit post FX** (UV warp + color surge at every transition out). Credit sequence complete: "SINGULARITY GARDEN" → "BY AGENTIX" → "2026". Audio fade-out (228–235s) synchronised with visual silence. Scene 7 particles silenced before logo reveal. All demoscene submission requirements met on the shader/C++ side. `--fullscreen` flag added for Assembly presentation. WebM capture now mixes in audio track.

**Session additions (5 June eve):** Scene 4 beat shockwave rings + echo (replaces flat flash); Scene 6 beat pulse ring through impossible space; Scene 3 particle chaos scaling with corruption (40→120, 3D spray); Scene 5 3rd aurora curtain amber/gold (3-fold mandala symmetry complete); Scene 7 faint star-field returns behind logo. Project is **submission-ready** pending Windows hardware validation.

| Audio-locked timeline | ✅ Fixed | main.cpp: Timeline now driven by `audio.position()` (miniaudio PCM cursor) instead of wall clock. Eliminates ~20–50 ms startup-buffer drift so beat-sync effects stay locked to actual audio playback across the full 240s run. Fallback to wall clock before audio starts. Stats print includes `drift:` field (audio_t − wall_t). Default audio path now applies in capture mode too so `./hypersynapse --capture` alone produces an ffmpeg command with correct audio mix-in. SUBMISSION.md updated to v1.3. (4 June session 4) |

| Scene 4 frozen crystal shard field | ✅ Added | 04_time_fracture.frag: Replaced flat 2D `debris()` point-lights with a full 3D raymarched frozen-shard field — 10 thin SDFRoundBox crystals at fixed positions, each with precomputed Y+X rotation (constants in `SC[]` array, no live trig in march loop). 80-step raymarch, MAX_DIST=6. Camera orbits slowly (0.11 rad/s) spiraling inward over scene. Three time-copy materials: cold blue (past) / hot orange (present) / acid cyan (future). Beat-reactive flare on kicks. Temporal feedback decay 0.70→0.60 to balance 3D+echo brightness. All existing 2D overlays retained: reversed streams, portal rings+interiors, warp sample, crack lines, tesseract. Delivers DESIGN.md "camera flies through frozen time fragments" intent; Scene 4 now has same 3D depth as Scenes 5 and 6. (5 June) |

| Scene 3 electric lightning arcs | ✅ Added | post.frag (scene_idx==2): fractal `lightning_bolt()` function subdivides a segment into 10 jagged sub-segments via perpendicular bell-envelope displacement; 2 simultaneous bolts from top-screen to random lower-half impact points; fires on ~45% of beats (per-beat hash gate); bolt positions reseed every 2 beats (~0.9s) so each strike looks distinct; intensity = gate × kick² × scene_norm — white-hot core (0.88, 0.94, 1.0) × 3.2 + electric-cyan halo × 2.0; fades in under 0.1s via kick² decay. Sells "AI overwhelms power grid" alongside rain + glitch. (6 June) |

| post.frag u_bar compile fix | ✅ Fixed | `uniform float u_bar;` was missing from post.frag — only `u_bar_cnt` was declared. Since `u_bar` was used in the Scene 3 lightning gate (beat_id derivation), GLSL compilation of the entire post shader failed. This silently broke ALL post FX (bloom, CA, color grade, vignette, ACES, scanlines) since the 6 June lightning commit. Now declared alongside the other uniforms. (6 June session 2) |

| Scene 3 lightning forked branches | ✅ Upgraded | `lightning_bolt()` now spawns 2 sub-branches at ~40% and ~65% along the main trunk: each branch is 5 segments, thinner (width_inv=380 vs 250 for trunk), offset by a random lateral angle. A helper `lightning_segment()` replaces the inline SDF to avoid code duplication. Branching gives proper tree-lightning topology vs. single-path zigzag — much more convincing at the 3.2× brightness level of the power-grid overload moment. (6 June session 2) |

| Scene 5 crystal glass refraction | ✅ Added | 05_geometry_bloom.frag: when rays hit petal geometry at grazing angles (Fresnel-weighted), they refract (IOR 1.5, air→crystal) into the kaleidoscopic sky — aurora curtains and nebulae appear *through* the petal surfaces. Refracted direction is mirrored through the same evolving fold_k as the sky mandala (6→12 fold, beat-snap +2) so sky and surface patterns stay aligned. TIR fallback to reflect(). Strength: fresnel×smoothstep(0.30,0.70,scene_norm)×0.18 — prominent at bloom peak, zero at scene entry. Completes the "living crystal flowers from another dimension" design intent: petals now have iridescent rim + SSS + crystal refraction all together. (6 June session 3) |

| Scene 5 kaleidoscope surface sheen | ✅ Upgraded | Hit-point kaleidoscope overlay now uses the same evolving fold_k as the sky (mix(6,12, scene_norm²)+beat_snap) instead of fixed 6-fold, and gains a slow hue rotation (mix between violet and teal over time). Surface sheen and sky mandala now crystallise in unison: as the beat snaps the fold count up, both the aurora and the petal surface shimmer simultaneously. (6 June session 3) |

| Scene 5 chromatic dispersion | ✅ Upgraded | `fold_sky_rd()` helper extracted (reduces fold duplication); crystal refraction now uses three separate IOR values (1.45/1.50/1.55 for R/G/B). Each channel refracts at a different angle through the evolving kaleidoscope fold — aurora curtains visible through petals split into prismatic rainbow fringes at grazing angles, like sunlight through lead-crystal glass. (6 June session 4) |
| Scene 6 portal light illumination | ✅ Added | Each portal disc (cyan at z=-1.8, violet at x=-1.5, teal at x=+1.5) now acts as a coloured point light source on room walls: `max(dot(n,lp),0)/( dp²×0.22+0.5)` with distance falloff + beat_pl boost on kicks. Walls that face a portal pick up its hue — cyan/violet/teal washes across fold_space architecture. Delivers "rooms within light beams" design intent. (6 June session 4) |

| Scene 6 data-matrix wall streams | ✅ Added | 06_impossible_space.frag: wall surfaces now show flowing data-matrix rain — quantized symbol columns (3.5/unit XZ grid, 5/unit Y, 62% cell density) stream downward at varied speeds (1.2–4.0 u/s). Each column independently seeded; lead-edge of each stream 1.8× brighter. Base colour electric-blue (0.05, 0.25, 0.80); portal point lights tint the streams cyan/violet/teal based on which portal faces the wall — creates the visual effect of data flowing through portal beams. Replaces static trig-based engraving. (6 June session 5) |
| Scene 7 beat-reactive galaxy | ✅ Added | 07_transcendence.frag: galactic plane emission (dust + HII regions) now pulses with the 133 BPM music. `beat_surge = 1.0 + smoothstep(0.06,0,u_beat)*0.55*u_scene_norm` applied to both dust (orange-red) and HII (blue) terms — the galaxy "breathes" with every kick during the 60s Act IV finale. Max surge 55% brighter at beat peak, fully ramped at scene_norm 1.0. (6 June session 5) |
| Scene 7 shooting-star comets | ✅ Added | 07_transcendence.frag: `scene7_comets()` fires 3 simultaneous comet streaks on every 2nd 133 BPM beat (beats 1 & 3 of each bar). Each comet has a bright Gaussian head + widening tail; the head animates FROM one screen edge TO the opposite over ~0.25s using `u_beat` as travel parameter. Seed resets per bar so each bar has unique trajectories. `u_bar_cnt` uniform declaration added (was missing from scene 7 uniforms — also fixes the existing cosmic-flares code). Gate: scene_norm 0.04→0.84, fully off before silence/logo window. (7 June) |

| Scene 7 tendril color arc | ✅ Upgraded | 07_transcendence.frag: tendril color now evolves monotonically over the 60s finale — amber-gold (organic birth, early scene) → electric cyan-blue (cosmic resonance, mid scene) → violet-magenta (transcendence, late scene). Replaces time-oscillating sin color that had no narrative direction. `color_arc = scene_norm/0.875` drives two-stage smoothstep mix; a gentle 8% hue shimmer still oscillates on top so petals never look static. Gives Act IV a visual color narrative matching the tonal arc: life→cosmos→singularity. (8 June) |
| Scene 7 aurora ribbon shimmer | ✅ Upgraded | 07_transcendence.frag: `aurora_ribbon()` now includes two coprime-frequency upward-propagating shimmer bands (7.3 + 13.7 Hz spatially, independent temporal rates per ribbon seed). mix(1.0, shim1*shim2, 0.35) — 35% depth, noticeable ripple without strobe. Ribbon base brightness bumped 0.075→0.092 so curtains read clearly without bloom amplification. Star-field return behind logo raised 0.12→0.17 for a warmer cosmic backdrop. (8 June) |

| Scene 5 beat-pulse rings (post) | ✅ Added | post.frag (scene_idx==4, section 4e): dual concentric expanding rings on every 133 BPM kick — outer violet (0.60,0.10,0.98) at radius u_beat×1.65 + inner cyan (0.12,0.70,0.98) at u_beat×1.00. Independent exp-decay rates (4.8 / 6.5) create staggered "kaleidoscope heartbeat" feel matching the fold-snap in 05_geometry_bloom.frag. Gated 0.05→0.82 scene_norm to avoid competing with entry magenta burst or exit ascension. Scene 5 now has same dedicated kick-reactive post layer as Scenes 3/6/7. (8 June) |
| Scene 2 screen-space god rays | ✅ Added | post.frag (scene_idx==1, section 4f): crepuscular light-shaft effect from monolith crack (0.60→1.0 scene_norm). 16 radial samples from light_uv=(0.5,0.72) toward each screen pixel; per-sample luminance accumulation with exp decay (0.93). Col += ill × 0.028 × electric-blue (0.40,0.70,1.00). Sells "impossible monolith opening" with volumetric light bleeding — the first dramatic post effect the audience sees. (8 June) |
| Anamorphic lens streaks (post) | ✅ Added | post.frag (section 2d): horizontal cinema-lens streaks from bright light sources, active Acts III/IV (demo_norm 0.4375→0.95). `anamorphic_streak()` samples ±24 horizontal pixels with exp-decay (0.18 per step) at spacing 2.5px; blue-shifted tint (0.72,0.88,1.00) replicates real anamorphic lens coating. Threshold linearly lowers 0.70→0.55 as demo progresses. Suppressed during Scene 6 zoom-out (radial blur already active) and Scene 7 logo silence. Adds cinematic lens quality to fractal/cosmic visuals of Acts III/IV. (8 June) |

| Scene 7 logo god rays | ✅ Added | post.frag (scene_idx==6, section 4g): crepuscular light shafts from SG monogram centre (0.5, 0.56 UV). 12 radial samples, exp decay 0.91, warm blue-white (0.45,0.68,1.0). Gated 0.895→0.935 (builds as logo materialises), fades off at 0.970→0.985 (clear before year stamp). Deliberately mirrors Scene 2 monolith god rays — bookends Act I opening with Act IV finalé; same technique sells both "impossible awakening" and "transcendent conclusion". (8 June session 2) |
| Scene 2 monolith gravitational field | ✅ Added | post.frag (scene_idx==1, section 0c2): subtle 1/r² radial inward pull centred at monolith UV (0.5, 0.55) during scene mid-section (0.12→0.80 scene_norm). Beat-surge 1+0.55×exp(-beat×8) creates spatial "heartbeat" dilation. Same lens physics as Scene 6's universe-particle gravitational lensing — echoes "small seed of cosmic scale" theme. Gates off before exit shockwave (0d) to avoid conflicting distortions. max pull ~0.0042 UV units/pixel — subliminal but physically grounded. (8 June session 2) |
| Scene 2 monolith beat-pulse ring | ✅ Added | post.frag (scene_idx==1, section 4h): primary cold-blue ring (u_beat×1.20, exp-decay 5.5) + echo ring (u_beat×0.68, decay 7.0) emanate from monolith UV (0.0, 0.05 in ctr-space) on every 133 BPM kick. Gated 0.08→0.86 scene_norm (clear of entry flash and exit shockwave). Scene 2 now has a dedicated body beat ring matching the beat-ring coverage of Scenes 3/4/5/6/7 — the gravitational field bends space, the ring makes the beat visible as radiated energy. (8 June session 3) |
| Scene 4 exit temporal overload flash | ✅ Added | post.frag (scene_idx==3, section 8k): cold-white brightness surge (quadratic, peaks scene_norm 0.97) + screen-edge ice-blue corona as the UV twist maxes out and spacetime fails before Act III. Quadratic ramp means the flash hits hardest right at the cut-point — maximum contrast with Scene 5's warm magenta entry burst. Sells "temporal overload → reality restructure" narrative at the Act II→III boundary. (8 June session 3) |
| Scene 6 4D chromatic fold (post) | ✅ Added | post.frag (scene_idx==5, section 1d): on each 133 BPM kick during the impossible-space body (0.08→0.78 scene_norm), R channel briefly samples a UV reflected around a per-bar rotation axis through screen center — simulating a 4D fold plane momentarily opening in the non-euclidean geometry. B channel simultaneously shifts radially outward (shorter wavelength bends differently in curved space). Axis rotates per bar via hash(u_bar_cnt), so each bar presents a unique fold direction across the 30-second scene. Effect peaks at ~65% R blend + 60% B blend on kick impact, decays with exp(-beat×10). Adds dynamic light-bending personality to Scene 6 body that complements the zoom-out reveal and portal lighting without competing with the holy-shit moment. (8 June session 4) |

| Scene 7 emission nebula clusters | ✅ Added | 07_transcendence.frag: `galaxy()` now contains 3 named emission nebula clusters at distinct sky positions — Nebula A: Magenta Rosette-type HII (upper-right, dot>0.88, FBM×3.5, vec3(0.65,0.08,0.42)); Nebula B: Amber supernova remnant (left flank, dot>0.86, FBM×4.0, vec3(0.85,0.42,0.06)); Nebula C: Teal planetary ionised shell (lower-right, dot>0.87, ring smoothstep + FBM fill). All use tight dot-product cone thresholds (half-angle ~15–25 deg) for defined cloud patches, not color floods. FBM adds wispy internal structure. Colors chosen to match the tendril color arc (amber-gold → cyan → violet-magenta). All 3 grow larger in frame as the pullback zoom increases 1→3.5 over the 60s finale, revealing cosmic scale progressively. (8 June session 5) |
| Scene 7 interstellar dust lanes | ✅ Added | 07_transcendence.frag: `galaxy()` galactic-plane band (plane_dens>0.015) now includes interstellar dust absorption — FBM(rd×4.2) above smoothstep(0.52,0.64) threshold multiplies `col *= 1-absorption×0.70`. Creates dark molecular cloud lanes (Bok globules / dark nebulae) crossing the galactic disk, giving the galaxy band the dusty spiral-arm appearance characteristic of real Hubble imaging. Naturally suppressed away from galactic plane. (8 June session 5) |
| Scene 1 beat-pulse ring (post) | ✅ Added | post.frag (scene_idx==0, section 4i): dual cold-blue expanding rings on every 133 BPM kick during the boot body (scene_norm 0.05→0.80, clear of exit lock-on at 0.84). Primary ring: `u_beat×1.40` radius, exp-decay 8.0, electric-blue (0.35,0.62,1.0)×0.80; echo ring: `u_beat×0.85`, decay 12.0, deeper blue (0.20,0.45,0.90)×0.45 — reads as "data signal propagating outward through neural filament lattice". Completes beat-ring coverage: all 7 scenes now have a dedicated body beat-pulse ring in post.frag. (9 June) |
| Scene 3 city building power surge | ✅ Added | 03_city_corruption.frag: `surge_wave()` function replaces flat beat flash. On each 133 BPM kick, a bright activation front propagates bottom→top across each building face over ~0.45s (u_beat×2.2 UV-y sweep, exp-decay 4.0). Per-building hash phase offset (0–0.18s stagger) cascades the surge across the city rather than all buildings firing simultaneously. Window overload burst rides the surge front (wins × surge × corruption × cyan×2.2). Effect scales with v_corruption — zero at scene start, maximum as AI fully controls the grid. Sells "power grid overload cascade" narrative at Act II. (9 June) |
| Scene 6 portal heartbeat ring (post) | ✅ Added | post.frag (scene_idx==5, section 4j): violet/teal dual expanding ring fires on each 133 BPM kick during the impossible-space body (0.12→0.68 scene_norm). Primary violet ring (u_beat×1.10, decay 4.2) — centre portal frequency; echo teal ring (u_beat×0.65, decay 6.0) — wall portal resonance. Distinct from section 1d chromatic fold: the fold warps the UV field; this ring is a visible spatial pulse in post-space — the portals radiate tangible spacetime pressure. Slower expansion than other scenes (ponderous, non-euclidean weight). Gate clears entry ripple (0→0.12) and zoom-out window (0.70+). (9 June) |
| Scene 4 temporal pressure ring (post) | ✅ Added | post.frag (scene_idx==3, section 4k): ice-blue dual ring on each kick during Time Fracture body (0.10→0.82 scene_norm). Primary ring: fast u_beat×1.80 expansion, thin (0.016 tolerance), ice-blue (0.45,0.78,1.0). Echo ring: u_beat×0.90, slightly dimmer — freeze-rebound reflection. Layered ABOVE the existing scene-shader shockwave ring (which lives in 3D world-space): post-space ring makes beat visible on the screen surface itself, creating a two-layer ring system. Gate clears entry row-tear (0→0.09) and exit UV-twist (0.82+). (9 June) |
| Scene 3 rain system upgrade | ✅ Upgraded | post.frag (scene_idx==2, section 4b): replaced 12-streak static rain with tile-based system — 28 columns × 3 drop phases = 84 independent drops. Each drop: bright head + tail (exp falloff above, hard cutoff below). Tail length scales with scene_norm (heavier rain as corruption deepens: k=14→24). AI-stirred sinusoidal wind drift (2 coprime-frequency terms). Beat-reactive brightness boost (×1.70 on kicks). Wet pavement glint at screen bottom (hash-noised electric-blue puddle sheen). Stormy sky atmosphere: luminance-gated dark blue-violet gradient in sky/background areas above buildings; cloud-lightning illumination flash on beats (kick² driven). None of these effects touch lit building surfaces (sky_mask = smoothstep(0.12, 0.03, scene_lum)). Scene 3 now has a proper megacity rainstorm, not just 12 reference lines. (9 June session 2) |
| Scene 4 time echo upgrade | ✅ Upgraded | post.frag (scene_idx==3, section 1b): temporal ghost images now use rotated+scaled UV sampling instead of simple offset. Past echo: CCW rotation at 0.026×scene_norm rad + 0.978× UV scale (time contracting). Future echo: CW rotation + 1.022× scale (time dilating). Beat-surge adds 0.010×scene_norm rad on kicks (snap-pull). Gate: 0.10→0.22 scene_norm (clears entry row-tear). Delivers "timelines spiral apart" narrative — past/future appear to peel away from the frozen present in opposite rotational directions. (9 June session 2) |
| Scene 1 synaptic neural activation | ✅ Added | 01_boot_void.frag: on each 133 BPM kick, 3→8 random circuit nodes "fire" — brief bright burst (exp(-r²×55)) + expanding activation ring (u_beat×0.42). Node positions reseed per bar (hash of u_bar_cnt). Node count scales 3→8 with scene_norm: sparse activation early, dense cascade near the 0:18 first bass drop. Multiplied by trace_density (scene_norm²) so effect fades in with the rest of the boot sequence. u_bar_cnt uniform declared (was missing). Directly embodies the HYPERSYNAPSE title: neurons firing in cascade before the AI awakening. (9 June session 3) |
| Scene 3 city roofline glow | ✅ Added | 03_city_corruption.frag: AI energy concentrates at building tops as corruption grows — `roof_edge = smoothstep(0.04,0,abs(v_uv.y−1))` drives a 2.5× electric-blue corona along each building's roofline × v_corruption. Vertical corner glow (1.4× blue-violet, v_uv.x near 0/1) adds edge light where architecture begins to warp. These are the visual "infection points" where mathematical forms first emerge on each building — reinforces the narrative that the AI takeover starts at the exposed extremities. (9 June session 3) |
| Scene 6 intergalactic void deepening | ✅ Added | post.frag (scene_idx==5, section 2b-void): during the holy-shit zoom-out window (0.80→0.92 scene_norm), screen corners darken 65% while the centre remains bright — simulating deep intergalactic void surrounding the shrinking universe-particle and the revealed galaxies. Edge mask smoothstep(0.35,0.80, r) so only periphery is affected. Faint blue-violet chromatic scatter in darkened region. Clears before exit glow (0.96+). Effect makes the vast scale of the outer universe viscerally felt: bright cluster at centre, void everywhere else. (9 June session 3) |

| Scene 2 sacred geometry progressive reveal | ✅ Upgraded | 02_awakening_core.frag: `sacred_geometry_glow(uv, reveal)` replaces flat `sacred_geometry(uv) * smoothstep(0.4,0.8,reveal)`. Each element of Metatron's Cube now materialises independently: centre circle (reveal 0.38→0.50) → inner Star-of-David 6-circles (0.52→0.64) → outer hexagon circles one by one (0.64–0.88, each ~0.5s apart at 27s scene length). Beat-kick flare on all visible elements. The AI is now visibly *writing* sacred geometry onto the monolith surface rather than flashing it all at once — sells "AI awakening = mathematical self-inscription". (9 June session 4) |
| Scene 5 synaptic web overlay | ✅ Added | 05_geometry_bloom.frag: post-render 2D synaptic-connection web composited over the fractal geometry. Six nodes orbit the fractal garden matching the 6-fold kaleidoscope symmetry, each with independent slow drift. Ring topology + alternating diameter cross-connections create a neural network pattern; node glow dots at each junction. Color cycles blue→violet (sin oscillation). Beat-surge ×1.90 on 133 BPM kicks. Gate smoothstep 0.30→0.55 so the web emerges as bloom reaches peak intensity. Directly realises HYPERSYNAPSE concept in the emotional peak scene: literal neural connections forming between living mathematical structures. (9 June session 4) |
| Scene 1 boot terminal typewriter text | ✅ Added | 01_boot_void.frag: 3-line pixel-font boot terminal types in over the 18-second boot sequence. 5×7 pixel font (18 chars: A,C,D,E,H,I,L,N,O,P,R,S,T,U,V,X,Y,SP). Line 1 "HYPERSYNAPSE" (electric-blue, scene_norm 0.04→0.30): the AI system identifier. Line 2 "NEURAL CORTEX ONLINE" (teal-green, 0.30→0.62): neural substrate activation. Line 3 "REALITY OVERRIDE ACTIVE" (violet-amber, 0.55→0.89): the AI announces its purpose. Per-character typewriter stagger with white-hot birth flash on each char. Blinking cursor bar tracks the typing frontier on all 3 lines. Fixed screen-space UV (not rotating with camera drift) — text is stable while background drifts. Demoscene standard boot narrative: system boot text reveals the AI's identity before the monolith appears at 0:18. (9 June) |

| Scene 2 synaptic neural web | ✅ Added | 02_awakening_core.frag: screen-space Metatron's Cube neural web overlaid on the monolith as sacred geometry materialises. 7 nodes (centre + 6 outer, radius 0.28 screen units); centre node appears at reveal 0.38, outer nodes stagger in 0.52–0.66, spoke connections form at 0.52–0.64, ring connections at 0.64–0.80. `seg_glo2D()` helper for 2D soft-width line SDF. Beat-reactive surge (×0.80 on kicks). Fades before monolith split (0.78→0.90). Cold electric-blue (0.20,0.52,1.00) matches Act I palette. Connects HYPERSYNAPSE boot synaptic firing (Scene 1) → monolith inscription (Scene 2) → fractal synaptic web (Scene 5): the AI's neural network grows across the three acts. (10 June) |
| Scene 7 tendril 3rd-level leaflets | ✅ Upgraded | 07_transcendence.frag: `leaflet()` helper function added. Each of the two existing branches (left/right) now sprouts a pair of 3-segment leaflet sub-branches at its tip — 4 leaflets per tendril, each with its own `tip_glow()`. Fork angle ±(0.28–0.50 rad) vs branch (0.42–0.70 rad), step 0.040 (vs 0.058 branch), width ramp sw×1.5→×0.68^3. Leaflets gate smoothstep(0.18, 0.38, scene_norm): grow in ~10s into Act IV, well before the vortex+logo sequence. Guard `if (leaf_gate > 0.001)` skips all leaflet math in the first 10s. Before: 2 leaf tips per tendril; after: 6. Tendrils now look unambiguously botanical — branching trunk, paired branches, quartet leaflet terminals — directly delivering "light grows like plants" design intent. (10 June) |
| Scene 5 reflective ground plane | ✅ Added | 05_geometry_bloom.frag: `else if (rd.y < -0.001)` branch catches rays that miss fractal geometry and hit a virtual ground plane at y=-1.5. Polished obsidian base material (vec3(0.015,0.008,0.030)) with Fresnel-weighted reflection (cos³×0.78) of the aurora/nebula sky — the same kaleidoscope fold applied to the sky is applied to the reflected ray, so surface and reflection crystallise in unison. Beat-driven surface ripple (fbm noise ×0.055 on kicks) breaks the perfect mirror on each 133 BPM hit. Expanding beat-ring (exp(-beat×3.5) × ring proximity) radiates outward on kicks. Faint violet halo at centre (exp(-gd×0.8)) — "sacred ground" beneath the flowers. Distance fade smoothstep(6.5,1.8,gd) so the mirror only fills the visible garden area. Gate smoothstep(0.12,0.38,scene_norm). Effect: fractal flowers and temple structures float above a dark reflective surface showing aurora curtains and nebulae below — "living sacred geometry in a mirror universe". (10 June) |
| Scene 1 boot terminal line 4 | ✅ Added | 01_boot_void.frag: 4th terminal line "PROTOCOL EXECUTED" appears at scene_norm 0.91→0.978 — fills the ~2-second gap between "REALITY OVERRIDE ACTIVE" completing and the 0:18 first kick. Rapid type-in (STG=0.004/char, 17 chars over 1.2s). Cold white color vec3(0.92,0.96,1.00)×3.0 — execution completion stamp, brighter than warning lines. Faster birth flash (exp×55 vs 38) and blinking cursor at 19.6 Hz (vs 14 Hz) for urgency. `render_boot_terminal()` return type updated to vec4; .w = L4. L4 cursor tracks at y=0.128 (LY4+0.038 pattern). Effect: all 4 lines fully visible for ~0.5s before the 0:18 bass kick — maximal boot-sequence buildup before the AI awakening cut. (10 June) |
| Scene 7 logo prismatic fringing | ✅ Added | 07_transcendence.frag: R/B chromatic fringe at the SG monogram edges. logo_sdf() sampled at ±0.0065 UV offset for R and B channels; fringe = max(offset_mask - centered_mask, 0) — exactly the chromatic aberration band at each letter boundary. R halo on +x edges (×2.2), B halo on −x edges (×2.8), slight G bleed (×0.40) for full-spectrum dispersion. Strength pulses with logo breathing sine (0.70+0.30×sin) × logo_appear × 0.45. Constant off declared to avoid per-call recomputation. Effect: the "SG" monogram appears to be carved from a prismatic crystal, light splitting into red and blue fringes at every letter curve — matches the crystalline/cosmic aesthetic of Act IV finale. (10 June) |

| Scene 4 frozen void starfield + light trails | ✅ Added | 04_time_fracture.frag: `frozen_starfield()` — 4-level multi-scale star grid; star colours match the 3 time-copy categories (cold blue=past, warm orange=present, acid cyan=future) + 2 sparse hero-stars at larger scale. `frozen_trails()` — 18 line-segment light-trail arcs (6 each in past/present/future palette); each trail is an object whose motion was captured mid-flight when time froze, inscribed permanently as a glowing arc in the void; tail falloff (bright head, dim tail) communicates directional momentum; intensity scales with scene_norm so trails appear as the scene builds. Background was previously near-black vec3(0.002,0.004,0.014) + minimal noise; now has proper deep-space atmospheric depth matching the 3D crystal shard field and the temporal debris narrative. (10 June session 2) |

| Scene 3 wet street screen-space reflections | ✅ Upgraded | post.frag (scene_idx==2): replaces the basic wet-pavement glint hash with full screen-space mirror reflections. FPV camera at y≈1.5 means lower screen (ctr.y < −0.15) shows rain-soaked megacity asphalt. Pixels below the street horizon mirror building content from above it (reflected UV), distorted by two-frequency sinusoidal rain-ripple noise + beat-surge wave. Electric-blue AI tint (vec3(0.32,0.60,1.05)) charges the water with the signal. Fresnel cos^1.8 falloff: near-perfect at grazing horizon, fades toward screen bottom. Dark asphalt base (wet black tarmac) with a per-beat radial ripple ring (raindrop impact waves). Dark-mask (smoothstep 0.20→0.05 scene luminance) limits reflection to actual asphalt between buildings, not lit building faces. Gate: scene_norm 0.04→0.22. Result: building silhouettes appear reflected in the wet megacity street with electric shimmer — the AI-charged rainwater becomes a second mirror of the corrupting city. (10 June session 3) |

| Scene 2 polished obsidian mirror pool | ✅ Upgraded | 02_awakening_core.frag: Replaces simple grid ground overlay with true Fresnel-weighted reflective surface beneath the monolith. Reflected ray marches the monolith SDF — the giant geometry appears upside-down below the horizon in a dark obsidian mirror. Two-frequency vnoise3 beat ripple distorts the surface. Fresnel cos^2.8 falloff: near-perfect mirror at grazing angle, dark when facing up-close camera. Sacred geometry glow footprint bleeds onto the floor beneath the monolith base (exp(-gd²×0.50) × reveal). Expanding beat ring radiates outward from monolith base on each 133 BPM kick. Distance fade exp(-gd×0.18) keeps the reflection contained. Bookends Scene 5 reflective ground and Scene 3 wet street: every fluid surface in the demo now has proper Fresnel physics. "AI awakening stands on a dark mirror of its own reflection." (11 June) |

| Scene 6 portal approach camera path | ✅ Upgraded | 06_impossible_space.frag: Camera now spirals inward toward the main portal throughout the 30-second scene body, building narrative tension before the holy-shit zoom-out at scene_norm 0.80. Phase 1 (0→0.72): orbit radius shrinks from 1.30→0.55 (spiral² easing). Phase 2 (0.50→0.80): camera drifts onto the portal axis — at full pull, camera is ~0.55 units from portal face, looking directly into the recursive universe. At scene_norm 0.80 the reality-fracture flash fires and zoom_out_t() takes over. Audience narrative arc: "exploring impossible rooms → getting close to the portal → about to pass through → reality shatters, it was all a particle." Camera was previously a fixed-radius circular orbit with no scene-norm progression. (11 June) |

| Scene 6 cosmic filament web | ✅ Upgraded | 06_impossible_space.frag `cosmic_particles()`: Replaces single basic G1↔G2 filament with a full 5-segment cosmic web matching real large-scale structure. Three galaxies + two intermediate cluster nodes (N1 between G1↔G2, N2 between G1↔G3). Five filament segments: G1→N1→G2 (two-segment chain), G1→N2→G3 (two-segment), G2→G3 (long spanning void-crosser, wider σ). FBM vnoise density modulation dims filaments in void underdensities (0.50+0.50×noise). Cluster nodes N1/N2 have their own glow halos (exp(-d²×220) × pale violet). Color: dark blue-violet (0.05,0.04,0.14) — visible only as contextual depth, not competing with galaxies. The zoom-out reveal now shows "universes in a cosmic web" not just "three galaxies and some stars". (11 June) |

| Scene 3 FPV camera banking | ✅ Upgraded | renderer.cpp `draw_mesh_scene()`: Camera now uses scene-relative time (st = t - 45s) so the path starts near the city centre and landmarks, not 78 units into the city edge. Per-frame banking via `yaw_rate = dot(cross(fw, fw_next), world_up)` — the camera up-vector tilts into each turn like a real FPV drone (max ±28°, quadratically clamped). At typical 133 BPM-driven oscillation the bank reaches ~12°, peaking to 28° on sharp direction changes. Sells "fast FPV flights through canyons" from design intent with cinematic roll. (11 June) |

| Scene 3 storm sky atmosphere | ✅ Upgraded | post.frag (scene_idx==2, within rain section): Replaces single-hash dim storm gradient with 2-octave bilinear FBM smooth clouds + AI-corruption electric horizon glow + thin energy band at building skyline. FBM: two lattice octaves (cp0 × 1.8/2.2, cp1 × 3.7/4.5, both moving slowly with u_time) bilinear-interpolated — smooth organic cloud shapes vs prior blocky hash. Storm contribution 3.5× brighter than before (vec3(0.010,0.016,0.055) × 2.0–3.2 vs old 0.020×0.18). AI glow: blue-violet horizon wash (horz_h × u_scene_norm) grows as corruption deepens. Energy band: thin exp(-|ctr.y+0.10|×22) cyan streak just above the building skyline, beat-surge ×3 — the AI power-grid overload is visible in the sky. Cloud-lightning: FBM-modulated, flash_id reseeds 2×/s for unique cloud-face illumination, 2.2× brighter peak. Completes the megacity atmosphere: visible stormy sky above + rain below + wet streets + lightning arcs. (11 June) |

| Scene 2→3 crossfade hard cut | ✅ Fixed | renderer.cpp `draw_scene()`: Removed the crossfade overlay for Scene 2→3 (AwakeningCore → CityCorruption). The CityCorruption shader is a mesh fragment shader expecting per-vertex inputs (v_world_pos, v_normal, v_instance_id) that fullscreen.vert cannot supply — the overlay was rendering a broken city-facade pattern over the closing monolith. The bass-drop hard cut at 0:45 is now clean and intentional: Scene 2 renders fully until the scene-flip, then the city mesh takes over with full lighting + particles + post FX. (11 June) |

| Scene 3 AI intelligence orb | ✅ Added | post.frag (scene_idx==2, section 4b-sky): A slowly drifting geometric sphere in the storm sky above the corrupting city — the AI's physical avatar made visible. Two animating concentric expanding rings + bright nucleus core + outer atmospheric halo. Directional energy beam projected downward onto the city grid: narrow vertical column with sinusoidal segmentation, scans across building tops as orb drifts laterally. Beat-reactive core-pulse (1.0+kick×2.2). Gate: scene_norm 0.30→0.86 — appears as corruption intensifies, fades before city data-death exit. Only drawn on dark sky pixels (luminance gate smoothstep 0.14→0.03), never overwriting lit building surfaces. Narrative: the AI has a visible presence above the city it's rewriting — closes the gap between "corruption effects" (lightning, glitch, rain) and "an entity causing them". (11 June session 2) |

| Scene 6 gravitational wave cascade | ✅ Added | post.frag (scene_idx==5, section 4l): At scene_norm 0.795–0.995 (the holy-shit reveal window), 3 LIGO-style gravitational wave rings expand outward from the universe-particle position (UV 0.30,0.20 → ctr -0.20,-0.30). Unlike periodic beat rings (section 4j), these fire ONCE at the moment of revelation. Ring speeds: 1.20/0.78/0.48 (inner fast = blue-shifted, outer slow = red-shifted). Colors: inner electric blue-white → mid amber-gold → outer red-shifted warm; each ring decays individually (exp(-norm_t×4.0 - wi×0.55)). Aspect-correct radial distance from particle position. Effect: the universe-particle's mass discovery sends real spacetime ripples through the cosmic background — physically motivated, cinematically framed. (11 June session 3) |

| Scene 7 big-bang CMB expansion | ✅ Added | post.frag (scene_idx==6, section 8m): At scene_norm 0→0.11 (~3s), 4 concentric rings expand outward from screen centre with a cosmic microwave background thermal-spectrum palette — inner white-blue → outer warm amber. Expansion radius per ring: scene_norm × (1.5 + ci×0.50). Rings compound with the existing UV burst (section 0a big-bang) and bang_flash (section 8b). CMB palette rationale: the universe's first light is thermal radiation cooling from blue-white (hot) to amber (cooling) as it expands — the rings tell the thermodynamic story of the universe's first seconds before the garden emerges. (11 June session 3) |

| Scene 4 temporal streams upgrade | ✅ Upgraded | 04_time_fracture.frag: Replaced basic single-direction `reversed_stream()` with `temporal_streams()` — three simultaneous stream types physically representing the "3 different time offsets": (1) Past: 3 horizontal blue bands flowing rightward (0.28 u/s), sinusoidally wobbled by crystal-shard gravity; (2) Future: 3 horizontal cyan bands flowing leftward (0.52 u/s), reversed/anti-causal; (3) Present: orange radial expanding ring-wavefronts (2 per epicentre) from the 3 crack-line impact points (IMP0/1/2) — the "now" radiating outward from each explosion site. All three types fade in with scene_norm and beat-surge on 133 BPM kicks. Impact positions shared with space_cracks() to tie visual language together. (12 June) |

| Scene 5 obsidian floor energy veins | ✅ Added | 05_geometry_bloom.frag ground plane: Two-frequency vnoise (2.2× + 3.7× scale, slow temporal drift) combined to create organic Lichtenberg-style crack lines in the obsidian base. `abs(fract(combined * 4.0) - 0.5) * 2.0` extracts thin bright zero-crossing lines. Deep violet glow (0.08,0.03,0.40) × smoothstep(0.88,1.0): thin lines, not a general tint. Beat flare: veins surge violet-white on each 133 BPM kick (0.18,0.05,0.90 × 0.20). Both gates on scene_norm and gd_fade so veins only appear as the garden matures and fade at the floor's outer edge. Narrative: the floor was pre-inscribed with sacred mathematics before the flowers arrived — a ritual circle lit by Act III's fractal energy. (12 June) |

| Scene 6 volumetric portal fog | ✅ Added | 06_impossible_space.frag `volumetric_portal_fog()`: 8-step ray-march along each view ray accumulates in-scatter from 3 portal point-lights (inverse-square falloff, clamp 0.25). Portal 1 cyan-blue (0.0,0.48,1.0), Portal 2 violet (0.50,0.04,0.95), Portal 3 teal-cyan (0.04,0.70,0.88). Base density 0.016 × gate × beat_str (beat_str = 1+0.65 on kick). Gate smoothly fades 0.65→0.82 as cosmic zoom-out takes over, so fog is invisible in cosmic phase. Each portal now casts a visible coloured beam of mist through the impossible-space atmosphere — "rooms within light beams" DESIGN doc intent now physically present in the air, not just on wall surfaces. 8 steps ×3 light sources = 24 ops/pixel, well within RTX 3090 budget. (12 June) |

| Scene 3 light arteries | ✅ Added | post.frag (scene_idx==2, section 4c-art): Screen-space regular grid (cell=0.14 units) of electric-blue glowing circuit traces radiating outward from city centre as AI infection spreads. Infection wavefront: per-cell activation `smoothstep(spread×1.65 ± cell_s×2, c_dist)` where spread=scene_norm 0.12→0.82. Per-cell hash `ch` (±0.10) staggers the wavefront for organic look. Thin line SDF (half-width 0.009). Junction nodes at grid intersections glow brighter (2.8× threshold) — power routing hubs. Beat surge: +85% on 133 BPM kick. Active scene_norm 0.12→0.84. Design doc stated "light arteries spread through city grid" — now implemented. Electric-blue (0.04,0.34,1.0) matching AI palette alongside rain/lightning/orb. (12 June) |

| Scene 5 flower/temple shadows on obsidian floor | ✅ Added | 05_geometry_bloom.frag `floor_soft_shadow()`: 16-step penumbra march from floor hit point toward the orbiting overhead magenta key light (matches geometry shading: `normalize(vec3(sin(t)*0.6, 2.0, cos(t)*0.6))`). Uses `sdf_world()` — all flowers, temple octahedra, and stamen rings cast shadow. k=4.5 penumbra parameter gives moderate softness: contact pools tight under geometry, penumbra fans broadly. Shadow minimum 0.06 so energy veins remain faintly visible even in deepest shadow — self-luminous veins glow through dark. Indirect violet tint in shadow pools: `(1-fshad)×vec3(0.010,0.002,0.035)×scene_norm` — indirect bounce scatter from glowing petal geometry above. Shadows sweep dynamically as the key light orbits (0.25 rad/s) and flowers orbit (0.15 rad/s). Effect: Act III now has real contact-shadow drama — dark pools beneath flower geometry, soft violet-tinted penumbra, veins glowing in shadow. (12 June) |

| Scene 4 ice crystal refraction | ✅ Added | 04_time_fracture.frag `render_shards()`: Ice crystal IOR≈1.31 → refract(rd, n, 0.76). Project refracted ray onto camera basis (ri, up, fw) to get screen-space UV: `vec2(dot(refr_d,ri), dot(refr_d,up)) / (rz_v × 1.9)`. Sample `frozen_starfield()` and `frozen_trails()` at refracted UV, tint with crystal material color (cold blue/hot orange/acid cyan) ×1.6. Blend: face-on views show most refraction `(1-fresnel)×0.38×scene_norm`; grazing angles show specular reflection instead. TIR guard: skip if refract() returns zero vector. Effect: crystals now show the background starfield bent through their volume — cold-blue past shards warp the stars blue, hot-orange present shards tint them amber, acid-cyan future shards distort in teal. True glass appearance without expensive second raymarch. (12 June) |

| Scene 6 multiverse reveal — 5 distant universe-particles | ✅ Added | 06_impossible_space.frag: `uni_mini()` helper renders a distant universe-particle at any screen-UV position — bright nucleus + two-arm logarithmic spiral + single slow pulse ring. Five instances placed in the cosmic void at positions (-0.80,-0.55), (-1.30,0.35), (0.95,-0.62), (-0.38,0.68), (1.22,0.20) with unique scales (0.22–0.33) and spiral speeds (0.25–0.45). Gated by `outer_fade × zoom` — only visible during the holy-shit zoom-out window (scene_norm 0.80+). Additionally: 5-segment filament web (`FIL_A/FIL_B` arrays) connects the nearest neighbors with ultra-faint dark-matter strands (exp(-fd²×60) × 0.009 × vec3(0.05,0.04,0.14)) — barely perceptible, reads as large-scale multiverse structure. Together: the zoom-out now reveals not just 3 galaxies + our universe-particle, but a full multiverse tableau — 5+1 universe-particles in a cosmic web, realising the design-doc "recursive universes / worlds within worlds" concept at complete cosmic scale. (12 June session 2) |

| Scene 5 tri-source god rays — amber-gold warmth layer | ✅ Added | 05_geometry_bloom.frag `god_rays()`: Third animated light source `light3` at mid-height (y=1.5, 0.4× time rate, +0.8 phase) complements the existing overhead magenta and low cyan lights. `col3 = vec3(1.0, 0.75, 0.18)` amber-gold, gated in with `smoothstep(0.25, 0.70, scene_norm)` so warm beams emerge as geometry blooms. Tight forward scattering (HG g=0.6) makes amber light form visible directional sun-shafts through fractal geometry. Unshadowed for performance (fill-light read). Light colors also now evolve: magenta→deep violet and cyan→teal over scene_norm. Result: Act III god rays shift from cold magenta+cyan (entry) through warm tricolor (mid bloom) — complements the tendril color arc (amber-gold → cyan → violet) and iridescent petal palette. (13 June) |

| Scene 7 singularity convergence rings | ✅ Added | 07_transcendence.frag: Three inward-spiraling ring phases (gate: scene_norm 0.50→0.875) converge toward screen centre during the vortex window, previewing the SG logo singularity point before the blackout. Ring phases offset by 0.333 each give continuous inward "tightening" motion; radius 1.35→0 as phase sweeps. Beat-boost (exp(-beat×5.5)) pulses rings on each 133 BPM kick. Color arc: blue-violet early (0.50) → violet-magenta late (0.875), matching the finale's tendril palette progression. Additionally: 8-spoke radial starburst (cos^12 × exp(-r×3.5)) points toward the convergence centre — reads as "singularity forming here" narrative moment before the silence/blackout. All gated off at 0.84→0.875 so the black-out and logo reveal stay completely clean. (13 June) |
