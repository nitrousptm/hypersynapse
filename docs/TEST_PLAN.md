# HYPERSYNAPSE — Pre-Submission Test Plan

## Overview
Complete verification procedure before Assembly 2026 submission.

## Environment

**Required Hardware:**
- GPU: RTX 5090 (primary) or RTX 3090 (minimum, 45–55 fps acceptable)
- RAM: 8+ GB
- Storage: ~55 GB for capture temp files (optional)

**Required Software:**
- Windows: Visual Studio 2022 (MSVC C++20), CMake 3.24+, NVIDIA driver (latest)
- Linux/macOS: g++11+, cmake, X11 dev libs, NVIDIA driver
- ffmpeg (for WebM encoding)

## Build Verification

### Step 1: Configure
```powershell
# Windows
cmake -S . -B build -G "Visual Studio 17 2022" -DCMAKE_BUILD_TYPE=Release

# Linux/macOS
cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER=g++-11
```

All FetchContent deps (GLFW 3.4, GLAD 2.0.6, glm 1.0.1, miniaudio 0.11.21) download automatically.

### Step 2: Compile
```powershell
# Windows
cmake --build build --config Release -j

# Linux/macOS
cmake --build build -j $(nproc)
```

**Expected:** Zero errors, zero warnings. Binary at `build/Release/hypersynapse.exe` (Windows) or `build/hypersynapse` (Linux).

### Step 3: Verify Binary
```bash
./build/hypersynapse.exe --help   # should print usage, not crash
```

## Runtime Verification (4:00 / 240 seconds)

Music file: `assets/music/Concrete-Syncope.wav` | 133 BPM | Industrial Ambient Neurobass

### Step 4: Interactive Playback
```bash
./build/hypersynapse
```

**Window & Context:**
- [ ] Window opens at 1920×1080
- [ ] Console: "GL 4.6 Core" (or similar GL version line)
- [ ] No shader compilation errors in console
- [ ] ESC exits cleanly

---

#### Act I — BOOT (0:00–0:45)

**Scene 1 — Black Void Startup (0:00–0:18):**
- [ ] Black void with GPU-style hex grid and debug lines
- [ ] CRT noise / scanlines visible
- [ ] Subtle chromatic aberration
- [ ] Smooth drift camera

**Scene 2 — Awakening Core (0:18–0:45):**
- [ ] Geometric monolith materializes from particles (beat sync at 0:18)
- [ ] Surface vertex displacement / procedural growth
- [ ] Volumetric fog at base
- [ ] Beat-synced particle bursts
- [ ] Monolith "opens" at 0:45 transitioning to Act II

---

#### Act II — INFECTION (0:45–1:45)

**Scene 3 — City Corruption (0:45–1:15):**
- [ ] Instanced brutalist megacity visible (1000+ buildings)
- [ ] Light arteries spreading across facades (electric blue veins)
- [ ] Building geometry warping toward mathematical forms
- [ ] FPV camera canyon flights
- [ ] Window lights flicker on beats (warm→blue palette)

**Scene 4 — Time Fracture (1:15–1:45):**
- [ ] Three simultaneous explosion time-offsets (blue / orange / green)
- [ ] Frozen debris field (near-zero velocity particles)
- [ ] Reversed particle streams (upward flow)
- [ ] Reprojection feedback distortion
- [ ] Portal rings animating
- [ ] Beat-sync "reality shatters" flash

---

#### Act III — ASCENSION (1:45–3:00)

**Scene 5 — Geometry Bloom (1:45–2:30):**
- [ ] Raymarched fractal flowers and SDF temple structures
- [ ] Dual-source volumetric god rays (HG phase function)
- [ ] Geometry pulsing to music (emotional peak)
- [ ] Kaleidoscopic/living light structures
- [ ] Purple/magenta color palette

**Scene 6 — Impossible Space (2:30–3:00) *** SIGNATURE ***:**
- [ ] Non-euclidean space with recursive portal FBOs (3 depth levels)
- [ ] 4D-like rotation effects
- [ ] **HOLY-SHIT MOMENT at ~2:50 (~scene_norm 0.78–0.98):** radial zoom-blur as camera pulls back to reveal the universe is a particle in a larger universe
- [ ] Richer star field visible in portal
- [ ] Smooth frame rate (portal rendering is expensive — RTX 3090 may dip to ~45 fps)

---

#### Act IV — TRANSCENDENCE (3:00–4:00)

**Scene 7 — Singularity Garden (3:00–4:00):**
- [ ] Fractal entire reality: 6-layer starfield + galactic plane (dust + HII regions)
- [ ] Large emission nebula visible
- [ ] GPU instancing: stars, nebulae, geometric structures
- [ ] Silence at ~3:50 (kCueSilence = 230s)
- [ ] Single light pulse → SINGULARITY GARDEN logo (kCueLogo = 232s)
- [ ] Logo: 12 data streams converging as typography, two-layer glow, breathing pulse, separator line + credit dot row
- [ ] Slow pullback to infinite distance

---

#### Global Checks
- [ ] Beat synchronization: particle bursts fire on downbeats throughout
- [ ] Crossfade transitions: ~1.5s blend between every scene boundary
- [ ] No audio sync drift (should stay aligned to 133 BPM throughout)
- [ ] Post FX: ACES tonemapping + dual-layer bloom + lens flare (Acts II–III only) + chromatic aberration + scanlines + grain + vignette

**Console output (every 5s):**
```
[5.0s] FPS: 60.0 | Frame: 16.67 ms | Beat: 11 | Bar: 2
...
```

**FPS expectations:**
- RTX 5090: 60 fps solid
- RTX 3090: 55–60 fps; Scene 6 (recursive portals) may dip to 45–55 fps — acceptable per design

---

### Step 5: Capture Mode
```bash
./build/hypersynapse --capture
```

Frame sequence output: `./captures/frame_000000.ppm` … `frame_014399.ppm`

**Expected terminal output:**
```
[capture] initialized: 1920x1080 → ./captures/
[capture] 0% — frame 0/14400 (0.0s)
[capture] 4% — frame 720/14400 (12.0s)
...
[capture] 100% — frame 14400/14400 (240.0s)
[capture] finished — 14400 frames written to ./captures/
```

**Verification:**
- [ ] Exactly 14,400 frames produced (240s × 60 fps)
- [ ] Progress counter increments every 5s demo-time
- [ ] All PPM files valid (readable with any viewer)
- [ ] No glReadPixels errors in console

### Step 6: WebM Encoding
```bash
ffmpeg -framerate 60 -i ./captures/frame_%06d.ppm \
  -c:v libvpx-vp9 -b:v 10000k -pass 1 -f null /dev/null && \
ffmpeg -framerate 60 -i ./captures/frame_%06d.ppm \
  -c:v libvpx-vp9 -b:v 10000k -pass 2 -y hypersynapse.webm
```

Or use `validate_webm.sh` / `validate_webm.ps1` for automated verification.

**Expected WebM:**
```
Duration: 00:04:00.00
Video: vp9, 1920x1080, 60 fps
File size: ≤ 500 MB
```

**Checklist:**
- [ ] Duration: 240.0 ± 0.5 seconds
- [ ] Resolution: 1920×1080
- [ ] Frame rate: 60 fps
- [ ] Codec: VP9
- [ ] File size ≤ 500 MB
- [ ] Audio present and synchronized

### Step 7: Visual Quality Check
```bash
ffplay hypersynapse.webm   # or vlc
```
- [ ] All 4 acts visually distinct
- [ ] No color banding or clipping
- [ ] No artifacts or corruption
- [ ] Audio perfectly sync'd to visuals

## Performance Targets

| Scene | Duration | RTX 5090 | RTX 3090 (min) |
|-------|----------|-----------|-----------------|
| 1 BootVoid | 18s | 60 fps | 60 fps |
| 2 Awakening | 27s | 60 fps | 55–60 fps |
| 3 City | 30s | 60 fps | 50–60 fps |
| 4 TimeFracture | 30s | 60 fps | 50–60 fps |
| 5 GeometryBloom | 45s | 60 fps | 50–60 fps |
| 6 ImpossibleSpace | 30s | 60 fps | 45–55 fps |
| 7 Transcendence | 60s | 60 fps | 55–60 fps |

## Submission Checklist

- [ ] Binary compiles (no errors, no warnings)
- [ ] Demo runs full 240s (4:00)
- [ ] All 7 scenes render correctly
- [ ] Beat sync verified (133 BPM, particles burst on downbeats)
- [ ] Holy-shit moment fires at ~2:50 (zoom-blur universe reveal)
- [ ] Logo sequence correct at 3:52 (12 data streams, glow, breathing pulse)
- [ ] Capture generates 14,400 frames (240s × 60 fps)
- [ ] WebM encodes: VP9, 1920×1080, 60 fps, ≤ 500 MB
- [ ] SINGULARITY_GARDEN.nfo ready
- [ ] Assembly portal upload complete

## Known Limitations

- Fixed 1920×1080 only (no resolution scaling)
- No interactive controls — deterministic audio-driven playback
- OpenGL 4.6 Core required (no 3.3 fallback)
- Audio: WAV format (mono/stereo, 44.1–48 kHz)
- Scene 6 recursive portals are GPU-heavy: RTX 3090 may hit 45 fps briefly

## Quick Timing Reference

| Cue | Time | Notes |
|-----|------|-------|
| First kick | 0:18 | Scene 1 → 2 transition |
| Bass drop | 0:45 | Act I → II; Scene 2 → 3 |
| Act III start | 1:45 | Scene 4 → 5 |
| Holy-shit | 2:50 | Recursive universe zoom-blur |
| Act IV start | 3:00 | Scene 6 → 7 |
| Silence | 3:50 | Music ends |
| Logo | 3:52 | SINGULARITY GARDEN logo |
| End | 4:00 | Demo complete |

---

*Last updated: 30 May 2026 — corrected to match 133 BPM, 4:00/240s runtime, 7-scene structure, 14,400-frame capture count.*
