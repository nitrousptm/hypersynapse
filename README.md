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
- **GPU Particles:** Compute shader physics, 32k–1M pool, beat-synced burst emission.
- **Beat Synchronization:** Timeline provides beat_phase, bar_phase, act_norm, scene_norm per frame.
- **Procedural Geometry:** All meshes generated at runtime. No external 3D files.
- **Post-FX:** ACES tonemapping, dual-layer bloom, lens flare, barrel CA, scanlines, grain, vignette.

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

### Linux / macOS

```bash
./build.sh
./build/hypersynapse
```

### Windows

```powershell
.\build_windows.ps1
.\build\Release\hypersynapse.exe
```

### CMake Manual

```bash
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
cmake --build build -j
./build/hypersynapse
```

Requires: C++20 compiler, OpenGL 4.6 capable GPU. All other deps (GLFW, GLM, GLAD, miniaudio) are fetched automatically via CMake FetchContent.

### Capture & Export

```bash
# Generate 14,400 frame PPM sequence
./build/hypersynapse --capture

# Encode to VP9 WebM (two-pass, 10 Mbps)
ffmpeg -framerate 60 -i captures/frame_%06d.ppm \
  -c:v libvpx-vp9 -b:v 10000k -pass 1 -f null /dev/null
ffmpeg -framerate 60 -i captures/frame_%06d.ppm \
  -c:v libvpx-vp9 -b:v 10000k -pass 2 SINGULARITY_GARDEN.webm

# Verify
ffprobe SINGULARITY_GARDEN.webm
# Expected: 00:04:00.00, VP9, 1920x1080, 60fps
```

See [BUILD.md](BUILD.md) and [SUBMISSION.md](SUBMISSION.md) for full details.

---

## Implementation Status (28 May 2026)

| System | Status |
|--------|--------|
| All 7 scene shaders | ✅ Complete |
| SDF raymarching library | ✅ Complete |
| GPU particle system | ✅ Complete |
| Post-FX pipeline (ACES, bloom, lens flare, CA, scanlines, grain) | ✅ Complete |
| Recursive portal FBOs (Scene 6) | ✅ Complete |
| Audio integration (miniaudio) | ✅ Complete |
| Beat sync + timeline | ✅ Complete |
| Procedural mesh generation | ✅ Complete |
| Frame capture + ffmpeg WebM | ✅ Complete |
| Debug stats overlay | ✅ Complete |
| Build scripts (Linux + Windows) | ✅ Complete |
| NFO file | ✅ Complete |
| **Windows RTX compile + runtime test** | ⏳ Pending |
| **WebM capture validation (14,400 frames)** | ⏳ Pending |
| **Assembly portal upload** | ⏳ Pending |

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
