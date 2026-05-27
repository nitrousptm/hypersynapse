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

```bash
cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build -j
./build/hypersynapse
```

Dependencies (auto-fetched via CMake FetchContent): GLFW, GLAD, glm, miniaudio.

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
