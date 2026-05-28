# HYPERSYNAPSE Test Plan — Pre-Submission Verification

## Overview
This document outlines the comprehensive testing and verification procedure before Assembly 2026 submission.

## Test Environment

**Required Hardware:**
- GPU: RTX 5090 (primary target) or RTX 3090 (minimum)
- RAM: 8+ GB
- Storage: 50+ GB for capture/WebM (optional)

**Required Software:**
- Visual Studio 2022 or equivalent C++20 compiler
- CMake 3.24+
- NVIDIA Driver (latest Game Ready or Studio)
- ffmpeg (for WebM encoding)

## Build Verification

### Step 1: Configure Build
```powershell
# Windows
cd hypersynapse
cmake -S . -B build -G "Visual Studio 17 2022" -DCMAKE_BUILD_TYPE=Release

# Linux/macOS
cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER=g++-11
```

**Expected Result:**
- CMake configuration completes without errors
- All FetchContent downloads (GLFW, GLAD, glm, miniaudio) succeed
- build/ directory created with project files

### Step 2: Compile
```powershell
# Windows
cmake --build build --config Release -j

# Linux/macOS
cmake --build build -j $(nproc)
```

**Expected Result:**
- All .cpp files compile
- No linker errors
- Binary generated: build/Release/hypersynapse.exe (Windows) or build/hypersynapse (Linux/macOS)

### Step 3: Verify Binary
```bash
# Check binary exists and is executable
ls -lh ./build/hypersynapse.exe  # Windows
./build/hypersynapse --help      # Should not crash
```

## Runtime Verification

### Step 4: Demo Playback (Interactive)
```bash
# Requires assets/music.wav (8:00 duration, 174 BPM)
./build/hypersynapse assets/music.wav
```

**Verification Checklist:**
- [ ] Window opens (1920×1080)
- [ ] OpenGL 4.6 Core context initialized (check console: "GL 4.6")
- [ ] No rendering artifacts or shader compilation errors
- [ ] ESC key exits gracefully

**Visual Inspection:**

#### Act I (0:00–2:15)
- [ ] Neural lattice visible (SDF raymarching)
- [ ] Volumetric glow accumulation (blue/cyan tones)
- [ ] Particle burst effects synchronized to beat
- [ ] Smooth beat-sync without visible popping

#### Act II (2:15–5:45)
- [ ] Transition from Act I (smooth crossfade)
- [ ] Procedural city with neon buildings
- [ ] Window flickers on snare hits (beat-reactive)
- [ ] Camera movement through city
- [ ] Colors shift (magenta/cyan → neon green/pink)

#### Act III (5:45–8:00)
- [ ] Transition from Act II (smooth dissolve)
- [ ] Mandelbox fractal zoom toward singularity
- [ ] Increasing visual chaos (grain, scanlines intensify)
- [ ] Fade to black finale
- [ ] Audio synchronized throughout (no sync drift)

**Console Output (every 5 seconds):**
```
[5.0s] FPS: 60.0 | Frame: 16.67 ms | Act: 0 | Beat: 14
[10.0s] FPS: 59.8 | Frame: 16.71 ms | Act: 0 | Beat: 29
...
```

**Expected FPS:**
- RTX 5090: 60.0 fps (no drops)
- RTX 3090: 55–60 fps (acceptable dips in Act II < 5%)

### Step 5: Capture Mode
```bash
# Generate frame sequence
./build/hypersynapse --capture assets/music.wav
# Takes ~8 minutes
# Outputs: ./captures/frame_000000.ppm ... frame_028799.ppm (28,800 frames at 60 fps)
```

**Expected Output:**
```
[capture] initialized: 1920x1080 → ./captures/
[0.0s] FPS: 60.0 | Frame: 16.67 ms | Act: 0 | Beat: 14
...
[capture] frame 000000 written
[capture] frame 000060 written
...
[capture] finished — 28800 frames written to ./captures/
[capture] to encode WebM, run:
ffmpeg -framerate 60 -i ./captures/frame_%06d.ppm ...
```

**Verification:**
- [ ] Capture runs for exactly 480 seconds
- [ ] 28,800 frames generated (480s × 60 fps)
- [ ] PPM files are valid (readable with any image viewer)
- [ ] No glReadPixels errors in console

### Step 6: WebM Encoding
```bash
# Run the printed ffmpeg command (two-pass VP9 encoding)
ffmpeg -framerate 60 -i ./captures/frame_%06d.ppm \
  -c:v libvpx-vp9 -b:v 10000k -pass 1 -f null /dev/null && \
ffmpeg -framerate 60 -i ./captures/frame_%06d.ppm \
  -c:v libvpx-vp9 -b:v 10000k -pass 2 hypersynapse.webm
```

**Expected Output:**
- Two ffmpeg processes complete without errors
- hypersynapse.webm created (typically 200–400 MB)

### Step 7: WebM Verification
```bash
ffprobe hypersynapse.webm
```

**Expected Output:**
```
Duration: 00:08:00.00, start: 0.000000, bitrate: 10000 kb/s
  Stream #0:0: Video: vp9 (Profile 0), 1 video, yuv420p(tv, bt709), 1920x1080, 60 fps, 60 tbr, 1k tbn
  Stream #0:1: Audio: ...
```

**Verification Checklist:**
- [ ] Duration: 480.0 ± 0.1 seconds
- [ ] Resolution: 1920×1080
- [ ] Frame rate: 60 fps
- [ ] Codec: VP9
- [ ] File size: ≤ 500 MB
- [ ] Audio present and synchronized (Stream #0:1)

### Step 8: Visual Quality Check
```bash
# Play locally in any video player
vlc hypersynapse.webm
# or
ffplay hypersynapse.webm
```

**Verification:**
- [ ] All three acts visible and distinct
- [ ] Colors accurate (no banding, clipping)
- [ ] No visual artifacts or corruption
- [ ] Audio perfectly synchronized with visuals
- [ ] Smooth transitions between acts
- [ ] No framedrops or stuttering

## Performance Regression Testing

### Step 9: FPS Stability
Observe console output across all three acts:
- Act I (0–135s): Should maintain 60 fps
- Act II (135–345s): May dip to 50–55 fps on RTX 3090 (acceptable)
- Act III (345–480s): Should recover to 55+ fps

**Acceptance Criteria:**
- Sustained 55+ fps average
- No sudden drops > 10 fps
- No frame rate variance > 5 fps between frames

### Step 10: Memory Stability
While running, monitor system memory:
- Expected peak: < 2 GB (particle buffer + texture cache + framebuffers)
- No memory leaks (memory should plateau after ~2 seconds)

## Submission Checklist

- [ ] Binary compiles successfully (no warnings, no errors)
- [ ] Demo runs for full 480 seconds
- [ ] All three acts render correctly
- [ ] Beat synchronization verified (particles burst on downbeats)
- [ ] Audio/video sync verified (no drift)
- [ ] Capture mode generates 28,800 frames (480s × 60 fps)
- [ ] WebM encodes successfully (VP9, 10 Mbps)
- [ ] WebM validates (1920×1080, 60 fps, 480s, ≤ 500 MB)
- [ ] Visual quality acceptable (no artifacts)
- [ ] FPS stable (55+ fps average, no stutter)
- [ ] nfo file prepared (title, crew, year, contact)
- [ ] Ready for Assembly portal upload

## Known Limitations & Notes

- **Fixed Resolution:** 1920×1080 only (not fullscreen-adaptive)
- **No Interactive Controls:** Deterministic, audio-driven playback
- **GPU Requirement:** OpenGL 4.6 Core (no OpenGL 3.3 fallback)
- **Audio Format:** WAV (mono/stereo, 44.1–48 kHz)

## Troubleshooting

**Capture mode runs slow (< 60 fps):**
- Reduce raymarching iterations in shaders (see BUILD.md FAQ)
- Lower resolution in main.cpp (kWidth, kHeight)

**WebM encoding fails:**
- Ensure ffmpeg is installed and in PATH
- Check disk space (need ~50 GB for PPM temp files + WebM output)

**Audio sync drift observed:**
- Check audio.cpp playback timing
- Verify music.wav duration is exactly 480s

## Timeline

1. **Build Verification:** ~5 minutes
2. **Interactive Testing:** ~10 minutes
3. **Capture Mode:** ~8 minutes (+ ~30 minutes ffmpeg encoding on RTX 3090)
4. **WebM Verification:** ~5 minutes
5. **Total:** ~45 minutes (plus ffmpeg encoding time)

---

Last updated: 28 May 2026
Test Plan v1.0 — HYPERSYNAPSE Assembly Submission
