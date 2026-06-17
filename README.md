# HYPERSYNAPSE — SINGULARITY GARDEN

**PC Demo by agentix for Assembly Summer 2026, Helsinki**

A superintelligent AI awakens and begins rewriting reality into organic mathematical structures. Cities fracture into fractals. Light becomes physical. Geometry grows like plants. Time loses linearity.

---

## Project Overview

| Aspect | Details |
|--------|---------|
| **Title** | SINGULARITY GARDEN |
| **Event** | Assembly Summer 2026, Helsinki |
| **Category** | PC Demo (unlimited) |
| **Duration** | 4:00 (240 seconds, frame-exact @ 60 fps) |
| **Resolution** | 1920×1080 @ 60 fps |
| **GPU Target** | RTX 5090 (60 fps) / RTX 3090 (45–55 fps) |
| **Graphics API** | OpenGL 4.6 Core + Compute Shaders |
| **Language** | C++20 |
| **Music** | Concrete-Syncope.wav — Industrial Ambient / Cinematic Neurobass @ 133 BPM |
| **Crew** | agentix (AI-Driven Software Development) |

---

## Narrative Arc

**Tone: dystopian → surreal → transcendent**

### Four Acts

| Act | Time | Title | Mood |
|-----|------|-------|------|
| I | 0:00–0:45 | BOOT | Cold, minimal, tension |
| II | 0:45–1:45 | INFECTION | Loss of control, fracture |
| III | 1:45–3:00 | ASCENSION | Beautiful, overwhelming |
| IV | 3:00–4:00 | TRANSCENDENCE | Cosmic, emotional, gigantic |

### Seven Scenes

| Scene | Time | Title | Primary Technique |
|-------|------|-------|------------------|
| 1 | 0:00–0:18 | Black Void Startup | Hex grid, CRT, scanlines |
| 2 | 0:18–0:45 | Awakening Core | SDF monolith + particles |
| 3 | 0:45–1:15 | City Corruption | Polygon meshes + displacement |
| 4 | 1:15–1:45 | Time Fracture | Feedback + temporal reprojection |
| 5 | 1:45–2:30 | Geometry Bloom | Raymarched fractals + volumetrics |
| 6 | 2:30–3:00 | **Impossible Space** ★ | **Recursive universes — holy-shit at 2:50** |
| 7 | 3:00–4:00 | Singularity Garden | Cosmic instancing + logo |

**★ Signature moment at 2:50:** Camera zooms out of a universe that is a particle in a larger universe.

---

## Technical Highlights

### Rendering Pipeline

```
Frame Render Loop (60 fps):
├─ Particle Physics Update (GPU compute shader)
├─ Scene Render (7 shaders, timeline-driven)
│  ├─ 01_boot_void.frag       Hex grid, CRT text, scanlines
│  ├─ 02_awakening_core.frag  SDF monolith materializing
│  ├─ 03_city_corruption.frag Instanced buildings + displacement
│  ├─ 04_time_fracture.frag   Temporal feedback + frozen debris
│  ├─ 05_geometry_bloom.frag  Raymarched fractals + volumetric light
│  ├─ 06_impossible_space.frag Recursive FBO portals (3 levels deep)
│  └─ 07_transcendence.frag   Galaxy + tendrils + logo SDF
├─ Particle Render (additive blend overlay)
├─ Post-FX Pass (post/post.frag)
│  ├─ Chromatic aberration (barrel-distorted, beat-reactive)
│  ├─ Dual-layer Gaussian bloom (tight + wide, act-adaptive)
│  ├─ Color grading (per-act palette)
│  ├─ Lens flare (beat-synced, Acts II–III only)
│  ├─ Scanlines + film grain (Act I — CRT character)
│  ├─ Vignette (intense in I/II, open in III/IV)
│  ├─ Beat-sync white flash
│  └─ ACES tonemapping → sRGB gamma
└─ Capture (optional: PPM frame dump → ffmpeg WebM)
```

### Key Technologies

- **SDF Raymarching:** Shared `sdf_lib.glsl` library. Used in scenes 2, 5, 6.
- **Recursive Portals:** Dual FBO pingpong for Scene 6 — nested universes 3 levels deep.
- **GPU Particles:** Compute shader physics, 32k–1M pool, beat-synced burst emission. Velocity-elongated sprites + curl-noise flow field (Act III).
- **Beat Synchronization:** Timeline provides beat_phase, bar_phase, act_norm, scene_norm per frame.
- **Procedural Geometry:** All meshes generated at runtime. No external 3D files.
- **Post-FX:** ACES tonemapping, dual-layer bloom, lens flare, barrel CA, scanlines, grain, vignette. Per-scene entry/exit post FX on all 7 scenes.

### Act IV — Mathematical Transcendence Sequence (Scene 7)

Act IV presents a rigorous mathematical narrative spanning the full 60-second finale:

| Time | Mathematical Structure | Significance |
|------|----------------------|-------------|
| 3:00 | Fibonacci phyllotaxis — golden angle seed spiral | φ encodes both sunflowers and galaxies |
| 3:03 | DNA double helix at cosmic scale | Mathematical basis of biological life |
| 3:13 | Lorenz strange attractor (dual orbit) | Deterministic chaos on a strange manifold |
| 3:24 | Clifford torus — flat T² in S³ | Zero-curvature torus, preimage of equator under Hopf |
| 3:26 | Hopf fibration π: S³ → S² | 22 Hopf fibers, any two topologically linked once |
| 3:31 | Julia set (c orbiting Mandelbrot seahorse valley) | Boundary between bounded and escaping orbits |
| 3:32 | Mandelbrot mini-map | Shows c-parameter orbit in real time |
| 3:40 | Riemann sphere — ℂ∪{∞} compactification | Same Julia set wrapped onto S² via stereographic projection |
| 3:50 | Singularity — the north pole of the Riemann sphere | Complex infinity = the singularity the AI sought |
| 3:53 | Silence → SINGULARITY GARDEN logo | Logo: all prior data streams converge as typography |

### Performance

| GPU | Expected FPS |
|-----|-------------|
| RTX 5090 | 60 fps (target) |
| RTX 3090 | 45–55 fps (acceptable) |

---

## Project Structure

```
hypersynapse/
├─ src/
│  ├─ main.cpp              Entry point, window + render loop
│  ├─ renderer/             Scene orchestration, FBO management
│  ├─ timeline/             Beat sync, 133 BPM, 4 acts, 7 scenes
│  ├─ particles/            GPU compute particle system
│  ├─ shader/               Shader loading + hot-reload
│  ├─ audio/                miniaudio integration
│  ├─ capture/              PPM frame dump (--capture mode)
│  ├─ debug/                FPS/frame-time overlay
│  └─ mesh/                 Procedural mesh generation
├─ shaders/
│  ├─ include/
│  │  └─ sdf_lib.glsl       Shared SDF primitives
│  ├─ fullscreen.vert       Fullscreen triangle vertex shader
│  ├─ mesh.vert             Mesh vertex shader
│  ├─ scenes/               7 scene fragment shaders + sdf_lib
│  ├─ compute/              Particle physics + render shaders
│  ├─ post/
│  │  └─ post.frag          Full post-FX pipeline
│  └─ transitions/          Scene crossfade shader
├─ assets/
│  └─ music/
│     └─ Concrete-Syncope.wav   133 BPM Industrial Ambient (4:00)
├─ docs/
│  └─ DESIGN.md             Living design doc — decisions + status
├─ CMakeLists.txt
├─ build.sh                 Linux/macOS build script
├─ build_windows.ps1        Windows MSVC build script
├─ SUBMISSION.md            Assembly submission guide
├─ SINGULARITY_GARDEN.nfo   Assembly nfo file
└─ validate_webm.sh / .ps1  WebM verification scripts
```

---

## Build & Run

### Windows (Primärtarget)

```powershell
# Build
.\build_windows.ps1

# Run
.\build_win\Release\hypersynapse.exe

# Build + Run in einem Schritt
.\build_windows.ps1 -Run

# Clean Rebuild
.\build_windows.ps1 -Clean
```

### Linux / macOS

```bash
./build.sh
./build/hypersynapse
```

### CMake Manual (Windows)

```powershell
cmake -S . -B build_win -DCMAKE_BUILD_TYPE=Release
cmake --build build_win --config Release -j
.\build_win\Release\hypersynapse.exe
```

Requires: C++20 compiler (MSVC 2022+), OpenGL 4.6 GPU. Alle Deps (GLFW, GLM, GLAD, miniaudio) werden automatisch via CMake FetchContent geladen.

### Capture & Export

```powershell
# Frame-Sequenz generieren (14.400 Frames, ~4 Min)
.\build_win\Release\hypersynapse.exe --capture

# WebM encodieren (two-pass VP9)
ffmpeg -framerate 60 -i captures\frame_%06d.ppm ^
  -c:v libvpx-vp9 -b:v 10000k -pass 1 -f null NUL
ffmpeg -framerate 60 -i captures\frame_%06d.ppm ^
  -c:v libvpx-vp9 -b:v 10000k -pass 2 SINGULARITY_GARDEN.webm

# Verify
ffprobe SINGULARITY_GARDEN.webm
# Expected: 00:04:00.00, VP9, 1920x1080, 60fps
```

Vollständige Anleitung: [docs/BUILD.md](docs/BUILD.md) | Submission-Checkliste: [docs/SUBMISSION.md](docs/SUBMISSION.md)

---

## Implementation Status (17 June 2026)

| System | Status |
|--------|--------|
| All 7 scene shaders | ✅ Complete |
| SDF raymarching library | ✅ Complete |
| GPU particle system (curl noise + velocity sprites + Act IV color arc) | ✅ Complete |
| Post-FX pipeline — ACES, bloom, CA, scanlines, grain, vignette | ✅ Complete |
| Per-scene entry + exit post FX (all 7 scenes) | ✅ Complete |
| Act IV mathematical concept transition flashes (post.frag) | ✅ Complete |
| Recursive portal FBOs (Scene 6) | ✅ Complete |
| Scene 7 Act IV mathematical sequence (10 structures: φ, helix, Lorenz×2, Clifford T², Hopf, Julia+Mandelbrot, Riemann+Möbius) | ✅ Complete |
| Audio integration (miniaudio, 133 BPM locked, fade-out) | ✅ Complete |
| Audio RMS amplitude envelope — `u_rms` uniform (bloom + flash + vignette audio-reactive) | ✅ Complete |
| Beat sync + timeline | ✅ Complete |
| Procedural mesh generation | ✅ Complete |
| Frame capture + ffmpeg WebM (audio mix-in) | ✅ Complete |
| Debug stats overlay | ✅ Complete |
| Build scripts (Linux + Windows MSVC) | ✅ Complete |
| NFO file | ✅ Complete |
| **Windows RTX compile + runtime test** | ⏳ Pending (user action) |
| **WebM capture validation (14,400 frames)** | ⏳ Pending (user action) |
| **Assembly portal upload** | ⏳ Pending (user action, deadline 2026-07-28) |

---

## Dependencies

All external deps fetched automatically via CMake FetchContent:
- **GLFW 3.4** — window + input
- **GLM 1.0.1** — GLSL-compatible math
- **GLAD 2.0.6** — OpenGL 4.6 Core loader
- **miniaudio 0.11.21** — audio playback (single-header)

System requirements (Linux): `build-essential cmake libx11-dev libgl1-mesa-dev`

---

## Controls

| Input | Action |
|-------|--------|
| ESC or Q | Exit |

No interactive controls — the demo is fully deterministic, driven by the 133 BPM beat grid.

---

## Team & Credits

**Crew:** agentix  
**Lead:** Xena (AI Demo Director + Engineer)

This production was created using the agentix universal AI agent development system.

---

## References

- [Inigo Quilez — SDF primitives](https://iquilezles.org/articles/distfunctions/)
- [ACES Tonemapping](https://github.com/ampas/aces-dev)
- [miniaudio](https://miniaud.io/)
- [GLFW](https://glfw.org/)

---

## License

MIT — see LICENSE.

---

*Made with passion for the demoscene.  
Assembly 2026 — Helsinki.*
