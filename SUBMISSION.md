# Assembly 2026 Submission Guide

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
.\build_windows.ps1 -Clean
```

**Acceptance:**
- [ ] CMake configuration completes without errors
- [ ] All FetchContent dependencies download successfully
- [ ] Build produces `.\build\Release\hypersynapse.exe`
- [ ] Binary size reasonable (< 100 MB)
- [ ] No linker warnings (treat as errors)

### Phase 2: Runtime Verification (Interactive)
```powershell
.\build\Release\hypersynapse.exe assets\music.wav
```

**Visual Inspection:**
- [ ] Window opens (1920×1080, fullscreen optional)
- [ ] GL context initialized (check console: "GL 4.6")
- [ ] Act I renders (neural lattice, volumetric glow, particles)
- [ ] Act II renders (procedural city, neon flicker, camera motion)
- [ ] Act III renders (Mandelbox fractal, zoom-collapse, fade-to-black)
- [ ] All transitions smooth (no artifacts, color shifts correct)
- [ ] Audio plays and synchronizes with visuals
- [ ] Runtime is exactly 3:47 (227.6 seconds)
- [ ] FPS stable (55–60 fps, no sudden drops)

**Console Output (every 5 seconds):**
```
[5.0s] FPS: 60.0 | Frame: 16.67 ms | Act: 0 | Beat: 14
[10.0s] FPS: 59.8 | Frame: 16.71 ms | Act: 0 | Beat: 29
...
```

### Phase 3: Capture & Encoding
```powershell
# Generate frame sequence (~8 minutes)
.\build\Release\hypersynapse.exe --capture assets\music.wav

# Expected output:
# [capture] initialized: 1920x1080 → ./captures/
# [capture] frame 000000 written
# [capture] frame 000060 written
# ...
# [capture] finished — 13659 frames written to ./captures/
# [capture] to encode WebM, run:
# ffmpeg -framerate 60 -i ./captures/frame_%06d.ppm ...

# Run the printed ffmpeg command (copy-paste from console output)
ffmpeg -framerate 60 -i .\captures\frame_%06d.ppm ^
  -c:v libvpx-vp9 -b:v 10000k -pass 1 -f null /dev/null && ^
ffmpeg -framerate 60 -i .\captures\frame_%06d.ppm ^
  -c:v libvpx-vp9 -b:v 10000k -pass 2 hypersynapse.webm
```

**Capture Verification:**
- [ ] Capture runs for exactly 227 seconds
- [ ] 13,659 frames generated (227s × 60 fps, no rounding)
- [ ] All PPM files created (frame_000000.ppm → frame_013658.ppm)
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
Duration: 00:03:47.00, start: 0.000000, bitrate: 10000 kb/s
  Stream #0:0: Video: vp9 (Profile 0), 1 video, yuv420p(tv, bt709), 1920x1080, 60 fps, 60 tbr
  Stream #0:1: Audio: ...
```

**Verification Checklist:**
- [ ] Duration: 227.6 ± 0.5 seconds (must be frame-exact)
- [ ] Resolution: 1920×1080 (exactly)
- [ ] Frame rate: 60.0 fps (exactly)
- [ ] Video codec: VP9 (libvpx-vp9)
- [ ] Bitrate: ~10000 kb/s (10 Mbps)
- [ ] Audio present (Stream #0:1, typically Vorbis or similar)
- [ ] Audio synchronized with video (no drift)
- [ ] File size: ≤ 500 MB

### Phase 5: Visual Quality Check
```powershell
vlc hypersynapse.webm
# or
ffplay hypersynapse.webm
```

**Final Inspection:**
- [ ] All three acts visible and distinct
- [ ] Colors accurate (no banding, no clipping)
- [ ] No visual artifacts or encoding corruption
- [ ] Act I: Neural lattice clearly visible, particles burst on beats
- [ ] Act II: City with neon buildings, camera moving, window flickers
- [ ] Act III: Fractal zoom toward center, increasing chaos, fade to black
- [ ] Transitions smooth between all acts
- [ ] Audio perfectly synchronized throughout

### Phase 6: nfo File Preparation
Create `hypersynapse.nfo` in Assembly submission format:

```
[nfo v2]

Title:        hypersynapse
Creator:      agentix
Creator:      Xena (AI Assistant)
Release Year: 2026
Release Date: 2026-05-28

Type:    PC Demo
Bytes:   <FILE_SIZE_IN_BYTES>
Hours:   0
Minutes: 3
Seconds: 47

Platform: Windows, Linux, macOS
Executable: hypersynapse.exe / hypersynapse (binary)
Linked:     OpenGL 4.6 Core
Language:   C++20
Graphics:   GPU-accelerated volumetric raymarching

Comment: 
  AI-driven demoscene production showcasing advanced rendering techniques:
  volumetric raymarching, beat-synchronized procedural effects, and 
  immersive 3D narrative. Three-act structure: neural lattice awakening,
  cyberpunk metropolis, chaotic fractal collapse. Powered by agentix
  AI software development system.

Download: https://github.com/nitrousptm/hypersynapse

```

---

## File Checklist for Submission

### Required Files
- [ ] `hypersynapse.webm` (main submission, ≤ 500 MB)
- [ ] `hypersynapse.nfo` (metadata file)
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
- File: `hypersynapse.webm`
- Title: `hypersynapse`
- Category: `PC Demo`
- Duration: `3:47` (auto-detect from ffprobe)
- Description: (from nfo, 500 chars max)

### 3. Upload nfo
- File: `hypersynapse.nfo`
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
A: 13,659 frames @ 1920×1080 RGB ≈ 360 GB uncompressed.
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
**Q: Audio drifts after 4 minutes**  
A: Check audio.cpp playback timing. This shouldn't happen if music.wav is exactly 480s.
- Verify: `ffprobe assets/music/music.wav` → Duration must be 00:03:47.00 ± 0.01s
- If drift detected, timeline.cpp time() may have rounding errors

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
| Runtime | Interactive playback | 8+ min | Full demo run, visual check |
| Capture | Frame sequence generation | 8+ min | glReadPixels bandwidth-limited |
| Encoding | ffmpeg two-pass VP9 | 30 min | Single-threaded, CPU-intensive |
| Validation | ffprobe + playback | 5 min | Specs check, quality visual |
| **Total** | **All phases** | **~60 min** | Plus time for troubleshooting |

---

## Final Submission Checklist

- [ ] Binary compiles without errors/warnings
- [ ] Demo runs for full 8:00 (480s ± 0.1s)
- [ ] All three acts render correctly
- [ ] Beat synchronization verified (particles burst on downbeats)
- [ ] Audio/video sync verified (no drift)
- [ ] Capture generates 13,659 frames (confirmed frame_013658.ppm exists)
- [ ] ffmpeg encoding completes successfully
- [ ] hypersynapse.webm created (200–400 MB)
- [ ] ffprobe output matches specs (1920×1080, 60 fps, 480s, VP9)
- [ ] VLC/ffplay playback is smooth (no stuttering/corruption)
- [ ] nfo file prepared and correct
- [ ] All files ready for submission
- [ ] Assembly portal accessible (test login)
- [ ] Submission deadline confirmed (28–29 July 2026)

---

**Assembly 2026 Submission Status:** 🚀 Ready  
**Critical Path:** Windows compilation + runtime verification + WebM export  
**Estimated Days to Submission:** 61 (from 28 May to 28 July 2026)

---

*Last updated: 28 May 2026*  
*Submission Guide v1.0 — HYPERSYNAPSE Assembly 2026*
