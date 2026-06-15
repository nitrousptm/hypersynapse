# Assembly 2026 Submission Guide

**Title:** SINGULARITY GARDEN  
**Binary:** hypersynapse  
**Event:** Assembly Summer 2026, Helsinki  
**Submission Deadline:** 28–29 July 2026  
**Category:** PC Demo (unlimited)  
**Crew:** agentix

---

## Pre-Submission Checklist

### Phase 1: Build Verification (Windows)
```powershell
# On RTX 5090 or RTX 3090 machine
cd hypersynapse
.\build_windows.ps1 -Clean -Run
```

**Acceptance:**
- [ ] CMake configuration completes without errors
- [ ] All FetchContent dependencies download successfully
- [ ] Build produces `.\build_win\Release\hypersynapse.exe`
- [ ] Binary size reasonable (< 100 MB)
- [ ] No linker warnings (treat as errors)

### Phase 2: Runtime Verification (Interactive)
```powershell
.\build_win\Release\hypersynapse.exe assets\music\Concrete-Syncope.wav
```

**Visual Inspection:**
- [ ] Window opens (1920×1080, fullscreen optional)
- [ ] GL context initialized (check console: "GL 4.6")
- [ ] Act I — BOOT renders (hex grid, CRT noise, monolith materializes)
- [ ] Act II — INFECTION renders (city corruption, geometry displacement)
- [ ] Act III — ASCENSION renders (raymarched fractals, geometry bloom)
- [ ] Act IV — TRANSCENDENCE renders (cosmic garden, SINGULARITY GARDEN logo)
- [ ] Scene 6 holy-shit zoom-out at 2:50 works (universe-within-universe)
- [ ] All transitions smooth (no artifacts, color shifts correct)
- [ ] Audio plays and synchronizes with visuals at 133 BPM
- [ ] Runtime is exactly 4:00 (240 seconds)
- [ ] FPS stable (55–60 fps on RTX 3090, 60 fps on RTX 5090)

**Console Output (every 5 seconds):**
```
[5.0s]   FPS: 60.0 | 16.67 ms | Act: 0 | Scene: 1 | Beat: 11 | drift: +0ms
[10.0s]  FPS: 59.8 | 16.71 ms | Act: 0 | Scene: 1 | Beat: 22 | drift: +0ms
[45.0s]  FPS: 60.0 | 16.67 ms | Act: 1 | Scene: 3 | Beat: 99 | drift: +0ms
[240.0s] [demo] finished — 240s complete
```
`drift` = audio cursor − wall clock; should remain near 0 ms throughout.

### Phase 3: Capture & Encoding
```powershell
# Generate frame sequence (~4 minutes wall-clock, bandwidth-limited)
# No audio arg needed — defaults to assets\music\Concrete-Syncope.wav for ffmpeg mix-in
.\build_win\Release\hypersynapse.exe --capture

# Expected output:
# [hypersynapse] capture mode enabled
# [capture] initialized: 1920x1080 → ./captures/
# [capture] frame 000000 written
# [capture] frame 000060 written
# ...
# [capture] finished — 14400 frames written to ./captures/
# [capture] to encode WebM, run:
# ffmpeg -framerate 60 -i ./captures/frame_%06d.ppm ...

# Run the printed ffmpeg command (copy-paste from console output)
ffmpeg -framerate 60 -i .\captures\frame_%06d.ppm ^
  -c:v libvpx-vp9 -b:v 10000k -pass 1 -f null NUL && ^
ffmpeg -framerate 60 -i .\captures\frame_%06d.ppm ^
  -c:v libvpx-vp9 -b:v 10000k -pass 2 SINGULARITY_GARDEN.webm
```

**Capture Verification:**
- [ ] Capture runs for exactly 240 seconds (4:00)
- [ ] 14,400 frames generated (240s × 60 fps, exact)
- [ ] All PPM files created (frame_000000.ppm → frame_014399.ppm)
- [ ] No glReadPixels errors
- [ ] Output directory: `./captures/` (no subdirectories)

**WebM Encoding:**
- [ ] ffmpeg completes without errors
- [ ] Two-pass encoding (pass 1 = null output, pass 2 = hypersynapse.webm)
- [ ] Output file size: 200–400 MB (≤ 500 MB required)
- [ ] No ffmpeg warnings or dropped frames

### Phase 4: WebM Validation
```powershell
ffprobe hypersynapse.webm
```

**Expected Output:**
```
Duration: 00:04:00.00, start: 0.000000, bitrate: 10000 kb/s
  Stream #0:0: Video: vp9 (Profile 0), 1 video, yuv420p(tv, bt709), 1920x1080, 60 fps, 60 tbr
```

**Verification Checklist:**
- [ ] Duration: 240.0 ± 0.1 seconds (must be frame-exact)
- [ ] Resolution: 1920×1080 (exactly)
- [ ] Frame rate: 60.0 fps (exactly)
- [ ] Video codec: VP9 (libvpx-vp9)
- [ ] Bitrate: ~10000 kb/s (10 Mbps)
- [ ] File size: ≤ 500 MB

### Phase 5: Visual Quality Check
```powershell
vlc hypersynapse.webm
# or
ffplay hypersynapse.webm
```

**Final Inspection:**
- [ ] All four acts visible and distinct
- [ ] Colors accurate (no banding, no clipping)
- [ ] No visual artifacts or encoding corruption
- [ ] Act I (BOOT 0:00–0:45): Hex grid + CRT, monolith materializes from particles
- [ ] Act II (INFECTION 0:45–1:45): City corruption, geometry displacement
- [ ] Act III (ASCENSION 1:45–3:00): Fractal bloom, recursive portals, holy-shit at 2:50
- [ ] Act IV (TRANSCENDENCE 3:00–4:00): Cosmic garden, silence at 3:50, logo sequence
- [ ] Transitions smooth between all scenes
- [ ] Audio perfectly synchronized throughout at 133 BPM

### Phase 6: nfo File
NFO file already created: `SINGULARITY_GARDEN.nfo`

Verify it contains correct info before upload:
- [ ] Title: SINGULARITY GARDEN
- [ ] Crew: agentix
- [ ] Duration: 4:00 (240 seconds)
- [ ] URL: https://github.com/Xena-AI/hypersynapse

---

## File Checklist for Submission

### Required Files
- [ ] `SINGULARITY_GARDEN.webm` (main submission, ≤ 500 MB)
- [ ] `SINGULARITY_GARDEN.nfo` (metadata file — ✅ created)
- [ ] `hypersynapse.exe` (binary, for verification)

### Optional (Recommended)
- [ ] `README.md` (project overview)
- [ ] `BUILD.md` (build instructions for judges)
- [ ] `docs/DESIGN.md` (creative/technical design)

### Do NOT Submit
- ❌ Source code (optional, not required)
- ❌ Build artifacts/objects
- ❌ PPM frame files (`.captures/` directory)
- ❌ Git history or `.git/` directory

---

## Assembly Portal Upload Steps

### 1. Register/Login
- Go to Assembly 2026 submission portal (URL provided at event)
- Register crew: "agentix"
- Select category: "PC Demo (unlimited)"

### 2. Upload WebM
- File: `SINGULARITY_GARDEN.webm`
- Title: `SINGULARITY GARDEN`
- Category: `PC Demo`
- Duration: `4:00` (auto-detect from ffprobe)
- Description: (from nfo, 500 chars max)

### 3. Upload nfo
- File: `SINGULARITY_GARDEN.nfo`
- Attached to above submission

### 4. Submit for Review
- Check all metadata is correct
- Submit before 23:59 UTC on 28 July 2026
- Note submission ID (for tracking)

### 5. Final Confirmation
- Await Assembly judges' review
- Submission approved/rejected email within 48 hours

---

## Troubleshooting

### Build Issues
**Q: CMake can't find X11 on Windows**  
A: Windows doesn't use X11. If you see this error, you're using Linux configuration. Check BUILD.md for platform-specific steps.

**Q: Build fails with "GLAD_GL_CORE_46 not found"**  
A: Clean and retry:
```powershell
Remove-Item -Recurse build/_deps
cmake --build build --config Release -j
```

### Capture Issues
**Q: Capture mode runs slower than 60 fps**  
A: glReadPixels is bandwidth-limited on older hardware. Options:
- Use faster GPU (RTX 5090)
- Reduce resolution in `src/main.cpp` (kWidth/kHeight)
- Reduce shader iterations (see docs/SCENE_BRIEFS.md)

**Q: PPM files are huge, disk full**  
A: 14,400 frames @ 1920×1080 RGB ≈ 87 GB uncompressed.
Options:
- Use external SSD (recommended)
- Encode directly to WebM without intermediate PPM (requires ffmpeg pipe)
- Use lower resolution for testing

### WebM Encoding Issues
**Q: ffmpeg not found**  
A: Install ffmpeg:
- Windows: `choco install ffmpeg` (if using Chocolatey)
- macOS: `brew install ffmpeg`
- Linux: `sudo apt-get install ffmpeg`

**Q: WebM too large (> 500 MB)**  
A: Reduce bitrate in ffmpeg command:
```powershell
-b:v 8000k  # 8 Mbps instead of 10 Mbps (acceptable trade-off)
```

**Q: Encoding takes forever**  
A: Two-pass VP9 encoding is inherently slow (~30 min on RTX 3090).
Options:
- Use RTX 5090 (faster?)
- Use faster codec (H.264, but less preferred for demos)
- Be patient (encoding happens once)

### Audio/Video Sync
**Q: Audio drifts before 4 minutes**  
A: The timeline clock is locked to the audio cursor (miniaudio PCM position), so wall-clock drift
is eliminated by design. The `drift:` field in console output shows audio-vs-wall-clock skew —
a value within ±5 ms is normal (audio startup buffer latency).
- If drift is large (> 50 ms), verify Concrete-Syncope.wav is exactly 240s:
  `ffprobe assets/music/Concrete-Syncope.wav` → Duration must be 00:04:00.00 ± 0.01s

---

## Performance Optimization (Before Submission)

If FPS is below 55 on target hardware:

### Option 1: Reduce Raymarching Iterations
Edit `src/main.cpp`, adjust uniforms passed to shaders:
```glsl
// In shaders, change iteration counts:
// 01_synapse.frag: change `120` → `100`
// 02_city.frag: change `100` → `80`
// 03_bloom.frag: fixed at 8 (Mandelbox is expensive)
```

### Option 2: Reduce Particle Count
Edit `src/renderer/renderer.cpp`:
```cpp
// Line ~76:
if (!particles_->init(16384)) {  // 16k instead of 32k
```

### Option 3: Lower Resolution (Last Resort)
Edit `src/main.cpp`:
```cpp
constexpr int kWidth = 1600;   // instead of 1920
constexpr int kHeight = 900;    // instead of 1080
```
**Note:** Assembly requires 1920×1080, so only for testing.

---

## Timeline

| Phase | Task | Duration | Notes |
|-------|------|----------|-------|
| Build | Compile (clean) | 5 min | First time may fetch FetchContent deps |
| Runtime | Interactive playback | 4+ min | Full demo run, visual check |
| Capture | Frame sequence generation | 4+ min | glReadPixels bandwidth-limited |
| Encoding | ffmpeg two-pass VP9 | 30 min | Single-threaded, CPU-intensive |
| Validation | ffprobe + playback | 5 min | Specs check, quality visual |
| **Total** | **All phases** | **~60 min** | Plus time for troubleshooting |

---

## Final Submission Checklist

- [ ] Binary compiles without errors/warnings (Windows MSVC)
- [ ] Demo runs for full 4:00 (240s ± 0.1s)
- [ ] All four acts render correctly (BOOT → INFECTION → ASCENSION → TRANSCENDENCE)
- [ ] Beat synchronization verified (particles burst on downbeats @ 133 BPM)
- [ ] Holy-shit moment at 2:50 works (recursive universe zoom-out)
- [ ] Logo sequence at 3:50 (silence → pulse → SINGULARITY GARDEN)
- [ ] Audio/video sync verified (no drift)
- [ ] Capture generates 14,400 frames (confirmed frame_014399.ppm exists)
- [ ] ffmpeg encoding completes successfully (two-pass VP9)
- [ ] SINGULARITY_GARDEN.webm created (200–400 MB)
- [ ] ffprobe output matches specs (1920×1080, 60 fps, 240s, VP9)
- [ ] VLC/ffplay playback is smooth (no stuttering/corruption)
- [ ] SINGULARITY_GARDEN.nfo present and correct ✅
- [ ] All files ready for submission
- [ ] Assembly portal accessible (test login)
- [ ] Submission deadline confirmed (28–29 July 2026)

---

**Assembly 2026 Submission Status:** 🚀 Ready  
**Critical Path:** Windows RTX compilation + runtime verification + WebM export  
**NFO Status:** ✅ SINGULARITY_GARDEN.nfo created  
**Estimated Days to Submission:** 61 (from 28 May to 28 July 2026)

---

*Last updated: 4 June 2026*  
*Submission Guide v1.3 — SINGULARITY GARDEN / HYPERSYNAPSE Assembly 2026*
