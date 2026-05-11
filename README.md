# HYPERSYNAPSE

**Assembly 2027 Graphics Demo**

A modern OpenGL graphics demo built for the Assembly 2027 demoscene competition.

## Status

**Phase A: Dashboard Development** (current)

Built with the Agentix multi-agent development methodology.

## Tech Stack

- **Language:** C++20
- **Graphics:** OpenGL 4.6
- **Audio:** Miniaudio
- **Build:** CMake + MSVC (Windows)
- **Music:** AI-generated (Suno/Udio)

## Project Structure

```
hypersynapse/
├── src/              # C++ engine + demo source
│   ├── engine/       # Graphics engine core
│   ├── effects/      # VFX modules
│   └── audio/        # Audio integration
├── shaders/          # GLSL shaders
├── assets/           # Textures, models, music
├── concept/          # Phase 0 design artifacts
├── dashboard/        # Live progress dashboard (Phase A)
│   ├── backend/      # Node.js + Fastify + WebSocket
│   └── frontend/     # React + Vite + Tailwind
├── docs/             # Documentation
└── third_party/      # Vendored dependencies
```

## Dashboard

The development progress is tracked via a live dashboard that shows:
- Current agent activities
- Phase progress
- Token usage per agent
- On-hold control (pause development)

Start dashboard:
```bash
cd dashboard/backend && npm install && npm start
cd dashboard/frontend && npm install && npm run dev
```

Open: http://localhost:5173

## Build (Demo — coming after Phase 0)

```bash
mkdir build && cd build
cmake ..
cmake --build . --config Release
```

## License

Proprietary — All Rights Reserved. See `LICENSE`.
