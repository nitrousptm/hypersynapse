# HYPERSYNAPSE

PC Demo by **agentix** — Assembly Summer 2026, Helsinki.

| | |
|---|---|
| Category | PC Demo (unlimited) |
| Duration | 8:00 |
| Resolution | 1080p @ 60 fps |
| Target | RTX 5090 (max) / RTX 3090 (minimum, framerate may drop) |
| API | OpenGL 4.6 Core + Compute Shaders |
| Language | C++20 |
| Audio | AI-generated Drum & Bass |
| Style | Cyberpunk × Geometric × Abstract |

## Build

### System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get install -y \
  ninja-build \
  libx11-dev libxrandr-dev libxinerama-dev libxcursor-dev libxi-dev \
  libgl1-mesa-dev \
  glslang-tools
```

**macOS:**
```bash
brew install glslang
# Xcode toolchain required
```

### Compile

```bash
cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build -j
./build/hypersynapse [audio_track.wav]
```

Dependencies auto-fetched via CMake FetchContent: GLFW, GLAD, glm, miniaudio.

See [`docs/AUDIO.md`](docs/AUDIO.md) for audio integration details and composition specs.

## Layout

```
src/         C++ runtime: window, renderer, timeline, audio, scenes
shaders/     GLSL — fullscreen.vert + per-scene fragment/compute
assets/      music, textures, captures
docs/        DESIGN, scene-list, timing notes
tools/       offline pipelines (shader-bake, asset-pack)
```

## License

MIT — see `LICENSE`.
