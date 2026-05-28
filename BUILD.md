# HYPERSYNAPSE — Build Instructions

## System Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| C++ | C++20 | GCC 11+ or Clang 12+ |
| CMake | 3.24+ | For FetchContent support |
| OpenGL | 4.6 Core | NVIDIA RTX 3090+ / RTX 5090 |
| X11 (Linux) | dev headers | libx11-dev, libxrandr-dev, etc |

## Dependencies

### Linux (Ubuntu/Debian)

```bash
# System packages (required)
sudo apt-get update
sudo apt-get install -y \
  build-essential cmake ninja-build git \
  libx11-dev libxrandr-dev libxinerama-dev libxcursor-dev libxi-dev \
  libgl1-mesa-dev \
  glslang-tools

# Fetched automatically by CMake (FetchContent):
# - GLFW 3.4
# - GLAD (OpenGL loader)
# - glm (math library)
# - miniaudio (audio library)
```

### macOS

```bash
brew install cmake ninja glslang llvm
# Xcode toolchain required (install via App Store)
```

### Windows (MSVC)

1. Install Visual Studio 2022 Community (C++ workload)
2. Install CMake (https://cmake.org)
3. Install Ninja (https://ninja-build.org)
4. Dependencies auto-fetch via CMake

## Build

### Quick Start (Linux/macOS)

```bash
cd hypersynapse
cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build -j

# Run
./build/hypersynapse [audio_track.wav]
```

### Detailed Steps

```bash
# 1. Create build directory
mkdir -p build
cd build

# 2. Configure CMake
cmake .. \
  -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_COMPILER=g++-11

# 3. Compile
cmake --build . -j $(nproc)  # Use all CPU cores

# 4. Run (with optional audio)
cd ..
./build/hypersynapse assets/music.wav

# 5. Capture mode (generate frame sequence for WebM export)
./build/hypersynapse --capture assets/music.wav
# → Outputs frames to ./captures/frame_000000.ppm ... frame_028799.ppm
# → Prints ffmpeg command for WebM encoding
```

## Troubleshooting

### CMake Error: "Could NOT find X11"

**Linux only.** Install X11 development headers:

```bash
sudo apt-get install libx11-dev libxrandr-dev libxinerama-dev \
  libxcursor-dev libxi-dev
```

Then reconfigure:

```bash
rm -rf build && cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
```

### Build fails: "glad_gl_core_46 not found"

GLAD CMake helper may be out of date. Clean and retry:

```bash
rm -rf build/_deps
cmake --build build -j
```

### Compile errors on NVIDIA drivers

Ensure OpenGL 4.6 support. Update GPU drivers:

```bash
# Linux: use your distro's driver manager
# macOS: automatic
# Windows: GeForce Experience or driver website
```

## Performance Notes

### Optimization Flags

Release build automatically enables `-O3 -march=native`.

For aggressive optimization:

```bash
cmake .. -DCMAKE_CXX_FLAGS="-O3 -march=native -flto"
```

### Target Hardware

| GPU | Expected FPS | Notes |
|-----|--------|-------|
| RTX 5090 | 60+ | Max settings, no drops |
| RTX 3090 | 50–60 | Act II may dip to 45fps |
| RTX 3080 | 40–55 | Reduce iteration counts (Act I: 100, Act II: 80, Act III: 6) |

## Capture & Export

### Generate WebM for Assembly Submission

```bash
# 1. Capture 8-minute demo
./build/hypersynapse --capture assets/music.wav

# 2. Encode WebM (two-pass VP9, as suggested by capture output)
ffmpeg -framerate 60 -i captures/frame_%06d.ppm \
  -c:v libvpx-vp9 -b:v 10000k -pass 1 -f null /dev/null && \
ffmpeg -framerate 60 -i captures/frame_%06d.ppm \
  -c:v libvpx-vp9 -b:v 10000k -pass 2 hypersynapse.webm

# 3. Verify output
ffprobe hypersynapse.webm
# Should show: ~480 seconds, VP9 video, 1920x1080, 60 fps
```

## Testing

### Local Playback

```bash
# Play demo with audio
./build/hypersynapse assets/music.wav

# Measure frame time (check consistency for 60fps)
# In-game console would show FPS (not implemented yet)
```

### Unit Tests

None yet. Visual inspection in-engine is the test.

## CI/CD

GitHub Actions CI builds on:
- Linux (GCC 11, latest deps)
- Windows (MSVC 2022)
- macOS (Clang, latest Xcode)

Run locally to match CI:

```bash
# Same as above; CI just runs in GitHub environment
```

## Deployment

### Final Assembly Submission

1. **Build:** `cmake --build build -j && strip build/hypersynapse`
2. **Capture:** `./build/hypersynapse --capture music.wav`
3. **Encode:** `ffmpeg ... → hypersynapse.webm`
4. **Check:** `ffprobe hypersynapse.webm` (verify specs)
5. **Submit:** Upload to Assembly submission portal

**Submission Specs:**
- Duration: 480.0 seconds ± 0.1s
- Format: WebM (VP9 video, Vorbis audio)
- Resolution: 1920×1080 @ 60fps
- File size: ≤ 500 MB recommended
- Metadata: Title, crew, year, contact

---

## FAQ

**Q: Why PPM instead of PNG for capture?**  
A: Zero dependencies. PNG requires libpng; PPM is built-in to ffmpeg + bash utilities.

**Q: Can I build on Windows with GCC?**  
A: MinGW support untested. MSVC 2022 (included in Visual Studio Community) is recommended.

**Q: How do I profile performance?**  
A: Use `perf` (Linux), Instruments (macOS), or PIX (Windows).  
For shader profiling, use NVIDIA Nsight or AMD Radeon GPU Profiler.

**Q: What if I only have RTX 2080?**  
A: Should still work at 30–40fps. Reduce raymarching iterations in shaders:
- `01_synapse.frag`: change `120` → `100` iterations
- `02_city.frag`: change `100` → `80` iterations
- `03_bloom.frag`: 8 iterations fixed (Mandelbox is expensive)

---

*Last updated: 28 May 2026*
